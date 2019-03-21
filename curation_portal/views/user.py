from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response(
            {
                "user": {
                    "username": user.username,
                    "permissions": [perm.codename for perm in request.user.user_permissions.all()],
                }
            }
        )
