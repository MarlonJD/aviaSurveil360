const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
function stubElement(id) {
  if (!elements.has(id)) elements.set(id, { id, value: '', innerHTML: '', hidden: false, style: {}, addEventListener() {} });
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

assert.deepEqual(
  JSON.parse(JSON.stringify(context.NAV.auditee.filter((item) => item.label).map((item) => item.label))),
  ['Corrective Actions (CAP)', 'Preliminary Reports', 'Final Reports', 'Messages', 'Documents', 'Settings']
);
assert.equal(context.homeView('auditee'), 'service-provider-cap');
assert.equal(typeof context.serviceProviderVisibleFindings, 'function');
assert.equal(typeof context.serviceProviderCapRows, 'function');
assert.equal(typeof context.serviceProviderVisibleReports, 'function');
assert.equal(typeof context.serviceProviderRequiredAction, 'function');

const state = context.freshState();
assert.equal(state.serviceProviderUi.cap.selectedFindingId, 'CAB-2026-001');
assert.equal(state.serviceProviderUi.preliminaryReports.selectedReportId, 'PR-2026-018');
assert.equal(state.serviceProviderUi.finalReports.selectedReportId, 'FR-2026-018');

state.findings.push({
  id: 'PRIVATE-OTHER-ORG',
  auditId: 'AUD-OTHER',
  orgId: 'ORG-SKY',
  title: 'Other organization private finding',
  severity: 1,
  status: 'WAITING_CAP',
  dueDate: '2026-07-01',
  internalNotes: [{ text: 'Internal CAA Note' }]
});
let findings = context.serviceProviderVisibleFindings(state, 'ORG-XYZ');
assert.ok(findings.every((finding) => finding.orgId === 'ORG-XYZ'));
assert.equal(findings.some((finding) => finding.id === 'PRIVATE-OTHER-ORG'), false);

const capRows = context.serviceProviderCapRows(state, 'ORG-XYZ', {
  group: 'all', auditId: 'all', level: 'all', status: 'all', query: ''
});
assert.ok(capRows.length > 0);
capRows.forEach((row) => {
  assert.ok(row.level, 'CAP rows expose Level');
  assert.ok(row.status, 'CAP rows expose canonical Status');
  assert.ok(row.dueDate, 'CAP rows expose configured Due Date or Not configured');
  assert.ok(row.progress, 'CAP rows expose lifecycle-derived progress');
  assert.ok(row.nextAction, 'CAP rows expose a real next action');
});

const preliminary = state.managerReports.find((report) => report.id === 'PR-2026-018');
preliminary.organizationId = 'ORG-XYZ';
preliminary.status = 'released_to_service_provider';
preliminary.sharedAt = '2026-07-10 15:00';
preliminary.sharedBy = 'Mehmet Kaya';
preliminary.responseDueDate = '2026-07-20';
const finalReport = state.managerReports.find((report) => report.id === 'FR-2026-018');
finalReport.organizationId = 'ORG-XYZ';
finalReport.status = 'issued';
finalReport.issued = true;
finalReport.locked = true;
finalReport.issuedAt = '2026-07-10 16:00';

const preliminaryReports = context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Preliminary Report');
const finalReports = context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Final Report');
assert.deepEqual(preliminaryReports.map((report) => report.id), ['PR-2026-018']);
assert.deepEqual(finalReports.map((report) => report.id), ['FR-2026-018']);

context.state = state;
context.state.role = 'auditee';
context.state.view = 'service-provider-final-reports';
context.state.params = {};
let html = context.routeView();
const header = html.match(/<thead><tr>(.*?)<\/tr><\/thead>/);
assert.ok(header, 'Final Reports table header renders');
assert.match(header[1], /Report ID/);
assert.match(header[1], /Audit\/Inspection/);
assert.match(header[1], /Date Released/);
assert.match(header[1], /Findings/);
assert.match(header[1], /Action/);
assert.doesNotMatch(header[1], /Status|Required Action/);
assert.match(html, /FR-2026-018/);
assert.doesNotMatch(html, /PRIVATE-OTHER-ORG|Internal CAA Note|Inspector Workload|enforcement|internal risk/i);

context.state.serviceProviderUi.finalReports.selectedReportId = 'FR-OTHER-ORG';
html = context.routeView();
assert.doesNotMatch(html, /FR-OTHER-ORG|Other organization private finding/);

console.log('service-provider-portal-smoke: ok');
