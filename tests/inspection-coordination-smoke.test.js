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
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; },
      click() {},
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
    body: { classList: { toggle() {} }, appendChild() {}, removeChild() {} },
    addEventListener() {},
    createElement() { return { style: {}, click() {}, parentNode: null }; },
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

assert.ok(
  context.NAV.auditee.some((item) => item.view === 'service-provider-inspection-coordination'),
  'Service Provider navigation exposes announced-inspection coordination'
);

let state = context.freshState();
let routine = context.inspectionCoordinationByAuditId(state, 'AUD-2026-001');
let unannounced = context.inspectionCoordinationByAuditId(state, 'AUD-2026-005');

assert.equal(routine.noticePolicy, 'advance');
assert.equal(routine.status, 'ready_to_notify');
assert.equal(routine.proposedDate, '2026-06-15');
assert.match(routine.checklistName, /Cabin Inspection Checklist/);
assert.equal(unannounced.noticePolicy, 'withheld');
assert.equal(unannounced.status, 'notice_withheld');
assert.equal(context.serviceProviderInspectionCoordinationRows(state, 'ORG-XYZ').length, 0);

context.state = state;
context.state.role = 'leadInspector';
context.state.view = 'lead-assignment';
context.state.params = { auditId: 'AUD-2026-001' };

let html = context.renderContent();
assert.match(html, /Service Provider Coordination/);
assert.match(html, /Routine \/ Announced/);
assert.match(html, /Send Coordination Package/);
assert.match(html, /Checklist and relevant information/);
assert.match(html, /Routine:[\s\S]*notify the Service Provider after Lead Inspector assignment/);
assert.match(html, /Ad Hoc \/ Unannounced:[\s\S]*withhold advance notification and coordination/);

context.handleAction('lead-assignment-notify-provider', dataEl({ 'data-id': 'AUD-2026-001' }));
routine = context.inspectionCoordinationByAuditId(context.state, 'AUD-2026-001');
assert.equal(routine.status, 'awaiting_provider_response');
assert.ok(routine.notifiedAt);
assert.equal(context.state.notifications[0].role, 'auditee');
assert.equal(context.state.notifications[0].organizationId, 'ORG-XYZ');
assert.match(context.state.notifications[0].text, /proposed inspection date/i);
assert.equal(context.serviceProviderInspectionCoordinationRows(context.state, 'ORG-XYZ').length, 1);

context.state.role = 'auditee';
context.state.view = 'service-provider-inspection-coordination';
context.state.params = {};
html = context.renderContent();
assert.match(html, /Inspection Coordination/);
assert.match(html, /15 Jun 2026/);
assert.match(html, /Cabin Inspection Checklist/);
assert.match(html, /Confirm Proposed Date/);
assert.match(html, /Propose Alternative Date/);
assert.doesNotMatch(html, /AUD-2026-005|notice withheld|Internal CAA Note/i);

stubElement('service-provider-alternative-date-AUD-2026-001').value = '2026-06-17';
stubElement('service-provider-coordination-comment-AUD-2026-001').value = 'Aircraft availability is better on 17 June.';
context.handleAction('service-provider-coordination-propose', dataEl({ 'data-id': 'AUD-2026-001' }));
routine = context.inspectionCoordinationByAuditId(context.state, 'AUD-2026-001');
assert.equal(routine.status, 'alternative_proposed');
assert.equal(routine.alternativeDate, '2026-06-17');
assert.match(routine.providerComment, /Aircraft availability/);
assert.equal(context.state.notifications[0].role, 'leadInspector');

context.state.role = 'leadInspector';
context.state.view = 'lead-assignment';
context.state.params = { auditId: 'AUD-2026-001' };
html = context.renderContent();
assert.match(html, /Alternative Date Proposed/);
assert.match(html, /17 Jun 2026/);
assert.match(html, /Accept Alternative Date/);
context.handleAction('lead-assignment-accept-alternative', dataEl({ 'data-id': 'AUD-2026-001' }));
routine = context.inspectionCoordinationByAuditId(context.state, 'AUD-2026-001');
assert.equal(routine.status, 'date_confirmed');
assert.equal(routine.confirmedDate, '2026-06-17');
assert.ok(routine.caaConfirmedAt);

state = context.freshState();
context.state = state;
context.state.role = 'leadInspector';
context.state.view = 'lead-assignment';
context.state.params = { auditId: 'AUD-2026-001' };
context.handleAction('lead-assignment-notify-provider', dataEl({ 'data-id': 'AUD-2026-001' }));
context.state.role = 'auditee';
context.state.view = 'service-provider-inspection-coordination';
context.state.params = {};
context.handleAction('service-provider-coordination-confirm', dataEl({ 'data-id': 'AUD-2026-001' }));
routine = context.inspectionCoordinationByAuditId(context.state, 'AUD-2026-001');
assert.equal(routine.status, 'date_confirmed');
assert.equal(routine.confirmedDate, routine.proposedDate);
assert.ok(routine.respondedAt);

const restored = context.mergeDemoState(JSON.parse(JSON.stringify(context.state)));
assert.equal(context.inspectionCoordinationByAuditId(restored, 'AUD-2026-001').status, 'date_confirmed');
assert.equal(context.inspectionCoordinationByAuditId(restored, 'AUD-2026-005').status, 'notice_withheld');

console.log('inspection-coordination-smoke: ok');
