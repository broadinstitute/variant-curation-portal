from django.db.models import Count
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import CurationAssignment, Project
from curation_portal.serializers import ProjectSerializer as EditProjectSerializer


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class ProjectView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.view_project", project):
            raise NotFound
        return project

    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        project = self.get_project()

        response = ProjectSerializer(project).data

        if project.owners.filter(id=request.user.id).exists():
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

    def patch(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        project = self.get_project()

        if not request.user.has_perm("curation_portal.change_project", project):
            raise PermissionDenied

        serializer = EditProjectSerializer(
            project, data=request.data, context={"request": request}, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
