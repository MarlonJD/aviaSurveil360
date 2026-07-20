#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_ROOT="${AVIA_CONTRACT_OUTPUT_ROOT:-${REPOSITORY_ROOT}}"
GENERATOR="${REPOSITORY_ROOT}/apps/web/node_modules/.bin/openapi-typescript"
SPECIFICATION="${REPOSITORY_ROOT}/api/openapi/aviasurveil360.yaml"
TYPESCRIPT_OUTPUT="${OUTPUT_ROOT}/apps/web/src/generated/transport/api-types.ts"

if [[ ! -x "${GENERATOR}" ]]; then
  echo "openapi-typescript is not installed; run npm --prefix apps/web ci" >&2
  exit 1
fi

mkdir -p "$(dirname "${TYPESCRIPT_OUTPUT}")"
"${GENERATOR}" "${SPECIFICATION}" --output "${TYPESCRIPT_OUTPUT}"
