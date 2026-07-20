import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ledgerPath = path.join(repositoryRoot, "tests/parity/behavior-ledger.json");

function readLedger() {
  assert.ok(fs.existsSync(ledgerPath), "Behavior ledger is missing");
  return JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
}

function referencedTests(entry) {
  return [entry.legacyTest, entry.reactTest].flat().filter(Boolean);
}

test("the behavior ledger freezes only the authorized first executable slice", () => {
  const ledger = readLedger();
  assert.equal(ledger.product, "AviaSurveil360");
  assert.equal(ledger.version, 2);
  assert.equal(ledger.legacyRemovalAllowed, false);
  assert.equal(ledger.entries.length, 9, "Only the canonical scenario and eight role entries are authorized");

  const canonicalScenario = ledger.entries.find((entry) => entry.id === "canonical-cabin-scenario");
  assert.ok(canonicalScenario, "Canonical Cabin scenario entry is required");
  assert.equal(canonicalScenario.classification, "first-production");
  assert.equal(canonicalScenario.expectedStatus, "CLOSED");
  assert.equal(
    canonicalScenario.visibilityInvariant,
    "auditee-never-receives-internal-caa-note",
  );
  assert.ok(
    canonicalScenario.reactTest.includes("apps/web/tests/e2e/canonical-scenario.spec.ts"),
    "The canonical React entry must reference its normalized Playwright transcript",
  );

  const roleEntries = ledger.entries.filter((entry) => entry.action === "enter-role");
  assert.deepEqual(
    roleEntries.map((entry) => `${entry.role}:${entry.route}`),
    [
      "inspector:inspector-assignments",
      "leadInspector:lead-review",
      "manager:dashboard",
      "gm:gm-dashboard",
      "finance:finance-review",
      "executiveDirector:executive-dashboard",
      "auditee:service-provider-cap",
      "admin:templates",
    ],
  );
});

test("every ledger entry is executable and declares the parity contract", () => {
  const ledger = readLedger();
  const requiredFields = [
    "id",
    "classification",
    "role",
    "route",
    "action",
    "entityIdRule",
    "expectedStatus",
    "expectedOwner",
    "visibilityInvariant",
    "legacyTest",
    "reactTest",
    "acceptedDifference",
  ];

  for (const entry of ledger.entries) {
    for (const field of requiredFields) {
      assert.ok(Object.hasOwn(entry, field), `${entry.id ?? "entry"} is missing ${field}`);
    }
    assert.ok(["first-production", "later", "demo-only"].includes(entry.classification));
    for (const relativePath of referencedTests(entry)) {
      assert.ok(
        fs.existsSync(path.join(repositoryRoot, relativePath)),
        `${entry.id} references a missing executable test: ${relativePath}`,
      );
    }
  }
});

test("the legacy Vanilla demo remains the removal-blocking behavior oracle", () => {
  const ledger = readLedger();
  assert.equal(ledger.legacyRemovalAllowed, false);
  for (const requiredPath of ["index.html", "css/styles.css", "js/app.js", "js/data.js"]) {
    assert.ok(fs.existsSync(path.join(repositoryRoot, requiredPath)), `${requiredPath} must remain intact`);
  }
});
