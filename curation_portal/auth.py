from django.conf import settings
from django.contrib.auth.middleware import RemoteUserMiddleware


class AuthMiddleware(RemoteUserMiddleware):
    header = settings.CURATION_PORTAL_AUTH_HEADER
