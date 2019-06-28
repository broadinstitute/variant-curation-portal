#!/bin/bash

cd $(dirname "${BASH_SOURCE}")

export DJANGO_SETTINGS_MODULE="curation_portal.settings.development"

export NODE_ENV=development

./manage.py runserver &
DJANGO_PID=$!

yarn run webpack-dev-server --hot &
WEBPACK_PID=$!

trap "kill ${WEBPACK_PID}; pkill -P ${DJANGO_PID}; exit 1" INT

wait
