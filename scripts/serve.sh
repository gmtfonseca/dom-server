#!/bin/bash

./scripts/build.sh
sam.cmd local start-api --env-vars ./scripts/dev-env.json