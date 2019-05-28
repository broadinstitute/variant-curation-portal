from django.db.models import Prefetch
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Project,
    Variant,
    VariantAnnotation,
)


class VariantSerializer(ModelSerializer):
    genes = SerializerMethodField()

    def get_genes(self, obj):  # pylint: disable=no-self-use
        return set(a.gene_symbol for a in obj.annotations.all())

    class Meta:
        model = Variant
        fields = ("id", "variant_id", "AC", "AN", "AF", "genes")


class ResultSerializer(ModelSerializer):
    class Meta:
        model = CurationResult
        fields = "__all__"


class AssignmentSerializer(ModelSerializer):
    variant = VariantSerializer()
    result = ResultSerializer()

    class Meta:
        model = CurationAssignment
        fields = ("variant", "result")


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class ProjectAssignmentsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
            assignments = list(
                request.user.curation_assignments.filter(variant__project=project_id)
                .select_related("result", "variant")
                .prefetch_related(
                    Prefetch(
                        "variant__annotations",
                        queryset=VariantAnnotation.objects.only("gene_symbol", "variant_id", "id"),
                    )
                )
                .order_by("variant__xpos", "variant__ref", "variant__alt")
                .all()
            )
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not assignments and not project.owners.filter(id=request.user.id).exists():
                raise PermissionDenied("You do not have permission to view this project")

            project_serializer = ProjectSerializer(project)
            assignments_serializer = AssignmentSerializer(assignments, many=True)
            return Response(
                {"project": project_serializer.data, "assignments": assignments_serializer.data}
            )
