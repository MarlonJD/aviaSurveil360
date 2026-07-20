const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
const downloads = [];
const objectUrls = new Map();
let objectUrlSeq = 0;

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
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; },
      closest() { return null; }
    });
  }
  return elements.get(id);
}

function stubCreatedElement(tagName) {
  return {
    tagName,
    className: '',
    innerHTML: '',
    style: {},
    href: '',
    download: '',
    parentNode: null,
    click() {
      downloads.push({
        fileName: this.download,
        blob: objectUrls.get(this.href) || null
      });
    }
  };
}

function dataEl(attrs) {
  return {
    getAttribute(name) { return attrs[name] || ''; }
  };
}

class BlobStub {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options && options.type;
  }
}

const documentBody = {
  classList: { toggle() {} },
  appendChild(child) { child.parentNode = this; },
  removeChild(child) { child.parentNode = null; }
};

const context = {
  console,
  Blob: BlobStub,
  URL: {
    createObjectURL(blob) {
      const url = `blob:manager-findings-${++objectUrlSeq}`;
      objectUrls.set(url, blob);
      return url;
    },
    revokeObjectURL(url) { objectUrls.delete(url); }
  },
  window: { scrollTo() {} },
  document: {
    body: documentBody,
    addEventListener() {},
    createElement: stubCreatedElement,
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

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'findings-review';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Findings Review/);
assert.match(html, /AUD-2026-001/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Findings Overview/);
assert.match(html, /Findings List/);
assert.match(html, /By Department/);
assert.match(html, /By Level/);
assert.match(html, /Current Owner/);
assert.match(html, /Next Action/);
assert.match(html, /Due Date/);
assert.match(html, /manager-findings-mobile-list/);
assert.match(html, /data-mobile-record="AUD-2026-001"/);
assert.match(html, /Organization/);
assert.match(html, /Audit Date/);
assert.match(html, /Team Leader/);
assert.match(html, /Status/);
assert.match(html, /data-act="manager-findings-select"/);

const focusStart = html.indexOf('<section class="manager-findings-focus">');
const focusEnd = html.indexOf('</section>', focusStart);
assert.notEqual(focusStart, -1, 'management attention finding is rendered');
assert.notEqual(focusEnd, -1, 'management attention finding section is complete');
const focusHtml = html.slice(focusStart, focusEnd);
assert.match(focusHtml, /Current Owner/);
assert.match(focusHtml, /CAA Inspector/);
assert.match(focusHtml, /Next Action/);
assert.match(focusHtml, /Review CAP/);
assert.match(focusHtml, /Due Date/);
assert.match(focusHtml, /19 Jun 2026/);
assert.match(focusHtml, /<span>Status<\/span>/);
assert.match(focusHtml, /CAP Submitted/);
assert.match(focusHtml, /<span>Severity<\/span>/);
assert.match(focusHtml, /Level 1 Critical/);
assert.match(focusHtml, /<span>Related Audit<\/span>/);
assert.match(focusHtml, /AUD-2026-001/);
assert.match(focusHtml, /<span>Organization<\/span>/);
assert.match(focusHtml, /Fly Namibia/);
assert.match(focusHtml, /Level 1 manager attention/);
assert.match(focusHtml, /Department Manager/);
assert.match(focusHtml, /demo_recorded/);
assert.match(focusHtml, /Demo in-app event; no real delivery/);

const managerNavLabels = context.NAV.manager
  .filter((item) => item.label)
  .map((item) => item.label);
assert.ok(managerNavLabels.includes('Findings Review'));
assert.equal(managerNavLabels.includes('Open Findings'), false);

context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'list' }));
html = elements.get('app-root').innerHTML;
assert.equal(context.state.managerFindingsUi.tab, 'list');
assert.match(html, /CAB-2026-011/);
assert.match(html, /Level 1 Critical/);
assert.match(html, /Current Owner/);
assert.match(html, /Next Action/);
assert.match(html, /Due Date/);
assert.match(html, /Related Audit/);
assert.match(html, /Organization/);

const closedFindingMarker = html.indexOf('CAB-2026-014');
const closedFindingRowStart = html.lastIndexOf('<tr>', closedFindingMarker);
const closedFindingRowEnd = html.indexOf('</tr>', closedFindingMarker);
assert.notEqual(closedFindingMarker, -1, 'closed finding is rendered in the list');
assert.notEqual(closedFindingRowStart, -1, 'closed finding table row starts');
assert.notEqual(closedFindingRowEnd, -1, 'closed finding table row ends');
const closedFindingRowHtml = html.slice(closedFindingRowStart, closedFindingRowEnd);
assert.match(closedFindingRowHtml, /<b>20 Jun 2026<\/b>/, 'closed row keeps the actual Due Date');
assert.match(closedFindingRowHtml, /Closed 18 Jun 2026/, 'closure date remains visible as secondary metadata');
assert.match(closedFindingRowHtml, /Level 3 Minor|Observation/);

context.handleAction('manager-findings-select', dataEl({ 'data-id': 'AUD-2026-004' }));
context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'overview' }));
html = elements.get('app-root').innerHTML;
assert.equal(context.state.managerFindingsUi.selectedAuditId, 'AUD-2026-004');
const closedFocusStart = html.indexOf('<section class="manager-findings-focus">');
const closedFocusEnd = html.indexOf('</section>', closedFocusStart);
assert.notEqual(closedFocusStart, -1, 'closed-only inspection renders management attention');
assert.notEqual(closedFocusEnd, -1, 'closed-only management attention section is complete');
const closedFocusHtml = html.slice(closedFocusStart, closedFocusEnd);
assert.match(closedFocusHtml, /CAB-2026-004/);
assert.match(closedFocusHtml, /<span>Due Date<\/span><b>16 May 2026<\/b>/, 'closed focus keeps the actual Due Date');
assert.match(closedFocusHtml, /<small>Closed 10 May 2026<\/small>/, 'closed focus shows closure date as secondary metadata');

context.handleAction('manager-findings-select', dataEl({ 'data-id': 'AUD-2026-005' }));
assert.equal(context.state.managerFindingsUi.selectedAuditId, 'AUD-2026-005');
assert.match(elements.get('app-root').innerHTML, /SEC-2026-002/);

context.handleAction('manager-findings-filter', dataEl({
  'data-key': 'query',
  'data-value': 'not-a-real-inspection'
}));
html = elements.get('app-root').innerHTML;
assert.equal(context.state.managerFindingsUi.query, 'not-a-real-inspection');
assert.match(html, /No inspections match these filters\./);

context.handleAction('manager-findings-filter', dataEl({
  'data-key': 'query',
  'data-value': ''
}));
context.handleAction('manager-findings-select', dataEl({ 'data-id': 'AUD-2026-001' }));
context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'department' }));
assert.match(elements.get('app-root').innerHTML, /Department Breakdown/);
assert.match(elements.get('app-root').innerHTML, /Cabin Safety/);
context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'level' }));
assert.match(elements.get('app-root').innerHTML, /Level 3 Minor/);
assert.match(elements.get('app-root').innerHTML, /Observation/);

const stateBeforeSelectors = JSON.stringify(context.state);
const counts = context.managerFindingCounts(
  context.managerFindingsForAudit(context.state, 'AUD-2026-001')
);
assert.deepEqual(
  JSON.parse(JSON.stringify(counts)),
  { total: 4, critical: 1, major: 1, minor: 1, observations: 1, open: 2, inReview: 1, closed: 1 }
);
const rows = context.managerInspectionRows(context.state, {
  query: 'Fly Namibia',
  status: 'all',
  dateRange: 'all'
});
assert.ok(rows.some((row) => row.auditId === 'AUD-2026-001'));
assert.ok(rows.every((row) => row.organization === 'Fly Namibia'));
assert.equal(rows.find((row) => row.auditId === 'AUD-2026-001').counts.total, 4);
assert.equal(JSON.stringify(context.state), stateBeforeSelectors, 'selectors do not mutate state');

const todayRows = context.managerInspectionRows(context.state, {
  query: '',
  status: 'all',
  dateRange: 'today'
});
assert.deepEqual(
  JSON.parse(JSON.stringify(todayRows.map((row) => row.auditId))),
  ['AUD-2026-001']
);

context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'list' }));
context.handleAction('manager-findings-export', dataEl({}));
assert.equal(downloads.length, 1);
assert.equal(downloads[0].fileName, 'Fly_Namibia_Findings_Review.csv');
assert.equal(downloads[0].blob.type, 'text/csv;charset=utf-8');
const csv = downloads[0].blob.parts.join('');
assert.match(csv, /^\uFEFF/);
assert.match(csv, /AUD-2026-001/);
assert.match(csv, /Fly Namibia/);

context.handleAction('manager-findings-open-finding', dataEl({ 'data-id': 'CAB-2026-011' }));
assert.equal(context.state.view, 'finding');
assert.equal(context.state.params.findingId, 'CAB-2026-011');
assert.match(elements.get('app-root').innerHTML, /Finding CAB-2026-011/);

context.state.view = 'findings-review';
context.state.params = {};
context.render();
context.handleAction('manager-findings-open-report', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.view, 'reports-approval');
assert.equal(context.state.managerReportsUi.selectedReportId, 'PR-2026-018');
assert.equal(context.state.params.reportId, 'PR-2026-018');

console.log('department-manager-findings-smoke: ok');
