import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const openApiPath = path.join(repositoryRoot, "api/openapi/aviasurveil360.yaml");
const vocabularyPath = path.join(
  repositoryRoot,
  "docs/product-specs/data-and-rules/PRODUCTION_CONTRACT_VOCABULARY.md",
);
const examplesDirectory = path.join(
  repositoryRoot,
  "api/openapi/examples/canonical",
);

function readRequiredJson(filePath) {
  assert.ok(fs.existsSync(filePath), `Required contract file is missing: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveSchema(document, schema) {
  if (!schema?.$ref) return schema;
  const prefix = "#/components/schemas/";
  assert.ok(schema.$ref.startsWith(prefix), `Unsupported schema reference: ${schema.$ref}`);
  const name = schema.$ref.slice(prefix.length);
  assert.ok(document.components.schemas[name], `Unknown schema reference: ${name}`);
  return document.components.schemas[name];
}

function validateValue(document, schemaInput, value, pointer = "$") {
  const schema = resolveSchema(document, schemaInput);
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((candidate) => {
      try {
        validateValue(document, candidate, value, pointer);
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(matches.length, 1, `${pointer} must match exactly one union member`);
    return;
  }

  if (schema.enum) {
    assert.ok(schema.enum.includes(value), `${pointer} is not an approved enum value: ${value}`);
  }

  if (schema.type === "object") {
    assert.equal(typeof value, "object", `${pointer} must be an object`);
    assert.notEqual(value, null, `${pointer} must not be null`);
    assert.ok(!Array.isArray(value), `${pointer} must not be an array`);
    for (const key of schema.required ?? []) {
      assert.ok(Object.hasOwn(value, key), `${pointer}.${key} is required`);
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        assert.ok(allowed.has(key), `${pointer}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key) && value[key] !== null) {
        validateValue(document, child, value[key], `${pointer}.${key}`);
      }
    }
    return;
  }

  if (schema.type === "array") {
    assert.ok(Array.isArray(value), `${pointer} must be an array`);
    for (const [index, entry] of value.entries()) {
      validateValue(document, schema.items, entry, `${pointer}[${index}]`);
    }
    return;
  }

  if (schema.type === "string") assert.equal(typeof value, "string", `${pointer} must be a string`);
  if (schema.type === "integer") assert.ok(Number.isInteger(value), `${pointer} must be an integer`);
  if (schema.type === "number") assert.equal(typeof value, "number", `${pointer} must be a number`);
  if (schema.type === "boolean") assert.equal(typeof value, "boolean", `${pointer} must be a boolean`);
}

test("the minimal OpenAPI contract and canonical vocabulary exist", () => {
  assert.ok(fs.existsSync(vocabularyPath), "Canonical English vocabulary is missing");
  const document = readRequiredJson(openApiPath);
  assert.equal(document.openapi, "3.1.0");
  assert.equal(document.info.title, "AviaSurveil360 API");
  assert.match(fs.readFileSync(vocabularyPath, "utf8"), /Canonical transport values/);
});
test("every canonical JSON example validates against its declared schema", () => {
  const document = readRequiredJson(openApiPath);
  assert.ok(fs.existsSync(examplesDirectory), "Canonical example directory is missing");
  const files = fs.readdirSync(examplesDirectory).filter((file) => file.endsWith(".json"));
  assert.ok(files.length > 0, "At least one canonical JSON example is required");
  for (const file of files) {
    const envelope = readRequiredJson(path.join(examplesDirectory, file));
    assert.equal(typeof envelope.schema, "string", `${file} must declare a schema`);
    assert.ok(Object.hasOwn(envelope, "value"), `${file} must declare a value`);
    validateValue(document, { $ref: `#/components/schemas/${envelope.schema}` }, envelope.value);
  }
});

test("Auditee projections are closed and structurally omit internal CAA data", () => {
  const document = readRequiredJson(openApiPath);
  const schemas = document.components.schemas;
  const auditeeSchemaNames = Object.keys(schemas).filter((name) => name.startsWith("Auditee"));
  assert.ok(auditeeSchemaNames.length > 0, "At least one Auditee-specific schema is required");
  for (const name of auditeeSchemaNames) {
    const source = JSON.stringify(schemas[name]);
    assert.equal(schemas[name].additionalProperties, false, `${name} must reject unknown fields`);
    assert.doesNotMatch(source, /internalCaaNote|internalRisk|inspectorWorkload|enforcementDeliberation/i);
  }
});

test("sync request and response payloads use closed discriminated unions", () => {
  const document = readRequiredJson(openApiPath);
  const schemas = document.components.schemas;
  assert.ok(schemas.FieldSyncOperation.oneOf?.length >= 4, "FieldSyncOperation must be a typed union");
  assert.equal(schemas.FieldSyncOperation.discriminator?.propertyName, "commandType");
  assert.ok(schemas.AuthorizedSyncChange.oneOf?.length >= 4, "AuthorizedSyncChange must be a typed union");
  assert.equal(schemas.AuthorizedSyncChange.discriminator?.propertyName, "kind");
  assert.equal(schemas.AuthorizedConflictDescriptor.additionalProperties, false);
});

test("first-production route families have versioned paths, closed schemas, and canonical examples", () => {
  const document = readRequiredJson(openApiPath);
  for (const route of [
    "/v1/organizations",
    "/v1/planning/items",
    "/v1/planning/items/{id}/decisions",
    "/v1/configuration/checklist-template-versions",
    "/v1/configuration/reminder-rules",
    "/v1/audit-events",
  ]) {
    assert.ok(document.paths[route], `Missing first-production path: ${route}`);
  }
  for (const schemaName of [
    "OrganizationSummary",
    "PlanningItemView",
    "PlanningDecisionInput",
    "ChecklistTemplateVersionView",
    "ReminderRuleView",
    "AuditEventView",
  ]) {
    assert.equal(
      document.components.schemas[schemaName]?.additionalProperties,
      false,
      `${schemaName} must be a closed schema`,
    );
  }
  const files = fs.readdirSync(examplesDirectory);
  for (const example of [
    "organization-list.json",
    "planning-item.json",
    "checklist-template-version.json",
    "reminder-rules.json",
    "audit-events.json",
  ]) {
    assert.ok(files.includes(example), `Missing canonical route-family example: ${example}`);
  }
});
