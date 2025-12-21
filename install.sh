#!/bin/bash
set -e

cd "$(dirname "$0")/ptree-syntax"

rm -rf node_modules package-lock.json
npm cache clean --force 2>/dev/null || true
npm install --prefer-offline --no-audit --no-fund --loglevel error
npm run compile
echo "Done. Run: cd ptree-syntax && npm test"
