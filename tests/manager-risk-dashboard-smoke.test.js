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

const state = context.freshState();
const findingsBefore = JSON.stringify(state.findings);
const projection = context.managerRiskProjection(state, {
  dateRange: 'all',
  department: 'all',
  inspection: 'all',
  risk: 'all'
});

assert.equal(
  projection.totalFindings,
  projection.high + projection.medium + projection.low + projection.veryLow
);
assert.equal(projection.matrix.length, 25);
assert.ok(Array.isArray(projection.recentHighRiskFindings));
assert.ok(Array.isArray(projection.trend));
assert.ok(Array.isArray(projection.topRiskyAreas));
assert.ok(Array.isArray(projection.departmentDistribution));
assert.equal(JSON.stringify(state.findings), findingsBefore, 'risk projection must not mutate finding or closure state');

const csv = context.managerRiskCsv(projection);
assert.match(csv, /Fly Namibia/);
assert.match(csv, /Finding ID/);
assert.match(csv, /Risk Level/);

const empty = context.managerRiskProjection(state, {
  dateRange: 'all',
  department: 'Department That Does Not Exist',
  inspection: 'all',
  risk: 'all'
});
assert.equal(empty.totalFindings, 0);
assert.equal(empty.high, 0);
assert.equal(empty.medium, 0);
assert.equal(empty.low, 0);
assert.equal(empty.veryLow, 0);
assert.equal(empty.overdueCaps, 0);
assert.equal(empty.matrix.length, 25);

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'manager-risk';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
[
  'Risk Dashboard',
  'Export CSV',
  'Date Range',
  'Department',
  'Inspection',
  'Risk Level',
  'Total Findings',
  'High Risk',
  'Medium Risk',
  'Low Risk',
  'Very Low Risk',
  'Overdue CAPs',
  'Findings by Risk',
  'Risk Trend',
  'Risk Exposure Matrix',
  'Top Risky Areas',
  'Department Risk Distribution',
  'Overdue CAPs by Risk',
  'Recent High-Risk Findings'
].forEach((label) => assert.match(html, new RegExp(label)));
assert.match(html, /management indicator/i);
assert.match(html, /does not trigger automatic legal, enforcement, certificate, or closure/i);

context.state.managerRiskUi.department = 'Department That Does Not Exist';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /No risk records match these filters/i);

console.log('manager-risk-dashboard-smoke: ok');
