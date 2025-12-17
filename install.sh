#!/bin/bash
set -e

cd "$(dirname "$0")/0.0.4"

rm -rf node_modules package-lock.json
npm cache clean --force 2>/dev/null || true
npm install --prefer-offline --no-audit --no-fund --loglevel error
npm run compile
echo "Done. Run: cd 0.0.4 && npm test"
