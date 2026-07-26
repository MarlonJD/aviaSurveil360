#!/bin/sh
set -eu

read_secret() {
  secret_path=$1
  if [ ! -f "$secret_path" ]; then
    echo "required mounted Keycloak credential is unavailable" >&2
    exit 1
  fi
  secret_value=$(tr -d '\r\n' <"$secret_path")
  if [ -z "$secret_value" ]; then
    echo "required mounted Keycloak credential is empty" >&2
    exit 1
  fi
  printf '%s' "$secret_value"
}

KC_DB_PASSWORD=$(read_secret "${KC_DB_PASSWORD_FILE:-/run/secrets/keycloak_database_password}")
KC_BOOTSTRAP_ADMIN_PASSWORD=$(read_secret "${KC_BOOTSTRAP_ADMIN_PASSWORD_FILE:-/run/secrets/keycloak_bootstrap_admin_password}")
export KC_DB_PASSWORD KC_BOOTSTRAP_ADMIN_PASSWORD

unset secret_value secret_path

exec /opt/keycloak/bin/kc.sh "$@"
