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
function dataEl(attrs) {
  return { getAttribute(name) { return attrs[name] || ''; } };
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

const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

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
  ['Inspection Coordination', 'Corrective Actions (CAP)', 'Preliminary Reports', 'Final Reports', 'Messages', 'Documents', 'Settings']
);
assert.equal(context.homeView('auditee'), 'service-provider-cap');
assert.equal(typeof context.serviceProviderVisibleFindings, 'function');
assert.equal(typeof context.serviceProviderCapRows, 'function');
assert.equal(typeof context.serviceProviderVisibleReports, 'function');
assert.equal(typeof context.serviceProviderRequiredAction, 'function');
assert.equal(typeof context.notificationVisibleToSession, 'function');
assert.match(
  css,
  /@media \(max-width: 640px\)[\s\S]*?\.service-workspace-tabs\s*\{[^}]*flex-wrap:\s*wrap[^}]*overflow-x:\s*hidden/s,
  'Service Provider status tabs must wrap without clipping at the mobile breakpoint'
);

const state = context.freshState();
assert.equal(state.serviceProviderUi.cap.selectedFindingId, 'CAB-2026-001');
assert.equal(state.serviceProviderUi.preliminaryReports.selectedReportId, 'PR-2026-018');
assert.equal(state.serviceProviderUi.finalReports.selectedReportId, 'FR-2026-018');

state.notifications.unshift({
  id: 'N-PRIVATE-SKY', role: 'auditee', organizationId: 'ORG-SKY',
  icon: 'CAP', text: 'SkyCargo confidential CAP message', time: 'Just now', unread: true
});

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

const preliminary = context.reportArtifactById('PR-2026-018', state);
preliminary.organizationId = 'ORG-XYZ';
preliminary.status = 'submitted_to_executive';
preliminary.ownerRole = 'executiveDirector';
preliminary.sharedAt = '';
assert.equal(
  context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Preliminary Report').some((report) => report.id === preliminary.id),
  false,
  'a Preliminary Report remains hidden before Executive Director release'
);
preliminary.status = 'released_to_service_provider';
preliminary.sharedAt = '2026-07-10 15:00';
preliminary.sharedBy = 'Mehmet Kaya';
preliminary.responseDueDate = '2026-07-20';
const finalReport = context.reportArtifactById('FR-2026-018', state);
finalReport.organizationId = 'ORG-XYZ';
finalReport.status = 'issued';
finalReport.issued = true;
finalReport.locked = true;
finalReport.issuedAt = '2026-07-10 16:00';

const preliminaryReports = context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Preliminary Report');
const finalReports = context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Final Report');
assert.ok(preliminaryReports.some((report) => report.id === 'PR-2026-018'));
assert.ok(finalReports.some((report) => report.id === 'FR-2026-018'));
assert.ok(preliminaryReports.every((report) => report.organizationId === 'ORG-XYZ'));
assert.ok(finalReports.every((report) => report.organizationId === 'ORG-XYZ'));
const linkedOpenFindings = state.findings.filter((finding) => finding.auditId === preliminary.auditId && finding.status !== 'CLOSED');
assert.ok(linkedOpenFindings.length > 0);
preliminary.capRequired = false;
assert.equal(context.serviceProviderRequiredAction(preliminary, linkedOpenFindings), 'View Report');
preliminary.capRequired = true;
assert.equal(context.serviceProviderRequiredAction(preliminary, linkedOpenFindings), 'Respond to CAP and Evidence requests');

const otherOrganizationPreliminary = JSON.parse(JSON.stringify(preliminary));
otherOrganizationPreliminary.id = 'PR-OTHER-ORG';
otherOrganizationPreliminary.approvalPackageId = 'PR-OTHER-ORG';
otherOrganizationPreliminary.organizationId = 'ORG-SKY';
otherOrganizationPreliminary.organization = 'SkyCargo Air';
state.auditReports.push(otherOrganizationPreliminary);
const otherOrganizationProjection = JSON.parse(JSON.stringify(state.managerReports.find((report) => report.id === 'PR-2026-018')));
otherOrganizationProjection.id = 'PR-OTHER-ORG';
otherOrganizationProjection.approvalPackageId = 'PR-OTHER-ORG';
otherOrganizationProjection.organizationId = 'ORG-SKY';
otherOrganizationProjection.organization = 'SkyCargo Air';
otherOrganizationProjection.status = 'released_to_service_provider';
otherOrganizationProjection.sharedAt = '2026-07-10 15:30';
state.managerReports.push(otherOrganizationProjection);
assert.equal(context.serviceProviderVisibleReports(state, 'ORG-XYZ', 'Preliminary Report').some((report) => report.id === 'PR-OTHER-ORG'), false);

context.state = state;
context.state.role = 'auditee';
context.state.view = 'service-provider-cap';
context.state.params = {};
const visibleVerificationFinding = state.findings.find((finding) => finding.id === 'CAB-2026-011');
state.serviceProviderUi.cap.selectedFindingId = visibleVerificationFinding.id;
visibleVerificationFinding.capVerification = {
  result: 'partially_close', label: 'Partially Close', findingClosed: false,
  actorRole: 'leadInspector', actorName: 'Lead Inspector Demo',
  verifiedAt: '2026-07-18 10:00', evidenceId: 'EV-DEMO', evidenceVersion: 2
};
if (!Array.isArray(visibleVerificationFinding.internalNotes)) visibleVerificationFinding.internalNotes = [];
visibleVerificationFinding.internalNotes.push({
  author: 'Lead Inspector Demo', date: '2026-07-18', text: 'PRIVATE VERIFICATION RATIONALE'
});
let html = context.renderContent();
assert.match(html, /Corrective Actions \(CAP\)/);
assert.match(html, /Finding ID/);
assert.match(html, /Audit\/Inspection/);
assert.match(html, /Finding Title/);
assert.match(html, /Level/);
assert.match(html, /Status/);
assert.match(html, /Due Date/);
assert.match(html, /Progress/);
assert.match(html, /CAB-2026-011/);
assert.match(html, /CAP acceptance does not close this Finding/);
assert.match(html, /Partially Close|Finding remains open|Evidence version/);
assert.doesNotMatch(html, /PRIVATE VERIFICATION RATIONALE|PRIVATE-OTHER-ORG|Internal CAA Note|Other organization private finding/);

context.state.view = 'messages';
html = context.renderContent();
assert.doesNotMatch(html, /SkyCargo confidential CAP message|ORG-SKY/);
assert.equal(context.notificationVisibleToSession(state.notifications.find((item) => item.id === 'N-PRIVATE-SKY'), state), false);

context.state.view = 'settings';
html = context.renderContent();
assert.match(html, /Service Provider|Fly Namibia/);
assert.doesNotMatch(html, /Inspector Workload Balance|Oversight Health Index weights|internal risk/i);

context.state.view = 'reports';
context.state.params = {};
context.normalizeViewForRole();
assert.equal(context.state.params.filter, 'documents');
html = context.renderContent();
assert.match(html, /Documents/);
assert.doesNotMatch(html, /SkyCargo confidential CAP message|ORG-SKY|Internal CAA Note|enforcement deliberation|Inspector Workload|internal risk/i);

context.state.view = 'service-provider-cap';
html = context.renderContent();

context.handleAction('service-provider-cap-select', dataEl({ 'data-id': 'CAB-2026-013' }));
assert.equal(context.state.serviceProviderUi.cap.selectedFindingId, 'CAB-2026-013');
assert.match(context.document.getElementById('app-root').innerHTML, /Cabin defect follow-up owner not recorded/);
context.handleAction('service-provider-cap-respond', dataEl({ 'data-id': 'CAB-2026-013' }));
assert.match(context.document.getElementById('modal-host').innerHTML, /Submit Corrective Action Plan/);
assert.doesNotMatch(context.document.getElementById('modal-host').innerHTML, /Internal CAA Note/);
context.handleAction('close-modal', dataEl({}));

context.state.view = 'service-provider-preliminary-reports';
context.state.params = {};
html = context.renderContent();
assert.match(html, /Pending Your Response/);
assert.match(html, /Under Review by Authority/);
assert.match(html, /Report ID/);
assert.match(html, /Date Shared/);
assert.match(html, /PR-2026-018/);
assert.match(html, /Response Due Date/);
assert.match(html, /Respond to CAP and Evidence requests/);
assert.match(html, /Send Message to Inspector/);
assert.doesNotMatch(html, /PRIVATE-OTHER-ORG|Internal CAA Note|Other organization private finding/);
context.handleAction('service-provider-report-view', dataEl({ 'data-id': 'PR-2026-018' }));
assert.equal(context.state.view, 'service-provider-report-preview');
assert.equal(context.state.serviceProviderUi.reportPreview.reportId, 'PR-2026-018');
assert.match(context.document.getElementById('app-root').innerHTML, /Authorized Service Provider Summary/);
assert.doesNotMatch(context.document.getElementById('app-root').innerHTML, /Internal CAA Note|PRIVATE-OTHER-ORG/);
context.handleAction('service-provider-message', dataEl({ 'data-id': 'PR-2026-018' }));
assert.match(context.document.getElementById('modal-host').innerHTML, /Message CAA Inspector/);
context.document.getElementById('service-provider-message-text').value = 'Please confirm the configured response target.';
context.handleAction('service-provider-message-send', dataEl({ 'data-id': 'PR-2026-018' }));
assert.ok(context.state.serviceProviderUi.reportPreview.messageSentAt);
assert.equal(context.state.serviceProviderUi.reportPreview.messageText, 'Please confirm the configured response target.');
assert.equal(context.state.notifications[0].role, 'inspector');

context.state.view = 'service-provider-final-reports';
context.state.params = {};
html = context.renderContent();
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

context.handleAction('service-provider-download-all', dataEl({ 'data-id': 'FR-2026-018' }));
assert.ok(context.state.serviceProviderUi.reportPreview.downloadedAt);
assert.ok(context.state.serviceProviderUi.reportPreview.downloadedDocumentIds['CAP_Evidence_Summary.pdf']);

context.state.serviceProviderUi.finalReports.selectedReportId = 'FR-OTHER-ORG';
html = context.renderContent();
assert.doesNotMatch(html, /FR-OTHER-ORG|Other organization private finding/);

context.state.view = 'finding';
context.state.params = { findingId: 'PRIVATE-OTHER-ORG' };
context.normalizeViewForRole();
assert.equal(context.state.view, 'service-provider-cap');
assert.deepEqual(JSON.parse(JSON.stringify(context.state.params)), {});

console.log('service-provider-portal-smoke: ok');
