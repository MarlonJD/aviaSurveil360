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

function dataEl(attrs) {
  return {
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : '';
    }
  };
}

const context = {
  console,
  window: { scrollTo() {}, matchMedia() { return { matches: true }; } },
  document: {
    body: { classList: { toggle() {} }, appendChild() {}, removeChild() {} },
    addEventListener() {},
    createElement() { return { className: '', innerHTML: '', style: {}, parentNode: null, click() {} }; },
    getElementById: stubElement,
    querySelectorAll() { return []; },
    querySelector() { return { scrollIntoView() {} }; }
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

const expectedLabels = [
  'Dashboard',
  'Planning',
  'Audits',
  'Reports Approval',
  'Risk Dashboard',
  'Inspection Team',
  'Findings Review',
  'CAP Monitoring',
  'Checklist Management'
];
assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.manager.map((item) => item.label))),
  expectedLabels
);

const expectedRoutes = [
  'dashboard',
  'planning',
  'calendar',
  'reports-approval',
  'manager-risk',
  'inspection-team',
  'findings-review',
  'cap-monitoring',
  'manager-checklists'
];
assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.manager.map((item) => item.view))),
  expectedRoutes
);

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'dashboard';
context.state.params = {};

const projection = context.managerDashboardProjection(context.state);
assert.equal(projection.organization, 'Fly Namibia');
assert.ok(projection.totalAudits >= projection.inProgressAudits);
assert.ok(projection.reportsAwaitingApproval >= 2);
assert.ok(projection.openFindings >= projection.recentHighRiskFindings.length);
assert.ok(projection.teamMembers >= 1);
assert.ok(Array.isArray(projection.recentHighRiskFindings));
assert.ok(Array.isArray(projection.upcomingAudits));
assert.ok(projection.recentHighRiskFindings.every((finding) => finding.status !== 'CLOSED'));

const projectionBefore = JSON.stringify(context.state);
context.managerDashboardProjection(context.state);
assert.equal(JSON.stringify(context.state), projectionBefore, 'dashboard projection must not mutate shared state');

context.render();
let html = elements.get('app-root').innerHTML;
assert.match(html, /Department Manager Dashboard/);
assert.match(html, /Total Audits/);
assert.match(html, /Reports Awaiting Approval/);
assert.match(html, /Open Findings/);
assert.match(html, /CAPs In Progress/);
assert.match(html, /Overdue CAPs/);
assert.match(html, /Inspection Team/);
assert.match(html, /Recent High-Risk Findings/);
assert.match(html, /Upcoming Audits/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Planning/);
assert.doesNotMatch(context.viewManagerDashboard(), /Calendar|Documents|Corrective Actions/);

const taskRoutes = Array.from(
  context.viewManagerDashboard().matchAll(/class="manager-dashboard-task[^"]*"[^>]*data-act="go"[^>]*data-view="([^"]+)"/g),
  (match) => match[1]
);
assert.deepEqual(taskRoutes, expectedRoutes.slice(1));
taskRoutes.forEach((route) => {
  assert.ok(expectedRoutes.includes(route), `${route} is present in the manager navigation allowlist`);
});

context.handleAction('nav', dataEl({ 'data-view': 'reports-approval' }));
assert.equal(context.state.view, 'reports-approval');
assert.match(elements.get('app-root').innerHTML, /Reports Approval/);

context.handleAction('nav', dataEl({ 'data-view': 'planning' }));
assert.equal(context.state.view, 'planning');
assert.match(elements.get('app-root').innerHTML, /Department Planning/);
assert.match(elements.get('app-root').innerHTML, /Track planning approvals, release acceptance and department preparation in one panel/);
assert.match(elements.get('app-root').innerHTML, /Planning Command Center/);
assert.match(elements.get('app-root').innerHTML, /Scope &amp; Risk Driver/);
assert.match(elements.get('app-root').innerHTML, /Budget &amp; Resources/);
assert.match(elements.get('app-root').innerHTML, /Decision Path/);
assert.match(elements.get('app-root').innerHTML, /Planning Queue/);
assert.match(elements.get('app-root').innerHTML, /<b>3<\/b> active plans/);
assert.match(elements.get('app-root').innerHTML, /Awaiting approval — Finance Review/);
assert.match(elements.get('app-root').innerHTML, /No Department Manager action required yet/);
assert.match(elements.get('app-root').innerHTML, /Q4 Flight Operations Surveillance Plan/);
assert.match(elements.get('app-root').innerHTML, /Q4 Airworthiness Records Review Plan/);
assert.match(elements.get('app-root').innerHTML, /Your plan revision is required/);
assert.match(elements.get('app-root').innerHTML, /View details/);
assert.doesNotMatch(elements.get('app-root').innerHTML, /Open planning/);
assert.match(elements.get('app-root').innerHTML, /USD 12,500/);
assert.match(elements.get('app-root').innerHTML, /Caner Yildiz/);
assert.match(elements.get('app-root').innerHTML, /Submit to Finance Review|Waiting for Finance Review/);

context.handleAction('planning-queue-open', dataEl({
  'data-id': 'PLAN-2026-Q4-FOPS',
  'data-tab': 'overview'
}));
assert.equal(context.state.params.planningId, 'PLAN-2026-Q4-FOPS');
assert.match(elements.get('app-root').innerHTML, /Planning Command Center[\s\S]*Q4 Flight Operations Surveillance Plan/);
assert.match(elements.get('app-root').innerHTML, /planning-queue-row is-info is-selected/);

context.handleAction('planning-queue-open', dataEl({
  'data-id': 'PLAN-2026-Q4-AIRW',
  'data-tab': 'approval'
}));
assert.equal(context.state.params.planningId, 'PLAN-2026-Q4-AIRW');
assert.equal(context.state.params.tab, 'approval');
assert.match(elements.get('app-root').innerHTML, /Planning Command Center[\s\S]*Q4 Airworthiness Records Review Plan/);
assert.match(elements.get('app-root').innerHTML, /Decision Panel/);

console.log('manager-navigation-dashboard-smoke: ok');
