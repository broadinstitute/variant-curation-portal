from django.db.models import Count, F, Q
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import CurationAssignment, Variant


class VariantProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        reference_genome = (
            request.query_params["reference_genome"]
            if "reference_genome" in request.query_params
            else "GRCh37"
        )

        variants = (
            Variant.objects.filter(
                Q(variant_id=kwargs["variant_id"])
                & Q(reference_genome=reference_genome)
                & (
                    Q(project__owners__id__contains=request.user.id)
                    | Q(curation_assignment__curator=request.user)
                )
            )
            .distinct()
            .select_related("project")
        )

        if not variants:
            raise NotFound("Variant not found")

        assignments = set(
            CurationAssignment.objects.filter(
                variant__variant_id=kwargs["variant_id"], curator=request.user
            ).values_list("variant", flat=True)
        )

        project_assignments = {
            p["project"]: {"total": p["total"], "completed": p["completed"]}
            for p in (
                CurationAssignment.objects.filter(variant__variant_id=kwargs["variant_id"])
                .values(project=F("variant__project"))
                .annotate(
                    total=Count("id"),
                    completed=Count("id", filter=Q(result__verdict__isnull=False)),
                )
            )
        }

        projects = []
        for variant in variants:
            is_project_owner = variant.project.owners.filter(id=request.user.id).exists()

            project = {
                "id": variant.project.id,
                "name": variant.project.name,
                "variant_id": variant.id,
                "is_project_owner": is_project_owner,
                "is_variant_curator": variant.id in assignments,
            }

            if is_project_owner:
                project["assignments"] = project_assignments.get(
                    variant.project.id, {"total": 0, "completed": 0}
                )

            projects.append(project)

        return Response({"variant": {"variant_id": kwargs["variant_id"], "projects": projects}})
