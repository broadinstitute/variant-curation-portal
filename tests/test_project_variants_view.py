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
        variant2 = create_variant(project, "1-200-G-A")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")

        project.owners.set([user1])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user2, variant=variant2)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()


def test_upload_variants_requires_authentication(db_setup):
    client = APIClient()
    response = client.post("/api/project/1/variants/", [{"variant_id": "1-300-A-G"}], format="json")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [("user1@example.com", 200), ("user2@example.com", 403), ("user3@example.com", 403)],
)
def test_variants_can_only_be_uploaded_by_project_owners(db_setup, username, expected_status_code):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.post("/api/project/1/variants/", [{"variant_id": "1-300-T-G"}], format="json")
    assert response.status_code == expected_status_code


def test_upload_variants_saves_variants(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    project = Project.objects.get(id=1)
    starting_variant_count = project.variants.count()
    response = client.post(
        "/api/project/1/variants/",
        [{"variant_id": "1-500-T-G"}, {"variant_id": "1-600-C-A"}, {"variant_id": "1-700-G-C"}],
        format="json",
    )
    assert response.status_code == 200
    assert project.variants.count() == starting_variant_count + 3


def test_upload_variants_validates_variants(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post(
        "/api/project/1/variants/", [{"variant_id": "1-600-A-T", "AC": "foo"}], format="json"
    )
    assert response.status_code == 400


def test_upload_variants_creates_no_variants_on_integrity_error(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post("/api/project/1/variants/", [{"variant_id": "1-800-C-A"}], format="json")
    assert response.status_code == 200
    project = Project.objects.get(id=1)
    starting_variant_count = project.variants.count()
    response = client.post(
        "/api/project/1/variants/",
        [{"variant_id": "1-900-T-G"}, {"variant_id": "1-1000-A-G"}, {"variant_id": "1-800-C-A"}],
        format="json",
    )

    assert response.status_code == 400
    assert project.variants.count() == starting_variant_count
