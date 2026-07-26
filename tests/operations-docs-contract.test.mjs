import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repositoryRoot = new URL("..", import.meta.url).pathname;
const operationsRoot = join(repositoryRoot, "docs", "operations");

function readRequiredDocument(fileName) {
  const path = join(operationsRoot, fileName);
  assert.equal(existsSync(path), true, `${fileName} must exist`);
  return readFileSync(path, "utf8");
}

function tableAfterHeading(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  assert.notEqual(start, -1, `missing ${heading} section`);
  const lines = markdown.slice(start).split("\n");
  const tableStart = lines.findIndex((line) => line.startsWith("|"));
  assert.notEqual(tableStart, -1, `${heading} must contain a table`);
  const selected = [];
  for (const line of lines.slice(tableStart)) {
    if (!line.startsWith("|")) break;
    selected.push(line);
  }
  const rows = selected.map((line) =>
    line
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim()),
  );
  const headers = rows[0];
  return rows.slice(2).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );
}

test("service objectives have measurable targets, owners, units, and histogram boundaries", () => {
  const objectives = tableAfterHeading(
    readRequiredDocument("SERVICE_OBJECTIVES.md"),
    "Objective catalog",
  );
  const objectiveIDs = new Set(objectives.map((row) => row.ID));
  for (const required of [
    "api-read-latency",
    "api-command-latency",
    "outbox-ready-age",
    "job-attempts",
    "backup-freshness",
    "candidate-rpo",
    "candidate-rto",
  ]) {
    assert.equal(objectiveIDs.has(required), true, `missing objective ${required}`);
  }
  for (const objective of objectives) {
    assert.match(objective.Target, /\d/);
    assert.notEqual(objective.Owner, "");
    assert.notEqual(objective.Unit, "");
    if (objective.Metric.includes("duration")) {
      assert.match(objective["Histogram boundaries"], /^\d+(?:,\d+)+$/);
    }
  }
});

test("telemetry catalog rejects sensitive and unbounded metric attributes", () => {
  const telemetry = tableAfterHeading(
    readRequiredDocument("TELEMETRY_CONTRACT.md"),
    "Signal catalog",
  );
  const forbidden = [
    "password",
    "token",
    "cookie",
    "evidence.bytes",
    "message.body",
    "internal_caa_note",
  ];
  for (const signal of telemetry) {
    assert.match(signal.Name, /^[a-z][a-z0-9_.]+$/);
    assert.match(signal.Kind, /^(span|metric|log)$/);
    assert.notEqual(signal.Owner, "");
    assert.match(signal["Redaction class"], /^(public|operational|restricted)$/);
    const attributes = signal["Allowed attributes"]
      .split(",")
      .map((attribute) => attribute.trim().toLowerCase())
      .filter(Boolean);
    for (const attribute of attributes) {
      assert.equal(
        forbidden.some((fragment) => attribute.includes(fragment)),
        false,
        `${signal.Name} exposes forbidden attribute ${attribute}`,
      );
      if (signal.Kind === "metric") {
        assert.doesNotMatch(attribute, /(^|\.)(user|subject|entity|record|finding|audit)\.?id$/);
      }
    }
  }
});

test("every alert has a duration, recovery condition, owner, runbook, and fixture", () => {
  const alerts = tableAfterHeading(readRequiredDocument("ALERT_CATALOG.md"), "Alert catalog");
  assert.ok(alerts.length >= 6);
  for (const alert of alerts) {
    assert.match(alert.Expression, /\S/);
    assert.match(alert.Duration, /^\d+[smh]$/);
    assert.match(alert.Severity, /^(warning|critical)$/);
    assert.notEqual(alert.Owner, "");
    assert.match(alert.Runbook, /^docs\/operations\/runbooks\/[A-Z0-9_]+\.md$/);
    assert.match(alert["Deduplication key"], /^[a-z0-9-]+$/);
    assert.match(alert.Fixture, /^[a-z0-9-]+$/);
    assert.match(alert.Recovery, /\S/);
  }
});

test("every declared operational owner has an escalation and review cadence", () => {
  const owners = tableAfterHeading(readRequiredDocument("OWNERSHIP.md"), "Ownership catalog");
  assert.ok(owners.length >= 5);
  for (const owner of owners) {
    assert.notEqual(owner.Scope, "");
    assert.notEqual(owner.Owner, "");
    assert.notEqual(owner.Escalation, "");
    assert.match(owner["Review cadence"], /^(weekly|monthly|quarterly|per release)$/);
  }
});
