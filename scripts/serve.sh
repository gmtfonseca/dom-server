#!/bin/bash

./scripts/build.sh
sam local start-api --env-vars ./scripts/dev-env.json