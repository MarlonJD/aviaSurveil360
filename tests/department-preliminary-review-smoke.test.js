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
      addEventListener() {},
      appendChild(child) { child.parentNode = this; this.child = child; },
      removeChild(child) { if (this.child === child) this.child = null; child.parentNode = null; },
      closest() { return null; }
    });
  }
  return elements.get(id);
}

function dataEl(attrs) {
  return {
    getAttribute(name) { return attrs[name] || ''; }
  };
}

const context = {
  console,
  window: { scrollTo() {} },
  document: {
    addEventListener() {},
    createElement() { return { className: '', innerHTML: '', style: {}, parentNode: null }; },
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
  'js/checklists.js',
  'js/inspection.js',
  'js/planning.js',
  'js/reports.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

Object.assign(context.state, context.freshState());
context.state.role = 'manager';
context.state.view = 'audit-reports';
context.state.params = { filter: 'preliminary' };
context.state.selectedFilters['audit-reports'] = 'preliminary';
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Preliminary Report/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Pending Your Approval/);
assert.match(html, /Submission & Next Steps/);
assert.match(html, /If CAP Required/);
assert.match(html, /Send to Service Provider/);
assert.match(html, /If No CAP Required/);
assert.match(html, /Send to General Manager for Approval/);
assert.match(html, /Request Changes/);

context.handleAction('department-prelim-tab', dataEl({ 'data-tab': 'findings' }));
html = elements.get('app-root').innerHTML;
assert.match(html, /Inspection & Findings/);
assert.match(html, /CAB-2026-011/);
assert.match(html, /Required/);

context.handleAction('department-prelim-approve', dataEl({ 'data-path': 'service_provider' }));
assert.equal(context.state.departmentPreliminaryReviewUi.approvedPath, 'service_provider');
assert.equal(context.state.notifications[0].role, 'auditee');
assert.match(context.state.notifications[0].text, /Service Provider portal/);
assert.equal(context.reportForAudit('AUD-2026-001').status, 'released_to_service_provider');
html = elements.get('app-root').innerHTML;
assert.match(html, /Sent to Service Provider/);

Object.assign(context.state, context.freshState());
context.state.role = 'manager';
context.state.view = 'audit-reports';
context.state.params = { filter: 'preliminary' };
context.state.selectedFilters['audit-reports'] = 'preliminary';
context.render();

context.handleAction('department-prelim-approve', dataEl({ 'data-path': 'gm' }));
assert.equal(context.state.departmentPreliminaryReviewUi.approvedPath, 'gm');
assert.equal(context.state.notifications[0].role, 'gm');
assert.match(context.state.notifications[0].text, /General Manager approval/);
assert.equal(context.reportForAudit('AUD-2026-001').status, 'submitted_to_gm');
html = elements.get('app-root').innerHTML;
assert.match(html, /Sent to General Manager/);

console.log('department-preliminary-review-smoke: ok');
