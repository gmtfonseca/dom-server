#!/bin/bash

tsc --project ./
cp -f package.json dist/package.json
sam.cmd build