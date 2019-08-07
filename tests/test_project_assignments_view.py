# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")
        variant1 = create_variant(
            project,
            "1-100-A-G",
            annotations=[
                {
                    "consequence": "frameshift_variant",
                    "gene_id": "g1",
                    "gene_symbol": "GENEONE",
                    "transcript_id": "t1",
                }
            ],
        )
        variant2 = create_variant(
            project,
            "1-120-G-A",
            annotations=[
                {
                    "consequence": "stop_gained&frameshift_variant",
                    "gene_id": "g1",
                    "gene_symbol": "GENEONE",
                    "transcript_id": "t1",
                }
            ],
        )
        variant3 = create_variant(
            project,
            "1-150-C-G",
            annotations=[
                {
                    "consequence": "frameshift_variant",
                    "gene_id": "g2",
                    "gene_symbol": "GENETWO",
                    "transcript_id": "t2",
                }
            ],
        )
        variant4 = create_variant(
            project,
            "1-200-A-T",
            annotations=[
                {
                    "consequence": "splice_acceptor_variant",
                    "gene_id": "g3",
                    "gene_symbol": "GENETHREE",
                    "transcript_id": "t3",
                }
            ],
        )

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")
        user4 = User.objects.create(username="user4@example.com")

        project.owners.set([user1, user2])
        assignment1 = CurationAssignment.objects.create(curator=user2, variant=variant1)
        assignment2 = CurationAssignment.objects.create(curator=user2, variant=variant2)
        CurationAssignment.objects.create(curator=user2, variant=variant3)
        CurationAssignment.objects.create(curator=user3, variant=variant3)
        CurationAssignment.objects.create(curator=user3, variant=variant4)

        assignment1.result = CurationResult.objects.create(verdict="lof")
        assignment1.save()

        assignment2.result = CurationResult.objects.create(
            verdict="likely_lof", should_revisit=True
        )
        assignment2.save()

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()
        user4.delete()


def test_project_assignments_list_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/assignments/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [
        ("user1@example.com", 200),
        ("user2@example.com", 200),
        ("user3@example.com", 200),
        ("user4@example.com", 404),
    ],
)
def test_project_assignments_list_can_only_be_viewed_by_project_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/assignments/")
    assert response.status_code == expected_status_code


@pytest.mark.parametrize(
    "username,expected_variants",
    [
        ("user1@example.com", []),
        ("user2@example.com", ["1-100-A-G", "1-120-G-A", "1-150-C-G"]),
        ("user3@example.com", ["1-150-C-G", "1-200-A-T"]),
    ],
)
def test_projects_assignments_list_shows_assigned_variants(db_setup, username, expected_variants):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/assignments/").json()
    assigned_variants = [
        assignment["variant"]["variant_id"] for assignment in response["assignments"]
    ]
    assert assigned_variants == expected_variants


@pytest.mark.parametrize(
    "query,expected_variants",
    [
        ("", ["1-100-A-G", "1-120-G-A", "1-150-C-G"]),
        ("variant__annotation__gene_symbol=GENEONE", ["1-100-A-G", "1-120-G-A"]),
        ("variant__annotation__consequence__contains=stop_gained", ["1-120-G-A"]),
        ("variant__annotation__consequence=splice_acceptor_variant", []),
    ],
)
def test_projects_assignments_list_can_be_filtered_on_variant_annotations(
    db_setup, query, expected_variants
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))
    response = client.get(f"/api/project/1/assignments/?{query}").json()
    assigned_variants = [
        assignment["variant"]["variant_id"] for assignment in response["assignments"]
    ]
    assert assigned_variants == expected_variants


@pytest.mark.parametrize(
    "query,expected_variants",
    [
        ("result__verdict=lof", ["1-100-A-G"]),
        ("result__should_revisit=true", ["1-120-G-A"]),
        ("result__verdict__isnull=true", ["1-150-C-G"]),
    ],
)
def test_projects_assignments_list_can_be_filtered_on_result_fields(
    db_setup, query, expected_variants
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2@example.com"))
    response = client.get(f"/api/project/1/assignments/?{query}").json()
    assigned_variants = [
        assignment["variant"]["variant_id"] for assignment in response["assignments"]
    ]
    assert assigned_variants == expected_variants
