const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/reports.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
const report = context.state.auditReports[0];

assert.equal(report.approvalType, 'report');
assert.equal(context.approvalSummary(report).ownerRole, 'leadInspector');
assert.equal(report.finalLocked, false);

context.applyReportApprovalDecision(report, {
  decision: 'forward',
  actor: { role: 'leadInspector', name: context.ROLES.leadInspector.user },
  comment: 'Preliminary report submitted.'
});
assert.equal(context.approvalSummary(report).ownerRole, 'manager');

context.applyReportApprovalDecision(report, {
  decision: 'approve',
  actor: { role: 'manager', name: context.ROLES.manager.user },
  comment: 'DM approved with recommendation-only enforcement note.',
  enforcementRecommendation: { type: 'Warning', reason: 'Repeated training-record issue; human review required.' }
});
assert.equal(report.enforcementRecommendation.type, 'Warning');
assert.equal(context.approvalSummary(report).ownerRole, 'gm');

assert.throws(
  () => context.applyReportApprovalDecision(report, { decision: 'return', actor: { role: 'gm', name: context.ROLES.gm.user }, reason: '' }),
  /reason required/i,
  'Report return requires a reason'
);

context.applyReportApprovalDecision(report, {
  decision: 'return',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  reason: 'Clarify recommendation wording.'
});
assert.equal(context.approvalSummary(report).ownerRole, 'manager');

context.applyReportApprovalDecision(report, { decision: 'approve', actor: { role: 'manager', name: context.ROLES.manager.user }, comment: 'Clarified.' });
context.applyReportApprovalDecision(report, { decision: 'approve', actor: { role: 'gm', name: context.ROLES.gm.user }, comment: 'GM approved.' });
context.applyReportApprovalDecision(report, { decision: 'approve', actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user }, comment: 'ED approved final report.' });

assert.equal(report.finalLocked, true);
assert.equal(report.status, 'final_report_generated');
assert.match(report.mockDigitalSignature.label, /DEMO/);
assert.equal(context.auditById(report.auditId).status, 'Closed');

console.log('report-approval-smoke: ok');
