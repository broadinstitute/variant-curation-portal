from django.contrib.auth.models import Permission
from django.core.management import BaseCommand

from curation_portal.models import User


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("username", help="Username of user to grant permission to")

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(username=options["username"])
        user.user_permissions.add(Permission.objects.get(codename="add_project"))
