/* ==========================================================================
   AviaSurveil360 — Planning release / audit preparation helpers (DEMO ONLY)
   Frontend-only mock release path; no real assignment package generation.
   ========================================================================== */

var PLANNING_PREP_STATUS_META = {
  not_released: { label: 'Approved - Not Released', tone: 'neutral' },
  released_to_department: { label: 'Released to Department', tone: 'info' },
  accepted_by_department: { label: 'Accepted by Department', tone: 'info' },
  lead_inspector_assigned: { label: 'Lead Inspector Assigned', tone: 'warn' },
  team_schedule_proposed: { label: 'Team & Schedule Proposed', tone: 'warn' },
  ready_for_execution: { label: 'Ready for Execution', tone: 'ok' }
};

var INSPECTION_CATEGORY_POLICIES = {
  'Routine / Announced': {
    inspectionCategory: 'Routine / Announced',
    noticePolicy: 'advance',
    coordinationStatus: 'ready_to_notify'
  },
  'Ad Hoc / Unannounced': {
    inspectionCategory: 'Ad Hoc / Unannounced',
    noticePolicy: 'withheld',
    coordinationStatus: 'notice_withheld'
  }
};

function inspectionCategoryPolicy(category) {
  var policy = INSPECTION_CATEGORY_POLICIES[category];
  if (!policy) throw new Error('Inspection Category is required.');
  return Object.assign({}, policy);
}

function nextPlanningInspectionId(target) {
  var max = (target.planningItems || []).reduce(function (current, item) {
    var match = String(item.id || '').match(/^PLAN-2026-INS-(\d{3})$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return 'PLAN-2026-INS-' + String(max + 1).padStart(3, '0');
}

function planningOrganizationForIntake(target, organizationId) {
  return (target.orgs || []).filter(function (organization) {
    return organization.id === organizationId;
  })[0] || null;
}

function validatePlanningInspectionInput(target, input, actor) {
  if (!actor || actor.role !== 'manager') throw new Error('Department Manager is required to create an inspection plan.');
  if (!planningOrganizationForIntake(target, input.organizationId)) throw new Error('Organization is required.');
  if (!normalizeApprovalText(input.applicationType)) throw new Error('Application type is required.');
  if (!normalizeApprovalText(input.domain)) throw new Error('Domain is required.');
  inspectionCategoryPolicy(input.inspectionCategory);
  if (!normalizeApprovalText(input.purpose)) throw new Error('Inspection purpose is required.');
  if (!normalizeApprovalText(input.plannedDate)) throw new Error('Planned date is required.');
  if (!normalizeApprovalText(input.location)) throw new Error('Location is required.');
  if (!normalizeApprovalText(input.templateId)) throw new Error('Checklist template is required.');
  var requestedBudget = Number(input.requestedBudget || 0);
  if (!Number.isFinite(requestedBudget) || requestedBudget < 0) throw new Error('Requested budget must be zero or a positive number.');
  return requestedBudget;
}

function createPlanningInspection(target, input, actor) {
  input = input || {};
  var requestedBudget = validatePlanningInspectionInput(target, input, actor);
  var organization = planningOrganizationForIntake(target, input.organizationId);
  var policy = inspectionCategoryPolicy(input.inspectionCategory);
  var currency = normalizeApprovalText(input.currency) || 'USD';
  var id = nextPlanningInspectionId(target);
  var item = {
    id: id,
    title: input.applicationType + ' - ' + organization.name,
    department: input.domain,
    organization: organization.name,
    organizationId: organization.id,
    applicationType: input.applicationType,
    inspectionCategory: policy.inspectionCategory,
    noticePolicy: policy.noticePolicy,
    purpose: normalizeApprovalText(input.purpose),
    riskCategory: normalizeApprovalText(input.riskCategory) || 'Configured inspection risk',
    triggerType: normalizeApprovalText(input.triggerType) || 'Department Manager initiated',
    plannedDate: input.plannedDate,
    targetMonth: String(input.plannedDate).slice(0, 7),
    mode: input.mode || 'On-site',
    location: normalizeApprovalText(input.location),
    templateId: input.templateId,
    scope: normalizeApprovalText(input.scope),
    budgetRequired: requestedBudget > 0,
    requestedBudget: currency + ' ' + requestedBudget.toLocaleString('en-US'),
    budget: {
      currency: currency,
      requested: requestedBudget,
      availableForPlan: requestedBudget,
      remainingAnnualBudget: 0,
      lines: [{ category: 'Inspection resources', amount: requestedBudget }]
    },
    proposedInspectors: [],
    status: 'sent_to_finance',
    financeReview: null,
    auditId: '',
    preparation: {
      status: 'not_released',
      releasedBy: null,
      releasedDate: null,
      acceptedBy: null,
      acceptedDate: null,
      leadInspector: null,
      proposedTeam: [],
      proposedStartDate: null,
      proposedEndDate: null,
      resources: null,
      assignmentPackage: null,
      history: []
    },
    approval: {
      chain: [
        { role: 'manager', label: 'Department Manager', returnToRole: null },
        { role: 'finance', label: 'Finance Review', returnToRole: 'manager', notApprovedReturnToRole: 'manager' },
        { role: 'gm', label: 'GM Review', returnToRole: 'manager' },
        { role: 'executiveDirector', label: 'Executive Director Approval', returnToRole: 'gm' }
      ],
      currentIndex: 1,
      outcome: null,
      returnPolicy: 'configured_role',
      history: [{
        actor: actor.name,
        role: actor.role,
        action: 'submitted',
        date: approvalDecisionDate(),
        comment: 'Submitted ' + policy.inspectionCategory + ' inspection plan for Finance Review.'
      }]
    }
  };
  target.planningItems.unshift(item);
  return item;
}

function planningBudgetTotal(item) {
  var lines = item && item.budget && Array.isArray(item.budget.lines) ? item.budget.lines : [];
  return lines.reduce(function (total, line) { return total + Number(line.amount || 0); }, 0);
}

function validatePlanningBudget(item) {
  if (!item || !item.budget) return { ok: false, message: 'Planning budget is required.' };
  if (!Number.isFinite(Number(item.budget.requested))) return { ok: false, message: 'Requested budget must be numeric.' };
  if (!item.budget.currency) return { ok: false, message: 'Budget currency is required.' };
  if (!Array.isArray(item.budget.lines) || !item.budget.lines.length) return { ok: false, message: 'Budget breakdown is required.' };
  var total = planningBudgetTotal(item);
  if (total !== Number(item.budget.requested)) {
    return { ok: false, message: 'Budget breakdown must equal the requested total.' };
  }
  return { ok: true, total: total };
}

function planningDecisionResult(ok, message, item) {
  return { ok: ok, message: message, item: item || null };
}

function applyFinancePlanningDecision(item, input) {
  input = input || {};
  var budget = validatePlanningBudget(item);
  if (!budget.ok) return planningDecisionResult(false, budget.message, item);
  if (['approve', 'return'].indexOf(input.decision) === -1) {
    return planningDecisionResult(false, 'Choose Approve Budget or Return for Revision.', item);
  }
  var actor = input.actor || { role: 'finance', name: 'Finance Review' };
  var comment = String(input.comment || '').trim();
  if (input.decision === 'return' && !comment) {
    return planningDecisionResult(false, 'A reason or comment is required to return the budget for revision.', item);
  }
  try {
    applyApprovalDecision(item, {
      decision: input.decision === 'approve' ? 'approve' : 'finance_not_approved',
      actor: actor,
      comment: comment,
      reason: comment
    });
  } catch (error) {
    return planningDecisionResult(false, error.message, item);
  }
  return planningDecisionResult(
    true,
    input.decision === 'approve' ? 'Budget approved and advanced to General Manager review.' : 'Budget returned to Department Manager for revision.',
    item
  );
}

function applyExecutivePlanningDecision(item, input) {
  input = input || {};
  if (['approve_and_sign', 'reject'].indexOf(input.decision) === -1) {
    return planningDecisionResult(false, 'Choose Approve & Sign (Demo) or Reject.', item);
  }
  var actor = input.actor || { role: 'executiveDirector', name: 'Executive Director' };
  var comment = String(input.comment || '').trim();
  if (input.decision === 'reject' && !comment) {
    return planningDecisionResult(false, 'A reason or comment is required to reject the plan.', item);
  }
  try {
    applyApprovalDecision(item, {
      decision: input.decision === 'approve_and_sign' ? 'approve' : 'reject',
      actor: actor,
      comment: comment,
      reason: comment
    });
  } catch (error) {
    return planningDecisionResult(false, error.message, item);
  }
  var at = typeof approvalDecisionDate === 'function' ? approvalDecisionDate() : DEMO_TODAY + ' 00:00';
  if (input.decision === 'approve_and_sign') {
    item.mockApprovalSignature = {
      label: 'DEMO mock approval mark - not a real e-signature',
      signer: actor.name,
      date: at
    };
    item.executiveDecision = 'approved';
    item.executiveDecisionAt = at;
  } else {
    item.mockApprovalSignature = null;
    item.executiveDecision = 'rejected';
    item.executiveDecisionAt = at;
    item.releaseBlocked = true;
  }
  return planningDecisionResult(
    true,
    input.decision === 'approve_and_sign' ? 'Plan approved with a demo approval mark; GM Release to Department is next.' : 'Plan rejected; release and execution remain blocked.',
    item
  );
}

function planningWorkspaceNextAction(item) {
  if (!item) return { label: 'No planning item selected', ownerRole: null };
  if (item.approval && item.approval.outcome === 'rejected') return { label: 'Rejected - release blocked', ownerRole: null };
  if (!item.approval || item.approval.outcome !== 'approved') {
    var summary = typeof approvalSummary === 'function' ? approvalSummary(item) : { nextAction: 'Review and decide', ownerRole: null };
    return { label: summary.nextAction, ownerRole: summary.ownerRole };
  }
  var status = item.preparation && item.preparation.status ? item.preparation.status : 'not_released';
  var actions = {
    not_released: { label: 'GM Release to Department', ownerRole: 'gm' },
    released_to_department: { label: 'Department Manager accept released audit', ownerRole: 'manager' },
    accepted_by_department: { label: 'Department Manager assign Lead Inspector', ownerRole: 'manager' },
    lead_inspector_assigned: { label: 'Lead Inspector propose team, dates, and resources', ownerRole: 'leadInspector' },
    team_schedule_proposed: { label: 'Department Manager confirm assignment package', ownerRole: 'manager' },
    ready_for_execution: { label: 'Ready for execution', ownerRole: null }
  };
  return actions[status] || { label: 'Review planning preparation', ownerRole: null };
}

function planningPrepMeta(status) {
  return PLANNING_PREP_STATUS_META[status] || { label: humanStatus(status), tone: statusTone(status) };
}

function appendPlanningPrepHistory(item, actor, action, comment) {
  if (!item.preparation.history) item.preparation.history = [];
  item.preparation.history.push({
    actor: actor.actorName || 'Unknown actor',
    role: actor.actorRole || '',
    action: action,
    date: approvalDecisionDate(),
    comment: comment || ''
  });
}

function requirePlanningRole(actor, role, message) {
  if (!actor || actor.actorRole !== role) throw new Error(message);
}

function requireApprovedPlanningItem(item) {
  if (!item || !item.approval || item.approval.outcome !== 'approved') {
    throw new Error('ED-approved planning item required before release.');
  }
}

function releasePlanningItem(item, actor) {
  requireApprovedPlanningItem(item);
  requirePlanningRole(actor, 'gm', 'GM release required for approved planning items.');
  item.preparation.status = 'released_to_department';
  item.preparation.releasedBy = actor.actorName;
  item.preparation.releasedDate = DEMO_TODAY;
  appendPlanningPrepHistory(item, actor, 'released_to_department', 'GM released the approved planning item to the department.');
  return item;
}

function acceptReleasedPlanningItem(item, actor) {
  requirePlanningRole(actor, 'manager', 'Department Manager acceptance required.');
  if (item.preparation.status !== 'released_to_department') throw new Error('Planning item must be released to the department first.');
  item.preparation.status = 'accepted_by_department';
  item.preparation.acceptedBy = actor.actorName;
  item.preparation.acceptedDate = DEMO_TODAY;
  appendPlanningPrepHistory(item, actor, 'accepted_by_department', 'Department Manager accepted the released audit.');
  return item;
}

function assignLeadInspectorToPlanningItem(item, options) {
  requirePlanningRole(options, 'manager', 'Department Manager assigns the Lead Inspector.');
  if (item.preparation.status !== 'accepted_by_department') throw new Error('Department must accept the released audit before Lead assignment.');
  if (!normalizeApprovalText(options.leadInspector)) throw new Error('Lead Inspector is required.');
  item.preparation.status = 'lead_inspector_assigned';
  item.preparation.leadInspector = options.leadInspector;
  appendPlanningPrepHistory(item, options, 'lead_inspector_assigned', 'Lead Inspector assigned: ' + options.leadInspector + '.');
  return item;
}

function proposePlanningTeamAndSchedule(item, options) {
  requirePlanningRole(options, 'leadInspector', 'Lead Inspector proposal required.');
  if (item.preparation.status !== 'lead_inspector_assigned') throw new Error('Lead Inspector must be assigned before proposing team and schedule.');
  if (!options.team || !options.team.length || !options.startDate || !options.endDate) {
    throw new Error('Team, start date, and end date are required.');
  }
  item.preparation.status = 'team_schedule_proposed';
  item.preparation.proposedTeam = options.team.slice();
  item.preparation.proposedStartDate = options.startDate;
  item.preparation.proposedEndDate = options.endDate;
  item.preparation.resources = options.resources || 'Mock resources to be confirmed by Department Manager.';
  appendPlanningPrepHistory(item, options, 'team_schedule_proposed', 'Lead proposed team, dates, and resources.');
  return item;
}

function confirmPlanningPreparation(item, actor) {
  requirePlanningRole(actor, 'manager', 'Department Manager confirmation required.');
  if (item.preparation.status !== 'team_schedule_proposed') throw new Error('Lead proposal required before confirmation.');
  item.preparation.status = 'ready_for_execution';
  item.preparation.assignmentPackage = {
    id: 'AAP-' + item.id,
    title: 'Audit Assignment Package - ' + item.title,
    status: 'generated_demo',
    generatedDate: DEMO_TODAY,
    leadInspector: item.preparation.leadInspector,
    team: item.preparation.proposedTeam.slice(),
    dateRange: item.preparation.proposedStartDate + ' to ' + item.preparation.proposedEndDate,
    note: 'Mock package only; no real document generation or storage.'
  };
  appendPlanningPrepHistory(item, actor, 'ready_for_execution', 'Department Manager confirmed team/schedule and generated a mock assignment package.');
  return item;
}

function materializedPlanningAudit(target, item) {
  return item.auditId
    ? (target.audits || []).filter(function (audit) { return audit.id === item.auditId; })[0] || null
    : null;
}

function materializeReadyPlanningInspection(target, item) {
  if (!item || !item.preparation || item.preparation.status !== 'ready_for_execution') {
    throw new Error('Planning preparation must be ready for execution before creating the Audit.');
  }
  var existing = materializedPlanningAudit(target, item);
  if (existing) {
    return {
      audit: existing,
      coordination: inspectionCoordinationByAuditId(target, existing.id),
      created: false
    };
  }

  var policy = inspectionCategoryPolicy(item.inspectionCategory);
  var auditId = 'AUD-2026-' + String(target.auditSeq).padStart(3, '0');
  var team = item.preparation.proposedTeam.slice();
  if (team.indexOf(item.preparation.leadInspector) === -1) team.unshift(item.preparation.leadInspector);
  var audit = {
    id: auditId,
    ref: item.title,
    orgId: item.organizationId,
    type: item.applicationType,
    domain: item.department,
    templateId: item.templateId,
    date: item.preparation.proposedStartDate || item.plannedDate,
    endDate: item.preparation.proposedEndDate || item.plannedDate,
    mode: item.mode,
    location: item.location,
    inspectionCategory: policy.inspectionCategory,
    noticePolicy: policy.noticePolicy,
    lead: item.preparation.leadInspector,
    team: team,
    status: 'Scheduled',
    checklistStarted: false,
    planningItemId: item.id
  };
  target.audits.push(audit);
  target.auditSeq += 1;
  item.auditId = audit.id;
  item.preparation.assignmentPackage.auditId = audit.id;

  var userIdByName = {};
  (target.users || []).forEach(function (user) { userIdByName[user.name] = user.id; });
  target.inspectionTeams.push({
    id: 'TEAM-' + audit.id,
    auditId: audit.id,
    department: audit.domain,
    status: 'Scheduled',
    startDate: audit.date,
    endDate: audit.endDate,
    leadUserId: userIdByName[audit.lead] || '',
    memberIds: audit.team.map(function (name) { return userIdByName[name] || ''; }).filter(Boolean),
    notes: item.preparation.resources,
    attachments: [],
    messages: [],
    history: [{ at: approvalDecisionDate(), actor: ROLES.manager.user, action: 'Inspection team confirmed from Planning' }]
  });
  target.inspectionWorkspaces[audit.id] = {
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

  var template = (target.templateLibrary || []).filter(function (candidate) {
    return candidate.id === audit.templateId;
  })[0] || null;
  var coordination = {
    auditId: audit.id,
    planningItemId: item.id,
    organizationId: audit.orgId,
    inspectionCategory: policy.inspectionCategory,
    noticePolicy: policy.noticePolicy,
    status: policy.coordinationStatus,
    proposedDate: audit.date,
    alternativeDate: '',
    confirmedDate: policy.noticePolicy === 'withheld' ? audit.date : '',
    checklistName: template ? template.name : 'Inspection Checklist',
    checklistFiles: [],
    sharedInformation: policy.noticePolicy === 'advance'
      ? ['Inspection scope', 'On-site location', 'Lead Inspector contact']
      : [],
    notifiedAt: '',
    respondedAt: '',
    caaConfirmedAt: '',
    providerComment: '',
    history: policy.noticePolicy === 'withheld'
      ? [{ at: approvalDecisionDate(), actor: 'System', action: 'Advance notice withheld by configured inspection policy' }]
      : []
  };
  target.inspectionCoordinations.push(coordination);
  return { audit: audit, coordination: coordination, created: true };
}
