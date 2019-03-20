from django.forms import ModelForm
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Project,
    Sample,
    Variant,
    VariantAnnotation,
)


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


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


class VariantSerializer(ModelSerializer):
    annotations = VariantAnnotationSerializer(many=True)
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

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        variant_id = kwargs["variant_id"]
        try:
            project = Project.objects.get(id=project_id)
            assignment = (
                request.user.curation_assignments.select_related("variant", "result")
                .prefetch_related("variant__annotations", "variant__samples")
                .get(variant=variant_id, variant__project=project_id)
            )
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        except CurationAssignment.DoesNotExist:
            raise PermissionDenied("You do not have permission to view this project")
        else:
            previous_variant = (
                request.user.curation_assignments.filter(
                    variant__project=project_id, variant__xpos__lte=assignment.variant.xpos
                )
                .exclude(variant=variant_id)
                .order_by("variant__xpos", "variant__ref", "variant__alt")
                .reverse()
                .values("variant", "variant__variant_id")
                .first()
            )

            next_variant = (
                request.user.curation_assignments.filter(
                    variant__project=project_id, variant__xpos__gte=assignment.variant.xpos
                )
                .exclude(variant=variant_id)
                .order_by("variant__xpos", "variant__ref", "variant__alt")
                .values("variant", "variant__variant_id")
                .first()
            )

            return Response(
                {
                    "project": ProjectSerializer(project).data,
                    "variant": VariantSerializer(assignment.variant).data,
                    "next_variant": serialize_adjacent_variant(next_variant),
                    "previous_variant": serialize_adjacent_variant(previous_variant),
                    "result": ResultSerializer(assignment.result).data,
                }
            )

    def post(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        variant_id = kwargs["variant_id"]
        try:
            Project.objects.get(id=project_id)
            assignment = request.user.curation_assignments.select_related("result").get(
                variant=variant_id, variant__project=project_id
            )
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        except CurationAssignment.DoesNotExist:
            raise PermissionDenied("You do not have permission to view this project")
        else:
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
