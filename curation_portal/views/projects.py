from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class AssignedProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        assigned_projects = list(
            request.user.curation_assignments.order_by("-variant__project__created_at")
            .values("variant__project", "variant__project__name")
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
                "projects": sorted(
                    [
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
                    key=lambda p: p["variants_assigned"] - p["variants_curated"],
                    reverse=True,
                )
            }
        )


class OwnedProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        owned_projects = list(
            request.user.owned_projects.order_by("-created_at").values("id", "name").all()
        )

        return Response({"projects": owned_projects})
