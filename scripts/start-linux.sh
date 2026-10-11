#!/usr/bin/env sh
# Build the prelegal image and start a fresh container at http://localhost:8000
set -e
cd "$(dirname "$0")/.."
docker build -t prelegal .
docker rm -f prelegal >/dev/null 2>&1 || true
ENV_FILE=""
[ -f .env ] && ENV_FILE="--env-file .env"
docker run -d --name prelegal -p 8000:8000 $ENV_FILE prelegal
echo "prelegal running at http://localhost:8000"
