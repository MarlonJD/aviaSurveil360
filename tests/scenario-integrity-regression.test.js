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
  'js/work-items.js'
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }));

function resetState() {
  context.state = context.freshState();
  return context.state;
}

test('checklist answers and Potential Findings are isolated by exact Audit ID', () => {
  const state = resetState();
  const auditA = 'AUD-2026-001';
  const auditB = 'AUD-2026-006';
  const questionId = 'cab-em-eq-pbe';

  context.recordChecklistResult(auditA, questionId, 'noncompliant', 'Audit A exception', []);
  context.recordChecklistResult(auditB, questionId, 'observation', 'Audit B observation', []);

  assert.equal(context.checklistAnswerForAudit(state, auditA, questionId).comment, 'Audit A exception');
  assert.equal(context.checklistAnswerForAudit(state, auditB, questionId).comment, 'Audit B observation');
  assert.notEqual(
    context.createPotentialFinding(auditA, questionId).id,
    context.createPotentialFinding(auditB, questionId).id
  );
});

test('legacy question-only answers are imported only with an explicit Audit ID', () => {
  const saved = resetState();
  saved.demoStateVersion = 10;
  saved.checklistAnswers = {
    'cab-em-eq-pbe': {
      auditId: 'AUD-2026-001',
      answer: 'noncompliant',
      comment: 'Explicitly scoped legacy answer',
      evidenceFiles: []
    },
    'cab-galley-oven': {
      answer: 'observation',
      comment: 'Ambiguous legacy answer',
      evidenceFiles: []
    }
  };

  const migrated = context.mergeDemoState(saved);
  assert.equal(context.checklistAnswerForAudit(migrated, 'AUD-2026-001', 'cab-em-eq-pbe').comment, 'Explicitly scoped legacy answer');
  assert.equal(context.checklistAnswerForAudit(migrated, 'AUD-2026-001', 'cab-galley-oven'), null);
  assert.ok(migrated.auditLog.some((entry) => /ambiguous legacy checklist answer/i.test(entry.action)));
});

test('submitted checklist reopen requires authority, stage, and a reason without partial mutation', () => {
  const state = resetState();
  const auditId = 'AUD-2026-001';
  const workspace = context.inspectionWorkspaceForAudit(state, auditId);
  workspace.submittedAt = '2026-06-15T11:00:00.000Z';
  workspace.submittedByUserId = 'USR-AYLIN';
  const before = JSON.stringify(workspace);

  assert.throws(
    () => context.reopenInspectionChecklistForEditing(state, auditId, {
      role: 'manager', userId: 'USR-MANAGER', reason: 'Manager edit', at: '2026-06-15T12:00:00.000Z'
    }),
    /Inspector or Lead Inspector authority required/i
  );
  assert.equal(JSON.stringify(workspace), before);

  assert.throws(
    () => context.reopenInspectionChecklistForEditing(state, auditId, {
      role: 'inspector', userId: 'USR-AYLIN', reason: '   ', at: '2026-06-15T12:00:00.000Z'
    }),
    /Reason for reopening is required/i
  );
  assert.equal(JSON.stringify(workspace), before);

  const nonSubmittedState = resetState();
  const nonSubmittedWorkspace = context.inspectionWorkspaceForAudit(nonSubmittedState, auditId);
  const nonSubmittedBefore = JSON.stringify(nonSubmittedState);
  assert.throws(
    () => context.reopenInspectionChecklistForEditing(nonSubmittedState, auditId, {
      role: 'inspector', userId: 'USR-AYLIN', reason: 'Correct a submitted answer', at: '2026-06-15T12:00:00.000Z'
    }),
    /Only a submitted checklist can be reopened/i
  );
  assert.equal(JSON.stringify(nonSubmittedState), nonSubmittedBefore);

  state.audits.find((audit) => audit.id === auditId).reportIssuedAt = '2026-06-15T11:30:00.000Z';
  const issuedBefore = JSON.stringify(state);
  assert.throws(
    () => context.reopenInspectionChecklistForEditing(state, auditId, {
      role: 'leadInspector', userId: 'USR-CANER', reason: 'Late correction', at: '2026-06-15T12:00:00.000Z'
    }),
    /Issued or closed inspections cannot be reopened/i
  );
  assert.equal(JSON.stringify(state), issuedBefore);
  delete state.audits.find((audit) => audit.id === auditId).reportIssuedAt;

  assert.equal(context.reopenInspectionChecklistForEditing(state, auditId, {
    role: 'leadInspector', userId: 'USR-CANER', reason: 'Correct the submitted evidence reference.', at: '2026-06-15T12:00:00.000Z'
  }), true);
  assert.equal(workspace.lastSubmittedAt, '2026-06-15T11:00:00.000Z');
  assert.equal(workspace.lastSubmittedByUserId, 'USR-AYLIN');
  assert.equal(workspace.reopenHistory.at(-1).reason, 'Correct the submitted evidence reference.');
  assert.equal(workspace.reopenHistory.at(-1).auditId, auditId);
  assert.ok(state.auditLog.some((entry) => entry.target === auditId && /reopened for editing/i.test(entry.action)));
});

test('Observation defaults do not force CAP, Evidence, or a Due Date', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.findingRequirementDefaults(4))),
    { capRequired: false, evidenceRequired: false, dueDate: null }
  );
});

test('closure basis uses canonical evidence-verified and authorized labels', () => {
  const state = resetState();
  const closed = state.findings.find((finding) => finding.id === 'OPS-2025-014');
  closed.closureType = 'evidence-verified';
  assert.equal(context.closureBasisLabel(closed), 'Evidence accepted and verified');

  const authorized = state.findings.find((finding) => finding.id === 'CAB-2026-013');
  const authorizedResult = context.applyAuthorizedFindingClosure(state, authorized.id, {
    actor: { role: 'manager', name: 'Mehmet Kaya' },
    reason: 'Configured Observation closure reviewed by the authorized manager.',
    commentToAuditee: 'The CAA recorded an authorized closure for this Finding.',
    internalNote: 'Manager reviewed the configured closure boundary.'
  });
  assert.equal(authorizedResult.ok, true);
  assert.equal(authorized.status, 'CLOSED');
  assert.equal(authorized.closureType, 'authorized');
  assert.equal(authorized.authorizedClosure.reason, 'Configured Observation closure reviewed by the authorized manager.');
  assert.equal(authorized.authorizedClosure.actorName, 'Mehmet Kaya');
  assert.equal(context.closureBasisLabel(authorized), 'Authorized closure (audit-logged)');

});

test('reminder stages and browser-local events are deterministic, scoped, and side-effect free', () => {
  const state = resetState();
  const finding = state.findings.find((item) => item.id === 'CAB-2026-011');
  finding.status = 'WAITING_CAP';

  [
    ['2026-07-15', '2026-06-15', '30_days'],
    ['2026-06-30', '2026-06-15', '15_days'],
    ['2026-06-22', '2026-06-15', '7_days'],
    ['2026-06-15', '2026-06-15', 'due_today'],
    ['2026-06-14', '2026-06-15', 'overdue'],
    ['2026-06-16', '2026-06-15', 'none']
  ].forEach(([dueDate, today, expected]) => {
    finding.dueDate = dueDate;
    assert.equal(context.deriveReminderStage(finding, today), expected);
  });
  finding.status = 'CLOSED';
  finding.dueDate = '2026-06-14';
  assert.equal(context.deriveReminderStage(finding, '2026-06-15'), 'none');

  finding.status = 'WAITING_CAP';
  finding.severity = 1;
  finding.dueDate = '2026-06-14';
  const enforcementBefore = JSON.stringify({
    status: finding.status,
    closureType: finding.closureType || '',
    enforcement: finding.enforcement || null
  });
  const firstPass = context.ensureDeterministicReminderEvents(state, '2026-06-15');
  const secondPass = context.ensureDeterministicReminderEvents(state, '2026-06-15');

  assert.equal(secondPass.length, firstPass.length, 'rerunning reminder derivation must not duplicate events');
  const findingEvents = state.reminderEvents.filter((event) => event.findingId === finding.id);
  assert.deepEqual(
    JSON.parse(JSON.stringify(findingEvents.map((event) => event.id).sort())),
    [
      `REM-${finding.id}-critical_attention`,
      `REM-${finding.id}-overdue`,
      `REM-${finding.id}-overdue_manager_escalation`
    ].sort()
  );
  findingEvents.forEach((event) => {
    assert.equal(event.organizationId, finding.orgId);
    assert.equal(event.channel, 'in_app');
    assert.equal(event.deliveryStatus, 'demo_recorded');
    assert.equal(event.createdDate, '2026-06-15');
  });
  assert.equal(findingEvents.find((event) => event.stage === 'overdue').recipientRole, 'auditee');
  assert.equal(findingEvents.find((event) => event.stage === 'critical_attention').recipientRole, 'manager');
  assert.equal(findingEvents.find((event) => event.stage === 'overdue_manager_escalation').recipientRole, 'manager');
  assert.equal(
    JSON.stringify({ status: finding.status, closureType: finding.closureType || '', enforcement: finding.enforcement || null }),
    enforcementBefore,
    'reminder derivation must not close a Finding or start enforcement'
  );

  const manualEvent = context.recordManualReminderEvent(state, finding, {
    role: 'inspector', name: 'Aylin Sezer', at: '2026-06-15T12:30:00.000Z'
  });
  assert.match(manualEvent.id, /^MANUAL-/);
  assert.equal(manualEvent.stage, 'manual');
  assert.equal(manualEvent.recipientRole, 'auditee');
  assert.ok(state.auditLog.some((entry) => entry.target === finding.id && /manual reminder/i.test(entry.action)));
});
