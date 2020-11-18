from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import UserSettings
from curation_portal.serializers import UserSettingsSerializer


class ProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user

        try:
            settings = request.user.settings
        except UserSettings.DoesNotExist:
            settings = UserSettings()

        return Response(
            {
                "user": {
                    "username": user.username,
                    "permissions": [perm.codename for perm in request.user.user_permissions.all()],
                    "settings": UserSettingsSerializer(settings).data,
                }
            }
        )
