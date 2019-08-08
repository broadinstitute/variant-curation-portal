import csv

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse
from django.views import View
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import get_object_or_404

from curation_portal.models import CurationAssignment, CurationResult, Project


class ExportProjectResultsView(LoginRequiredMixin, View):
    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.change_project", project):
            if not self.request.user.has_perm("curation_portal.view_project", project):
                raise NotFound

            raise PermissionDenied

        return project

    def get(self, request, *args, **kwargs):
        project = self.get_project()

        result_flag_fields = [
            f.name for f in CurationResult._meta.get_fields() if f.name.startswith("flag")
        ]
        result_fields = ["notes", "should_revisit", "verdict"] + result_flag_fields

        completed_assignments = (
            CurationAssignment.objects.filter(
                variant__project=project, result__verdict__isnull=False
            )
            .select_related("curator", "variant", "result")
            .all()
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{project.name}_results.csv"'

        writer = csv.writer(response)

        header_row = ["Variant ID", "Curator"] + [
            " ".join(word.capitalize() for word in f.split("_")) for f in result_fields
        ]
        writer.writerow(header_row)

        for assignment in completed_assignments:
            row = [assignment.variant.variant_id, assignment.curator.username] + [
                getattr(assignment.result, f) for f in result_fields
            ]
            writer.writerow(row)

        return response
