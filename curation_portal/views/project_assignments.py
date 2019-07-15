from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
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


class ProjectAssignmentsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.view_project", project):
            raise NotFound

        return project

    def get(self, request, *args, **kwargs):
        project = self.get_project()

        assignments = list(
            request.user.curation_assignments.filter(variant__project=project)
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

        assignments_serializer = AssignmentSerializer(assignments, many=True)
        return Response({"assignments": assignments_serializer.data})

    def post(self, request, *args, **kwargs):
        project = self.get_project()

        if not request.user.has_perm("curation_portal.change_project", project):
            raise PermissionDenied

        serializer = NewAssignmentSerializer(
            data=request.data["assignments"], context={"project": project}, many=True
        )
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        try:
            with transaction.atomic():
                serializer.save()
                project.save()

            return Response({})
        except IntegrityError:
            raise ValidationError("Integrity error")
