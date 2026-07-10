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
  ['Dashboard', 'Report Approvals', 'Departments', 'Risk Dashboard', 'Settings']
);
assert.equal(context.homeView('gm'), 'gm-dashboard');
assert.match(context.ROLE_DESC.gm, /final report/i);
assert.doesNotMatch(context.ROLE_DESC.gm, /planning|budget/i);
assert.match(context.ROLES.gm.question, /Final Reports/);

const state = context.freshState();
const finalReport = state.managerReports.find((report) => report.reportType === 'Final Report');
const preliminaryReport = state.managerReports.find((report) => report.reportType === 'Preliminary Report');
assert.ok(finalReport);
assert.ok(preliminaryReport);

finalReport.status = 'submitted_to_gm';
finalReport.ownerRole = 'gm';
const logCount = state.auditLog.length;
const notificationCount = state.notifications.length;

let result = context.applyGeneralManagerReportDecision(state, finalReport.id, 'return', '', 'General Manager');
assert.equal(result.ok, false);
assert.match(result.message, /comment/i);
assert.equal(finalReport.status, 'submitted_to_executive');

result = context.applyGeneralManagerReportDecision(state, finalReport.id, 'approve', 'Reviewed and forwarded to the Executive Director.', 'General Manager');
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
const preliminaryResult = context.applyGeneralManagerReportDecision(
  state,
  preliminaryReport.id,
  'approve',
  'Not permitted.',
  'General Manager'
);
assert.equal(preliminaryResult.ok, false);
assert.notEqual(preliminaryReport.status, 'submitted_to_executive');

const wrongStageState = context.freshState();
const wrongStageFinal = wrongStageState.managerReports.find((report) => report.reportType === 'Final Report');
const wrongStageResult = context.applyGeneralManagerReportDecision(
  wrongStageState,
  wrongStageFinal.id,
  'approve',
  'Too early.',
  'General Manager'
);
assert.equal(wrongStageResult.ok, false);
assert.equal(wrongStageFinal.status, 'pending_manager');
assert.notEqual(wrongStageFinal.locked, true);

const returnState = context.freshState();
const returnedFinal = returnState.managerReports.find((report) => report.reportType === 'Final Report');
returnedFinal.status = 'submitted_to_gm';
returnedFinal.ownerRole = 'gm';
const returned = context.applyGeneralManagerReportDecision(
  returnState,
  returnedFinal.id,
  'return',
  'Clarify the evidence verification summary.',
  'General Manager'
);
assert.equal(returned.ok, true);
assert.equal(returned.report.status, 'pending_manager');
assert.equal(returned.report.ownerRole, 'manager');
assert.notEqual(returned.report.locked, true);

const projectionState = context.freshState();
const projectionFinal = projectionState.managerReports.find((report) => report.reportType === 'Final Report');
projectionFinal.status = 'submitted_to_gm';
projectionFinal.ownerRole = 'gm';
const projection = context.generalManagerProjection(projectionState);
assert.equal(projection.pendingFinalReports, 1);
assert.equal(projection.reportsAwaitingApproval, 1);
assert.ok(Array.isArray(projection.departments));
assert.ok(Array.isArray(projection.approvalRows));
assert.equal(projection.approvalRows[0].id, projectionFinal.id);
assert.equal(projection.riskMatrix.length, 25);

context.state = projectionState;
context.state.role = 'gm';
context.state.view = 'gm-dashboard';
context.state.params = {};
context.render();
let html = elements.get('app-root').innerHTML;
[
  'General Manager Dashboard',
  'Pending Final Reports',
  'High Risk Findings',
  'Reports Awaiting Your Approval',
  'Overdue CAPs',
  'Department Overview',
  'Risk Heat Map',
  'Final Report Approval Queue'
].forEach((label) => assert.match(html, new RegExp(label)));

context.state.view = 'gm-report-approvals';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Report Approvals/);
assert.match(html, /Approve Final Report/);
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

context.state.view = 'manager-checklists';
context.render();
html = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'gm-dashboard');
assert.doesNotMatch(html, /Create Package|Publish New Version|Add Inspector/);

console.log('general-manager-workspace-smoke: ok');
