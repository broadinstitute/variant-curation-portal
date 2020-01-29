# Deployment

The variant curation portal is a [Django](https://www.djangoproject.com/) application.
Django provides [documentation](https://docs.djangoproject.com/en/2.2/howto/deployment/)
on several options for deploying with WSGI.

## Dependencies

Dependencies are listed in [requirements.txt](../requirements.txt).

To install dependencies, run:

```
pip install -r requirements.txt
```

## Configuration

Using the default settings, the [database connection](./configuration.md#database-settings)
and some [web server settings](./configuration.md#web-server-settings) can be configured
through environment variables.

Alternatively, the `DJANGO_SETTINGS_MODULE` environment variable can be used to
[designate a settings module](https://docs.djangoproject.com/en/2.2/topics/settings/#designating-the-settings)

## Authentication

The variant curation portal relies on external authentication.

It uses a [RemoteUserMiddleware](https://docs.djangoproject.com/en/2.2/howto/auth-remote-user/)
subclass to get the currently authenticated user from a header. The header to use for this can
be [configured](./configuration.md#authentication-settings) through an environment variable.

## Static files

The variant curation portal uses [WhiteNoise](https://pypi.org/project/whitenoise/) to serve
static files from Django.

To build assets, run the following (requires [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/)):

```
cd /path/to/variant-curation-portal
yarn install --frozen-lockfile
yarn run build
```

This will populate the variant-curation-portal/static/bundles directory.

## Docker

The [Dockerfile](../Dockerfile) in this repository can be used to build an image that uses
gunicorn for an application server and includes the dependencies necessary to connect to a
PostgreSQL database.

The [docker](../docker) directory also includes example Docker Compose configurations for
deployments using [HTTP Basic Authentication](../docker/nginx-basic-auth) and
[OAuth](../docker/oauth-proxy) for authentication.

## User permissions

Once the variant curation portal is deployed, in order to start using it, at least one user
needs to be granted some [permissions](./permissions.md).
