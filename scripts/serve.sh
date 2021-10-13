#!/bin/bash

./scripts/build.sh

if [[ "$OSTYPE" == "darwin"* ]]; then
  sam local start-api --env-vars ./scripts/dev-env.json
else
  sam.cmd local start-api --env-vars ./scripts/dev-env.json
fi