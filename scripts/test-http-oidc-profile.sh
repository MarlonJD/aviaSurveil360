#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPOSITORY_ROOT}/deploy/local/compose.test.yaml"
COMPOSE_PROJECT="aviasurveil360-task7-oidc"
RUNTIME_DIRECTORY="$(mktemp -d /private/tmp/aviasurveil360-task7-oidc.XXXXXX)"
SHARED_GO_CACHE="$(go env GOCACHE)"
TASK_GO_CACHE="${RUNTIME_DIRECTORY}/go-cache"
TASK_GO_TMP="${RUNTIME_DIRECTORY}/go-tmp"
API_PID=""
WORKER_PID=""
export COMPOSE_PROGRESS="plain"
mkdir -p "${TASK_GO_TMP}"
export GOTMPDIR="${TASK_GO_TMP}"

seed_task_go_cache() {
  mkdir -p "${TASK_GO_CACHE}"
  if [[ -d "${SHARED_GO_CACHE}" && "${SHARED_GO_CACHE}" != "${TASK_GO_CACHE}" ]]; then
    cp -al "${SHARED_GO_CACHE}/." "${TASK_GO_CACHE}/"
  fi
}

cleanup() {
  local status=$?
  trap - EXIT
  set +e
  if [[ -n "${WORKER_PID}" ]]; then
    kill "${WORKER_PID}" 2>/dev/null
    wait "${WORKER_PID}" 2>/dev/null
  fi
  if [[ -n "${API_PID}" ]]; then
    kill "${API_PID}" 2>/dev/null
    wait "${API_PID}" 2>/dev/null
  fi
  if [[ ${status} -ne 0 ]]; then
    for log_file in "${RUNTIME_DIRECTORY}"/*.log; do
      if [[ -f "${log_file}" ]]; then
        echo "--- ${log_file} ---" >&2
        tail -n 200 "${log_file}" >&2
      fi
    done
  fi
  env GOCACHE="${TASK_GO_CACHE}" go clean -cache
  docker compose --project-name "${COMPOSE_PROJECT}" --file "${COMPOSE_FILE}" down --volumes --remove-orphans
  rm -rf "${RUNTIME_DIRECTORY}"
  exit "${status}"
}
trap cleanup EXIT

docker compose --project-name "${COMPOSE_PROJECT}" --file "${COMPOSE_FILE}" down --volumes --remove-orphans
docker compose --project-name "${COMPOSE_PROJECT}" --file "${COMPOSE_FILE}" up --detach --wait postgres keycloak object-store

export AVIA_TEST_DATABASE_URL="postgres://aviasurveil:aviasurveil@127.0.0.1:55432/aviasurveil?sslmode=disable"
export AVIA_TEST_OIDC_ISSUER_URL="http://127.0.0.1:58080/realms/aviasurveil360"
export AVIA_TEST_OIDC_CLIENT_ID="aviasurveil360-local"
export AVIA_TEST_OIDC_CLIENT_SECRET="local-keycloak-client-secret"
export AVIA_TEST_OIDC_REDIRECT_URL="http://127.0.0.1:4174/auth/callback"
export AVIA_TEST_OBJECT_STORE_ENDPOINT="127.0.0.1:59001"
export AVIA_ENVIRONMENT="test"
export AVIA_DATABASE_URL="${AVIA_TEST_DATABASE_URL}"
export AVIA_HTTP_ADDRESS="127.0.0.1:58081"
export AVIA_OIDC_ISSUER_URL="${AVIA_TEST_OIDC_ISSUER_URL}"
export AVIA_OIDC_CLIENT_ID="${AVIA_TEST_OIDC_CLIENT_ID}"
export AVIA_OIDC_CLIENT_SECRET="${AVIA_TEST_OIDC_CLIENT_SECRET}"
export AVIA_OIDC_REDIRECT_URL="${AVIA_TEST_OIDC_REDIRECT_URL}"
export AVIA_SESSION_ENCRYPTION_KEY="MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="
export AVIA_ENABLE_CANONICAL_SEED="true"
export AVIA_ENABLE_CANONICAL_TEST_PROFILE="false"
export AVIA_OBJECT_STORE_ENDPOINT="${AVIA_TEST_OBJECT_STORE_ENDPOINT}"
export AVIA_OBJECT_STORE_ACCESS_KEY="avia-local-access"
export AVIA_OBJECT_STORE_SECRET_KEY="avia-local-secret-key"
export AVIA_OBJECT_STORE_TLS="false"
export AVIA_OBJECT_STORE_CORS_ORIGINS="http://127.0.0.1:4174"
export AVIA_OBJECT_STORE_QUARANTINE_BUCKET="avia-quarantine"
export AVIA_OBJECT_STORE_CANONICAL_BUCKET="avia-canonical"
export AVIA_SCANNER_MODE="deterministic-test"
export AVIA_WORKER_INTERVAL_MS="50"
export AVIA_HTTP_API_URL="http://127.0.0.1:58081"
export AVIA_HTTP_API_TARGET="${AVIA_HTTP_API_URL}"
export AVIA_HTTP_TEST_PROFILE=""
export GOCACHE="${TASK_GO_CACHE}"
seed_task_go_cache

go -C "${REPOSITORY_ROOT}/apps/api" build -o "${RUNTIME_DIRECTORY}/api" ./cmd/api
go -C "${REPOSITORY_ROOT}/apps/api" build -o "${RUNTIME_DIRECTORY}/worker" ./cmd/worker

(
  cd "${REPOSITORY_ROOT}/apps/api"
  exec "${RUNTIME_DIRECTORY}/api"
) >"${RUNTIME_DIRECTORY}/api.log" 2>&1 &
API_PID=$!

(
  cd "${REPOSITORY_ROOT}/apps/api"
  exec "${RUNTIME_DIRECTORY}/worker"
) >"${RUNTIME_DIRECTORY}/worker.log" 2>&1 &
WORKER_PID=$!

for _ in {1..120}; do
  if curl --fail --silent "${AVIA_HTTP_API_URL}/health/ready" >/dev/null; then
    break
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "API exited before readiness" >&2
    exit 1
  fi
  sleep 0.25
done
curl --fail --silent "${AVIA_HTTP_API_URL}/health/ready" >/dev/null
kill -0 "${WORKER_PID}"

npm --prefix "${REPOSITORY_ROOT}/apps/web" run typecheck
npm --prefix "${REPOSITORY_ROOT}/apps/web" run test:e2e:oidc
