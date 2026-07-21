#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inspect } from "node:util";

const repoRoot = resolve(import.meta.dirname, "../../..");
const auditPath = resolve(repoRoot, "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md");
const sourcePath = resolve(repoRoot, "apps/web/src/parity/legacy-screen-source.json");
const startHeading = "## Preserved pre-remediation screen findings";
const endHeading = "## Prioritized issue list";

function normalizeCell(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function extractLegacyScreenInventory(markdown) {
  const start = markdown.indexOf(startHeading);
  const end = markdown.indexOf(endHeading);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Unable to locate the preserved pre-remediation audit table.");
  }

  const block = markdown.slice(start + startHeading.length, end);
  const rows = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map(normalizeCell);
    if (cells.length !== 6 || !/^\d+$/.test(cells[0])) continue;
    rows.push({
      auditId: `ui-audit-${cells[0].padStart(3, "0")}`,
      role: cells[1],
      screenName: cells[2],
    });
  }

  if (rows.length !== 86) {
    throw new Error(`Expected 86 audit rows, found ${rows.length}.`);
  }

  rows.forEach((row, index) => {
    const expected = `ui-audit-${String(index + 1).padStart(3, "0")}`;
    if (row.auditId !== expected) {
      throw new Error(`Expected ${expected} at row ${index + 1}, found ${row.auditId}.`);
    }
  });

  return rows;
}

function main(argv) {
  const check = argv.includes("--check");
  const extracted = extractLegacyScreenInventory(readFileSync(auditPath, "utf8"));
  if (!check) {
    process.stdout.write(`${JSON.stringify(extracted, null, 2)}\n`);
    return;
  }

  const committed = JSON.parse(readFileSync(sourcePath, "utf8"));
  if (inspect(committed, { depth: null }) !== inspect(extracted, { depth: null })) {
    throw new Error(
      [
        "legacy-screen-source.json does not match UI_SCREEN_AUDIT_2026-07-19.md.",
        "Run the extractor without --check to inspect the authoritative ordered rows.",
      ].join(" "),
    );
  }
}

main(process.argv.slice(2));
