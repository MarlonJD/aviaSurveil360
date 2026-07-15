const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/reports.js', 'js/manager-workspaces.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
const preliminary = context.reportArtifactById('PR-2026-018', context.state);
const finalReport = context.reportArtifactById('FR-2026-018', context.state);
assert.ok(preliminary);
assert.ok(finalReport);
assert.notEqual(preliminary, finalReport);

const finalBeforePreliminary = JSON.stringify(finalReport);
let result = context.applyManagerReportDecision(
  context.state,
  preliminary.id,
  'approve',
  'Department Manager released the Preliminary Report to the Service Provider.',
  { role: 'manager', name: context.ROLES.manager.user }
);
assert.equal(result.ok, true);
assert.equal(preliminary.status, 'released_to_service_provider');
assert.equal(JSON.stringify(finalReport), finalBeforePreliminary);

const preliminaryBeforeFinal = JSON.stringify(preliminary);
result = context.applyManagerReportDecision(
  context.state,
  finalReport.id,
  'approve',
  'Department Manager completed Final Report review.',
  { role: 'manager', name: context.ROLES.manager.user }
);
assert.equal(result.ok, true);
assert.equal(finalReport.status, 'submitted_to_gm');
result = context.applyGeneralManagerReportDecision(
  context.state,
  finalReport.id,
  'approve',
  'General Manager reviewed and forwarded the Final Report.',
  { role: 'gm', name: context.ROLES.gm.user }
);
assert.equal(result.ok, true);
assert.equal(finalReport.status, 'submitted_to_executive');
result = context.applyExecutiveFinalReportDecision(context.state, finalReport.id, {
  decision: 'approve',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user }
});
assert.equal(result.ok, true);
assert.equal(finalReport.status, 'issued');
assert.equal(finalReport.locked, true);
assert.match(finalReport.mockApprovalSignature.label, /DEMO mock approval mark - not a real e-signature/);
assert.equal(JSON.stringify(preliminary), preliminaryBeforeFinal);
assert.equal(context.auditById(finalReport.auditId).status, 'Follow-up Open');
assert.ok(context.state.findings.some((finding) => finding.auditId === finalReport.auditId && finding.status !== 'CLOSED'));

console.log('report-approval-smoke: ok');
