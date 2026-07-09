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
context.state.role = 'auditee';
context.state.view = 'reports';
context.state.params = { filter: 'received' };
context.state.selectedFilters.reports = 'received';
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Final Report/);
assert.match(html, /FR-2026-014/);
assert.match(html, /AVSEC Inspection/);
assert.match(html, /FlyNamibia/);
assert.match(html, /Finalized - Action Required/);
assert.match(html, /CAP Requirements \(5\)/);
assert.match(html, /Due Date Information/);
assert.match(html, /Level 1 = 14 days/);
assert.match(html, /Level 2 = 90 days/);
assert.match(html, /Level 3 = Observation/);
assert.match(html, /30 Jun 2026/);
assert.match(html, /14 Sep 2026/);
assert.match(html, /CAP Evidence Requirements \(5\)/);
assert.match(html, /Upload Evidence/);
assert.match(html, /Signage and awareness/);
assert.match(html, /Not Applicable/);

context.handleAction('service-report-tab', dataEl({ 'data-tab': 'findings' }));
html = elements.get('app-root').innerHTML;
assert.match(html, /Findings Summary/);
assert.match(html, /Staff training records/);
assert.match(html, /Screening procedure compliance/);

context.handleAction('service-report-submit-cap', dataEl({ 'data-id': 'F-014-01' }));
let modalHtml = elements.get('modal-host').innerHTML;
assert.match(modalHtml, /Upload CAP evidence - F-014-01/);
assert.match(modalHtml, /Access control to restricted areas/);
assert.match(modalHtml, /Due Date/);
assert.match(modalHtml, /30 Jun 2026/);
assert.match(modalHtml, /CAP closure evidence/);

context.handleAction('service-report-confirm-cap', dataEl({ 'data-id': 'F-014-01' }));
assert.ok(context.state.serviceProviderReportUi.submittedCaps['F-014-01']);
html = elements.get('app-root').innerHTML;
assert.match(html, /CAP Evidence Submitted/);
assert.match(html, /View Evidence/);
assert.equal(context.state.notifications[0].role, 'inspector');
assert.match(context.state.notifications[0].text, /FlyNamibia uploaded CAP closure evidence/);

context.state.role = 'inspector';
context.state.view = 'findings';
context.state.params = { filter: 'capreview' };
context.state.selectedFilters.findings = 'capreview';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Findings/);
assert.match(html, /All findings and CAPs from this inspection/);
assert.match(html, /SkyCargo Air/);
assert.match(html, /All Findings/);
assert.match(html, /Waiting for CAP/);
assert.match(html, /CAP Submitted/);
assert.match(html, /Perimeter Fence Security/);
assert.match(html, /CAP &amp; Verification/);
assert.match(html, /Inspector Verification/);
assert.match(html, /Returned Flow/);
assert.match(html, /data-act="cap-review-row"/);
assert.doesNotMatch(html, /CAP Verification/);

console.log('service-provider-final-report-smoke: ok');
