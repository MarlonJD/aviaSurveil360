import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const compose = readFileSync(new URL("../compose.yaml", import.meta.url), "utf8");
const entrypoint = readFileSync(new URL("./entrypoint.sh", import.meta.url), "utf8");

test("fresh signatures are loaded before the long-running clamd process starts", () => {
  const update = entrypoint.indexOf("freshclam --stdout --user=clamav");
  const start = entrypoint.indexOf("exec /init");
  assert.ok(update >= 0, "missing synchronous freshclam update");
  assert.ok(start > update, "clamd supervisor starts before the signature update");
  assert.match(compose, /source:\s*clamav_entrypoint/);
  assert.match(compose, /\/opt\/aviasurveil360\/clamav-entrypoint\.sh/);
  assert.match(compose, /signature-updates/);
});
