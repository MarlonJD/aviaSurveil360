import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specificationPath = path.join(repositoryRoot, "api/openapi/aviasurveil360.yaml");
const document = JSON.parse(fs.readFileSync(specificationPath, "utf8"));

const expectedPaths = [
  "/health/live",
  "/health/ready",
  "/v1/assignments",
  "/v1/inspection-packages/{id}",
  "/v1/inspection-packages/{id}/checkout",
  "/v1/checklist-responses/{responseId}",
  "/v1/checklists/{auditId}/submit",
  "/v1/checklists/{auditId}/reopen",
  "/v1/potential-findings",
  "/v1/potential-findings/{id}/decisions",
  "/v1/findings",
  "/v1/findings/{id}",
  "/v1/findings/{id}/evidence",
  "/v1/findings/{id}/authorized-closure",
  "/v1/caps",
  "/v1/caps/{capRevisionId}/reviews",
  "/v1/inspection-attachments/{id}/uploads",
  "/v1/inspection-attachments/uploads/{uploadId}/complete",
  "/v1/evidence/uploads",
  "/v1/evidence/uploads/{uploadId}/complete",
  "/v1/evidence/{evidenceVersionId}/reviews",
  "/v1/report-versions/{id}",
  "/v1/report-versions/{id}/decisions",
  "/v1/dashboards/manager",
  "/v1/sync/operations",
  "/v1/sync/changes",
];

assert.equal(document.openapi, "3.1.0");
assert.deepEqual(Object.keys(document.paths), expectedPaths);
assert.ok(
  document.paths["/health/ready"].get.responses["503"],
  "readiness must contractually fail closed with a 503 problem response",
);

const schemas = document.components.schemas;
const referencePrefix = "#/components/schemas/";

function resolve(schema) {
  if (!schema?.$ref) return schema;
  assert.ok(schema.$ref.startsWith(referencePrefix), `Unsupported reference ${schema.$ref}`);
  const name = schema.$ref.slice(referencePrefix.length);
  assert.ok(schemas[name], `Unknown schema ${name}`);
  return schemas[name];
}

function unionMembers(schema) {
  const resolved = resolve(schema);
  return resolved.oneOf ? resolved.oneOf.map(resolve) : [resolved];
}

function requiresOperationId(schema) {
  const resolved = resolve(schema);
  if (resolved.oneOf) return resolved.oneOf.every(requiresOperationId);
  if (resolved.required?.includes("operationId") && resolved.properties?.operationId) return true;
  if (resolved.required?.includes("operation") && resolved.properties?.operation) {
    return requiresOperationId(resolved.properties.operation);
  }
  return false;
}

for (const [route, pathItem] of Object.entries(document.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    assert.ok(operation.operationId, `${method.toUpperCase()} ${route} needs operationId`);
    assert.ok(operation.responses, `${method.toUpperCase()} ${route} needs responses`);
    if (!["post", "put", "patch", "delete"].includes(method)) continue;
    const schema = operation.requestBody?.content?.["application/json"]?.schema;
    assert.ok(schema, `${method.toUpperCase()} ${route} needs a JSON request schema`);
    assert.ok(requiresOperationId(schema), `${operation.operationId} must require operationId`);
  }
}

for (const decisionSchemaName of [
  "ReturnOrDismissPotentialFindingInput",
  "ConvertPotentialFindingInput",
  "ReviewCapInput",
  "ReviewEvidenceInput",
  "AuthorizedCloseInput",
  "DecideReportInput",
  "ReopenChecklistInput",
]) {
  const schema = schemas[decisionSchemaName];
  assert.ok(
    Object.keys(schema.properties).some((key) => /^expected[A-Z].*Revision$/.test(key)),
    `${decisionSchemaName} must name its expected revision`,
  );
}

for (const [name, schema] of Object.entries(schemas)) {
  if (!name.startsWith("Auditee")) continue;
  assert.equal(schema.additionalProperties, false, `${name} must be closed`);
  assert.doesNotMatch(
    JSON.stringify(schema),
    /internalCaaNote|internalRisk|inspectorWorkload|enforcementDeliberation/i,
  );
}

assert.equal(schemas.FieldSyncOperation.discriminator.propertyName, "commandType");
assert.equal(schemas.AuthorizedSyncChange.discriminator.propertyName, "kind");
assert.equal(schemas.AuthorizedConflictDescriptor.additionalProperties, false);

console.log("openapi-lint: ok");
