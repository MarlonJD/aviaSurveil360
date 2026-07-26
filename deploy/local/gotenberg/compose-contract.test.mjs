import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const compose = readFileSync(
  new URL("../compose.yaml", import.meta.url),
  "utf8",
);

function serviceBlock(name) {
  const match = compose.match(
    new RegExp(`\\n  ${name}:([\\s\\S]*?)(?=\\n  [a-z][a-z0-9-]*:|\\nconfigs:)`),
  );
  assert.ok(match, `${name} service must exist`);
  return match[1];
}

test("the full worker uses the internal digest-bound Gotenberg renderer", () => {
  const worker = serviceBlock("worker");
  assert.match(worker, /AVIA_GOTENBERG_URL:\s*http:\/\/gotenberg:3000/);
  assert.match(worker, /AVIA_GOTENBERG_TIMEOUT:\s*30s/);
  assert.match(
    worker,
    /AVIA_GOTENBERG_RENDERER_HASH:\s*sha256:56c47f7b913f3b978554115a0191c4a9dcc2558f9090f27f3f13f28a7c2f8329/,
  );
  assert.match(worker, /gotenberg:\s*\n\s+condition:\s*service_healthy/);
});

test("Gotenberg remains internal, non-root, read-only, and health checked", () => {
  const gotenberg = serviceBlock("gotenberg");
  assert.match(gotenberg, /image:\s*gotenberg\/gotenberg:8\.23\.2@sha256:/);
  assert.match(gotenberg, /user:\s*"1001:1001"/);
  assert.match(gotenberg, /read_only:\s*true/);
  assert.match(gotenberg, /XDG_CONFIG_HOME:\s*\/tmp\/\.chromium/);
  assert.match(gotenberg, /XDG_CACHE_HOME:\s*\/tmp\/\.chromium/);
  assert.match(gotenberg, /curl,\s*--fail,\s*http:\/\/127\.0\.0\.1:3000\/health/);
  assert.doesNotMatch(gotenberg, /\n\s+ports:/);
});
