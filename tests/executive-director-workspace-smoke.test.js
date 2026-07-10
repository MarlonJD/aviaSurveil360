const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
function stubElement(id) {
  if (!elements.has(id)) elements.set(id, { id, value: '', innerHTML: '', hidden: false, style: {}, addEventListener() {} });
  return elements.get(id);
}
const context = {
  console,
  window: { scrollTo() {} },
  document: {
    body: { classList: { toggle() {} }, appendChild() {}, removeChild() {} },
    addEventListener() {},
    createElement() { return { style: {}, click() {} }; },
    getElementById: stubElement,
    querySelectorAll() { return []; }
  },
  setTimeout,
  clearTimeout
};
vm.createContext(context);

[
  'js/data.js',
  'js/helpers.js',
  'js/approval.js',
  'js/planning.js',
  'js/reports.js',
  'js/manager-workspaces.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.executiveDirector.filter((item) => item.label).map((item) => item.label))),
  ['Dashboard', 'Planning', 'Final Reports', 'Notifications', 'Settings']
);
assert.equal(context.homeView('executiveDirector'), 'executive-dashboard');
assert.equal(typeof context.applyExecutivePlanningDecision, 'function');
assert.equal(typeof context.executiveFinalReportProjection, 'function');
assert.equal(typeof context.applyExecutiveFinalReportDecision, 'function');

const planningState = context.freshState();
const plan = planningState.planningItems[0];
context.applyApprovalDecision(plan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for Finance Review.'
});
context.applyFinancePlanningDecision(plan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
let result = context.applyExecutivePlanningDecision(plan, {
  decision: 'approve_and_sign',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: 'Approved for the explicit release step.'
});
assert.equal(result.ok, true);
assert.equal(plan.approval.outcome, 'approved');
assert.match(plan.mockApprovalSignature.label, /demo|not a real e-signature/i);
assert.equal(plan.preparation.status, 'not_released');
assert.match(context.planningWorkspaceNextAction(plan).label, /GM Release to Department/);

const rejectedState = context.freshState();
const rejectedPlan = rejectedState.planningItems[0];
context.applyApprovalDecision(rejectedPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for Finance Review.'
});
context.applyFinancePlanningDecision(rejectedPlan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
result = context.applyExecutivePlanningDecision(rejectedPlan, {
  decision: 'reject',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: ''
});
assert.equal(result.ok, false);
assert.match(result.message, /reason|comment/i);

const reportState = context.freshState();
const report = reportState.managerReports.find((item) => item.id === 'FR-2026-018');
report.status = 'submitted_to_gm';
report.ownerRole = 'gm';
result = context.applyGeneralManagerReportDecision(
  reportState,
  report.id,
  'approve',
  'Reviewed and forwarded to the Executive Director.',
  { role: 'gm', name: context.ROLES.gm.user }
);
assert.equal(result.ok, true);
assert.equal(report.status, 'submitted_to_executive');
assert.equal(report.ownerRole, 'executiveDirector');
assert.notEqual(report.locked, true, 'GM cannot issue or lock a Final Report');

const findingSnapshot = JSON.stringify(reportState.findings);
const auditSnapshot = JSON.stringify(reportState.audits);
result = context.applyExecutiveFinalReportDecision(reportState, report.id, {
  decision: 'enforcement_referral',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  category: '',
  rationale: ''
});
assert.equal(result.ok, false);
assert.match(result.message, /category/i);
result = context.applyExecutiveFinalReportDecision(reportState, report.id, {
  decision: 'enforcement_referral',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  category: 'Conditional Approval',
  rationale: 'Refer for separate authorized review; no sanction is applied by this demo.'
});
assert.equal(result.ok, true);
assert.equal(result.report.enforcementReferral.recommendationOnly, true);
assert.equal(result.report.enforcementReferral.status, 'pending_authorized_review');
assert.equal(JSON.stringify(reportState.findings), findingSnapshot);
assert.equal(JSON.stringify(reportState.audits), auditSnapshot);

const approvalState = context.freshState();
const approvalReport = approvalState.managerReports.find((item) => item.id === 'FR-2026-018');
approvalReport.status = 'submitted_to_executive';
approvalReport.ownerRole = 'executiveDirector';
const openFindingCount = approvalState.findings.filter((finding) => finding.auditId === approvalReport.auditId && finding.status !== 'CLOSED').length;
result = context.applyExecutiveFinalReportDecision(approvalState, approvalReport.id, {
  decision: 'approve',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  rationale: ''
});
assert.equal(result.ok, true);
assert.equal(approvalReport.status, 'issued');
assert.equal(approvalReport.locked, true);
assert.match(approvalReport.mockApprovalSignature.label, /demo|not a real e-signature/i);
assert.equal(
  approvalState.findings.filter((finding) => finding.auditId === approvalReport.auditId && finding.status !== 'CLOSED').length,
  openFindingCount,
  'Final Report approval cannot close Findings'
);
assert.notEqual(
  approvalState.audits.find((audit) => audit.id === approvalReport.auditId).status,
  'Closed',
  'open follow-up work prevents audit closure'
);

const dashboardState = context.freshState();
const dashboardPlan = dashboardState.planningItems[0];
context.applyApprovalDecision(dashboardPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for Finance Review.'
});
context.applyFinancePlanningDecision(dashboardPlan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
const dashboardReport = dashboardState.managerReports.find((item) => item.id === 'FR-2026-018');
dashboardReport.status = 'submitted_to_executive';
dashboardReport.ownerRole = 'executiveDirector';
dashboardState.role = 'executiveDirector';
dashboardState.view = 'executive-dashboard';
dashboardState.params = {};
context.state = dashboardState;

const dashboardHtml = context.viewExecutiveDirectorDashboard();
[
  'Executive Director Dashboard',
  'Total Audits',
  'Audits in Progress',
  'Pending Approval',
  'Final Reports',
  'Overdue Actions',
  'Closed This Period',
  'Planning approvals',
  'Final Report approvals',
  dashboardPlan.id,
  dashboardReport.id,
  'Department overview',
  'informational only'
].forEach((text) => assert.match(dashboardHtml, new RegExp(text, 'i')));
assert.match(dashboardHtml, /data-act="executive-open-plan"/);
assert.match(dashboardHtml, /data-act="executive-open-report"/);
assert.match(dashboardHtml, /data-act="executive-dashboard-kpi"/);
assert.match(dashboardHtml, /do not make an automatic legal, enforcement, certificate suspension, Finding closure, or audit closure decision/i);

dashboardState.view = 'finding';
dashboardState.params = { findingId: 'SEC-2026-002' };
context.normalizeViewForRole();
assert.equal(dashboardState.view, 'executive-dashboard');
assert.deepEqual(JSON.parse(JSON.stringify(dashboardState.params)), {});

console.log('executive-director-workspace-smoke: ok');
