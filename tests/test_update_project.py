# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")
        variant1 = create_variant(project, "1-100-A-G")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project.owners.set([user1, user2])
        CurationAssignment.objects.create(curator=user3, variant=variant1)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_update_project_requires_authentication(db_setup):
    client = APIClient()
    response = client.patch("/api/project/1/", {"name": "Project Foo"}, format="json")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [("user1@example.com", 200), ("user3@example.com", 403), ("user4@example.com", 404)],
)
def test_only_project_owners_can_update_project(db_setup, username, expected_status_code):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.patch("/api/project/1/", {"name": "Project Foo"}, format="json")
    assert response.status_code == expected_status_code


def test_update_project_changes_name(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.patch("/api/project/1/", {"name": "Project Bar"}, format="json")
    assert response.status_code == 200

    response = client.get("/api/project/1/").json()
    assert response["name"] == "Project Bar"
    assert response["owners"] == ["user1@example.com", "user2@example.com"]


def test_update_project_changes_owners(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.patch(
        "/api/project/1/", {"owners": ["user1@example.com", "user3@example.com"]}, format="json"
    )
    assert response.status_code == 200

    response = client.get("/api/project/1/").json()
    assert response["owners"] == ["user1@example.com", "user3@example.com"]


def test_update_project_prevents_removing_all_owners(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.patch("/api/project/1/", {"owners": []}, format="json")
    assert response.status_code == 400


def test_update_project_prevents_removing_self_from_owners(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.patch("/api/project/1/", {"owners": ["user2@example.com"]}, format="json")
    assert response.status_code == 400
