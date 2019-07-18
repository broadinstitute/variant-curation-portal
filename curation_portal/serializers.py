from collections import Counter, defaultdict

from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.validators import MaxLengthValidator
from rest_framework.serializers import (
    ChoiceField,
    ListSerializer,
    ModelSerializer,
    RegexField,
    RelatedField,
    ValidationError,
)

from curation_portal.models import (
    CurationAssignment,
    CurationResult,
    Project,
    Sample,
    User,
    Variant,
    VariantAnnotation,
    VariantTag,
)


VARIANT_ID_REGEX = r"^(\d+|X|Y)[-:]([0-9]+)[-:]([ACGT]+)[-:]([ACGT]+)$"


class UserField(RelatedField):
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
    owners = UserField(many=True, allow_empty=False)

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


class VariantListSerializer(ListSerializer):  # pylint: disable=abstract-method
    def validate(self, attrs):
        # Check that all variant IDs in the list are unique
        variant_id_counts = Counter(variant_data["variant_id"] for variant_data in attrs)
        duplicate_variant_ids = [k for k, v in variant_id_counts.items() if v > 1]
        if duplicate_variant_ids:
            raise ValidationError(f"Duplicate variants with IDs {', '.join(duplicate_variant_ids)}")

        return attrs


class VariantSerializer(ModelSerializer):
    variant_id = RegexField(VARIANT_ID_REGEX, required=True)

    annotations = VariantAnnotationSerializer(many=True, required=False)
    tags = VariantTagSerializer(many=True, required=False)
    samples = SampleSerializer(many=True, required=False)

    class Meta:
        model = Variant
        exclude = ("project", "chrom", "pos", "xpos", "ref", "alt")
        list_serializer_class = VariantListSerializer

    def validate(self, attrs):
        variant_id = attrs["variant_id"]

        if Variant.objects.filter(variant_id=variant_id, project=self.context["project"]).exists():
            raise ValidationError("Variant already exists in project")

        return attrs

    def create(self, validated_data):
        annotations_data = validated_data.pop("annotations", None)
        tags_data = validated_data.pop("tags", None)
        samples_data = validated_data.pop("samples", None)

        variant_id = validated_data["variant_id"]
        variant = Variant.objects.create(
            **validated_data, **variant_id_parts(variant_id), project=self.context["project"]
        )

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


class ImportedResultListSerializer(ListSerializer):  # pylint: disable=abstract-method
    def validate(self, attrs):
        # Check that all curator/variant ID pairs in the list are unique
        assignment_counts = Counter(
            (variant_data["curator"], variant_data["variant_id"]) for variant_data in attrs
        )
        duplicate_assignments = [k for k, v in assignment_counts.items() if v > 1]
        if duplicate_assignments:
            duplicates_by_curator = defaultdict(list)
            for curator, variant_id in duplicate_assignments:
                duplicates_by_curator[curator].append(variant_id)

            raise ValidationError(
                "Duplicate results for "
                + ", ".join(
                    f"{curator} (variants {', '.join(variants)})"
                    for curator, variants in duplicates_by_curator.items()
                )
            )

        return attrs


class ImportedResultSerializer(ModelSerializer):
    curator = UserField(required=True)
    variant_id = RegexField(VARIANT_ID_REGEX, required=True)

    verdict = ChoiceField(
        ["lof", "likely_lof", "uncertain", "likely_not_lof", "not_lof"],
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = CurationResult
        exclude = ("id",)
        list_serializer_class = ImportedResultListSerializer

    def validate_variant_id(self, value):
        if not Variant.objects.filter(project=self.context["project"], variant_id=value).exists():
            raise ValidationError("Variant does not exist")

        return value

    def validate(self, attrs):
        if CurationAssignment.objects.filter(
            variant__project=self.context["project"],
            variant__variant_id=attrs["variant_id"],
            curator__username=attrs["curator"],
        ).exists():
            raise ValidationError("Duplicate assignment")

        return attrs

    def create(self, validated_data):
        curator = validated_data.pop("curator", None)
        variant_id = validated_data.pop("variant_id", None)

        variant = Variant.objects.get(project=self.context["project"], variant_id=variant_id)

        assignment = CurationAssignment.objects.create(curator=curator, variant=variant)

        result = CurationResult(**validated_data)

        # If a created/updated timestamp is specified, override the auto_now settings on CurationResult
        for field in result._meta.local_fields:
            if field.name in ["created_at", "updated_at"] and field.name in validated_data:
                field.auto_now = False
                field.auto_now_add = False

        result.save()
        assignment.result = result
        assignment.save()

        return result

    def update(self, instance, validated_data):
        raise NotImplementedError
