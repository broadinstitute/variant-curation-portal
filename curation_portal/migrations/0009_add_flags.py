# Generated by Django 2.2.20 on 2021-05-06 13:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("curation_portal", "0008_add_flags")]

    operations = [
        migrations.AddField(
            model_name="curationresult",
            name="flag_low_pext",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="curationresult",
            name="flag_pext_less_than_half_max",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="curationresult",
            name="flag_uninformative_pext",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="curationresult",
            name="flag_weak_gene_conservation",
            field=models.BooleanField(default=False),
        ),
    ]