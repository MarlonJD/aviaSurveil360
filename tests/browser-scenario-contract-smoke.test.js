const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
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
      classList: { add() {}, remove() {}, toggle() {} },
      parentNode: null,
      addEventListener() {},
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; },
      contains() { return false; },
      focus() {},
      closest() { return null; },
      querySelector() { return null; },
      querySelectorAll() { return []; }
    });
  }
  return elements.get(id);
}

function stubCreatedElement() {
  return {
    className: '',
    innerHTML: '',
    style: {},
    parentNode: null,
    href: '',
    download: '',
    addEventListener() {},
    appendChild(child) { child.parentNode = this; },
    removeChild(child) { child.parentNode = null; },
    click() {},
    focus() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

function dataEl(attrs) {
  return {
    value: '',
    tagName: 'BUTTON',
    getAttribute(name) { return attrs[name] || ''; }
  };
}

const context = {
  console,
  window: { scrollTo() {}, localStorage: null },
  document: {
    body: stubElement('body'),
    activeElement: null,
    addEventListener() {},
    createElement: stubCreatedElement,
    getElementById: stubElement,
    querySelector() { return null; },
    querySelectorAll() { return []; }
  },
  Blob: function MockBlob(parts, options) { this.parts = parts; this.type = options && options.type; },
  URL: { createObjectURL() { return 'blob:mock'; }, revokeObjectURL() {} },
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
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }));

function resetState(role, view) {
  context.state = context.freshState();
  context.state.role = role;
  context.state.view = view || context.homeView(role);
  context.state.params = {};
  elements.forEach((element) => {
    element.value = '';
    element.innerHTML = '';
  });
  return context.state;
}

test('Inspector cannot render or navigate to Department Manager closure approval', () => {
  const state = resetState('inspector', 'cap-review-detail');
  state.params.findingId = 'CAB-2026-011';
  const inspectorHtml = context.renderContent();
  assert.doesNotMatch(inspectorHtml, /Approve Closure Decision/);
  assert.doesNotMatch(inspectorHtml, /Open Department Manager Approval/);

  context.go('unit-manager-review', { findingId: 'CAB-2026-011' });
  assert.equal(state.view, context.homeView('inspector'));
  assert.doesNotMatch(stubElement('app-root').innerHTML, /Approve Closure Decision/);

  const findingBefore = JSON.stringify(context.findingById('CAB-2026-012'));
  assert.throws(
    () => context.handleCapDetailSubmitGeneralManager('CAB-2026-012'),
    /not authorized for inspector/i
  );
  assert.equal(JSON.stringify(context.findingById('CAB-2026-012')), findingBefore);
});

test('Inspector CAP acceptance is canonical and does not auto-advance approvals or role', () => {
  const state = resetState('inspector', 'cap-review-detail');
  state.params.findingId = 'CAB-2026-011';
  const finding = context.findingById('CAB-2026-011');
  const historyBefore = finding.cap.history.length;

  context.handleInspectorCapPackageDecision(finding.id, 'accept');

  assert.equal(state.role, 'inspector');
  assert.equal(finding.cap.status, 'Accepted');
  assert.equal(finding.status, 'EVIDENCE_REQUIRED');
  assert.equal(state.capTrackingUi.leadInspectorRecommendationAt, '');
  assert.equal(state.capTrackingUi.departmentManagerApprovedAt, '');
  assert.equal(state.capTrackingUi.finalReportReadyAt, '');
  assert.equal(finding.cap.history.length, historyBefore + 1);
  assert.doesNotMatch(stubElement('app-root').innerHTML, /Final Report is ready/);

  const roleScreens = [];
  state.role = 'inspector';
  state.view = 'cap-review-detail';
  state.params = { findingId: finding.id };
  roleScreens.push(context.renderContent());
  state.role = 'leadInspector';
  roleScreens.push(context.renderContent());
  state.role = 'manager';
  state.view = 'unit-manager-review';
  roleScreens.push(context.renderContent());
  state.role = 'auditee';
  state.view = 'service-provider-cap';
  state.serviceProviderUi.cap.selectedFindingId = finding.id;
  roleScreens.push(context.renderContent());
  roleScreens.forEach((html) => {
    assert.match(html, /CAB-2026-011/);
    assert.match(html, /Evidence Required/);
    assert.doesNotMatch(html, /F-014-|F-2026-/);
  });
});

test('Inspector CAP return requires a Comment to Auditee and appends canonical history only', () => {
  const state = resetState('inspector', 'cap-review-detail');
  state.params.findingId = 'CAB-2026-011';
  const finding = context.findingById('CAB-2026-011');
  const statusBefore = finding.status;
  const historyBefore = finding.cap.history.length;
  const internalBefore = JSON.stringify(finding.internalNotes);

  context.handleInspectorCapPackageDecision(finding.id, 'revision');
  assert.equal(finding.status, statusBefore);
  assert.equal(finding.cap.history.length, historyBefore);

  stubElement('inspector-cap-package-comment').value = 'Clarify the implementation sequence and resubmit the CAP.';
  context.handleInspectorCapPackageDecision(finding.id, 'revision');

  assert.equal(finding.status, 'CAP_MORE_INFO');
  assert.equal(finding.cap.status, 'More Information Requested');
  assert.equal(finding.cap.history.length, historyBefore + 1);
  assert.equal(finding.commentsToAuditee.at(-1).text, 'Clarify the implementation sequence and resubmit the CAP.');
  assert.equal(JSON.stringify(finding.internalNotes), internalBefore);
  assert.equal(state.notifications[0].organizationId, finding.orgId);
});

test('Department Manager decision updates the canonical Finding and does not use UI-only closure', () => {
  const state = resetState('manager', 'unit-manager-review');
  state.params.findingId = 'CAB-2026-012';
  const finding = context.findingById('CAB-2026-012');

  context.handleCapDetailSubmitGeneralManager(finding.id);

  assert.equal(finding.managementReview.decision, 'approved');
  assert.equal(finding.status, 'EVIDENCE_REQUIRED');
  assert.equal(state.capTrackingUi.findingClosedAt, '');
});

test('submitted checklist renders a reason-required reopen contract', () => {
  const state = resetState('inspector', 'audit-detail');
  state.params.auditId = 'AUD-2026-001';
  state.inspectionWorkspaces['AUD-2026-001'].submittedAt = '2026-06-15T11:00:00.000Z';
  const submittedChecklistHtml = context.renderContent();

  assert.match(submittedChecklistHtml, /Reopen for Editing/);
  context.handleAction('inspection-reopen-editing', dataEl({ 'data-id': 'AUD-2026-001' }));
  assert.match(stubElement('modal-host').innerHTML, /Reason for reopening/);
  assert.match(stubElement('modal-host').innerHTML, /data-act="inspection-reopen-confirm"/);
});

test('evidence-verified closure report and Auditee timeline use the exact basis label', () => {
  const state = resetState('inspector', 'report');
  const finding = context.findingById('OPS-2025-014');
  finding.closureType = 'evidence-verified';
  state.params.findingId = finding.id;

  const evidenceClosedReportHtml = context.renderContent();
  assert.match(evidenceClosedReportHtml, /Evidence accepted and verified/);
  assert.doesNotMatch(evidenceClosedReportHtml, /Authorized closure \(audit-logged\)/);

  state.role = 'auditee';
  state.view = 'service-provider-cap';
  state.serviceProviderUi.cap.selectedFindingId = finding.id;
  const auditeeHtml = context.renderContent();
  assert.match(auditeeHtml, /Evidence accepted and verified/);
});

test('localhost entrypoint cache-busts every current scenario-integrity asset together', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const assetVersions = Array.from(indexHtml.matchAll(/[?&]v=([^"&]+)/g), (match) => match[1]);

  assert.ok(assetVersions.length >= 12, 'expected stylesheet and JavaScript asset versions');
  assert.deepEqual(new Set(assetVersions), new Set(['20260720-wsa-remediation-v5']));
});

test('planning intake describes all five runnable audit-specific checklist packages truthfully', () => {
  const state = resetState('manager', 'wizard');
  state.wizard = {
    step: 4,
    templateId: 'TPL-SEC-2026',
    requestedBudget: '0',
    currency: 'USD'
  };

  const wizardHtml = context.viewAuditWizard();
  assert.match(wizardHtml, /Cabin, Flight Operations, Airworthiness, Ramp, and Security packages are runnable/);
  assert.doesNotMatch(wizardHtml, /Only the Cabin Inspection template is runnable/);
});

test('materialized executable Audits appear in Inspector assignments with their exact checklist package', () => {
  const state = resetState('inspector', 'inspector-assignments');
  state.audits.push({
    id: 'AUD-2026-099',
    ref: 'Materialized Flight Operations Audit',
    orgId: 'ORG-XYZ',
    type: 'Continued Surveillance',
    domain: 'Flight Operations',
    templateId: 'TPL-FOPS-2026',
    date: '2026-10-20',
    endDate: '2026-10-21',
    mode: 'On-site',
    location: 'Fly Namibia Operations Centre',
    lead: 'Caner Yildiz',
    team: ['Caner Yildiz', 'Aylin Sezer'],
    status: 'Scheduled',
    checklistStarted: false,
    planningItemId: 'PLAN-2026-TEST-FOPS'
  });
  state.inspectionWorkspaces['AUD-2026-099'] = {
    selectedSectionKey: 'flight-operations',
    answersByQuestionId: {}
  };

  const assignment = context.inspectorAssignmentRows().find((row) => row.auditId === 'AUD-2026-099');
  assert.ok(assignment);
  assert.equal(assignment.title, 'Materialized Flight Operations Audit');
  assert.equal(assignment.type, 'Flight Operations');
  assert.equal(assignment.questionsTotal, 3);
  assert.equal(assignment.actionDisabled, false);
  assert.equal(context.inspectorAssignmentStats().open, 9);
  assert.equal(context.inspectorAssignmentStats().totalAssigned, 18);
});

test('completed Inspector assignments never expose a generic report action for the wrong Audit', () => {
  resetState('inspector', 'inspector-assignments');

  ['PR-2026-017', 'PR-2026-011'].forEach((assignmentId) => {
    const assignment = context.inspectorAssignmentRows().find((row) => row.id === assignmentId);
    assert.ok(assignment, `missing ${assignmentId}`);
    assert.equal(assignment.status, 'completed');
    assert.equal(assignment.actionDisabled, true);
    assert.equal(assignment.actionDisabledLabel, 'Report preview unavailable');
  });

  const html = context.viewInspectorAssignments();
  assert.doesNotMatch(html, /Report preview unavailable|Template preview only/);
  assert.match(html, /More actions for Ramp Inspection/);
  assert.doesNotMatch(html, /data-assignment-id="PR-2026-017"[^>]*>View Report/);
  assert.doesNotMatch(html, /data-assignment-id="PR-2026-011"[^>]*>View Report/);
});
