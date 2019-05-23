from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch.dispatcher import receiver


class User(AbstractUser):
    assigned_variants = models.ManyToManyField(
        "Variant", through="CurationAssignment", through_fields=("curator", "variant")
    )


class Project(models.Model):
    name = models.CharField(max_length=1000)
    owners = models.ManyToManyField(
        User, related_name="owned_projects", related_query_name="owned_project"
    )

    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curation_project"


class Variant(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="variants", related_query_name="variant"
    )
    variant_id = models.CharField(max_length=1000)
    chrom = models.CharField(max_length=2)
    pos = models.IntegerField()
    xpos = models.IntegerField()
    ref = models.CharField(max_length=1000)
    alt = models.CharField(max_length=1000)

    qc_filter = models.CharField(max_length=100, null=True, blank=True)
    AC = models.IntegerField(null=True, blank=True)
    AN = models.IntegerField(null=True, blank=True)
    AF = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "curation_variant"
        unique_together = ("project", "variant_id")
        ordering = ("xpos", "ref", "alt")


class VariantAnnotation(models.Model):
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name="annotations",
        related_query_name="annotation",
    )

    consequence = models.CharField(max_length=1000)
    gene_id = models.CharField(max_length=16)
    gene_symbol = models.CharField(max_length=16)
    transcript_id = models.CharField(max_length=16)

    loftee = models.CharField(max_length=2, null=True, blank=True)
    loftee_filter = models.CharField(max_length=200, null=True, blank=True)
    loftee_flags = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = "curation_variant_annotation"
        unique_together = ("variant", "transcript_id")


class Sample(models.Model):
    variant = models.ForeignKey(
        Variant, on_delete=models.CASCADE, related_name="samples", related_query_name="sample"
    )
    sample_id = models.CharField(max_length=100)

    GT = models.TextField(null=True, blank=True)
    GQ = models.IntegerField(null=True, blank=True)
    DP = models.IntegerField(null=True, blank=True)
    AD_REF = models.IntegerField(null=True, blank=True)
    AD_ALT = models.IntegerField(null=True, blank=True)
    AB = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "curation_sample"
        unique_together = ("variant", "sample_id")


class CurationAssignment(models.Model):
    variant = models.ForeignKey(
        Variant,
        on_delete=models.CASCADE,
        related_name="curation_assignments",
        related_query_name="curation_assignment",
    )
    curator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="curation_assignments",
        related_query_name="curation_assignment",
    )
    result = models.OneToOneField(
        "CurationResult", null=True, on_delete=models.SET_NULL, related_name="assignment"
    )

    class Meta:
        db_table = "curation_assignment"
        unique_together = ("variant", "curator")


@receiver(post_delete, sender=CurationAssignment)
def delete_assignment_result(sender, instance, *args, **kwargs):  # pylint: disable=unused-argument
    if instance.result:
        instance.result.delete()


class CurationResult(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Flags
    ## Technical
    flag_mapping_error = models.BooleanField(default=False)
    flag_genotyping_error = models.BooleanField(default=False)
    flag_homopolymer = models.BooleanField(default=False)
    flag_no_read_data = models.BooleanField(default=False)
    flag_reference_error = models.BooleanField(default=False)
    flag_strand_bias = models.BooleanField(default=False)
    ## Rescue
    flag_mnp = models.BooleanField(default=False)
    flag_essential_splice_rescue = models.BooleanField(default=False)
    ## Impact
    flag_minority_of_transcripts = models.BooleanField(default=False)
    flag_weak_exon_conservation = models.BooleanField(default=False)
    flag_last_exon = models.BooleanField(default=False)
    flag_other_transcript_error = models.BooleanField(default=False)

    # Notes
    notes = models.TextField(null=True, blank=True)
    should_revisit = models.BooleanField(default=False)

    # Decision
    verdict = models.CharField(max_length=25, null=True, blank=True)

    class Meta:
        db_table = "curation_result"
