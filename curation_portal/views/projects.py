from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        owned_projects = list(request.user.owned_projects.values("id", "name").all())

        assigned_projects = list(
            request.user.curation_assignments.values("variant__project", "variant__project__name")
            .annotate(num_assignments=Count("variant_id"))
            .all()
        )
        completed_assignments_by_project = {
            result["variant__project"]: result["count"]
            for result in request.user.curation_assignments.filter(result__verdict__isnull=False)
            .values("variant__project", "variant__project__name")
            .annotate(count=Count("variant_id"))
            .all()
        }

        return Response(
            {
                "owned": owned_projects,
                "assigned": [
                    {
                        "id": project["variant__project"],
                        "name": project["variant__project__name"],
                        "variants_assigned": project["num_assignments"],
                        "variants_curated": completed_assignments_by_project.get(
                            project["variant__project"], 0
                        ),
                    }
                    for project in assigned_projects
                ],
            }
        )
