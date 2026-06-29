/* ==========================================================================
   AviaSurveil360 — Checklist management helpers (DEMO ONLY)
   Frontend-only mock authoring/versioning; no production configuration service.
   ========================================================================== */

function canManageChecklistConfig(roleKey) {
  return roleKey === 'manager' || roleKey === 'admin';
}

function activeManagedChecklist() {
  return managedChecklistById('CL-FOPS') || (state.managedChecklists && state.managedChecklists[0]);
}

function questionBankById(id) {
  if (!state || !Array.isArray(state.questionBank)) return null;
  for (var i = 0; i < state.questionBank.length; i++) {
    if (state.questionBank[i].id === id) return state.questionBank[i];
  }
  return null;
}

function checklistQuestionLabel(id) {
  var qb = questionBankById(id);
  if (qb) return qb.text;
  if (state && state.checklist && state.checklist.items) {
    for (var i = 0; i < state.checklist.items.length; i++) {
      if (state.checklist.items[i].id === id) return state.checklist.items[i].text;
    }
  }
  return id;
}

function latestChecklistVersionNumber(checklist) {
  var max = 0;
  (checklist.versions || []).forEach(function (version) {
    var n = parseFloat(version.version);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return max;
}

function checklistApprovalChain() {
  return [
    { role: 'manager', label: 'Department Manager', returnToRole: null },
    { role: 'gm', label: 'GM Approval', returnToRole: 'manager' }
  ];
}

function createChecklistDraftVersion(checklist, options) {
  options = options || {};
  var reason = normalizeApprovalText(options.reason);
  if (!reason) throw new Error('Reason for Change required before creating a checklist version.');
  var source = (checklist.versions || []).filter(function (version) {
    return version.status === 'published_active';
  })[0] || checklist.versions[checklist.versions.length - 1];
  var nextVersion = (latestChecklistVersionNumber(checklist) + 0.1).toFixed(1);
  var draft = {
    id: checklist.id + '-v' + nextVersion,
    version: nextVersion,
    status: 'draft',
    approvalType: 'checklist',
    createdBy: options.actorName || currentActorLabel(),
    createdDate: DEMO_TODAY,
    changeReason: reason,
    impact: 'Draft checklist configuration change for stakeholder feedback only.',
    questionIds: source && source.questionIds ? source.questionIds.slice() : [],
    approval: {
      chain: checklistApprovalChain(),
      currentIndex: 0,
      outcome: null,
      returnPolicy: 'configured_role',
      history: [
        {
          actor: options.actorName || currentActorLabel(),
          role: options.actorRole || 'manager',
          action: 'created_draft',
          date: approvalDecisionDate(),
          comment: reason
        }
      ]
    }
  };
  checklist.versions.push(draft);
  return draft;
}

function createQuestionBankItem(payload) {
  payload = payload || {};
  var id = 'QB-' + String(state.questionSeq++).padStart(3, '0');
  var item = {
    id: id,
    title: payload.title || 'New checklist question',
    text: payload.text || 'Does the sampled record meet the configured evidence expectation?',
    regulationRef: payload.regulationRef || 'Configured rule FOPS-CRT-04 (regulatory reference)',
    department: payload.department || 'Flight Operations',
    category: payload.category || 'Evidence quality',
    commentRequired: !!payload.commentRequired,
    evidenceRequired: payload.evidenceRequired !== false,
    allowPotentialFinding: payload.allowPotentialFinding !== false,
    inspectorGuidance: payload.inspectorGuidance || 'Review the configured evidence expectation and capture a comment when unclear.',
    exampleEvidence: payload.exampleEvidence || 'Sample record and supporting evidence',
    notes: payload.notes || 'Demo-created question bank item.',
    status: 'Active'
  };
  state.questionBank.push(item);
  return item;
}

function addQuestionToChecklistVersion(version, questionId) {
  if (!version.questionIds) version.questionIds = [];
  if (version.questionIds.indexOf(questionId) === -1) version.questionIds.push(questionId);
  return version;
}

function moveChecklistQuestion(version, questionId, direction) {
  if (!version.questionIds) return version;
  var idx = version.questionIds.indexOf(questionId);
  if (idx < 0) return version;
  var swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= version.questionIds.length) return version;
  var temp = version.questionIds[swapIdx];
  version.questionIds[swapIdx] = version.questionIds[idx];
  version.questionIds[idx] = temp;
  return version;
}

function publishChecklistVersion(checklist, version, options) {
  options = options || {};
  if (!version || version.status !== 'checklist_approved') {
    throw new Error('Only an approved version can be published as active.');
  }
  checklist.versions.forEach(function (item) {
    if (item.status === 'published_active' && item.id !== version.id) item.status = 'archived';
  });
  version.status = 'published_active';
  checklist.publishedVersion = version.version;
  appendApprovalHistory(version, {
    name: options.actorName || currentActorLabel(),
    role: options.actorRole || state.role || 'manager'
  }, 'published', 'Published as active demo checklist; prior active version archived.');
  return version;
}

function editableChecklistVersion(checklist) {
  var versions = checklist.versions || [];
  for (var i = versions.length - 1; i >= 0; i--) {
    if (versions[i].status === 'draft' || versions[i].status === 'checklist_returned') return versions[i];
  }
  return null;
}
