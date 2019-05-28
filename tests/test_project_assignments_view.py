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


def test_project_assignments_list_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/assignments/")
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
def test_project_assignments_list_can_only_be_viewed_by_project_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/assignments/")
    assert response.status_code == expected_status_code


@pytest.mark.parametrize(
    "username,expected_variants",
    [
        ("user1@example.com", []),
        ("user2@example.com", ["1-100-A-G", "1-120-G-A", "1-150-C-G"]),
        ("user3@example.com", ["1-150-C-G", "1-200-A-T"]),
    ],
)
def test_projects_assignments_list_shows_assigned_variants(db_setup, username, expected_variants):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/assignments/").json()
    assigned_variants = [
        assignment["variant"]["variant_id"] for assignment in response["assignments"]
    ]
    assert assigned_variants == expected_variants
