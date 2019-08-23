from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ApplicationSettingsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response({"settings": {"sign_out_url": settings.CURATION_PORTAL_SIGN_OUT_URL}})
