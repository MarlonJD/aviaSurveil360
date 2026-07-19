const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
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
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

function unannouncedInput(overrides) {
  return Object.assign({
    organizationId: 'ORG-SKY',
    applicationType: 'Special Inspection',
    domain: 'Security',
    inspectionCategory: 'Ad Hoc / Unannounced',
    purpose: 'Unannounced access-control compliance inspection.',
    triggerType: 'Risk based / targeted inspection',
    riskCategory: 'Cargo gate access control',
    plannedDate: '2026-07-24',
    mode: 'On-site',
    location: 'SkyCargo Terminal',
    templateId: 'TPL-SEC-2026',
    scope: 'Restricted cargo-area access controls and records.',
    currency: 'USD',
    requestedBudget: 0
  }, overrides || {});
}

function createAsManager(state, overrides) {
  return context.createPlanningInspection(state, unannouncedInput(overrides), {
    role: 'manager',
    name: context.ROLES.manager.user
  });
}

function approveAndPrepare(item) {
  context.applyApprovalDecision(item, {
    decision: 'approve',
    actor: { role: 'finance', name: context.ROLES.finance.user },
    comment: 'No additional budget required.'
  });
  context.applyApprovalDecision(item, {
    decision: 'forward',
    actor: { role: 'gm', name: context.ROLES.gm.user },
    comment: 'Forwarded for final approval.'
  });
  context.applyApprovalDecision(item, {
    decision: 'approve',
    actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
    comment: 'Approved for controlled release.'
  });
  context.releasePlanningItem(item, { actorRole: 'gm', actorName: context.ROLES.gm.user });
  context.acceptReleasedPlanningItem(item, { actorRole: 'manager', actorName: context.ROLES.manager.user });
  context.assignLeadInspectorToPlanningItem(item, {
    actorRole: 'manager',
    actorName: context.ROLES.manager.user,
    leadInspector: 'Caner Yildiz'
  });
  context.proposePlanningTeamAndSchedule(item, {
    actorRole: 'leadInspector',
    actorName: 'Caner Yildiz',
    team: ['Caner Yildiz', 'Aylin Sezer'],
    startDate: '2026-07-24',
    endDate: '2026-07-24',
    resources: 'Two inspectors; internal checklist package.'
  });
  context.confirmPlanningPreparation(item, {
    actorRole: 'manager',
    actorName: context.ROLES.manager.user
  });
}

test('Department Manager intake creates a governed unannounced Planning item', () => {
  const state = context.freshState();
  const input = unannouncedInput();
  const item = context.createPlanningInspection(state, input, {
    role: 'manager',
    name: context.ROLES.manager.user
  });

  assert.match(item.id, /^PLAN-2026-INS-\d{3}$/);
  assert.equal(item.inspectionCategory, 'Ad Hoc / Unannounced');
  assert.equal(item.noticePolicy, 'withheld');
  assert.equal(item.applicationType, 'Special Inspection');
  assert.equal(item.approval.currentIndex, 1);
  assert.equal(context.approvalSummary(item).ownerRole, 'finance');
  assert.equal(item.preparation.status, 'not_released');
  assert.equal(item.auditId, '');
  assert.equal(state.audits.some((audit) => audit.ref === item.title), false);
  assert.equal(state.inspectionCoordinations.some((record) => record.planningItemId === item.id), false);
});

test('inspection category policy is explicit and intake validates category and authority', () => {
  const state = context.freshState();
  const input = unannouncedInput();

  assert.deepEqual(
    JSON.parse(JSON.stringify(context.inspectionCategoryPolicy('Routine / Announced'))),
    { inspectionCategory: 'Routine / Announced', noticePolicy: 'advance', coordinationStatus: 'ready_to_notify' }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.inspectionCategoryPolicy('Ad Hoc / Unannounced'))),
    { inspectionCategory: 'Ad Hoc / Unannounced', noticePolicy: 'withheld', coordinationStatus: 'notice_withheld' }
  );
  assert.throws(
    () => context.createPlanningInspection(state, Object.assign({}, input, { inspectionCategory: '' }), {
      role: 'manager', name: context.ROLES.manager.user
    }),
    /Inspection Category is required/i
  );
  assert.throws(
    () => context.createPlanningInspection(state, input, { role: 'inspector', name: 'Wrong role' }),
    /Department Manager/i
  );
});

test('Lead Inspector receives a scoped post-release preparation task without broad Planning navigation', () => {
  const state = context.freshState();
  const item = createAsManager(state);

  context.applyApprovalDecision(item, {
    decision: 'approve',
    actor: { role: 'finance', name: context.ROLES.finance.user },
    comment: 'No additional budget required.'
  });
  context.applyApprovalDecision(item, {
    decision: 'forward',
    actor: { role: 'gm', name: context.ROLES.gm.user },
    comment: 'Forwarded for final approval.'
  });
  context.applyApprovalDecision(item, {
    decision: 'approve',
    actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
    comment: 'Approved for controlled release.'
  });
  context.releasePlanningItem(item, { actorRole: 'gm', actorName: context.ROLES.gm.user });
  context.acceptReleasedPlanningItem(item, { actorRole: 'manager', actorName: context.ROLES.manager.user });
  context.assignLeadInspectorToPlanningItem(item, {
    actorRole: 'manager',
    actorName: context.ROLES.manager.user,
    leadInspector: 'Caner Yildiz'
  });

  context.state = state;
  context.state.role = 'leadInspector';
  context.state.view = 'lead-review';
  context.state.params = {};
  const html = context.viewLeadAssignedAudits();
  assert.match(html, new RegExp(item.id));
  assert.match(html, /Post-release preparation/);
  assert.match(html, /data-act="lead-planning-preparation-open"/);
  assert.doesNotMatch(html, /data-view="planning"/);

  const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  assert.match(appSource, /case 'lead-planning-preparation': return viewPlanningWorkspace\(\);/);
  assert.match(appSource, /case 'lead-planning-preparation-open': handleLeadPlanningPreparationOpen\(id\); break;/);
  assert.match(appSource, /go\('lead-planning-preparation', \{ planningId: item\.id, tab: 'preparation' \}\)/);
});

test('unannounced Audit materializes only after preparation and remains private', () => {
  const state = context.freshState();
  const item = createAsManager(state);
  approveAndPrepare(item);

  const result = context.materializeReadyPlanningInspection(state, item);
  assert.equal(result.created, true);
  assert.equal(result.audit.status, 'Scheduled');
  assert.equal(result.audit.inspectionCategory, 'Ad Hoc / Unannounced');
  assert.equal(result.audit.noticePolicy, 'withheld');
  assert.equal(result.coordination.status, 'notice_withheld');
  assert.equal(result.coordination.noticePolicy, 'withheld');
  assert.equal(result.coordination.notifiedAt, '');
  assert.equal(context.serviceProviderInspectionCoordinationRows(state, 'ORG-SKY').length, 0);
  assert.equal(state.notifications.some((notification) => notification.role === 'auditee' && notification.organizationId === 'ORG-SKY'), false);

  const replay = context.materializeReadyPlanningInspection(state, item);
  assert.equal(replay.created, false);
  assert.equal(replay.audit.id, result.audit.id);
  assert.equal(state.audits.filter((audit) => audit.id === result.audit.id).length, 1);
  assert.equal(state.inspectionCoordinations.filter((record) => record.auditId === result.audit.id).length, 1);

  const restored = context.mergeDemoState(JSON.parse(JSON.stringify(state)));
  const restoredItem = restored.planningItems.filter((candidate) => candidate.id === item.id)[0];
  const restoredAudit = restored.audits.filter((candidate) => candidate.id === item.auditId)[0];
  const restoredCoordination = context.inspectionCoordinationByAuditId(restored, item.auditId);

  assert.equal(restoredItem.noticePolicy, 'withheld');
  assert.equal(restoredItem.preparation.status, 'ready_for_execution');
  assert.equal(restoredAudit.noticePolicy, 'withheld');
  assert.equal(restoredCoordination.status, 'notice_withheld');
  assert.equal(
    context.serviceProviderInspectionCoordinationRows(restored, restoredAudit.orgId).some((row) => row.auditId === restoredAudit.id),
    false
  );
});

test('routine materialization prepares coordination without notifying the Service Provider', () => {
  const state = context.freshState();
  const routineItem = createAsManager(state, { inspectionCategory: 'Routine / Announced' });
  approveAndPrepare(routineItem);

  const routineResult = context.materializeReadyPlanningInspection(state, routineItem);
  assert.equal(routineResult.audit.noticePolicy, 'advance');
  assert.equal(routineResult.coordination.status, 'ready_to_notify');
  assert.equal(routineResult.coordination.noticePolicy, 'advance');
  assert.equal(routineResult.coordination.notifiedAt, '');
  assert.equal(state.notifications.some((notification) => notification.role === 'auditee' && notification.organizationId === 'ORG-SKY'), false);
});
