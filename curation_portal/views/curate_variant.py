from django.forms import ModelForm
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Sample,
    Variant,
    VariantAnnotation,
    VariantTag,
)


class ResultSerializer(ModelSerializer):
    class Meta:
        model = CurationResult
        exclude = ("id",)


class SampleSerializer(ModelSerializer):
    class Meta:
        model = Sample
        exclude = ("id", "variant")


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
    samples = SampleSerializer(many=True)

    class Meta:
        model = Variant
        exclude = ("project",)


class CurationForm(ModelForm):
    class Meta:
        model = CurationResult
        fields = ["notes", "should_revisit", "verdict"] + [
            f.name for f in CurationResult._meta.get_fields() if f.name.startswith("flag")
        ]


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
                .prefetch_related("variant__annotations", "variant__samples", "variant__tags")
                .get(variant=self.kwargs["variant_id"], variant__project=self.kwargs["project_id"])
            )

            return assignment
        except CurationAssignment.DoesNotExist:
            raise NotFound

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        assignment = self.get_assignment()

        previous_site_variant = (
            request.user.curation_assignments.filter(
                variant__project=assignment.variant.project,
                variant__xpos__lt=assignment.variant.xpos,
            )
            .order_by("variant__xpos", "variant__ref", "variant__alt")
            .reverse()
            .values("variant", "variant__variant_id")
            .first()
        )

        colocated_variants = (
            request.user.curation_assignments.filter(
                variant__project=assignment.variant.project, variant__xpos=assignment.variant.xpos
            )
            .order_by("variant__xpos", "variant__ref", "variant__alt")
            .values("variant", "variant__variant_id")
        )

        next_site_variant = (
            request.user.curation_assignments.filter(
                variant__project=assignment.variant.project,
                variant__xpos__gt=assignment.variant.xpos,
            )
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

        return Response(
            {
                "variant": VariantSerializer(assignment.variant).data,
                "next_variant": serialize_adjacent_variant(next_variant),
                "previous_variant": serialize_adjacent_variant(previous_variant),
                "result": ResultSerializer(assignment.result).data,
            }
        )

    def post(self, request, *args, **kwargs):
        assignment = self.get_assignment()

        if assignment.result:
            result = assignment.result
        else:
            result = CurationResult()

        form = CurationForm(request.data, instance=result)
        try:
            form.save()
            assignment.result = result
            assignment.save()
        except ValueError:
            errors = form.errors.as_json()
            raise ValidationError(errors)
        else:
            return Response({})
