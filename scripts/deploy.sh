#!/bin/bash

./scripts/build.sh

if [[ "$OSTYPE" == "darwin"* ]]; then
  sam deploy
else
  sam.cmd deploy
fi