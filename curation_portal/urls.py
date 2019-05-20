"""
URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
"""

from django.urls import path
from django.views.generic import TemplateView

from curation_portal.views.auth import SigninView
from curation_portal.views.curate_variant import CurateVariantView
from curation_portal.views.projects import AssignedProjectsView, OwnedProjectsView
from curation_portal.views.project_assignments import ProjectAssignmentsView
from curation_portal.views.project_admin import (
    CreateProjectView,
    ProjectAdminView,
    ProjectVariantsView,
    DownloadProjectResultsView,
)
from curation_portal.views.user import ProfileView


urlpatterns = [
    path("", TemplateView.as_view(template_name="default.template.html"), name="home"),
    path("signin/", SigninView.as_view(), name="signin"),
    path(
        "privacy/",
        TemplateView.as_view(template_name="default.template.html"),
        name="privacy-policy",
    ),
    path("terms/", TemplateView.as_view(template_name="default.template.html"), name="terms"),
    path(
        "assignments/",
        TemplateView.as_view(template_name="default.template.html"),
        name="assignments",
    ),
    path("projects/", TemplateView.as_view(template_name="default.template.html"), name="projects"),
    path(
        "projects/create/",
        TemplateView.as_view(template_name="default.template.html"),
        name="create-project",
    ),
    path(
        "project/<int:project_id>/assignments/",
        TemplateView.as_view(template_name="default.template.html"),
        name="project-assignments",
    ),
    path(
        "project/<int:project_id>/variants/",
        TemplateView.as_view(template_name="default.template.html"),
        name="project-variants",
    ),
    path(
        "project/<int:project_id>/variant/<int:variant_id>/curate/",
        TemplateView.as_view(template_name="default.template.html"),
        name="curate-variant",
    ),
    path(
        "project/<int:project_id>/admin/",
        TemplateView.as_view(template_name="default.template.html"),
        name="project-admin",
    ),
    path("api/assignments/", AssignedProjectsView.as_view(), name="api-assignments"),
    path("api/projects/", OwnedProjectsView.as_view(), name="api-projects"),
    path("api/projects/create/", CreateProjectView.as_view(), name="api-create-project"),
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
        "api/project/<int:project_id>/admin/", ProjectAdminView.as_view(), name="api-project-admin"
    ),
    path(
        "api/project/<int:project_id>/results/",
        DownloadProjectResultsView.as_view(),
        name="api-project-results",
    ),
    path("api/profile/", ProfileView.as_view(), name="api-profile"),
]
