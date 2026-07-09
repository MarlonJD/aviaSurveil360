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

const state = context.freshState();
const rows = context.managerCapRows(state, {
  status: 'all',
  department: 'all',
  inspection: 'all',
  due: 'all'
});
assert.ok(rows.length >= 3);
const cap = rows.find((row) => row.id === 'CAP-2026-011');
assert.ok(cap);
assert.equal(cap.organization, 'Fly Namibia');
assert.equal(cap.findingId, 'CAB-2026-011');
assert.equal(cap.inspectionId, 'AUD-2026-001');
assert.equal(cap.department, 'Cabin Safety');
assert.ok(cap.dueDate);
assert.ok(cap.actionOwner);
assert.ok(Number.isFinite(cap.progress));
assert.ok(Array.isArray(cap.updates));
assert.ok(Array.isArray(cap.history));
assert.ok(Array.isArray(cap.documents));
assert.ok(Array.isArray(cap.notifications));

const metrics = context.managerCapMetrics(rows);
assert.equal(metrics.total, rows.length);
assert.equal(
  metrics.total,
  metrics.notSubmitted + metrics.inProgress + metrics.evidenceRequired + metrics.overdue + metrics.completed
);

const selectorBefore = JSON.stringify(state);
context.managerCapRows(state, { status: 'all', department: 'all', inspection: 'all', due: 'all' });
assert.equal(JSON.stringify(state), selectorBefore, 'CAP selectors do not mutate shared state');

const beforeHistory = cap.history.length;
const beforeFindingStatus = cap.findingStatus;
let result = context.addManagerCapUpdate(
  state,
  cap.id,
  'Evidence review scheduled.',
  'Department Manager'
);
assert.equal(result.ok, true);
const updated = context.managerCapById(state, cap.id);
assert.equal(updated.history.length, beforeHistory + 1);
assert.equal(updated.updates.at(-1).text, 'Evidence review scheduled.');
assert.equal(updated.findingStatus, beforeFindingStatus);
assert.notEqual(updated.findingStatus, 'CLOSED');

const beforeBlank = JSON.stringify(context.managerCapById(state, cap.id));
result = context.addManagerCapUpdate(state, cap.id, '   ', 'Department Manager');
assert.equal(result.ok, false);
assert.match(result.message, /required/i);
assert.equal(JSON.stringify(context.managerCapById(state, cap.id)), beforeBlank);

const noMatch = context.managerCapRows(state, {
  status: 'all',
  department: 'Not a department',
  inspection: 'all',
  due: 'all'
});
assert.equal(noMatch.length, 0);

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'cap-monitoring';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /CAP Monitoring/);
assert.match(html, /CAP ID/);
assert.match(html, /Related Finding/);
assert.match(html, /Due Date/);
assert.match(html, /Days Left \/ Overdue/);
assert.match(html, /Progress/);
assert.match(html, /aria-label="Open CAP actions for CAP-2026-011"/);
assert.match(html, /Status Overview/);
assert.match(html, /Overdue CAPs/);
assert.match(html, /Upcoming Due Dates/);

context.handleAction('manager-cap-menu', dataEl({ 'data-id': 'CAP-2026-011' }));
assert.equal(context.state.managerCapUi.selectedCapId, 'CAP-2026-011');
assert.equal(context.state.managerCapUi.drawerOpen, true);
html = elements.get('app-root').innerHTML;
assert.match(html, /CAP Detail/);
assert.match(html, /Overview/);
assert.match(html, /Action Plan/);
assert.match(html, /Updates/);
assert.match(html, /Documents/);
assert.match(html, /History/);
assert.match(html, /Add Update/);
assert.match(html, /CAP acceptance is not finding closure/);

context.handleAction('manager-cap-tab', dataEl({ 'data-tab': 'updates' }));
assert.equal(context.state.managerCapUi.tab, 'updates');
stubElement('manager-cap-update-text').value = '';
context.handleAction('manager-cap-add-update', dataEl({ 'data-id': 'CAP-2026-011' }));
assert.match(context.state.managerCapUi.validationMessage, /required/i);

stubElement('manager-cap-update-text').value = 'Manager confirmed the evidence review meeting.';
const statusBeforeUiUpdate = context.managerCapById(context.state, 'CAP-2026-011').findingStatus;
context.handleAction('manager-cap-add-update', dataEl({ 'data-id': 'CAP-2026-011' }));
assert.equal(context.state.managerCapUi.validationMessage, '');
assert.equal(context.managerCapById(context.state, 'CAP-2026-011').findingStatus, statusBeforeUiUpdate);
assert.match(elements.get('app-root').innerHTML, /Manager confirmed the evidence review meeting/);

context.handleAction('manager-cap-close', dataEl({}));
assert.equal(context.state.managerCapUi.drawerOpen, false);
assert.equal(context.state.managerCapUi.selectedCapId, 'CAP-2026-011');

context.handleAction('manager-cap-filter', dataEl({
  'data-key': 'department',
  'data-value': 'Not a department'
}));
assert.match(elements.get('app-root').innerHTML, /No CAPs match these filters\./);

console.log('manager-cap-monitoring-smoke: ok');
