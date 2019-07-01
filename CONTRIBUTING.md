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

- Start Django and webpack development servers

  ```
  ./start.sh
  ```

- Open browser to http://localhost:3000

## Testing

### Python

Backend tests are written using [pytest](https://docs.pytest.org/).
Run tests with either `pytest` or `tox -e py36`.

## Conventions

### Python

Python code is formatted with [Black](https://black.readthedocs.io/).

Check formatting of Python code with `black --check curation_portal` or `tox -e formatting`.

### JavaScript

JavaScript code is formatted with [Prettier](https://prettier.io/).

Check formatting of JS code with `yarn run prettier --check 'assets/**'`.

## Dependencies

- [Python 3.6+](https://www.python.org/)
- [Django](https://www.djangoproject.com/)
- [Django REST framework](https://www.django-rest-framework.org/)
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
