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
  return auditReportById(reportId, target);
}

function reportProjectionById(reportId, targetState) {
  var target = targetState || state;
  var projections = target && Array.isArray(target.managerReports) ? target.managerReports : [];
  return projections.filter(function (report) { return report.id === reportId; })[0] || null;
}

function reportReadModelById(reportId, targetState) {
  var target = targetState || state;
  var artifact = reportArtifactById(reportId, target);
  var projection = reportProjectionById(reportId, target);
  if (!artifact) return projection ? Object.assign({}, projection) : null;
  return Object.assign({}, projection || {}, artifact, {
    id: artifact.id,
    approvalPackageId: artifact.id,
    reportType: normalizeReportType(artifact.reportType)
  });
}

function reportReadModels(targetState) {
  var target = targetState || state;
  var projections = target && Array.isArray(target.managerReports) ? target.managerReports : [];
  return projections.map(function (projection) {
    return reportReadModelById(projection.id, target);
  }).filter(Boolean);
}

function reportForAuditAndType(auditId, reportType, targetState) {
  var target = targetState || state;
  if (!target) return null;
  var normalizedType = normalizeReportType(reportType);
  var artifacts = Array.isArray(target.auditReports) ? target.auditReports : [];
  var matches = artifacts.filter(function (report) {
    return report.auditId === auditId && normalizeReportType(report.reportType) === normalizedType;
  });
  return matches.length === 1 ? matches[0] : null;
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

function preliminaryReportProjectionById(reportId, targetState) {
  var report = reportProjectionById(reportId, targetState);
  return report && normalizeReportType(report.reportType) === 'Preliminary Report' ? report : null;
}

function preliminaryReportDraftDefaults() {
  return {
    step: 'inspection',
    content: '',
    includedFindingIds: {},
    findingLevel: 'all',
    findingQuery: '',
    mockAttachmentNames: [],
    declarations: { accurate: true, evidenceBased: true, readyForReview: true },
    draftSavedAt: '',
    submittedAt: ''
  };
}

function preliminaryReportDraftById(reportId, targetState) {
  var target = targetState || state;
  if (!target.preliminaryReportDrafts) target.preliminaryReportDrafts = {};
  var defaults = preliminaryReportDraftDefaults();
  var draft = Object.assign(defaults, target.preliminaryReportDrafts[reportId] || {});
  draft.includedFindingIds = Object.assign({}, draft.includedFindingIds || {});
  draft.declarations = Object.assign({}, defaults.declarations, draft.declarations || {});
  draft.mockAttachmentNames = Array.isArray(draft.mockAttachmentNames) ? draft.mockAttachmentNames.slice() : [];
  target.preliminaryReportDrafts[reportId] = draft;
  return draft;
}

function openLeadPreliminaryReport(reportId) {
  var projection = preliminaryReportProjectionById(reportId, state);
  var artifact = projection ? reportArtifactById(reportId, state) : null;
  if (!projection) return { ok: false, reason: 'not_found', report: null, artifact: null };
  if (!artifact || !projection.approvalPackageId) {
    return { ok: false, reason: 'historical_read_only', report: projection, artifact: null };
  }
  if (!state.leadPreliminaryReportsUi) state.leadPreliminaryReportsUi = {};
  state.leadPreliminaryReportsUi.mode = 'workflow';
  state.leadPreliminaryReportsUi.selectedReportId = reportId;
  var draft = preliminaryReportDraftById(reportId, state);
  draft.step = 'inspection';
  state.view = 'audit-reports';
  state.params = { filter: 'preliminary', reportId: reportId, auditId: projection.auditId };
  if (!state.selectedFilters) state.selectedFilters = {};
  state.selectedFilters['audit-reports'] = 'preliminary';
  return { ok: true, reason: '', report: projection, artifact: artifact, draft: draft };
}

function reportOpenFollowUpFindings(targetState, auditId) {
  var target = targetState || state;
  var findings = target && Array.isArray(target.findings) ? target.findings : [];
  return findings.filter(function (finding) {
    return finding.auditId === auditId && finding.status !== 'CLOSED';
  });
}

function reportProjectionForArtifact(targetState, report) {
  return report ? reportProjectionById(report.id, targetState) : null;
}

function serviceProviderVisibleFindings(targetState, organizationId) {
  var target = targetState || state;
  var findings = target && Array.isArray(target.findings) ? target.findings : [];
  return findings.filter(function (finding) {
    return finding.orgId === organizationId;
  });
}

function serviceProviderFindingById(targetState, organizationId, findingId) {
  return serviceProviderVisibleFindings(targetState, organizationId).filter(function (finding) {
    return finding.id === findingId;
  })[0] || null;
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

var CAP_VERIFICATION_RESULTS = {
  close: {
    label: 'Close',
    evidenceStatus: 'Accepted',
    findingStatus: 'CLOSED',
    findingClosed: true
  },
  partially_close: {
    label: 'Partially Close',
    evidenceStatus: 'Partially Accepted',
    findingStatus: 'EVIDENCE_MORE_INFO',
    findingClosed: false
  },
  not_close: {
    label: 'Not Close',
    evidenceStatus: 'More Information Requested',
    findingStatus: 'EVIDENCE_MORE_INFO',
    findingClosed: false
  }
};

function capVerificationTimestamp() {
  if (typeof managerReportDecisionTimestamp === 'function') return managerReportDecisionTimestamp();
  if (typeof logTimestamp === 'function') return logTimestamp();
  return (typeof DEMO_TODAY === 'string' ? DEMO_TODAY : '2026-06-15') + ' 00:00';
}

function capVerificationLatestEvidence(finding) {
  var evidence = finding && Array.isArray(finding.evidence) ? finding.evidence : [];
  return evidence.reduce(function (latest, item) {
    if (!latest) return item;
    return Number(item.version) >= Number(latest.version) ? item : latest;
  }, null);
}

function applyCapVerificationDecision(target, findingId, input) {
  var s = target || (typeof state !== 'undefined' ? state : null);
  input = input || {};
  var actor = input.actor || {};
  if (!s || !Array.isArray(s.findings)) {
    return { ok: false, message: 'Finding state is unavailable.', finding: null };
  }
  if (['inspector', 'leadInspector'].indexOf(actor.role) === -1) {
    return { ok: false, message: 'Only an Inspector or Lead Inspector may record a CAP verification result.', finding: null };
  }
  var meta = CAP_VERIFICATION_RESULTS[input.result];
  if (!meta) {
    return { ok: false, message: 'Choose Close, Partially Close, or Not Close.', finding: null };
  }
  var finding = s.findings.filter(function (candidate) { return candidate.id === findingId; })[0] || null;
  if (!finding) return { ok: false, message: 'Finding not found.', finding: null };
  if (finding.status !== 'EVIDENCE_SUBMITTED') {
    return { ok: false, message: 'This Finding is not awaiting Evidence verification.', finding: finding };
  }
  var latest = capVerificationLatestEvidence(finding);
  if (!latest) {
    return { ok: false, message: 'A submitted Evidence version is required before verification.', finding: finding };
  }
  var commentToAuditee = String(input.commentToAuditee || '').trim();
  var internalNote = String(input.internalNote || '').trim();
  if (!commentToAuditee) {
    return { ok: false, message: 'Comment to Auditee is required.', finding: finding };
  }
  if (!internalNote) {
    return { ok: false, message: 'Internal CAA Note is required.', finding: finding };
  }

  var at = capVerificationTimestamp();
  var actorName = String(actor.name || (actor.role === 'leadInspector' ? 'Lead Inspector' : 'Inspector'));
  var record = {
    result: input.result,
    label: meta.label,
    findingClosed: meta.findingClosed,
    actorRole: actor.role,
    actorName: actorName,
    verifiedAt: at,
    evidenceId: latest.id,
    evidenceVersion: latest.version
  };
  if (!Array.isArray(finding.capVerificationHistory)) finding.capVerificationHistory = [];
  finding.capVerificationHistory.push(Object.assign({}, record));
  finding.capVerification = record;
  if (!Array.isArray(finding.commentsToAuditee)) finding.commentsToAuditee = [];
  if (!Array.isArray(finding.internalNotes)) finding.internalNotes = [];
  finding.commentsToAuditee.push({ author: actorName, date: DEMO_TODAY, text: commentToAuditee });
  finding.internalNotes.push({ author: actorName, date: DEMO_TODAY, text: internalNote });
  latest.status = meta.evidenceStatus;
  finding.status = meta.findingStatus;
  if (meta.findingClosed) {
    finding.closedDate = DEMO_TODAY;
    finding.closureType = FINDING_CLOSURE_TYPES.EVIDENCE_VERIFIED;
  } else {
    finding.closedDate = null;
    finding.closureType = null;
  }

  if (!Array.isArray(s.auditLog)) s.auditLog = [];
  var nextLogId = Number(s.logSeq) || (s.auditLog.length + 1);
  s.auditLog.unshift({
    id: 'L' + nextLogId,
    time: at,
    actor: actorName,
    action: 'CAP verification recorded: ' + meta.label,
    target: finding.id,
    system: false
  });
  s.logSeq = nextLogId + 1;
  if (!Array.isArray(s.notifications)) s.notifications = [];
  var nextNotificationId = Number(s.notifSeq) || (s.notifications.length + 1);
  s.notifications.unshift({
    id: 'N' + nextNotificationId,
    role: 'auditee',
    organizationId: finding.orgId || '',
    userId: '',
    icon: meta.findingClosed ? '✅' : '↩️',
    text: meta.findingClosed
      ? 'CAP verification closed Finding ' + finding.id + '.'
      : meta.label + ' recorded for ' + finding.id + '; the Finding remains open.',
    time: 'Just now',
    unread: true
  });
  s.notifSeq = nextNotificationId + 1;

  return {
    ok: true,
    message: meta.findingClosed
      ? 'CAP verification recorded and Finding closed.'
      : meta.label + ' recorded. Finding remains open.',
    finding: finding
  };
}

function serviceProviderCapRows(targetState, organizationId, filters) {
  var target = targetState || state;
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var rows = serviceProviderVisibleFindings(target, organizationId).map(function (finding) {
    var audit = target.audits && target.audits.filter(function (candidate) { return candidate.id === finding.auditId; })[0];
    var rawAuditId = String(finding.auditId || '').trim();
    var auditId = rawAuditId && ['null', 'undefined'].indexOf(rawAuditId.toLowerCase()) === -1 ? rawAuditId : 'Not configured';
    var meta = typeof FINDING_STATUS !== 'undefined' ? FINDING_STATUS[finding.status] : null;
    var progress = serviceProviderCapProgress(finding);
    return {
      id: finding.id,
      auditId: auditId,
      audit: audit ? (audit.ref || audit.type || audit.id) : auditId,
      title: finding.title,
      level: typeof SEVERITY !== 'undefined' && SEVERITY[finding.severity] ? SEVERITY[finding.severity].label : String(finding.severity),
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

function serviceProviderReportById(targetState, organizationId, reportId) {
  var target = targetState || state;
  var report = reportReadModelById(reportId, target);
  if (report && report.organizationId !== organizationId) report = null;
  if (!report) return null;
  var type = normalizeReportType(report.reportType);
  return serviceProviderVisibleReports(target, organizationId, type).some(function (item) { return item.id === reportId; }) ? report : null;
}

function serviceProviderReportFindings(targetState, organizationId, report) {
  if (!report || report.organizationId !== organizationId) return [];
  return serviceProviderVisibleFindings(targetState, organizationId).filter(function (finding) { return finding.auditId === report.auditId; });
}

function serviceProviderFinalReportIsClosed(targetState, organizationId, report) {
  var findings = serviceProviderReportFindings(targetState, organizationId, report);
  return findings.length > 0 && findings.every(function (finding) { return finding.status === 'CLOSED'; });
}

function serviceProviderSafeReportProjection(targetState, organizationId, reportId) {
  var target = targetState || state;
  var report = serviceProviderReportById(target, organizationId, reportId);
  if (!report) return null;
  var audit = target.audits && target.audits.filter(function (item) { return item.id === report.auditId; })[0];
  var findings = serviceProviderReportFindings(target, organizationId, report);
  return {
    id: report.id,
    reportType: normalizeReportType(report.reportType),
    auditId: report.auditId,
    audit: audit ? audit.ref : report.auditId,
    inspectionType: audit ? audit.type : 'Inspection',
    inspectionDate: audit ? audit.date : '',
    organizationId: report.organizationId,
    organization: report.organization,
    leadInspector: report.leadInspector,
    version: report.version,
    dateShared: report.sharedAt || report.releasedAt || report.issuedAt || '',
    sharedBy: report.sharedBy || report.finalAuthorizedBy || 'CAA authorized role',
    responseDueDate: report.responseDueDate || 'Not configured',
    issuedAt: report.issuedAt || report.releasedAt || '',
    classification: 'Service Provider visible / controlled demo copy',
    summary: report.summary || 'Authorized report package shared by the CAA.',
    attachments: Array.isArray(report.attachments) ? report.attachments.slice() : [],
    findingCount: findings.length,
    findings: findings.map(function (finding) {
      return {
        id: finding.id,
        title: finding.title,
        level: typeof SEVERITY !== 'undefined' && SEVERITY[finding.severity] ? SEVERITY[finding.severity].label : String(finding.severity),
        status: typeof FINDING_STATUS !== 'undefined' && FINDING_STATUS[finding.status] ? FINDING_STATUS[finding.status].label : finding.status,
        dueDate: finding.dueDate || 'Not configured'
      };
    }),
    closed: normalizeReportType(report.reportType) === 'Final Report' ? serviceProviderFinalReportIsClosed(target, organizationId, report) : report.status === 'closed'
  };
}

function serviceProviderVisibleReports(targetState, organizationId, reportType) {
  var target = targetState || state;
  var type = normalizeReportType(reportType);
  var reports = reportReadModels(target);
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
    if (report.capRequired === false) return 'View Report';
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

/* ------------------- Reusable state-backed Final Report document ------------------- */

function finalReportLinkedFindings(targetState, report) {
  var target = targetState || state;
  if (!report || !target || !Array.isArray(target.findings)) return [];
  return target.findings.filter(function (finding) { return finding.auditId === report.auditId; });
}

function finalReportTeamNames(targetState, audit, team) {
  var target = targetState || state;
  if (team && Array.isArray(team.memberIds) && target && Array.isArray(target.users)) {
    return team.memberIds.map(function (userId) {
      var user = target.users.filter(function (candidate) { return candidate.id === userId; })[0];
      return user ? user.name : userId;
    });
  }
  return audit && Array.isArray(audit.team) ? audit.team.slice() : [];
}

function finalReportPlainStatus(status) {
  var labels = {
    submitted_to_executive: 'Pending Final Authorized Approval',
    issued: 'Issued',
    returned_to_manager: 'Returned to Department Manager',
    rejected: 'Rejected',
    enforcement_review_referred: 'Referred for Separate Enforcement Review'
  };
  return labels[status] || String(status || 'Unknown').replace(/_/g, ' ');
}

function finalReportFindingLevel(finding) {
  return typeof SEVERITY !== 'undefined' && SEVERITY[finding.severity]
    ? SEVERITY[finding.severity].label
    : 'Level ' + String(finding.severity);
}

function finalReportFindingStatus(finding) {
  return typeof FINDING_STATUS !== 'undefined' && FINDING_STATUS[finding.status]
    ? FINDING_STATUS[finding.status].label
    : String(finding.status || 'Open').replace(/_/g, ' ');
}

function finalReportDocumentHtml(report, audit, findings, team, targetState) {
  if (!report) return '<div class="final-report-document-empty">Final Report record unavailable.</div>';
  var target = targetState || (typeof state !== 'undefined' ? state : null);
  var rows = Array.isArray(findings) ? findings : finalReportLinkedFindings(target, report);
  var teamNames = finalReportTeamNames(target, audit, team);
  var open = rows.filter(function (finding) { return finding.status !== 'CLOSED'; });
  var critical = rows.filter(function (finding) { return finding.severity === 1; }).length;
  var major = rows.filter(function (finding) { return finding.severity === 2; }).length;
  var minor = rows.filter(function (finding) { return finding.severity === 3; }).length;
  var observations = rows.length - critical - major - minor;
  var findingRows = rows.length ? rows.map(function (finding) {
    return '<tr><td><b>' + esc(finding.id) + '</b><small>' + esc(finding.title) + '</small></td><td>' + esc(finalReportFindingLevel(finding)) + '</td><td>' + esc(finalReportFindingStatus(finding)) + '</td><td>' + esc(finding.dueDate ? fmtDate(finding.dueDate) : 'Not configured') + '</td></tr>';
  }).join('') : '<tr><td colspan="4">No Findings are linked to this report.</td></tr>';
  var signature = report.mockApprovalSignature
    ? '<div class="state-report-signature is-recorded"><span>DEMO APPROVAL MARK</span><b>' + esc(report.mockApprovalSignature.signer) + '</b><small>' + esc(report.mockApprovalSignature.date) + '</small><em>' + esc(report.mockApprovalSignature.label) + '</em></div>'
    : '<div class="state-report-signature"><span>FINAL AUTHORIZED APPROVAL</span><b>Pending</b><small>No approval mark is recorded.</small><em>Any future demo mark is not a real e-signature.</em></div>';
  return '<article class="state-final-report-doc" data-report-id="' + esc(report.id) + '">' +
    '<header class="state-report-cover"><div class="state-report-brand"><div>' + (typeof renderBrandMark === 'function' ? renderBrandMark('brand-mark--report') : '<b>AS360</b>') + '<span>AviaSurveil360</span></div><strong>FINAL REPORT</strong></div><div class="state-report-classification">CAA controlled demo copy · ' + esc(report.organization) + ' · Demo-only</div><h1>' + esc((audit ? audit.type : 'Inspection') + ' Final Report') + '</h1><p>' + esc(report.id + ' · Version ' + report.version) + '</p><div class="state-report-cover-meta"><div><span>Report ID</span><b>' + esc(report.id) + '</b></div><div><span>Report Date</span><b>' + esc(report.issuedAt || report.submittedAt || 'Not recorded') + '</b></div><div><span>Organization</span><b>' + esc(report.organization) + '</b></div><div><span>Audit ID</span><b>' + esc(report.auditId) + '</b></div><div><span>Inspection Type</span><b>' + esc(audit ? audit.type : 'Inspection') + '</b></div><div><span>Inspection Date</span><b>' + esc(audit && audit.date ? fmtDate(audit.date) : 'Not recorded') + '</b></div><div><span>Submitted By</span><b>' + esc(report.leadInspector) + '</b></div><div><span>Submitted On</span><b>' + esc(report.submittedAt || 'Not recorded') + '</b></div><div><span>Current Status</span><b>' + esc(finalReportPlainStatus(report.status)) + '</b></div></div></header>' +
    '<section class="state-report-section" id="report-summary"><h2>1. Executive Summary</h2><p>' + esc(report.summary || 'No executive summary is available.') + '</p></section>' +
    '<section class="state-report-section" id="report-overview"><h2>2. Inspection Overview</h2><div class="state-report-overview"><div><span>Department / Domain</span><b>' + esc(audit ? audit.domain : 'Not recorded') + '</b></div><div><span>Inspection Mode</span><b>' + esc(audit ? audit.mode : 'Not recorded') + '</b></div><div><span>Location</span><b>' + esc(audit ? audit.location : 'Not recorded') + '</b></div><div><span>Audit Team</span><b>' + esc(teamNames.join(', ') || report.leadInspector) + '</b></div></div></section>' +
    '<section class="state-report-section" id="report-findings"><h2>3. Findings Overview</h2><div class="state-report-finding-cards"><div><span>Total</span><b>' + esc(String(rows.length)) + '</b></div><div class="is-critical"><span>Level 1 Critical</span><b>' + esc(String(critical)) + '</b></div><div class="is-major"><span>Level 2 Major</span><b>' + esc(String(major)) + '</b></div><div><span>Level 3 Minor</span><b>' + esc(String(minor)) + '</b></div><div><span>Observations</span><b>' + esc(String(observations)) + '</b></div><div><span>Open Follow-up</span><b>' + esc(String(open.length)) + '</b></div></div><div class="state-report-table-wrap"><table><thead><tr><th>Finding</th><th>Level</th><th>Status</th><th>Due Date</th></tr></thead><tbody>' + findingRows + '</tbody></table></div></section>' +
    '<section class="state-report-section" id="report-conclusion"><h2>4. Conclusion</h2><p>This Final Report records the selected inspection and its linked Findings. ' + esc(open.length ? open.length + ' Finding' + (open.length === 1 ? '' : 's') + ' remain open for configured CAP, Evidence, verification, or authorized closure steps.' : 'No linked Finding remains open in the current browser-local state.') + '</p></section>' +
    '<section class="state-report-section" id="report-next"><h2>5. Next Steps</h2><ul><li>Service Provider continues the configured Corrective Action Plan and Evidence response for every open Finding.</li><li>CAA Inspector reviews submitted CAP/Evidence; acceptance does not by itself close a Finding.</li><li>Finding closure requires accepted evidence and verification, or an explicitly authorized and audit-logged closure path.</li></ul></section>' +
    '<footer class="state-report-approval"><div><span>Prepared by</span><b>' + esc(report.leadInspector) + '</b><small>' + esc(report.submittedAt || 'Not recorded') + '</small></div><div><span>Final authorized by</span><b>' + esc(report.finalAuthorizedBy || 'Pending Executive Director decision') + '</b><small>' + esc(report.finalAuthorizedAt || 'Not recorded') + '</small></div>' + signature + '</footer>' +
    '<div class="state-report-demo-boundary">' + esc(DEMO_BOUNDARY_SUMMARIES.join(' ')) + ' No production reporting engine, enforcement execution, or records-management service is used.</div>' +
  '</article>';
}

function finalReportPdfFilename(report) {
  var org = String(report && report.organization || 'Organization').replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '');
  return (org || 'Organization') + '_Final_Report_' + String(report && report.id || 'Report').replace(/[^0-9A-Za-z_-]+/g, '_') + '.pdf';
}

function finalReportPdfLines(report, audit, findings, team, targetState) {
  if (!report) return ['AviaSurveil360 - Final Report', 'Demo-only browser-generated document - report unavailable.'];
  var target = targetState || (typeof state !== 'undefined' ? state : null);
  var rows = Array.isArray(findings) ? findings : finalReportLinkedFindings(target, report);
  var teamNames = finalReportTeamNames(target, audit, team);
  var open = rows.filter(function (finding) { return finding.status !== 'CLOSED'; });
  var lines = [
    'AviaSurveil360 - Final Report',
    'Demo-only browser-generated document - not a production authority record',
    '',
    'Report ID: ' + report.id,
    'Version: ' + report.version,
    'Organization: ' + report.organization,
    'Audit ID: ' + report.auditId,
    'Inspection Type: ' + (audit ? audit.type : 'Inspection'),
    'Inspection Date: ' + (audit && audit.date ? audit.date : 'Not recorded'),
    'Audit Team: ' + (teamNames.join(', ') || report.leadInspector),
    'Submitted By: ' + report.leadInspector,
    'Submitted On: ' + (report.submittedAt || 'Not recorded'),
    'Status: ' + finalReportPlainStatus(report.status),
    '',
    'Executive Summary',
    report.summary || 'No executive summary is available.',
    '',
    'Findings Overview',
    'Total Findings: ' + rows.length + ' | Open Follow-up: ' + open.length,
    '',
    'Detailed Findings Summary'
  ];
  rows.forEach(function (finding) {
    lines.push(finding.id + ' | ' + finalReportFindingLevel(finding) + ' | ' + finalReportFindingStatus(finding) + ' | Due Date ' + (finding.dueDate || 'Not configured') + ' | ' + finding.title);
  });
  lines.push('', 'Conclusion', open.length ? open.length + ' linked Finding(s) remain open for configured follow-up.' : 'No linked Finding remains open in the current browser-local state.');
  lines.push('', 'Next Steps', 'CAP acceptance does not close a Finding. Required evidence acceptance, verification, or an authorized audit-logged closure path is still required.');
  if (report.mockApprovalSignature) {
    lines.push('', 'DEMO APPROVAL MARK - not a real e-signature', 'Signer: ' + report.mockApprovalSignature.signer, 'Date: ' + report.mockApprovalSignature.date);
  } else {
    lines.push('', 'Final authorized approval: Pending - no approval mark recorded.');
  }
  lines.push('', DEMO_BOUNDARY_SUMMARIES.join(' '), 'No production reporting engine, enforcement execution, or records-management service.');
  return lines;
}
