"""
URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
"""

from django.urls import path, register_converter
from django.views.generic import TemplateView

from curation_portal.views.app_settings import ApplicationSettingsView
from curation_portal.views.curate_variant import CurateVariantView
from curation_portal.views.projects import AssignedProjectsView, OwnedProjectsView
from curation_portal.views.project import ProjectView
from curation_portal.views.project_assignments import ProjectAssignmentsView
from curation_portal.views.project_admin import CreateProjectView
from curation_portal.views.project_results import ProjectResultsView
from curation_portal.views.project_results_export import ExportProjectResultsView
from curation_portal.views.project_variants import ProjectVariantsView
from curation_portal.views.user import ProfileView
from curation_portal.views.variant_projects import VariantProjectsView
from curation_portal.views.variant_results import VariantResultsView


class VariantIdConverter:
    regex = r"(\d+|X|Y)[-:]([0-9]+)[-:]([ACGT]+)[-:]([ACGT]+)"

    def to_python(self, value):  # pylint: disable=no-self-use
        return value

    def to_url(self, value):  # pylint: disable=no-self-use
        return value


register_converter(VariantIdConverter, "variant_id")

DEFAULT_TEMPLATE_VIEW = TemplateView.as_view(template_name="default.template.html")

urlpatterns = [
    path("", DEFAULT_TEMPLATE_VIEW, name="home"),
    path("assignments/", DEFAULT_TEMPLATE_VIEW, name="assignments"),
    path("projects/", DEFAULT_TEMPLATE_VIEW, name="projects"),
    path("projects/create/", DEFAULT_TEMPLATE_VIEW, name="create-project"),
    path("project/<int:project_id>/", DEFAULT_TEMPLATE_VIEW, name="project"),
    path("project/<int:project_id>/admin/", DEFAULT_TEMPLATE_VIEW, name="project-admin"),
    path("project/<int:project_id>/edit/", DEFAULT_TEMPLATE_VIEW, name="project-edit"),
    path("project/<int:project_id>/owners/", DEFAULT_TEMPLATE_VIEW, name="project-owners"),
    path("project/<int:project_id>/assign/", DEFAULT_TEMPLATE_VIEW, name="project-assign"),
    path("project/<int:project_id>/variants/", DEFAULT_TEMPLATE_VIEW, name="project-variants"),
    path("project/<int:project_id>/results/", DEFAULT_TEMPLATE_VIEW, name="project-results"),
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
    path("variant/<variant_id:variant_id>/", DEFAULT_TEMPLATE_VIEW, name="variant"),
    path("variant/<variant_id:variant_id>/results/", DEFAULT_TEMPLATE_VIEW, name="variant-results"),
    path("api/settings/", ApplicationSettingsView.as_view(), name="api-app-settings"),
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
    path(
        "api/variant/<variant_id:variant_id>/projects/",
        VariantProjectsView.as_view(),
        name="api-variant-projects",
    ),
    path(
        "api/variant/<variant_id:variant_id>/results/",
        VariantResultsView.as_view(),
        name="api-variant-results",
    ),
]

handler400 = "rest_framework.exceptions.bad_request"  # pylint: disable=invalid-name
handler500 = "rest_framework.exceptions.server_error"  # pylint: disable=invalid-name
