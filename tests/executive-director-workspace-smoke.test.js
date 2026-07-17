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

const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

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
assert.match(
  css,
  /@media \(max-width: 1400px\)\s*\{[^}]*\.executive-report-queue table\s*\{[^}]*min-width:\s*1020px/s,
  'the ED Final Report register must keep its selected-row action inside the constrained desktop viewport'
);
assert.match(
  css,
  /@media \(max-width: 1050px\)[\s\S]*?\.executive-report-queue table\s*\{[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s,
  'the ED Final Report register must collapse duplicated columns before tablet row actions are clipped'
);
assert.equal(typeof context.applyExecutivePlanningDecision, 'function');
assert.equal(typeof context.executiveFinalReportProjection, 'function');
assert.equal(typeof context.applyExecutiveFinalReportDecision, 'function');
assert.equal(typeof context.finalReportDocumentHtml, 'function');
assert.equal(typeof context.finalReportPdfLines, 'function');

const defaultReportState = context.freshState();
const defaultEdReport = context.reportArtifactById('FR-2026-022', defaultReportState);
assert.ok(defaultEdReport);
assert.equal(defaultReportState.executiveDirectorUi.selectedReportId, 'FR-2026-022');
defaultReportState.role = 'executiveDirector';
defaultReportState.executiveDirectorUi.reportStatus = 'pending';
context.state = defaultReportState;
const defaultReportHtml = context.viewExecutiveFinalReportsWorkspace();
assert.match(defaultReportHtml, /FR-2026-022/);
assert.match(defaultReportHtml, /Approve Report/);
assert.match(defaultReportHtml, /Return for Revision/);
assert.match(defaultReportHtml, /Reject Report/);
assert.match(defaultReportHtml, /Refer for Enforcement Review/);

const planningState = context.freshState();
const plan = planningState.planningItems[0];
context.applyFinancePlanningDecision(plan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
context.applyApprovalDecision(plan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Finance-reviewed plan forwarded to Executive Director.'
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
context.applyFinancePlanningDecision(rejectedPlan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
context.applyApprovalDecision(rejectedPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Finance-reviewed plan forwarded to Executive Director.'
});
result = context.applyExecutivePlanningDecision(rejectedPlan, {
  decision: 'reject',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: ''
});
assert.equal(result.ok, false);
assert.match(result.message, /reason|comment/i);

const reportState = context.freshState();
const report = context.reportArtifactById('FR-2026-018', reportState);
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
const approvalReport = context.reportArtifactById('FR-2026-018', approvalState);
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
context.applyFinancePlanningDecision(dashboardPlan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget approved.'
});
context.applyApprovalDecision(dashboardPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Finance-reviewed plan forwarded to Executive Director.'
});
const dashboardReport = context.reportArtifactById('FR-2026-018', dashboardState);
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

dashboardState.view = 'executive-planning';
dashboardState.executiveDirectorUi.selectedPlanId = dashboardPlan.id;
dashboardState.executiveDirectorUi.openPlanActionId = dashboardPlan.id;
dashboardState.executiveDirectorUi.planDecision = 'approve_and_sign';
let planningHtml = context.viewExecutivePlanningWorkspace();
[
  'Draft',
  'Department Review',
  'GM Review',
  'Finance Review',
  'ED Final Approval',
  'Rejected / Returned',
  'Risk Category',
  'Review / Take Action',
  'Preview Full Plan',
  'Overview',
  'Plan Information',
  'Departments &amp; Scope',
  'Budget &amp; Resources',
  'Approval History',
  'Documents &amp; Notes',
  'This is not a real e-signature',
  'GM release remains a separate next step'
].forEach((text) => assert.match(planningHtml, new RegExp(text, 'i')));
assert.ok(planningHtml.includes('Approve &amp; Sign (Demo)'));
assert.equal(
  (planningHtml.match(/Review \/ Take Action/g) || []).length,
  dashboardState.planningItems.length,
  'each plan row has one action trigger'
);
assert.match(planningHtml, new RegExp(dashboardPlan.id));
assert.match(context.executivePlanDownloadText(dashboardPlan), new RegExp(dashboardPlan.id));
assert.match(context.executivePlanDownloadText(dashboardPlan), /Demo-only browser-generated document/);

dashboardState.executiveDirectorUi.planDecision = 'reject';
dashboardState.executiveDirectorUi.planComment = '';
planningHtml = context.viewExecutivePlanningWorkspace();
assert.match(planningHtml, /Rejection rationale \*/);
assert.match(planningHtml, /Rejection stops release/);

dashboardState.view = 'executive-final-reports';
dashboardState.executiveDirectorUi.selectedReportId = dashboardReport.id;
dashboardState.executiveDirectorUi.reportStatus = 'all';
dashboardState.executiveDirectorUi.reportTab = 'summary';
dashboardState.executiveDirectorUi.reportDecision = 'enforcement_referral';
dashboardState.executiveDirectorUi.enforcementCategory = 'Conditional Approval';
dashboardState.executiveDirectorUi.reportComment = 'Separate authorized review requested.';
let reportHtml = context.viewExecutiveFinalReportsWorkspace();
[
  'Total',
  'Pending Approval',
  'Approved',
  'Returned / Rejected',
  'Report ID',
  'Organization',
  'Audit Type',
  'Submitted By',
  'Submitted On',
  'Due Date',
  'Executive Summary',
  'Findings Summary',
  'Documents',
  'History',
  'Approve Report',
  'Refer for Enforcement Review',
  'Reject Report',
  'Return for Revision',
  'Referral / recommendation only',
  'Administrative Fee',
  'Partial Suspension',
  'Full Suspension',
  'Certificate/License Revocation',
  'Conditional Approval',
  'Other',
  'does not apply a sanction',
  'open Findings are never closed by report approval'
].forEach((text) => assert.match(reportHtml, new RegExp(text, 'i')));
assert.match(reportHtml, new RegExp(dashboardReport.id));
assert.match(reportHtml, /data-act="executive-report-preview"/);
assert.equal(
  (reportHtml.match(/>Review<\/button>/g) || []).length,
  context.executiveFinalReportProjection(dashboardState, { status: 'all' }).rows.length - 1,
  'each unselected report row exposes one Review action'
);

dashboardState.executiveDirectorUi.reportTab = 'findings';
reportHtml = context.viewExecutiveFinalReportsWorkspace();
assert.match(reportHtml, /Final Report approval does not accept CAP evidence or close any Finding/i);
assert.match(reportHtml, /CAB-2026-011/);

approvalState.role = 'executiveDirector';
approvalState.view = 'executive-final-reports';
approvalState.executiveDirectorUi.selectedReportId = approvalReport.id;
approvalState.executiveDirectorUi.reportStatus = 'all';
context.state = approvalState;
reportHtml = context.viewExecutiveFinalReportsWorkspace();
assert.match(reportHtml, /Terminal actions are disabled after a recorded decision/i);
assert.match(reportHtml, /not a real e-signature/i);
assert.doesNotMatch(reportHtml, /data-act="executive-report-confirm"/);

const approvalAudit = approvalState.audits.find((audit) => audit.id === approvalReport.auditId);
const approvalFindings = context.finalReportLinkedFindings(approvalState, approvalReport);
const approvalTeam = approvalState.inspectionTeams.find((team) => team.auditId === approvalReport.auditId);
const documentHtml = context.finalReportDocumentHtml(approvalReport, approvalAudit, approvalFindings, approvalTeam, approvalState);
[
  approvalReport.id,
  approvalReport.organization,
  approvalAudit.type,
  'CAA controlled demo copy',
  'Executive Summary',
  'Inspection Overview',
  'Findings Overview',
  'Conclusion',
  'Next Steps',
  'DEMO APPROVAL MARK',
  'not a real e-signature',
  'acceptance does not by itself close a Finding'
].forEach((text) => assert.match(documentHtml, new RegExp(text, 'i')));
assert.equal((documentHtml.match(/<tr>/g) || []).length - 1, approvalFindings.length, 'document table uses the selected report Finding selector');
assert.doesNotMatch(documentHtml, /SkyCargo Air|INS-2026-014|1 \/ 56/);

const pdfLines = context.finalReportPdfLines(approvalReport, approvalAudit, approvalFindings, approvalTeam, approvalState);
const pdf = context.buildAviaPdfDocument(pdfLines);
assert.match(pdf, /^%PDF-1\.4/);
assert.match(pdf, new RegExp(approvalReport.id));
assert.match(pdf, new RegExp(approvalReport.organization));
assert.match(pdf, /Demo-only browser-generated document/);
assert.match(pdf, /CAP acceptance does not close a Finding/i);
assert.equal(context.finalReportPdfFilename(approvalReport), 'Fly_Namibia_Final_Report_FR-2026-018.pdf');

approvalState.view = 'executive-report-preview';
approvalState.params = { reportId: approvalReport.id, returnView: 'executive-final-reports' };
approvalState.executiveDirectorUi.previewZoom = 100;
const previewHtml = context.viewExecutiveReportPreview();
assert.match(previewHtml, /Return to Final Report review/);
assert.match(previewHtml, /Sample page 1/);
assert.match(previewHtml, /Contents/);
assert.match(previewHtml, /75%/);
assert.match(previewHtml, /110%/);
assert.match(previewHtml, /Download PDF/);
assert.match(previewHtml, new RegExp(approvalReport.id));
assert.doesNotMatch(previewHtml, /1 \/ 56|SkyCargo Air|INS-2026-014/);
const leadDocumentHtml = context.viewLeadFinalReportDocument();
assert.match(leadDocumentHtml, new RegExp(approvalReport.id));
assert.match(leadDocumentHtml, new RegExp(approvalReport.organization));
assert.doesNotMatch(leadDocumentHtml, /SkyCargo Air|INS-2026-014/);

console.log('executive-director-workspace-smoke: ok');
