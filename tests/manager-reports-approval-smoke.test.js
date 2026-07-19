const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
const downloads = [];
const objectUrls = new Map();
let objectUrlSequence = 0;

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
  Blob: class BlobStub {
    constructor(parts, options) { this.parts = parts; this.type = options && options.type; }
  },
  URL: {
    createObjectURL(blob) {
      const url = `blob:manager-report-${++objectUrlSequence}`;
      objectUrls.set(url, blob);
      return url;
    },
    revokeObjectURL() {}
  },
  window: { scrollTo() {} },
  document: {
    body: {
      classList: { toggle() {} },
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; }
    },
    addEventListener() {},
    createElement() {
      return {
        href: '', download: '', parentNode: null, className: '', innerHTML: '', style: {},
        click() { downloads.push({ fileName: this.download, blob: objectUrls.get(this.href) || null }); }
      };
    },
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

const identityState = context.freshState();
assert.equal(context.reportArtifactById('PR-2026-018', identityState).id, 'PR-2026-018');
assert.equal(context.reportArtifactById('FR-2026-018', identityState).id, 'FR-2026-018');
assert.notEqual(
  context.reportArtifactById('PR-2026-018', identityState),
  context.reportArtifactById('FR-2026-018', identityState)
);

const preliminaryState = context.freshState();
const finalBeforePreliminaryDecision = JSON.stringify(
  context.managerReportById(preliminaryState, 'FR-2026-018')
);
let result = context.applyManagerReportDecision(
  preliminaryState,
  'PR-2026-018',
  'approve',
  'Approved for General Manager review.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, true);
assert.equal(result.report.status, 'submitted_to_gm');
assert.equal(result.report.ownerRole, 'gm');
assert.equal(result.report.managerDecision, 'approve');
assert.ok(result.report.managerDecisionAt);
assert.match(result.report.history.at(-1).action, /forwarded Preliminary Report to General Manager/);
assert.equal(
  JSON.stringify(context.managerReportById(preliminaryState, 'FR-2026-018')),
  finalBeforePreliminaryDecision,
  'a Preliminary Report decision must not mutate the Final Report artifact'
);

const finalState = context.freshState();
const preliminaryBeforeFinalDecision = JSON.stringify(
  context.managerReportById(finalState, 'PR-2026-018')
);
result = context.applyManagerReportDecision(
  finalState,
  'FR-2026-018',
  'approve',
  'Approved for final governance review.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, true);
assert.equal(result.report.status, 'submitted_to_gm');
assert.equal(result.report.ownerRole, 'gm');
assert.notEqual(result.report.status, 'issued');
assert.notEqual(result.report.locked, true);
assert.match(result.report.history.at(-1).action, /General Manager/);
assert.equal(
  JSON.stringify(context.managerReportById(finalState, 'PR-2026-018')),
  preliminaryBeforeFinalDecision,
  'a Final Report decision must not mutate the Preliminary Report artifact'
);

const noCapState = context.freshState();
context.managerReportById(noCapState, 'PR-2026-018').capRequired = false;
result = context.applyManagerReportDecision(
  noCapState,
  'PR-2026-018',
  'approve',
  'No CAP required; forward to the configured next stage.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, true);
assert.equal(result.report.status, 'submitted_to_gm');
assert.equal(result.report.ownerRole, 'gm');

const revisionState = context.freshState();
const revisionBefore = JSON.stringify(context.managerReportById(revisionState, 'PR-2026-018'));
result = context.applyManagerReportDecision(
  revisionState,
  'PR-2026-018',
  'revision',
  '',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, false);
assert.match(result.message, /comment/i);
assert.equal(JSON.stringify(context.managerReportById(revisionState, 'PR-2026-018')), revisionBefore);

result = context.applyManagerReportDecision(
  revisionState,
  'PR-2026-018',
  'revision',
  'Clarify the evidence summary and resubmit.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, true);
assert.equal(result.report.status, 'revision_requested');
assert.equal(result.report.ownerRole, 'leadInspector');

const returnState = context.freshState();
result = context.applyManagerReportDecision(
  returnState,
  'FR-2026-018',
  'return',
  'Return to the Lead Inspector for correction.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, true);
assert.equal(result.report.status, 'returned_to_lead');
assert.equal(result.report.ownerRole, 'leadInspector');

result = context.applyManagerReportDecision(
  returnState,
  'FR-2026-018',
  'approve',
  'Attempt a second manager decision.',
  { role: 'manager', name: 'Mehmet Kaya' }
);
assert.equal(result.ok, false);
assert.match(result.message, /already|pending/i);

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'reports-approval';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Reports Approval/);
assert.match(html, /Preliminary Reports/);
assert.match(html, /Final Reports/);
assert.match(html, /Pending My Approval/);
assert.match(html, /PR-2026-018/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Summary/);
assert.match(html, /Findings/);
assert.match(html, /Attachments/);
assert.match(html, /Comments/);
assert.match(html, /History/);
assert.match(html, /Request Revision/);
assert.match(html, /Return Report/);
assert.match(html, /Approve Report/);
assert.match(html, /Download PDF/);

context.handleAction('manager-report-download', dataEl({
  'data-id': 'PR-2026-018',
  'data-variant': 'report'
}));
assert.equal(downloads.length, 1);
assert.equal(downloads[0].fileName, 'Fly_Namibia_Preliminary_Report_PR-2026-018.pdf');
assert.equal(downloads[0].blob.type, 'application/pdf');
assert.match(downloads[0].blob.parts.join(''), /^%PDF-1\.4/);

context.handleAction('manager-report-select', dataEl({ 'data-id': 'FR-2026-018' }));
assert.equal(context.state.managerReportsUi.selectedReportId, 'FR-2026-018');
assert.match(elements.get('app-root').innerHTML, /Final Report/);

stubElement('manager-report-comment').value = '';
context.handleAction('manager-report-decision', dataEl({
  'data-id': 'FR-2026-018',
  'data-decision': 'revision'
}));
assert.match(context.state.managerReportsUi.validationMessage, /comment/i);
assert.equal(context.managerReportById(context.state, 'FR-2026-018').status, 'pending_manager');

stubElement('manager-report-comment').value = 'Forward for configured final authorized approval.';
context.handleAction('manager-report-decision', dataEl({
  'data-id': 'FR-2026-018',
  'data-decision': 'approve'
}));
assert.equal(context.managerReportById(context.state, 'FR-2026-018').status, 'submitted_to_gm');
assert.notEqual(context.managerReportById(context.state, 'FR-2026-018').locked, true);
assert.ok(context.state.notifications.some((item) => item.role === 'gm'));

console.log('manager-reports-approval-smoke: ok');
