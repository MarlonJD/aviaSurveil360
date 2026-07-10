/* ==========================================================================
   AviaSurveil360 — Report approval helpers (DEMO ONLY)
   Mock report generation/signature; no real PDF, Word, e-signature, or storage.
   ========================================================================== */

function auditReportById(id, targetState) {
  var target = targetState || state;
  if (!target || !Array.isArray(target.auditReports)) return null;
  for (var i = 0; i < target.auditReports.length; i++) {
    if (target.auditReports[i].id === id) return target.auditReports[i];
  }
  return null;
}

function normalizeReportType(value) {
  var text = String(value || '').toLowerCase();
  if (text.indexOf('final') !== -1) return 'Final Report';
  if (text.indexOf('preliminary') !== -1) return 'Preliminary Report';
  return String(value || '');
}

function reportArtifactById(reportId, targetState) {
  var target = targetState || state;
  var direct = auditReportById(reportId, target);
  if (direct) return direct;
  var projections = target && Array.isArray(target.managerReports) ? target.managerReports : [];
  var projection = projections.filter(function (report) { return report.id === reportId; })[0] || null;
  if (!projection || !projection.approvalPackageId) return null;
  return auditReportById(projection.approvalPackageId, target);
}

function reportForAuditAndType(auditId, reportType, targetState) {
  var target = targetState || state;
  if (!target) return null;
  var normalizedType = normalizeReportType(reportType);
  var projections = Array.isArray(target.managerReports) ? target.managerReports : [];
  var projection = projections.filter(function (report) {
    return report.auditId === auditId && normalizeReportType(report.reportType) === normalizedType && !!report.approvalPackageId;
  })[0] || null;
  if (projection) return reportArtifactById(projection.id, target);
  var artifacts = Array.isArray(target.auditReports) ? target.auditReports : [];
  return artifacts.filter(function (report) {
    return report.auditId === auditId && normalizeReportType(report.reportType) === normalizedType;
  })[0] || null;
}

function reportForAudit(auditId) {
  var preliminary = reportForAuditAndType(auditId, 'Preliminary Report', state);
  if (preliminary) return preliminary;
  if (!state || !Array.isArray(state.auditReports)) return null;
  for (var i = 0; i < state.auditReports.length; i++) {
    if (state.auditReports[i].auditId === auditId) return state.auditReports[i];
  }
  return null;
}

function reportOpenFollowUpFindings(targetState, auditId) {
  var target = targetState || state;
  var findings = target && Array.isArray(target.findings) ? target.findings : [];
  return findings.filter(function (finding) {
    return finding.auditId === auditId && finding.status !== 'CLOSED';
  });
}

function reportProjectionForArtifact(targetState, report) {
  var target = targetState || state;
  var projections = target && Array.isArray(target.managerReports) ? target.managerReports : [];
  return projections.filter(function (item) {
    return item.approvalPackageId === report.id && normalizeReportType(item.reportType) === 'Final Report';
  })[0] || null;
}

function serviceProviderVisibleFindings(targetState, organizationId) {
  var target = targetState || state;
  var findings = target && Array.isArray(target.findings) ? target.findings : [];
  return findings.filter(function (finding) {
    return finding.orgId === organizationId;
  });
}

function serviceProviderCapProgress(finding) {
  var status = finding && finding.status;
  var progress = {
    WAITING_CAP: { label: 'Waiting for CAP', percent: 10 },
    CAP_MORE_INFO: { label: 'CAP revision required', percent: 20 },
    CAP_SUBMITTED: { label: 'CAP Submitted', percent: 35 },
    EVIDENCE_REQUIRED: { label: 'CAP Accepted / Evidence Required', percent: 55 },
    EVIDENCE_MORE_INFO: { label: 'More Evidence Required', percent: 65 },
    EVIDENCE_SUBMITTED: { label: 'Evidence Submitted / CAA Review', percent: 80 },
    CLOSED: { label: 'Closed', percent: 100 }
  };
  return progress[status] || { label: 'Open', percent: 0 };
}

function serviceProviderCapRows(targetState, organizationId, filters) {
  var target = targetState || state;
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var rows = serviceProviderVisibleFindings(target, organizationId).map(function (finding) {
    var audit = target.audits && target.audits.filter(function (candidate) { return candidate.id === finding.auditId; })[0];
    var meta = typeof FINDING_STATUS !== 'undefined' ? FINDING_STATUS[finding.status] : null;
    var progress = serviceProviderCapProgress(finding);
    return {
      id: finding.id,
      finding: finding,
      auditId: finding.auditId,
      audit: audit ? (audit.ref || audit.type || audit.id) : finding.auditId,
      title: finding.title,
      level: typeof severityLabel === 'function' ? severityLabel(finding.severity) : String(finding.severity),
      severity: finding.severity,
      status: meta ? meta.label : String(finding.status || 'Open'),
      statusKey: finding.status,
      dueDate: finding.dueDate || 'Not configured',
      progress: progress.label,
      progressPercent: progress.percent,
      nextAction: meta ? meta.next : 'Review Finding',
      currentOwnerRole: meta ? meta.ownerRole : null
    };
  });
  return rows.filter(function (row) {
    if (opts.auditId && opts.auditId !== 'all' && row.auditId !== opts.auditId) return false;
    if (opts.level && opts.level !== 'all' && String(row.severity) !== String(opts.level)) return false;
    if (opts.status && opts.status !== 'all' && row.statusKey !== opts.status) return false;
    if (opts.group === 'open' && row.statusKey === 'CLOSED') return false;
    if (opts.group === 'closed' && row.statusKey !== 'CLOSED') return false;
    if (opts.group === 'in-progress' && ['CAP_SUBMITTED', 'EVIDENCE_REQUIRED', 'EVIDENCE_SUBMITTED', 'CAP_MORE_INFO', 'EVIDENCE_MORE_INFO'].indexOf(row.statusKey) === -1) return false;
    if (opts.group === 'awaiting-review' && ['CAP_SUBMITTED', 'EVIDENCE_SUBMITTED'].indexOf(row.statusKey) === -1) return false;
    var haystack = [row.id, row.auditId, row.audit, row.title, row.level, row.status, row.dueDate, row.nextAction].join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  });
}

function serviceProviderVisibleReports(targetState, organizationId, reportType) {
  var target = targetState || state;
  var type = normalizeReportType(reportType);
  var reports = target && Array.isArray(target.managerReports) ? target.managerReports : [];
  return reports.filter(function (report) {
    if (report.organizationId !== organizationId || normalizeReportType(report.reportType) !== type) return false;
    if (type === 'Preliminary Report') {
      return report.status === 'released_to_service_provider' || report.status === 'closed' || !!report.sharedAt;
    }
    if (type === 'Final Report') {
      return report.status === 'issued' && report.issued === true && report.locked === true;
    }
    return false;
  }).sort(function (left, right) {
    var leftDate = left.issuedAt || left.releasedAt || left.sharedAt || left.submittedAt || '';
    var rightDate = right.issuedAt || right.releasedAt || right.sharedAt || right.submittedAt || '';
    return rightDate.localeCompare(leftDate) || left.id.localeCompare(right.id);
  });
}

function serviceProviderRequiredAction(report, linkedFindings) {
  var findings = Array.isArray(linkedFindings) ? linkedFindings : [];
  if (!report) return 'No action';
  if (normalizeReportType(report.reportType) === 'Preliminary Report') {
    if (report.status === 'closed') return 'No action - Preliminary Report closed';
    return findings.some(function (finding) { return finding.status !== 'CLOSED'; }) ? 'Respond to CAP and Evidence requests' : 'View Report';
  }
  return findings.some(function (finding) { return finding.status !== 'CLOSED'; }) ? 'Continue Corrective Actions (CAP)' : 'View Report';
}

function finalizeApprovedReport(report, actor) {
  if (!report || !report.approval || report.approval.outcome !== 'approved') return report;
  var audit = auditById(report.auditId);
  var at = typeof approvalDecisionDate === 'function' ? approvalDecisionDate() : DEMO_TODAY + ' 00:00';
  var signer = actor && actor.name ? actor.name : currentActorLabel();
  report.status = 'final_report_generated';
  report.finalLocked = true;
  report.locked = true;
  report.issued = true;
  report.reportNumber = report.reportNumber || 'FINAL-' + report.auditId + '-2026';
  report.approvalDate = at;
  report.issuedAt = at;
  report.approvedBy = signer;
  report.finalAuthorizedBy = signer;
  report.finalAuthorizedAt = at;
  report.mockDigitalSignature = {
    label: 'DEMO mock digital signature - not a real e-signature',
    signer: report.approvedBy,
    date: at
  };
  var projection = reportProjectionForArtifact(state, report);
  if (projection) {
    projection.status = 'issued';
    projection.ownerRole = 'auditee';
    projection.issued = true;
    projection.locked = true;
    projection.issuedAt = at;
    projection.releasedAt = at;
    projection.finalAuthorizedBy = signer;
    projection.finalAuthorizedAt = at;
    projection.mockApprovalSignature = deepClone(report.mockDigitalSignature);
  }
  if (audit) audit.status = reportOpenFollowUpFindings(state, report.auditId).length ? 'Follow-up Open' : 'Closed';
  return report;
}

function applyReportApprovalDecision(report, input) {
  input = input || {};
  if (input.enforcementRecommendation && input.actor && input.actor.role === 'manager') {
    report.enforcementRecommendation = {
      type: input.enforcementRecommendation.type || 'Warning',
      reason: input.enforcementRecommendation.reason || 'Recommendation only; requires separate authorized human decision.',
      recommendationOnly: true
    };
  }
  applyApprovalDecision(report, input);
  if (report.approval.outcome === 'approved') finalizeApprovedReport(report, input.actor);
  return report;
}
