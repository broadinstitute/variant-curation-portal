from django.db.models import Count, F, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class AssignedProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        assigned_projects = (
            request.user.curation_assignments.values(
                project_id=F("variant__project"), project_name=F("variant__project__name")
            )
            .annotate(
                assigned=Count("variant_id"),
                remaining=Count("variant_id", filter=Q(result__verdict__isnull=True)),
            )
            .order_by("-remaining", "-variant__project__created_at")
        )

        return Response(
            {
                "projects": [
                    {
                        "id": project["project_id"],
                        "name": project["project_name"],
                        "variants_assigned": project["assigned"],
                        "variants_curated": project["assigned"] - project["remaining"],
                    }
                    for project in assigned_projects
                ]
            }
        )


class OwnedProjectsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        owned_projects = list(
            request.user.owned_projects.order_by("-created_at").values("id", "name").all()
        )

        return Response({"projects": owned_projects})
