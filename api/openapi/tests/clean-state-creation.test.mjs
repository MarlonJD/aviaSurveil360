import assert from "node:assert/strict";
import test from "node:test";

import { assembleOpenApi } from "../../../scripts/bundle-openapi.mjs";

const document = assembleOpenApi();

const requiredMutations = new Map([
  ["/v1/admin/organizations", "createAdminOrganization"],
  ["/v1/admin/checklist-template-versions", "createChecklistTemplateVersion"],
  ["/v1/admin/reminder-rules", "createReminderRule"],
  ["/v1/planning/intake-drafts", "createPlanningIntakeDraft"],
  ["/v1/audit-workspaces", "createAuditWorkspace"],
  ["/v1/report-versions", "createReportVersion"],
]);

test("clean-state resources are created through normal authorized mutations", () => {
  for (const [path, operationId] of requiredMutations) {
    const operation = document.paths[path]?.post;
    assert.ok(operation, `POST ${path} is required`);
    assert.equal(operation.operationId, operationId);
    assert.ok(operation.requestBody?.content?.["application/json"]?.schema);
    assert.ok(operation.responses?.["201"]?.content?.["application/json"]?.schema);
    assert.ok(operation.responses?.default, `${operationId} must expose Problem responses`);
  }
});

test("clean-state operations cannot expose test, reset, fixture, or seed semantics", () => {
  const serialized = JSON.stringify(
    [...requiredMutations.keys()].map((path) => document.paths[path]),
  ).toLowerCase();
  for (const forbidden of ["__test", "reset", "fixture", "seed", "canonical-header"]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} is forbidden`);
  }
});

test("clean-state request schemas require idempotency and expected-version boundaries", () => {
  const schemaNames = [
    "CreateAdminOrganizationInput",
    "CreateChecklistTemplateVersionInput",
    "CreateReminderRuleInput",
    "CreatePlanningIntakeDraftInput",
    "CreateAuditWorkspaceInput",
    "CreateReportVersionInput",
  ];
  for (const name of schemaNames) {
    const schema = document.components.schemas[name];
    assert.ok(schema, `${name} is required`);
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.required.includes("operationId"));
    assert.ok(schema.required.includes("idempotencyKey"));
  }
  assert.ok(
    document.components.schemas.CreateAuditWorkspaceInput.required.includes(
      "expectedPlanningRevision",
    ),
  );
});
