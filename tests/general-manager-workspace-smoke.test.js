const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();

function stubElement(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: '',
      checked: false,
      innerHTML: '',
      hidden: false,
      style: {},
      parentNode: null,
      classList: { toggle() {} },
      addEventListener() {},
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; },
      closest() { return null; }
    });
  }
  return elements.get(id);
}

const context = {
  console,
  window: { scrollTo() {} },
  document: {
    body: { classList: { toggle() {} }, appendChild() {}, removeChild() {} },
    addEventListener() {},
    createElement() { return { className: '', innerHTML: '', style: {}, parentNode: null, click() {} }; },
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
  'js/checklists.js',
  'js/inspection.js',
  'js/reports.js',
  'js/manager-workspaces.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.gm.map((item) => item.label))),
  ['Dashboard', 'Planning', 'Report Approvals', 'Departments', 'Risk Dashboard', 'Settings']
);
assert.equal(context.GENERAL_MANAGER_ALLOWED_VIEWS.planning, true);
assert.match(
  css,
  /@media \(max-width: 1600px\)\s*\{[^}]*\.gm-approval-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s,
  'the GM approval queue must stack before its row actions require horizontal scrolling'
);
assert.match(
  css,
  /@media \(max-width: 1100px\)[\s\S]*?\.gm-approval-table table\s*\{[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s,
  'the GM approval queue must collapse duplicated columns before tablet row actions are clipped'
);
assert.match(
  css,
  /@media \(max-width: 480px\)[\s\S]*?\.gm-table\s*\{[^}]*overflow-x:\s*hidden[^}]*\}[\s\S]*?\.gm-table table\s*\{[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s,
  'the GM dashboard tables must fit inside their cards at phone widths'
);
assert.match(
  css,
  /@media \(max-width: 480px\)[\s\S]*?\.gm-report-actions\s*\{[^}]*min-width:\s*0[^}]*flex-direction:\s*column/s,
  'the GM report decision controls must stack without widening the phone queue'
);
assert.equal(context.homeView('gm'), 'gm-dashboard');
assert.match(context.ROLE_DESC.gm, /intermediate|review|forward/i);
assert.doesNotMatch(context.ROLE_DESC.gm, /final report authorization/i);
assert.doesNotMatch(context.ROLE_DESC.gm, /planning|budget/i);
assert.match(context.ROLES.gm.question, /Reports/);

const defaultState = context.freshState();
const defaultGmReport = context.reportArtifactById('FR-2026-021', defaultState);
assert.ok(defaultGmReport);
assert.equal(defaultState.generalManagerUi.selectedReportId, 'FR-2026-021');
assert.ok(context.generalManagerProjection(defaultState).approvalRows.some((row) => row.id === 'FR-2026-021'));
context.state = defaultState;
context.state.role = 'gm';
let defaultHtml = context.viewGeneralManagerReportApprovals();
assert.match(defaultHtml, /FR-2026-021/);
assert.match(defaultHtml, /Open Report/);
assert.match(defaultHtml, /Return Report/);
assert.match(defaultHtml, /Forward to Executive Director/);

const state = context.freshState();
const finalReport = context.reportArtifactById('FR-2026-018', state);
const preliminaryReport = context.reportArtifactById('PR-2026-018', state);
assert.ok(finalReport);
assert.ok(preliminaryReport);

finalReport.status = 'submitted_to_gm';
finalReport.ownerRole = 'gm';
const logCount = state.auditLog.length;
const notificationCount = state.notifications.length;

const wrongActorBefore = JSON.stringify(state);
let wrongActorResult = context.applyGeneralManagerReportDecision(
  state,
  finalReport.id,
  'approve',
  'Wrong actor attempt.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(wrongActorResult.ok, false);
assert.match(wrongActorResult.message, /only the general manager/i);
assert.equal(JSON.stringify(state), wrongActorBefore);

let result = context.applyGeneralManagerReportDecision(state, finalReport.id, 'return', '', { role: 'gm', name: 'General Manager' });
assert.equal(result.ok, false);
assert.match(result.message, /comment/i);
assert.equal(finalReport.status, 'submitted_to_gm');

result = context.applyGeneralManagerReportDecision(state, finalReport.id, 'approve', 'Reviewed and forwarded to the Executive Director.', { role: 'gm', name: 'General Manager' });
assert.equal(result.ok, true);
assert.equal(result.report.status, 'submitted_to_executive');
assert.equal(result.report.ownerRole, 'executiveDirector');
assert.notEqual(result.report.locked, true);
assert.equal(result.report.finalAuthorizedBy, undefined);
assert.equal(result.report.finalAuthorizedAt, undefined);
assert.ok(result.report.history.some((entry) => /Executive Director/i.test(entry.action)));
assert.equal(state.auditLog.length, logCount + 1);
assert.equal(state.notifications.length, notificationCount + 1);

preliminaryReport.status = 'submitted_to_gm';
preliminaryReport.ownerRole = 'gm';
const preliminaryResult = context.applyGeneralManagerReportDecision(
  state,
  preliminaryReport.id,
  'approve',
  'Preliminary Report reviewed and forwarded.',
  { role: 'gm', name: 'General Manager' }
);
assert.equal(preliminaryResult.ok, true);
assert.equal(preliminaryReport.status, 'submitted_to_executive');
assert.equal(preliminaryReport.ownerRole, 'executiveDirector');
assert.equal(preliminaryReport.reportType, 'Preliminary Report');
assert.notEqual(preliminaryReport.locked, true);

const wrongStageState = context.freshState();
const wrongStageFinal = context.reportArtifactById('FR-2026-018', wrongStageState);
const wrongStageResult = context.applyGeneralManagerReportDecision(
  wrongStageState,
  wrongStageFinal.id,
  'approve',
  'Too early.',
  { role: 'gm', name: 'General Manager' }
);
assert.equal(wrongStageResult.ok, false);
assert.equal(wrongStageFinal.status, 'pending_manager');
assert.notEqual(wrongStageFinal.locked, true);

const returnState = context.freshState();
const returnedFinal = context.reportArtifactById('FR-2026-018', returnState);
returnedFinal.status = 'submitted_to_gm';
returnedFinal.ownerRole = 'gm';
const returned = context.applyGeneralManagerReportDecision(
  returnState,
  returnedFinal.id,
  'return',
  'Clarify the evidence verification summary.',
  { role: 'gm', name: 'General Manager' }
);
assert.equal(returned.ok, true);
assert.equal(returned.report.status, 'pending_manager');
assert.equal(returned.report.ownerRole, 'manager');
assert.notEqual(returned.report.locked, true);

const projectionState = context.freshState();
const projectionFinal = context.reportArtifactById('FR-2026-018', projectionState);
projectionFinal.status = 'submitted_to_gm';
projectionFinal.ownerRole = 'gm';
const projectionPreliminary = context.reportArtifactById('PR-2026-018', projectionState);
projectionPreliminary.status = 'submitted_to_gm';
projectionPreliminary.ownerRole = 'gm';
const projection = context.generalManagerProjection(projectionState);
assert.equal(projection.pendingPreliminaryReports, 1);
assert.equal(projection.pendingFinalReports, 2);
assert.equal(projection.reportsAwaitingApproval, 3);
assert.ok(Array.isArray(projection.departments));
assert.ok(Array.isArray(projection.approvalRows));
assert.ok(projection.approvalRows.some((row) => row.id === projectionFinal.id));
assert.equal(projection.approvalRows.find((row) => row.id === projectionPreliminary.id).reportType, 'Preliminary Report');
assert.ok(projection.approvalRows.some((row) => row.id === 'FR-2026-021'));
assert.equal(projection.riskMatrix.length, 25);

context.state = projectionState;
context.state.role = 'gm';
context.state.view = 'gm-dashboard';
context.state.params = {};
context.render();
let html = elements.get('app-root').innerHTML;
[
  'General Manager Dashboard',
  'Pending Preliminary Reports',
  'Pending Final Reports',
  'High Risk Findings',
  'Reports Awaiting Your Approval',
  'Overdue CAPs',
  'Department Overview',
  'Risk Heat Map',
  'Report Review Queue'
].forEach((label) => assert.match(html, new RegExp(label)));

context.state.view = 'gm-report-approvals';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Report Approvals/);
assert.match(html, /Selected Preliminary Report|Selected Final Report/);
assert.match(html, /Forward to Executive Director/);
assert.doesNotMatch(html, /Approve &amp; Issue|final authorization|issues and locks/i);
assert.match(html, /Return Report/);
assert.match(html, /Open Report/);
assert.doesNotMatch(html, /Add Inspector|Create Package|Publish New Version|manager-checklist-/);

context.state.view = 'gm-departments';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Departments/);
assert.match(html, /Department Overview/);
assert.doesNotMatch(html, /Edit Team|Add Inspector|Checklist Management/);

context.state.view = 'gm-risk';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Cross-Department Risk Dashboard/);
assert.match(html, /Risk Exposure Matrix/);
assert.match(html, /management indicator/i);
assert.doesNotMatch(html, /Create Package|Save Question|Edit Team/);

const planningState = context.freshState();
context.applyFinancePlanningDecision(planningState.planningItems[0], {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user }
});
context.state = planningState;
context.state.role = 'gm';
context.state.view = 'planning';
context.state.params = {};
context.render();
html = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'planning');
assert.match(html, /Forward to Executive Director/);
assert.match(html, /Return to Department Manager/);

context.state.view = 'manager-checklists';
context.render();
html = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'gm-dashboard');
assert.doesNotMatch(html, /Create Package|Publish New Version|Add Inspector/);

console.log('general-manager-workspace-smoke: ok');
