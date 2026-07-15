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
      reopenedByUserId: ''
    };
  }
  var workspace = target.inspectionWorkspaces[auditId];
  if (!workspace.answersByQuestionId || typeof workspace.answersByQuestionId !== 'object') workspace.answersByQuestionId = {};
  if (!workspace.downloadedAttachmentIds || typeof workspace.downloadedAttachmentIds !== 'object') workspace.downloadedAttachmentIds = {};
  return workspace;
}

function reopenInspectionChecklistForEditing(target, auditId, metadata) {
  if (!inspectionExecutionAudit(target, auditId)) return false;
  var workspace = inspectionWorkspaceForAudit(target, auditId);
  if (!workspace.submittedAt) return false;
  metadata = metadata || {};
  workspace.lastSubmittedAt = workspace.submittedAt;
  workspace.lastSubmittedByUserId = workspace.submittedByUserId || '';
  workspace.submittedAt = '';
  workspace.submittedByUserId = '';
  workspace.allSectionsCompletedAt = '';
  workspace.reopenedAt = metadata.at || new Date().toISOString();
  workspace.reopenedByUserId = metadata.userId || '';
  return true;
}

function inspectionExecutionAudit(target, auditId) {
  var audits = target && Array.isArray(target.audits) ? target.audits : [];
  return audits.filter(function (audit) { return audit.id === auditId; })[0] || null;
}

function inspectionExecutionTemplate(target, templateId) {
  if (target && target.checklist && target.checklist.id === templateId) return target.checklist;
  var packages = target && Array.isArray(target.managedChecklists) ? target.managedChecklists : [];
  for (var i = 0; i < packages.length; i++) {
    var versions = Array.isArray(packages[i].versions) ? packages[i].versions : [];
    for (var j = 0; j < versions.length; j++) {
      if (versions[j].templateId === templateId && versions[j].status === 'Published') return versions[j];
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
  var sectionDefinitions = audit.templateId === 'TPL-CABIN-2026'
    ? CABIN_EXECUTION_SECTIONS
    : [{ key: 'checklist', label: template.name || audit.type || 'Checklist', questionIds: template.items.map(function (item) { return item.id; }) }];
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
        commentRequired: !!(bankMeta && bankMeta.commentRequired)
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
