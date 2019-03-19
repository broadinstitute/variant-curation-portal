# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, Project, User, Variant

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")
        variant1 = Variant.objects.create(
            id=1, project=project, variant_id="1-100-A-G", chrom="1", pos=100, ref="A", alt="G"
        )
        variant2 = Variant.objects.create(
            id=2, project=project, variant_id="1-100-A-C", chrom="1", pos=100, ref="A", alt="C"
        )

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project.owners.set([user1])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user3, variant=variant2)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_curate_variant_view_requires_authentication(db_setup):
    client = APIClient()

    response = client.get("/api/project/1/variant/1/curate/")
    assert response.status_code == 403

    response = client.post("/api/project/1/variant/1/curate/", {}, format="json")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [
        ("user1@example.com", 403),
        ("user2@example.com", 200),
        ("user3@example.com", 403),
        ("user4@example.com", 403),
    ],
)
def test_curate_variant_view_can_only_be_viewed_by_variant_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))

    response = client.get("/api/project/1/variant/1/curate/")
    assert response.status_code == expected_status_code

    response = client.post("/api/project/1/variant/1/curate/", {}, format="json")
    assert response.status_code == expected_status_code
