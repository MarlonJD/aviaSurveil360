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
