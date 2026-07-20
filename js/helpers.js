/* ==========================================================================
   AviaSurveil360 — Helpers (formatting, lookups, KPIs, OHI, log, notify)
   ========================================================================== */

/* ----------------------------- Text / dates ----------------------------- */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtDate(iso) {
  if (!iso) return '—';
  var p = iso.split('-');
  if (p.length !== 3) return iso;
  return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
}

function dateVal(iso) { return new Date(iso + 'T00:00:00'); }

function daysBetween(aIso, bIso) {
  var ms = dateVal(bIso) - dateVal(aIso);
  return Math.round(ms / 86400000);
}

/* Due status relative to DEMO_TODAY. Closed findings are never overdue/due-soon. */
function dueInfo(finding) {
  if (finding.status === 'CLOSED' || !finding.dueDate) {
    return { overdue: false, dueSoon: false, days: null, label: '—' };
  }
  var days = daysBetween(DEMO_TODAY, finding.dueDate); // +ve = days remaining
  var out = { days: days, overdue: false, dueSoon: false, label: '' };
  if (days < 0) { out.overdue = true; out.label = Math.abs(days) + ' day' + (Math.abs(days) === 1 ? '' : 's') + ' overdue'; }
  else if (days === 0) { out.dueSoon = true; out.label = 'Due today'; }
  else if (days <= 7) { out.dueSoon = true; out.label = 'Due in ' + days + ' day' + (days === 1 ? '' : 's'); }
  else { out.label = 'Due in ' + days + ' days'; }
  return out;
}

/* ----------------------------- Lookups ----------------------------- */
function orgById(id) { for (var i = 0; i < state.orgs.length; i++) if (state.orgs[i].id === id) return state.orgs[i]; return null; }
function orgName(id) { var o = orgById(id); return o ? o.name : '—'; }
function auditById(id) { for (var i = 0; i < state.audits.length; i++) if (state.audits[i].id === id) return state.audits[i]; return null; }
function findingById(id) { for (var i = 0; i < state.findings.length; i++) if (state.findings[i].id === id) return state.findings[i]; return null; }
function regulatoryDocumentById(id) { for (var i = 0; i < state.regulatoryDocuments.length; i++) if (state.regulatoryDocuments[i].id === id) return state.regulatoryDocuments[i]; return null; }
function regulatoryTraceById(id) { for (var i = 0; i < state.regulatoryTraces.length; i++) if (state.regulatoryTraces[i].id === id) return state.regulatoryTraces[i]; return null; }
function riskProfileByOrgId(orgId) { for (var i = 0; i < state.riskProfiles.length; i++) if (state.riskProfiles[i].orgId === orgId) return state.riskProfiles[i]; return null; }
function aiSuggestionById(id) { for (var i = 0; i < state.aiSuggestions.length; i++) if (state.aiSuggestions[i].id === id) return state.aiSuggestions[i]; return null; }
function capEffectivenessByFindingId(id) { for (var i = 0; i < state.capEffectiveness.length; i++) if (state.capEffectiveness[i].findingId === id) return state.capEffectiveness[i]; return null; }

function roleName(roleKey) { return ROLES[roleKey] ? ROLES[roleKey].name : '—'; }

function currentSessionUser(target) {
  var session = target || state;
  var role = session && ROLES[session.role];
  if (!role || !role.userId) return null;
  return (session.users || []).filter(function (user) {
    return user.id === role.userId && user.roleKey === session.role && user.status === 'Active';
  })[0] || null;
}

function currentSessionActor(target) {
  var session = target || state;
  var user = currentSessionUser(session);
  if (!user) throw new Error('Active session user is required for ' + session.role + '.');
  return {
    userId: user.id,
    name: user.name,
    role: session.role,
    organizationId: session.role === 'auditee' ? ROLES.auditee.org : ''
  };
}

/* Findings visible to the current role. Auditee sees ONLY its own org. */
function visibleFindings() {
  if (state.role === 'auditee') {
    var org = ROLES.auditee.org;
    return state.findings.filter(function (f) { return f.orgId === org; });
  }
  return state.findings.slice();
}

function selectedFilter(key, fallback) {
  return (state.selectedFilters && state.selectedFilters[key]) || fallback || 'all';
}

function setSelectedFilter(key, value) {
  if (!state.selectedFilters) state.selectedFilters = {};
  state.selectedFilters[key] = value || 'all';
  persistAfterAction();
}

function offlineOutboxItems() {
  return (state.offlineOutbox || []).slice().sort(function (a, b) {
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

function waitingOutboxItems() {
  return offlineOutboxItems().filter(function (item) { return item.status === V2_STATUS.waitingForConnection; });
}

function regulatoryTraceForQuestion(questionId) {
  var traceId = state.questionTraces ? state.questionTraces[questionId] : null;
  return traceId ? regulatoryTraceById(traceId) : null;
}

function regulatoryTraceForFinding(finding) {
  if (!finding) return null;
  if (finding.traceId) return regulatoryTraceById(finding.traceId);
  if (finding.reference && finding.reference.indexOf('PBE') > -1) return regulatoryTraceById('TRACE-CAB-PBE-EMEQ');
  if (finding.id && finding.id.indexOf('CAB-') === 0) return regulatoryTraceById('TRACE-CAB-PBE-EMEQ');
  return null;
}

function humanStatus(status) {
  var map = {
    published: 'Published',
    draft: 'Draft',
    under_review: 'Under Review',
    superseded: 'Superseded',
    waiting_for_connection: 'Waiting for connection',
    synced_to_demo_state: 'Synced to demo state',
    accepted: 'Accepted',
    edited: 'Edited',
    rejected: 'Rejected',
    pending_review: 'Pending Review',
    missing_evidence: 'Missing evidence',
    effective_with_monitoring: 'Effective with monitoring',
    pending_evidence: 'Pending evidence',
    monitoring: 'Monitoring',
    in_progress: 'In Progress',
    planned: 'Planned',
    pending_lead_review: 'Pending Lead Review',
    returned_to_inspector: 'Returned to Inspector',
    returned_to_lead: 'Returned to Lead Inspector',
    released_to_department: 'Released to Department',
    accepted_by_department: 'Accepted by Department',
    lead_inspector_assigned: 'Lead Inspector Assigned',
    team_schedule_proposed: 'Team and Schedule Proposed',
    ready_for_execution: 'Ready for Execution',
    converted: 'Converted',
    dismissed: 'Dismissed'
  };
  return map[status] || status || '—';
}

function statusTone(status) {
  if (status === V2_STATUS.published || status === V2_STATUS.accepted || status === V2_STATUS.syncedToDemoState || status === 'effective_with_monitoring') return 'ok';
  if (status === V2_STATUS.underReview || status === V2_STATUS.waitingForConnection || status === 'missing_evidence' || status === 'pending_evidence' || status === 'in_progress' || status === 'pending_lead_review' || status === 'returned_to_inspector') return 'warn';
  if (status === V2_STATUS.rejected) return 'danger';
  if (status === V2_STATUS.draft || status === V2_STATUS.pendingReview || status === 'planned' || status === 'monitoring' || status === 'converted') return 'info';
  if (status === 'dismissed') return 'neutral';
  return 'neutral';
}

function v2Badge(status) {
  return '<span class="badge badge--' + statusTone(status) + '"><span class="dot"></span>' + esc(humanStatus(status)) + '</span>';
}

function demoBadge(label, tone) {
  return '<span class="badge badge--' + (tone || 'neutral') + '"><span class="dot"></span>' + esc(label) + '</span>';
}

function demoNowIso(target) {
  var session = target || (typeof state !== 'undefined' ? state : null);
  var sequence = session && Number.isFinite(session.demoClockSequence) ? session.demoClockSequence : 0;
  var totalSeconds = (9 * 60 * 60) + sequence;
  var hours = Math.floor(totalSeconds / 3600) % 24;
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;
  function p(n) { return String(n).padStart(2, '0'); }
  if (session) session.demoClockSequence = sequence + 1;
  return DEMO_TODAY + 'T' + p(hours) + ':' + p(minutes) + ':' + p(seconds) + '.000Z';
}

function nowIsoDemo() {
  return demoNowIso();
}

/* ----------------------------- Finding presentation ----------------------------- */
function statusMeta(finding) {
  var projection = typeof findingWorkState === 'function' ? findingWorkState(finding) : null;
  return projection ? (FINDING_STATUS[projection.statusKey] || FINDING_STATUS.WAITING_CAP) : (FINDING_STATUS[finding.status] || FINDING_STATUS.WAITING_CAP);
}

function ownerLabel(finding) {
  if (typeof findingWorkState === 'function') return findingWorkState(finding).ownerLabel;
  var m = statusMeta(finding);
  if (!m.ownerRole) return '—';
  return roleName(m.ownerRole);
}

function nextActionLabel(finding) {
  return typeof findingWorkState === 'function' ? findingWorkState(finding).nextAction : statusMeta(finding).next;
}

function severityHtml(finding) {
  var s = SEVERITY[finding.severity];
  return '<span class="sev ' + s.cls + '">' + esc(s.label) + '</span>';
}

function statusBadge(finding) {
  var m = statusMeta(finding);
  var html = '<span class="badge badge--' + m.badge + '"><span class="dot"></span>' + esc(m.label) + '</span>';
  var d = dueInfo(finding);
  if (d.overdue) html += ' <span class="badge badge--danger"><span class="dot"></span>Overdue</span>';
  else if (d.dueSoon) html += ' <span class="badge badge--warn"><span class="dot"></span>Due Soon</span>';
  return html;
}

/* The single most relevant action for a finding given the current role. */
function primaryActionFor(finding) {
  var m = statusMeta(finding);
  if (finding.status === 'CLOSED') return { label: 'View report', action: 'report', cls: 'btn' };
  if (state.role === 'auditee') {
    if (finding.status === 'WAITING_CAP' || finding.status === 'CAP_MORE_INFO') return { label: 'Submit CAP', action: 'cap', cls: 'btn btn--primary' };
    if (finding.status === 'EVIDENCE_REQUIRED' || finding.status === 'EVIDENCE_MORE_INFO') return { label: 'Upload evidence', action: 'evidence', cls: 'btn btn--primary' };
    return { label: 'View finding', action: 'open', cls: 'btn' };
  }
  if (state.role === 'inspector' || state.role === 'manager') {
    if (finding.status === 'CAP_SUBMITTED') return { label: 'Review CAP', action: 'reviewcap', cls: 'btn btn--primary' };
    if (finding.status === 'EVIDENCE_SUBMITTED') return { label: 'Review evidence', action: 'reviewev', cls: 'btn btn--primary' };
    return { label: 'View finding', action: 'open', cls: 'btn' };
  }
  return { label: 'View finding', action: 'open', cls: 'btn' };
}

/* ----------------------------- KPIs ----------------------------- */
function isClosedAudit(a) { return a.status === 'Report Issued' || a.status === 'Closed'; }

/* ----------------------------- Audit presentation ----------------------------- */
function auditDueInfo(audit) {
  if (isClosedAudit(audit) || !audit.date) {
    return { overdue: false, dueSoon: false, days: null, label: isClosedAudit(audit) ? 'Complete' : '-' };
  }
  var days = daysBetween(DEMO_TODAY, audit.date);
  var out = { days: days, overdue: false, dueSoon: false, label: '' };
  if (days < 0) {
    out.overdue = true;
    out.label = Math.abs(days) + ' day' + (Math.abs(days) === 1 ? '' : 's') + ' overdue';
  } else if (days === 0) {
    out.dueSoon = true;
    out.label = 'Today';
  } else if (days <= 7) {
    out.dueSoon = true;
    out.label = 'Due in ' + days + ' day' + (days === 1 ? '' : 's');
  } else {
    out.label = 'Due in ' + days + ' days';
  }
  return out;
}

function auditStatusMeta(audit) {
  if (audit.status === 'Planned') {
    return { badge: 'info', ownerRole: 'manager', next: 'Confirm schedule / release to inspector' };
  }
  if (audit.status === 'Scheduled') {
    return { badge: 'info', ownerRole: 'inspector', next: audit.checklistStarted ? 'Continue checklist' : 'Start checklist' };
  }
  if (audit.status === 'In Progress') {
    return { badge: 'warn', ownerRole: 'inspector', next: audit.checklistStarted ? 'Continue checklist / prepare report' : 'Start checklist' };
  }
  if (isClosedAudit(audit)) {
    return { badge: 'ok', ownerRole: null, next: 'No action - audit complete' };
  }
  return { badge: 'neutral', ownerRole: 'manager', next: 'Review audit status' };
}

function auditOwnerLabel(audit) {
  var m = auditStatusMeta(audit);
  if (!m.ownerRole) return '-';
  if (m.ownerRole === 'manager') return 'Department Manager';
  if (m.ownerRole === 'inspector') return 'CAA Inspector';
  return roleName(m.ownerRole);
}

function auditAssignedToCurrentUser(audit) {
  var r = ROLES[state.role];
  if (!r || !audit) return false;
  var names = [r.user].concat(r.assignmentAliases || []);
  if (names.indexOf(audit.lead) > -1) return true;
  if (!Array.isArray(audit.team)) return false;
  return names.some(function (name) { return audit.team.indexOf(name) > -1; });
}

function auditTurnInfo(audit) {
  var meta = auditStatusMeta(audit);
  if (!meta.ownerRole) {
    return { label: 'No action needed', detail: 'This audit is complete.', tone: 'ok' };
  }
  var ownerLabelText = auditOwnerLabel(audit);
  var yourTurn = meta.ownerRole === state.role;
  if (meta.ownerRole === 'inspector' || meta.ownerRole === 'leadInspector') {
    yourTurn = (state.role === 'inspector' || state.role === 'leadInspector') && auditAssignedToCurrentUser(audit);
  }
  if (yourTurn) {
    var d = auditDueInfo(audit);
    return {
      label: 'Your turn',
      detail: 'Action required from you.',
      tone: d.overdue ? 'danger' : (d.dueSoon ? 'warn' : 'info')
    };
  }
  return {
    label: 'Waiting on ' + ownerLabelText,
    detail: 'Nothing required from you right now.',
    tone: 'neutral'
  };
}

function auditStatusBadge(audit) {
  var m = auditStatusMeta(audit);
  var d = auditDueInfo(audit);
  var html = '<span class="badge badge--' + m.badge + '"><span class="dot"></span>' + esc(audit.status) + '</span>';
  if (d.overdue) html += ' <span class="badge badge--danger"><span class="dot"></span>Overdue</span>';
  else if (d.dueSoon) html += ' <span class="badge badge--warn"><span class="dot"></span>Due Soon</span>';
  return html;
}

function primaryActionForAudit(audit) {
  if (!audit || isClosedAudit(audit)) {
    return { label: 'View audit', action: 'nav', view: 'audit-detail', cls: 'btn' };
  }
  var turn = auditTurnInfo(audit);
  if (turn.label === 'Your turn' && auditStatusMeta(audit).ownerRole === 'inspector') {
    return {
      label: audit.checklistStarted ? 'Continue checklist' : 'Start checklist',
      action: audit.checklistStarted ? 'nav' : 'start-checklist',
      view: audit.checklistStarted ? 'checklist' : null,
      cls: 'btn btn--primary'
    };
  }
  return { label: 'View audit', action: 'nav', view: 'audit-detail', cls: 'btn' };
}

function computeKpis() {
  var f = state.findings;
  var open = f.filter(function (x) { return x.status !== 'CLOSED'; });
  var closed = f.filter(function (x) { return x.status === 'CLOSED'; });
  var overdue = open.filter(function (x) { return dueInfo(x).overdue; });
  var critical = open.filter(function (x) { return x.severity === 1; });

  var planned = state.audits.length;
  var completed = state.audits.filter(isClosedAudit).length;

  var closureDays = closed
    .filter(function (x) { return x.issuedDate && x.closedDate; })
    .map(function (x) { return Math.max(0, daysBetween(x.issuedDate, x.closedDate)); });
  var avgClosure = closureDays.length
    ? Math.round(closureDays.reduce(function (a, b) { return a + b; }, 0) / closureDays.length)
    : 0;

  return {
    plannedAudits: planned,
    completedAudits: completed,
    planCompletion: planned ? Math.round((completed / planned) * 100) : 0,
    openFindings: open.length,
    closedFindings: closed.length,
    overdueFindings: overdue.length,
    criticalFindings: critical.length,
    totalFindings: f.length,
    avgClosure: avgClosure
  };
}

/* Oversight Health Index — management indicator only (no enforcement). */
function computeOHI() {
  var k = computeKpis();
  var total = Math.max(k.totalFindings, 1);
  var open = Math.max(k.openFindings, 1);

  var planComp = k.planCompletion;                                   // 0..100
  var overdueScore = (1 - k.overdueFindings / total) * 100;          // fewer overdue = higher
  var criticalScore = (1 - k.criticalFindings / total) * 100;        // less exposure = higher
  var capEffScore = (k.closedFindings / total) * 100;                // closure throughput
  var orgsRepeat = state.orgs.filter(function (o) { return o.repeatFindings > 0; }).length;
  var repeatScore = (1 - orgsRepeat / Math.max(state.orgs.length, 1)) * 100;
  var workloadScore = 82;                                            // demo: balanced workload

  var score = Math.round(
    planComp * 0.20 +
    overdueScore * 0.25 +
    criticalScore * 0.20 +
    capEffScore * 0.15 +
    repeatScore * 0.10 +
    workloadScore * 0.10
  );
  score = Math.max(0, Math.min(100, score));

  var band, color;
  if (score >= 90) { band = 'Excellent'; color = '#1f9d62'; }
  else if (score >= 75) { band = 'Healthy'; color = '#1f9d62'; }
  else if (score >= 60) { band = 'Needs Attention'; color = '#c77700'; }
  else { band = 'Critical'; color = '#c0392b'; }

  return {
    score: score, band: band, color: color,
    components: [
      { label: 'Plan Completion Rate', weight: 20, value: Math.round(planComp) },
      { label: 'Overdue Finding Ratio', weight: 25, value: Math.round(overdueScore) },
      { label: 'Critical Finding Exposure', weight: 20, value: Math.round(criticalScore) },
      { label: 'CAP / Closure Effectiveness', weight: 15, value: Math.round(capEffScore) },
      { label: 'Repeat Finding Rate', weight: 10, value: Math.round(repeatScore) },
      { label: 'Inspector Workload Balance', weight: 10, value: Math.round(workloadScore) }
    ]
  };
}

/* ----------------------------- Audit log + notifications ----------------------------- */
function currentActorLabel() {
  var r = ROLES[state.role];
  if (!r) return 'System';
  var actor = currentSessionActor(state);
  var suffix = state.role === 'auditee' ? ' (Auditee)' : ' (' + r.name + ')';
  return actor.name + suffix;
}

function addLog(action, target, actorOverride) {
  state.auditLog.unshift({
    id: 'L' + (state.logSeq++),
    time: logTimestamp(),
    actor: actorOverride || currentActorLabel(),
    action: action,
    target: target,
    system: false
  });
}

function logTimestamp() {
  var iso = demoNowIso();
  return iso.slice(0, 10) + ' ' + iso.slice(11, 16);
}

function pushNotification(role, icon, text, options) {
  options = options || {};
  var notification = {
    id: 'N' + (state.notifSeq++),
    role: role,
    organizationId: options.organizationId || '',
    userId: options.userId || '',
    icon: icon,
    text: text,
    time: 'Just now',
    unread: true
  };
  state.notifications.unshift(notification);
  if (notificationVisibleToSession(notification, state)) toast(icon + ' Notification', text, 'info');
  return notification;
}

function notificationVisibleToSession(notification, targetState) {
  var target = targetState || state;
  if (!notification || !target || notification.role !== target.role) return false;
  if (target.role === 'auditee') {
    var organizationId = target.auditeeOrganizationId || (typeof ROLES !== 'undefined' && ROLES.auditee ? ROLES.auditee.org : '');
    return !!organizationId && notification.organizationId === organizationId;
  }
  if (target.role === 'inspector' && notification.userId) {
    return notification.userId === (target.inspectorUserId || 'USR-AYLIN');
  }
  return true;
}

function notificationOrganizationIdForFinding(findingId, targetState) {
  var target = targetState || state;
  var findings = target && Array.isArray(target.findings) ? target.findings : [];
  var finding = findings.filter(function (item) { return item.id === findingId; })[0] || null;
  return finding ? (finding.orgId || finding.organizationId || '') : '';
}

function unreadCount(role, targetState) {
  var target = targetState || state;
  var session = Object.assign({}, target, { role: role || target.role });
  return (target.notifications || []).filter(function (notification) {
    return notification.unread && notificationVisibleToSession(notification, session);
  }).length;
}

/* ----------------------------- Toast ----------------------------- */
function toast(title, msg, type) {
  var host = document.getElementById('toast-host');
  if (!host) return;
  host.innerHTML = '';
  var el = document.createElement('div');
  el.className = 'toast' + (type === 'ok' ? ' is-ok' : type === 'warn' ? ' is-warn' : '');
  var icon = type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
  el.innerHTML =
    '<div class="toast__icon">' + icon + '</div>' +
    '<div><div class="toast__title">' + esc(title) + '</div>' +
    '<div class="toast__msg">' + esc(msg) + '</div></div>';
  host.appendChild(el);
  setTimeout(function () {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }, 4200);
}
