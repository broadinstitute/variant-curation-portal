# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, Project, User, Variant

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
    [("user1@example.com", 200), ("user2@example.com", 403), ("user3@example.com", 404)],
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


def test_upload_variants_saves_annotations(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post(
        "/api/project/1/variants/",
        [
            {
                "variant_id": "2-100-A-T",
                "annotations": [
                    {
                        "consequence": "frameshift_variant",
                        "gene_id": "GENE_1",
                        "gene_symbol": "SOMEGENE",
                        "transcript_id": "TRANSCRIPT_1",
                        "loftee": "HC",
                        "loftee_filter": "some_filter",
                        "loftee_flags": "some_flags",
                    },
                    {
                        "consequence": "synonymous_variant",
                        "gene_id": "GENE_2",
                        "gene_symbol": "SOMEOTHERGENE",
                        "transcript_id": "TRANSCRIPT_2",
                        "loftee": "",
                        "loftee_filter": "",
                        "loftee_flags": "",
                    },
                ],
            }
        ],
        format="json",
    )
    assert response.status_code == 200

    variant = Variant.objects.get(project=1, variant_id="2-100-A-T")

    annotations = list(variant.annotations.all())

    assert len(annotations) == 2

    assert annotations[0].consequence == "frameshift_variant"
    assert annotations[0].gene_id == "GENE_1"
    assert annotations[0].gene_symbol == "SOMEGENE"
    assert annotations[0].transcript_id == "TRANSCRIPT_1"
    assert annotations[0].loftee == "HC"
    assert annotations[0].loftee_filter == "some_filter"
    assert annotations[0].loftee_flags == "some_flags"

    assert annotations[1].consequence == "synonymous_variant"
    assert annotations[1].gene_id == "GENE_2"
    assert annotations[1].gene_symbol == "SOMEOTHERGENE"
    assert annotations[1].transcript_id == "TRANSCRIPT_2"
    assert annotations[1].loftee == ""
    assert annotations[1].loftee_filter == ""
    assert annotations[1].loftee_flags == ""


def test_upload_variants_saves_tags(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post(
        "/api/project/1/variants/",
        [
            {
                "variant_id": "2-200-C-G",
                "tags": [{"label": "tag1", "value": "foo"}, {"label": "tag2", "value": "bar"}],
            }
        ],
        format="json",
    )
    assert response.status_code == 200

    variant = Variant.objects.get(project=1, variant_id="2-200-C-G")

    tags = list(variant.tags.all())

    assert len(tags) == 2

    assert tags[0].label == "tag1"
    assert tags[0].value == "foo"

    assert tags[1].label == "tag2"
    assert tags[1].value == "bar"


def test_upload_variants_validates_variants(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1@example.com"))
    response = client.post(
        "/api/project/1/variants/", [{"variant_id": "1-600-A-T", "AC": "foo"}], format="json"
    )
    assert response.status_code == 400

    response = client.post("/api/project/1/variants/", [{"variant_id": "rs123"}], format="json")
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
