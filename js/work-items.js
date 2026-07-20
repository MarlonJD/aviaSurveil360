/* ==========================================================================
   AviaSurveil360 — Work-item projections (DEMO ONLY)
   Data shaping only: workflow transitions remain in the existing action files.
   ========================================================================== */

function workItemPriority(label, tone, rank) {
  return { label: label || 'Normal', tone: tone || 'neutral', rank: rank || 50 };
}

function findingWorkState(finding) {
  var statusKey = finding && finding.status ? finding.status : 'WAITING_CAP';
  var cap = finding && finding.cap ? finding.cap : null;
  var evidence = finding && Array.isArray(finding.evidence) ? finding.evidence : [];
  var latestEvidence = evidence.length ? evidence[evidence.length - 1] : null;

  if (finding && finding.status !== 'CLOSED') {
    if (latestEvidence && /uploaded|submitted|pending/i.test(latestEvidence.status || '')) statusKey = 'EVIDENCE_SUBMITTED';
    else if (latestEvidence && /rejected|more information|revision|partially accepted/i.test(latestEvidence.status || '')) statusKey = 'EVIDENCE_MORE_INFO';
    else if (cap && /accepted/i.test(cap.status || '') && finding.evidenceRequired) statusKey = 'EVIDENCE_REQUIRED';
    else if (cap && /submitted|pending/i.test(cap.status || '')) statusKey = 'CAP_SUBMITTED';
    else if (finding.capRequired === false && finding.evidenceRequired === false) statusKey = 'OPEN_OBSERVATION';
  }

  var meta = FINDING_STATUS[statusKey] || FINDING_STATUS.WAITING_CAP;
  var closureBasis = null;
  if (statusKey === 'CLOSED') {
    if (finding.closureType === FINDING_CLOSURE_TYPES.AUTHORIZED || finding.closureType === 'authorized-no-cap') closureBasis = 'authorized';
    else if (finding.closureType === FINDING_CLOSURE_TYPES.EVIDENCE_VERIFIED || finding.closureType === 'evidence-accepted') closureBasis = 'evidence-verified';
    else closureBasis = 'unrecorded';
  }
  return {
    statusKey: statusKey,
    statusLabel: meta.label,
    ownerRole: meta.ownerRole || null,
    ownerLabel: !meta.ownerRole ? '—' : (meta.ownerRole === 'auditee' ? 'Auditee' : (meta.ownerRole === 'inspector' ? 'CAA Inspector' : roleName(meta.ownerRole))),
    nextAction: meta.next,
    dueDate: finding && finding.dueDate ? finding.dueDate : null,
    closureBasis: closureBasis
  };
}

function findingLifecycleProjection(finding) {
  var workState = findingWorkState(finding);
  var cap = finding && finding.cap ? finding.cap : null;
  var evidence = finding && Array.isArray(finding.evidence) ? finding.evidence : [];
  var capRequired = !!(finding && finding.capRequired);
  var evidenceRequired = !!(finding && finding.evidenceRequired);
  var capSubmitted = capRequired && !!(cap && (cap.submittedDate || !/^not submitted$/i.test(cap.status || 'Not Submitted')));
  var capAccepted = capRequired && !!(cap && /accepted/i.test(cap.status || ''));
  var evidenceSubmitted = evidenceRequired && evidence.length > 0;
  var evidenceVerified = evidenceRequired && evidence.some(function (record) {
    return /accepted|verified/i.test(record.status || record.reviewStatus || '');
  });
  if (workState.closureBasis === 'evidence-verified') evidenceVerified = true;
  var closed = workState.statusKey === 'CLOSED';
  var definitions = [
    { key: 'finding-issued', label: 'Finding issued', complete: true, required: true },
    { key: 'cap-submitted', label: 'CAP submitted', complete: capSubmitted, required: capRequired },
    { key: 'cap-accepted', label: 'CAP accepted', complete: capAccepted, required: capRequired },
    { key: 'evidence-submitted', label: 'Evidence submitted', complete: evidenceSubmitted, required: evidenceRequired },
    { key: 'evidence-verified', label: 'Evidence verified', complete: evidenceVerified, required: evidenceRequired },
    { key: 'closed', label: 'Closed', complete: closed, required: true }
  ];
  var currentAssigned = false;
  var steps = definitions.map(function (definition) {
    var stepState;
    if (!definition.required) stepState = 'not-required';
    else if (definition.complete) stepState = 'complete';
    else if (!currentAssigned) {
      stepState = 'current';
      currentAssigned = true;
    } else stepState = 'incomplete';
    return { key: definition.key, label: definition.label, state: stepState };
  });
  return {
    closureBasis: workState.closureBasis,
    closureLabel: closed ? closureBasisLabel(finding) : 'Closure pending',
    steps: steps
  };
}

var REMINDER_EVENT_BOUNDARY = 'Demo in-app event; no real delivery';

function reminderCalendarDay(dateValue) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue || ''));
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function deriveReminderStage(finding, today) {
  if (!finding || finding.status === 'CLOSED' || !finding.dueDate) return 'none';
  var dueDay = reminderCalendarDay(finding.dueDate);
  var todayDay = reminderCalendarDay(today);
  if (dueDay === null || todayDay === null) return 'none';
  var days = Math.round((dueDay - todayDay) / 86400000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days === 7) return '7_days';
  if (days === 15) return '15_days';
  if (days === 30) return '30_days';
  return 'none';
}

function reminderEventLabel(stage) {
  var labels = {
    '30_days': '30 days before Due Date',
    '15_days': '15 days before Due Date',
    '7_days': '7 days before Due Date',
    due_today: 'Due today',
    overdue: 'Overdue reminder',
    critical_attention: 'Level 1 manager attention',
    overdue_manager_escalation: 'Overdue manager escalation',
    manual: 'Manual reminder'
  };
  return labels[stage] || stage || 'Reminder event';
}

function appendReminderEvent(target, finding, stage, recipientRole, today) {
  var id = 'REM-' + finding.id + '-' + stage;
  var existing = target.reminderEvents.filter(function (event) { return event.id === id; })[0];
  if (existing) return existing;
  var event = {
    id: id,
    findingId: finding.id,
    auditId: finding.auditId || '',
    organizationId: finding.orgId,
    stage: stage,
    recipientRole: recipientRole,
    createdDate: today,
    channel: 'in_app',
    deliveryStatus: 'demo_recorded',
    boundary: REMINDER_EVENT_BOUNDARY
  };
  target.reminderEvents.push(event);
  return event;
}

function ensureDeterministicReminderEvents(target, today) {
  if (!target || !Array.isArray(target.findings)) return [];
  if (!Array.isArray(target.reminderEvents)) target.reminderEvents = [];
  target.findings.forEach(function (finding) {
    if (!finding || finding.status === 'CLOSED') return;
    var stage = deriveReminderStage(finding, today);
    if (stage !== 'none') appendReminderEvent(target, finding, stage, 'auditee', today);
    if (Number(finding.severity) === 1) {
      appendReminderEvent(target, finding, 'critical_attention', 'manager', today);
    }
    if (stage === 'overdue') {
      appendReminderEvent(target, finding, 'overdue_manager_escalation', 'manager', today);
    }
  });
  return target.reminderEvents;
}

function recordManualReminderEvent(target, finding, metadata) {
  if (!target || !finding) throw new Error('Finding is required for a manual reminder.');
  metadata = metadata || {};
  if (!Array.isArray(target.reminderEvents)) target.reminderEvents = [];
  if (!Array.isArray(target.auditLog)) target.auditLog = [];
  if (!Number.isFinite(target.reminderSeq) || target.reminderSeq < 1) target.reminderSeq = 1;
  if (!Number.isFinite(target.logSeq) || target.logSeq < 1) target.logSeq = 1;
  var at = String(metadata.at || (typeof nowIsoDemo === 'function' ? nowIsoDemo() : DEMO_TODAY + 'T00:00:00'));
  var event = {
    id: 'MANUAL-' + finding.id + '-' + String(target.reminderSeq++).padStart(3, '0'),
    findingId: finding.id,
    auditId: finding.auditId || '',
    organizationId: finding.orgId,
    stage: 'manual',
    recipientRole: 'auditee',
    createdDate: at.slice(0, 10),
    channel: 'in_app',
    deliveryStatus: 'demo_recorded',
    boundary: REMINDER_EVENT_BOUNDARY,
    actorRole: metadata.role || '',
    actorName: metadata.name || 'CAA user'
  };
  target.reminderEvents.push(event);
  target.auditLog.unshift({
    id: 'L' + target.logSeq++,
    time: at.slice(0, 10) + ' ' + at.slice(11, 16),
    actor: event.actorName + (event.actorRole ? ' (' + event.actorRole + ')' : ''),
    action: 'Manual reminder sent to Auditee (demo in-app; no real delivery)',
    target: finding.id,
    system: false
  });
  return event;
}

function reminderEventsForFinding(target, findingId, sessionRole, organizationId) {
  var events = target && Array.isArray(target.reminderEvents) ? target.reminderEvents : [];
  return events.filter(function (event) {
    if (event.findingId !== findingId) return false;
    if (sessionRole !== 'auditee') return true;
    return event.recipientRole === 'auditee' && event.organizationId === organizationId;
  });
}

function workItemPriorityForFinding(finding) {
  var d = dueInfo(finding);
  if (finding.status === 'CLOSED') return workItemPriority('Closed', 'ok', 80);
  if (d.overdue) return workItemPriority('Overdue', 'danger', 1);
  if (finding.severity === 1) return workItemPriority('Critical', 'danger', 2);
  if (finding.status === 'CAP_SUBMITTED' || finding.status === 'EVIDENCE_SUBMITTED') {
    return workItemPriority('Waiting review', 'warn', 3);
  }
  if (d.dueSoon) return workItemPriority('Due soon', 'warn', 4);
  if (statusMeta(finding).ownerRole === 'auditee') return workItemPriority('Waiting auditee', 'info', 20);
  return workItemPriority('Normal', 'neutral', 40);
}

function workItemDueTextForFinding(finding) {
  var d = dueInfo(finding);
  if (finding.status === 'CLOSED') return finding.closedDate ? 'Closed ' + fmtDate(finding.closedDate) : 'Closed';
  return (finding.dueDate ? 'Due Date ' + fmtDate(finding.dueDate) : 'Due Date -') + (d.label !== '-' && d.label !== '—' ? ' · ' + d.label : '');
}

function workItemPriorityForAudit(audit) {
  var d = auditDueInfo(audit);
  if (isClosedAudit(audit)) return workItemPriority('Closed', 'ok', 80);
  if (d.overdue) return workItemPriority('Overdue', 'danger', 1);
  if (d.dueSoon) return workItemPriority('Due soon', 'warn', 3);
  if (audit.status === 'In Progress') return workItemPriority('In progress', 'warn', 6);
  if (audit.status === 'Scheduled') return workItemPriority('Scheduled', 'info', 10);
  return workItemPriority('Planned', 'neutral', 35);
}

function workItemDueTextForAudit(audit) {
  var d = auditDueInfo(audit);
  if (isClosedAudit(audit)) return audit.status + ' · ' + fmtDate(audit.date);
  return 'Due Date ' + fmtDate(audit.date) + ' · ' + d.label;
}

function workItemChildrenForFinding(finding, options) {
  options = options || {};
  var children = [];
  if (finding.cap) {
    children.push({
      id: finding.id + '-cap',
      type: 'CAP',
      title: 'Corrective Action Plan',
      subtitle: finding.cap.correctiveAction || 'CAP submitted by auditee',
      organization: state.role === 'auditee' ? ROLES.auditee.orgName : orgName(finding.orgId),
      priority: finding.status === 'CAP_SUBMITTED' ? workItemPriority('Waiting review', 'warn', 3) : workItemPriority('CAP state', 'info', 30),
      lifecycle: 'Finding -> CAP -> Evidence -> Closure',
      owner: ownerLabel(finding),
      nextAction: finding.status === 'CAP_SUBMITTED' ? 'CAA review of submitted CAP' : 'CAP accepted; evidence still required before closure',
      dueText: finding.cap.targetDate ? 'Target ' + fmtDate(finding.cap.targetDate) : 'Target -',
      statusHtml: demoBadge(finding.cap.status || 'CAP recorded', finding.status === 'CAP_SUBMITTED' ? 'warn' : 'info'),
      primaryAction: finding.status === 'CAP_SUBMITTED' && state.role !== 'auditee'
        ? { label: 'Review CAP', action: 'reviewcap', cls: 'btn btn--primary' }
        : { label: 'Open finding', action: 'open', cls: 'btn' },
      route: { view: 'finding', id: finding.id },
      child: true
    });
  }
  if (finding.evidence && finding.evidence.length) {
    var versions = options.allEvidenceVersions ? finding.evidence : [finding.evidence[finding.evidence.length - 1]];
    versions.forEach(function (evidence) {
      children.push({
        id: finding.id + '-ev-' + evidence.version,
        type: 'Evidence',
        title: 'Evidence v' + evidence.version,
        subtitle: evidence.fileName + ' · mock filename only',
        organization: state.role === 'auditee' ? ROLES.auditee.orgName : orgName(finding.orgId),
        priority: finding.status === 'EVIDENCE_SUBMITTED' ? workItemPriority('Waiting review', 'warn', 3) : workItemPriority('Evidence', 'info', 25),
        lifecycle: 'CAP accepted -> Evidence -> CAA Review -> Closure',
        owner: ownerLabel(finding),
        nextAction: finding.status === 'EVIDENCE_SUBMITTED' ? 'CAA evidence review' : 'Preserve evidence version history',
        dueText: 'Uploaded ' + fmtDate(evidence.uploadedDate),
        statusHtml: demoBadge(evidence.status, evidence.status === 'Accepted' ? 'ok' : (evidence.status === 'Rejected' ? 'danger' : 'info')),
        primaryAction: finding.status === 'EVIDENCE_SUBMITTED' && state.role !== 'auditee'
          ? { label: 'Review evidence', action: 'reviewev', cls: 'btn btn--primary' }
          : { label: 'Open finding', action: 'open', cls: 'btn' },
        route: { view: 'finding', id: finding.id },
        child: true
      });
    });
  }
  return children;
}

function workItemFromFinding(finding, options) {
  var pa = primaryActionFor(finding);
  return {
    id: finding.id,
    type: 'Finding',
    title: finding.title,
    subtitle: finding.id + ' · ' + SEVERITY[finding.severity].label,
    organization: state.role === 'auditee' ? ROLES.auditee.orgName : orgName(finding.orgId),
    priority: workItemPriorityForFinding(finding),
    lifecycle: statusMeta(finding).label,
    owner: ownerLabel(finding),
    nextAction: nextActionLabel(finding),
    dueText: workItemDueTextForFinding(finding),
    statusHtml: statusBadge(finding),
    primaryAction: pa,
    route: pa.action === 'report' ? { view: 'report', id: finding.id } : { view: 'finding', id: finding.id },
    children: workItemChildrenForFinding(finding, options || {})
  };
}

function workItemFromAudit(audit) {
  var pa = primaryActionForAudit(audit);
  return {
    id: audit.id,
    type: 'Audit / Inspection',
    title: orgName(audit.orgId) + ' · ' + audit.type,
    subtitle: audit.ref + ' · ' + audit.domain,
    organization: orgName(audit.orgId),
    priority: workItemPriorityForAudit(audit),
    lifecycle: audit.status,
    owner: auditOwnerLabel(audit),
    nextAction: auditStatusMeta(audit).next,
    dueText: workItemDueTextForAudit(audit),
    statusHtml: auditStatusBadge(audit),
    primaryAction: pa,
    route: { view: 'audit-detail', id: audit.id },
    children: []
  };
}

function workItemPlanningNextAction(item) {
  var approval = approvalSummary(item);
  var prep = item.preparation || { status: 'not_released' };
  if (approval.outcome === 'rejected') return approval.nextAction;
  if (approval.outcome !== 'approved') return approval.nextAction;
  if (prep.status === 'not_released') return 'GM Release to Department';
  if (prep.status === 'released_to_department') return 'Department Manager accept released audit';
  if (prep.status === 'accepted_by_department') return 'Department Manager assign Lead Inspector';
  if (prep.status === 'lead_inspector_assigned') return 'Lead Inspector propose team, dates, and resources';
  if (prep.status === 'team_schedule_proposed') return 'Department Manager confirm and generate mock assignment package';
  if (prep.status === 'ready_for_execution') return 'Ready for execution';
  return planningPrepMeta(prep.status).label;
}

function workItemPlanningOwner(item) {
  var approval = approvalSummary(item);
  var prep = item.preparation || { status: 'not_released' };
  if (approval.outcome === 'rejected') return approval.ownerLabel;
  if (approval.outcome !== 'approved') return approval.ownerLabel;
  if (prep.status === 'not_released') return roleName('gm');
  if (prep.status === 'released_to_department') return roleName('manager');
  if (prep.status === 'accepted_by_department') return roleName('manager');
  if (prep.status === 'lead_inspector_assigned') return roleName('leadInspector');
  if (prep.status === 'team_schedule_proposed') return roleName('manager');
  if (prep.status === 'ready_for_execution') return roleName('leadInspector');
  return 'CAA Planning Team';
}

function workItemFromPlanningItem(item) {
  var approval = approvalSummary(item);
  var prep = item.preparation || { status: 'not_released' };
  var prepMeta = planningPrepMeta(prep.status);
  var priority = approval.outcome === 'approved' && prep.status === 'ready_for_execution'
    ? workItemPriority('Ready', 'ok', 30)
    : workItemPriority('Approval', approval.statusTone === 'danger' ? 'danger' : 'warn', 5);
  return {
    id: item.id,
    type: 'Planning Item',
    title: item.title,
    subtitle: item.department + ' · ' + item.triggerType,
    organization: item.organization,
    priority: priority,
    lifecycle: approval.statusLabel + ' / ' + prepMeta.label,
    owner: workItemPlanningOwner(item),
    nextAction: workItemPlanningNextAction(item),
    dueText: item.targetMonth ? 'Target ' + item.targetMonth : 'Target -',
    statusHtml: demoBadge(approval.statusLabel, approval.statusTone) + ' ' + demoBadge(prepMeta.label, prepMeta.tone),
    primaryAction: { label: 'Open planning', action: 'nav', view: 'planning', cls: 'btn btn--primary' },
    route: { view: 'planning', id: item.id },
    children: []
  };
}

function reportTypeLabel(report) {
  if (!report) return 'Report';
  if (report.finalLocked || report.status === 'final_report_generated') return 'Final Report';
  if (report.status === 'submitted_to_dm_final' || report.status === 'submitted_to_ed') return 'Final Report';
  if (report.approval && report.approval.currentIndex >= 3) return 'Final Report';
  var type = String(report.reportType || '').trim();
  if (/final/i.test(type) && !/preliminary/i.test(type)) return 'Final Report';
  if (/preliminary/i.test(type)) return 'Preliminary Report';
  return type || 'Report';
}

function reportTypeTone(report) {
  return reportTypeLabel(report) === 'Final Report' ? 'ok' : 'info';
}

function reportDueText(report) {
  if (!report) return '-';
  if (report.approvalDate) return 'Approved ' + fmtDate(report.approvalDate);
  if (report.preliminaryNotice && report.preliminaryNotice.responseDueDate) {
    return 'CAP due ' + fmtDate(report.preliminaryNotice.responseDueDate);
  }
  return 'Target report approval';
}

function workItemFromReport(report) {
  var audit = auditById(report.auditId);
  var summary = approvalSummary(report);
  var meta = approvalMetaForStatus(report.status);
  var typeLabel = reportTypeLabel(report);
  var priorityRank = summary.ownerRole === state.role ? 4 : 30;
  return {
    id: report.id,
    type: 'Report',
    title: report.title || report.id,
    subtitle: report.auditId + (audit ? ' · ' + audit.type : ''),
    organization: audit ? orgName(audit.orgId) : '—',
    priority: workItemPriority(typeLabel, reportTypeTone(report), priorityRank),
    lifecycle: summary.statusLabel,
    owner: summary.ownerLabel,
    nextAction: summary.nextAction,
    dueText: reportDueText(report),
    statusHtml: demoBadge(meta.label, meta.tone),
    primaryAction: { label: 'Open report', action: 'nav', view: 'audit-reports', cls: 'btn btn--primary' },
    route: { view: 'audit-reports', id: report.auditId },
    children: []
  };
}

function workItemFromRiskProfile(profile) {
  return {
    id: profile.id,
    type: 'Risk Signal',
    title: orgName(profile.orgId),
    subtitle: profile.band + ' · ' + profile.drivers.join(', '),
    organization: orgName(profile.orgId),
    priority: profile.score >= 80 ? workItemPriority('High attention', 'danger', 2) : workItemPriority('Needs attention', 'warn', 6),
    lifecycle: profile.band,
    owner: 'CAA Manager',
    nextAction: profile.recommendedAction,
    dueText: 'Review today',
    statusHtml: demoBadge('Mock risk indicator ' + profile.score, profile.score >= 80 ? 'danger' : 'warn'),
    primaryAction: { label: 'Open profile', action: 'nav', view: 'org-risk', cls: 'btn btn--primary' },
    route: { view: 'org-risk', id: profile.orgId },
    children: []
  };
}

function workItemFromOrganization(org) {
  var stats = typeof orgStats === 'function' ? orgStats(org.id) : { open: 0, overdue: 0, lastAudit: null };
  var risk = riskProfileByOrgId(org.id);
  return {
    id: org.id,
    type: 'Organization',
    title: org.name,
    subtitle: org.type + (risk ? ' · ' + risk.band : ''),
    organization: org.name,
    priority: stats.overdue ? workItemPriority('Overdue', 'danger', 2) : (org.repeatFindings ? workItemPriority('Repeat', 'warn', 8) : workItemPriority('Normal', 'neutral', 40)),
    lifecycle: risk ? risk.band : 'Surveillance record',
    owner: 'CAA Manager',
    nextAction: stats.open ? 'Review open findings and next audit' : 'Monitor next audit plan',
    dueText: stats.lastAudit ? 'Last audit ' + fmtDate(stats.lastAudit) : 'No completed audit',
    statusHtml: demoBadge(stats.open + ' open finding' + (stats.open === 1 ? '' : 's'), stats.overdue ? 'danger' : (stats.open ? 'warn' : 'ok')),
    primaryAction: { label: 'Open dossier', action: 'nav', view: 'org-detail', cls: 'btn btn--primary' },
    route: { view: 'org-detail', id: org.id },
    children: []
  };
}

function workItemFromAuditLog(entry) {
  return {
    id: entry.id,
    type: 'Audit Log',
    title: entry.action,
    subtitle: entry.target,
    organization: 'CAA internal',
    priority: workItemPriority(entry.system ? 'System' : 'Manual', entry.system ? 'info' : 'neutral', 40),
    lifecycle: entry.system ? 'System event' : 'Manual action',
    owner: entry.actor,
    nextAction: 'Trace event only',
    dueText: entry.time,
    statusHtml: demoBadge(entry.system ? 'System' : 'Manual', entry.system ? 'info' : 'neutral'),
    primaryAction: null,
    route: null,
    children: []
  };
}

function workItemSort(a, b) {
  var ar = a.priority && a.priority.rank ? a.priority.rank : 50;
  var br = b.priority && b.priority.rank ? b.priority.rank : 50;
  if (ar !== br) return ar - br;
  return String(a.dueText || '').localeCompare(String(b.dueText || '')) || String(a.id).localeCompare(String(b.id));
}
