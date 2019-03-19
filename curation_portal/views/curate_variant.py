from django.forms import ModelForm
from django.forms.models import model_to_dict
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import Project, CurationAssignment, CurationResult


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
                .prefetch_related("variant__samples")
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
                    "project": model_to_dict(project, fields=["id", "name"]),
                    "variant": dict(
                        model_to_dict(assignment.variant, exclude=["project"]),
                        samples=[model_to_dict(s) for s in assignment.variant.samples.all()],
                    ),
                    "next_variant": serialize_adjacent_variant(next_variant),
                    "previous_variant": serialize_adjacent_variant(previous_variant),
                    "result": model_to_dict(assignment.result) if assignment.result else None,
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
