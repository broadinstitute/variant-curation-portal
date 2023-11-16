# Contributing

## Getting started

- Install dependencies

  ```
  pip install -r requirements.txt
  pip install -r requirements-dev.txt
  yarn
  ```

- Build front end

  ```
  yarn run build
  ```

- Migrate database

  ```
  ./manage.py migrate
  ```

- Set an admin user to be able to view all features

  - Enter manage.py shell

    ```
    ./manage.py shell
    ```

  - Give permissions to the user "developer"

    ```
    from django.contrib.auth.models import Permission
    from curation_portal.models import User

    username = "developer"

    user, _ = User.objects.get_or_create(username=username)
    user.user_permissions.add(Permission.objects.get(codename="add_project"))
    user.user_permissions.add(Permission.objects.get(codename="add_variant"))
    ```

- Start Django and webpack development servers

  Set `REMOTE_USER` to simulate an authenticated user

  ```
  REMOTE_USER=developer ./start.sh
  ```

- Open browser to http://localhost:3000

## Testing

### Python

Backend tests are written using [pytest](https://docs.pytest.org/).
Run tests with either `pytest` or `tox -e py36`.

#### Coverage

[pytest-cov](https://pytest-cov.readthedocs.io) is used to generate coverage reports.

To generate and view an HTML coverage report, use:

```
pytest --cov-report=html
python3 -m http.server --directory htmlcov
```

### JavaScript

Frontend tests use [jest](https://jestjs.io/).
Run tests with either `jest` or `yarn test`.

## Conventions

### Python

Python code is formatted with [Black](https://black.readthedocs.io/).

Check formatting of Python code with `black --check curation_portal` or `tox -e formatting`.

### JavaScript

JavaScript code is formatted with [Prettier](https://prettier.io/).

Check formatting of JS code with `yarn run prettier --check 'assets/**'`.

## Dependencies

- [Python 3.9+](https://www.python.org/)
- [Django](https://www.djangoproject.com/)
- [Django REST framework](https://www.django-rest-framework.org/)
- [django-filter](https://pypi.org/project/django-filter/)
- [rules](https://pypi.org/project/rules/)
- [Django webpack loader](https://github.com/owais/django-webpack-loader)
- [WhiteNoise](https://pypi.org/project/whitenoise/)
- [React](https://reactjs.org/)
- [Semantic UI React](https://react.semantic-ui.com/)

### Python

requirements.txt is generated from requirements.in using [pip-tools](https://github.com/jazzband/pip-tools).
To upgrade dependencies, use [pip-compile](https://github.com/jazzband/pip-tools#updating-requirements).

### JavaScript

To upgrade JS dependencies, use [yarn upgrade](https://yarnpkg.com/en/docs/cli/upgrade) or
[yarn upgrade-interactive](https://yarnpkg.com/en/docs/cli/upgrade-interactive).
