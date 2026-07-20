const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/checklists.js', 'js/inspection.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
const auditId = 'AUD-2026-001';
const questionId = 'cab-em-eq-pbe';

assert.ok(Array.isArray(context.state.potentialFindings), 'potential findings collection exists');
assert.equal(typeof context.inspectionExecutionPackageForAudit, 'function');
const executionPackage = context.inspectionExecutionPackageForAudit(context.state, auditId);
const executionQuestionIds = executionPackage.questions.map((question) => question.id);
const assignmentQuestionIds = Object.keys(context.state.leadAssignmentsByAudit[auditId].selectedQuestionIds);
assert.deepEqual(JSON.parse(JSON.stringify(assignmentQuestionIds)), JSON.parse(JSON.stringify(executionQuestionIds)));
const legacyState = context.freshState();
legacyState.demoStateVersion = 7;
legacyState.leadAssignmentsByAudit[auditId].selectedQuestionIds = { 'CAB-Q001': true, 'CAB-Q002': true };
legacyState.leadAssignmentsByAudit[auditId].assignmentsByQuestionId = {
  'CAB-Q001': { inspectorUserId: 'USR-AYLIN' },
  'CAB-Q002': { inspectorUserId: 'USR-MEHMET' }
};
const migratedState = context.mergeDemoState(legacyState);
assert.equal(migratedState.leadAssignmentsByAudit[auditId].assignmentsByQuestionId['cab-em-eq-pbe'].inspectorUserId, 'USR-AYLIN');
assert.equal(Object.prototype.hasOwnProperty.call(migratedState.leadAssignmentsByAudit[auditId].assignmentsByQuestionId, 'CAB-Q002'), false);
assert.equal(Object.values(migratedState.leadAssignmentsByAudit[auditId].assignmentsByQuestionId).some((record) => record.inspectorUserId === 'USR-MEHMET'), false);
context.state.leadAssignmentsByAudit[auditId].assignmentsByQuestionId = {
  'cab-galley-oven': { inspectorUserId: 'USR-AYLIN' },
  'cab-lav-oxygen-compartment': { inspectorUserId: 'USR-MEHMET' }
};
const aylinScope = context.inspectionExecutionQuestionsForInspector(context.state, auditId, 'USR-AYLIN');
const mehmetScope = context.inspectionExecutionQuestionsForInspector(context.state, auditId, 'USR-MEHMET');
assert.equal(aylinScope.find((row) => row.id === 'cab-galley-oven').assignmentScope, 'mine');
assert.equal(aylinScope.find((row) => row.id === 'cab-lav-oxygen-compartment').assignmentScope, 'other');
assert.equal(mehmetScope.find((row) => row.id === 'cab-galley-oven').assignmentScope, 'other');
assert.equal(mehmetScope.find((row) => row.id === 'cab-lav-oxygen-compartment').assignmentScope, 'mine');
assert.equal(executionPackage.auditId, auditId);
assert.equal(executionPackage.title, '2026 Cabin Inspection - Fly Namibia');
assert.equal(executionPackage.templateId, 'TPL-CABIN-2026');
assert.deepEqual(
  JSON.parse(JSON.stringify(executionPackage.sections.map((section) => section.label))),
  [
    'Galley',
    'Lavatories',
    'Passenger Seats',
    'Emergency Equipment',
    'Video + Crew Seat',
    'Cockpit, Cabin General Condition + Exits'
  ]
);
assert.ok(executionPackage.questions.some((question) => question.id === questionId));
assert.doesNotMatch(JSON.stringify(executionPackage), /SMS Oversight|Safety Policy and Objectives/);

const canonicalCabinState = context.state;
const breadthState = context.freshState();
breadthState.audits.find((audit) => audit.id === 'AUD-2026-002').status = 'In Progress';
breadthState.audits.find((audit) => audit.id === 'AUD-2026-003').status = 'In Progress';
breadthState.audits.push({
  id: 'AUD-2026-009',
  ref: 'Flight Operations crew records surveillance',
  orgId: 'ORG-XYZ',
  type: 'Continued Surveillance',
  domain: 'Flight Operations',
  templateId: 'TPL-FOPS-2026',
  date: '2026-10-12',
  mode: 'On-site',
  location: 'Fly Namibia HQ',
  lead: 'Caner Yildiz',
  team: ['Caner Yildiz', 'Aylin Sezer'],
  status: 'In Progress',
  checklistStarted: true
});
context.state = breadthState;

const packageScenarios = [
  { auditId: 'AUD-2026-001', templateId: 'TPL-CABIN-2026' },
  { auditId: 'AUD-2026-002', templateId: 'TPL-RAMP-2026' },
  { auditId: 'AUD-2026-003', templateId: 'TPL-AWO-2026' },
  { auditId: 'AUD-2026-005', templateId: 'TPL-SEC-2026' },
  { auditId: 'AUD-2026-009', templateId: 'TPL-FOPS-2026' }
];
const questionIdsByAudit = new Map();
packageScenarios.forEach(({ auditId: scopedAuditId, templateId }) => {
  const pkg = context.inspectionExecutionPackageForAudit(breadthState, scopedAuditId);
  assert.ok(pkg, `${templateId} has a runnable demo package`);
  assert.equal(pkg.auditId, scopedAuditId);
  assert.equal(pkg.templateId, templateId);
  assert.ok(pkg.questions.length >= 3, `${templateId} has at least three deterministic questions`);
  assert.ok(pkg.questions.every((question) => /Configured (?:reference|security reference|ramp reference|airworthiness reference|flight operations reference)/i.test(question.reference)));
  assert.ok(pkg.questions.every((question) => question.expectedEvidence));
  assert.ok(pkg.questions.every((question) => question.allowedResults.join(',') === 'compliant,noncompliant,observation,na'));

  const compliantQuestion = pkg.questions[0];
  const exceptionQuestion = pkg.questions[1];
  context.recordChecklistResult(scopedAuditId, compliantQuestion.id, 'compliant', '', []);
  context.recordChecklistResult(scopedAuditId, exceptionQuestion.id, 'noncompliant', `${templateId} scoped exception`, []);
  const potentialFinding = context.createPotentialFinding(scopedAuditId, exceptionQuestion.id, { actorName: 'Aylin Sezer' });
  const updated = context.inspectionExecutionPackageForAudit(breadthState, scopedAuditId);

  assert.equal(updated.auditId, scopedAuditId);
  assert.equal(updated.answered, 2);
  assert.equal(updated.workspace.answersByQuestionId[compliantQuestion.id].auditId, scopedAuditId);
  assert.equal(updated.workspace.answersByQuestionId[exceptionQuestion.id].comment, `${templateId} scoped exception`);
  assert.equal(potentialFinding.auditId, scopedAuditId);
  assert.equal(updated.potentialFindings.some((finding) => finding.id === potentialFinding.id), true);
  questionIdsByAudit.set(scopedAuditId, pkg.questions.map((question) => question.id));
});

const allBreadthQuestionIds = Array.from(questionIdsByAudit.values()).flat();
assert.equal(new Set(allBreadthQuestionIds).size, allBreadthQuestionIds.length, 'runnable template question IDs never collide');
context.state = canonicalCabinState;

const legacySavedState = context.freshState();
legacySavedState.demoStateVersion = 7;
legacySavedState.checklist = {
  id: 'TPL-FOPS-2026',
  name: 'Flight Operations Audit',
  version: 'v3.2 (2026)',
  items: [
    { id: 'legacy-fops-1', text: 'Is the Operations Manual current and approved?', ref: 'Configured rule FOPS-OM-01' }
  ]
};
legacySavedState.audits.find((audit) => audit.id === auditId).templateId = 'TPL-FOPS-2026';
legacySavedState.audits.find((audit) => audit.id === auditId).type = 'Continued Surveillance';
legacySavedState.inspectionWorkspaces[auditId].selectedSectionKey = 'checklist';
const migratedCanonicalState = context.mergeDemoState(legacySavedState);
const migratedExecutionPackage = context.inspectionExecutionPackageForAudit(migratedCanonicalState, auditId);
assert.equal(migratedExecutionPackage.templateId, 'TPL-CABIN-2026', 'legacy browser state is migrated to the canonical runnable checklist');
assert.equal(migratedExecutionPackage.sections.length, 6, 'legacy browser state cannot collapse the canonical checklist to one section');
assert.deepEqual(
  JSON.parse(JSON.stringify(migratedExecutionPackage.sections.map((section) => section.label))),
  [
    'Galley',
    'Lavatories',
    'Passenger Seats',
    'Emergency Equipment',
    'Video + Crew Seat',
    'Cockpit, Cabin General Condition + Exits'
  ]
);

assert.throws(
  () => context.recordChecklistResult(auditId, questionId, 'noncompliant', '', []),
  /comment required/i,
  'Non-Compliant checklist result requires a comment'
);

context.recordChecklistResult(auditId, questionId, 'noncompliant', 'The inspected PBE position could not be confirmed as serviceable and accessible.', ['PBE_Cabin_Position_Photo.jpg']);
const potential = context.createPotentialFinding(auditId, questionId, { actorName: 'Aylin Sezer' });

assert.equal(potential.status, 'pending_lead_review');
assert.equal(potential.result, 'noncompliant');
assert.equal(context.state.findings.some((finding) => finding.id === 'CAB-2026-001'), false, 'Potential Finding does not create a real finding yet');

assert.throws(
  () => context.convertPotentialFindingToFinding(potential.id, { actorName: 'Caner Yildiz' }),
  /severity required/i,
  'Lead conversion requires severity'
);

const finding = context.convertPotentialFindingToFinding(potential.id, {
  actorName: 'Caner Yildiz',
  severity: 1,
  title: 'PBE not serviceable or not accessible in cabin emergency equipment check'
});

assert.equal(potential.status, 'converted');
assert.equal(potential.findingId, finding.id);
assert.equal(finding.id, 'CAB-2026-001');
assert.equal(finding.status, 'WAITING_CAP');
assert.equal(finding.severity, 1);
assert.equal(finding.riskCategory, 'Emergency Preparedness');
assert.equal(finding.findingType, 'Equipment');
assert.equal(context.checklistAnswerForAudit(context.state, auditId, questionId).findingId, finding.id);

context.state = context.freshState();
context.recordChecklistResult(auditId, 'cab-galley-oven', 'observation', 'Monitor the sampled galley record.', []);
const defaultObservationPotential = context.createPotentialFinding(auditId, 'cab-galley-oven', { actorName: 'Aylin Sezer' });
const defaultObservation = context.convertPotentialFindingToFinding(defaultObservationPotential.id, {
  actorName: 'Caner Yildiz',
  severity: 4,
  title: 'Galley record observation'
});
assert.equal(defaultObservation.severity, 0);
assert.equal(defaultObservation.capRequired, false);
assert.equal(defaultObservation.evidenceRequired, false);
assert.equal(defaultObservation.dueDate, null);
assert.equal(defaultObservation.status, 'OPEN_OBSERVATION');

context.state = context.freshState();
context.recordChecklistResult(auditId, 'cab-galley-oven', 'observation', 'Configured follow-up is required for this observation.', []);
const configuredObservationPotential = context.createPotentialFinding(auditId, 'cab-galley-oven', { actorName: 'Aylin Sezer' });
const configuredObservation = context.convertPotentialFindingToFinding(configuredObservationPotential.id, {
  actorName: 'Caner Yildiz',
  severity: 4,
  capRequired: true,
  evidenceRequired: true,
  dueDate: '2026-07-25',
  title: 'Observation with configured CAP and Evidence'
});
assert.equal(configuredObservation.capRequired, true);
assert.equal(configuredObservation.evidenceRequired, true);
assert.equal(configuredObservation.dueDate, '2026-07-25');
assert.equal(configuredObservation.status, 'WAITING_CAP');

console.log('inspection-execution-smoke: ok');
