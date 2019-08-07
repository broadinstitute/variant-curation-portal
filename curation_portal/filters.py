import django_filters

from curation_portal.models import CurationAssignment


class AssignmentFilter(django_filters.FilterSet):
    class Meta:
        model = CurationAssignment
        fields = {
            "result__verdict": ["exact", "isnull"],
            "result__should_revisit": ["exact"],
            "variant__annotation__gene_symbol": ["exact"],
            "variant__annotation__consequence": ["exact", "contains"],
        }
