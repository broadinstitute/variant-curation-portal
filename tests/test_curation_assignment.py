# pylint: disable=redefined-outer-name,unused-argument
import pytest

from curation_portal.models import CurationAssignment, CurationResult, Project, User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


def test_deleting_assignment_deletes_result(django_db_setup, django_db_blocker, create_variant):
    with django_db_blocker.unblock():
        project = Project.objects.create(id=1, name="Test Project")
        variant = create_variant(project, "1-100-A-G")
        user = User.objects.create(username="user1@example.com")

        assignment = CurationAssignment.objects.create(curator=user, variant=variant)
        assignment.result = CurationResult.objects.create()

        num_results = CurationResult.objects.count()

        assignment.delete()

        assert CurationResult.objects.count() == num_results - 1

        project.delete()

        user.delete()
