/* ==========================================================================
   AviaSurveil360 — Report approval helpers (DEMO ONLY)
   Mock report generation/signature; no real PDF, Word, e-signature, or storage.
   ========================================================================== */

function auditReportById(id) {
  if (!state || !Array.isArray(state.auditReports)) return null;
  for (var i = 0; i < state.auditReports.length; i++) {
    if (state.auditReports[i].id === id) return state.auditReports[i];
  }
  return null;
}

function reportForAudit(auditId) {
  if (!state || !Array.isArray(state.auditReports)) return null;
  for (var i = 0; i < state.auditReports.length; i++) {
    if (state.auditReports[i].auditId === auditId) return state.auditReports[i];
  }
  return null;
}

function finalizeApprovedReport(report, actor) {
  if (!report || !report.approval || report.approval.outcome !== 'approved') return report;
  var audit = auditById(report.auditId);
  report.status = 'final_report_generated';
  report.finalLocked = true;
  report.reportNumber = report.reportNumber || 'FINAL-' + report.auditId + '-2026';
  report.approvalDate = DEMO_TODAY;
  report.approvedBy = actor && actor.name ? actor.name : currentActorLabel();
  report.mockDigitalSignature = {
    label: 'DEMO mock digital signature - not a real e-signature',
    signer: report.approvedBy,
    date: DEMO_TODAY
  };
  if (audit) audit.status = 'Closed';
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
