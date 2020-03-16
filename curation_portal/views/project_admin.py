from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import Project


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class CreateProjectView(APIView):
    permission_classes = (IsAuthenticated, DjangoModelPermissions)

    queryset = Project.objects.none()  # required for DjangoModelPermissions

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project = serializer.save(created_by=request.user)
        project.owners.set([request.user])
        return Response(serializer.data)
