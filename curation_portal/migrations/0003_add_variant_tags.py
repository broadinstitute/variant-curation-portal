# Generated by Django 2.2.1 on 2019-06-07 17:09

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [("curation_portal", "0002_alter_variant_xpos_size")]

    operations = [
        migrations.CreateModel(
            name="VariantTag",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("label", models.CharField(max_length=100)),
                ("value", models.CharField(max_length=1000)),
                (
                    "variant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tags",
                        related_query_name="tag",
                        to="curation_portal.Variant",
                    ),
                ),
            ],
            options={"db_table": "curation_variant_tag"},
        )
    ]
