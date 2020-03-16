from collections import Counter, defaultdict

from django.db import transaction
from django.db.models import Prefetch
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.filters import AssignmentFilter
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


class NewAssignmentListSerializer(serializers.ListSerializer):  # pylint: disable=abstract-method
    def validate(self, attrs):
        # Check that all curator/variant ID pairs in the list are unique
        assignment_counts = Counter(
            (variant_data["curator"], variant_data["variant_id"]) for variant_data in attrs
        )
        duplicate_assignments = [k for k, v in assignment_counts.items() if v > 1]
        if duplicate_assignments:
            duplicates_by_curator = defaultdict(list)
            for curator, variant_id in duplicate_assignments:
                duplicates_by_curator[curator].append(variant_id)

            raise serializers.ValidationError(
                "Duplicate assignments for "
                + ", ".join(
                    f"{curator} (variants {', '.join(variants)})"
                    for curator, variants in duplicates_by_curator.items()
                )
            )

        return attrs


class NewAssignmentSerializer(serializers.Serializer):
    curator = serializers.CharField(max_length=150)
    variant_id = serializers.CharField(max_length=1000)

    class Meta:
        list_serializer_class = NewAssignmentListSerializer

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

    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        project = self.get_project()

        assignments = (
            request.user.curation_assignments.filter(variant__project=project)
            .select_related("result", "variant")
            .prefetch_related(
                Prefetch(
                    "variant__annotations",
                    queryset=VariantAnnotation.objects.only("gene_symbol", "variant_id", "id"),
                )
            )
            .order_by("variant__xpos", "variant__ref", "variant__alt")
        )

        filtered_assignments = AssignmentFilter(request.GET, queryset=assignments)

        assignments_serializer = AssignmentSerializer(filtered_assignments.qs, many=True)
        return Response({"assignments": assignments_serializer.data})

    def post(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        project = self.get_project()

        if not request.user.has_perm("curation_portal.change_project", project):
            raise PermissionDenied

        serializer = NewAssignmentSerializer(
            data=request.data["assignments"], context={"project": project}, many=True
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            serializer.save()
            project.save()

        return Response({})
