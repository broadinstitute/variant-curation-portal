import rules

from curation_portal.models import CurationAssignment


@rules.predicate
def is_project_owner(user, project):
    return project.owners.filter(id=user.id).exists()


@rules.predicate
def is_project_curator(user, project):
    return CurationAssignment.objects.filter(curator=user, variant__project=project).exists()


rules.add_perm("curation_portal.view_project", is_project_owner | is_project_curator)
rules.add_perm("curation_portal.change_project", is_project_owner)


@rules.predicate
def is_variant_curator(user, variant):
    return CurationAssignment.objects.filter(curator=user, variant=variant).exists()


rules.add_perm("curation_portal.curate_variant", is_variant_curator)
