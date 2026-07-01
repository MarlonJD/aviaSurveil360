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
  'docs/agent-harness/index.md',
  'docs/agent-harness/output-contract.md',
  'docs/agent-harness/registry.md',
  'docs/agent-harness/verification-matrix.md',
  'docs/agent-harness/entropy-cleanup-checklist.md',
  'tests/harness-docs-smoke.test.js'
];

requiredFiles.forEach(assertFile);

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
  '../DEMO_BUILD_SUMMARY.md',
  '../08_DEMO_AND_BUILD_HANDOFF/AGENT_HARNESS_RUNBOOK.md'
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
