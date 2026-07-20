#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPORARY_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/aviasurveil360-contracts.XXXXXX")"

cleanup() {
  rm -rf "${TEMPORARY_ROOT}"
}
trap cleanup EXIT

node "${SCRIPT_DIR}/lint-openapi.mjs"
node --test "${REPOSITORY_ROOT}/api/openapi/tests/contract-examples.test.mjs"

AVIA_CONTRACT_OUTPUT_ROOT="${TEMPORARY_ROOT}" "${SCRIPT_DIR}/generate-contracts.sh"
diff -u \
  "${REPOSITORY_ROOT}/apps/web/src/generated/transport/api-types.ts" \
  "${TEMPORARY_ROOT}/apps/web/src/generated/transport/api-types.ts"

echo "contracts-check: ok"
