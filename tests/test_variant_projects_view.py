# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project1 = Project.objects.create(id=1, name="Project #1")
        variant1_p1 = create_variant(project1, "1-100-A-G")  # pylint: disable=unused-variable
        variant2_p1 = create_variant(project1, "1-200-G-A")
        variant3_p1 = create_variant(project1, "1-300-C-T")  # pylint: disable=unused-variable

        project2 = Project.objects.create(id=2, name="Project #2")
        variant1_p2 = create_variant(project2, "1-100-A-G")
        variant2_p2 = create_variant(project2, "1-200-G-A")
        variant3_p2 = create_variant(project2, "1-300-C-T")
        variant4_p2 = create_variant(project2, "1-400-A-T")

        user1 = User.objects.create(username="user1")
        user2 = User.objects.create(username="user2")
        user3 = User.objects.create(username="user3")

        project1.owners.set([user1])
        CurationAssignment.objects.create(curator=user1, variant=variant1_p2)

        CurationAssignment.objects.create(
            curator=user2,
            variant=variant2_p1,
            result=CurationResult.objects.create(verdict="likely_lof"),
        )
        CurationAssignment.objects.create(curator=user2, variant=variant2_p2)
        CurationAssignment.objects.create(curator=user2, variant=variant3_p2)
        CurationAssignment.objects.create(curator=user2, variant=variant4_p2)

        CurationAssignment.objects.create(curator=user3, variant=variant2_p1)
        CurationAssignment.objects.create(curator=user3, variant=variant3_p2)

        yield

        project1.delete()
        project2.delete()

        user1.delete()
        user2.delete()
        user3.delete()


def test_get_variant_projects_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/variant/1-100-A-G/projects/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,variant_id,expected_status_code",
    [
        ("user1", "1-100-A-G", 200),
        ("user2", "1-100-A-G", 404),
        ("user3", "1-100-A-G", 404),
        ("user1", "1-200-G-A", 200),
        ("user2", "1-200-G-A", 200),
        ("user1", "1-400-A-T", 404),
        ("user2", "1-400-A-T", 200),
    ],
)
def test_variant_projects_can_only_be_viewed_by_project_owners_or_curators(
    db_setup, username, variant_id, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/projects/")
    assert response.status_code == expected_status_code


@pytest.mark.parametrize(
    "username,variant_id,expected_projects",
    [
        ("user1", "1-100-A-G", [1, 2]),
        ("user1", "1-200-G-A", [1]),
        ("user2", "1-200-G-A", [1, 2]),
        ("user2", "1-300-C-T", [2]),
    ],
)
def test_get_variant_projects_returns_projects_where_user_has_access_to_variant(
    db_setup, username, variant_id, expected_projects
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/projects/")
    assert response.status_code == 200

    response = response.json()
    project_ids = [project["id"] for project in response["variant"]["projects"]]
    assert project_ids == expected_projects


@pytest.mark.parametrize(
    "username,variant_id,expected_access",
    [
        (
            "user1",
            "1-100-A-G",
            {
                1: {"project_owner": True, "variant_curator": False},
                2: {"project_owner": False, "variant_curator": True},
            },
        ),
        ("user1", "1-200-G-A", {1: {"project_owner": True, "variant_curator": False}}),
        (
            "user2",
            "1-200-G-A",
            {
                1: {"project_owner": False, "variant_curator": True},
                2: {"project_owner": False, "variant_curator": True},
            },
        ),
        ("user2", "1-300-C-T", {2: {"project_owner": False, "variant_curator": True}}),
    ],
)
def test_get_variant_projects_returns_access_level_in_projects(
    db_setup, username, variant_id, expected_access
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/projects/")
    assert response.status_code == 200

    response = response.json()

    for project_id in expected_access.keys():
        project = next(p for p in response["variant"]["projects"] if p["id"] == project_id)

        assert project["is_project_owner"] == expected_access[project_id]["project_owner"]
        assert project["is_variant_curator"] == expected_access[project_id]["variant_curator"]


@pytest.mark.parametrize(
    "username,variant_id,project_id,expected_assignments",
    [
        ("user1", "1-100-A-G", 1, 0),
        ("user1", "1-100-A-G", 2, None),
        ("user1", "1-200-G-A", 1, 2),
        ("user1", "1-300-C-T", 1, 0),
        ("user2", "1-200-G-A", 1, None),
        ("user2", "1-200-G-A", 2, None),
        ("user2", "1-300-C-T", 2, None),
        ("user2", "1-400-A-T", 2, None),
    ],
)
def test_get_variant_projects_shows_total_assignments_in_project_for_project_owners(
    db_setup, username, variant_id, project_id, expected_assignments
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/projects/")
    assert response.status_code == 200

    response = response.json()

    project = next(p for p in response["variant"]["projects"] if p["id"] == project_id)
    if expected_assignments is not None:
        assert project["assignments"]["total"] == expected_assignments
    else:
        assert "assignments" not in project


@pytest.mark.parametrize(
    "username,variant_id,project_id,expected_completed_assignments",
    [
        ("user1", "1-100-A-G", 1, 0),
        ("user1", "1-100-A-G", 2, None),
        ("user1", "1-200-G-A", 1, 1),
        ("user1", "1-300-C-T", 1, 0),
        ("user2", "1-200-G-A", 1, None),
        ("user2", "1-200-G-A", 2, None),
        ("user2", "1-300-C-T", 2, None),
        ("user2", "1-400-A-T", 2, None),
    ],
)
def test_get_variant_projects_shows_completed_assignments_in_project_for_project_owners(
    db_setup, username, variant_id, project_id, expected_completed_assignments
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/projects/")
    assert response.status_code == 200

    response = response.json()

    project = next(p for p in response["variant"]["projects"] if p["id"] == project_id)
    if expected_completed_assignments is not None:
        assert project["assignments"]["completed"] == expected_completed_assignments
    else:
        assert "assignments" not in project
