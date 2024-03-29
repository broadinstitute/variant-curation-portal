import csv
import re

from django.db.models import Prefetch
from django.http import HttpResponse
from django_filters import FilterSet
from rest_framework.exceptions import NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    Project,
    VariantAnnotation,
    FLAG_FIELDS,
    FLAG_LABELS,
)


class ExportResultsFilter(FilterSet):
    class Meta:
        model = CurationAssignment
        fields = {"curator__username": ["exact"]}


class ExportProjectResultsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_project(self):
        project = get_object_or_404(Project, id=self.kwargs["project_id"])
        if not self.request.user.has_perm("curation_portal.view_project", project):
            raise NotFound

        return project

    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        project = self.get_project()

        result_fields = ["notes", "should_revisit", "verdict", *FLAG_FIELDS]

        completed_assignments = (
            CurationAssignment.objects.filter(
                variant__project=project, result__verdict__isnull=False
            )
            .select_related("curator", "variant", "result")
            .prefetch_related(
                Prefetch(
                    "variant__annotations",
                    queryset=VariantAnnotation.objects.only(
                        "variant_id", "gene_id", "gene_symbol", "transcript_id"
                    ),
                )
            )
        )

        # Project owners can download all results for the project and optionally filter them by curator.
        # Curators can only download their own results.
        if request.user.has_perm("curation_portal.change_project", project):
            filter_params = request.query_params
        else:
            filter_params = {"curator__username": request.user.username}

        filtered_assignments = ExportResultsFilter(filter_params, queryset=completed_assignments)

        # Include project name and (if applicable) curator name in downloaded file name.
        filename_prefix = f"{project.name}"
        if "curator__username" in filter_params:
            filename_prefix += "_" + filter_params["curator__username"]

        # Based on django.utils.text.get_valid_filename, but replace characters with "-" instead of removing them.
        filename_prefix = re.sub(r"(?u)[^-\w]", "-", filename_prefix)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename_prefix}_results.csv"'

        writer = csv.writer(response)

        header_row = ["Variant ID", "Gene", "Transcript", "Curator"] + [
            FLAG_LABELS.get(f, " ".join(word.capitalize() for word in f.split("_")))
            for f in result_fields
        ]
        writer.writerow(header_row)

        for assignment in filtered_assignments.qs:
            row = [
                assignment.variant.variant_id,
                ";".join(
                    set(
                        f"{annotation.gene_id}:{annotation.gene_symbol}"
                        for annotation in assignment.variant.annotations.all()
                    )
                ),
                ";".join(
                    set(
                        annotation.transcript_id
                        for annotation in assignment.variant.annotations.all()
                    )
                ),
                assignment.curator.username,
            ] + [getattr(assignment.result, f) for f in result_fields]
            writer.writerow(row)

        return response
