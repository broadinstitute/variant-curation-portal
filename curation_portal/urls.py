"""
URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
"""

from django.urls import path
from django.views.generic import TemplateView

from curation_portal.views.auth import SigninView
from curation_portal.views.curate_variant import CurateVariantView
from curation_portal.views.export_results import ExportProjectResultsView
from curation_portal.views.projects import AssignedProjectsView, OwnedProjectsView
from curation_portal.views.project import ProjectView
from curation_portal.views.project_assignments import ProjectAssignmentsView
from curation_portal.views.project_admin import CreateProjectView
from curation_portal.views.results import ProjectResultsView
from curation_portal.views.user import ProfileView
from curation_portal.views.variants import ProjectVariantsView

DEFAULT_TEMPLATE_VIEW = TemplateView.as_view(template_name="default.template.html")

urlpatterns = [
    path("", DEFAULT_TEMPLATE_VIEW, name="home"),
    path("signin/", SigninView.as_view(), name="signin"),
    path("privacy/", DEFAULT_TEMPLATE_VIEW, name="privacy-policy"),
    path("terms/", DEFAULT_TEMPLATE_VIEW, name="terms"),
    path("assignments/", DEFAULT_TEMPLATE_VIEW, name="assignments"),
    path("projects/", DEFAULT_TEMPLATE_VIEW, name="projects"),
    path("projects/create/", DEFAULT_TEMPLATE_VIEW, name="create-project"),
    path("project/<int:project_id>/", DEFAULT_TEMPLATE_VIEW, name="project"),
    path("project/<int:project_id>/admin/", DEFAULT_TEMPLATE_VIEW, name="project-admin"),
    path("project/<int:project_id>/edit/", DEFAULT_TEMPLATE_VIEW, name="project-edit"),
    path("project/<int:project_id>/owners/", DEFAULT_TEMPLATE_VIEW, name="project-owners"),
    path("project/<int:project_id>/assign/", DEFAULT_TEMPLATE_VIEW, name="project-assign"),
    path("project/<int:project_id>/variants/", DEFAULT_TEMPLATE_VIEW, name="project-variants"),
    path(
        "project/<int:project_id>/results/import/",
        DEFAULT_TEMPLATE_VIEW,
        name="project-import-results",
    ),
    path(
        "project/<int:project_id>/variant/<int:variant_id>/curate/",
        DEFAULT_TEMPLATE_VIEW,
        name="curate-variant",
    ),
    path("api/assignments/", AssignedProjectsView.as_view(), name="api-assignments"),
    path("api/projects/", OwnedProjectsView.as_view(), name="api-projects"),
    path("api/projects/create/", CreateProjectView.as_view(), name="api-create-project"),
    # Individual project routes
    path("api/project/<int:project_id>/", ProjectView.as_view(), name="api-project"),
    path(
        "api/project/<int:project_id>/assignments/",
        ProjectAssignmentsView.as_view(),
        name="api-project-assignments",
    ),
    path(
        "api/project/<int:project_id>/variants/",
        ProjectVariantsView.as_view(),
        name="api-project-variants",
    ),
    path(
        "api/project/<int:project_id>/variant/<int:variant_id>/curate/",
        CurateVariantView.as_view(),
        name="api-curate-variant",
    ),
    path(
        "api/project/<int:project_id>/results/",
        ProjectResultsView.as_view(),
        name="api-project-results",
    ),
    path(
        "api/project/<int:project_id>/results/export/",
        ExportProjectResultsView.as_view(),
        name="api-project-results-export",
    ),
    path("api/profile/", ProfileView.as_view(), name="api-profile"),
]

handler400 = "rest_framework.exceptions.bad_request"  # pylint: disable=invalid-name
handler500 = "rest_framework.exceptions.server_error"  # pylint: disable=invalid-name
