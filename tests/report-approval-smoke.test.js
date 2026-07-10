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
  comment: 'Department Manager released the preliminary report to the Service Provider.',
  enforcementRecommendation: { type: 'Warning', reason: 'Repeated training-record issue; human review required.' }
});
assert.equal(report.enforcementRecommendation.type, 'Warning');
assert.equal(context.approvalSummary(report).ownerRole, 'leadInspector');
assert.equal(report.finalLocked, false);
assert.equal(report.status, 'released_to_service_provider');

context.applyReportApprovalDecision(report, {
  decision: 'forward',
  actor: { role: 'leadInspector', name: context.ROLES.leadInspector.user },
  comment: 'Service Provider CAP completion window closed; prepare Final Report.'
});
assert.equal(context.approvalSummary(report).ownerRole, 'manager');
assert.equal(report.status, 'submitted_to_dm_final');

context.applyReportApprovalDecision(report, {
  decision: 'approve',
  actor: { role: 'manager', name: context.ROLES.manager.user },
  comment: 'Department Manager final review completed for General Manager review.'
});
assert.equal(context.approvalSummary(report).ownerRole, 'gm');
assert.equal(report.status, 'submitted_to_gm');

context.applyReportApprovalDecision(report, {
  decision: 'approve',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'General Manager reviewed and forwarded the Final Report.'
});
assert.equal(context.approvalSummary(report).ownerRole, 'executiveDirector');
assert.equal(report.status, 'submitted_to_ed');

context.applyReportApprovalDecision(report, {
  decision: 'approve',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: 'Executive Director / GM approval completed; final report issued.'
});
assert.equal(context.approvalSummary(report).ownerRole, null);

assert.equal(report.finalLocked, true);
assert.equal(report.status, 'final_report_generated');
assert.match(report.mockDigitalSignature.label, /DEMO/);
assert.notEqual(context.auditById(report.auditId).status, 'Closed');
assert.match(context.auditById(report.auditId).status, /Report Issued|Follow-up Open/);
assert.ok(context.state.findings.some((finding) => finding.auditId === report.auditId && finding.status !== 'CLOSED'));

console.log('report-approval-smoke: ok');
