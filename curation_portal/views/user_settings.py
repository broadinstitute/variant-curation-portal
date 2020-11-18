from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from curation_portal.models import UserSettings
from curation_portal.serializers import UserSettingsSerializer


class UserSettingsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        try:
            settings = request.user.settings
        except UserSettings.DoesNotExist:
            settings = UserSettings()

        response = UserSettingsSerializer(settings).data
        return Response(response)

    def patch(self, request, *args, **kwargs):  # pylint: disable=unused-argument,no-self-use
        try:
            settings = request.user.settings
        except UserSettings.DoesNotExist:
            settings = UserSettings(user=request.user)

        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
