#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
API_ROOT="${REPOSITORY_ROOT}/apps/api"
TEMPORARY_ROOT="$(mktemp -d "${API_ROOT}/.sqlc-check.XXXXXX")"
TEMPORARY_RELATIVE="${TEMPORARY_ROOT#${API_ROOT}/}"
TEMPORARY_CONFIG="$(mktemp "${API_ROOT}/sqlc.check.XXXXXX")"

cleanup() {
  rm -rf "${TEMPORARY_ROOT}"
  rm -f "${TEMPORARY_CONFIG}"
}
trap cleanup EXIT

sed \
  -e "s|out: \"internal/organizations/store/postgres\"|out: \"${TEMPORARY_RELATIVE}/organizations\"|" \
  -e "s|out: \"internal/inspections/store/postgres\"|out: \"${TEMPORARY_RELATIVE}/inspections\"|" \
  "${API_ROOT}/sqlc.yaml" > "${TEMPORARY_CONFIG}"

(
  cd "${API_ROOT}"
  go tool sqlc generate -f "${TEMPORARY_CONFIG}"
)

for package in organizations inspections; do
  for generated_file in db.go models.go querier.go queries.sql.go; do
    diff -u \
      "${API_ROOT}/internal/${package}/store/postgres/${generated_file}" \
      "${TEMPORARY_ROOT}/${package}/${generated_file}"
  done
done

echo "sqlc-check: ok"
