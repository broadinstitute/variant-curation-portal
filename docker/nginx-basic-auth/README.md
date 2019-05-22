## HTTP Basic Authentication

https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/

- Create password file and add a user.

  ```
  touch ./docker/nginx/basic-auth/htpasswd
  htpasswd -b ./docker/nginx/basic-auth/htpasswd username password
  ```

- Configure app. Fill in values below.

  ```
  cat <<EOF > .env
  SECRET_KEY=
  DB_DATABASE=
  DB_USER=
  DB_PASSWORD=
  ```

  To generate a random secret key, use:

  ```
  python manage.py shell
  >>> from django.core.management.utils import get_random_secret_key
  >>> get_random_secret_key()
  ```

- Apply database migrations.

  ```
  docker-compose -f ./docker/nginx-basic-auth/docker-compose.yml up database
  docker-compose -f ./docker/nginx-basic-auth/docker-compose.yml run --rm app ./manage.py migrate
  ```

- Start environment.

  ```
  docker-compose -f ./docker/nginx-basic-auth/docker-compose.yml up
  ```

- Open web browser to http://localhost:8000.
