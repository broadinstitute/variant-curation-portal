from django.db.models import Count
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import CurationAssignment, Project


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class ProjectView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            user_is_owner = project.owners.filter(id=request.user.id).exists()
            user_is_curator = request.user.curation_assignments.filter(
                variant__project=project
            ).exists()

            if not (user_is_owner or user_is_curator):
                raise PermissionDenied("You do not have permission to view this page")

            response = ProjectSerializer(project).data

            if user_is_owner:
                response["owners"] = [owner.username for owner in project.owners.all()]

                total_assignments_by_curator = dict(
                    CurationAssignment.objects.filter(variant__project=project)
                    .values_list("curator__username")
                    .annotate(num_assignments=Count("variant"))
                    .all()
                )
                completed_assignments_by_curator = dict(
                    CurationAssignment.objects.filter(
                        variant__project=project, result__verdict__isnull=False
                    )
                    .values_list("curator__username")
                    .annotate(num_assignments=Count("variant"))
                    .all()
                )

                response["assignments"] = {
                    curator: {
                        "total": num_assignments,
                        "completed": completed_assignments_by_curator.get(curator, 0),
                    }
                    for curator, num_assignments in total_assignments_by_curator.items()
                }

                total_variants = project.variants.count()
                num_curated_variants = (
                    CurationAssignment.objects.filter(
                        variant__project=project, result__verdict__isnull=False
                    )
                    .values("variant__variant_id")
                    .distinct()
                    .count()
                )

                response["variants"] = {"total": total_variants, "curated": num_curated_variants}

            return Response(response)
