import pytest

from curation_portal.serializers import VariantSerializer


@pytest.fixture(scope="session")
def create_variant():
    def create_variant_fn(project, variant_id, **kwargs):
        data = {**kwargs, "variant_id": variant_id}
        serializer = VariantSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return serializer.save(project=project)

    return create_variant_fn
