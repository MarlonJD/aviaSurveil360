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
context.state.view = 'dashboard';
context.state.params = {};
context.render();

const html = elements.get('app-root').innerHTML;
const inspectorNavLabels = context.NAV.inspector
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');

assert.match(html, /My Inspections/);
assert.match(html, /Assigned Inspections/);
assert.match(html, /CAP Reviews/);
assert.match(html, /Reports/);
assert.doesNotMatch(html, /Draft Reports/);
assert.match(html, /Profile/);
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
assert.equal(context.NAV.inspector.some((item) => item.view === 'package-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'regulatory-library'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'checklist-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'templates'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'cap-effectiveness'), false);
assert.equal(context.NAV.manager.some((item) => item.view === 'checklist-builder' && item.label === 'Checklist Builder'), true);
assert.equal(context.NAV.admin.some((item) => item.view === 'regulatory-library' && item.label === 'NAMCARS Library'), true);
assert.equal(context.NAV.manager.some((item) => item.view === 'cap-effectiveness' && item.label === 'Repeat Findings'), true);

context.state.view = 'regulatory-library';
context.state.params = {};
context.render();
const restrictedRegulatoryHtml = elements.get('app-root').innerHTML;
assert.match(restrictedRegulatoryHtml, /My Inspections/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Regulatory Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /NAMCARS Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Cross-Reference/);

context.state.view = 'checklist-builder';
context.state.params = {};
context.render();
const restrictedBuilderHtml = elements.get('app-root').innerHTML;
assert.match(restrictedBuilderHtml, /My Inspections/);
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
assert.match(capReviewHtml, /CAP Reviews/);
assert.match(capReviewHtml, /Search CAP ID, Inspection ID, Organization/);
assert.match(capReviewHtml, /data-act="cap-review-row"/);
assert.match(capReviewHtml, /data-field="cap-review-decision"/);
assert.match(capReviewHtml, /CAP Details/);
assert.match(capReviewHtml, /Evidence/);
assert.match(capReviewHtml, /History/);
assert.match(capReviewHtml, /Finding: F-2026-001/);
assert.match(capReviewHtml, /Submit Decision/);
assert.doesNotMatch(capReviewHtml, /Every finding shows owner/);

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

context.state.view = 'offline-field';
context.render();
const evidenceHtml = elements.get('app-root').innerHTML;
const evidenceVisibleText = evidenceHtml.replace(/<[^>]+>/g, ' ');
assert.match(evidenceHtml, /Inspection Evidence/);
assert.doesNotMatch(evidenceHtml, /Offline Field Inspection/);
assert.doesNotMatch(evidenceVisibleText, /Offline|offline|sync/i);
assert.match(evidenceHtml, /Field Evidence Package/);
assert.match(evidenceHtml, /Evidence Notes/);

console.log('inspector-nav-smoke: ok');
