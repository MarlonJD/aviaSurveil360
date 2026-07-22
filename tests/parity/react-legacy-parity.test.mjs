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

test("the behavior ledger covers the authorized first-production route families", () => {
  const ledger = readLedger();
  assert.equal(ledger.product, "AviaSurveil360");
  assert.equal(ledger.version, 4);
  assert.equal(ledger.legacyRemovalAllowed, false);
  assert.ok(ledger.entries.length >= 15, "Route actions must extend the canonical scenario and role entries");

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

  const routeActions = new Set(ledger.entries.map((entry) => entry.action));
  for (const action of [
    "view-organization-registry",
    "approve-planning-budget",
    "forward-plan-for-final-approval",
    "approve-plan",
    "release-plan",
    "view-versioned-configuration-and-audit-trail",
  ]) {
    assert.ok(routeActions.has(action), `Missing executable route action: ${action}`);
  }
});

test("the parity ledger freezes the 86/0 route scope and visible action ownership", () => {
  const ledger = readLedger();
  const expectedInteractionVerifiedSurfaceIds = [
    "role-select", "inspector-home", "audit-detail", "checklist-runner",
    "lead-home", "cap-review", "manager-home", "audit-plan", "report-preview",
    "organization-registry", "gm-home", "finance-home",
    "executive-home", "auditee-home", "admin-home",
  ];
  const expectedPresentationCorrectionPendingSurfaceIds = ["finding-detail", "evidence-review"];
  assert.equal(ledger.reactScope.reactParitySurfaceIds.length, 86);
  assert.equal(new Set(ledger.reactScope.reactParitySurfaceIds).size, 86);
  assert.equal(ledger.reactScope.legacyOnlyRows, 0);
  assert.equal(ledger.reactScope.legacyOnlyReactPath, "not-applicable");
  assert.equal(ledger.reactScope.legacyRemovalAllowed, false);
  assert.equal(ledger.reactScope.interactionVerifiedSurfaceIds.length, 15);
  assert.equal(ledger.reactScope.presentationCorrectionPendingSurfaceIds.length, 2);
  assert.equal(ledger.reactScope.routeContractOnlySurfaceIds.length, 69);
  assert.deepEqual(ledger.reactScope.interactionVerifiedSurfaceIds, expectedInteractionVerifiedSurfaceIds);
  assert.deepEqual(
    ledger.reactScope.presentationCorrectionPendingSurfaceIds,
    expectedPresentationCorrectionPendingSurfaceIds,
  );
  assert.deepEqual(
    ledger.reactScope.routeContractOnlySurfaceIds,
    ledger.reactScope.reactParitySurfaceIds.filter(
      (surfaceId) =>
        !expectedInteractionVerifiedSurfaceIds.includes(surfaceId) &&
        !expectedPresentationCorrectionPendingSurfaceIds.includes(surfaceId),
    ),
  );
  const evidenceCategories = [
    ...ledger.reactScope.interactionVerifiedSurfaceIds,
    ...ledger.reactScope.presentationCorrectionPendingSurfaceIds,
    ...ledger.reactScope.routeContractOnlySurfaceIds,
  ];
  assert.equal(new Set(evidenceCategories).size, 86, "Evidence categories must be disjoint");
  assert.deepEqual(new Set(evidenceCategories), new Set(ledger.reactScope.reactParitySurfaceIds));
  assert.ok(ledger.visibleActionOwnership.length >= 3);
  for (const ownership of ledger.visibleActionOwnership) {
    assert.ok(ownership.id);
    assert.ok(ownership.surfaceIds.length > 0);
    assert.doesNotThrow(() => new RegExp(ownership.namePattern));
    assert.ok(["local", "session", "backend-or-local"].includes(ownership.boundary));
    assert.ok(ownership.durableEffect.length > 20);
    assert.ok(fs.existsSync(path.join(repositoryRoot, ownership.evidence)));
    if (ownership.id === "declared-route-and-workflow-actions") {
      assert.deepEqual(ownership.surfaceIds, ledger.reactScope.interactionVerifiedSurfaceIds);
    }
    if (ownership.id === "shell-reset" || ownership.id === "shell-role-exit") {
      assert.deepEqual(
        ownership.surfaceIds,
        ledger.reactScope.interactionVerifiedSurfaceIds.filter((surfaceId) => surfaceId !== "role-select"),
      );
    }
  }
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
