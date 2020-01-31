# pylint: disable=redefined-outer-name,unused-argument
import csv
import re
from io import StringIO

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
            "1-200-G-T",
            annotations=[
                {
                    "consequence": "transcript_ablation",
                    "gene_id": "g2",
                    "gene_symbol": "GENETWO",
                    "transcript_id": "t2",
                },
                {
                    "consequence": "splice_acceptor_variant",
                    "gene_id": "g2",
                    "gene_symbol": "GENETWO",
                    "transcript_id": "t2-1",
                },
                {
                    "consequence": "splice_donor_variant",
                    "gene_id": "g3",
                    "gene_symbol": "GENETHREE",
                    "transcript_id": "t3",
                },
            ],
        )

        user1 = User.objects.create(username="user1@example.com")
        user2 = User.objects.create(username="user2@example.com")
        user3 = User.objects.create(username="user3@example.com")

        project.owners.set([user1])

        CurationAssignment.objects.create(
            curator=user1,
            variant=variant1,
            result=CurationResult.objects.create(verdict="likely_lof"),
        )
        CurationAssignment.objects.create(
            curator=user1,
            variant=variant2,
            result=CurationResult.objects.create(verdict="lof", notes="LoF for sure"),
        )

        CurationAssignment.objects.create(
            curator=user2,
            variant=variant1,
            result=CurationResult.objects.create(verdict="uncertain", should_revisit=True),
        )
        CurationAssignment.objects.create(curator=user2, variant=variant2)

        yield

        project.delete()

        user1.delete()
        user2.delete()
        user3.delete()


def test_export_results_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/project/1/results/export/")
    assert response.status_code == 403


@pytest.mark.parametrize(
    "username,expected_status_code",
    [("user1@example.com", 200), ("user2@example.com", 200), ("user3@example.com", 404)],
)
def test_project_results_can_only_be_exported_by_project_owners_or_curators(
    db_setup, username, expected_status_code
):
    client = APIClient()
    client.force_authenticate(User.objects.get(username=username))
    response = client.get("/api/project/1/results/export/")
    assert response.status_code == expected_status_code


@pytest.fixture(scope="module")
def get_exported_results(db_setup):
    def _get_exported_results(username, query_params=None):
        client = APIClient()
        client.force_authenticate(User.objects.get(username=username))
        response = client.get("/api/project/1/results/export/", query_params)
        reader = csv.DictReader(StringIO(response.content.decode("utf-8")))
        return [row for row in reader]

    return _get_exported_results


@pytest.fixture(scope="module")
def get_export_filename(db_setup):
    def _get_export_filename(username, query_params=None):
        client = APIClient()
        client.force_authenticate(User.objects.get(username=username))
        response = client.get("/api/project/1/results/export/", query_params)
        match = re.match(r"^attachment; filename=\"(.*)\"$", response["Content-Disposition"])
        assert match
        return match.group(1)

    return _get_export_filename


def test_exported_results_includes_only_curated_variants(get_exported_results):
    assert set(
        (row["Variant ID"], row["Curator"]) for row in get_exported_results("user1@example.com")
    ) == set(
        [
            ("1-100-A-G", "user1@example.com"),
            ("1-200-G-T", "user1@example.com"),
            ("1-100-A-G", "user2@example.com"),
        ]
    )


def test_exported_file_contains_project_name(get_export_filename):
    filename = get_export_filename("user1@example.com")
    assert filename == "Test-Project_results.csv"


@pytest.mark.parametrize(
    "filter_username,expected_results",
    [
        (
            "user1@example.com",
            set([("1-100-A-G", "user1@example.com"), ("1-200-G-T", "user1@example.com")]),
        ),
        ("user2@example.com", set([("1-100-A-G", "user2@example.com")])),
    ],
)
def test_exported_results_can_be_filtered_by_curator(
    get_exported_results, filter_username, expected_results
):
    results = set(
        (row["Variant ID"], row["Curator"])
        for row in get_exported_results("user1@example.com", {"curator__username": filter_username})
    )
    assert results == expected_results


@pytest.mark.parametrize("filter_username", ["user1@example.com", "user2@example.com"])
def test_exported_results_filtered_by_curator_filename_contains_curator(
    get_export_filename, filter_username
):
    filename = get_export_filename("user1@example.com", {"curator__username": filter_username})
    assert re.sub(r"@|\.", "-", filter_username) in filename


@pytest.mark.parametrize(
    "variant_id,expected_genes",
    [("1-100-A-G", {"GENEONE"}), ("1-200-G-T", {"GENETWO", "GENETHREE"})],
)
def test_exported_results_contains_gene(get_exported_results, variant_id, expected_genes):
    variant_rows = [
        row for row in get_exported_results("user1@example.com") if row["Variant ID"] == variant_id
    ]
    assert variant_rows

    for row in variant_rows:
        assert set(row["Gene"].split(";")) == expected_genes


def test_results_exported_by_curator_contain_only_curators_results(get_exported_results):
    results = set(
        (row["Variant ID"], row["Curator"]) for row in get_exported_results("user2@example.com")
    )
    assert results == set([("1-100-A-G", "user2@example.com")])


def test_results_exported_by_curator_filename_contains_curator(get_export_filename):
    filename = get_export_filename("user2@example.com")
    assert "user2-example-com" in filename


def test_curators_cannot_filter_exported_results(get_exported_results):
    results = set(
        (row["Variant ID"], row["Curator"])
        for row in get_exported_results(
            "user2@example.com", {"curator_username": "user1@example.com"}
        )
    )
    assert results == set([("1-100-A-G", "user2@example.com")])
