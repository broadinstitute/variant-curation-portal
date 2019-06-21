#!/bin/bash

set -eu

display_usage() {
  echo "Usage: build-docker-image.sh name"
}

if [ "$#" != 1 ]; then
  display_usage
  exit 1
fi

IMAGE_NAME="$1"

# Tag image with git revision
REVISION=$(git rev-parse --short HEAD)

# Add current branch name to tag if not on master branch
BRANCH=$(git symbolic-ref --short -q HEAD)
if [[ "$BRANCH" != "master" ]]; then
  BRANCH_TAG="-$(echo "$BRANCH" | sed 's/[^A-Za-z0-9_\-\.]/_/g')"
else
  BRANCH_TAG=""
fi

# Add "modified" to tag if there are uncommitted local changes
GIT_STATUS=$(git status --porcelain 2> /dev/null | tail -n1)
if [[ -n $GIT_STATUS ]]; then
  STATUS_TAG="-modified"
else
  STATUS_TAG=""
fi

IMAGE_TAG="${REVISION}${BRANCH_TAG}${STATUS_TAG}"

docker build --tag ${IMAGE_NAME}:${IMAGE_TAG} --tag ${IMAGE_NAME}:latest .

echo ${IMAGE_NAME}:${IMAGE_TAG}
