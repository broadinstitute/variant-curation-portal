# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project1 = Project.objects.create(id=1, name="Project #1")
        variant1_p1 = create_variant(project1, "1-100-A-G")
        variant2_p1 = create_variant(project1, "1-200-G-A")  # pylint: disable=unused-variable
        variant3_p1 = create_variant(project1, "1-300-C-T")  # pylint: disable=unused-variable

        project2 = Project.objects.create(id=2, name="Project #2")
        variant1_p2 = create_variant(project2, "1-100-A-G")
        variant2_p2 = create_variant(project2, "1-200-G-A")
        variant3_p2 = create_variant(project2, "1-300-C-T")  # pylint: disable=unused-variable

        user1 = User.objects.create(username="user1")
        user2 = User.objects.create(username="user2")
        user3 = User.objects.create(username="user3")

        project1.owners.set([user1])

        CurationAssignment.objects.create(curator=user2, variant=variant1_p1)
        CurationAssignment.objects.create(curator=user2, variant=variant1_p2)
        CurationAssignment.objects.create(curator=user2, variant=variant2_p2)

        yield

        project1.delete()
        project2.delete()

        user1.delete()
        user2.delete()
        user3.delete()


def test_get_variants_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/variants/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_variants",
    [
        ("user1", ["1-100-A-G", "1-200-G-A", "1-300-C-T"]),
        ("user2", ["1-100-A-G", "1-200-G-A"]),
        ("user3", []),
    ],
)
def test_get_variants_returns_variants_user_can_access(db_setup, username, expected_variants):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get(f"/api/variants/")
    assert response.status_code == 200
    response = response.json()
    variants = [variant["variant_id"] for variant in response["variants"]]
    assert variants == expected_variants
