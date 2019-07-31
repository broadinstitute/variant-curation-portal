# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project1 = Project.objects.create(name="Project #1")
        variant1 = create_variant(project1, "1-100-A-G")

        project2 = Project.objects.create(name="Project #2")
        variant2 = create_variant(project2, "2-300-C-G")
        variant3 = create_variant(project2, "3-200-G-T")

        project3 = Project.objects.create(name="Project #3")
        variant4 = create_variant(project3, "1-100-T-A")
        variant5 = create_variant(project3, "1-200-C-A")
        variant6 = create_variant(project3, "1-300-G-C")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project1.owners.set([user1, user2])
        project2.owners.set([user1])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user2, variant=variant2)
        CurationAssignment.objects.create(curator=user2, variant=variant3)
        CurationAssignment.objects.create(curator=user2, variant=variant4)
        assignment = CurationAssignment.objects.create(curator=user2, variant=variant5)
        result = CurationResult(verdict="lof")
        result.save()
        assignment.result = result
        assignment.save()
        assignment = CurationAssignment.objects.create(curator=user2, variant=variant6)
        result = CurationResult(verdict="lof")
        result.save()
        assignment.result = result
        assignment.save()

        CurationAssignment.objects.create(curator=user3, variant=variant2)

        yield

        project1.delete()
        project2.delete()
        project3.delete()

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
    owned_projects = [project["name"] for project in response["projects"]]
    assert set(owned_projects) == set(expected_projects)


def test_projects_list_is_sorted_by_creation_time(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.get("/api/projects/").json()
    projects = [project["name"] for project in response["projects"]]
    assert projects == ["Project #2", "Project #1"]


def test_assigned_projects_list_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/assignments/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_projects",
    [
        ("user1@example.com", []),
        ("user2@example.com", ["Project #1", "Project #2", "Project #3"]),
        ("user3@example.com", ["Project #2"]),
        ("user4@example.com", []),
    ],
)
def test_assigned_projects_list_includes_assigned_projects(db_setup, username, expected_projects):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/assignments/").json()
    assigned_projects = [project["name"] for project in response["projects"]]
    assert set(assigned_projects) == set(expected_projects)


@pytest.mark.parametrize(
    "username,expected_assignments",
    [
        ("user2@example.com", {"Project #1": (1, 0), "Project #2": (2, 0), "Project #3": (3, 2)}),
        ("user3@example.com", {"Project #2": (1, 0)}),
    ],
)
def test_assigned_projects_list_includes_number_of_assigned_variants(
    db_setup, username, expected_assignments
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/assignments/").json()
    assignments_by_project = {
        project["name"]: (project["variants_assigned"], project["variants_curated"])
        for project in response["projects"]
    }

    assert assignments_by_project == expected_assignments


def test_assigned_projects_list_is_sorted_by_number_of_incomplete_assignments(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))
    response = client.get("/api/assignments/").json()
    assigned_projects = [project["name"] for project in response["projects"]]
    print(assigned_projects)
    assert assigned_projects == ["Project #2", "Project #3", "Project #1"]
