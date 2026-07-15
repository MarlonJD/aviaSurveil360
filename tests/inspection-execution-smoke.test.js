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
assert.equal(context.state.checklistAnswers[questionId].findingId, finding.id);

console.log('inspection-execution-smoke: ok');
