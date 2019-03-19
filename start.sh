#!/bin/bash

cd $(dirname "${BASH_SOURCE}")

export DJANGO_SETTINGS_MODULE="curation_portal.settings.development"

export PATH=$PATH:./node_modules/.bin
export NODE_ENV=development

./manage.py runserver &
DJANGO_PID=$!

webpack-dev-server --hot &
WEBPACK_PID=$!

trap "kill ${WEBPACK_PID}; pkill -P ${DJANGO_PID}; exit 1" INT

wait
