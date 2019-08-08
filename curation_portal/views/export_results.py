import csv

from django.http import HttpResponse
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from curation_portal.models import CurationAssignment, Project


class ExportProjectResultsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.change_project", project):
            if not self.request.user.has_perm("curation_portal.view_project", project):
                raise NotFound

            raise PermissionDenied

        return project

    def get(self, request, *args, **kwargs):
        project = self.get_project()

        result_fields = [
            "notes",
            "should_revisit",
            "verdict",
            "flag_mapping_error",
            "flag_genotyping_error",
            "flag_homopolymer",
            "flag_no_read_data",
            "flag_reference_error",
            "flag_strand_bias",
            "flag_mnp",
            "flag_essential_splice_rescue",
            "flag_minority_of_transcripts",
            "flag_weak_exon_conservation",
            "flag_last_exon",
            "flag_other_transcript_error",
        ]

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
