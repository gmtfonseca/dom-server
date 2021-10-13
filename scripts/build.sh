#!/bin/bash

tsc --project ./
cp -f package.json dist/package.json

if [[ "$OSTYPE" == "darwin"* ]]; then
  sam build
else
  sam.cmd build
fi