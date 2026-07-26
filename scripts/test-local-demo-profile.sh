#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
RUNTIME_DIRECTORY="$(mktemp -d /private/tmp/aviasurveil360-plan3-demo.XXXXXX)"
AVIA_LOCAL_PROJECT="aviasurveil360-task-plan3-demo-$(date -u +%Y%m%d%H%M%S)-$$"
AVIASURVEIL_LOCAL_STATE_DIR="${RUNTIME_DIRECTORY}/local-state"
AVIA_LOCAL_HTTPS_PORT="${AVIA_LOCAL_DEMO_HTTPS_PORT:-$((18443 + RANDOM % 10000))}"
PLAYWRIGHT_REPORT="${RUNTIME_DIRECTORY}/playwright-report.json"
SUMMARY_PATH="${RUNTIME_DIRECTORY}/summary.json"
SUMMARY_CONTENT_TYPE="application/json"
STACK_STARTED="false"

export AVIA_LOCAL_PROJECT AVIASURVEIL_LOCAL_STATE_DIR AVIA_LOCAL_HTTPS_PORT
export AVIA_LOCAL_PUBLIC_ORIGIN="https://localhost:${AVIA_LOCAL_HTTPS_PORT}"
export COMPOSE_PROGRESS=plain

force_remove_task_owned_residue() {
  local resource_id
  local status=0
  while IFS= read -r resource_id; do
    if [[ -n "${resource_id}" ]] &&
      ! docker rm --force "${resource_id}"; then
      status=1
    fi
  done < <(
    docker ps --all --quiet \
      --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}"
  )
  while IFS= read -r resource_id; do
    if [[ -n "${resource_id}" ]] &&
      ! docker volume rm "${resource_id}"; then
      status=1
    fi
  done < <(
    docker volume ls --quiet \
      --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}"
  )
  while IFS= read -r resource_id; do
    if [[ -n "${resource_id}" ]] &&
      ! docker network rm "${resource_id}"; then
      status=1
    fi
  done < <(
    docker network ls --quiet \
      --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}"
  )
  while IFS= read -r resource_id; do
    if [[ -n "${resource_id}" ]] &&
      [[ "${resource_id}" == "${AVIA_LOCAL_PROJECT}_"* ]] &&
      ! docker volume rm "${resource_id}"; then
      status=1
    fi
  done < <(
    docker volume ls --quiet \
      --filter "name=^${AVIA_LOCAL_PROJECT}_"
  )
  while IFS= read -r resource_id; do
    if [[ -n "${resource_id}" ]] &&
      [[ "${resource_id}" == "${AVIA_LOCAL_PROJECT}_"* ]] &&
      ! docker network rm "${resource_id}"; then
      status=1
    fi
  done < <(
    docker network ls --quiet \
      --filter "name=^${AVIA_LOCAL_PROJECT}_"
  )
  return "${status}"
}

assert_no_task_owned_residue() {
  if docker ps --all --quiet \
    --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}" |
    grep -q .; then
    echo "task-owned residue: containers remain for ${AVIA_LOCAL_PROJECT}" >&2
    return 1
  fi
  if docker volume ls --quiet \
    --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}" |
    grep -q .; then
    echo "task-owned residue: volumes remain for ${AVIA_LOCAL_PROJECT}" >&2
    return 1
  fi
  if docker network ls --quiet \
    --filter "label=com.docker.compose.project=${AVIA_LOCAL_PROJECT}" |
    grep -q .; then
    echo "task-owned residue: networks remain for ${AVIA_LOCAL_PROJECT}" >&2
    return 1
  fi
  if docker volume ls --quiet \
    --filter "name=^${AVIA_LOCAL_PROJECT}_" |
    grep -q .; then
    echo "task-owned residue: unlabeled volumes remain for ${AVIA_LOCAL_PROJECT}" >&2
    return 1
  fi
  if docker network ls --quiet \
    --filter "name=^${AVIA_LOCAL_PROJECT}_" |
    grep -q .; then
    echo "task-owned residue: unlabeled networks remain for ${AVIA_LOCAL_PROJECT}" >&2
    return 1
  fi
}

cleanup() {
  local status=$?
  trap - EXIT
  set +e
  if [[ "${STACK_STARTED}" == "true" &&
    -f "${AVIASURVEIL_LOCAL_STATE_DIR}/.compose-project-owner" ]]; then
    "${REPOSITORY_ROOT}/scripts/local-stack.sh" down demo
    if [[ $? -ne 0 ]]; then
      echo "normal task-owned Compose cleanup failed; applying exact-label fallback" >&2
    fi
  fi
  force_remove_task_owned_residue
  if [[ $? -ne 0 ]]; then
    status=1
  fi
  assert_no_task_owned_residue
  if [[ $? -ne 0 ]]; then
    status=1
  fi
  rm -rf -- "${RUNTIME_DIRECTORY}"
  exit "${status}"
}
trap cleanup EXIT

"${REPOSITORY_ROOT}/scripts/check-local-image-evidence.sh" demo
STACK_STARTED="true"
"${REPOSITORY_ROOT}/scripts/local-stack.sh" up demo
curl --fail --silent --show-error --insecure \
  "https://localhost:${AVIA_LOCAL_HTTPS_PORT}/" >/dev/null

export AVIA_E2E_PROFILE=local-demo
export AVIA_E2E_BASE_URL="https://localhost:${AVIA_LOCAL_HTTPS_PORT}"
export AVIA_E2E_IGNORE_HTTPS_ERRORS=1
export AVIA_PLAYWRIGHT_OUTPUT_DIR="${RUNTIME_DIRECTORY}/playwright-results"
export PLAYWRIGHT_JSON_OUTPUT_NAME="${PLAYWRIGHT_REPORT}"

(
  cd "${REPOSITORY_ROOT}/apps/web"
  npx playwright test --project=local-demo --forbid-only --reporter=json
)

node -e '
  const fs = require("node:fs");
  const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const tests = [];
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) tests.push(test);
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
  const skipped = tests.filter((test) =>
    test.status === "skipped" ||
    (test.results ?? []).some((result) => result.status === "skipped")
  ).length;
  const summary = {
    contentType: process.argv[3],
    profile: "demo",
    composeProject: process.env.AVIA_LOCAL_PROJECT,
    expectedDirectLoads: 86,
    tests: tests.length,
    skipped,
    status: skipped === 0 ? "verified locally" : "blocked",
  };
  fs.writeFileSync(process.argv[2], `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  if (skipped !== 0 || tests.length === 0) process.exit(1);
' "${PLAYWRIGHT_REPORT}" "${SUMMARY_PATH}" "${SUMMARY_CONTENT_TYPE}"

echo "Clean demo profile verified locally; cleanup will assert zero task-owned residue."
