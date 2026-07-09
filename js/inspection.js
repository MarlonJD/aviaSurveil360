/* ==========================================================================
   AviaSurveil360 — Inspection execution helpers (DEMO ONLY)
   Potential Finding -> Lead conversion -> existing Finding/CAP/Evidence flow.
   ========================================================================== */

var CHECKLIST_RESULTS = {
  compliant: 'Compliant',
  noncompliant: 'Non-Compliant',
  observation: 'Observation',
  na: 'Not Applicable'
};

function checklistResultRequiresComment(result) {
  return result === 'noncompliant' || result === 'observation';
}

function normalizeMockFiles(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.filter(Boolean).map(function (file) { return String(file); });
  return [String(files)];
}

function recordChecklistResult(auditId, questionId, result, comment, files) {
  var answer = result || '';
  var note = normalizeApprovalText(comment);
  if (checklistResultRequiresComment(answer) && !note) {
    throw new Error('Comment required for Non-Compliant or Observation checklist results.');
  }
  if (!state.checklistAnswers[questionId]) state.checklistAnswers[questionId] = {};
  state.checklistAnswers[questionId].auditId = auditId;
  state.checklistAnswers[questionId].answer = answer;
  state.checklistAnswers[questionId].comment = note;
  state.checklistAnswers[questionId].evidenceFiles = normalizeMockFiles(files);
  return state.checklistAnswers[questionId];
}

function potentialFindingById(id) {
  if (!state || !Array.isArray(state.potentialFindings)) return null;
  for (var i = 0; i < state.potentialFindings.length; i++) {
    if (state.potentialFindings[i].id === id) return state.potentialFindings[i];
  }
  return null;
}

function checklistItemById(questionId) {
  for (var i = 0; i < state.checklist.items.length; i++) {
    if (state.checklist.items[i].id === questionId) return state.checklist.items[i];
  }
  return null;
}

function createPotentialFinding(auditId, questionId, options) {
  options = options || {};
  var audit = auditById(auditId);
  var item = checklistItemById(questionId);
  var answer = state.checklistAnswers[questionId];
  if (!audit || !item || !answer) throw new Error('Checklist answer required before creating a Potential Finding.');
  if (answer.answer !== 'noncompliant' && answer.answer !== 'observation') {
    throw new Error('Potential Finding is only available for Non-Compliant or Observation results.');
  }
  if (!answer.comment) throw new Error('Comment required before creating a Potential Finding.');
  if (answer.potentialFindingId) return potentialFindingById(answer.potentialFindingId);

  var id = 'PF-2026-' + String(state.potentialSeq++).padStart(3, '0');
  var potential = {
    id: id,
    auditId: auditId,
    orgId: audit.orgId,
    questionId: questionId,
    checklistText: item.text,
    result: answer.answer,
    comment: answer.comment,
    evidenceFiles: normalizeMockFiles(answer.evidenceFiles),
    status: 'pending_lead_review',
    createdBy: options.actorName || currentActorLabel(),
    createdDate: DEMO_TODAY,
    leadDecision: null,
    findingId: null
  };
  state.potentialFindings.push(potential);
  answer.potentialFindingId = id;
  return potential;
}

function convertPotentialFindingToFinding(potentialId, options) {
  options = options || {};
  var potential = potentialFindingById(potentialId);
  if (!potential) throw new Error('Potential Finding not found.');
  if (potential.status === 'converted' && potential.findingId) return findingById(potential.findingId);
  var severity = parseInt(options.severity, 10);
  if (Number.isNaN(severity)) throw new Error('Severity required before converting a Potential Finding.');
  var audit = auditById(potential.auditId);
  var item = checklistItemById(potential.questionId);
  var trace = regulatoryTraceForQuestion(potential.questionId);
  var id = 'CAB-2026-' + String(state.findingSeq).padStart(3, '0');
  var finding = {
    id: id,
    title: options.title || (potential.result === 'observation' ? 'Checklist observation requires follow-up' : 'Checklist non-compliance'),
    description: potential.comment,
    orgId: potential.orgId,
    auditId: potential.auditId,
    severity: severity,
    riskCategory: item && item.riskCategory ? item.riskCategory : '',
    findingType: item && item.findingType ? item.findingType : '',
    reference: item ? item.ref : 'Configured rule (regulatory reference)',
    traceId: trace ? trace.id : null,
    basis: 'Lead Inspector converted Potential Finding ' + potential.id,
    status: 'WAITING_CAP',
    capRequired: true,
    evidenceRequired: true,
    issuedDate: DEMO_TODAY,
    dueDate: options.dueDate || '2026-07-15',
    closedDate: null,
    closureType: null,
    responsiblePerson: '',
    cap: null,
    capRevisions: [],
    evidence: [],
    commentsToAuditee: [],
    internalNotes: [
      {
        author: options.actorName || currentActorLabel(),
        date: DEMO_TODAY,
        text: 'Converted from Potential Finding ' + potential.id + (potential.evidenceFiles.length ? '. Mock evidence filenames: ' + potential.evidenceFiles.join(', ') : '.')
      }
    ]
  };
  state.findings.push(finding);
  state.findingSeq++;
  potential.status = 'converted';
  potential.findingId = id;
  potential.leadDecision = {
    action: 'converted',
    actor: options.actorName || currentActorLabel(),
    date: DEMO_TODAY,
    severity: severity
  };
  if (!state.checklistAnswers[potential.questionId]) state.checklistAnswers[potential.questionId] = {};
  state.checklistAnswers[potential.questionId].findingId = id;
  if (audit && (audit.status === 'Scheduled' || audit.status === 'Planned')) audit.status = 'In Progress';
  return finding;
}

function returnPotentialFinding(potentialId, reason, actorName) {
  var potential = potentialFindingById(potentialId);
  if (!potential) throw new Error('Potential Finding not found.');
  if (!normalizeApprovalText(reason)) throw new Error('Reason required when returning a Potential Finding.');
  potential.status = 'returned_to_inspector';
  potential.leadDecision = { action: 'returned', actor: actorName || currentActorLabel(), date: DEMO_TODAY, reason: reason };
  return potential;
}

function dismissPotentialFinding(potentialId, reason, actorName) {
  var potential = potentialFindingById(potentialId);
  if (!potential) throw new Error('Potential Finding not found.');
  if (!normalizeApprovalText(reason)) throw new Error('Reason required when dismissing a Potential Finding.');
  potential.status = 'dismissed';
  potential.leadDecision = { action: 'dismissed', actor: actorName || currentActorLabel(), date: DEMO_TODAY, reason: reason };
  return potential;
}
