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
