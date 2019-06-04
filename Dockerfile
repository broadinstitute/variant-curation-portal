#########################
# Build front end       #
#########################
FROM node:lts-alpine

WORKDIR /app

# Install dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn

COPY babel.config.js .
COPY webpack.config.js .
COPY assets ./assets

RUN yarn run build

#########################
# App image             #
#########################
FROM python:3.6-alpine

# Create app user and group
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
RUN apk add --no-cache py3-psycopg2
# psycopg2 installed through apk is placed in a different directory than
# packages installed with pip
ENV PYTHONPATH="${PYTHONPATH}:/usr/lib/python3.6/site-packages"

RUN pip install --no-cache-dir gunicorn==19.9.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy front end from builder image
COPY --from=0 /app/static ./static
COPY --from=0 /app/webpack-stats.json .

# Copy code
COPY manage.py .
COPY curation_portal ./curation_portal

# Run as app user
RUN chown -R app:app .
USER app

# Run
CMD ["gunicorn", \
  "--bind", ":8000", \
  "--log-file", "-", \
  "--workers", "2", "--threads", "4", "--worker-class", "gthread", \
  "--worker-tmp-dir", "/dev/shm", \
  "curation_portal.wsgi"]
