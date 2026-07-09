/* ==========================================================================
   AviaSurveil360 — Department Manager workspace state helpers (DEMO ONLY)
   ========================================================================== */

function ensureManagerWorkspaceState(target) {
  var s = target || state;
  if (!Array.isArray(s.users)) s.users = deepClone(SEED_USERS);
  if (!Array.isArray(s.inspectionTeams)) s.inspectionTeams = deepClone(SEED_INSPECTION_TEAMS);
  if (!Array.isArray(s.managerReports)) s.managerReports = deepClone(SEED_MANAGER_REPORTS);
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
  return s.managerReports.filter(function (report) { return report.id === reportId; })[0] || null;
}
