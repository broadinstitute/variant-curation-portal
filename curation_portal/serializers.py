from rest_framework.serializers import ModelSerializer

from curation_portal.models import Sample, Variant, VariantAnnotation


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


class VariantSerializer(ModelSerializer):
    annotations = VariantAnnotationSerializer(many=True, required=False)
    samples = SampleSerializer(many=True, required=False)

    class Meta:
        model = Variant
        exclude = ("project", "chrom", "pos", "xpos", "ref", "alt")

    def create(self, validated_data):
        annotations_data = validated_data.pop("annotations", None)
        samples_data = validated_data.pop("samples", None)

        variant_id = validated_data["variant_id"]
        variant = Variant.objects.create(**validated_data, **variant_id_parts(variant_id))

        if annotations_data:
            annotations = [VariantAnnotation(**item, variant=variant) for item in annotations_data]
            VariantAnnotation.objects.bulk_create(annotations)

        if samples_data:
            samples = [Sample(**item, variant=variant) for item in samples_data]
            Sample.objects.bulk_create(samples)

        return variant
