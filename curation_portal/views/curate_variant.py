from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ChoiceField, ModelSerializer
from rest_framework.views import APIView

from curation_portal.filters import AssignmentFilter
from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Variant,
    VariantAnnotation,
    VariantTag,
    FLAG_FIELDS,
)


class VariantAnnotationSerializer(ModelSerializer):
    class Meta:
        model = VariantAnnotation
        exclude = ("id", "variant")


class VariantTagSerializer(ModelSerializer):
    class Meta:
        model = VariantTag
        fields = ("label", "value")


class VariantSerializer(ModelSerializer):
    annotations = VariantAnnotationSerializer(many=True)
    tags = VariantTagSerializer(many=True)

    class Meta:
        model = Variant
        exclude = ("project",)


class CurationResultSerializer(ModelSerializer):
    verdict = ChoiceField(
        ["lof", "likely_lof", "uncertain", "likely_not_lof", "not_lof"],
        required=False,
        allow_null=True,
    )

    class Meta:
        model = CurationResult
        fields = (*FLAG_FIELDS, "notes", "should_revisit", "verdict")


def serialize_adjacent_variant(variant_values):
    if not variant_values:
        return None

    return {"id": variant_values["variant"], "variant_id": variant_values["variant__variant_id"]}


class CurateVariantView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_assignment(self):
        try:
            assignment = (
                self.request.user.curation_assignments.select_related("variant", "result")
                .prefetch_related("variant__annotations", "variant__tags")
                .get(variant=self.kwargs["variant_id"], variant__project=self.kwargs["project_id"])
            )

            return assignment
        except CurationAssignment.DoesNotExist:
            raise NotFound

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        assignment = self.get_assignment()

        filtered_assignments = AssignmentFilter(
            request.GET,
            request.user.curation_assignments.filter(variant__project=assignment.variant.project),
        )

        previous_site_variants = (
            filtered_assignments.qs.filter(variant__xpos__lt=assignment.variant.xpos)
            .order_by("variant__xpos", "variant__ref", "variant__alt")
            .reverse()
            .values("variant", "variant__variant_id")
        )
        num_previous_site_variants = previous_site_variants.count()
        previous_site_variant = previous_site_variants.first()

        colocated_variants = (
            filtered_assignments.qs.filter(variant__xpos=assignment.variant.xpos)
            .order_by("variant__xpos", "variant__ref", "variant__alt")
            .values("variant", "variant__variant_id")
        )

        next_site_variant = (
            filtered_assignments.qs.filter(variant__xpos__gt=assignment.variant.xpos)
            .order_by("variant__xpos", "variant__ref", "variant__alt")
            .values("variant", "variant__variant_id")
            .first()
        )

        surrounding_variants = [previous_site_variant, *colocated_variants, next_site_variant]
        index_in_surrounding_variants = [
            v["variant__variant_id"] if v is not None else None for v in surrounding_variants
        ].index(assignment.variant.variant_id)

        previous_variant = surrounding_variants[index_in_surrounding_variants - 1]
        next_variant = surrounding_variants[index_in_surrounding_variants + 1]

        index = num_previous_site_variants + index_in_surrounding_variants - 1

        return Response(
            {
                "index": index,
                "variant": VariantSerializer(assignment.variant).data,
                "next_variant": serialize_adjacent_variant(next_variant),
                "previous_variant": serialize_adjacent_variant(previous_variant),
                "result": CurationResultSerializer(assignment.result).data,
            }
        )

    def post(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        assignment = self.get_assignment()

        if assignment.result:
            result = assignment.result
        else:
            result = CurationResult()

        serializer = CurationResultSerializer(result, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        assignment.result = result
        assignment.save()

        return Response({})
