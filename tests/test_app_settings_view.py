# pylint: disable=redefined-outer-name,unused-argument
import pytest
from rest_framework.test import APIClient

from curation_portal.models import User

pytestmark = pytest.mark.django_db  # pylint: disable=invalid-name


@pytest.fixture(scope="module")
def db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        user = User.objects.create(username="user")
        yield
        user.delete()


def test_app_settings_requires_authentication(db_setup):
    client = APIClient()
    response = client.get("/api/settings/")
    assert response.status_code == 403


@pytest.mark.parametrize("sign_out_url", [None, "/sign_out"])
def test_app_settings_returns_configured_sign_out_url(db_setup, settings, sign_out_url):
    settings.CURATION_PORTAL_SIGN_OUT_URL = sign_out_url
    client = APIClient()
    client.force_authenticate(User.objects.get(username="user"))
    response = client.get("/api/settings/").json()
    assert response["settings"]["sign_out_url"] == sign_out_url
