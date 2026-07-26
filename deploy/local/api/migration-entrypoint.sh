#!/bin/sh
set -eu

secret_path=${AVIA_DATABASE_PASSWORD_FILE:-/run/secrets/app_database_password}
if [ ! -f "$secret_path" ]; then
  echo "required mounted database credential is unavailable" >&2
  exit 1
fi
database_password=$(tr -d '\r\n' <"$secret_path")
if [ -z "$database_password" ]; then
  echo "required mounted database credential is empty" >&2
  exit 1
fi

export AVIA_DATABASE_URL="postgres://${AVIA_DATABASE_USER:-aviasurveil360}:${database_password}@${AVIA_DATABASE_HOST:-postgres}:${AVIA_DATABASE_PORT:-5432}/${AVIA_DATABASE_NAME:-aviasurveil360}?sslmode=disable"
unset database_password

exec /app/migrate
