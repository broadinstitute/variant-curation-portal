# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User, Variant

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")
        variant1 = create_variant(project, "1-100-A-G")
        variant2 = create_variant(project, "1-100-A-C")
        variant3 = create_variant(project, "1-100-A-AT")
        variant4 = create_variant(project, "1-100-A-AC")

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project.owners.set([user1])
        CurationAssignment.objects.create(curator=user2, variant=variant1)
        CurationAssignment.objects.create(curator=user2, variant=variant2)
        CurationAssignment.objects.create(curator=user2, variant=variant3)
        CurationAssignment.objects.create(curator=user2, variant=variant4)
        CurationAssignment.objects.create(curator=user3, variant=variant2)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_curate_variant_view_requires_authentication(db_setup):
    client = APIClient()

    variant1 = Variant.objects.get(variant_id="1-100-A-G", project__id=1)

    response = client.get(f"/api/project/1/variant/{variant1.id}/curate/")
    assert response.status_code == 403

    response = client.post(f"/api/project/1/variant/{variant1.id}/curate/", {}, format="json")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [
        ("user1@example.com", 404),
        ("user2@example.com", 200),
        ("user3@example.com", 404),
        ("user4@example.com", 404),
    ],
)
def test_curate_variant_view_can_only_be_viewed_by_variant_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))

    variant1 = Variant.objects.get(variant_id="1-100-A-G", project__id=1)

    response = client.get(f"/api/project/1/variant/{variant1.id}/curate/")
    assert response.status_code == expected_status_code

    response = client.post(f"/api/project/1/variant/{variant1.id}/curate/", {}, format="json")
    assert response.status_code == expected_status_code


def test_curate_variant_stores_result(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))

    variant1 = Variant.objects.get(variant_id="1-100-A-G", project__id=1)

    assert not CurationResult.objects.filter(
        assignment__curator__username="user2@example.com",
        assignment__variant__project=1,
        assignment__variant__variant_id="1-100-A-G",
    ).exists()

    response = client.post(
        f"/api/project/1/variant/{variant1.id}/curate/",
        {"verdict": "lof", "notes": "LoF for sure"},
        format="json",
    )

    assert response.status_code == 200

    assignment = CurationAssignment.objects.get(
        curator__username="user2@example.com", variant__project=1, variant__variant_id="1-100-A-G"
    )

    assert assignment.result
    assert assignment.result.verdict == "lof"
    assert assignment.result.notes == "LoF for sure"


def test_curate_variant_validates_verdict(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))

    variant1 = Variant.objects.get(variant_id="1-100-A-G", project__id=1)

    response = client.post(
        f"/api/project/1/variant/{variant1.id}/curate/",
        {"verdict": "some_invalid_verdict"},
        format="json",
    )
    assert response.status_code == 400


def test_curate_variant_orders_multiallelic_variants(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))

    assigned_variants = [
        a["variant"]["variant_id"]
        for a in client.get("/api/project/1/assignments/").json().get("assignments")
    ]
    assert assigned_variants == ["1-100-A-AC", "1-100-A-AT", "1-100-A-C", "1-100-A-G"]

    variants = [
        ("1-100-A-AC", 0, None, "1-100-A-AT"),
        ("1-100-A-AT", 1, "1-100-A-AC", "1-100-A-C"),
        ("1-100-A-C", 2, "1-100-A-AT", "1-100-A-G"),
        ("1-100-A-G", 3, "1-100-A-C", None),
    ]

    for (
        variant_id,
        expected_index,
        expected_previous_variant_id,
        expected_next_variant_id,
    ) in variants:
        variant = Variant.objects.get(variant_id=variant_id, project__id=1)
        response = client.get(f"/api/project/1/variant/{variant.id}/curate/").json()

        assert response["index"] == expected_index

        if expected_previous_variant_id:
            assert response["previous_variant"]["variant_id"] == expected_previous_variant_id
        else:
            assert response["previous_variant"] is None

        if expected_next_variant_id:
            assert response["next_variant"]["variant_id"] == expected_next_variant_id
        else:
            assert response["next_variant"] is None
