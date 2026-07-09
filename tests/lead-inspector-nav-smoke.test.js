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

function stubCreatedElement() {
  return {
    className: '',
    innerHTML: '',
    style: {},
    parentNode: null
  };
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
context.state.role = 'leadInspector';
context.state.view = 'lead-review';
context.state.params = {};
context.render();

const html = elements.get('app-root').innerHTML;
const leadNavLabels = context.NAV.leadInspector
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');
const leadNavItems = context.NAV.leadInspector.filter((item) => item.label);

assert.match(html, /Assigned Audits/);
assert.match(html, /Preliminary Reports/);
assert.match(html, /Final Reports/);
assert.match(html, /Calendar/);
assert.match(html, /Messages/);
assert.match(html, /Analytics &amp; Reports/);
assert.match(html, /Settings/);
assert.doesNotMatch(html, /CAP Verification/);
assert.doesNotMatch(html, />Users</);
assert.doesNotMatch(html, /data-view="users"/);
assert.doesNotMatch(html, /Draft Reports/);
assert.match(html, /New Audit Assignment/);
assert.match(html, /Search audits/);
assert.match(html, /AUD-2025-045/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /Apply Filters/);
assert.doesNotMatch(html, /Planning/);
assert.doesNotMatch(html, /data-view="planning"/);
assert.doesNotMatch(html, /data-view="reports"/);
assert.doesNotMatch(leadNavLabels, /Planning/);
assert.doesNotMatch(leadNavLabels, /Users/);
assert.doesNotMatch(leadNavLabels, /Draft Reports/);
assert.doesNotMatch(leadNavLabels, /Findings Review/);
assert.doesNotMatch(leadNavLabels, /Dashboard/);
assert.doesNotMatch(leadNavLabels, /Documents/);
assert.doesNotMatch(leadNavLabels, /CAP Verification/);
assert.equal(leadNavItems.some((item) => item.label === 'Assigned Audits'), true);
assert.equal(leadNavItems.some((item) => item.label === 'Final Reports'), true);
assert.equal(leadNavItems.some((item) => item.label === 'Findings Review'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'planning'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'reports'), false);

context.handleAction('nav', dataEl({ 'data-view': 'audit-reports', 'data-filter': 'preliminary' }));
assert.equal(context.state.view, 'audit-reports');
assert.equal(context.state.params.filter, 'preliminary');
let preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Preliminary Reports/);
assert.match(preliminaryHtml, /View and manage all preliminary inspection reports/);
assert.match(preliminaryHtml, /New Preliminary Report/);
assert.match(preliminaryHtml, /PR-2026-018/);
assert.match(preliminaryHtml, /AVSEC Inspection/);
assert.match(preliminaryHtml, /SkyCargo Air/);
assert.match(preliminaryHtml, /Submitted/);
assert.match(preliminaryHtml, /Showing 1 to 8 of 18 reports/);
assert.doesNotMatch(preliminaryHtml, /Report Approval Queue/);

context.state.leadPreliminaryReportsUi.query = 'SkyCargo';
context.render();
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Showing 1 to 2 of 2 reports/);
assert.match(preliminaryHtml, /PR-2026-018/);
assert.match(preliminaryHtml, /PR-2026-007/);
assert.doesNotMatch(preliminaryHtml, /Ramp Safety Inspection/);

context.state.leadPreliminaryReportsUi = { query: '', status: 'all', organization: 'all', period: 'all' };
context.render();
context.handleAction('preliminary-report-actions', dataEl({ 'data-id': 'PR-2026-018' }));
assert.equal(elements.get('modal-host').hidden, true);
assert.equal(context.state.leadPreliminaryReportsUi.mode, 'workflow');
assert.equal(context.state.leadPreliminaryReportsUi.step, 'inspection');
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Inspection &amp; Findings/);
assert.match(preliminaryHtml, /Findings from Inspection \(9\)/);
assert.match(preliminaryHtml, /SEC-2026-002/);
assert.match(preliminaryHtml, /Next: Report Content/);

context.handleAction('preliminary-report-next', dataEl({}));
assert.equal(context.state.leadPreliminaryReportsUi.step, 'content');
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Report Content/);
assert.match(preliminaryHtml, /PRELIMINARY INSPECTION REPORT/);
assert.match(preliminaryHtml, /data-field="preliminary-report-content"/);
assert.match(preliminaryHtml, /Next: Attachments/);

context.handleAction('preliminary-report-next', dataEl({}));
assert.equal(context.state.leadPreliminaryReportsUi.step, 'attachments');
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Attachments/);
assert.match(preliminaryHtml, /Browse Files/);
assert.match(preliminaryHtml, /Attachment Summary/);
assert.match(preliminaryHtml, /Next: Review &amp; Submit/);

context.handleAction('preliminary-report-browse-file', dataEl({}));
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Additional_CAP_Evidence_Summary\.pdf/);

context.handleAction('preliminary-report-next', dataEl({}));
assert.equal(context.state.leadPreliminaryReportsUi.step, 'review');
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Review Before Submit/);
assert.match(preliminaryHtml, /Submit to Department Manager/);
assert.match(preliminaryHtml, /always forwarded to Department Manager Review/);
assert.match(preliminaryHtml, /Department Manager releases it to the Service Provider/);
assert.match(preliminaryHtml, /If CAP Required/);

context.handleAction('preliminary-report-submit', dataEl({}));
assert.ok(context.state.leadPreliminaryReportsUi.submittedAt);
assert.equal(context.state.notifications[0].role, 'manager');
assert.match(context.state.notifications[0].text, /Department Manager review/);
preliminaryHtml = elements.get('app-root').innerHTML;
assert.match(preliminaryHtml, /Submitted to Department Manager/);

context.handleAction('nav', dataEl({ 'data-view': 'audit-reports', 'data-filter': 'preliminary' }));
assert.equal(context.state.params.auditId, undefined);
assert.equal(context.state.leadPreliminaryReportsUi.mode, 'list');
assert.match(elements.get('app-root').innerHTML, /Showing 1 to 8 of 18 reports/);
assert.doesNotMatch(elements.get('app-root').innerHTML, /Report Approval Queue/);

context.handleAction('nav', dataEl({ 'data-view': 'lead-assignment', 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.view, 'lead-assignment');
assert.equal(context.state.params.auditId, 'AUD-2026-001');
assert.match(elements.get('app-root').innerHTML, /Assignment Overview/);
assert.match(elements.get('app-root').innerHTML, /Assign Checklist Questions/);
assert.doesNotMatch(elements.get('app-root').innerHTML, /Preliminary Report - Routine Inspection/);

context.handleAction('nav', dataEl({ 'data-view': 'lead-assignment-questions', 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.view, 'lead-assignment-questions');
assert.match(elements.get('app-root').innerHTML, /Assign Selected \(4\)/);
assert.match(elements.get('app-root').innerHTML, /data-field="lead-assignment-due"/);

context.handleAction('lead-assignment-pick-inspector', dataEl({ 'data-id': 'Maria Silva' }));
assert.equal(context.state.leadAssignmentUi.assignee, 'Maria Silva');
context.handleLeadAssignmentFieldChange('lead-assignment-due', { value: '2026-06-15' });
context.handleLeadAssignmentFieldChange('lead-assignment-priority', { value: 'High' });
context.handleLeadAssignmentFieldChange('lead-assignment-note', { value: 'Prioritize emergency equipment checks.', parentElement: null });
context.handleAction('lead-assignment-assign', dataEl({}));
assert.ok(context.state.leadAssignmentUi.assignedAt);
assert.match(elements.get('app-root').innerHTML, /Assignment Draft/);
assert.match(elements.get('app-root').innerHTML, /Maria Silva/);
context.handleAction('lead-assignment-release', dataEl({}));
assert.ok(context.state.leadAssignmentUi.releasedAt);
assert.match(elements.get('app-root').innerHTML, /Released/);

context.handleAction('nav', dataEl({ 'data-view': 'lead-review', 'data-id': 'AUD-2026-005' }));
assert.equal(context.state.params.auditId, 'AUD-2026-005');
assert.match(elements.get('app-root').innerHTML, /Preliminary Report - Routine Inspection/);
assert.match(elements.get('app-root').innerHTML, /Report Type: Preliminary Report/);
assert.match(elements.get('app-root').innerHTML, /Submit to Department Manager/);

context.state.view = 'findings';
context.state.params = { filter: 'capreview' };
context.state.capTrackingUi = {
  tab: 'overview',
  reminderSentAt: '',
  exportedAt: '',
  selectedFindingId: ''
};
context.render();
const capTrackingHtml = elements.get('app-root').innerHTML;
assert.match(capTrackingHtml, /CAP Tracking - Service Provider/);
assert.match(capTrackingHtml, /Final Report Issued/);
assert.match(capTrackingHtml, /Executive Director \/ GM approval completed/);
assert.match(capTrackingHtml, /sent to the service provider on 22 Jun 2026/);
assert.match(capTrackingHtml, /Send Reminder/);
assert.match(capTrackingHtml, /CAP Process Overview/);
assert.match(capTrackingHtml, /CAP Process Starts/);
assert.match(capTrackingHtml, /Level 1/);
assert.match(capTrackingHtml, /14 days/);
assert.match(capTrackingHtml, /Level 2/);
assert.match(capTrackingHtml, /90 days/);
assert.match(capTrackingHtml, /data-act="cap-track-row-action"/);
assert.match(capTrackingHtml, /Review CAP/);
assert.match(capTrackingHtml, /F-2026-004/);
assert.match(capTrackingHtml, /Overdue/);
assert.doesNotMatch(capTrackingHtml, /Quick Actions/);
assert.doesNotMatch(capTrackingHtml, /Download CAP Status Report/);
assert.doesNotMatch(capTrackingHtml, /data-field="cap-review-decision"/);

context.handleAction('cap-track-reminder', dataEl({}));
assert.ok(context.state.capTrackingUi.reminderSentAt);
assert.equal(context.state.notifications[0].role, 'auditee');
assert.match(context.state.notifications[0].text, /CAP reminder/);

context.handleAction('cap-track-view-report', dataEl({}));
const modalHtml = elements.get('modal-host').innerHTML;
assert.equal(elements.get('modal-host').hidden, false);
assert.match(modalHtml, /Final report distribution/);
assert.match(modalHtml, /automatically sent/);
context.closeModal();

context.handleAction('cap-track-row-action', dataEl({ 'data-id': 'F-2026-002', 'data-track-action': 'view' }));
assert.equal(context.state.view, 'cap-review-detail');
assert.equal(context.state.params.findingId, 'F-2026-002');
const capReviewDetailHtml = elements.get('app-root').innerHTML;
assert.match(capReviewDetailHtml, /CAP Review \(Lead Inspector\)/);
assert.match(capReviewDetailHtml, /Waiting for Review/);
assert.match(capReviewDetailHtml, /CAP Review List/);
assert.match(capReviewDetailHtml, /CAP-2025-045-001/);
assert.match(capReviewDetailHtml, /Finding Information/);
assert.match(capReviewDetailHtml, /Inadequate Flight Duty Time Monitoring/);
assert.match(capReviewDetailHtml, /Corrective Action Plan \(CAP\) by Service Provider/);
assert.match(capReviewDetailHtml, /Evidence Submitted/);
assert.match(capReviewDetailHtml, /Inspector Assessment/);
assert.match(capReviewDetailHtml, /Mary Adams/);
assert.match(capReviewDetailHtml, /Overall Recommendation/);
assert.match(capReviewDetailHtml, /Lead Inspector Review/);
assert.match(capReviewDetailHtml, /Lead Inspector Decision/);
assert.match(capReviewDetailHtml, /Recommend Closure \(Approve CAP\)/);
assert.match(capReviewDetailHtml, /Return to Inspector/);
assert.match(capReviewDetailHtml, /Recommend Closure/);
assert.doesNotMatch(capReviewDetailHtml, /Send Review to Lead Inspector/);
assert.doesNotMatch(capReviewDetailHtml, /Inspector Review Handoff/);
assert.match(capReviewDetailHtml, /Inspector Review/);
assert.doesNotMatch(capReviewDetailHtml, /Unit Manager/);
assert.doesNotMatch(capReviewDetailHtml, /General Manager Review/);
assert.doesNotMatch(capReviewDetailHtml, /Enforcement Options \(if CAP not effective\)/);

context.handleAction('cap-lead-return', dataEl({ 'data-id': 'F-2026-002' }));
assert.equal(context.state.notifications[0].role, 'inspector');
assert.match(context.state.notifications[0].text, /returned F-2026-002/);

context.handleAction('cap-lead-submit', dataEl({ 'data-id': 'F-2026-002' }));
assert.ok(context.state.capTrackingUi.leadInspectorRecommendationAt);
assert.equal(context.state.notifications[0].role, 'manager');
assert.match(context.state.notifications[0].text, /Lead Inspector recommendation/);

context.state.role = 'manager';
context.state.view = 'unit-manager-review';
context.state.params = { findingId: 'F-2026-002' };
context.render();
const departmentManagerHtml = elements.get('app-root').innerHTML;
assert.match(departmentManagerHtml, /Department Manager Approval - Finding F-2026-002/);
assert.match(departmentManagerHtml, /Inspector Review/);
assert.match(departmentManagerHtml, /Lead Inspector Recommendation/);
assert.match(departmentManagerHtml, /Closure \/ Verification Decision/);
assert.match(departmentManagerHtml, /Additional CAP Required/);
assert.match(departmentManagerHtml, /Close Finding/);
assert.match(departmentManagerHtml, /Request More Information/);
assert.match(departmentManagerHtml, /Approve Closure Decision/);
assert.doesNotMatch(departmentManagerHtml, /Submit Recommendation to General Manager/);

context.handleAction('cap-unit-choose-file', dataEl({ 'data-id': 'F-2026-002' }));
assert.match(context.state.capTrackingUi.unitAttachmentName, /department_manager/);
context.handleAction('cap-unit-submit-general-manager', dataEl({ 'data-id': 'F-2026-002' }));
assert.ok(context.state.capTrackingUi.departmentManagerApprovedAt);
assert.equal(context.state.notifications[0].role, 'leadInspector');
assert.match(context.state.notifications[0].text, /Department Manager approved/);

context.state.role = 'leadInspector';
['planning', 'reports'].forEach((restrictedView) => {
  context.state.view = restrictedView;
  context.state.params = {};
  context.render();
  const restrictedHtml = elements.get('app-root').innerHTML;
  assert.match(restrictedHtml, /Lead Inspector/);
  assert.match(restrictedHtml, /Assigned Audits/);
  assert.match(restrictedHtml, /New Audit Assignment/);
  assert.doesNotMatch(restrictedHtml, /Preliminary Report - Routine Inspection/);
  assert.doesNotMatch(restrictedHtml, /Audit Work Queue/);
  assert.doesNotMatch(restrictedHtml, /Planning/);
});

context.state.view = 'calendar';
context.state.params = {};
context.render();
const leadCalendarHtml = elements.get('app-root').innerHTML;
assert.match(leadCalendarHtml, /Lead Inspector/);
assert.match(leadCalendarHtml, /Audit Work Queue/);
assert.doesNotMatch(leadCalendarHtml, /Preliminary Report - Routine Inspection/);

console.log('lead-inspector-nav-smoke: ok');
