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
            project=project, variant_id="1-100-A-G", chrom="1", pos=100, ref="A", alt="G"
        )
        variant2 = Variant.objects.create(
            project=project, variant_id="1-120-G-A", chrom="1", pos=120, ref="G", alt="A"
        )
        variant3 = Variant.objects.create(
            project=project, variant_id="1-150-C-G", chrom="1", pos=150, ref="C", alt="G"
        )
        variant4 = Variant.objects.create(
            project=project, variant_id="1-200-A-T", chrom="1", pos=200, ref="A", alt="T"
        )

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


def test_project_admin_view_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/admin/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [
        ("user1@example.com", 200),
        ("user2@example.com", 200),
        ("user3@example.com", 403),
        ("user4@example.com", 403),
    ],
)
def test_project_admin_view_can_only_be_viewed_by_project_owners(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/admin/")
    assert response.status_code == expected_status_code
