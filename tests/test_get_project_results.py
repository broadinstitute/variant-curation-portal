# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")

        project_owner = User.objects.create(username="project_owner")
        curator_1 = User.objects.create(username="curator_1")
        curator_2 = User.objects.create(username="curator_2")
        other_user = User.objects.create(username="other_user")

        variant_1 = create_variant(project, "1-100-A-G")
        variant_2 = create_variant(project, "1-200-G-A")
        variant_3 = create_variant(project, "1-300-T-C")

        project.owners.set([project_owner])
        CurationAssignment.objects.create(
            curator=curator_1,
            variant=variant_1,
            result=CurationResult.objects.create(verdict="likely_lof"),
        )
        CurationAssignment.objects.create(
            curator=curator_1,
            variant=variant_2,
            result=CurationResult.objects.create(verdict="lof", notes="LoF for sure"),
        )

        CurationAssignment.objects.create(
            curator=curator_2,
            variant=variant_1,
            result=CurationResult.objects.create(verdict="uncertain", should_revisit=True),
        )
        CurationAssignment.objects.create(curator=curator_2, variant=variant_3)

        yield

        project.delete()

        project_owner.delete()
        curator_1.delete()
        curator_2.delete()
        other_user.delete()


def test_get_results_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/results/", format="json")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [("project_owner", 200), ("curator_1", 403), ("other_user", 404)],
)
def test_results_can_only_be_viewed_by_project_owners(db_setup, username, expected_status_code):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/results/", format="json")
    assert response.status_code == expected_status_code


def test_get_results_returns_all_curated_variants(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="project_owner"))
    response = client.get("/api/project/1/results/", format="json").json()

    actual = set(
        (row["variant"]["variant_id"], row["curator"], row["verdict"])
        for row in response["results"]
    )

    expected = set(
        [
            ("1-100-A-G", "curator_1", "likely_lof"),
            ("1-200-G-A", "curator_1", "lof"),
            ("1-100-A-G", "curator_2", "uncertain"),
        ]
    )

    assert actual == expected
