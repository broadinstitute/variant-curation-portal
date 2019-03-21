# pylint: disable=redefined-outer-name,unused-argument
import pytest
from django.contrib.auth.models import Permission
from rest_framework.test import APIClient

from curation_portal.models import Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        user1 = User.objects.create_user(username="user1@example.com")
        user1.user_permissions.add(Permission.objects.get(codename="add_project"))
        user2 = User.objects.create_user(username="user2@example.com")

        yield

        user1.delete()
        user2.delete()


def test_create_project_view_requires_authentication(db_setup):
    client = APIClient()
    response = client.post("/api/projects/create/", {"name": "Test Project"})
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code", [("user1@example.com", 200), ("user2@example.com", 403)]
)
def test_create_project_requires_permission(db_setup, username, expected_status_code):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.post("/api/projects/create/", {"name": "Test Project"})
    assert response.status_code == expected_status_code


def test_create_project_validates_request(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post("/api/projects/create/", {"name": ""})
    assert response.status_code == 400


def test_create_project_creates_project(db_setup):
    client = APIClient()
    user = User.objects.get(username="user1@example.com")
    client.force_authenticate(user)
    response = client.post("/api/projects/create/", {"name": "Create Project Test Project"})
    assert response.status_code == 200
    assert Project.objects.filter(name="Create Project Test Project").exists()
    project = Project.objects.get(name="Create Project Test Project")
    assert user in project.owners.all()
