from django.db.models import Q
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ChoiceField, ModelSerializer, SerializerMethodField
from rest_framework.views import APIView

from curation_portal.models import CurationResult, Project, Variant


class VariantSerializer(ModelSerializer):
    class Meta:
        model = Variant
        fields = ("id",)


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class CurationResultSerializer(ModelSerializer):
    variant = SerializerMethodField()

    def get_variant(self, obj):  # pylint: disable=no-self-use
        return VariantSerializer(obj.assignment.variant).data

    project = SerializerMethodField()

    def get_project(self, obj):  # pylint: disable=no-self-use
        return ProjectSerializer(obj.assignment.variant.project).data

    curator = SerializerMethodField()

    def get_curator(self, obj):  # pylint: disable=no-self-use
        return obj.assignment.curator.username

    verdict = ChoiceField(
        ["lof", "likely_lof", "uncertain", "likely_not_lof", "not_lof"],
        required=False,
        allow_null=True,
    )

    class Meta:
        model = CurationResult
        fields = (
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
            "notes",
            "should_revisit",
            "verdict",
            "variant",
            "project",
            "curator",
        )


class VariantResultsView(APIView):
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

        results = (
            CurationResult.objects.filter(
                Q(assignment__variant__variant_id=kwargs["variant_id"])
                & Q(
                    assignment__variant__reference_genome="GRCh37"
                )  # TODO: Handle different reference genomes
                & (
                    Q(assignment__variant__project__owners__id__contains=request.user.id)
                    | Q(assignment__curator=request.user)
                )
            )
            .distinct()
            .select_related(
                "assignment__curator", "assignment__variant", "assignment__variant__project"
            )
        )

        serializer = CurationResultSerializer(results, many=True)
        return Response({"results": serializer.data})
