const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
function stubElement(id) {
  if (!elements.has(id)) elements.set(id, { id, value: '', innerHTML: '', hidden: false, style: {}, addEventListener() {}, appendChild() {} });
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

assert.ok(context.DEMO_STATE_VERSION >= 6, 'new governance state is versioned and migrated');
assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.finance.filter((item) => item.label).map((item) => item.label))),
  ['Finance Review'],
  'Finance exposes one operational workspace'
);
assert.equal(context.homeView('finance'), 'finance-review');

const state = context.freshState();
assert.deepEqual(JSON.parse(JSON.stringify(state.financeUi)), {
  query: '',
  status: 'pending',
  selectedPlanId: 'PLAN-2026-Q3-CABIN',
  decision: '',
  comment: '',
  openActionPlanId: ''
});

const plan = state.planningItems.find((item) => item.id === state.financeUi.selectedPlanId);
assert.ok(plan, 'the selected Finance plan exists');
assert.equal(plan.budget.currency, 'USD');
assert.equal(typeof plan.budget.requested, 'number');
assert.equal(
  plan.budget.lines.reduce((total, line) => total + line.amount, 0),
  plan.budget.requested,
  'budget lines reconcile to the requested total'
);
assert.equal(typeof context.applyFinancePlanningDecision, 'function');

context.applyApprovalDecision(plan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for budget review.'
});
let result = context.applyFinancePlanningDecision(plan, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget is available.'
});
assert.equal(result.ok, true);
assert.equal(context.approvalSummary(plan).ownerRole, 'executiveDirector');
assert.equal(plan.mockApprovalSignature, undefined, 'Finance cannot sign the plan');
assert.equal(plan.preparation.status, 'not_released', 'Finance cannot release the plan');

const returnState = context.freshState();
const returnPlan = returnState.planningItems[0];
context.applyApprovalDecision(returnPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for budget review.'
});
result = context.applyFinancePlanningDecision(returnPlan, {
  decision: 'return',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: ''
});
assert.equal(result.ok, false);
assert.match(result.message, /reason|comment/i);
result = context.applyFinancePlanningDecision(returnPlan, {
  decision: 'return',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Reconcile the travel estimate.'
});
assert.equal(result.ok, true);
assert.equal(context.approvalSummary(returnPlan).ownerRole, 'gm');
assert.equal(returnPlan.preparation.status, 'not_released');

const uiState = context.freshState();
const uiPlan = uiState.planningItems[0];
context.applyApprovalDecision(uiPlan, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Forwarded for budget review.'
});
context.state = uiState;
context.state.role = 'finance';
context.state.view = 'finance-review';
context.state.params = {};
let html = context.renderContent();
assert.match(html, /Finance Review/);
assert.match(html, /Budget Summary/);
assert.match(html, /Budget Breakdown/);
assert.match(html, /Supporting Documents/);
assert.match(html, /Comments &amp; History/);
assert.match(html, /Approve Budget/);
assert.match(html, /Return for Revision/);
assert.doesNotMatch(html, /Finance Dashboard|Approve &amp; Sign|Release to Department/);

context.handleAction('finance-review-tab', { getAttribute(name) { return name === 'data-tab' ? 'breakdown' : ''; } });
html = context.document.getElementById('app-root').innerHTML;
assert.match(html, /Travel/);
assert.match(html, /USD 12,500/);

context.handleAction('finance-review-choice', { getAttribute(name) { return name === 'data-decision' ? 'approve' : ''; } });
assert.equal(context.state.financeUi.decision, 'approve');
context.document.getElementById('finance-review-comment').value = 'Budget is available for the requested scope.';
context.handleAction('finance-review-confirm', { getAttribute(name) { return name === 'data-id' ? uiPlan.id : ''; } });
assert.equal(context.approvalSummary(uiPlan).ownerRole, 'executiveDirector');
assert.equal(uiPlan.preparation.status, 'not_released');
assert.equal(uiPlan.mockApprovalSignature, undefined);
assert.equal(context.state.notifications[0].role, 'executiveDirector');

context.state.view = 'planning';
context.normalizeViewForRole();
assert.equal(context.state.view, 'finance-review', 'legacy Finance planning route redirects to the focused workspace');

console.log('finance-review-workspace-smoke: ok');
