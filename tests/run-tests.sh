#!/bin/bash

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -d "node_modules/@playwright/test/browsers" ]; then
  echo "Installing browsers..."
  npx playwright install
fi

echo "Running voice channel tests..."
npx playwright test voice-channel.test.js

echo "Opening test report..."
npx playwright show-report 