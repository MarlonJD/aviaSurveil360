#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPOSITORY_ROOT}/deploy/local/compose.test.yaml"
COMPOSE_PROJECT="aviasurveil360-task9"

cleanup() {
  docker compose --project-name "${COMPOSE_PROJECT}" --file "${COMPOSE_FILE}" down --volumes --remove-orphans
}
trap cleanup EXIT

cleanup
docker compose --project-name "${COMPOSE_PROJECT}" --file "${COMPOSE_FILE}" up --detach --wait postgres

export AVIA_TEST_DATABASE_URL="postgres://aviasurveil:aviasurveil@127.0.0.1:55432/aviasurveil?sslmode=disable"
export GOCACHE="${GOCACHE:-/private/tmp/aviasurveil360-go-cache}"
export GOMODCACHE="${GOMODCACHE:-/private/tmp/aviasurveil360-go-mod-cache}"

go -C "${REPOSITORY_ROOT}/apps/api" build ./cmd/api ./cmd/worker
go -C "${REPOSITORY_ROOT}/apps/api" test -race ./...
"${SCRIPT_DIR}/check-contracts.sh"
"${SCRIPT_DIR}/check-sqlc.sh"
