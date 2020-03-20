# pylint: disable=redefined-outer-name,unused-argument
import csv
import io

import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project1 = Project.objects.create(id=1, name="Project #1")
        p1_v1 = create_variant(project1, "1-100-A-G")
        p1_v2 = create_variant(project1, "1-200-G-A")
        p1_v3 = create_variant(project1, "1-300-T-C")

        project2 = Project.objects.create(id=2, name="Project #2")
        p2_v1 = create_variant(project2, "1-100-A-G")
        p2_v2 = create_variant(project2, "1-200-G-A")
        p2_v3 = create_variant(project2, "1-300-T-C")

        user1 = User.objects.create(username="user1")
        user2 = User.objects.create(username="user2")
        user3 = User.objects.create(username="user3")

        project1.owners.set([user1])

        CurationAssignment.objects.create(
            curator=user1, variant=p1_v1, result=CurationResult.objects.create(verdict="lof")
        )

        CurationAssignment.objects.create(
            curator=user2, variant=p1_v1, result=CurationResult.objects.create(verdict="lof")
        )
        CurationAssignment.objects.create(
            curator=user2, variant=p1_v2, result=CurationResult.objects.create(verdict="lof")
        )
        CurationAssignment.objects.create(
            curator=user2, variant=p1_v3, result=CurationResult.objects.create(verdict="lof")
        )

        CurationAssignment.objects.create(
            curator=user2, variant=p2_v1, result=CurationResult.objects.create(verdict="lof")
        )
        CurationAssignment.objects.create(
            curator=user2, variant=p2_v2, result=CurationResult.objects.create(verdict="lof")
        )
        CurationAssignment.objects.create(curator=user2, variant=p2_v3)

        CurationAssignment.objects.create(
            curator=user3, variant=p1_v1, result=CurationResult.objects.create(verdict="lof")
        )
        CurationAssignment.objects.create(
            curator=user3, variant=p1_v2, result=CurationResult.objects.create(verdict="lof")
        )

        yield

        project1.delete()
        project2.delete()

        user1.delete()
        user2.delete()
        user3.delete()


@pytest.fixture(scope="module")
def get_exported_results(db_setup):
    def _get_exported_results(username, variant_id, query_params=None):
        client = APIClient()
        client.force_authenticate(User.objects.get(username=username))
        response = client.get(f"/api/variant/{variant_id}/results/export/", query_params)
        reader = csv.DictReader(io.StringIO(response.content.decode("utf-8")))
        return [row for row in reader]

    return _get_exported_results


def test_export_variant_results_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/variant/1-100-A-G/results/export/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,variant_id,expected_status_code",
    [("user1", "1-100-A-G", 200), ("user2", "1-200-G-A", 200), ("user3", "1-300-T-C", 404)],
)
def test_variant_results_can_only_be_exported_by_project_owners_and_curators(
    db_setup, username, variant_id, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variant/{variant_id}/results/export/")
    assert response.status_code == expected_status_code


@pytest.mark.parametrize(
    "username,variant_id,expected_results",
    [
        (
            "user1",
            "1-100-A-G",
            set([("Project #1", "user1"), ("Project #1", "user2"), ("Project #1", "user3")]),
        ),
        ("user1", "1-200-G-A", set([("Project #1", "user2"), ("Project #1", "user3")])),
        ("user1", "1-300-T-C", set([("Project #1", "user2")])),
    ],
)
def test_exported_variant_results_includes_all_curators_results_for_project_owners(
    db_setup, get_exported_results, username, variant_id, expected_results
):
    results = get_exported_results(username, variant_id)

    results = set((result["Project"], result["Curator"]) for result in results)
    assert results == expected_results


@pytest.mark.parametrize(
    "username,variant_id,expected_results",
    [
        ("user2", "1-100-A-G", set([("Project #1", "user2"), ("Project #2", "user2")])),
        ("user2", "1-200-G-A", set([("Project #1", "user2"), ("Project #2", "user2")])),
        ("user2", "1-300-T-C", set([("Project #1", "user2")])),
        ("user3", "1-100-A-G", set([("Project #1", "user3")])),
        ("user3", "1-200-G-A", set([("Project #1", "user3")])),
    ],
)
def test_exported_variant_results_includes_only_self_results_for_curators(
    db_setup, get_exported_results, username, variant_id, expected_results
):
    results = get_exported_results(username, variant_id)

    results = set((result["Project"], result["Curator"]) for result in results)
    assert results == expected_results
