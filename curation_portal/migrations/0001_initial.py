# Generated by Django 2.2.1 on 2019-05-24 16:57

from django.conf import settings
import django.contrib.auth.models
import django.contrib.auth.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [("auth", "0011_update_proxy_permissions")]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(blank=True, null=True, verbose_name="last login"),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "username",
                    models.CharField(
                        error_messages={"unique": "A user with that username already exists."},
                        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                        max_length=150,
                        unique=True,
                        validators=[django.contrib.auth.validators.UnicodeUsernameValidator()],
                        verbose_name="username",
                    ),
                ),
                (
                    "first_name",
                    models.CharField(blank=True, max_length=30, verbose_name="first name"),
                ),
                (
                    "last_name",
                    models.CharField(blank=True, max_length=150, verbose_name="last name"),
                ),
                (
                    "email",
                    models.EmailField(blank=True, max_length=254, verbose_name="email address"),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(
                        default=django.utils.timezone.now, verbose_name="date joined"
                    ),
                ),
            ],
            options={"verbose_name": "user", "verbose_name_plural": "users", "abstract": False},
            managers=[("objects", django.contrib.auth.models.UserManager())],
        ),
        migrations.CreateModel(
            name="CurationResult",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("flag_mapping_error", models.BooleanField(default=False)),
                ("flag_genotyping_error", models.BooleanField(default=False)),
                ("flag_homopolymer", models.BooleanField(default=False)),
                ("flag_no_read_data", models.BooleanField(default=False)),
                ("flag_reference_error", models.BooleanField(default=False)),
                ("flag_strand_bias", models.BooleanField(default=False)),
                ("flag_mnp", models.BooleanField(default=False)),
                ("flag_essential_splice_rescue", models.BooleanField(default=False)),
                ("flag_minority_of_transcripts", models.BooleanField(default=False)),
                ("flag_weak_exon_conservation", models.BooleanField(default=False)),
                ("flag_last_exon", models.BooleanField(default=False)),
                ("flag_other_transcript_error", models.BooleanField(default=False)),
                ("notes", models.TextField(blank=True, null=True)),
                ("should_revisit", models.BooleanField(default=False)),
                ("verdict", models.CharField(blank=True, max_length=25, null=True)),
            ],
            options={"db_table": "curation_result"},
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=1000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "owners",
                    models.ManyToManyField(
                        related_name="owned_projects",
                        related_query_name="owned_project",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "curation_project"},
        ),
        migrations.CreateModel(
            name="Variant",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("variant_id", models.CharField(max_length=1000)),
                ("chrom", models.CharField(max_length=2)),
                ("pos", models.IntegerField()),
                ("xpos", models.IntegerField()),
                ("ref", models.CharField(max_length=1000)),
                ("alt", models.CharField(max_length=1000)),
                ("qc_filter", models.CharField(blank=True, max_length=100, null=True)),
                ("AC", models.IntegerField(blank=True, null=True)),
                ("AN", models.IntegerField(blank=True, null=True)),
                ("AF", models.FloatField(blank=True, null=True)),
                ("n_homozygotes", models.IntegerField(blank=True, null=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="variants",
                        related_query_name="variant",
                        to="curation_portal.Project",
                    ),
                ),
            ],
            options={
                "db_table": "curation_variant",
                "ordering": ("xpos", "ref", "alt"),
                "unique_together": {("project", "variant_id")},
            },
        ),
        migrations.CreateModel(
            name="CurationAssignment",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "curator",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="curation_assignments",
                        related_query_name="curation_assignment",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "result",
                    models.OneToOneField(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assignment",
                        to="curation_portal.CurationResult",
                    ),
                ),
                (
                    "variant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="curation_assignments",
                        related_query_name="curation_assignment",
                        to="curation_portal.Variant",
                    ),
                ),
            ],
            options={
                "db_table": "curation_assignment",
                "unique_together": {("variant", "curator")},
            },
        ),
        migrations.AddField(
            model_name="user",
            name="assigned_variants",
            field=models.ManyToManyField(
                through="curation_portal.CurationAssignment", to="curation_portal.Variant"
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="groups",
            field=models.ManyToManyField(
                blank=True,
                help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                related_name="user_set",
                related_query_name="user",
                to="auth.Group",
                verbose_name="groups",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="user_permissions",
            field=models.ManyToManyField(
                blank=True,
                help_text="Specific permissions for this user.",
                related_name="user_set",
                related_query_name="user",
                to="auth.Permission",
                verbose_name="user permissions",
            ),
        ),
        migrations.CreateModel(
            name="VariantAnnotation",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("consequence", models.CharField(max_length=1000)),
                ("gene_id", models.CharField(max_length=16)),
                ("gene_symbol", models.CharField(max_length=16)),
                ("transcript_id", models.CharField(max_length=16)),
                ("loftee", models.CharField(blank=True, max_length=2, null=True)),
                ("loftee_filter", models.CharField(blank=True, max_length=200, null=True)),
                ("loftee_flags", models.CharField(blank=True, max_length=200, null=True)),
                (
                    "variant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="annotations",
                        related_query_name="annotation",
                        to="curation_portal.Variant",
                    ),
                ),
            ],
            options={
                "db_table": "curation_variant_annotation",
                "unique_together": {("variant", "transcript_id")},
            },
        ),
        migrations.CreateModel(
            name="Sample",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("sample_id", models.CharField(max_length=100)),
                ("GT", models.TextField(blank=True, null=True)),
                ("GQ", models.IntegerField(blank=True, null=True)),
                ("DP", models.IntegerField(blank=True, null=True)),
                ("AD_REF", models.IntegerField(blank=True, null=True)),
                ("AD_ALT", models.IntegerField(blank=True, null=True)),
                ("AB", models.FloatField(blank=True, null=True)),
                (
                    "variant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="samples",
                        related_query_name="sample",
                        to="curation_portal.Variant",
                    ),
                ),
            ],
            options={"db_table": "curation_sample", "unique_together": {("variant", "sample_id")}},
        ),
    ]
