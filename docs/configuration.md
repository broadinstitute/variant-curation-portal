# Configuration

The variant curation portal can be configured using the following environment variables:

## Web server settings

- `ALLOWED_HOSTS`

  Controls Django's [ALLOWED_HOSTS](https://docs.djangoproject.com/en/2.2/ref/settings/#allowed-hosts) setting.
  Multiple hosts should be separated with commas. Defaults to `localhost`.

- `SECRET_KEY`

  Controls Django's [SECRET_KEY](https://docs.djangoproject.com/en/2.2/ref/settings/#std:setting-SECRET_KEY) setting.
  Defaults to a random key generated when the app server starts.

## Database settings

- `DB_ENGINE`

  Controls Django's database [ENGINE](https://docs.djangoproject.com/en/2.2/ref/settings/#engine) setting.
  Defaults to `django.db.backends.sqlite3`.

- `DB_HOST`

  Controls Django's database [HOST](https://docs.djangoproject.com/en/2.2/ref/settings/#host) setting.
  Defaults to `localhost`.

- `DB_PORT`

  Controls Django's database [PORT](https://docs.djangoproject.com/en/2.2/ref/settings/#port) setting.
  Defaults to `5432`.

- `DB_DATABASE`

  Controls Django's database [NAME](https://docs.djangoproject.com/en/2.2/ref/settings/#name) setting.
  Defaults to a `db.sqlite3` file located in the variant-curation-portal directory.

- `DB_USER`

  Controls Django's database [USER](https://docs.djangoproject.com/en/2.2/ref/settings/#user) setting.
  Defaults to an empty string.

- `DB_PASSWORD`

  Controls Django's database [PASSWORD](https://docs.djangoproject.com/en/2.2/ref/settings/#password) setting.
  Defaults to an empty string.

## Authentication settings

- `CURATION_PORTAL_AUTH_HEADER`

  The curation portal uses Django's [RemoteUserMiddleware](https://docs.djangoproject.com/en/2.2/howto/auth-remote-user/)
  for authentication. This setting controls the header from which the authenticated user's username is read.
  Defaults to `REMOTE_USER`.
