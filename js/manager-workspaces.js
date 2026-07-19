/* ==========================================================================
   AviaSurveil360 — Department Manager workspace state helpers (DEMO ONLY)
   ========================================================================== */

function ensureManagerWorkspaceState(target) {
  var s = target || state;
  if (!Array.isArray(s.users)) s.users = deepClone(SEED_USERS);
  if (!Array.isArray(s.inspectionTeams)) s.inspectionTeams = deepClone(SEED_INSPECTION_TEAMS);
  if (!Array.isArray(s.managerReports)) s.managerReports = deepClone(SEED_MANAGER_REPORTS);
  s.inspectionTeams.forEach(function (team) {
    if (!Array.isArray(team.memberIds)) team.memberIds = [];
    if (!Array.isArray(team.attachments)) team.attachments = [];
    if (!Array.isArray(team.messages)) team.messages = [];
    if (!Array.isArray(team.history)) team.history = [];
    if (typeof team.notes !== 'string') team.notes = '';
  });
  return s;
}

function managerFindingsForAudit(target, auditId) {
  var s = ensureManagerWorkspaceState(target);
  return s.findings.filter(function (finding) { return finding.auditId === auditId; });
}

function managerFindingCounts(findings) {
  return (findings || []).reduce(function (counts, finding) {
    counts.total += 1;
    if (finding.severity === 1) counts.critical += 1;
    else if (finding.severity === 2) counts.major += 1;
    else if (finding.severity === 3) counts.minor += 1;
    else counts.observations += 1;
    if (finding.status === 'CLOSED') counts.closed += 1;
    else if (finding.status === 'CAP_SUBMITTED' || finding.status === 'EVIDENCE_SUBMITTED') counts.inReview += 1;
    else counts.open += 1;
    return counts;
  }, { total: 0, critical: 0, major: 0, minor: 0, observations: 0, open: 0, inReview: 0, closed: 0 });
}

function managerAuditPhase(status) {
  if (status === 'Closed') return 'Closed';
  if (status === 'Report Issued') return 'Reporting';
  if (status === 'In Progress') return 'Inspection';
  return 'Planning';
}

function managerInspectionRows(target, filters) {
  var s = target || state;
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var findings = Array.isArray(s.findings) ? s.findings : [];
  var orgs = Array.isArray(s.orgs) ? s.orgs : [];
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var status = opts.status || 'all';
  var dateRange = opts.dateRange || 'all';

  function organizationName(orgId) {
    var organization = orgs.filter(function (org) { return org.id === orgId; })[0];
    return organization ? organization.name : '—';
  }

  function matchesStatus(audit) {
    if (status === 'all') return true;
    if (status === 'active') return audit.status === 'Scheduled' || audit.status === 'In Progress';
    if (status === 'complete') return audit.status === 'Closed' || audit.status === 'Report Issued';
    if (status === 'planned') return audit.status === 'Planned';
    return String(audit.status || '').toLowerCase().replace(/\s+/g, '-') === status;
  }

  function matchesDate(audit) {
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return audit.date === DEMO_TODAY;
    if (dateRange === 'upcoming') return !!audit.date && audit.date >= DEMO_TODAY;
    if (dateRange === 'past-30') return !!audit.date && audit.date <= DEMO_TODAY && daysBetween(audit.date, DEMO_TODAY) <= 30;
    if (dateRange === 'past-90') return !!audit.date && audit.date <= DEMO_TODAY && daysBetween(audit.date, DEMO_TODAY) <= 90;
    return true;
  }

  return audits.map(function (audit) {
    var auditFindings = findings.filter(function (finding) { return finding.auditId === audit.id; });
    var organization = organizationName(audit.orgId);
    return {
      auditId: audit.id,
      organizationId: audit.orgId,
      organization: organization,
      auditDate: audit.date,
      teamLeader: audit.lead || '—',
      team: Array.isArray(audit.team) ? audit.team.slice() : [],
      department: audit.domain || '—',
      type: audit.type || audit.ref || 'Audit / Inspection',
      reference: audit.ref || audit.id,
      phase: managerAuditPhase(audit.status),
      status: audit.status || '—',
      findings: auditFindings.slice(),
      counts: managerFindingCounts(auditFindings)
    };
  }).filter(function (row) {
    if (!row.counts.total) return false;
    var haystack = [
      row.auditId, row.organization, row.reference, row.type, row.department,
      row.teamLeader, row.status, row.phase
    ].join(' ').toLowerCase();
    return (!query || haystack.indexOf(query) !== -1) && matchesStatus({ status: row.status }) && matchesDate({ date: row.auditDate });
  }).sort(function (left, right) {
    return (right.auditDate || '').localeCompare(left.auditDate || '') || left.auditId.localeCompare(right.auditId);
  });
}

function managerReportById(target, reportId) {
  var s = ensureManagerWorkspaceState(target);
  if (typeof reportArtifactById === 'function') {
    var artifact = reportArtifactById(reportId, s);
    if (artifact) return artifact;
  }
  return s.managerReports.filter(function (report) { return report.id === reportId; })[0] || null;
}

var MANAGER_REPORT_TRANSITIONS = {
  'Preliminary Report': {
    approve: {
      status: 'submitted_to_gm',
      ownerRole: 'gm',
      action: 'Department Manager approved and forwarded Preliminary Report to General Manager'
    }
  },
  'Final Report': {
    approve: {
      status: 'submitted_to_gm',
      ownerRole: 'gm',
      action: 'Department Manager approved and forwarded Final Report to General Manager'
    }
  }
};

function managerReportDecisionResult(ok, message, report) {
  return { ok: ok, message: message, report: report || null };
}

function managerReportDecisionTimestamp() {
  if (typeof logTimestamp === 'function') return logTimestamp();
  return (typeof DEMO_TODAY === 'string' ? DEMO_TODAY : '2026-06-15') + ' 00:00';
}

function managerReportRows(target, filters) {
  var s = ensureManagerWorkspaceState(target);
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var reportType = opts.reportType || 'all';
  var status = opts.status || 'all';

  function matchesStatus(report) {
    if (status === 'all') return true;
    if (status === 'pending') return report.status === 'pending_manager';
    if (status === 'revision') return report.status === 'revision_requested' || report.status === 'returned_to_lead';
    if (status === 'approved') {
      return ['released_to_service_provider', 'submitted_to_gm', 'submitted_to_executive', 'issued'].indexOf(report.status) !== -1;
    }
    return report.status === status;
  }

  var reports = typeof reportReadModels === 'function' ? reportReadModels(s) : s.managerReports;
  return reports.filter(function (report) {
    if (reportType !== 'all' && report.reportType !== reportType) return false;
    if (!matchesStatus(report)) return false;
    var haystack = [
      report.id,
      report.auditId,
      report.organization,
      report.reportType,
      report.version,
      report.leadInspector,
      report.status,
      report.summary
    ].join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  }).sort(function (left, right) {
    return (right.submittedAt || '').localeCompare(left.submittedAt || '') || left.id.localeCompare(right.id);
  });
}

function applyManagerReportDecision(target, reportId, decision, comment, actor) {
  var report = managerReportById(target, reportId);
  if (!report) return managerReportDecisionResult(false, 'Report artifact not found.', null);
  if (report.status !== 'pending_manager') {
    return managerReportDecisionResult(false, 'This report is no longer pending the Department Manager decision.', report);
  }
  if (['approve', 'revision', 'return'].indexOf(decision) === -1) {
    return managerReportDecisionResult(false, 'Choose a supported report decision.', report);
  }

  var cleanComment = String(comment || '').trim();
  if ((decision === 'revision' || decision === 'return') && !cleanComment) {
    return managerReportDecisionResult(false, 'A manager comment is required to request revision or return the report.', report);
  }

  var transition = null;
  if (decision === 'revision') {
    transition = {
      status: 'revision_requested',
      ownerRole: 'leadInspector',
      action: 'Revision requested by Department Manager'
    };
  } else if (decision === 'return') {
    transition = {
      status: 'returned_to_lead',
      ownerRole: 'leadInspector',
      action: 'Returned to Lead Inspector by Department Manager'
    };
  } else if (report.reportType === 'Preliminary Report') {
    transition = MANAGER_REPORT_TRANSITIONS['Preliminary Report'].approve;
  } else if (report.reportType === 'Final Report') {
    transition = MANAGER_REPORT_TRANSITIONS['Final Report'].approve;
  }

  if (!transition) return managerReportDecisionResult(false, 'No manager transition is configured for this report.', report);

  var at = managerReportDecisionTimestamp();
  var actorName = actor && actor.name ? actor.name : String(actor || 'Department Manager');
  report.status = transition.status;
  report.ownerRole = transition.ownerRole;
  report.managerDecision = decision;
  report.managerDecisionAt = at;
  report.managerComment = cleanComment;
  if (!Array.isArray(report.history)) report.history = [];
  report.history.push({
    at: at,
    actor: actorName,
    action: transition.action,
    comment: cleanComment
  });
  return managerReportDecisionResult(true, transition.action + '.', report);
}

function managerReportPdfFilename(report, variant) {
  var type = report && report.reportType === 'Final Report' ? 'Final_Report' : 'Preliminary_Report';
  var organization = String(report && report.organization || 'Organization').replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '') || 'Organization';
  if (variant === 'executive') return organization + '_Executive_Summary_' + report.id + '.pdf';
  return organization + '_' + type + '_' + report.id + '.pdf';
}

function managerReportPdfLines(report, variant, target) {
  if (!report) return ['AviaSurveil360 Demo Report', 'Demo-only report artifact unavailable.'];
  var s = target || (typeof state !== 'undefined' ? state : null);
  var findings = s && Array.isArray(s.findings)
    ? s.findings.filter(function (finding) { return finding.auditId === report.auditId; })
    : [];
  var counts = managerFindingCounts(findings);
  var title = variant === 'executive' ? 'Executive Summary' : report.reportType;
  var status = String(report.status || 'unknown').replace(/_/g, ' ');
  var lines = [
    'AviaSurveil360 - ' + title,
    'Demo-only browser-generated document - not a production authority record',
    '',
    'Report ID: ' + report.id,
    'Audit ID: ' + report.auditId,
    'Organization: ' + report.organization,
    'Organization Type: Operator / Service Provider',
    'Report Type: ' + report.reportType,
    'Version: ' + report.version,
    'Lead Inspector: ' + report.leadInspector,
    'Submitted: ' + report.submittedAt,
    'Status: ' + status,
    '',
    'Executive Summary',
    report.summary || 'No executive summary is available.',
    '',
    'Findings Summary',
    'Total: ' + counts.total,
    'Level 1 Critical: ' + counts.critical,
    'Level 2 Major: ' + counts.major,
    'Level 3 Minor: ' + counts.minor,
    'Observations: ' + counts.observations,
    'Open: ' + counts.open + ' | In Review: ' + counts.inReview + ' | Closed: ' + counts.closed,
    '',
    report.capRequired
      ? 'CAP/evidence note: CAP response and required evidence remain subject to configured CAA review.'
      : 'CAP/evidence note: This report is configured as not requiring a CAP response.'
  ];
  if (report.reportType === 'Final Report') {
    lines.push('Authorization note: Department Manager approval does not issue or lock this Final Report; configured final authorized approval is required.');
  }
  if (variant !== 'executive' && findings.length) {
    lines.push('', 'Finding Records');
    findings.forEach(function (finding) {
      lines.push(finding.id + ' | ' + finding.title + ' | Severity ' + finding.severity + ' | ' + finding.status);
    });
  }
  lines.push('', 'Demo-only: no production reporting engine, document storage, e-signature, or records-management service is used.');
  return lines;
}

function managerDashboardProjection(target) {
  var s = target || state;
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var findings = Array.isArray(s.findings) ? s.findings : [];
  var reports = typeof reportReadModels === 'function' ? reportReadModels(s) : (Array.isArray(s.managerReports) ? s.managerReports : []);
  var teams = Array.isArray(s.inspectionTeams) ? s.inspectionTeams : [];
  var users = Array.isArray(s.users) ? s.users : [];
  var openFindings = findings.filter(function (finding) { return finding.status !== 'CLOSED'; });
  var capFindings = openFindings.filter(function (finding) { return finding.capRequired; });
  var teamMemberIds = {};
  teams.forEach(function (team) {
    (team.memberIds || []).forEach(function (userId) {
      var user = users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
      if (user && user.reportsToRole === 'manager') teamMemberIds[userId] = true;
    });
  });
  return {
    organization: typeof CANONICAL_SERVICE_PROVIDER_NAME === 'string' ? CANONICAL_SERVICE_PROVIDER_NAME : 'Fly Namibia',
    totalAudits: audits.length,
    inProgressAudits: audits.filter(function (audit) { return audit.status === 'In Progress'; }).length,
    reportsAwaitingApproval: reports.filter(function (report) { return report.status === 'pending_manager'; }).length,
    openFindings: openFindings.length,
    capInProgress: capFindings.filter(function (finding) {
      return finding.status !== 'WAITING_CAP' && finding.cap && finding.cap.status !== 'Not Submitted';
    }).length,
    overdueCaps: capFindings.filter(function (finding) {
      return !!finding.dueDate && finding.dueDate < DEMO_TODAY;
    }).length,
    teamMembers: Object.keys(teamMemberIds).length,
    recentHighRiskFindings: openFindings.filter(function (finding) {
      return finding.severity === 1;
    }).slice().sort(function (left, right) {
      return (right.issuedDate || '').localeCompare(left.issuedDate || '') || left.id.localeCompare(right.id);
    }).slice(0, 5),
    upcomingAudits: audits.filter(function (audit) {
      return !!audit.date && audit.date >= DEMO_TODAY && audit.status !== 'Closed' && audit.status !== 'Report Issued';
    }).slice().sort(function (left, right) {
      return left.date.localeCompare(right.date) || left.id.localeCompare(right.id);
    }).slice(0, 5)
  };
}

function managerCapSeverityLabel(severity) {
  if (severity === 1) return 'Level 1 Critical';
  if (severity === 2) return 'Level 2 Major';
  if (severity === 3) return 'Level 3 Minor';
  return 'Observation';
}

function managerCapSourceById(target, capId) {
  var s = target || state;
  var findings = Array.isArray(s.findings) ? s.findings : [];
  for (var i = 0; i < findings.length; i += 1) {
    if (findings[i].cap && findings[i].cap.id === capId) return { finding: findings[i], cap: findings[i].cap };
  }
  return null;
}

function managerCapRows(target, filters) {
  var s = target || state;
  var findings = Array.isArray(s.findings) ? s.findings : [];
  var orgs = Array.isArray(s.orgs) ? s.orgs : [];
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var opts = filters || {};
  var status = opts.status || 'all';
  var department = opts.department || 'all';
  var inspection = opts.inspection || 'all';
  var due = opts.due || 'all';

  function orgFor(orgId) {
    return orgs.filter(function (org) { return org.id === orgId; })[0] || null;
  }

  function auditFor(auditId) {
    return audits.filter(function (audit) { return audit.id === auditId; })[0] || null;
  }

  function statusKey(row) {
    if (row.overdue) return 'overdue';
    if (row.findingStatus === 'CLOSED' || row.status === 'Completed') return 'completed';
    if (row.status === 'Not Submitted') return 'not-submitted';
    if (row.status === 'Evidence Required') return 'evidence-required';
    return 'in-progress';
  }

  return findings.filter(function (finding) {
    return finding.capRequired && finding.cap && finding.cap.id;
  }).map(function (finding) {
    var cap = finding.cap;
    var audit = auditFor(finding.auditId);
    var organization = orgFor(finding.orgId);
    var dueDate = cap.dueDate || finding.dueDate || '';
    var days = dueDate ? daysBetween(DEMO_TODAY, dueDate) : null;
    var row = {
      id: cap.id,
      findingId: finding.id,
      findingTitle: finding.title,
      findingDescription: finding.description,
      findingStatus: finding.status,
      inspectionId: finding.auditId || '',
      inspection: audit ? (audit.ref || audit.type || audit.id) : (finding.auditId || '—'),
      organizationId: finding.orgId,
      organization: organization ? organization.name : '—',
      department: finding.department || (audit && audit.domain) || 'Unassigned',
      findingLevel: managerCapSeverityLabel(finding.severity),
      severity: finding.severity,
      status: cap.monitoringStatus || cap.status || 'In Progress',
      actionOwner: cap.responsible || finding.responsiblePerson || 'Unassigned',
      assignee: cap.assignee || cap.responsible || finding.responsiblePerson || 'Unassigned',
      dueDate: dueDate,
      daysLeft: days,
      overdue: days !== null && days < 0 && finding.status !== 'CLOSED',
      progress: Math.max(0, Math.min(100, Number(cap.progress) || 0)),
      lastUpdate: cap.lastUpdate || cap.submittedDate || finding.issuedDate || '',
      priority: cap.priority || (finding.severity === 1 ? 'Critical' : (finding.severity === 2 ? 'High' : 'Medium')),
      targetClosureDate: cap.targetClosureDate || cap.targetDate || '',
      impactRisk: cap.impactRisk || finding.description || '',
      rootCause: cap.rootCause || '',
      correctiveAction: cap.correctiveAction || '',
      preventiveAction: cap.preventiveAction || '',
      reference: finding.reference || '',
      capVerification: finding.capVerification ? Object.assign({}, finding.capVerification) : null,
      updates: Array.isArray(cap.updates) ? cap.updates.slice() : [],
      documents: Array.isArray(cap.attachments) ? cap.attachments.slice() : [],
      notifications: Array.isArray(cap.notifications) ? cap.notifications.slice() : [],
      history: Array.isArray(cap.history) ? cap.history.slice() : []
    };
    row.statusKey = statusKey(row);
    return row;
  }).filter(function (row) {
    if (status !== 'all' && row.statusKey !== status && row.status !== status) return false;
    if (department !== 'all' && row.department !== department) return false;
    if (inspection !== 'all' && row.inspectionId !== inspection) return false;
    if (due === 'overdue' && !row.overdue) return false;
    if (due === 'next-7' && (row.daysLeft === null || row.daysLeft < 0 || row.daysLeft > 7)) return false;
    if (due === 'next-30' && (row.daysLeft === null || row.daysLeft < 0 || row.daysLeft > 30)) return false;
    return true;
  }).sort(function (left, right) {
    if (left.overdue !== right.overdue) return left.overdue ? -1 : 1;
    return (left.dueDate || '9999').localeCompare(right.dueDate || '9999') || left.id.localeCompare(right.id);
  });
}

function managerCapById(target, capId) {
  return managerCapRows(target, { status: 'all', department: 'all', inspection: 'all', due: 'all' }).filter(function (row) {
    return row.id === capId;
  })[0] || null;
}

function managerCapMetrics(rows) {
  return (rows || []).reduce(function (metrics, row) {
    metrics.total += 1;
    if (row.overdue) metrics.overdue += 1;
    else if (row.statusKey === 'completed') metrics.completed += 1;
    else if (row.statusKey === 'not-submitted') metrics.notSubmitted += 1;
    else if (row.statusKey === 'evidence-required') metrics.evidenceRequired += 1;
    else metrics.inProgress += 1;
    return metrics;
  }, { total: 0, notSubmitted: 0, inProgress: 0, evidenceRequired: 0, overdue: 0, completed: 0 });
}

function addManagerCapUpdate(target, capId, text, actor) {
  var source = managerCapSourceById(target, capId);
  if (!source) return { ok: false, message: 'CAP record not found.', cap: null };
  var clean = String(text || '').trim();
  if (!clean) return { ok: false, message: 'An update is required.', cap: managerCapById(target, capId) };
  var at = managerReportDecisionTimestamp();
  if (!Array.isArray(source.cap.updates)) source.cap.updates = [];
  if (!Array.isArray(source.cap.history)) source.cap.history = [];
  source.cap.updates.push({ at: at, actor: actor || 'Department Manager', text: clean });
  source.cap.history.push({ at: at, actor: actor || 'Department Manager', action: 'CAP update added: ' + clean });
  source.cap.lastUpdate = at;
  return { ok: true, message: 'CAP update added.', cap: managerCapById(target, capId) };
}

function managerRiskLevel(severity) {
  if (severity === 1) return 'High';
  if (severity === 2) return 'Medium';
  if (severity === 3) return 'Low';
  return 'Very Low';
}

function managerRiskCoordinates(finding, overdue) {
  if (finding.severity === 1) return { likelihood: overdue ? 5 : 4, impact: 5 };
  if (finding.severity === 2) return { likelihood: overdue ? 4 : 3, impact: 4 };
  if (finding.severity === 3) return { likelihood: overdue ? 3 : 2, impact: 3 };
  return { likelihood: finding.status === 'CLOSED' ? 1 : 2, impact: 2 };
}

function managerRiskWeek(date) {
  if (!date) return 'Unknown';
  var value = new Date(date + 'T00:00:00Z');
  var start = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  var day = Math.floor((value - start) / 86400000);
  var week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return value.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

function managerRiskProjection(target, filters) {
  var s = target || state;
  var opts = filters || {};
  var dateRange = opts.dateRange || 'all';
  var departmentFilter = opts.department || 'all';
  var inspectionFilter = opts.inspection || 'all';
  var riskFilter = opts.risk || 'all';
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var orgs = Array.isArray(s.orgs) ? s.orgs : [];
  var findings = Array.isArray(s.findings) ? s.findings : [];

  function auditFor(auditId) {
    return audits.filter(function (audit) { return audit.id === auditId; })[0] || null;
  }

  function orgFor(orgId) {
    return orgs.filter(function (org) { return org.id === orgId; })[0] || null;
  }

  function matchesDate(date) {
    if (dateRange === 'all') return true;
    if (!date) return false;
    var age = daysBetween(date, DEMO_TODAY);
    if (dateRange === 'last-30') return age >= 0 && age <= 30;
    if (dateRange === 'last-90') return age >= 0 && age <= 90;
    if (dateRange === 'year') return date.slice(0, 4) === DEMO_TODAY.slice(0, 4);
    return true;
  }

  var rows = findings.map(function (finding) {
    var audit = auditFor(finding.auditId);
    var org = orgFor(finding.orgId);
    var department = finding.department || (audit && audit.domain) || 'Unassigned';
    var dueDate = finding.cap && finding.cap.dueDate ? finding.cap.dueDate : finding.dueDate;
    var overdue = finding.status !== 'CLOSED' && finding.capRequired && !!dueDate && dueDate < DEMO_TODAY;
    var riskLevel = managerRiskLevel(finding.severity);
    var coordinates = managerRiskCoordinates(finding, overdue);
    return {
      id: finding.id,
      title: finding.title,
      organization: org ? org.name : '—',
      organizationId: finding.orgId || '',
      inspectionId: finding.auditId || 'Unassigned',
      inspection: audit ? (audit.ref || audit.type || audit.id) : 'Unassigned',
      department: department,
      issuedDate: finding.issuedDate || '',
      dueDate: dueDate || '',
      status: finding.status,
      closed: finding.status === 'CLOSED',
      capRequired: !!finding.capRequired,
      overdueCap: overdue,
      severity: finding.severity,
      riskLevel: riskLevel,
      likelihood: coordinates.likelihood,
      impact: coordinates.impact,
      riskScore: coordinates.likelihood * coordinates.impact,
      week: managerRiskWeek(finding.issuedDate)
    };
  }).filter(function (row) {
    if (!matchesDate(row.issuedDate)) return false;
    if (departmentFilter !== 'all' && row.department !== departmentFilter) return false;
    if (inspectionFilter !== 'all' && row.inspectionId !== inspectionFilter) return false;
    if (riskFilter !== 'all' && row.riskLevel !== riskFilter) return false;
    return true;
  });

  var matrix = [];
  for (var likelihood = 5; likelihood >= 1; likelihood -= 1) {
    for (var impact = 1; impact <= 5; impact += 1) {
      matrix.push({
        likelihood: likelihood,
        impact: impact,
        score: likelihood * impact,
        count: rows.filter(function (row) { return row.likelihood === likelihood && row.impact === impact; }).length
      });
    }
  }

  var departmentMap = {};
  var weekMap = {};
  rows.forEach(function (row) {
    if (!departmentMap[row.department]) departmentMap[row.department] = { department: row.department, high: 0, medium: 0, low: 0, veryLow: 0, total: 0, score: 0 };
    var department = departmentMap[row.department];
    var key = row.riskLevel === 'Very Low' ? 'veryLow' : row.riskLevel.toLowerCase();
    department[key] += 1;
    department.total += 1;
    department.score += row.riskLevel === 'High' ? 4 : (row.riskLevel === 'Medium' ? 3 : (row.riskLevel === 'Low' ? 2 : 1));
    if (!weekMap[row.week]) weekMap[row.week] = { week: row.week, high: 0, medium: 0, low: 0, veryLow: 0, total: 0 };
    weekMap[row.week][key] += 1;
    weekMap[row.week].total += 1;
  });

  var departmentDistribution = Object.keys(departmentMap).map(function (key) { return departmentMap[key]; }).sort(function (left, right) {
    return right.score - left.score || left.department.localeCompare(right.department);
  });
  var trend = Object.keys(weekMap).map(function (key) { return weekMap[key]; }).sort(function (left, right) { return left.week.localeCompare(right.week); });
  var overdueByRisk = ['High', 'Medium', 'Low', 'Very Low'].map(function (level) {
    return { riskLevel: level, count: rows.filter(function (row) { return row.overdueCap && row.riskLevel === level; }).length };
  });
  var high = rows.filter(function (row) { return row.riskLevel === 'High'; }).length;
  var medium = rows.filter(function (row) { return row.riskLevel === 'Medium'; }).length;
  var low = rows.filter(function (row) { return row.riskLevel === 'Low'; }).length;
  var veryLow = rows.filter(function (row) { return row.riskLevel === 'Very Low'; }).length;

  return {
    filters: { dateRange: dateRange, department: departmentFilter, inspection: inspectionFilter, risk: riskFilter },
    rows: rows,
    totalFindings: rows.length,
    high: high,
    medium: medium,
    low: low,
    veryLow: veryLow,
    overdueCaps: rows.filter(function (row) { return row.overdueCap; }).length,
    matrix: matrix,
    trend: trend,
    topRiskyAreas: departmentDistribution.slice(0, 5),
    departmentDistribution: departmentDistribution,
    overdueByRisk: overdueByRisk,
    recentHighRiskFindings: rows.filter(function (row) { return row.riskLevel === 'High'; }).slice().sort(function (left, right) {
      return (right.issuedDate || '').localeCompare(left.issuedDate || '') || left.id.localeCompare(right.id);
    }).slice(0, 6),
    availableDepartments: Array.from(new Set(findings.map(function (finding) {
      var audit = auditFor(finding.auditId);
      return finding.department || (audit && audit.domain) || 'Unassigned';
    }))).sort(),
    availableInspections: audits.map(function (audit) { return { id: audit.id, label: audit.ref || audit.type || audit.id }; }).sort(function (left, right) { return left.id.localeCompare(right.id); })
  };
}

function managerRiskCsvCell(value) {
  return '"' + String(value === null || value === undefined ? '' : value).replace(/"/g, '""') + '"';
}

function managerRiskCsv(projection) {
  var columns = ['Finding ID', 'Organization', 'Inspection', 'Department', 'Issued Date', 'Due Date', 'Status', 'Risk Level', 'Likelihood', 'Impact', 'Risk Score', 'Overdue CAP'];
  var rows = [columns].concat((projection && projection.rows ? projection.rows : []).map(function (row) {
    return [row.id, row.organization, row.inspectionId, row.department, row.issuedDate, row.dueDate, row.status, row.riskLevel, row.likelihood, row.impact, row.riskScore, row.overdueCap ? 'Yes' : 'No'];
  }));
  return '\uFEFF' + rows.map(function (row) { return row.map(managerRiskCsvCell).join(','); }).join('\r\n');
}

function generalManagerProjection(target) {
  var s = target || state;
  var risk = managerRiskProjection(s, { dateRange: 'all', department: 'all', inspection: 'all', risk: 'all' });
  var reports = typeof reportReadModels === 'function' ? reportReadModels(s) : (Array.isArray(s.managerReports) ? s.managerReports : []);
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var approvalRows = reports.filter(function (report) {
    return ['Preliminary Report', 'Final Report'].indexOf(report.reportType) !== -1 &&
      report.status === 'submitted_to_gm' && report.ownerRole === 'gm' && report.locked !== true;
  }).map(function (report) {
    var audit = audits.filter(function (candidate) { return candidate.id === report.auditId; })[0] || null;
    return {
      id: report.id,
      report: report,
      reportType: report.reportType,
      auditId: report.auditId,
      organization: report.organization,
      department: audit ? (audit.domain || 'Unassigned') : 'Unassigned',
      version: report.version,
      leadInspector: report.leadInspector,
      submittedAt: report.submittedAt,
      status: report.status,
      summary: report.summary,
      locked: !!report.locked
    };
  }).sort(function (left, right) { return (right.submittedAt || '').localeCompare(left.submittedAt || '') || left.id.localeCompare(right.id); });

  var departmentNames = Array.from(new Set(audits.map(function (audit) { return audit.domain || 'Unassigned'; }).concat(risk.departmentDistribution.map(function (row) { return row.department; })))).sort();
  var departments = departmentNames.map(function (department) {
    var distribution = risk.departmentDistribution.filter(function (row) { return row.department === department; })[0] || { high: 0, medium: 0, low: 0, veryLow: 0, total: 0, score: 0 };
    var departmentAudits = audits.filter(function (audit) { return (audit.domain || 'Unassigned') === department; });
    var departmentRows = risk.rows.filter(function (row) { return row.department === department; });
    return {
      department: department,
      audits: departmentAudits.length,
      activeAudits: departmentAudits.filter(function (audit) { return ['Scheduled', 'Planned', 'In Progress'].indexOf(audit.status) !== -1; }).length,
      totalFindings: distribution.total,
      high: distribution.high,
      medium: distribution.medium,
      low: distribution.low,
      veryLow: distribution.veryLow,
      overdueCaps: departmentRows.filter(function (row) { return row.overdueCap; }).length,
      exposureScore: distribution.score
    };
  }).sort(function (left, right) { return right.exposureScore - left.exposureScore || left.department.localeCompare(right.department); });

  return {
    pendingPreliminaryReports: approvalRows.filter(function (row) { return row.reportType === 'Preliminary Report'; }).length,
    pendingFinalReports: approvalRows.filter(function (row) { return row.reportType === 'Final Report'; }).length,
    highRiskFindings: risk.rows.filter(function (row) { return row.riskLevel === 'High' && !row.closed; }).length,
    reportsAwaitingApproval: approvalRows.length,
    overdueCaps: risk.overdueCaps,
    departments: departments,
    approvalRows: approvalRows,
    riskMatrix: risk.matrix,
    riskDistribution: { high: risk.high, medium: risk.medium, low: risk.low, veryLow: risk.veryLow, total: risk.totalFindings },
    recentHighRiskFindings: risk.recentHighRiskFindings,
    risk: risk
  };
}

function generalManagerDecisionResult(ok, message, report) {
  return { ok: ok, message: message, report: report || null };
}

function applyGeneralManagerReportDecision(target, reportId, decision, comment, actor) {
  var s = target || state;
  if (!actor || actor.role !== 'gm') {
    return generalManagerDecisionResult(false, 'Only the General Manager may record this intermediate review.', null);
  }
  var report = managerReportById(s, reportId);
  if (!report) return generalManagerDecisionResult(false, 'Report artifact not found.', null);
  if (['Preliminary Report', 'Final Report'].indexOf(report.reportType) === -1) {
    return generalManagerDecisionResult(false, 'Only Preliminary and Final Reports can receive General Manager review.', report);
  }
  if (report.status !== 'submitted_to_gm' || report.ownerRole !== 'gm' || report.locked === true) {
    return generalManagerDecisionResult(false, 'This ' + report.reportType + ' is not at the unlocked General Manager review stage.', report);
  }
  if (['approve', 'return'].indexOf(decision) === -1) return generalManagerDecisionResult(false, 'Choose approve or return.', report);
  var cleanComment = String(comment || '').trim();
  if (decision === 'return' && !cleanComment) return generalManagerDecisionResult(false, 'A General Manager comment is required to return the ' + report.reportType + '.', report);

  var actorName = actor.name || 'General Manager';
  var at = managerReportDecisionTimestamp();
  if (!Array.isArray(report.history)) report.history = [];
  if (decision === 'approve') {
    report.status = 'submitted_to_executive';
    report.ownerRole = 'executiveDirector';
    report.locked = false;
    report.issued = false;
    delete report.finalAuthorizedBy;
    delete report.finalAuthorizedAt;
    delete report.mockApprovalSignature;
    report.issuedAt = '';
    report.generalManagerDecision = 'approve';
    report.generalManagerComment = cleanComment;
    report.history.push({ at: at, actor: actorName, action: 'General Manager reviewed and forwarded ' + report.reportType + ' to Executive Director', comment: cleanComment });
  } else {
    report.status = 'pending_manager';
    report.ownerRole = 'manager';
    report.locked = false;
    report.generalManagerDecision = 'return';
    report.generalManagerComment = cleanComment;
    report.returnedAt = at;
    report.history.push({ at: at, actor: actorName, action: report.reportType + ' returned to Department Manager', comment: cleanComment });
  }

  if (!Array.isArray(s.auditLog)) s.auditLog = [];
  var logId = 'L' + (Number(s.logSeq) || (s.auditLog.length + 1));
  if (Number.isFinite(Number(s.logSeq))) s.logSeq += 1;
  s.auditLog.unshift({ id: logId, time: at, actor: actorName + ' (General Manager)', action: decision === 'approve' ? report.reportType + ' forwarded to Executive Director' : report.reportType + ' returned to Department Manager', target: report.id, system: false });

  if (!Array.isArray(s.notifications)) s.notifications = [];
  var notificationId = 'N' + (Number(s.notifSeq) || (s.notifications.length + 1));
  if (Number.isFinite(Number(s.notifSeq))) s.notifSeq += 1;
  s.notifications.unshift({
    id: notificationId,
    role: decision === 'approve' ? 'executiveDirector' : 'manager',
    icon: decision === 'approve' ? 'APR' : 'REV',
    text: decision === 'approve' ? report.id + ' (' + report.reportType + ') is ready for Executive Director approval.' : report.id + ' (' + report.reportType + ') was returned with a General Manager comment.',
    time: 'Just now',
    unread: true
  });
  return generalManagerDecisionResult(true, decision === 'approve' ? report.reportType + ' forwarded to Executive Director.' : report.reportType + ' returned to Department Manager.', report);
}

function executivePreliminaryReportProjection(target, filters) {
  var s = target || state;
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var status = opts.status || 'all';
  var reports = typeof reportReadModels === 'function' ? reportReadModels(s) : (Array.isArray(s.managerReports) ? s.managerReports : []);
  var rows = reports.filter(function (report) {
    if (report.reportType !== 'Preliminary Report' || ['submitted_to_executive', 'released_to_service_provider', 'rejected'].indexOf(report.status) === -1) return false;
    if (status !== 'all') {
      if (status === 'pending' && report.status !== 'submitted_to_executive') return false;
      if (status === 'issued' && report.status !== 'released_to_service_provider') return false;
      if (status === 'returned' && report.status !== 'rejected') return false;
      if (['pending', 'issued', 'returned'].indexOf(status) === -1 && report.status !== status) return false;
    }
    var haystack = [report.id, report.auditId, report.organization, report.status, report.leadInspector, report.summary].join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  }).sort(function (left, right) {
    return (right.submittedAt || '').localeCompare(left.submittedAt || '') || left.id.localeCompare(right.id);
  });
  return {
    rows: rows,
    pending: rows.filter(function (report) { return report.status === 'submitted_to_executive'; }).length,
    issued: rows.filter(function (report) { return report.status === 'released_to_service_provider'; }).length,
    returnedOrRejected: rows.filter(function (report) { return report.status === 'rejected'; }).length
  };
}

function applyExecutivePreliminaryReportDecision(target, reportId, input) {
  var s = target || state;
  input = input || {};
  if (!input.actor || input.actor.role !== 'executiveDirector') {
    return executiveReportDecisionResult(false, 'Only the Executive Director may issue or return a Preliminary Report.', null);
  }
  var report = managerReportById(s, reportId);
  if (!report) return executiveReportDecisionResult(false, 'Preliminary Report artifact not found.', null);
  if (report.reportType !== 'Preliminary Report') {
    return executiveReportDecisionResult(false, 'Only Preliminary Reports can receive this Executive Director decision.', report);
  }
  if (report.status !== 'submitted_to_executive' || report.ownerRole !== 'executiveDirector' || report.locked === true) {
    return executiveReportDecisionResult(false, 'This Preliminary Report is not eligible for an Executive Director decision.', report);
  }
  var decision = input.decision;
  if (['approve', 'return', 'reject'].indexOf(decision) === -1) {
    return executiveReportDecisionResult(false, 'Choose approve, return, or reject for the Preliminary Report.', report);
  }
  var rationale = String(input.rationale || input.comment || '').trim();
  if (decision !== 'approve' && !rationale) {
    return executiveReportDecisionResult(false, 'A rationale is required to return or reject the Preliminary Report.', report);
  }
  var actorName = input.actor.name || 'Executive Director';
  var at = managerReportDecisionTimestamp();
  if (!Array.isArray(report.history)) report.history = [];

  if (decision === 'approve') {
    report.status = 'released_to_service_provider';
    report.ownerRole = 'auditee';
    report.locked = true;
    report.releasedAt = at;
    report.sharedAt = at;
    report.authorizedBy = actorName;
    report.authorizedAt = at;
    report.sharedBy = actorName;
    report.executiveDirectorDecision = 'approve';
    report.mockApprovalSignature = {
      label: 'DEMO mock approval mark - not a real e-signature',
      signer: actorName,
      date: at
    };
    report.history.push({ at: at, actor: actorName, action: 'Executive Director approved and issued Preliminary Report to Service Provider', comment: rationale });
    if (report.preliminaryNotice) {
      report.preliminaryNotice.status = 'Issued to Service Provider';
      report.preliminaryNotice.releaseTrigger = 'Executive Director approval';
    }
  } else if (decision === 'return') {
    report.status = 'submitted_to_gm';
    report.ownerRole = 'gm';
    report.locked = false;
    report.returnedAt = at;
    report.executiveDirectorDecision = 'return';
    report.history.push({ at: at, actor: actorName, action: 'Executive Director returned Preliminary Report to General Manager', comment: rationale });
  } else {
    report.status = 'rejected';
    report.ownerRole = null;
    report.locked = false;
    report.rejectedAt = at;
    report.executiveDirectorDecision = 'reject';
    report.history.push({ at: at, actor: actorName, action: 'Executive Director rejected Preliminary Report', comment: rationale });
  }

  if (!Array.isArray(s.auditLog)) s.auditLog = [];
  var logId = 'L' + (Number(s.logSeq) || (s.auditLog.length + 1));
  if (Number.isFinite(Number(s.logSeq))) s.logSeq += 1;
  s.auditLog.unshift({
    id: logId,
    time: at,
    actor: actorName + ' (Executive Director)',
    action: report.history[report.history.length - 1].action,
    target: report.id,
    system: false
  });

  if (!Array.isArray(s.notifications)) s.notifications = [];
  if (decision === 'approve' || decision === 'return') {
    var notificationId = 'N' + (Number(s.notifSeq) || (s.notifications.length + 1));
    if (Number.isFinite(Number(s.notifSeq))) s.notifSeq += 1;
    s.notifications.unshift({
      id: notificationId,
      role: decision === 'approve' ? 'auditee' : 'gm',
      organizationId: decision === 'approve' ? report.organizationId : '',
      userId: '',
      icon: 'RPT',
      text: decision === 'approve'
        ? report.id + ' was issued to your Service Provider organization as a controlled demo copy.'
        : report.id + ' was returned to the General Manager for revision.',
      time: 'Just now',
      unread: true
    });
  }
  return executiveReportDecisionResult(true, 'Executive Director Preliminary Report decision recorded.', report);
}

function executiveFinalReportProjection(target, filters) {
  var s = target || state;
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var organization = opts.organization || 'all';
  var status = opts.status || 'all';
  var reports = typeof reportReadModels === 'function' ? reportReadModels(s) : (Array.isArray(s.managerReports) ? s.managerReports : []);
  var eligibleStatuses = ['submitted_to_executive', 'issued', 'returned_to_manager', 'rejected', 'enforcement_review_referred'];
  var rows = reports.filter(function (report) {
    if (report.reportType !== 'Final Report' || eligibleStatuses.indexOf(report.status) === -1) return false;
    if (organization !== 'all' && report.organizationId !== organization && report.organization !== organization) return false;
    if (status !== 'all') {
      if (status === 'pending' && report.status !== 'submitted_to_executive') return false;
      if (status === 'approved' && report.status !== 'issued') return false;
      if (status === 'returned' && ['returned_to_manager', 'rejected'].indexOf(report.status) === -1) return false;
      if (['pending', 'approved', 'returned'].indexOf(status) === -1 && report.status !== status) return false;
    }
    var haystack = [report.id, report.auditId, report.organization, report.reportType, report.status, report.leadInspector, report.summary].join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  }).sort(function (left, right) {
    return (right.submittedAt || '').localeCompare(left.submittedAt || '') || left.id.localeCompare(right.id);
  });
  return {
    rows: rows,
    total: rows.length,
    pending: rows.filter(function (report) { return report.status === 'submitted_to_executive'; }).length,
    approved: rows.filter(function (report) { return report.status === 'issued'; }).length,
    returnedOrRejected: rows.filter(function (report) { return ['returned_to_manager', 'rejected'].indexOf(report.status) !== -1; }).length
  };
}

function executiveReportDecisionResult(ok, message, report) {
  return { ok: ok, message: message, report: report || null };
}

function applyExecutiveFinalReportDecision(target, reportId, input) {
  var s = target || state;
  input = input || {};
  if (!input.actor || input.actor.role !== 'executiveDirector') {
    return executiveReportDecisionResult(false, 'Only the Executive Director may issue, mock-sign, or lock a Final Report.', null);
  }
  var report = managerReportById(s, reportId);
  if (!report) return executiveReportDecisionResult(false, 'Final Report artifact not found.', null);
  if (report.reportType !== 'Final Report') return executiveReportDecisionResult(false, 'Only Final Reports can receive an Executive Director decision.', report);
  if (report.status !== 'submitted_to_executive' || report.ownerRole !== 'executiveDirector' || report.locked === true) {
    return executiveReportDecisionResult(false, 'This Final Report is not eligible for an Executive Director decision.', report);
  }
  var decision = input.decision;
  if (['approve', 'enforcement_referral', 'reject', 'return'].indexOf(decision) === -1) {
    return executiveReportDecisionResult(false, 'Choose a supported Final Report decision.', report);
  }
  var rationale = String(input.rationale || input.comment || '').trim();
  var category = String(input.category || '').trim();
  if (decision === 'enforcement_referral' && !category) return executiveReportDecisionResult(false, 'An enforcement review category is required.', report);
  if (decision !== 'approve' && !rationale) return executiveReportDecisionResult(false, 'A rationale is required for this decision.', report);
  var actorName = input.actor && input.actor.name ? input.actor.name : 'Executive Director';
  var at = managerReportDecisionTimestamp();
  if (!Array.isArray(report.history)) report.history = [];

  if (decision === 'approve') {
    report.status = 'issued';
    report.ownerRole = 'auditee';
    report.issued = true;
    report.locked = true;
    report.issuedAt = at;
    report.releasedAt = at;
    report.finalAuthorizedBy = actorName;
    report.finalAuthorizedAt = at;
    report.mockApprovalSignature = { label: 'DEMO mock approval mark - not a real e-signature', signer: actorName, date: at };
    report.history.push({ at: at, actor: actorName, action: 'Executive Director approved and issued Final Report with demo approval mark', comment: rationale });
    var audit = Array.isArray(s.audits) ? s.audits.filter(function (candidate) { return candidate.id === report.auditId; })[0] : null;
    var openFindings = Array.isArray(s.findings) ? s.findings.filter(function (finding) { return finding.auditId === report.auditId && finding.status !== 'CLOSED'; }) : [];
    if (audit) audit.status = openFindings.length ? 'Follow-up Open' : 'Closed';
  } else if (decision === 'enforcement_referral') {
    report.status = 'enforcement_review_referred';
    report.ownerRole = 'authorizedEnforcementReview';
    report.enforcementReferral = {
      category: category,
      rationale: rationale,
      recommendationOnly: true,
      status: 'pending_authorized_review',
      referredBy: actorName,
      referredAt: at
    };
    report.history.push({ at: at, actor: actorName, action: 'Referred for separate enforcement review (recommendation only)', comment: category + ': ' + rationale });
  } else if (decision === 'return') {
    report.status = 'returned_to_manager';
    report.ownerRole = 'manager';
    report.returnedAt = at;
    report.history.push({ at: at, actor: actorName, action: 'Executive Director returned Final Report for revision', comment: rationale });
  } else {
    report.status = 'rejected';
    report.ownerRole = null;
    report.rejectedAt = at;
    report.history.push({ at: at, actor: actorName, action: 'Executive Director rejected Final Report', comment: rationale });
  }

  if (!Array.isArray(s.auditLog)) s.auditLog = [];
  s.auditLog.unshift({ id: 'L' + ((Number(s.logSeq) || s.auditLog.length) + 1), time: at, actor: actorName + ' (Executive Director)', action: report.history[report.history.length - 1].action, target: report.id, system: false });
  if (!Array.isArray(s.notifications)) s.notifications = [];
  s.notifications.unshift({
    id: 'N' + ((Number(s.notifSeq) || s.notifications.length) + 1),
    role: decision === 'approve' ? 'auditee' : (decision === 'return' ? 'manager' : 'executiveDirector'),
    organizationId: decision === 'approve' ? (report.organizationId || '') : '',
    userId: '',
    icon: 'RPT',
    text: report.id + ' decision recorded: ' + decision.replace(/_/g, ' ') + '.',
    time: 'Just now',
    unread: true
  });
  return executiveReportDecisionResult(true, 'Executive Director Final Report decision recorded.', report);
}

function managerChecklistTimestamp() {
  return managerReportDecisionTimestamp();
}

function managerChecklistHistory(item, actor, action) {
  if (!Array.isArray(item.history)) item.history = [];
  item.history.push({ at: managerChecklistTimestamp(), actor: actor || 'Department Manager', action: action });
}

function managerChecklistSlug(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'PACKAGE';
}

function managerChecklistUniqueId(items, prefix) {
  var next = items.length + 1;
  var id = prefix + String(next).padStart(3, '0');
  while (items.some(function (item) { return item.id === id; })) {
    next += 1;
    id = prefix + String(next).padStart(3, '0');
  }
  return id;
}

function managerChecklistPackageById(target, packageId) {
  var s = target || state;
  return (s.managedChecklists || []).filter(function (item) { return item.id === packageId; })[0] || null;
}

function ensureManagerChecklistPackageShape(target, item) {
  if (!item.owner) item.owner = 'Department Manager';
  if (!item.effectiveDate) item.effectiveDate = DEMO_TODAY;
  if (!item.status) item.status = item.publishedVersion ? 'Published' : 'Draft';
  if (!item.version) item.version = item.publishedVersion || '0.1';
  if (!Array.isArray(item.attachments)) item.attachments = [];
  if (!Array.isArray(item.history)) item.history = [];
  if (!Array.isArray(item.versions)) item.versions = [];
  if (!Array.isArray(item.draftQuestionIds)) item.draftQuestionIds = [];
  if (!Array.isArray(item.sections) || !item.sections.length) {
    var version = item.versions.filter(function (candidate) { return candidate.version === item.publishedVersion; })[0] || item.versions[0] || null;
    item.sections = [{
      id: item.id + '-SEC-GENERAL',
      name: 'General',
      order: 1,
      questionIds: version && Array.isArray(version.questionIds) ? version.questionIds.slice() : []
    }];
  }
  item.sections.forEach(function (section, index) {
    if (!section.id) section.id = item.id + '-SEC-' + String(index + 1).padStart(2, '0');
    if (!section.name) section.name = 'Section ' + (index + 1);
    section.order = index + 1;
    if (!Array.isArray(section.questionIds)) section.questionIds = [];
  });
  return item;
}

function managerChecklistPackages(target, filters) {
  var s = target || state;
  if (!Array.isArray(s.managedChecklists)) s.managedChecklists = [];
  var status = filters && filters.status ? filters.status : 'all';
  return s.managedChecklists.map(function (item) {
    return ensureManagerChecklistPackageShape(s, item);
  }).filter(function (item) {
    if (status === 'Active') return item.status !== 'Archived';
    if (status === 'Archived') return item.status === 'Archived';
    if (status === 'Draft') return item.status === 'Draft';
    if (status === 'Published') return item.status === 'Published';
    return true;
  });
}

function managerChecklistQuestionById(target, questionId) {
  var s = target || state;
  return (s.questionBank || []).filter(function (question) { return question.id === questionId; })[0] || null;
}

function managerChecklistEnsureDraft(item, actor) {
  if (item.status === 'Archived') return { ok: false, message: 'Archived packages cannot be edited.', package: item };
  if (item.status !== 'Draft') {
    var max = (item.versions || []).reduce(function (value, version) {
      return Math.max(value, Number.parseFloat(version.version) || 0);
    }, Number.parseFloat(item.version) || 0);
    item.version = (max + 0.1).toFixed(1);
    item.status = 'Draft';
    item.draftQuestionIds = [];
    managerChecklistHistory(item, actor, 'Draft version ' + item.version + ' created from published package');
  }
  return { ok: true, message: 'Draft ready.', package: item };
}

function createManagerChecklistPackage(target, name, department, actor) {
  var s = target || state;
  var cleanName = String(name || '').trim();
  if (!cleanName) return { ok: false, message: 'Package name is required.', package: null };
  if (managerChecklistPackages(s).some(function (item) { return item.name.toLowerCase() === cleanName.toLowerCase(); })) {
    return { ok: false, message: 'A package with this name already exists.', package: null };
  }
  var idBase = 'MGR-CL-' + managerChecklistSlug(cleanName);
  var id = idBase;
  var suffix = 2;
  while (managerChecklistPackageById(s, id)) { id = idBase + '-' + suffix; suffix += 1; }
  var item = {
    id: id,
    name: cleanName,
    department: String(department || 'Cabin Safety').trim() || 'Cabin Safety',
    inspectionType: 'Department Managed',
    owner: actor || 'Department Manager',
    effectiveDate: DEMO_TODAY,
    status: 'Draft',
    version: '0.1',
    publishedVersion: '',
    attachments: [],
    history: [],
    draftQuestionIds: [],
    sections: [{ id: id + '-SEC-01', name: 'General', order: 1, questionIds: [] }],
    versions: []
  };
  managerChecklistHistory(item, actor, 'Checklist package created');
  s.managedChecklists.push(item);
  return { ok: true, message: 'Checklist package created.', package: item };
}

function duplicateManagerChecklistPackage(target, packageId, actor) {
  var s = target || state;
  var source = managerChecklistPackageById(s, packageId);
  if (!source) return { ok: false, message: 'Checklist package not found.', package: null };
  ensureManagerChecklistPackageShape(s, source);
  var name = source.name + ' Copy';
  var suffix = 2;
  while (managerChecklistPackages(s).some(function (item) { return item.name.toLowerCase() === name.toLowerCase(); })) {
    name = source.name + ' Copy ' + suffix;
    suffix += 1;
  }
  var created = createManagerChecklistPackage(s, name, source.department, actor);
  if (!created.ok) return created;
  var item = created.package;
  item.inspectionType = source.inspectionType;
  item.version = source.version || source.publishedVersion || '1.0';
  item.sections = deepClone(source.sections).map(function (section, index) {
    return {
      id: item.id + '-SEC-' + String(index + 1).padStart(2, '0'),
      name: section.name,
      order: index + 1,
      questionIds: (section.questionIds || []).slice()
    };
  });
  item.attachments = (source.attachments || []).slice();
  managerChecklistHistory(item, actor, 'Package duplicated from ' + source.id);
  return { ok: true, message: 'Checklist package duplicated.', package: item };
}

function archiveManagerChecklistPackage(target, packageId, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null };
  item.status = 'Archived';
  managerChecklistHistory(item, actor, 'Checklist package archived');
  return { ok: true, message: 'Checklist package archived.', package: item };
}

function publishManagerChecklistVersion(target, packageId, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null, version: null };
  ensureManagerChecklistPackageShape(target, item);
  if (item.status === 'Archived') return { ok: false, message: 'Archived packages cannot be published.', package: item, version: null };
  var max = item.versions.reduce(function (value, version) {
    return Math.max(value, Number.parseFloat(version.version) || 0);
  }, Number.parseFloat(item.version) || 0);
  var versionNumber = item.status === 'Draft' && item.version && Number.parseFloat(item.version) > max
    ? item.version
    : (max + 0.1).toFixed(1);
  item.versions.forEach(function (version) {
    if (version.status === 'published_active') version.status = 'archived';
  });
  var version = {
    id: item.id + '-v' + versionNumber,
    version: versionNumber,
    status: 'published_active',
    approvalType: 'checklist',
    createdBy: actor || 'Department Manager',
    createdDate: DEMO_TODAY,
    changeReason: 'Published from the Department Manager browser-local checklist workspace.',
    questionIds: item.sections.reduce(function (ids, section) { return ids.concat(section.questionIds || []); }, []),
    sections: deepClone(item.sections),
    approval: { chain: [], currentIndex: 0, outcome: 'approved', returnPolicy: 'configured_role', history: [{ actor: actor || 'Department Manager', role: 'manager', action: 'published', date: managerChecklistTimestamp(), comment: 'Demo version published.' }] }
  };
  item.versions.push(version);
  item.version = versionNumber;
  item.publishedVersion = versionNumber;
  item.status = 'Published';
  item.effectiveDate = DEMO_TODAY;
  item.draftQuestionIds = [];
  managerChecklistHistory(item, actor, 'Version ' + versionNumber + ' published');
  return { ok: true, message: 'Checklist version published.', package: item, version: version };
}

function addManagerChecklistSection(target, packageId, name, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null, section: null };
  ensureManagerChecklistPackageShape(target, item);
  var cleanName = String(name || '').trim();
  if (!cleanName) return { ok: false, message: 'Section name is required.', package: item, section: null };
  if (item.sections.some(function (section) { return section.name.toLowerCase() === cleanName.toLowerCase(); })) {
    return { ok: false, message: 'A section with this name already exists.', package: item, section: null };
  }
  var draft = managerChecklistEnsureDraft(item, actor);
  if (!draft.ok) return { ok: false, message: draft.message, package: item, section: null };
  var section = { id: managerChecklistUniqueId(item.sections, item.id + '-SEC-'), name: cleanName, order: item.sections.length + 1, questionIds: [] };
  item.sections.push(section);
  managerChecklistHistory(item, actor, 'Section added: ' + cleanName);
  return { ok: true, message: 'Checklist section added.', package: item, section: section };
}

function removeManagerChecklistSection(target, packageId, sectionId, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null };
  ensureManagerChecklistPackageShape(target, item);
  if (item.sections.length <= 1) return { ok: false, message: 'The last section cannot be removed.', package: item };
  var section = item.sections.filter(function (candidate) { return candidate.id === sectionId; })[0] || null;
  if (!section) return { ok: false, message: 'Checklist section not found.', package: item };
  var draft = managerChecklistEnsureDraft(item, actor);
  if (!draft.ok) return draft;
  item.sections = item.sections.filter(function (candidate) { return candidate.id !== sectionId; });
  item.sections.forEach(function (candidate, index) { candidate.order = index + 1; });
  managerChecklistHistory(item, actor, 'Section removed: ' + section.name);
  return { ok: true, message: 'Checklist section removed.', package: item };
}

function moveManagerChecklistSection(target, packageId, sectionId, direction, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null };
  ensureManagerChecklistPackageShape(target, item);
  var index = item.sections.findIndex(function (section) { return section.id === sectionId; });
  if (index < 0) return { ok: false, message: 'Checklist section not found.', package: item };
  var next = direction === 'up' ? index - 1 : index + 1;
  if (next < 0 || next >= item.sections.length) return { ok: false, message: 'Section is already at that boundary.', package: item };
  var draft = managerChecklistEnsureDraft(item, actor);
  if (!draft.ok) return draft;
  var swap = item.sections[next];
  item.sections[next] = item.sections[index];
  item.sections[index] = swap;
  item.sections.forEach(function (section, order) { section.order = order + 1; });
  managerChecklistHistory(item, actor, 'Section reordered: ' + sectionId + ' ' + direction);
  return { ok: true, message: 'Checklist section reordered.', package: item };
}

function managerChecklistRisk(likelihood, impact) {
  var likelihoodScores = { Rare: 1, Unlikely: 2, Possible: 3, Likely: 4, 'Almost Certain': 5 };
  var impactScores = { Insignificant: 1, Minor: 2, Moderate: 3, Major: 4, Catastrophic: 5 };
  var score = (likelihoodScores[likelihood] || 1) * (impactScores[impact] || 1);
  return { score: score, level: score >= 15 ? 'Critical' : (score >= 10 ? 'High' : (score >= 5 ? 'Medium' : 'Low')) };
}

function saveManagerChecklistQuestion(target, packageId, sectionId, payload, actor) {
  var s = target || state;
  var item = managerChecklistPackageById(s, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null, question: null };
  ensureManagerChecklistPackageShape(s, item);
  var section = item.sections.filter(function (candidate) { return candidate.id === sectionId; })[0] || null;
  if (!section) return { ok: false, message: 'Checklist section not found.', package: item, question: null };
  var cleanText = String(payload && payload.text || '').trim();
  var cleanReference = String(payload && payload.reference || '').trim();
  if (!cleanText || !cleanReference) return { ok: false, message: 'Question text and configured reference are required.', package: item, question: null };
  var draft = managerChecklistEnsureDraft(item, actor);
  if (!draft.ok) return { ok: false, message: draft.message, package: item, question: null };
  var question = payload.id ? managerChecklistQuestionById(s, payload.id) : null;
  if (question && item.draftQuestionIds.indexOf(question.id) === -1) {
    var draftId = managerChecklistUniqueId(s.questionBank || [], 'MGR-Q-');
    var questionIndex = section.questionIds.indexOf(question.id);
    question = Object.assign({}, deepClone(question), { id: draftId });
    s.questionBank.push(question);
    item.draftQuestionIds.push(draftId);
    if (questionIndex >= 0) section.questionIds[questionIndex] = draftId;
  }
  if (!question) {
    question = { id: managerChecklistUniqueId(s.questionBank || [], 'MGR-Q-') };
    if (!Array.isArray(s.questionBank)) s.questionBank = [];
    s.questionBank.push(question);
    item.draftQuestionIds.push(question.id);
    section.questionIds.push(question.id);
  }
  var risk = managerChecklistRisk(payload.likelihood, payload.impact);
  Object.assign(question, {
    title: cleanText.length > 64 ? cleanText.slice(0, 61) + '...' : cleanText,
    text: cleanText,
    reference: cleanReference,
    regulationRef: cleanReference,
    guidance: String(payload.guidance || '').trim(),
    inspectorGuidance: String(payload.guidance || '').trim(),
    evidenceMethods: Array.isArray(payload.evidenceMethods) ? payload.evidenceMethods.slice() : [],
    likelihood: payload.likelihood || 'Rare',
    impact: payload.impact || 'Insignificant',
    riskScore: risk.score,
    riskLevel: risk.level,
    findingTypes: Array.isArray(payload.findingTypes) ? payload.findingTypes.slice() : [],
    mandatory: !!payload.mandatory,
    critical: !!payload.critical,
    status: payload.status || 'Active',
    department: item.department
  });
  managerChecklistHistory(item, actor, 'Question saved: ' + question.id);
  return { ok: true, message: 'Checklist question saved.', package: item, question: question };
}

function duplicateManagerChecklistQuestion(target, packageId, sectionId, questionId, actor) {
  var s = target || state;
  var source = managerChecklistQuestionById(s, questionId);
  if (!source) return { ok: false, message: 'Checklist question not found.', question: null };
  var result = saveManagerChecklistQuestion(s, packageId, sectionId, {
    text: source.text + ' (Copy)', reference: source.reference || source.regulationRef,
    guidance: source.guidance || source.inspectorGuidance,
    evidenceMethods: source.evidenceMethods || [], likelihood: source.likelihood,
    impact: source.impact, findingTypes: source.findingTypes || [], mandatory: source.mandatory,
    critical: source.critical, status: source.status
  }, actor);
  if (result.ok) managerChecklistHistory(result.package, actor, 'Question duplicated from ' + questionId + ': ' + result.question.id);
  return result;
}

function removeManagerChecklistQuestion(target, packageId, sectionId, questionId, actor) {
  var item = managerChecklistPackageById(target, packageId);
  if (!item) return { ok: false, message: 'Checklist package not found.', package: null };
  ensureManagerChecklistPackageShape(target, item);
  var section = item.sections.filter(function (candidate) { return candidate.id === sectionId; })[0] || null;
  if (!section || section.questionIds.indexOf(questionId) === -1) return { ok: false, message: 'Checklist question not found in this section.', package: item };
  var draft = managerChecklistEnsureDraft(item, actor);
  if (!draft.ok) return draft;
  section.questionIds = section.questionIds.filter(function (id) { return id !== questionId; });
  managerChecklistHistory(item, actor, 'Question removed: ' + questionId);
  return { ok: true, message: 'Checklist question removed.', package: item };
}

function managerTeamByAuditId(target, auditId) {
  var s = ensureManagerWorkspaceState(target);
  return s.inspectionTeams.filter(function (team) { return team.auditId === auditId; })[0] || null;
}

function managerScopedTeamUsers(target) {
  var s = ensureManagerWorkspaceState(target);
  return s.users.filter(function (user) { return user.reportsToRole === 'manager'; });
}

function managerTeamRows(target, filters) {
  var s = ensureManagerWorkspaceState(target);
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var department = opts.department || 'all';
  var status = opts.status || 'all';
  var dateRange = opts.dateRange || 'all';
  var scopedUsers = managerScopedTeamUsers(s);
  var scopedById = {};
  scopedUsers.forEach(function (user) { scopedById[user.id] = user; });

  function findAudit(auditId) {
    return (s.audits || []).filter(function (audit) { return audit.id === auditId; })[0] || null;
  }

  function findOrganization(orgId) {
    return (s.orgs || []).filter(function (organization) { return organization.id === orgId; })[0] || null;
  }

  function normalized(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '-');
  }

  function matchesStatus(row) {
    if (status === 'all') return true;
    if (status === 'active') return row.status === 'In Progress';
    if (status === 'upcoming') return row.status === 'Scheduled' || row.status === 'Planned';
    if (status === 'completed') return row.status === 'Completed' || row.status === 'Closed' || row.status === 'Report Issued';
    return normalized(row.status) === normalized(status);
  }

  function matchesDate(row) {
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return row.startDate <= DEMO_TODAY && row.endDate >= DEMO_TODAY;
    if (dateRange === 'upcoming') return row.startDate > DEMO_TODAY;
    if (dateRange === 'past') return row.endDate < DEMO_TODAY;
    return true;
  }

  return s.inspectionTeams.map(function (team) {
    var audit = findAudit(team.auditId);
    var organization = audit ? findOrganization(audit.orgId) : null;
    var members = (team.memberIds || []).map(function (userId) { return scopedById[userId] || null; }).filter(Boolean);
    var lead = scopedById[team.leadUserId] || null;
    return {
      id: team.id,
      auditId: team.auditId,
      audit: audit,
      team: team,
      organizationId: audit ? audit.orgId : '',
      organization: organization ? organization.name : '—',
      reference: audit ? (audit.ref || audit.type || audit.id) : team.auditId,
      auditType: audit ? (audit.type || audit.ref || 'Audit / Inspection') : 'Audit / Inspection',
      department: team.department || (audit && audit.domain) || '—',
      status: team.status || (audit && audit.status) || '—',
      startDate: team.startDate || (audit && audit.date) || '',
      endDate: team.endDate || team.startDate || (audit && audit.date) || '',
      lead: lead,
      members: members,
      memberCount: members.length,
      notes: team.notes || '',
      attachments: Array.isArray(team.attachments) ? team.attachments.slice() : [],
      messages: Array.isArray(team.messages) ? team.messages.slice() : [],
      history: Array.isArray(team.history) ? team.history.slice() : []
    };
  }).filter(function (row) {
    if (!row.members.length || !row.lead) return false;
    if (department !== 'all' && row.department !== department) return false;
    if (!matchesStatus(row) || !matchesDate(row)) return false;
    var haystack = [
      row.auditId, row.organization, row.reference, row.auditType, row.department,
      row.status, row.lead.name, row.startDate, row.endDate
    ].concat(row.members.map(function (member) { return member.name; })).join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  }).sort(function (left, right) {
    return (left.startDate || '').localeCompare(right.startDate || '') || left.auditId.localeCompare(right.auditId);
  });
}

function teamMutationResult(ok, message, team) {
  return { ok: ok, message: message, team: team || null };
}

function managerTeamMutationTimestamp() {
  if (typeof logTimestamp === 'function') return logTimestamp();
  return (typeof DEMO_TODAY === 'string' ? DEMO_TODAY : '2026-06-15') + ' 00:00';
}

function managerTeamActor() {
  return typeof ROLES !== 'undefined' && ROLES.manager ? ROLES.manager.user : 'Department Manager';
}

function managerTeamAppendHistory(team, action) {
  if (!Array.isArray(team.history)) team.history = [];
  team.history.push({ at: managerTeamMutationTimestamp(), actor: managerTeamActor(), action: action });
}

function syncManagerTeamAudit(target, team) {
  var audit = (target.audits || []).filter(function (candidate) { return candidate.id === team.auditId; })[0] || null;
  if (!audit) return;
  var users = target.users || [];
  var members = team.memberIds.map(function (userId) {
    return users.filter(function (user) { return user.id === userId; })[0] || null;
  }).filter(Boolean);
  var lead = users.filter(function (user) { return user.id === team.leadUserId; })[0] || null;
  audit.team = members.map(function (member) { return member.name; });
  if (lead) audit.lead = lead.name;
}

function addManagerTeamMember(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  if (!user || user.reportsToRole !== 'manager') {
    return teamMutationResult(false, 'Only inspectors in this Department Manager reporting line can be added.', team);
  }
  if (!Array.isArray(team.memberIds)) team.memberIds = [];
  if (team.memberIds.indexOf(userId) !== -1) {
    return teamMutationResult(false, user.name + ' is already a member of this inspection team.', team);
  }
  team.memberIds.push(userId);
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Inspector added: ' + user.name);
  return teamMutationResult(true, user.name + ' was added to the inspection team.', team);
}

function removeManagerTeamMember(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  if (team.leadUserId === userId) {
    return teamMutationResult(false, 'Choose another Lead Inspector before removing the current lead.', team);
  }
  if (!Array.isArray(team.memberIds) || team.memberIds.indexOf(userId) === -1) {
    return teamMutationResult(false, 'That inspector is not a member of this inspection team.', team);
  }
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  team.memberIds = team.memberIds.filter(function (memberId) { return memberId !== userId; });
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Inspector removed: ' + (user ? user.name : userId));
  return teamMutationResult(true, (user ? user.name : 'Inspector') + ' was removed from the inspection team.', team);
}

function changeManagerTeamLead(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  if (!user || user.reportsToRole !== 'manager' || !Array.isArray(team.memberIds) || team.memberIds.indexOf(userId) === -1) {
    return teamMutationResult(false, 'The new Lead Inspector must already be a member of this inspection team.', team);
  }
  if (team.leadUserId === userId) {
    return teamMutationResult(false, user.name + ' is already the Lead Inspector.', team);
  }
  team.leadUserId = userId;
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Lead Inspector changed to ' + user.name);
  return teamMutationResult(true, user.name + ' is now the Lead Inspector.', team);
}

function updateManagerTeamSchedule(target, auditId, startDate, endDate) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  if (!startDate || !endDate) return teamMutationResult(false, 'Start date and end date are required.', team);
  if (endDate < startDate) return teamMutationResult(false, 'End date cannot be before the start date.', team);
  if (team.startDate === startDate && team.endDate === endDate) {
    return teamMutationResult(false, 'The inspection team already uses this schedule.', team);
  }
  team.startDate = startDate;
  team.endDate = endDate;
  var audit = (s.audits || []).filter(function (candidate) { return candidate.id === auditId; })[0] || null;
  if (audit) audit.date = startDate;
  managerTeamAppendHistory(team, 'Schedule updated: ' + startDate + ' to ' + endDate);
  return teamMutationResult(true, 'Inspection team schedule updated.', team);
}

function recordManagerTeamMessage(target, auditId, body) {
  var team = managerTeamByAuditId(target, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var clean = String(body || '').trim();
  if (!clean) return teamMutationResult(false, 'Message body is required.', team);
  if (!Array.isArray(team.messages)) team.messages = [];
  var at = managerTeamMutationTimestamp();
  team.messages.push({
    id: 'TEAM-MSG-' + (team.messages.length + 1),
    at: at,
    author: managerTeamActor(),
    body: clean
  });
  managerTeamAppendHistory(team, 'Message sent to inspection team: ' + clean);
  return teamMutationResult(true, 'Message recorded in the inspection team workspace.', team);
}

function pdfSafeText(text) {
  return String(text || '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfEscape(text) {
  return pdfSafeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function pdfWrap(text, maxChars) {
  var clean = pdfSafeText(text);
  if (!clean) return [''];
  return clean.split(' ').reduce(function (lines, word) {
    var current = lines[lines.length - 1] || '';
    var candidate = current ? current + ' ' + word : word;
    if (candidate.length > maxChars && current) lines.push(word);
    else lines[lines.length - 1] = candidate;
    return lines;
  }, ['']);
}

function buildAviaPdfDocument(lines) {
  var printable = [];
  (lines && lines.length ? lines : ['AviaSurveil360 Demo Report']).forEach(function (line) {
    pdfWrap(line, 96).forEach(function (wrapped) { printable.push(wrapped); });
  });
  var pages = [];
  while (printable.length) pages.push(printable.splice(0, 43));
  var objects = ['<< /Type /Catalog /Pages 2 0 R >>', ''];
  var fontObject = objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  var pageReferences = [];
  pages.forEach(function (pageLines, pageIndex) {
    var y = 792;
    var content = pageLines.map(function (line, lineIndex) {
      if (!line) { y -= 8; return ''; }
      var size = pageIndex === 0 && lineIndex === 0 ? 18 : 10;
      var command = 'BT /F1 ' + size + ' Tf 54 ' + y + ' Td (' + pdfEscape(line) + ') Tj ET\n';
      y -= pageIndex === 0 && lineIndex === 0 ? 24 : 14;
      return command;
    }).join('');
    var contentObject = objects.push('<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream');
    var pageObject = objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ' + fontObject + ' 0 R >> >> /Contents ' + contentObject + ' 0 R >>');
    pageReferences.push(pageObject + ' 0 R');
  });
  objects[1] = '<< /Type /Pages /Kids [' + pageReferences.join(' ') + '] /Count ' + pageReferences.length + ' >>';
  var pdf = '%PDF-1.4\n';
  var offsets = [0];
  objects.forEach(function (body, index) {
    offsets[index + 1] = pdf.length;
    pdf += (index + 1) + ' 0 obj\n' + body + '\nendobj\n';
  });
  var xref = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (var i = 1; i <= objects.length; i += 1) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  return pdf + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
}

function downloadAviaPdf(filename, lines, env) {
  var runtime = env || { Blob: Blob, URL: URL, document: document };
  var pdf = buildAviaPdfDocument(lines);
  var blob = new runtime.Blob([pdf], { type: 'application/pdf' });
  var url = runtime.URL.createObjectURL(blob);
  var link = runtime.document.createElement('a');
  link.href = url;
  link.download = filename;
  runtime.document.body.appendChild(link);
  link.click();
  runtime.document.body.removeChild(link);
  runtime.URL.revokeObjectURL(url);
  return { ok: true, filename: filename, mime: 'application/pdf' };
}
