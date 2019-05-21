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
        variant2 = create_variant(project, "1-120-G-A")
        variant3 = create_variant(project, "1-150-C-G")
        variant4 = create_variant(project, "1-200-A-T")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project.owners.set([user1, user2])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user2, variant=variant2)
        CurationAssignment.objects.create(curator=user2, variant=variant3)
        CurationAssignment.objects.create(curator=user3, variant=variant3)
        CurationAssignment.objects.create(curator=user3, variant=variant4)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_project_view_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [
        ("user1@example.com", 200),
        ("user2@example.com", 200),
        ("user3@example.com", 200),
        ("user4@example.com", 403),
    ],
)
def test_project_view_can_only_be_viewed_by_project_owners_or_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/")
    assert response.status_code == expected_status_code


def test_project_view_returns_project_information(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.get("/api/project/1/").json()

    assert response["id"] == 1
    assert response["name"] == "Test Project"

    assert response["owners"] == ["user1@example.com", "user2@example.com"]

    assert response["assignments"] == {
        "user2@example.com": {"total": 3, "completed": 0},
        "user3@example.com": {"total": 2, "completed": 0},
    }

    assert response["variants"] == {"total": 4, "curated": 0}


def test_project_view_returns_limited_information_for_curator(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user3@example.com"))
    response = client.get("/api/project/1/").json()

    assert response == {"id": 1, "name": "Test Project"}
