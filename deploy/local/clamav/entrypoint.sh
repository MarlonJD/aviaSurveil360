#!/bin/sh
set -eu

# The upstream supervisor starts clamd and freshclam concurrently. On a fresh
# volume that can leave clamd serving the image-bundled database until the next
# update interval. Load current signatures synchronously before clamd starts.
freshclam --stdout --user=clamav

exec /init
