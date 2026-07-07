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
context.state.role = 'inspector';
context.state.view = context.homeView('inspector');
context.state.params = {};
context.render();

const html = elements.get('app-root').innerHTML;
const inspectorNavLabels = context.NAV.inspector
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');

assert.equal(context.homeView('inspector'), 'inspector-assignments');
assert.match(html, /My Assignments/);
assert.match(html, /View and manage all audits and tasks assigned to you\./);
assert.match(html, /Open Assignments/);
assert.match(html, /Total Assigned/);
assert.match(html, /Search audits/);
assert.match(html, /All Status/);
assert.match(html, /All Types/);
assert.match(html, /All Organizations/);
assert.match(html, /Date Range/);
assert.match(html, /Audit \/ Inspection/);
assert.match(html, /Inspection Dates/);
assert.match(html, /Due Date/);
assert.match(html, /AVSEC Inspection/);
assert.match(html, /PR-2026-018/);
assert.match(html, /SkyCargo Air/);
assert.match(html, /Ramp Safety Inspection/);
assert.match(html, /SMS Audit/);
assert.match(html, /Dangerous Goods Inspection/);
assert.match(html, /Continue/);
assert.match(html, /Start/);
assert.match(html, /View Report/);
assert.match(inspectorNavLabels, /Dashboard/);
assert.match(inspectorNavLabels, /My Assignments/);
assert.match(inspectorNavLabels, /Findings/);
assert.match(inspectorNavLabels, /CAP Verification/);
assert.doesNotMatch(inspectorNavLabels, /Checklists/);
assert.doesNotMatch(inspectorNavLabels, /CAP Actions/);
assert.doesNotMatch(inspectorNavLabels, /Documents/);
assert.match(inspectorNavLabels, /Messages/);
assert.match(inspectorNavLabels, /Calendar/);
assert.match(html, /Reports/);
assert.doesNotMatch(html, /My Inspections/);
assert.doesNotMatch(html, /Assigned Inspections/);
assert.doesNotMatch(html, /Draft Reports/);
assert.doesNotMatch(inspectorNavLabels, /Evidence/);
assert.doesNotMatch(html, /Today’s Workbench/);
assert.doesNotMatch(html, /Audit Work Queue/);
assert.doesNotMatch(html, /Inspection Evidence/);
assert.doesNotMatch(html, /Operators \/ Providers/);
assert.doesNotMatch(html, /Offline Field/);
assert.doesNotMatch(html, /Inspection Packages/);
assert.doesNotMatch(html, /NAMCARS Library/);
assert.doesNotMatch(html, /Cross-Reference/);
assert.doesNotMatch(html, /Checklist Builder/);
assert.doesNotMatch(html, /Search regulation/);
assert.doesNotMatch(html, /Open cross-reference/);
assert.doesNotMatch(html, /Preparation pending packages/);
assert.doesNotMatch(html, /Open assigned audit package/);
assert.doesNotMatch(html, /data-view="package-builder"/);
assert.doesNotMatch(html, /data-view="regulatory-library"/);
assert.doesNotMatch(html, /data-view="checklist-builder"/);
assert.doesNotMatch(html, /data-view="templates"/);
assert.doesNotMatch(html, /Overdue Actions/);
assert.doesNotMatch(html, /Overdue CAPs \/ actions/);
assert.doesNotMatch(html, /Delayed CAP trend/);
assert.doesNotMatch(html, /Open overdue/);
assert.doesNotMatch(html, /data-filter="overdue"/);
assert.doesNotMatch(html, /Repeat Findings/);
assert.doesNotMatch(html, /Repeat findings/);
assert.doesNotMatch(html, /Review repeats/);
assert.doesNotMatch(html, /Repeated regulation references/);
assert.doesNotMatch(html, /repeat oversight signals/i);
assert.doesNotMatch(html, /data-view="cap-effectiveness"/);
assert.doesNotMatch(inspectorNavLabels, /Today’s Workbench/);
assert.doesNotMatch(inspectorNavLabels, /Audit Work Queue/);
assert.doesNotMatch(inspectorNavLabels, /Inspection Evidence/);
assert.doesNotMatch(inspectorNavLabels, /Operators \/ Providers/);
assert.doesNotMatch(inspectorNavLabels, /Inspection Packages/);
assert.doesNotMatch(inspectorNavLabels, /NAMCARS Library/);
assert.doesNotMatch(inspectorNavLabels, /Cross-Reference/);
assert.doesNotMatch(inspectorNavLabels, /Checklist Builder/);
assert.doesNotMatch(inspectorNavLabels, /Offline Field/);
assert.doesNotMatch(inspectorNavLabels, /Overdue Actions/);
assert.doesNotMatch(inspectorNavLabels, /Repeat Findings/);
assert.equal(context.NAV.inspector.some((item) => item.label === 'My Assignments' && item.view === 'inspector-assignments'), true);
assert.equal(context.NAV.inspector.some((item) => item.label === 'Findings' && item.filter === 'open'), true);
assert.equal(context.NAV.inspector.some((item) => item.label === 'CAP Verification' && item.filter === 'capreview'), true);
assert.equal(context.NAV.inspector.some((item) => item.label === 'Findings Review'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'package-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'regulatory-library'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'checklist-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'templates'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'cap-effectiveness'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'offline-field'), false);
assert.equal(context.NAV.manager.some((item) => item.view === 'checklist-builder' && item.label === 'Checklist Builder'), true);
assert.equal(context.NAV.admin.some((item) => item.view === 'regulatory-library' && item.label === 'NAMCARS Library'), true);
assert.equal(context.NAV.manager.some((item) => item.view === 'cap-effectiveness' && item.label === 'Repeat Findings'), true);

context.handleAction('inspector-assignment-filter', dataEl({ 'data-status': 'in-progress' }));
const inProgressAssignmentsHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'inspector-assignments');
assert.equal(context.state.inspectorAssignmentsUi.status, 'in-progress');
assert.match(inProgressAssignmentsHtml, /My Assignments \/ <span>In Progress<\/span>/);
assert.match(inProgressAssignmentsHtml, /Questions Assigned/);
assert.match(inProgressAssignmentsHtml, /186/);
assert.match(inProgressAssignmentsHtml, /Remaining/);
assert.match(inProgressAssignmentsHtml, /112/);
assert.match(inProgressAssignmentsHtml, /Avg\. Completion/);
assert.match(inProgressAssignmentsHtml, /47%/);
assert.match(inProgressAssignmentsHtml, /Sections Overview/);
assert.match(inProgressAssignmentsHtml, /Access Control \(8 Questions\)/);
assert.match(inProgressAssignmentsHtml, /Continue Working/);
assert.doesNotMatch(inProgressAssignmentsHtml, /Dangerous Goods Inspection/);

context.state.view = 'audit-detail';
context.state.params = { auditId: 'AUD-2026-005' };
context.state.inspectionWorkspaceSection = '8.';
context.render();
let auditExecutionHtml = elements.get('app-root').innerHTML;
assert.match(auditExecutionHtml, /All Sections Complete/);
assert.doesNotMatch(auditExecutionHtml, /data-act="inspection-section-preview" data-id="next" disabled/);
context.handleAction('inspection-complete-sections', dataEl({ 'data-id': 'AUD-2026-005' }));
auditExecutionHtml = elements.get('app-root').innerHTML;
assert.ok(context.state.inspectionWorkspaceAllSectionsCompletedAt);
assert.match(auditExecutionHtml, /Ready to Submit/);
assert.match(auditExecutionHtml, /Sections Complete/);

context.state.view = 'regulatory-library';
context.state.params = {};
context.render();
const restrictedRegulatoryHtml = elements.get('app-root').innerHTML;
assert.match(restrictedRegulatoryHtml, /My Assignments/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Regulatory Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /NAMCARS Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Cross-Reference/);

context.state.view = 'checklist-builder';
context.state.params = {};
context.render();
const restrictedBuilderHtml = elements.get('app-root').innerHTML;
assert.match(restrictedBuilderHtml, /My Assignments/);
assert.doesNotMatch(restrictedBuilderHtml, /Checklist Builder/);

context.state.view = 'findings';
context.state.params = { filter: 'open' };
context.render();
const findingsHtml = elements.get('app-root').innerHTML;
assert.match(findingsHtml, /Open Findings/);
assert.match(findingsHtml, /SEC-2026-002/);
assert.match(findingsHtml, /RAMP-2026-005/);
assert.match(findingsHtml, /AWO-2026-003/);
assert.match(findingsHtml, /Maintenance task sign-off overdue/);
assert.doesNotMatch(findingsHtml, /Overdue Findings/);
assert.doesNotMatch(findingsHtml, /data-filter="overdue"/);

context.state.view = 'reports';
context.state.params = {};
context.render();
const inspectorReportsHtml = elements.get('app-root').innerHTML;
assert.match(inspectorReportsHtml, /Past closure reports \(view only\)\./);
assert.match(inspectorReportsHtml, /Past Reports/);
assert.match(inspectorReportsHtml, /Cabin crew manual revision not distributed/);
assert.match(inspectorReportsHtml, /Pre-flight documentation filing incomplete/);
assert.match(inspectorReportsHtml, /View report/);
assert.doesNotMatch(inspectorReportsHtml, /CAP state/);
assert.doesNotMatch(inspectorReportsHtml, /Corrective Action Plan/);
assert.doesNotMatch(inspectorReportsHtml, /Evidence v/);
assert.doesNotMatch(inspectorReportsHtml, /Open finding/);

context.state.view = 'findings';
context.state.params = { filter: 'capreview' };
context.state.capReviewUi = {
  expandedId: 'SEC-2026-002',
  tab: 'details',
  status: 'all',
  due: 'all',
  query: '',
  decision: '',
  comment: ''
};
context.render();
const capReviewHtml = elements.get('app-root').innerHTML;
assert.match(capReviewHtml, /CAP Verification/);
assert.match(capReviewHtml, /Review CAP closure evidence submitted by service providers/);
assert.match(capReviewHtml, /INS-2026-014/);
assert.match(capReviewHtml, /CAP Evidence Submitted/);
assert.match(capReviewHtml, /Ready for Inspector Verification/);
assert.match(capReviewHtml, /SkyCargo Air/);
assert.match(capReviewHtml, /Service Provider/);
assert.match(capReviewHtml, /SkyCargo Ground Handling Ltd\./);
assert.match(capReviewHtml, /SkyFuel Services/);
assert.match(capReviewHtml, /SkySecurity Services/);
assert.match(capReviewHtml, /SkyCatering Ltd\./);
assert.match(capReviewHtml, /data-act="cap-review-provider"/);
assert.match(capReviewHtml, /All CAPs \(14\)/);
assert.match(capReviewHtml, /Pending My Verification \(3\)/);
assert.match(capReviewHtml, /Verified by Me \(8\)/);
assert.match(capReviewHtml, /Perimeter Fence Security/);
assert.match(capReviewHtml, /CCTV Coverage Gaps/);
assert.match(capReviewHtml, /Vehicle Inspection Process/);
assert.match(capReviewHtml, /Verification Summary/);
assert.match(capReviewHtml, /CAP Level Breakdown/);
assert.match(capReviewHtml, /My Verification Workload/);
assert.match(capReviewHtml, /data-view="cap-review-detail"/);
assert.doesNotMatch(capReviewHtml, /cap-review-expanded-row/);
assert.doesNotMatch(capReviewHtml, /data-field="cap-review-decision"/);
assert.doesNotMatch(capReviewHtml, /Submit Decision/);
assert.doesNotMatch(capReviewHtml, /Every finding shows owner/);

context.handleCapReviewProvider('skyfuel');
const skyFuelHtml = elements.get('app-root').innerHTML;
assert.match(skyFuelHtml, /SkyFuel Services/);
assert.match(skyFuelHtml, /Fuel Storage Area Security/);
assert.match(skyFuelHtml, /Spill Response Equipment/);
assert.doesNotMatch(skyFuelHtml, /Perimeter Fence Security/);

context.state.role = 'inspector';
context.state.view = 'cap-review-detail';
context.state.params = { findingId: 'F-014-01' };
context.state.capTrackingUi = {
  tab: 'overview',
  detailTab: 'details',
  selectedFindingId: 'F-014-01',
  inspectorPackageEvaluation: 'acceptable',
  inspectorPackageComment: ''
};
context.render();
const inspectorSubmittedCapDetailHtml = elements.get('app-root').innerHTML;
assert.match(inspectorSubmittedCapDetailHtml, /CAP Review - Perimeter Fence Security \(F-014-01\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Level 1 \(Critical\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Pending Review/);
assert.match(inspectorSubmittedCapDetailHtml, /Finding Information/);
assert.match(inspectorSubmittedCapDetailHtml, /Service Provider Corrective Action Plan \(CAP\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Inspector Evaluation/);
assert.match(inspectorSubmittedCapDetailHtml, /Finding Snapshot/);
assert.match(inspectorSubmittedCapDetailHtml, /Attachments \(2\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Review Timeline/);
assert.match(inspectorSubmittedCapDetailHtml, /Request Revision/);
assert.match(inspectorSubmittedCapDetailHtml, /Reject CAP/);
assert.match(inspectorSubmittedCapDetailHtml, /Accept CAP/);
assert.match(inspectorSubmittedCapDetailHtml, /data-act="inspector-cap-package-accept"/);

context.handleAction('inspector-cap-package-accept', dataEl({ 'data-id': 'F-014-01' }));
const leadFinalReadyHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.role, 'leadInspector');
assert.equal(context.state.view, 'audit-reports');
assert.equal(context.state.params.filter, 'final');
assert.equal(context.state.capTrackingUi.finalReportReadyAt, '30 Jun 2026 16:20');
assert.match(leadFinalReadyHtml, /Final Reports/);
assert.match(leadFinalReadyHtml, /View and manage all final reports you are leading/);
assert.match(leadFinalReadyHtml, /INS-2026-014/);
assert.match(leadFinalReadyHtml, /Ready for Preparation/);
assert.match(leadFinalReadyHtml, /Findings Summary/);
assert.match(leadFinalReadyHtml, /CAP Implementation/);
assert.match(leadFinalReadyHtml, /9 \/ 9 findings ready/);
assert.match(leadFinalReadyHtml, /All CAPs approved/);
assert.match(leadFinalReadyHtml, /Prepare Report/);

context.handleAction('final-report-ready-action', dataEl({ 'data-final-action': 'preview' }));
const leadFinalReportViewHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'final-report-view');
assert.match(leadFinalReportViewHtml, /Final Report/);
assert.match(leadFinalReportViewHtml, /Approved/);
assert.match(leadFinalReportViewHtml, /SkyCargo Air/);
assert.match(leadFinalReportViewHtml, /Executive Summary/);
assert.match(leadFinalReportViewHtml, /Inspection Overview/);
assert.match(leadFinalReportViewHtml, /CAP Implementation Summary/);
assert.match(leadFinalReportViewHtml, /Appendices (?:&|&amp;) Attachments/);
assert.match(leadFinalReportViewHtml, /Export PDF/);
assert.match(leadFinalReportViewHtml, /Print Report/);
assert.match(leadFinalReportViewHtml, /APPROVED/);
assert.equal(typeof context.buildFinalReportPdfDocument, 'function');
assert.match(context.buildFinalReportPdfDocument(), /^%PDF-1\.4/);
context.handleAction('final-report-export-pdf', dataEl({}));
assert.ok(context.state.capTrackingUi.finalReportPdfExportedAt);
context.state.view = 'audit-reports';
context.state.params = { filter: 'final' };
context.render();

context.handleAction('final-report-ready-action', dataEl({ 'data-final-action': 'prepare' }));
const leadFinalPrepareHtml = elements.get('app-root').innerHTML;
assert.ok(context.state.capTrackingUi.finalReportPreparedAt);
assert.equal(context.state.view, 'final-report-prepare');
assert.match(leadFinalPrepareHtml, /Report Content/);
assert.match(leadFinalPrepareHtml, /All CAPs Approved/);
assert.match(leadFinalPrepareHtml, /1\. Executive Summary/);
assert.match(leadFinalPrepareHtml, /Back to Final Report Submission/);
assert.match(leadFinalPrepareHtml, /Save & Continue to Review/);
assert.match(leadFinalPrepareHtml, /Provide a high-level overview/);
assert.match(leadFinalPrepareHtml, /data-field="final-report-content"/);
assert.match(leadFinalPrepareHtml, /Report Progress/);
assert.match(leadFinalPrepareHtml, /Report Summary/);
assert.match(leadFinalPrepareHtml, /CAPs Approved/);
assert.match(leadFinalPrepareHtml, /Attachments \(5\)/);
assert.match(leadFinalPrepareHtml, /Next Section/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareNextHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'overview');
assert.match(leadFinalPrepareNextHtml, /Inspection Overview/);
assert.match(leadFinalPrepareNextHtml, /Organizations & CAPs Overview/);
assert.match(leadFinalPrepareNextHtml, /Total CAPs Submitted/);
assert.match(leadFinalPrepareNextHtml, /Approval Workflow Status/);
assert.match(leadFinalPrepareNextHtml, /Next: Findings Summary/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareFindingsHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'findings');
assert.match(leadFinalPrepareFindingsHtml, /Findings Summary/);
assert.match(leadFinalPrepareFindingsHtml, /data-field="final-report-content"/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareCapHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'cap');
assert.match(leadFinalPrepareCapHtml, /CAP Implementation Summary/);
assert.match(leadFinalPrepareCapHtml, /CAP implementation was reviewed/);

context.handleAction('final-report-prepare-review', dataEl({}));
const leadFinalPrepareReviewHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'review');
assert.ok(context.state.capTrackingUi.finalReportSavedAt);
assert.match(leadFinalPrepareReviewHtml, /Review &amp; Submit/);
assert.match(leadFinalPrepareReviewHtml, /Review Checklist/);
assert.match(leadFinalPrepareReviewHtml, /Submit for Approval/);
assert.match(leadFinalPrepareReviewHtml, /Attachments/);
assert.match(leadFinalPrepareReviewHtml, /Lead Inspector Comments/);
assert.match(leadFinalPrepareReviewHtml, /Submission Note/);
assert.doesNotMatch(leadFinalPrepareReviewHtml, /data-field="final-report-content"/);

context.handleAction('final-report-prepare-submit', dataEl({}));
const finalSubmitModalHtml = elements.get('modal-host').innerHTML;
assert.equal(elements.get('modal-host').hidden, false);
assert.match(finalSubmitModalHtml, /Submit Final Report for Approval/);
assert.match(finalSubmitModalHtml, /Confirm Submit/);
assert.match(finalSubmitModalHtml, /Next Approver/);
assert.equal(context.state.capTrackingUi.finalReportSubmittedAt, '');

context.handleAction('final-report-prepare-confirm-submit', dataEl({}));
assert.equal(elements.get('modal-host').hidden, true);
assert.ok(context.state.capTrackingUi.finalReportSubmittedAt);

context.state.role = 'inspector';
context.state.view = 'cap-review-detail';
context.state.params = { findingId: 'F-2026-002' };
context.state.capTrackingUi = {
  tab: 'overview',
  detailTab: 'details',
  reminderSentAt: '',
  exportedAt: '',
  selectedFindingId: 'F-2026-002',
  inspectorReviewSentAt: '',
  leadInspectorRecommendationAt: '',
  submittedToUnitManagerAt: ''
};
context.render();
const inspectorCapDetailHtml = elements.get('app-root').innerHTML;
assert.match(inspectorCapDetailHtml, /CAP Review \(Inspector\)/);
assert.match(inspectorCapDetailHtml, /Under Inspector Review/);
assert.match(inspectorCapDetailHtml, /CAP Review \(Inspector\) › CAP-2025-045-001/);
assert.match(inspectorCapDetailHtml, /Finding Information/);
assert.match(inspectorCapDetailHtml, /Inadequate Flight Duty Time Monitoring/);
assert.match(inspectorCapDetailHtml, /CAP Details/);
assert.match(inspectorCapDetailHtml, /Evidence/);
assert.match(inspectorCapDetailHtml, /Inspector Assessment/);
assert.match(inspectorCapDetailHtml, /Comments &amp; History/);
assert.match(inspectorCapDetailHtml, /Corrective Action Plan by Service Provider/);
assert.match(inspectorCapDetailHtml, /Evidence Submitted \(5\)/);
assert.match(inspectorCapDetailHtml, /Review Status/);
assert.match(inspectorCapDetailHtml, /CAP Submitted by Service Provider/);
assert.match(inspectorCapDetailHtml, /Pending Lead Inspector Review/);
assert.match(inspectorCapDetailHtml, /Root Cause Addressed/);
assert.match(inspectorCapDetailHtml, /Overall Assessment/);
assert.match(inspectorCapDetailHtml, /Mary Adams/);
assert.match(inspectorCapDetailHtml, /Request Revision/);
assert.match(inspectorCapDetailHtml, /Request More Evidence/);
assert.match(inspectorCapDetailHtml, /Submit to Lead Inspector/);
assert.match(inspectorCapDetailHtml, /data-field="cap-inspector-root-cause"/);
assert.doesNotMatch(inspectorCapDetailHtml, /Lead Inspector Decision/);

context.handleCapDetailPrepareSecondReport('F-2026-002');
assert.ok(context.state.capTrackingUi.inspectorReviewSentAt);
assert.equal(context.state.capTrackingUi.leadInspectorRecommendationAt, '');
assert.equal(context.state.capTrackingUi.submittedToUnitManagerAt, '');
assert.equal(context.state.notifications[0].role, 'leadInspector');
assert.match(context.state.notifications[0].text, /Inspector CAP review/);

context.state.capReviewUi.decision = 'accept';
context.state.capReviewUi.comment = 'CAP is acceptable; evidence remains required.';
context.handleCapReviewSubmitDecision('SEC-2026-002');
const acceptedCap = context.findingById('SEC-2026-002');
assert.equal(acceptedCap.cap.status, 'Accepted');
assert.equal(acceptedCap.status, 'EVIDENCE_REQUIRED');
assert.equal(acceptedCap.status === 'CLOSED', false);

context.state.role = 'inspector';
context.state.view = 'offline-field';
context.state.params = {};
context.render();
const evidenceHtml = elements.get('app-root').innerHTML;
const evidenceVisibleText = evidenceHtml.replace(/<[^>]+>/g, ' ');
assert.equal(context.state.view, 'inspector-assignments');
assert.match(evidenceHtml, /My Assignments/);
assert.doesNotMatch(evidenceHtml, /Inspection Evidence/);
assert.doesNotMatch(evidenceHtml, /Offline Field Inspection/);
assert.doesNotMatch(evidenceVisibleText, /Offline|offline|sync/i);
assert.doesNotMatch(evidenceHtml, /Field Evidence Package/);
assert.doesNotMatch(evidenceHtml, /Evidence Notes/);

console.log('inspector-nav-smoke: ok');
