from django.contrib.auth.middleware import RemoteUserMiddleware


class AuthMiddleware(RemoteUserMiddleware):
    header = "HTTP_AUTHUSER"
