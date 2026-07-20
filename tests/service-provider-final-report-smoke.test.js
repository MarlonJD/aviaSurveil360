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
const currentFinalReport = context.reportArtifactById('FR-2026-018', context.state);
currentFinalReport.status = 'issued';
currentFinalReport.issued = true;
currentFinalReport.locked = true;
currentFinalReport.issuedAt = '2026-07-10 16:00';
currentFinalReport.releasedAt = '2026-07-10 16:00';
context.state.view = 'service-provider-final-reports';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Final Reports/);
assert.match(html, /FR-2026-018/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Report ID/);
assert.match(html, /Audit\/Inspection/);
assert.match(html, /Date Released/);
assert.match(html, /Findings/);
assert.match(html, /View Report/);
assert.match(html, /Issued \/ locked/);
assert.match(html, /Download All/);

context.handleAction('service-provider-report-view', dataEl({ 'data-id': 'FR-2026-018' }));
html = elements.get('app-root').innerHTML;
assert.match(html, /Authorized Service Provider Summary/);
assert.match(html, /CAP_Evidence_Summary\.pdf/);
assert.doesNotMatch(html, /Internal CAA Note|enforcement deliberations|Inspector Workload/i);

context.state.view = 'service-provider-cap';
context.state.params = {};
context.render();
context.handleAction('service-provider-cap-respond', dataEl({ 'data-id': 'CAB-2026-012' }));
let modalHtml = elements.get('modal-host').innerHTML;
assert.match(modalHtml, /Upload Evidence/);
assert.match(modalHtml, /CAB-2026-012/);
context.pickedFiles['ev-file'] = { name: 'Training_Record_Evidence.pdf', size: '720 KB' };
context.document.getElementById('ev-note').value = 'Linked recurrent-check evidence for CAA review.';
context.handleAction('submit-evidence', dataEl({ 'data-id': 'CAB-2026-012' }));
assert.equal(context.state.findings.find((finding) => finding.id === 'CAB-2026-012').status, 'EVIDENCE_SUBMITTED');
assert.notEqual(context.state.findings.find((finding) => finding.id === 'CAB-2026-012').status, 'CLOSED');
assert.equal(context.state.notifications[0].role, 'inspector');

context.state.role = 'inspector';
context.state.view = 'findings';
context.state.params = { filter: 'capreview' };
context.state.selectedFilters.findings = 'capreview';
context.render();
html = elements.get('app-root').innerHTML;
assert.match(html, /Findings/);
assert.match(html, /All findings and CAPs from this inspection/);
assert.match(html, /SEC-2026-002/);
assert.match(html, /All Findings/);
assert.match(html, /Waiting for CAP/);
assert.match(html, /CAP Submitted/);
assert.match(html, /Access control log gaps at cargo gate/);
assert.match(html, /CAP &amp; Verification/);
assert.match(html, /Inspector Verification/);
assert.match(html, /Returned Flow/);
assert.match(html, /data-act="cap-review-row"/);
assert.doesNotMatch(html, /CAP Verification/);

console.log('service-provider-final-report-smoke: ok');
