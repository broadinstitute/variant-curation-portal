import csv

from django.db.models import Prefetch, Q
from django.http import HttpResponse
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from curation_portal.models import (
    CurationAssignment,
    Variant,
    VariantAnnotation,
    FLAG_FIELDS,
    FLAG_LABELS,
)


class ExportVariantResultsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):  # pylint: disable=unused-argument
        variants = (
            Variant.objects.filter(
                Q(variant_id=kwargs["variant_id"])
                & Q(reference_genome="GRCh37")  # TODO: Handle different reference genomes
                & (
                    Q(project__owners__id__contains=request.user.id)
                    | Q(curation_assignment__curator=request.user)
                )
            )
            .distinct()
            .select_related("project")
        )

        if not variants:
            raise NotFound("Variant not found")

        completed_assignments = (
            CurationAssignment.objects.filter(
                Q(variant__variant_id=kwargs["variant_id"])
                & Q(variant__reference_genome="GRCh37")  # TODO: Handle different reference genomes
                & (
                    Q(variant__project__owners__id__contains=request.user.id)
                    | Q(curator=request.user)
                )
                & Q(result__verdict__isnull=False)
            )
            .distinct()
            .select_related("curator", "variant", "result")
            .prefetch_related(
                Prefetch(
                    "variant__annotations",
                    queryset=VariantAnnotation.objects.only("variant_id", "gene_id", "gene_symbol"),
                )
            )
        )

        result_fields = ["notes", "should_revisit", "verdict", *FLAG_FIELDS]

        response = HttpResponse(content_type="text/csv")
        response[
            "Content-Disposition"
        ] = f'attachment; filename="{kwargs["variant_id"]}_results.csv"'

        writer = csv.writer(response)

        header_row = ["Project", "Gene", "Curator"] + [
            FLAG_LABELS.get(f, " ".join(word.capitalize() for word in f.split("_")))
            for f in result_fields
        ]
        writer.writerow(header_row)

        for assignment in completed_assignments:
            row = [
                assignment.variant.project.name,
                ";".join(
                    set(
                        f"{annotation.gene_id}:{annotation.gene_symbol}"
                        for annotation in assignment.variant.annotations.all()
                    )
                ),
                assignment.curator.username,
            ] + [getattr(assignment.result, f) for f in result_fields]
            writer.writerow(row)

        return response
