# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project1 = Project.objects.create(name="Project #1")
        variant1 = create_variant(project1, "1-100-A-G")

        project2 = Project.objects.create(name="Project #2")
        variant2 = create_variant(project2, "2-300-C-G")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project1.owners.set([user1, user2])
        project2.owners.set([user1])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user3, variant=variant2)

        yield

        project1.delete()
        project2.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_projects_list_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/projects/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_projects",
    [
        ("user1@example.com", ["Project #1", "Project #2"]),
        ("user2@example.com", ["Project #1"]),
        ("user3@example.com", []),
        ("user4@example.com", []),
    ],
)
def test_projects_list_includes_owned_projects(db_setup, username, expected_projects):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/projects/").json()
    owned_projects = [project["name"] for project in response["owned"]]
    assert owned_projects == expected_projects


@pytest.mark.parametrize(
    "username,expected_projects",
    [
        ("user1@example.com", []),
        ("user2@example.com", ["Project #1"]),
        ("user3@example.com", ["Project #2"]),
        ("user4@example.com", []),
    ],
)
def test_projects_list_includes_assigned_projects(db_setup, username, expected_projects):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/projects/").json()
    assigned_projects = [project["name"] for project in response["assigned"]]
    assert assigned_projects == expected_projects
