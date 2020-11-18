# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import User, UserSettings

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        user1 = User.objects.create(username="user1")
        UserSettings.objects.create(
            user=user1, ucsc_username="user1", ucsc_session_name="test_session"
        )

        user2 = User.objects.create(username="user2")

        yield

        user1.delete()
        user2.delete()


def test_user_settings_view_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/profile/settings/")
    assert response.status_code == 403


def test_user_settings_view_returns_default_settings_if_user_has_no_settings(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2"))
    response = client.get("/api/profile/settings/").json()
    assert len(response.keys())


def test_update_settings_requires_authentication(db_setup):
    client = APIClient()
    response = client.patch("/api/profile/settings/", {"ucsc_username": "user1"}, format="json")
    assert response.status_code == 403


def test_update_settings(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user1"))

    response = client.get("/api/profile/settings/").json()
    assert response["ucsc_username"] == "user1"
    assert response["ucsc_session_name"] == "test_session"

    response = client.patch(
        "/api/profile/settings/", {"ucsc_session_name": "a_different_session"}, format="json"
    )
    assert response.status_code == 200

    response = client.get("/api/profile/settings/").json()
    assert response["ucsc_username"] == "user1"
    assert response["ucsc_session_name"] == "a_different_session"


def test_update_settings_creates_settings(db_setup):
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user2"))

    response = client.patch("/api/profile/settings/", {"ucsc_username": "user2"}, format="json")
    assert response.status_code == 200

    response = client.get("/api/profile/settings/").json()
    assert response["ucsc_username"] == "user2"
    assert response["ucsc_session_name"] == None
