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

assert.match(html, /Dashboard/);
assert.match(html, /My Inspections/);
assert.match(html, /CAP Reviews/);
assert.match(html, /Draft Reports/);
assert.match(html, /Lead Inspector/);
assert.match(html, />Reports</);
assert.match(html, /Users/);
assert.match(html, /Settings/);
assert.match(html, /Final Report - Routine Inspection/);
assert.match(html, /Report Details/);
assert.match(html, /Submit to Unit Manager/);
assert.match(html, /CAP Deadlines by Level/);
assert.doesNotMatch(html, /Planning/);
assert.doesNotMatch(html, /Audit Work Queue/);
assert.doesNotMatch(html, />Audits</);
assert.doesNotMatch(html, /data-view="planning"/);
assert.doesNotMatch(html, /data-view="calendar"/);
assert.doesNotMatch(html, /data-view="reports"/);
assert.doesNotMatch(leadNavLabels, /Planning/);
assert.doesNotMatch(leadNavLabels, /Audits/);
assert.equal(leadNavItems.some((item) => item.label === 'Reports'), true);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'planning'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'calendar'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'reports'), false);

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
assert.match(capTrackingHtml, /Report Approved by ED/);
assert.match(capTrackingHtml, /sent to the service provider on 22 Jun 2026/);
assert.match(capTrackingHtml, /Send Reminder/);
assert.match(capTrackingHtml, /CAP Process Overview/);
assert.match(capTrackingHtml, /Level 1/);
assert.match(capTrackingHtml, /14 days/);
assert.match(capTrackingHtml, /Level 2/);
assert.match(capTrackingHtml, /90 days/);
assert.match(capTrackingHtml, /data-act="cap-track-row-action"/);
assert.match(capTrackingHtml, /Review CAP/);
assert.match(capTrackingHtml, /F-2026-004/);
assert.match(capTrackingHtml, /Overdue/);
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
assert.match(capReviewDetailHtml, /CAP Review - Finding F-2026-002/);
assert.match(capReviewDetailHtml, /Training records incomplete for ground handling staff/);
assert.match(capReviewDetailHtml, /Inspector Review/);
assert.match(capReviewDetailHtml, /Send Review to Lead Inspector/);
assert.match(capReviewDetailHtml, /Inspector Review Handoff/);
assert.match(capReviewDetailHtml, /Lead Inspector Validation/);
assert.match(capReviewDetailHtml, /Unit Manager/);
assert.match(capReviewDetailHtml, /General Manager/);
assert.doesNotMatch(capReviewDetailHtml, /Enforcement Options \(if CAP not effective\)/);

context.handleAction('cap-detail-prepare-second-report', dataEl({ 'data-id': 'F-2026-002' }));
assert.ok(context.state.capTrackingUi.inspectorReviewSentAt);
assert.equal(context.state.notifications[0].role, 'leadInspector');
assert.match(context.state.notifications[0].text, /Inspector CAP review/);

context.state.role = 'manager';
context.state.view = 'unit-manager-review';
context.state.params = { findingId: 'F-2026-002' };
context.render();
const unitManagerHtml = elements.get('app-root').innerHTML;
assert.match(unitManagerHtml, /Unit Manager Review - Finding F-2026-002/);
assert.match(unitManagerHtml, /Review by Inspectors \(2nd Review\)/);
assert.match(unitManagerHtml, /Recommended Action \/ Enforcement Type/);
assert.match(unitManagerHtml, /Operational Decisions/);
assert.match(unitManagerHtml, /Application Decisions/);
assert.match(unitManagerHtml, /License Renewal/);
assert.match(unitManagerHtml, /Accept Initial Application/);
assert.match(unitManagerHtml, /Submit Recommendation to General Manager/);

context.handleAction('cap-unit-choose-file', dataEl({ 'data-id': 'F-2026-002' }));
assert.match(context.state.capTrackingUi.unitAttachmentName, /unit_manager/);
context.handleAction('cap-unit-submit-general-manager', dataEl({ 'data-id': 'F-2026-002' }));
assert.ok(context.state.capTrackingUi.submittedToGeneralManagerAt);
assert.equal(context.state.notifications[0].role, 'gm');
assert.match(context.state.notifications[0].text, /General Manager review/);

context.state.role = 'leadInspector';
['planning', 'calendar', 'reports'].forEach((restrictedView) => {
  context.state.view = restrictedView;
  context.state.params = {};
  context.render();
  const restrictedHtml = elements.get('app-root').innerHTML;
  assert.match(restrictedHtml, /Lead Inspector/);
  assert.match(restrictedHtml, /Final Report - Routine Inspection/);
  assert.doesNotMatch(restrictedHtml, /Audit Work Queue/);
  assert.doesNotMatch(restrictedHtml, /Planning/);
});

console.log('lead-inspector-nav-smoke: ok');
