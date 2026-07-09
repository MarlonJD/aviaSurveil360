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

function managerReportById(target, reportId) {
  var s = ensureManagerWorkspaceState(target);
  return s.managerReports.filter(function (report) { return report.id === reportId; })[0] || null;
}
