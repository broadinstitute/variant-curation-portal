from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import Project
from curation_portal.serializers import VariantSerializer


class ProjectVariantsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.change_project", project):
            if not self.request.user.has_perm("curation_portal.view_project", project):
                raise NotFound

            raise PermissionDenied

        return project

    def post(self, request, *args, **kwargs):
        project = self.get_project()

        serializer = VariantSerializer(data=request.data, context={"project": project}, many=True)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        with transaction.atomic():
            serializer.save()
            project.save()  # Save project to set updated_at timestamp

        return Response({})
