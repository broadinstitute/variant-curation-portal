from django.forms.models import model_to_dict
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import Project


def serialize_assignment(assignment):
    return {
        "variant": model_to_dict(assignment.variant, exclude=["curator", "project"]),
        "result": model_to_dict(assignment.result) if assignment.result else None,
    }


class ProjectAssignmentsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
            assignments = list(
                request.user.curation_assignments.filter(variant__project=project_id)
                .select_related("result", "variant")
                .order_by("variant__xpos", "variant__ref", "variant__alt")
                .all()
            )
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not assignments:
                raise PermissionDenied("You do not have permission to view this project")

            return Response(
                dict(
                    model_to_dict(project, fields=["id", "name"]),
                    assignments=[
                        dict(serialize_assignment(assignment), index=i)
                        for i, assignment in enumerate(assignments)
                    ],
                )
            )
