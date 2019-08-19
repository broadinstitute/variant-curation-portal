## OAuth with OAuth2_Proxy

https://pusher.github.io/oauth2_proxy/

- [Configure auth provider](https://pusher.github.io/oauth2_proxy/auth-configuration).

- Configure app. Fill in values below.

  ```
  cat <<EOF > .env
  SECRET_KEY=
  DB_DATABASE=
  DB_USER=
  DB_PASSWORD=

  OAUTH2_PROXY_CLIENT_ID=
  OAUTH2_PROXY_CLIENT_SECRET=
  OAUTH2_PROXY_COOKIE_SECRET=
  EOF
  ```

  To generate a random secret key, use:

  ```
  python manage.py shell
  >>> from django.core.management.utils import get_random_secret_key
  >>> get_random_secret_key()
  ```

- Apply database migrations.

  ```
  docker-compose -f ./docker/docker-compose-base.yml -f ./docker/oauth-proxy/docker-compose.yml up database
  docker-compose -f ./docker/docker-compose-base.yml -f ./docker/oauth-proxy/docker-compose.yml run --rm app ./manage.py migrate
  ```

- Start environment.

  ```
  docker-compose -f ./docker/docker-compose-base.yml -f ./docker/oauth-proxy/docker-compose.yml up
  ```

- Open web browser to http://localhost:4180.
