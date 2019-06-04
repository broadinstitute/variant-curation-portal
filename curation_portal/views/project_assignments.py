from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Project,
    User,
    Variant,
    VariantAnnotation,
)


class VariantSerializer(serializers.ModelSerializer):
    genes = serializers.SerializerMethodField()

    def get_genes(self, obj):  # pylint: disable=no-self-use
        return set(a.gene_symbol for a in obj.annotations.all())

    class Meta:
        model = Variant
        fields = ("id", "variant_id", "AC", "AN", "AF", "genes")


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurationResult
        fields = "__all__"


class AssignmentSerializer(serializers.ModelSerializer):
    variant = VariantSerializer()
    result = ResultSerializer()

    class Meta:
        model = CurationAssignment
        fields = ("variant", "result")


class NewAssignmentSerializer(serializers.Serializer):
    curator = serializers.CharField(max_length=150)
    variant_id = serializers.CharField(max_length=1000)

    def validate_variant_id(self, value):
        if not Variant.objects.filter(project=self.context["project"], variant_id=value).exists():
            raise serializers.ValidationError("Variant does not exist")

        return value

    def validate(self, attrs):
        if CurationAssignment.objects.filter(
            variant__project=self.context["project"],
            variant__variant_id=attrs["variant_id"],
            curator__username=attrs["curator"],
        ).exists():
            raise serializers.ValidationError("Duplicate assignment")

        return attrs

    def create(self, validated_data):
        curator, _ = User.objects.get_or_create(username=validated_data["curator"])
        variant = Variant.objects.get(
            project=self.context["project"], variant_id=validated_data["variant_id"]
        )
        return CurationAssignment.objects.create(curator=curator, variant=variant)

    def update(self, instance, validated_data):
        raise NotImplementedError


class ProjectSerializer(serializers.ModelSerializer):
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

    def post(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not project.owners.filter(id=request.user.id).exists():
                raise PermissionDenied("You do not have permission to perform this action")

            print(request.data)
            serializer = NewAssignmentSerializer(
                data=request.data["assignments"], context={"project": project}, many=True
            )
            if not serializer.is_valid():
                print(serializer.errors)
                raise ValidationError(serializer.errors)

            try:
                with transaction.atomic():
                    serializer.save()
                    project.save()

                return Response({})
            except IntegrityError:
                raise ValidationError("Integrity error")
