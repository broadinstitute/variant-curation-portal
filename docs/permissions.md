# Permissions

User permissions for the variant curation portal are based on "projects".

A project can have one or more "owners", who can see all information in
the project, add/remove owners, assign curators, etc. When a user creates
a project, they become an owner of that project.

Additionally, "curators" can be assigned to specific variants within the
project. A curator can only view and curate the variants they have been
assigned. Multiple curators can be assigned to the same variant. They
cannot see each other's curation results for the variant.

Additional permissions are required to create projects and upload variants.
To create a project, the user must have the `add_project` permission.
To upload variants to a project, the user must be an owner of the project
and have the `add_variant` permission.

## Granting permissions

Currently, these permission cannot be granted through the web UI.

To grant permission to a user, run the following with
[manage.py shell](https://docs.djangoproject.com/en/2.2/ref/django-admin/#shell):

```python
from django.contrib.auth.models import Permission
from curation_portal.models import User

username = "user" # username of the user to grant permission to
permission_name = "add_project" # either "add_project" or "add_variant"

user, _ = User.objects.get_or_create(username=username)
user.user_permissions.add(Permission.objects.get(codename=permission_name))
```
