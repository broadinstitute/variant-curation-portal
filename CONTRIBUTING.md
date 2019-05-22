# Contributing

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
