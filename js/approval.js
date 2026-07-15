/* ==========================================================================
   AviaSurveil360 — Reusable approval-chain primitive (DEMO ONLY)
   Frontend-only mock governance logic; no real authorization or audit service.
   ========================================================================== */

var PLANNING_STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted_to_gm: { label: 'Under GM Review', tone: 'info' },
  under_gm_review: { label: 'Under GM Review', tone: 'info' },
  returned_to_department_manager: { label: 'Returned to Department Manager', tone: 'warn' },
  sent_to_finance: { label: 'Finance Review', tone: 'warn' },
  finance_not_approved: { label: 'Returned to Department Manager', tone: 'warn' },
  finance_reviewed: { label: 'Finance Reviewed', tone: 'info' },
  pending_ed_approval: { label: 'Pending ED Approval', tone: 'info' },
  approved: { label: 'Approved', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'danger' }
};

var CHECKLIST_STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  under_review: { label: 'Under Review', tone: 'info' },
  checklist_returned: { label: 'Returned to Department Manager', tone: 'warn' },
  checklist_approved: { label: 'Approved', tone: 'ok' },
  checklist_rejected: { label: 'Rejected', tone: 'danger' },
  published_active: { label: 'Published Active', tone: 'ok' },
  archived: { label: 'Archived', tone: 'neutral' }
};

var REPORT_STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral' },
  submitted_to_dm: { label: 'Submitted to Department Manager', tone: 'info' },
  released_to_service_provider: { label: 'Service Provider CAP Completion', tone: 'warn' },
  submitted_to_dm_final: { label: 'Submitted for Final Approval', tone: 'info' },
  returned_to_lead: { label: 'Returned to Lead Inspector', tone: 'warn' },
  submitted_to_gm: { label: 'Submitted to GM', tone: 'info' },
  returned_to_dm: { label: 'Returned to Department Manager', tone: 'warn' },
  submitted_to_ed: { label: 'Submitted to Executive Director', tone: 'info' },
  returned_to_gm: { label: 'Returned to GM', tone: 'warn' },
  final_report_generated: { label: 'Final Report Issued', tone: 'ok' },
  report_rejected: { label: 'Rejected', tone: 'danger' }
};

var APPROVAL_ACTION_LABELS = {
  submitted: 'Submitted',
  forwarded: 'Forwarded',
  sent_to_finance: 'Sent to Finance Review',
  approved: 'Approved',
  approved_with_adjustment: 'Approved with Adjustment',
  returned: 'Returned for Revision',
  rejected: 'Rejected',
  finance_not_approved: 'Finance Not Approved',
  created_draft: 'Draft Created',
  published: 'Published Active',
  draft_created: 'Draft Created'
};

function planningItemById(id) {
  if (!state || !Array.isArray(state.planningItems)) return null;
  for (var i = 0; i < state.planningItems.length; i++) {
    if (state.planningItems[i].id === id) return state.planningItems[i];
  }
  return null;
}

function managedChecklistById(id) {
  if (!state || !Array.isArray(state.managedChecklists)) return null;
  for (var i = 0; i < state.managedChecklists.length; i++) {
    if (state.managedChecklists[i].id === id) return state.managedChecklists[i];
  }
  return null;
}

function checklistVersionById(id) {
  if (!state || !Array.isArray(state.managedChecklists)) return null;
  for (var i = 0; i < state.managedChecklists.length; i++) {
    var versions = state.managedChecklists[i].versions || [];
    for (var j = 0; j < versions.length; j++) {
      if (versions[j].id === id) return versions[j];
    }
  }
  return null;
}

function approvalStageIndex(approval, role) {
  if (!approval || !approval.chain) return -1;
  for (var i = 0; i < approval.chain.length; i++) {
    if (approval.chain[i].role === role) return i;
  }
  return -1;
}

function approvalStage(record) {
  var approval = record && record.approval;
  if (!approval || !approval.chain || approval.currentIndex < 0) return null;
  return approval.chain[approval.currentIndex] || null;
}

function approvalLastAction(record) {
  var h = record && record.approval && record.approval.history;
  return h && h.length ? h[h.length - 1] : null;
}

function approvalDecisionDate() {
  if (typeof logTimestamp === 'function') return logTimestamp();
  return DEMO_TODAY + ' 00:00';
}

function normalizeApprovalText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function approvalMetaForStatus(status) {
  if (CHECKLIST_STATUS_META[status]) return CHECKLIST_STATUS_META[status];
  if (REPORT_STATUS_META[status]) return REPORT_STATUS_META[status];
  return PLANNING_STATUS_META[status] || { label: humanStatus(status), tone: statusTone(status) };
}

function approvalNextAction(record, stage) {
  if (!record || !stage) return 'No action';
  if (record.approval.outcome === 'approved') return 'No action - approved';
  if (record.approval.outcome === 'rejected') return 'No action - rejected';
  if (record.approvalType === 'report') {
    var stageLabel = stage.label || '';
    if (stage.role === 'leadInspector' && /Finalization/i.test(stageLabel)) return 'Prepare Final Report after Service Provider CAP completion';
    if (stage.role === 'leadInspector') return 'Submit preliminary report to Department Manager';
    if (stage.role === 'manager' && /Final Approval/i.test(stageLabel)) return 'Forward Final Report to General Manager review or return to Lead Inspector';
    if (stage.role === 'manager') return 'Release preliminary report to Service Provider if CAP is required, or return to Lead Inspector';
    if (stage.role === 'executiveDirector') return 'Issue final report or return to Department Manager';
    if (stage.role === 'gm') return 'Approve to Executive Director or return to Department Manager';
  }
  if (record.approvalType === 'checklist') {
    if (stage.role === 'manager') return 'Revise and submit to GM';
    if (stage.role === 'gm') return 'Approve checklist or return to Department Manager';
  }
  if (stage.role === 'manager') return 'Submit to Finance Review';
  if (stage.role === 'finance') return 'Review budget: approve or return to Department Manager';
  if (stage.role === 'gm') return 'Forward to Executive Director or return to Department Manager';
  if (stage.role === 'executiveDirector') return 'Final approval or return to GM';
  return 'Review and decide';
}

function approvalSummary(record) {
  var approval = record && record.approval;
  if (!approval) {
    return {
      outcome: null,
      ownerRole: null,
      ownerLabel: 'No approval chain',
      nextAction: 'No action',
      statusLabel: 'No approval chain',
      statusTone: 'neutral',
      currentIndex: -1
    };
  }

  if (approval.outcome === 'approved') {
    return {
      outcome: 'approved',
      ownerRole: null,
      ownerLabel: 'No current owner',
      nextAction: 'No action - approved',
      statusLabel: 'Approved',
      statusTone: 'ok',
      currentIndex: approval.currentIndex
    };
  }

  if (approval.outcome === 'rejected') {
    return {
      outcome: 'rejected',
      ownerRole: null,
      ownerLabel: 'No current owner',
      nextAction: 'No action - rejected',
      statusLabel: 'Rejected',
      statusTone: 'danger',
      currentIndex: approval.currentIndex
    };
  }

  var stage = approvalStage(record);
  var meta = approvalMetaForStatus(record.status);
  return {
    outcome: approval.outcome || null,
    ownerRole: stage ? stage.role : null,
    ownerLabel: stage ? (stage.label || roleName(stage.role)) : 'No current owner',
    nextAction: approvalNextAction(record, stage),
    statusLabel: meta.label || (stage ? stage.label : 'In review'),
    statusTone: meta.tone || 'neutral',
    currentIndex: approval.currentIndex
  };
}

function requireApprovalOwner(record, actor) {
  var stage = approvalStage(record);
  if (!stage) throw new Error('Approval chain has no current stage.');
  if (!actor || actor.role !== stage.role) {
    throw new Error('Current owner required: ' + roleName(stage.role) + '.');
  }
}

function requireApprovalReason(reason) {
  if (!normalizeApprovalText(reason)) throw new Error('Reason required for this approval decision.');
}

function appendApprovalHistory(record, actor, action, comment) {
  if (!record.approval.history) record.approval.history = [];
  record.approval.history.push({
    actor: actor && actor.name ? actor.name : 'Unknown actor',
    role: actor && actor.role ? actor.role : '',
    action: action,
    date: approvalDecisionDate(),
    comment: normalizeApprovalText(comment)
  });
}

function approvalReturnIndex(record, overrideRole) {
  var approval = record.approval;
  var stage = approvalStage(record);
  var role = overrideRole || (stage && stage.returnToRole);
  if (!role && approval.returnPolicy === 'previous_stage') {
    return Math.max(0, approval.currentIndex - 1);
  }
  if (!role && approval.returnPolicy === 'origin') {
    return 0;
  }
  var idx = approvalStageIndex(approval, role);
  if (idx < 0) idx = Math.max(0, approval.currentIndex - 1);
  return idx;
}

function setApprovalStatusFromChain(record, action) {
  var summary = approvalSummary(record);
  if (record.approvalType === 'checklist') {
    if (summary.outcome === 'approved') {
      record.status = 'checklist_approved';
      return;
    }
    if (summary.outcome === 'rejected') {
      record.status = 'checklist_rejected';
      return;
    }
    if (summary.ownerRole === 'manager') record.status = 'checklist_returned';
    else if (summary.ownerRole === 'gm') record.status = 'under_review';
    return;
  }

  if (record.approvalType === 'report') {
    if (summary.outcome === 'approved') {
      record.status = 'final_report_generated';
      return;
    }
    if (summary.outcome === 'rejected') {
      record.status = 'report_rejected';
      return;
    }
    var reportStage = approvalStage(record);
    var reportStageLabel = reportStage && reportStage.label ? reportStage.label : '';
    if (summary.ownerRole === 'leadInspector') {
      record.status = /Finalization/i.test(reportStageLabel) && action !== 'returned' ? 'released_to_service_provider' : 'returned_to_lead';
    } else if (summary.ownerRole === 'manager') {
      if (action === 'returned') record.status = 'returned_to_dm';
      else record.status = /Final Approval/i.test(reportStageLabel) ? 'submitted_to_dm_final' : 'submitted_to_dm';
    }
    else if (summary.ownerRole === 'gm') record.status = action === 'returned' ? 'returned_to_gm' : 'submitted_to_gm';
    else if (summary.ownerRole === 'executiveDirector') record.status = 'submitted_to_ed';
    return;
  }

  if (summary.outcome === 'approved') {
    record.status = 'approved';
    return;
  }
  if (summary.outcome === 'rejected') {
    record.status = 'rejected';
    return;
  }
  if (summary.ownerRole === 'manager') record.status = 'returned_to_department_manager';
  else if (summary.ownerRole === 'finance') record.status = 'sent_to_finance';
  else if (summary.ownerRole === 'gm') record.status = 'under_gm_review';
  else if (summary.ownerRole === 'executiveDirector') record.status = 'pending_ed_approval';
}

function advanceApproval(record, actor, comment, action) {
  var approval = record.approval;
  var nextIndex = approval.currentIndex + 1;
  var historyAction = action || 'forwarded';
  if (nextIndex >= approval.chain.length) {
    approval.outcome = 'approved';
    appendApprovalHistory(record, actor, 'approved', comment);
    setApprovalStatusFromChain(record, 'approved');
    return record;
  }
  approval.currentIndex = nextIndex;
  appendApprovalHistory(record, actor, historyAction, comment);
  setApprovalStatusFromChain(record, historyAction);
  return record;
}

function returnApproval(record, actor, reason, overrideRole) {
  requireApprovalReason(reason);
  record.approval.currentIndex = approvalReturnIndex(record, overrideRole);
  record.approval.outcome = null;
  appendApprovalHistory(record, actor, 'returned', reason);
  setApprovalStatusFromChain(record, 'returned');
  return record;
}

function rejectApproval(record, actor, reason) {
  requireApprovalReason(reason);
  record.approval.outcome = 'rejected';
  appendApprovalHistory(record, actor, 'rejected', reason);
  setApprovalStatusFromChain(record, 'rejected');
  return record;
}

function financeNotApproved(record, actor, reason) {
  var stage = approvalStage(record);
  requireApprovalReason(reason);
  if (!stage || stage.role !== 'finance') throw new Error('Finance Not Approved is only available during Finance Review.');
  record.financeReview = {
    decision: 'not_approved',
    reviewer: actor.name,
    date: approvalDecisionDate(),
    reason: normalizeApprovalText(reason)
  };
  record.approval.currentIndex = approvalReturnIndex(record, stage.notApprovedReturnToRole || 'manager');
  record.approval.outcome = null;
  appendApprovalHistory(record, actor, 'finance_not_approved', reason);
  setApprovalStatusFromChain(record, 'finance_not_approved');
  return record;
}

function applyApprovalDecision(record, input) {
  input = input || {};
  if (!record || !record.approval) throw new Error('Approval record is required.');
  var actor = input.actor || {};
  var decision = input.decision;
  var comment = normalizeApprovalText(input.comment);
  var reason = normalizeApprovalText(input.reason || input.comment);
  var stage = approvalStage(record);

  requireApprovalOwner(record, actor);

  if (decision === 'return') return returnApproval(record, actor, reason, input.returnToRole);
  if (decision === 'reject') return rejectApproval(record, actor, reason);
  if (decision === 'finance_not_approved') return financeNotApproved(record, actor, reason);

  if (decision === 'forward_ed') {
    if (stage.role === 'gm' && record.budgetRequired) {
      throw new Error('Finance Review is mandatory before Executive Director approval when budgetRequired=true.');
    }
    var edIndex = approvalStageIndex(record.approval, 'executiveDirector');
    if (edIndex < 0) throw new Error('Executive Director stage is not configured.');
    record.approval.currentIndex = edIndex;
    appendApprovalHistory(record, actor, 'forwarded', comment);
    setApprovalStatusFromChain(record, 'forwarded');
    return record;
  }

  if (decision === 'approve_with_adjustment') {
    if (!stage || stage.role !== 'finance') throw new Error('Approve with Adjustment is only available during Finance Review.');
    record.financeReview = {
      decision: 'approved_with_adjustment',
      reviewer: actor.name,
      date: approvalDecisionDate(),
      comment: comment
    };
    return advanceApproval(record, actor, comment, 'approved_with_adjustment');
  }

  if (decision === 'approve') {
    if (stage && stage.role === 'finance') {
      record.financeReview = {
        decision: 'approved',
        reviewer: actor.name,
        date: approvalDecisionDate(),
        comment: comment
      };
    }
    return advanceApproval(record, actor, comment, stage && stage.role === 'manager' ? 'submitted' : 'approved');
  }

  if (decision === 'forward') {
    var action = stage && stage.role === 'manager' ? 'submitted' : 'forwarded';
    return advanceApproval(record, actor, comment, action);
  }

  throw new Error('Unsupported approval decision: ' + decision);
}

function approvalActionLabel(action) {
  return APPROVAL_ACTION_LABELS[action] || humanStatus(action);
}
