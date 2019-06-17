from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.validators import MaxLengthValidator
from rest_framework.serializers import ModelSerializer, RelatedField, ValidationError

from curation_portal.models import Project, Sample, User, Variant, VariantAnnotation, VariantTag


class ProjectOwnerField(RelatedField):
    default_error_messages = {"invalid": "Invalid username."}

    queryset = User.objects.all()

    def to_internal_value(self, data):
        # These match the validators applied to Django's default User model's username field.
        for validator in [
            MaxLengthValidator(150, "Ensure this field has no more than 150 characters."),
            UnicodeUsernameValidator(),
        ]:
            validator(data)

        try:
            user, _ = self.get_queryset().get_or_create(username=data)
            return user
        except (TypeError, ValueError):
            self.fail("invalid")

    def to_representation(self, value):
        return value.username


class ProjectSerializer(ModelSerializer):
    owners = ProjectOwnerField(many=True, allow_empty=False)

    class Meta:
        model = Project
        fields = ("id", "name", "owners")

    def validate_owners(self, value):
        if self.context["request"].user not in value:
            raise ValidationError("You may not remove yourself as a project owner.")

        return value


def get_xpos(chrom, pos):
    if chrom == "X":
        chrom_number = 23
    elif chrom == "Y":
        chrom_number = 24
    elif chrom == "M":
        chrom_number = 25
    else:
        chrom_number = int(chrom)

    return chrom_number * 1_000_000_000 + pos


def variant_id_parts(variant_id):
    [chrom, pos, ref, alt] = variant_id.split("-")
    pos = int(pos)
    xpos = get_xpos(chrom, pos)
    return {"chrom": chrom, "pos": pos, "xpos": xpos, "ref": ref, "alt": alt}


class SampleSerializer(ModelSerializer):
    class Meta:
        model = Sample
        exclude = ("id", "variant")


class VariantAnnotationSerializer(ModelSerializer):
    class Meta:
        model = VariantAnnotation
        exclude = ("id", "variant")


class VariantTagSerializer(ModelSerializer):
    class Meta:
        model = VariantTag
        exclude = ("id", "variant")


class VariantSerializer(ModelSerializer):
    annotations = VariantAnnotationSerializer(many=True, required=False)
    tags = VariantTagSerializer(many=True, required=False)
    samples = SampleSerializer(many=True, required=False)

    class Meta:
        model = Variant
        exclude = ("project", "chrom", "pos", "xpos", "ref", "alt")

    def create(self, validated_data):
        annotations_data = validated_data.pop("annotations", None)
        tags_data = validated_data.pop("tags", None)
        samples_data = validated_data.pop("samples", None)

        variant_id = validated_data["variant_id"]
        variant = Variant.objects.create(**validated_data, **variant_id_parts(variant_id))

        if annotations_data:
            annotations = [VariantAnnotation(**item, variant=variant) for item in annotations_data]
            VariantAnnotation.objects.bulk_create(annotations)

        if tags_data:
            tags = [VariantTag(**item, variant=variant) for item in tags_data]
            VariantTag.objects.bulk_create(tags)

        if samples_data:
            samples = [Sample(**item, variant=variant) for item in samples_data]
            Sample.objects.bulk_create(samples)

        return variant
