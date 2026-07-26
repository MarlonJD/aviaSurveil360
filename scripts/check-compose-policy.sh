#!/bin/sh
set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
compose_file="$repository_root/deploy/local/compose.yaml"

for profile in demo full test recovery; do
  docker compose --file "$compose_file" --profile "$profile" config --quiet
done

node --test "$repository_root/tests/local-compose-policy.test.mjs"

if rg --quiet --glob 'compose.yaml' --glob '*.example.yaml' \
  '(?i)(password|secret|token|credential)[[:space:]]*:[[:space:]]*[^/$[:space:]][^[:space:]]*' \
  "$repository_root/deploy/local"; then
  echo "plaintext credential-like value found in local runtime configuration" >&2
  exit 1
fi

echo "Local Compose policy checks passed."
