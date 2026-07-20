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

var CABIN_EXECUTION_SECTIONS = [
  { key: 'galley', label: 'Galley', questionIds: ['cab-galley-oven'] },
  { key: 'lavatories', label: 'Lavatories', questionIds: ['cab-lav-oxygen-compartment'] },
  { key: 'passenger-seats', label: 'Passenger Seats', questionIds: ['cab-seat-oxygen-mask'] },
  { key: 'em-eq', label: 'Emergency Equipment', questionIds: ['cab-em-eq-pbe'] },
  { key: 'video-crew-seat', label: 'Video + Crew Seat', questionIds: ['cab-em-eq-first-aid-oxygen'] },
  { key: 'cockpit-cabin-exits', label: 'Cockpit, Cabin General Condition + Exits', questionIds: ['cab-exit-safety-strap'] }
];

function inspectionWorkspaceForAudit(target, auditId) {
  if (!target.inspectionWorkspaces) target.inspectionWorkspaces = {};
  if (!target.inspectionWorkspaces[auditId]) {
    target.inspectionWorkspaces[auditId] = {
      selectedSectionKey: 'galley',
      answersByQuestionId: {},
      downloadedAt: '',
      downloadedAttachmentIds: {},
      draftSavedAt: '',
      allSectionsCompletedAt: '',
      submittedAt: '',
      submittedByUserId: '',
      lastSubmittedAt: '',
      lastSubmittedByUserId: '',
      reopenedAt: '',
      reopenedByUserId: '',
      reopenReason: '',
      reopenHistory: []
    };
  }
  var workspace = target.inspectionWorkspaces[auditId];
  if (!workspace.answersByQuestionId || typeof workspace.answersByQuestionId !== 'object') workspace.answersByQuestionId = {};
  if (!workspace.downloadedAttachmentIds || typeof workspace.downloadedAttachmentIds !== 'object') workspace.downloadedAttachmentIds = {};
  if (!Array.isArray(workspace.reopenHistory)) workspace.reopenHistory = [];
  return workspace;
}

function checklistAnswerForAudit(target, auditId, questionId) {
  var workspace = inspectionWorkspaceForAudit(target, auditId);
  return workspace.answersByQuestionId[questionId] || null;
}

function reopenInspectionChecklistForEditing(target, auditId, metadata) {
  metadata = metadata || {};
  var audit = inspectionExecutionAudit(target, auditId);
  var workspace = target && target.inspectionWorkspaces ? target.inspectionWorkspaces[auditId] : null;
  if (['inspector', 'leadInspector'].indexOf(metadata.role) === -1) {
    throw new Error('Inspector or Lead Inspector authority required.');
  }
  if (!workspace || !workspace.submittedAt) throw new Error('Only a submitted checklist can be reopened.');
  var reason = normalizeApprovalText(metadata.reason);
  if (!reason) throw new Error('Reason for reopening is required.');
  if (!audit) throw new Error('Audit not found.');
  if (audit.reportIssuedAt || audit.status === 'Closed') throw new Error('Issued or closed inspections cannot be reopened.');

  var previousSubmittedAt = workspace.submittedAt;
  var previousSubmittedByUserId = workspace.submittedByUserId || '';
  var reopenedAt = metadata.at || new Date().toISOString();
  var reopenedByUserId = metadata.userId || '';
  var historyEntry = {
    auditId: auditId,
    previousSubmittedAt: previousSubmittedAt,
    previousSubmittedByUserId: previousSubmittedByUserId,
    reopenedAt: reopenedAt,
    reopenedByUserId: reopenedByUserId,
    role: metadata.role,
    reason: reason
  };
  workspace.lastSubmittedAt = previousSubmittedAt;
  workspace.lastSubmittedByUserId = previousSubmittedByUserId;
  workspace.submittedAt = '';
  workspace.submittedByUserId = '';
  workspace.allSectionsCompletedAt = '';
  workspace.reopenedAt = reopenedAt;
  workspace.reopenedByUserId = reopenedByUserId;
  workspace.reopenReason = reason;
  if (!Array.isArray(workspace.reopenHistory)) workspace.reopenHistory = [];
  workspace.reopenHistory.push(historyEntry);
  if (!Array.isArray(target.auditLog)) target.auditLog = [];
  if (!Number.isFinite(target.logSeq)) target.logSeq = 100;
  target.auditLog.unshift({
    id: 'L' + target.logSeq++,
    time: reopenedAt,
    actor: reopenedByUserId + ' (' + metadata.role + ')',
    action: 'Checklist reopened for editing — reason: ' + reason,
    target: auditId,
    system: false
  });
  return true;
}

function inspectionExecutionAudit(target, auditId) {
  var audits = target && Array.isArray(target.audits) ? target.audits : [];
  return audits.filter(function (audit) { return audit.id === auditId; })[0] || null;
}

function inspectionExecutionTemplate(target, templateId) {
  if (target && target.checklist && target.checklist.id === templateId) return target.checklist;
  var executionPackages = target && Array.isArray(target.executionChecklists) ? target.executionChecklists : [];
  for (var i = 0; i < executionPackages.length; i++) {
    if (executionPackages[i].id === templateId && executionPackages[i].status === 'Published') return executionPackages[i];
  }
  var packages = target && Array.isArray(target.managedChecklists) ? target.managedChecklists : [];
  for (var packageIndex = 0; packageIndex < packages.length; packageIndex++) {
    var versions = Array.isArray(packages[packageIndex].versions) ? packages[packageIndex].versions : [];
    for (var versionIndex = 0; versionIndex < versions.length; versionIndex++) {
      if (versions[versionIndex].templateId === templateId && versions[versionIndex].status === 'Published') return versions[versionIndex];
    }
  }
  return null;
}

function inspectionExecutionOrganizationName(target, orgId) {
  var orgs = target && Array.isArray(target.orgs) ? target.orgs : [];
  var org = orgs.filter(function (item) { return item.id === orgId; })[0];
  return org ? org.name : orgId;
}

function inspectionExecutionQuestionMeta(target, questionId) {
  var bank = target && Array.isArray(target.questionBank) ? target.questionBank : [];
  return bank.filter(function (item) { return item.id === questionId; })[0] || null;
}

function inspectionExecutionPackageForAudit(target, auditId) {
  var audit = inspectionExecutionAudit(target, auditId);
  if (!audit) return null;
  var template = inspectionExecutionTemplate(target, audit.templateId);
  if (!template || !Array.isArray(template.items)) return null;
  var workspace = inspectionWorkspaceForAudit(target, auditId);
  var sectionDefinitions = audit.templateId === 'TPL-CABIN-2026' ? CABIN_EXECUTION_SECTIONS : [];
  if (!sectionDefinitions.length) {
    template.items.forEach(function (item) {
      var sectionKey = item.sectionKey || 'checklist';
      var existing = sectionDefinitions.filter(function (section) { return section.key === sectionKey; })[0] || null;
      if (!existing) {
        existing = { key: sectionKey, label: item.sectionLabel || template.name || audit.type || 'Checklist', questionIds: [] };
        sectionDefinitions.push(existing);
      }
      existing.questionIds.push(item.id);
    });
  }
  var itemById = {};
  template.items.forEach(function (item) { itemById[item.id] = item; });
  var questions = [];
  var sections = sectionDefinitions.map(function (definition, sectionIndex) {
    var sectionQuestions = definition.questionIds.map(function (questionId, questionIndex) {
      var item = itemById[questionId];
      if (!item) return null;
      var answer = workspace.answersByQuestionId[questionId] || {};
      var bankMeta = inspectionExecutionQuestionMeta(target, questionId);
      var status = answer.status === 'observed' ? 'observation' : (answer.status || 'na');
      var row = {
        id: item.id,
        no: String(sectionIndex + 1) + '.' + String(questionIndex + 1),
        item: item.text,
        text: item.text,
        reference: item.ref || '',
        expectedEvidence: item.evidence || '',
        sectionKey: definition.key,
        sectionLabel: definition.label,
        status: status,
        comment: answer.comment || '',
        file: answer.file || '',
        commentRequired: !!(bankMeta && bankMeta.commentRequired),
        allowedResults: Array.isArray(item.allowedResults) ? item.allowedResults.slice() : ['compliant', 'noncompliant', 'observation', 'na']
      };
      questions.push(row);
      return row;
    }).filter(Boolean);
    var completed = sectionQuestions.filter(function (question) {
      return !!(workspace.answersByQuestionId[question.id] && workspace.answersByQuestionId[question.id].status);
    }).length;
    return {
      key: definition.key,
      label: definition.label,
      order: sectionIndex + 1,
      questions: sectionQuestions,
      completed: completed,
      total: sectionQuestions.length
    };
  });
  if (!sections.some(function (section) { return section.key === workspace.selectedSectionKey; })) {
    workspace.selectedSectionKey = sections.length ? sections[0].key : '';
  }
  var answered = questions.filter(function (question) {
    return !!(workspace.answersByQuestionId[question.id] && workspace.answersByQuestionId[question.id].status);
  }).length;
  var numericId = String(audit.id || '').match(/(\d+)$/);
  return {
    auditId: audit.id,
    inspectionId: 'INS-2026-' + String(numericId ? numericId[1] : '001').padStart(3, '0'),
    title: audit.ref,
    organizationId: audit.orgId,
    organization: inspectionExecutionOrganizationName(target, audit.orgId),
    inspectionType: audit.type,
    startDate: audit.date,
    endDate: audit.endDate || audit.date,
    templateId: template.id || audit.templateId,
    templateName: template.name || audit.type,
    templateVersion: template.version || '',
    sections: sections,
    questions: questions,
    answered: answered,
    total: questions.length,
    progressPercent: questions.length ? Math.round((answered / questions.length) * 100) : 0,
    workspace: workspace,
    potentialFindings: (target.potentialFindings || []).filter(function (finding) { return finding.auditId === audit.id; })
  };
}

function inspectionExecutionQuestionsForInspector(target, auditId, inspectorUserId) {
  var pkg = inspectionExecutionPackageForAudit(target, auditId);
  if (!pkg) return [];
  var assignment = target && target.leadAssignmentsByAudit ? target.leadAssignmentsByAudit[auditId] : null;
  var assignments = assignment && assignment.assignmentsByQuestionId ? assignment.assignmentsByQuestionId : {};
  return pkg.questions.map(function (question) {
    var record = assignments[question.id] || null;
    return Object.assign({}, question, {
      assignedInspectorUserId: record ? record.inspectorUserId : '',
      assignmentScope: !record ? 'unassigned' : (record.inspectorUserId === inspectorUserId ? 'mine' : 'other')
    });
  });
}

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
  var workspace = inspectionWorkspaceForAudit(state, auditId);
  var previous = workspace.answersByQuestionId[questionId] || {};
  workspace.answersByQuestionId[questionId] = Object.assign({}, previous, {
    auditId: auditId,
    questionId: questionId,
    answer: answer,
    status: answer,
    comment: note,
    evidenceFiles: normalizeMockFiles(files)
  });
  return workspace.answersByQuestionId[questionId];
}

function potentialFindingById(id) {
  if (!state || !Array.isArray(state.potentialFindings)) return null;
  for (var i = 0; i < state.potentialFindings.length; i++) {
    if (state.potentialFindings[i].id === id) return state.potentialFindings[i];
  }
  return null;
}

function checklistItemById(questionId, auditId) {
  var audit = auditId ? inspectionExecutionAudit(state, auditId) : null;
  var template = audit ? inspectionExecutionTemplate(state, audit.templateId) : state.checklist;
  var items = template && Array.isArray(template.items) ? template.items : [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === questionId) return items[i];
  }
  return null;
}

function createPotentialFinding(auditId, questionId, options) {
  options = options || {};
  var audit = auditById(auditId);
  var item = checklistItemById(questionId, auditId);
  var answer = checklistAnswerForAudit(state, auditId, questionId);
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

function findingRequirementDefaults(severity) {
  var normalizedSeverity = parseInt(severity, 10);
  if (normalizedSeverity === 4 || normalizedSeverity === 0) {
    return { capRequired: false, evidenceRequired: false, dueDate: null };
  }
  return { capRequired: true, evidenceRequired: true, dueDate: '2026-07-15' };
}

function applyAuthorizedFindingClosure(target, findingId, input) {
  var s = target || (typeof state !== 'undefined' ? state : null);
  input = input || {};
  var actor = input.actor || {};
  if (!s || !Array.isArray(s.findings)) return { ok: false, message: 'Finding state is unavailable.', finding: null };
  if (actor.role !== 'manager') return { ok: false, message: 'Department Manager authority required for authorized closure.', finding: null };
  var finding = s.findings.filter(function (candidate) { return candidate.id === findingId; })[0] || null;
  if (!finding) return { ok: false, message: 'Finding not found.', finding: null };
  var reason = normalizeApprovalText(input.reason);
  if (!reason) return { ok: false, message: 'Reason for authorized closure is required.', finding: finding };
  var actorName = normalizeApprovalText(actor.name) || 'Department Manager';
  var at = input.at || (typeof logTimestamp === 'function' ? logTimestamp() : DEMO_TODAY + ' 00:00');
  var commentToAuditee = normalizeApprovalText(input.commentToAuditee);
  var internalNote = normalizeApprovalText(input.internalNote);
  finding.status = 'CLOSED';
  finding.closedDate = DEMO_TODAY;
  finding.closureType = FINDING_CLOSURE_TYPES.AUTHORIZED;
  finding.authorizedClosure = { reason: reason, actorRole: actor.role, actorName: actorName, closedAt: at };
  if (!Array.isArray(finding.commentsToAuditee)) finding.commentsToAuditee = [];
  if (!Array.isArray(finding.internalNotes)) finding.internalNotes = [];
  if (commentToAuditee) finding.commentsToAuditee.push({ author: actorName, date: DEMO_TODAY, text: commentToAuditee });
  finding.internalNotes.push({ author: actorName, date: DEMO_TODAY, text: 'Authorized closure reason: ' + reason + (internalNote ? ' — ' + internalNote : '') });
  if (!Array.isArray(s.auditLog)) s.auditLog = [];
  var nextLogId = Number(s.logSeq) || (s.auditLog.length + 1);
  s.auditLog.unshift({ id: 'L' + nextLogId, time: at, actor: actorName + ' (Department Manager)', action: 'Finding closed (authorized closure) — reason: ' + reason, target: finding.id, system: false });
  s.logSeq = nextLogId + 1;
  return { ok: true, message: 'Authorized closure recorded with a required reason.', finding: finding };
}

function convertPotentialFindingToFinding(potentialId, options) {
  options = options || {};
  var potential = potentialFindingById(potentialId);
  if (!potential) throw new Error('Potential Finding not found.');
  if (potential.status === 'converted' && potential.findingId) return findingById(potential.findingId);
  var severity = parseInt(options.severity, 10);
  if (Number.isNaN(severity)) throw new Error('Severity required before converting a Potential Finding.');
  var storedSeverity = severity === 4 ? 0 : severity;
  var defaults = findingRequirementDefaults(severity);
  var capRequired = options.capRequired === undefined ? defaults.capRequired : !!options.capRequired;
  var evidenceRequired = options.evidenceRequired === undefined ? defaults.evidenceRequired : !!options.evidenceRequired;
  var dueDate = options.dueDate === undefined ? defaults.dueDate : (normalizeApprovalText(options.dueDate) || null);
  var audit = auditById(potential.auditId);
  var item = checklistItemById(potential.questionId, potential.auditId);
  var trace = regulatoryTraceForQuestion(potential.questionId);
  var id = 'CAB-2026-' + String(state.findingSeq).padStart(3, '0');
  var finding = {
    id: id,
    title: options.title || (potential.result === 'observation' ? 'Checklist observation requires follow-up' : 'Checklist non-compliance'),
    description: potential.comment,
    orgId: potential.orgId,
    auditId: potential.auditId,
    severity: storedSeverity,
    riskCategory: item && item.riskCategory ? item.riskCategory : '',
    findingType: item && item.findingType ? item.findingType : '',
    reference: item ? item.ref : 'Configured rule (regulatory reference)',
    traceId: trace ? trace.id : null,
    basis: 'Lead Inspector converted Potential Finding ' + potential.id,
    status: capRequired ? 'WAITING_CAP' : (evidenceRequired ? 'EVIDENCE_REQUIRED' : 'OPEN_OBSERVATION'),
    capRequired: capRequired,
    evidenceRequired: evidenceRequired,
    issuedDate: DEMO_TODAY,
    dueDate: dueDate,
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
    severity: storedSeverity,
    capRequired: capRequired,
    evidenceRequired: evidenceRequired
  };
  var answer = checklistAnswerForAudit(state, potential.auditId, potential.questionId);
  if (answer) answer.findingId = id;
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
