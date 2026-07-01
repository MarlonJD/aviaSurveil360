const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertFile(relativePath) {
  assert.equal(
    fs.existsSync(path.join(root, relativePath)),
    true,
    `Missing required harness file: ${relativePath}`
  );
}

const requiredFiles = [
  'docs/index.md',
  'docs/agent-harness/index.md',
  'docs/agent-harness/output-contract.md',
  'docs/agent-harness/registry.md',
  'docs/agent-harness/verification-matrix.md',
  'docs/agent-harness/entropy-cleanup-checklist.md',
  'docs/product-specs/index.md',
  'docs/demo-evidence/BUILD_SUMMARY.md',
  'docs/demo-handoff/AGENT_HARNESS_RUNBOOK.md',
  'tests/harness-docs-smoke.test.js'
];

requiredFiles.forEach(assertFile);

const docsIndex = read('docs/index.md');
[
  'agent-harness/index.md',
  'exec-plans/index.md',
  'exec-plans/tech-debt-tracker.md',
  'product-specs/index.md',
  'demo-handoff/',
  'demo-evidence/BUILD_SUMMARY.md'
].forEach((target) => {
  assert.match(
    docsIndex,
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `docs/index.md must link ${target}`
  );
});

[
  'docs/00_RESEARCH_AND_POSITIONING',
  'docs/01_PRODUCT_PLAN',
  'docs/02_UX_PLAN',
  'docs/03_WORKFLOWS',
  'docs/04_MODULES',
  'docs/05_SCREEN_SPECS',
  'docs/06_DATA_AND_RULES',
  'docs/07_ANALYTICS',
  'docs/08_DEMO_AND_BUILD_HANDOFF',
  'docs/09_SCENARIOS',
  'docs/10_REFERENCES',
  'docs/DEMO_BUILD_SUMMARY.md',
  'docs/DEMO_BUILD_SUMMARY.turkce.md'
].forEach((relativePath) => {
  assert.equal(
    fs.existsSync(path.join(root, relativePath)),
    false,
    `Legacy docs path should not exist: ${relativePath}`
  );
});

const planIndex = read('docs/exec-plans/index.md');
[
  'active/2026-06-29-agent-harness-readiness-completion-plan.md',
  'active/2026-06-29-aviasurveil-harness-engineering-adaptation-plan.md',
  'tech-debt-tracker.md'
].forEach((target) => {
  assert.match(
    planIndex,
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `docs/exec-plans/index.md must link ${target}`
  );
});

const harnessIndex = read('docs/agent-harness/index.md');
[
  'output-contract.md',
  'registry.md',
  'verification-matrix.md',
  'entropy-cleanup-checklist.md',
  '../exec-plans/index.md',
  '../exec-plans/tech-debt-tracker.md',
  '../demo-evidence/BUILD_SUMMARY.md',
  '../demo-handoff/AGENT_HARNESS_RUNBOOK.md'
].forEach((target) => {
  assert.match(
    harnessIndex,
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `docs/agent-harness/index.md must link ${target}`
  );
});

const outputContract = read('docs/agent-harness/output-contract.md');
[
  'verified locally',
  'blocked',
  'not run',
  'production-readiness not claimed'
].forEach((label) => {
  assert.match(
    outputContract,
    new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `output-contract.md must define status label: ${label}`
  );
});

const harnessDocs = [
  'docs/agent-harness/index.md',
  'docs/agent-harness/output-contract.md',
  'docs/agent-harness/registry.md',
  'docs/agent-harness/verification-matrix.md',
  'docs/agent-harness/entropy-cleanup-checklist.md'
];

const forbiddenClaims = [
  'production-ready',
  'real authentication is implemented',
  'real upload is implemented',
  'real AI service is implemented'
];

harnessDocs.forEach((relativePath) => {
  const content = read(relativePath);
  forbiddenClaims.forEach((claim) => {
    assert.doesNotMatch(
      content,
      new RegExp(claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `${relativePath} contains forbidden readiness claim: ${claim}`
    );
  });
});

console.log('harness-docs-smoke: ok');
