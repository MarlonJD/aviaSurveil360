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
  'js/reports.js',
  'js/manager-workspaces.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

function actor(role) {
  return { role, name: context.ROLES[role].user };
}

function clonePreliminaryReport(state, id, capRequired) {
  const artifact = JSON.parse(JSON.stringify(context.reportArtifactById('PR-2026-018', state)));
  artifact.id = id;
  artifact.approvalPackageId = id;
  artifact.capRequired = capRequired;
  artifact.status = 'pending_manager';
  artifact.ownerRole = 'manager';
  artifact.locked = false;
  artifact.sharedAt = '';
  artifact.releasedAt = '';
  artifact.history = [];
  state.auditReports.push(artifact);

  const projection = JSON.parse(JSON.stringify(
    state.managerReports.find((report) => report.id === 'PR-2026-018')
  ));
  projection.id = id;
  projection.approvalPackageId = id;
  projection.capRequired = capRequired;
  projection.status = 'pending_manager';
  projection.ownerRole = 'manager';
  projection.sharedAt = '';
  projection.history = [];
  state.managerReports.push(projection);
  return artifact;
}

function advancePreliminaryToExecutive(state, report) {
  let result = context.applyManagerReportDecision(
    state,
    report.id,
    'approve',
    'Department review complete.',
    actor('manager')
  );
  assert.equal(result.ok, true);
  assert.equal(report.status, 'submitted_to_gm');
  assert.equal(report.ownerRole, 'gm');

  result = context.applyGeneralManagerReportDecision(
    state,
    report.id,
    'approve',
    'GM review complete.',
    actor('gm')
  );
  assert.equal(result.ok, true);
  assert.equal(report.status, 'submitted_to_executive');
  assert.equal(report.ownerRole, 'executiveDirector');
  return result;
}

test('Preliminary Report follows exact DM to GM to ED release chain', () => {
  const state = context.freshState();
  const report = context.reportArtifactById('PR-2026-018', state);

  let result = context.applyManagerReportDecision(
    state,
    report.id,
    'approve',
    'Department review complete.',
    actor('manager')
  );
  assert.equal(result.ok, true);
  assert.equal(report.status, 'submitted_to_gm');
  assert.equal(report.ownerRole, 'gm');
  assert.equal(context.serviceProviderVisibleReports(state, report.organizationId, 'Preliminary Report').some((item) => item.id === report.id), false);

  result = context.applyGeneralManagerReportDecision(
    state,
    report.id,
    'approve',
    'GM review complete.',
    actor('gm')
  );
  assert.equal(result.ok, true);
  assert.equal(report.status, 'submitted_to_executive');
  assert.equal(report.ownerRole, 'executiveDirector');
  assert.equal(context.serviceProviderVisibleReports(state, report.organizationId, 'Preliminary Report').some((item) => item.id === report.id), false);

  result = context.applyExecutivePreliminaryReportDecision(state, report.id, {
    decision: 'approve',
    actor: actor('executiveDirector'),
    rationale: 'Approved for release to the Service Provider.'
  });
  assert.equal(result.ok, true);
  assert.equal(report.status, 'released_to_service_provider');
  assert.equal(report.ownerRole, 'auditee');
  assert.equal(report.locked, true);
  assert.equal(context.serviceProviderVisibleReports(state, report.organizationId, 'Preliminary Report').filter((item) => item.id === report.id).length, 1);
  assert.equal(state.notifications[0].role, 'auditee');
  assert.equal(state.notifications[0].organizationId, report.organizationId);
  assert.match(report.mockApprovalSignature.label, /not a real e-signature/i);
});

test('CAP-required flag changes recipient action, never the approval chain', () => {
  const state = context.freshState();
  const capReport = context.reportArtifactById('PR-2026-018', state);
  const noCapReport = clonePreliminaryReport(state, 'PR-2026-NO-CAP', false);

  [capReport, noCapReport].forEach((report) => {
    advancePreliminaryToExecutive(state, report);
    const result = context.applyExecutivePreliminaryReportDecision(state, report.id, {
      decision: 'approve',
      actor: actor('executiveDirector'),
      rationale: 'Approved for controlled demo release.'
    });
    assert.equal(result.ok, true);
    assert.equal(report.status, 'released_to_service_provider');
  });

  const linkedOpenFindings = state.findings.filter((finding) => (
    finding.auditId === capReport.auditId && finding.status !== 'CLOSED'
  ));
  assert.ok(linkedOpenFindings.length > 0);
  assert.equal(context.serviceProviderRequiredAction(noCapReport, linkedOpenFindings), 'View Report');
  assert.equal(context.serviceProviderRequiredAction(capReport, linkedOpenFindings), 'Respond to CAP and Evidence requests');
});

test('Preliminary Report authority and return paths preserve Service Provider privacy', () => {
  const gmGuardState = context.freshState();
  const gmGuardReport = context.reportArtifactById('PR-2026-018', gmGuardState);
  context.applyManagerReportDecision(gmGuardState, gmGuardReport.id, 'approve', '', actor('manager'));
  assert.equal(context.applyGeneralManagerReportDecision(
    gmGuardState,
    gmGuardReport.id,
    'approve',
    '',
    { role: 'manager', name: 'Wrong role' }
  ).ok, false);

  const gmReturnState = context.freshState();
  const gmReturnReport = context.reportArtifactById('PR-2026-018', gmReturnState);
  context.applyManagerReportDecision(gmReturnState, gmReturnReport.id, 'approve', '', actor('manager'));
  let result = context.applyGeneralManagerReportDecision(
    gmReturnState,
    gmReturnReport.id,
    'return',
    'Clarify the Preliminary Report evidence summary.',
    actor('gm')
  );
  assert.equal(result.ok, true);
  assert.equal(gmReturnReport.status, 'pending_manager');
  assert.equal(gmReturnReport.ownerRole, 'manager');
  assert.equal(context.serviceProviderVisibleReports(gmReturnState, gmReturnReport.organizationId, 'Preliminary Report').some((item) => item.id === gmReturnReport.id), false);

  const edReturnState = context.freshState();
  const edReturnReport = context.reportArtifactById('PR-2026-018', edReturnState);
  advancePreliminaryToExecutive(edReturnState, edReturnReport);
  assert.equal(context.applyExecutivePreliminaryReportDecision(edReturnState, edReturnReport.id, {
    decision: 'approve',
    actor: { role: 'gm', name: 'Wrong role' }
  }).ok, false);
  result = context.applyExecutivePreliminaryReportDecision(edReturnState, edReturnReport.id, {
    decision: 'return',
    actor: actor('executiveDirector'),
    rationale: 'General Manager should clarify the release summary.'
  });
  assert.equal(result.ok, true);
  assert.equal(edReturnReport.status, 'submitted_to_gm');
  assert.equal(edReturnReport.ownerRole, 'gm');
  assert.equal(context.serviceProviderVisibleReports(edReturnState, edReturnReport.organizationId, 'Preliminary Report').some((item) => item.id === edReturnReport.id), false);
});

test('CAP verification exposes Close, Partially Close, and Not Close outcomes', () => {
  const cases = [
    {
      result: 'close', role: 'inspector', expectedStatus: 'CLOSED', findingClosed: true,
      commentToAuditee: 'Implementation verified; Finding closed.',
      internalNote: 'Verified against the latest submitted Evidence.'
    },
    {
      result: 'partially_close', role: 'leadInspector', expectedStatus: 'EVIDENCE_MORE_INFO', findingClosed: false,
      commentToAuditee: 'Partially verified; provide the remaining implementation Evidence.',
      internalNote: 'One corrective action remains unverified.'
    },
    {
      result: 'not_close', role: 'inspector', expectedStatus: 'EVIDENCE_MORE_INFO', findingClosed: false,
      commentToAuditee: 'Verification was not sufficient; corrective action remains open.',
      internalNote: 'Submitted material does not demonstrate implementation.'
    }
  ];

  cases.forEach((item) => {
    const state = context.freshState();
    const finding = state.findings.find((candidate) => candidate.id === 'RAMP-2026-005');
    const evidenceBefore = finding.evidence.map((evidence) => ({
      id: evidence.id,
      version: evidence.version,
      fileName: evidence.fileName
    }));
    const result = context.applyCapVerificationDecision(state, finding.id, {
      result: item.result,
      actor: actor(item.role),
      commentToAuditee: item.commentToAuditee,
      internalNote: item.internalNote
    });
    assert.equal(result.ok, true);
    assert.equal(result.finding.status, item.expectedStatus);
    assert.equal(result.finding.capVerification.findingClosed, item.findingClosed);
    assert.deepEqual(
      result.finding.evidence.map((evidence) => ({ id: evidence.id, version: evidence.version, fileName: evidence.fileName })),
      evidenceBefore
    );
    assert.equal(result.finding.capVerification.evidenceId, 'EV-2');
    assert.equal(result.finding.capVerification.evidenceVersion, 1);
  });
});

test('CAP verification rejects wrong authority, stage, evidence, comments, and result values', () => {
  function pendingFinding() {
    const state = context.freshState();
    return {
      state,
      finding: state.findings.find((candidate) => candidate.id === 'RAMP-2026-005')
    };
  }

  let subject = pendingFinding();
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'close', actor: actor('manager'), commentToAuditee: 'Visible.', internalNote: 'Internal.'
  }).ok, false);

  subject = pendingFinding();
  subject.finding.status = 'EVIDENCE_REQUIRED';
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'close', actor: actor('inspector'), commentToAuditee: 'Visible.', internalNote: 'Internal.'
  }).ok, false);

  subject = pendingFinding();
  subject.finding.evidence = [];
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'close', actor: actor('inspector'), commentToAuditee: 'Visible.', internalNote: 'Internal.'
  }).ok, false);

  subject = pendingFinding();
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'accept', actor: actor('inspector'), commentToAuditee: 'Visible.', internalNote: 'Internal.'
  }).ok, false);
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'close', actor: actor('inspector'), commentToAuditee: '', internalNote: 'Internal.'
  }).ok, false);
  assert.equal(context.applyCapVerificationDecision(subject.state, subject.finding.id, {
    result: 'close', actor: actor('inspector'), commentToAuditee: 'Visible.', internalNote: ''
  }).ok, false);
});

test('George coordination and referral-only enforcement remain bounded', () => {
  const state = context.freshState();
  const routine = context.inspectionCoordinationByAuditId(state, 'AUD-2026-001');
  const unannounced = context.inspectionCoordinationByAuditId(state, 'AUD-2026-005');
  assert.equal(routine.noticePolicy, 'advance');
  assert.equal(routine.status, 'ready_to_notify');
  assert.match(routine.checklistFiles.join(' '), /Cabin_Inspection_Checklist/);
  assert.ok(routine.sharedInformation.length > 0);
  assert.equal(unannounced.noticePolicy, 'withheld');
  assert.equal(unannounced.status, 'notice_withheld');

  const report = context.reportArtifactById('FR-2026-018', state);
  report.status = 'submitted_to_executive';
  report.ownerRole = 'executiveDirector';
  const findingSnapshot = JSON.stringify(state.findings);
  const auditSnapshot = JSON.stringify(state.audits);
  const result = context.applyExecutiveFinalReportDecision(state, report.id, {
    decision: 'enforcement_referral',
    actor: actor('executiveDirector'),
    category: 'Conditional Approval',
    rationale: 'Separate authorized human review is required.'
  });
  assert.equal(result.ok, true);
  assert.equal(report.enforcementReferral.recommendationOnly, true);
  assert.equal(report.enforcementReferral.status, 'pending_authorized_review');
  assert.equal(JSON.stringify(state.findings), findingSnapshot);
  assert.equal(JSON.stringify(state.audits), auditSnapshot);
});
