#!/bin/sh
set -eu

read_secret() {
  secret_path=$1
  if [ ! -f "$secret_path" ]; then
    echo "required mounted file is unavailable" >&2
    exit 1
  fi
  secret_value=$(tr -d '\r\n' <"$secret_path")
  if [ -z "$secret_value" ]; then
    echo "required mounted file is empty" >&2
    exit 1
  fi
  printf '%s' "$secret_value"
}

database_password=$(read_secret "${AVIA_DATABASE_PASSWORD_FILE:-/run/secrets/app_database_password}")
export AVIA_DATABASE_URL="postgres://${AVIA_DATABASE_USER:-aviasurveil360}:${database_password}@${AVIA_DATABASE_HOST:-postgres}:${AVIA_DATABASE_PORT:-5432}/${AVIA_DATABASE_NAME:-aviasurveil360}?sslmode=disable"

unset database_password

if [ "${AVIA_SCHEDULER_LOOP:-true}" != "true" ]; then
  exec /app/scheduler
fi

shutdown=false
trap 'shutdown=true' TERM INT
while [ "$shutdown" = false ]; do
  /app/scheduler
  touch /tmp/scheduler-ready
  sleep "${AVIA_SCHEDULER_INTERVAL_SECONDS:-60}" &
  wait "$!" || true
done
