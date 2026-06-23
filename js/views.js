/* ==========================================================================
   AviaSurveil360 — View renderers (return HTML strings)
   Pure-ish: read state, return markup. Wiring lives in app.js.
   ========================================================================== */

/* =========================== Shared fragments =========================== */

function pageHead(title, purpose, actionsHtml) {
  return '' +
    '<div class="page-head">' +
      '<div class="page-head__main">' +
        '<h1>' + esc(title) + '</h1>' +
        (purpose ? '<div class="purpose">' + esc(purpose) + '</div>' : '') +
      '</div>' +
      (actionsHtml ? '<div class="page-head__actions">' + actionsHtml + '</div>' : '') +
    '</div>';
}

function kpiCard(label, value, foot, opts) {
  opts = opts || {};
  var cls = opts.tone ? ' is-' + opts.tone : '';
  var dataView = opts.view ? ' data-act="nav" data-view="' + opts.view + '"' +
    (opts.filter ? ' data-filter="' + opts.filter + '"' : '') +
    (opts.id ? ' data-id="' + opts.id + '"' : '') : '';
  return '' +
    '<div class="kpi"' + dataView + '>' +
      '<div class="kpi__label">' + esc(label) + '</div>' +
      '<div class="kpi__value' + cls + '">' + value + '</div>' +
      (foot ? '<div class="kpi__foot">' + esc(foot) + '</div>' : '') +
    '</div>';
}

function guardrailStrip(items) {
  return '<div class="guardrail-strip">' + items.map(function (item) {
    var tone = item.tone || 'neutral';
    return demoBadge(item.label, tone);
  }).join('') + '</div>';
}

function regulatoryTraceHtml(trace, compact) {
  if (!trace) return '';
  return '<div class="reg-trace' + (compact ? ' reg-trace--compact' : '') + '">' +
    '<div class="reg-trace__head"><span class="reg-trace__mark">Regulatory Trace</span>' +
      demoBadge(trace.demoLabel || 'Mock regulatory library', 'neutral') +
      demoBadge(trace.legalGuardrail || 'Not a legal decision', 'warn') +
      v2Badge(trace.approvalState) +
    '</div>' +
    '<div class="reg-trace__grid">' +
      '<div><span>Source</span><b>' + esc(trace.sourceDocument) + '</b></div>' +
      '<div><span>Version</span><b>' + esc(trace.version) + '</b></div>' +
      '<div><span>Clause / PQ</span><b>' + esc(trace.clauseRef) + '</b></div>' +
      '<div><span>Effective</span><b>' + esc(fmtDate(trace.effectiveDate)) + '</b></div>' +
      '<div><span>Applicability</span><b>' + esc(trace.applicabilityReason) + '</b></div>' +
      '<div><span>Linked checklist/evidence</span><b>' + esc(trace.linkedChecklist + ' · ' + trace.linkedEvidence) + '</b></div>' +
    '</div>' +
  '</div>';
}

function compactMetric(label, value, tone) {
  return '<div class="compact-metric"><span>' + esc(label) + '</span><b class="' + (tone ? 'is-' + tone : '') + '">' + esc(value) + '</b></div>';
}

/* =========================== Frontend V2 screens =========================== */
function viewSafetyIntelligenceDashboard() {
  var filter = selectedFilter('safety', 'all');
  var open = state.findings.filter(function (f) { return f.status !== 'CLOSED'; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });
  var repeat = state.riskProfiles.filter(function (r) { return r.drivers.join(' ').toLowerCase().indexOf('repeat') > -1; });
  var waiting = state.findings.filter(function (f) { return f.status === 'CAP_SUBMITTED' || f.status === 'EVIDENCE_SUBMITTED'; });
  var topRisk = state.riskProfiles.slice().sort(function (a, b) { return b.score - a.score; })[0];

  var chips = [
    { key: 'all', label: 'All signals' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'repeat', label: 'Repeat' }
  ].map(function (c) {
    return '<button class="btn btn--sm' + (filter === c.key ? ' btn--primary' : '') + '" data-act="set-filter" data-key="safety" data-val="' + c.key + '">' + esc(c.label) + '</button>';
  }).join('');

  var alerts = state.riskProfiles.filter(function (r) {
    if (filter === 'repeat') return r.drivers.join(' ').toLowerCase().indexOf('repeat') > -1;
    if (filter === 'overdue') return state.findings.some(function (f) { return f.orgId === r.orgId && dueInfo(f).overdue; });
    return true;
  }).map(function (r) {
    return '<div class="list__row" data-act="nav" data-view="org-risk" data-id="' + r.orgId + '">' +
      '<div class="list__main"><div class="list__title">' + esc(orgName(r.orgId)) + ' <span class="risk-band">' + esc(r.band) + '</span></div>' +
      '<div class="list__meta"><span><b>Mock risk indicator:</b> ' + r.score + '</span><span><b>Drivers:</b> ' + esc(r.drivers.join(', ')) + '</span></div></div>' +
      '<div class="list__side"><button class="btn btn--sm" data-act="nav" data-view="org-risk" data-id="' + r.orgId + '">Open profile</button></div></div>';
  }).join('');

  return pageHead('Safety Intelligence Dashboard', 'Decide which risk, delay, or workload issue needs management attention today.', chips) +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'mock risk indicator', tone: 'info' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: DEMO_PERSISTENCE_CONFIG.label, tone: 'neutral' }
    ]) +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Highest Mock Risk', topRisk ? topRisk.score : '—', topRisk ? orgName(topRisk.orgId) + ' · opens risk profile' : 'No risk profile', { tone: 'warn', view: 'org-risk', id: topRisk ? topRisk.orgId : 'ORG-XYZ' }) +
      kpiCard('Overdue CAP/Evidence', overdue.length, 'Open findings past Due Date', { tone: overdue.length ? 'danger' : 'ok', view: 'findings', filter: 'overdue' }) +
      kpiCard('Waiting CAA Review', waiting.length, 'CAP/evidence decisions pending', { tone: waiting.length ? 'warn' : 'ok', view: 'findings', filter: 'capreview' }) +
    '</div>' +
    '<div class="grid grid--main">' +
      '<div class="card"><div class="card__head"><h3>Management Attention Queue</h3><span class="sub">Every signal links to an organization or finding</span></div><div class="list">' +
        (alerts || '<div class="empty">No safety intelligence signals for this filter.</div>') + '</div></div>' +
      '<div class="v2-panel">' +
        '<h3>Recommended Management Action</h3>' +
        '<p>' + esc(topRisk ? topRisk.recommendedAction : 'Review open findings and CAP/evidence queues.') + '</p>' +
        '<div class="divider"></div>' +
        compactMetric('Repeat risk profiles', String(repeat.length), repeat.length ? 'warn' : 'ok') +
        compactMetric('Section workload', 'Balanced (demo)', 'info') +
        compactMetric('Plan slippage', '2 planned audits not started', 'warn') +
      '</div>' +
    '</div>';
}

function viewOrganizationRiskProfile() {
  var orgId = state.params.orgId || 'ORG-XYZ';
  var org = orgById(orgId) || orgById('ORG-XYZ');
  var profile = riskProfileByOrgId(org.id) || state.riskProfiles[0];
  var fs = state.findings.filter(function (f) { return f.orgId === org.id; });
  var audits = state.audits.filter(function (a) { return a.orgId === org.id; });
  var trace = regulatoryTraceById(profile.traceId);

  var findings = fs.length ? fs.map(findingRow).join('') : '<div class="empty">No findings for this organization.</div>';
  var auditRows = audits.map(function (a) {
    return '<div class="row-between small v2-rowlink" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">' +
      '<span><b>' + esc(a.id) + '</b> · ' + esc(a.type) + '</span><span class="muted">' + esc(fmtDate(a.date)) + ' · ' + esc(a.status) + '</span></div>';
  }).join('');

  return pageHead('Organization Risk Profile — ' + org.name, 'Understand why this organization needs oversight attention before planning or opening an inspection.',
    '<button class="btn" data-act="nav" data-view="safety-intelligence">Back to safety intelligence</button>') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'mock risk indicator', tone: 'info' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Risk Dossier</h3><span class="sub">Why this organization appears in a risk alert</span></div><div class="card__body">' +
          '<div class="risk-score"><div class="risk-score__num">' + profile.score + '</div><div><b>' + esc(profile.band) + '</b><p>' + esc(profile.recommendedAction) + '</p></div></div>' +
          '<div class="divider"></div><div class="chip-list">' + profile.drivers.map(function (d) { return '<span class="tag-pill">' + esc(d) + '</span>'; }).join('') + '</div>' +
          '<div class="divider"></div>' + regulatoryTraceHtml(trace, true) +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Findings</h3></div><div class="list">' + findings + '</div></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="v2-panel"><h3>Operating Context</h3>' +
          compactMetric('CAP performance', profile.capPerformance, 'warn') +
          compactMetric('Fleet/management change', profile.fleetChange, 'info') +
          compactMetric('Occurrence trend placeholder', profile.occurrenceTrend, 'neutral') +
        '</div>' +
        '<div class="card"><div class="card__head"><h3>Audit History</h3></div><div class="card__body">' + auditRows + '</div></div>' +
      '</div>' +
    '</div>';
}

function viewRegulatoryLibrary() {
  var filter = selectedFilter('regulatory', 'all');
  var docs = state.regulatoryDocuments.filter(function (d) { return filter === 'all' || d.status === filter; });
  var chips = [
    { key: 'all', label: 'All' },
    { key: V2_STATUS.published, label: 'Published' },
    { key: V2_STATUS.underReview, label: 'Under Review' },
    { key: V2_STATUS.draft, label: 'Draft' }
  ].map(function (c) {
    return '<button class="btn btn--sm' + (filter === c.key ? ' btn--primary' : '') + '" data-act="set-filter" data-key="regulatory" data-val="' + c.key + '">' + esc(c.label) + '</button>';
  }).join('');

  var rows = docs.map(function (d) {
    var clauses = d.clauses.map(function (c) {
      return '<div class="clause-row"><div><b>' + esc(c.reference) + '</b> · ' + esc(c.title) + '</div>' +
        '<div class="muted small">' + esc(c.applicability) + ' · Expected evidence: ' + esc(c.expectedEvidence.join(', ')) + '</div></div>';
    }).join('');
    var changes = d.changeHistory.map(function (c) {
      return '<div class="timeline mini"><div class="tl-item"><div class="tl-item__time">' + esc(fmtDate(c.date)) + '</div><div class="tl-item__txt">' + esc(c.summary) + '</div></div></div>';
    }).join('');
    return '<div class="card mb-16"><div class="card__head"><h3>' + esc(d.family + ' · ' + d.title) + '</h3><div class="spacer"></div>' +
      v2Badge(d.status) + '</div><div class="card__body">' +
      '<div class="metaline mb-16">' + metaItem('Document ID', d.id) + metaItem('Version', d.version) + metaItem('Effective date', fmtDate(d.effectiveDate)) +
        metaItem('Supersedes', d.supersedes || '—') + metaItem('Superseded by', d.supersededBy || '—') + '</div>' +
      '<div class="reg-section-title">Clauses / configured rules</div>' + clauses +
      '<div class="reg-section-title mt-16">Mock change history</div>' + changes +
      '</div></div>';
  }).join('');

  return pageHead('Regulatory Library', 'Inspect current references, versions, effective dates, configured rules and change status.', chips) +
    guardrailStrip([
      { label: 'Mock regulatory library' },
      { label: 'Demo data' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: 'No real regulatory ingestion', tone: 'neutral' }
    ]) +
    (rows || '<div class="empty">No regulatory documents match this filter.</div>');
}

function viewInspectionPackageBuilder() {
  var pkg = state.inspectionPackage;
  var org = orgById(pkg.organizationId);
  var risk = riskProfileByOrgId(pkg.organizationId);
  var questionRows = pkg.questions.map(function (q) {
    return '<div class="package-question">' +
      '<div class="package-question__head"><b>' + esc(q.text) + '</b>' + v2Badge(pkg.status) + '</div>' +
      '<p><b>Why included:</b> ' + esc(q.whyIncluded) + '</p>' +
      '<p><b>Expected evidence:</b> ' + esc(q.expectedEvidence.join(', ')) + '</p>' +
      regulatoryTraceHtml(regulatoryTraceById(q.traceId), true) +
    '</div>';
  }).join('');

  return pageHead('Dynamic Inspection Package Builder', 'Build an inspection package and understand why each checklist question is included.',
    '<button class="btn btn--primary" data-act="nav" data-view="checklist" data-id="' + pkg.auditId + '">Open runnable checklist</button>') +
    guardrailStrip([
      { label: 'mock inspection package' },
      { label: 'Mock regulatory library' },
      { label: 'Not an official checklist publication', tone: 'warn' },
      { label: DEMO_PERSISTENCE_CONFIG.label }
    ]) +
    '<div class="grid grid--main">' +
      '<div class="card"><div class="card__head"><h3>Package Draft</h3><span class="sub">Backend-ready API-shaped mock record</span></div><div class="card__body">' +
        '<div class="metaline mb-16">' + metaItem('Package ID', pkg.id) + metaItem('Organization', org ? org.name : pkg.organizationId) +
        metaItem('Audit type', pkg.auditType) + metaItem('Domain', pkg.domain) + metaItem('Status', humanStatus(pkg.status)) + '</div>' +
        '<div class="reg-section-title">Proposed checklist questions</div>' + questionRows +
      '</div></div>' +
      '<div class="v2-panel"><h3>Risk Focus</h3><div class="chip-list">' + pkg.riskFocus.map(function (f) { return '<span class="tag-pill">' + esc(f) + '</span>'; }).join('') + '</div>' +
        '<div class="divider"></div>' + compactMetric('Mock risk score', risk ? String(risk.score) : '—', 'warn') +
        compactMetric('Recommended action', risk ? risk.recommendedAction : '—', 'info') +
      '</div>' +
    '</div>';
}

function viewOfflineFieldInspection() {
  var pkg = state.fieldPackage;
  var outbox = offlineOutboxItems();
  var waiting = waitingOutboxItems().length;
  var statusBadge = state.offline && state.offline.simulated
    ? demoBadge('Offline simulated', 'warn')
    : demoBadge('Simulated online', 'ok');
  var outboxRows = outbox.length ? outbox.map(function (item) {
    return '<div class="outbox-item"><div><b>' + esc(item.id) + '</b> · ' + esc(item.payloadSummary) +
      '<div class="muted small">' + esc(item.message) + '</div><div class="muted small">Created ' + esc(item.createdAt) +
      (item.syncedAt ? ' · synced ' + esc(item.syncedAt) : '') + '</div></div>' + v2Badge(item.status) + '</div>';
  }).join('') : '<div class="empty">No simulated offline outbox items yet.</div>';

  return pageHead('Offline Field Inspection', 'Show what can be collected offline and what still needs sync.',
    '<button class="btn ' + (state.offline && state.offline.simulated ? 'btn--danger' : 'btn--primary') + '" data-act="toggle-offline">Simulate offline</button>') +
    guardrailStrip([
      { label: 'Offline simulated', tone: 'warn' },
      { label: 'Demo data' },
      { label: 'No production sync', tone: 'neutral' },
      { label: DEMO_PERSISTENCE_CONFIG.label }
    ]) +
    '<div class="offline-status mb-16">' + statusBadge +
      '<div><b>' + esc(state.offline && state.offline.lastMessage ? state.offline.lastMessage : 'Use Simulate offline to queue a mock field action.') + '</b>' +
      '<p>Offline behavior is a stakeholder illustration only. It is not an encrypted mobile store or evidence chain-of-custody.</p></div></div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Checked-out Field Package</h3><span class="sub">offline simulated</span></div><div class="card__body">' +
          '<div class="metaline mb-16">' + metaItem('Package', pkg.id) + metaItem('Audit', pkg.auditId) + metaItem('Checked out by', pkg.checkedOutBy) +
          metaItem('Status', humanStatus(pkg.status)) + '</div>' +
          '<div class="chip-list">' + pkg.localItems.map(function (i) { return '<span class="tag-pill">' + esc(i) + '</span>'; }).join('') + '</div>' +
          '<div class="divider"></div><button class="btn btn--primary" data-act="offline-field-action">Save mock field evidence action</button>' +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Offline Outbox</h3><span class="sub">' + waiting + ' waiting for connection</span><div class="spacer"></div>' +
          '<button class="btn btn--sm" data-act="sync-outbox">Mark waiting items synced</button></div><div class="card__body">' + outboxRows + '</div></div>' +
      '</div>' +
      '<div class="v2-panel"><h3>Field Capture Placeholders</h3>' +
        compactMetric('Photos/videos/audio', 'Filename placeholders only', 'neutral') +
        compactMetric('Signature', 'Placeholder only', 'neutral') +
        compactMetric('Conflict warning', 'Example state only', 'warn') +
        compactMetric('Attachment queue', waiting + ' waiting', waiting ? 'warn' : 'ok') +
      '</div>' +
    '</div>';
}

function viewUsoapReadiness() {
  var rows = state.usoapReadiness.map(function (r) {
    return '<div class="card mb-16"><div class="card__head"><h3>' + esc(r.pqId) + '</h3><div class="spacer"></div>' + v2Badge(r.readinessStatus) + '</div>' +
      '<div class="card__body"><div class="metaline mb-16">' + metaItem('Critical Element', r.criticalElement) + metaItem('Audit area', r.auditArea) +
      metaItem('Applicability', r.applicability) + metaItem('Linked CAP/Finding', r.linkedCapIds.join(', ') || '—') + '</div>' +
      '<div class="callout mb-16">' + esc(r.note) + '</div>' + regulatoryTraceHtml(regulatoryTraceById(r.traceId), true) +
      '<div class="reg-section-title mt-16">Verification history</div>' + r.verificationHistory.map(function (v) {
        return '<div class="row-between small"><span>' + esc(fmtDate(v.date)) + '</span><b>' + esc(v.result) + '</b></div>';
      }).join('') + '</div></div>';
  }).join('');
  return pageHead('USOAP Readiness Workspace', 'See PQ/CE gaps, missing evidence and readiness history without claiming official EI outcome.') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'Mock PQ readiness' },
      { label: 'No official EI score', tone: 'warn' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) + rows;
}

function viewCapEffectiveness() {
  var rows = state.capEffectiveness.map(function (c) {
    var f = findingById(c.findingId);
    var revs = c.revisionHistory.map(function (r) {
      return '<div class="row-between small"><span><b>' + esc(r.id) + '</b> · ' + esc(fmtDate(r.submittedDate)) + '</span>' + v2Badge(r.status) + '</div>';
    }).join('');
    return '<div class="card mb-16"><div class="card__head"><h3>' + esc(c.findingId) + '</h3><div class="spacer"></div>' +
      (f ? statusBadge(f) : demoBadge('Historical CAP', 'neutral')) + '</div><div class="card__body">' +
      '<div class="metaline mb-16">' + metaItem('Organization', orgName(c.orgId)) + metaItem('Root cause quality', c.rootCauseQuality) +
      metaItem('Effectiveness verification', humanStatus(c.verificationStatus)) + metaItem('Post-closure review', c.postClosureReview) + '</div>' +
      '<div class="callout mb-16">CAP acceptance is not finding closure. Effectiveness review is separate from evidence acceptance and closure.</div>' +
      '<div class="reg-section-title">Revision history</div>' + revs +
      '<div class="reg-section-title mt-16">Recurrence / reopen path</div><p class="small">' + esc(c.recurrenceIndicator) + ' ' + esc(c.reopenPath) + '</p>' +
      '</div></div>';
  }).join('');
  return pageHead('CAP Effectiveness', 'Decide whether accepted CAP actions worked after closure and whether recurrence needs attention.') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'CAP accepted is not finding closed', tone: 'warn' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) + rows;
}

function viewAiAssistant() {
  var cards = state.aiSuggestions.map(function (s) {
    var decision = s.decision ? '<div class="callout mt-12"><b>Recorded decision:</b> ' + humanStatus(s.decision.status) +
      ' by ' + esc(s.decision.reviewer) + ' · saved in this browser for demo only.</div>' : '';
    return '<div class="card mb-16"><div class="card__head"><h3>' + esc(s.title) + '</h3><div class="spacer"></div>' +
      demoBadge('AI-generated draft - requires authorized review', 'warn') + v2Badge(s.status) + '</div><div class="card__body">' +
      '<div class="small muted mb-8">Sources: ' + esc(s.sourceRefs.join(' · ')) + '</div>' +
      '<textarea class="ai-draft" id="ai-edit-' + esc(s.id) + '">' + esc(s.decision && s.decision.finalText ? s.decision.finalText : s.draft) + '</textarea>' +
      '<div class="callout mt-12">' + esc(s.limitation) + ' Not a legal decision.</div>' +
      regulatoryTraceHtml(regulatoryTraceById(s.traceId), true) +
      decision +
      '<div class="row-actions mt-16">' +
        '<button class="btn btn--ok btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.accepted + '">Accept draft</button>' +
        '<button class="btn btn--primary btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.edited + '">Record edit</button>' +
        '<button class="btn btn--danger btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.rejected + '">Reject</button>' +
      '</div></div></div>';
  }).join('');
  return pageHead('AI Inspector Assistant Panel', 'Review source-referenced draft assistance with accept, edit and reject controls.') +
    guardrailStrip([
      { label: 'AI-generated draft - requires authorized review', tone: 'warn' },
      { label: 'Demo data' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: 'No real AI service', tone: 'neutral' }
    ]) + cards;
}

function viewSspNaspDashboard() {
  var objectives = state.sspNasp.objectives.map(function (o) {
    var spiRows = o.spis.map(function (s) {
      return '<div class="spi-row"><div><b>' + esc(s.label) + '</b><div class="muted small">Target: ' + esc(s.target) + '</div></div><div><b>' + esc(s.current) + '</b><div class="muted small">' + esc(s.trend) + '</div></div></div>';
    }).join('');
    var actionRows = o.naspActions.map(function (a) {
      return '<div class="row-between small v2-rowlink"><span><b>' + esc(a.id) + '</b> · ' + esc(a.owner) + '</span><span>' + esc(fmtDate(a.targetDate)) + ' · ' + humanStatus(a.status) + '</span></div>' +
        '<div class="small muted">Linked oversight findings: ' + esc(a.linkedFindingIds.join(', ')) + '</div>';
    }).join('');
    return '<div class="card mb-16"><div class="card__head"><h3>' + esc(o.title) + '</h3><div class="spacer"></div>' + v2Badge(o.status) + '</div>' +
      '<div class="card__body"><div class="reg-section-title">Safety Performance Indicators</div>' + spiRows +
      '<div class="reg-section-title mt-16">NASP actions</div>' + actionRows + '</div></div>';
  }).join('');
  return pageHead('SSP/NASP Management Dashboard', 'Track safety objectives, SPI trends, NASP actions and responsible sections.') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'supports monitoring' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: 'No automatic state safety determination', tone: 'neutral' }
    ]) + objectives;
}

/* A finding row for list views. Shows owner, due date, status, next action. */
function findingRow(f) {
  var d = dueInfo(f);
  var due = f.status === 'CLOSED'
    ? 'Closed ' + fmtDate(f.closedDate)
    : fmtDate(f.dueDate) + (d.label !== '—' ? ' · ' + d.label : '');
  var dueCls = d.overdue ? 'style="color:var(--danger);font-weight:600"' : (d.dueSoon ? 'style="color:var(--warn);font-weight:600"' : '');
  var pa = primaryActionFor(f);
  return '' +
    '<div class="list__row" data-act="nav" data-view="finding" data-id="' + f.id + '">' +
      '<div class="list__main">' +
        '<div class="list__title">' +
          '<span class="tag-pill">' + esc(f.id) + '</span> ' + esc(f.title) +
        '</div>' +
        '<div class="list__meta">' +
          '<span>' + severityHtml(f) + '</span>' +
          '<span><b>Owner:</b> ' + esc(ownerLabel(f)) + '</span>' +
          (state.role !== 'auditee' ? '<span><b>Org:</b> ' + esc(orgName(f.orgId)) + '</span>' : '') +
          '<span ' + dueCls + '><b>Due:</b> ' + esc(due) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="list__side">' +
        statusBadge(f) +
        '<button class="' + pa.cls + ' btn--sm" data-act="' + pa.action + '" data-id="' + f.id + '">' + esc(pa.label) + '</button>' +
      '</div>' +
    '</div>';
}

/* Lifecycle stepper for a finding. */
function lifecycleStepper(f) {
  var reached = statusMeta(f).step;
  var html = '<div class="stepper">';
  for (var i = 0; i < LIFECYCLE_STEPS.length; i++) {
    var cls = '';
    if (i <= reached) cls = 'done';
    else if (i === reached + 1) cls = 'current';
    var inner = (i <= reached) ? '✓' : (i + 1);
    html += '<div class="step ' + cls + '">' +
      '<div class="step__dot">' + inner + '</div>' +
      '<div class="step__label">' + esc(LIFECYCLE_STEPS[i]) + '</div>' +
    '</div>';
  }
  html += '</div>';
  return html;
}

function nextActionBar(f) {
  if (f.status === 'CLOSED') {
    return '<div class="nextbar" style="background:var(--ok-bg);border-color:#bfe6d0">' +
      '<div class="nextbar__icon">✅</div>' +
      '<div class="nextbar__txt"><b>Finding closed.</b> Closed on ' + esc(fmtDate(f.closedDate)) +
      ' after evidence acceptance.</div>' +
      '<button class="btn btn--sm" data-act="nav" data-view="report" data-id="' + f.id + '">View report</button>' +
    '</div>';
  }
  var pa = primaryActionFor(f);
  return '<div class="nextbar">' +
    '<div class="nextbar__icon">➡️</div>' +
    '<div class="nextbar__txt"><b>Next action:</b> ' + esc(nextActionLabel(f)) +
    ' &nbsp;·&nbsp; <b>Owner:</b> ' + esc(ownerLabel(f)) + '</div>' +
    '<button class="' + pa.cls + '" data-act="' + pa.action + '" data-id="' + f.id + '">' + esc(pa.label) + '</button>' +
  '</div>';
}

/* =========================== Manager dashboard =========================== */
function viewManagerDashboard() {
  var k = computeKpis();
  var ohi = computeOHI();
  var needsAttention = state.findings.filter(function (f) {
    return f.status !== 'CLOSED' && (f.severity === 1 || dueInfo(f).overdue);
  });
  var notStarted = state.audits.filter(function (a) { return a.status === 'Planned'; });

  var ohiComponents = ohi.components.map(function (c) {
    return '<div class="row-between small" style="padding:3px 0">' +
      '<span class="muted">' + esc(c.label) + ' <span class="tag-pill">' + c.weight + '%</span></span>' +
      '<b>' + c.value + '</b></div>';
  }).join('');

  var attentionRows = needsAttention.length ? needsAttention.map(function (f) {
    var d = dueInfo(f);
    return '<div class="list__row" data-act="nav" data-view="finding" data-id="' + f.id + '">' +
      '<div class="list__main"><div class="list__title"><span class="tag-pill">' + esc(f.id) + '</span> ' + esc(f.title) + '</div>' +
      '<div class="list__meta"><span>' + severityHtml(f) + '</span><span><b>Org:</b> ' + esc(orgName(f.orgId)) + '</span>' +
      '<span><b>Owner:</b> ' + esc(ownerLabel(f)) + '</span></div></div>' +
      '<div class="list__side">' + statusBadge(f) + (d.overdue ? '' : '') + '</div></div>';
  }).join('') : '<div class="empty">No critical or overdue findings right now.</div>';

  return '' +
    pageHead('Manager Dashboard', 'Where are we exposed, delayed or overloaded?') +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Open Findings', k.openFindings, 'Across all organizations', { view: 'findings', filter: 'open' }) +
      kpiCard('Overdue Findings', k.overdueFindings, 'Past due date', { tone: k.overdueFindings ? 'danger' : 'ok', view: 'findings', filter: 'overdue' }) +
      kpiCard('Critical Findings', k.criticalFindings, 'Level 1 Critical, open', { tone: k.criticalFindings ? 'danger' : 'ok', view: 'findings', filter: 'critical' }) +
    '</div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card">' +
          '<div class="card__head"><h3>Needs Attention</h3><span class="sub">Critical or overdue findings, management view</span></div>' +
          '<div class="list">' + attentionRows + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card__head"><h3>2026 Surveillance Plan</h3><div class="spacer"></div>' +
            '<button class="btn btn--sm" data-act="nav" data-view="calendar">Open plan calendar</button></div>' +
          '<div class="card__body">' +
            '<div class="row-between mb-8"><span class="muted small">Plan completion</span><b>' + k.completedAudits + ' of ' + k.plannedAudits + ' audits</b></div>' +
            '<div class="progress"><div class="progress__bar" style="width:' + k.planCompletion + '%"></div></div>' +
            '<div class="grid grid--3 mt-16">' +
              kpiCard('Plan Completion', k.planCompletion + '%', 'Completed / planned') +
              kpiCard('Avg Closure Time', k.avgClosure + ' days', 'Across closed findings') +
              kpiCard('Closed Findings', k.closedFindings, 'Resolved this cycle') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card">' +
          '<div class="card__head"><h3>Oversight Health Index</h3></div>' +
          '<div class="card__body">' +
            '<div class="ohi">' +
              '<div class="ohi__ring" style="--val:' + ohi.score + ';--col:' + ohi.color + '"><span class="ohi__num">' + ohi.score + '</span></div>' +
              '<div class="ohi__meta"><div class="ohi__band" style="color:' + ohi.color + '">' + esc(ohi.band) + '</div>' +
              '<div class="ohi__note">Management indicator only. It does not trigger automatic enforcement, suspension or closure.</div></div>' +
            '</div>' +
            '<div class="divider"></div>' + ohiComponents +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card__head"><h3>Audits Not Started</h3></div>' +
          '<div class="card__body">' +
            (notStarted.length ? notStarted.map(function (a) {
              return '<div class="row-between small" style="padding:5px 0;cursor:pointer" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">' +
                '<span><b>' + esc(orgName(a.orgId)) + '</b> · ' + esc(a.type) + '</span>' +
                '<span class="muted">' + esc(fmtDate(a.date)) + '</span></div>';
            }).join('') : '<div class="muted small">All planned audits have started.</div>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* =========================== Inspector dashboard =========================== */
function viewInspectorDashboard() {
  var me = ROLES.inspector.user;
  var todays = state.audits.filter(function (a) { return a.date === DEMO_TODAY; });
  var inProgress = state.audits.filter(function (a) { return a.status === 'In Progress'; });
  var capReview = state.findings.filter(function (f) { return f.status === 'CAP_SUBMITTED'; });
  var evReview = state.findings.filter(function (f) { return f.status === 'EVIDENCE_SUBMITTED'; });
  var open = state.findings.filter(function (f) { return f.status !== 'CLOSED'; });
  var dueSoon = open.filter(function (f) { return dueInfo(f).dueSoon; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });

  var todaysHtml = todays.length ? todays.map(function (a) {
    var label = a.checklistStarted ? 'Continue checklist' : 'Start inspection';
    return '<div class="list__row" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">' +
      '<div class="list__main"><div class="list__title">' + esc(a.ref) + ' — ' + esc(orgName(a.orgId)) + '</div>' +
      '<div class="list__meta"><span><b>Domain:</b> ' + esc(a.domain) + '</span><span><b>Mode:</b> ' + esc(a.mode) + '</span>' +
      '<span><b>Lead:</b> ' + esc(a.lead) + '</span></div></div>' +
      '<div class="list__side"><span class="badge badge--info"><span class="dot"></span>' + esc(a.status) + '</span>' +
      '<button class="btn btn--primary btn--sm" data-act="' + (a.checklistStarted ? 'nav' : 'start-checklist') + '"' +
        (a.checklistStarted ? ' data-view="checklist" ' : ' ') + 'data-id="' + a.id + '">' + esc(label) + '</button></div></div>';
  }).join('') : '<div class="empty">No inspections scheduled for today.</div>';

  var queueHtml = function (arr, emptyTxt) {
    if (!arr.length) return '<div class="empty">' + esc(emptyTxt) + '</div>';
    return arr.map(findingRow).join('');
  };

  return '' +
    pageHead('Inspector Dashboard', 'What do I need to inspect or review today?') +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard("Today's Inspections", todays.length, 'Scheduled for ' + fmtDate(DEMO_TODAY), { view: 'calendar' }) +
      kpiCard('CAPs Waiting Review', capReview.length, 'Submitted by auditees', { tone: capReview.length ? 'warn' : 'ok', view: 'findings', filter: 'capreview' }) +
      kpiCard('Evidence Waiting Review', evReview.length, 'Awaiting your decision', { tone: evReview.length ? 'warn' : 'ok', view: 'findings', filter: 'evreview' }) +
    '</div>' +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Checklists In Progress', inProgress.length, 'Audits underway', { view: 'calendar' }) +
      kpiCard('Due Soon', dueSoon.length, 'Findings due within 7 days', { tone: dueSoon.length ? 'warn' : 'ok', view: 'findings', filter: 'duesoon' }) +
      kpiCard('Overdue', overdue.length, 'Past due date', { tone: overdue.length ? 'danger' : 'ok', view: 'findings', filter: 'overdue' }) +
    '</div>' +
    '<div class="card mb-16">' +
      '<div class="card__head"><h3>Today\'s Inspections</h3><div class="spacer"></div>' +
        '<button class="btn btn--sm" data-act="nav" data-view="calendar">Audit plan</button></div>' +
      '<div class="list">' + todaysHtml + '</div>' +
    '</div>' +
    '<div class="grid grid--2">' +
      '<div class="card"><div class="card__head"><h3>CAPs Waiting Review</h3></div><div class="list">' +
        queueHtml(capReview, 'No CAPs waiting for review.') + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Evidence Waiting Review</h3></div><div class="list">' +
        queueHtml(evReview, 'No evidence waiting for review.') + '</div></div>' +
    '</div>';
}

/* =========================== Auditee — My Findings =========================== */
function viewAuditeeMyFindings() {
  var mine = visibleFindings();
  var open = mine.filter(function (f) { return f.status !== 'CLOSED'; });
  var capReq = mine.filter(function (f) { return f.status === 'WAITING_CAP' || f.status === 'CAP_MORE_INFO'; });
  var evReq = mine.filter(function (f) { return f.status === 'EVIDENCE_REQUIRED' || f.status === 'EVIDENCE_MORE_INFO'; });
  var dueSoon = open.filter(function (f) { return dueInfo(f).dueSoon; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });
  var closed = mine.filter(function (f) { return f.status === 'CLOSED'; });

  var rows = mine.length ? mine.map(findingRow).join('') : '<div class="empty">Your organization has no open findings. Nothing is required right now.</div>';

  return '' +
    pageHead('My Findings — ' + ROLES.auditee.orgName, 'What does the CAA need from my organization?') +
    '<div class="scope-note">🔒 You are viewing only ' + esc(ROLES.auditee.orgName) + ' data. Internal CAA notes, inspector workload and other organizations are not shown.</div>' +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('My Open Findings', open.length, 'Need a response or are in review') +
      kpiCard('CAP Required', capReq.length, 'Submit a corrective action plan', { tone: capReq.length ? 'warn' : 'ok' }) +
      kpiCard('Evidence Required', evReq.length, 'Upload proof of completion', { tone: evReq.length ? 'warn' : 'ok' }) +
    '</div>' +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Due Soon', dueSoon.length, 'Within 7 days', { tone: dueSoon.length ? 'warn' : 'ok' }) +
      kpiCard('Overdue', overdue.length, 'Past target date', { tone: overdue.length ? 'danger' : 'ok' }) +
      kpiCard('Closed', closed.length, 'Resolved findings') +
    '</div>' +
    '<div class="card"><div class="card__head"><h3>All My Findings</h3><span class="sub">Each shows owner, due date, status and next action</span></div>' +
      '<div class="list">' + rows + '</div></div>';
}

/* =========================== Audit Plan Calendar =========================== */
function viewCalendar() {
  var byMonth = {};
  for (var i = 0; i < 12; i++) byMonth[i] = [];
  state.audits.forEach(function (a) {
    var m = parseInt(a.date.split('-')[1], 10) - 1;
    byMonth[m].push(a);
  });
  var cells = '';
  for (var mo = 0; mo < 12; mo++) {
    var evs = byMonth[mo].sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (a) {
      var cls = isClosedAudit(a) ? 'is-done' : (a.status === 'In Progress' ? 'is-progress' : '');
      return '<div class="cal-event ' + cls + '" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">' +
        '<b>' + esc(orgName(a.orgId)) + '</b>' +
        '<span>' + esc(a.type) + ' · ' + esc(a.date.split('-')[2]) + ' ' + MONTHS[mo] + ' · ' + esc(a.status) + '</span></div>';
    }).join('');
    cells += '<div class="cal__month"><div class="cal__mname">' + MONTHS_LONG[mo] + ' 2026</div>' +
      '<div class="cal__events">' + (evs || '<div class="cal__empty">No audits planned</div>') + '</div></div>';
  }
  var purpose = state.role === 'manager' ? 'The 2026 surveillance plan across all organizations.' : 'Your assigned audits across the 2026 plan.';
  var legend = '<span class="badge badge--info"><span class="dot"></span>Planned / Scheduled</span> ' +
               '<span class="badge badge--warn"><span class="dot"></span>In Progress</span> ' +
               '<span class="badge badge--ok"><span class="dot"></span>Completed</span>';
  var actions = legend;
  if (state.role === 'manager' || state.role === 'inspector') {
    actions += ' <button class="btn btn--primary btn--sm" data-act="new-audit">+ New Audit</button>';
  }
  return pageHead(state.role === 'manager' ? '2026 Surveillance Plan' : 'Audit Plan Calendar', purpose, actions) +
    '<div class="cal">' + cells + '</div>';
}

/* =========================== Audit Detail =========================== */
function viewAuditDetail() {
  var a = auditById(state.params.auditId);
  if (!a) return pageHead('Audit not found', '') + '<div class="empty">This audit could not be found.</div>';
  var auditFindings = state.findings.filter(function (f) { return f.auditId === a.id; });
  var canRun = (state.role === 'inspector') && (a.status === 'Scheduled' || a.status === 'In Progress' || a.status === 'Planned');
  var runLabel = a.checklistStarted ? 'Continue checklist' : 'Start checklist';

  var actions = '';
  if (canRun) {
    actions = '<button class="btn btn--primary" data-act="' + (a.checklistStarted ? 'nav' : 'start-checklist') + '"' +
      (a.checklistStarted ? ' data-view="checklist"' : '') + ' data-id="' + a.id + '">' + esc(runLabel) + '</button>';
  }

  var findingsHtml = auditFindings.length
    ? '<div class="list">' + auditFindings.map(findingRow).join('') + '</div>'
    : '<div class="empty">No findings raised from this audit yet.</div>';

  return '' +
    pageHead(a.ref + ' — ' + orgName(a.orgId), 'Operator Audit overview and checklist entry point.', actions) +
    '<div class="grid grid--main">' +
      '<div class="card">' +
        '<div class="card__head"><h3>Audit Details</h3><div class="spacer"></div>' +
          '<span class="badge badge--info"><span class="dot"></span>' + esc(a.status) + '</span></div>' +
        '<div class="card__body">' +
          '<div class="metaline">' +
            metaItem('Organization', orgName(a.orgId)) +
            metaItem('Audit type', a.type) +
            metaItem('Domain', a.domain) +
            metaItem('Date', fmtDate(a.date)) +
            metaItem('Mode', a.mode) +
            metaItem('Location', a.location) +
            metaItem('Lead inspector', a.lead) +
            metaItem('Team', a.team.join(', ')) +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="row-between"><div><div class="metaline__k">Checklist template</div>' +
          '<div class="metaline__v">' + esc(state.checklist.name) + ' · ' + esc(state.checklist.version) + '</div></div>' +
          (canRun ? '<button class="btn btn--primary" data-act="' + (a.checklistStarted ? 'nav' : 'start-checklist') + '"' +
            (a.checklistStarted ? ' data-view="checklist"' : '') + ' data-id="' + a.id + '">' + esc(runLabel) + '</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card"><div class="card__head"><h3>Findings from this audit</h3></div>' + findingsHtml + '</div>' +
    '</div>';
}

function metaItem(k, v) {
  return '<div class="metaline__item"><div class="metaline__k">' + esc(k) + '</div><div class="metaline__v">' + esc(v) + '</div></div>';
}

/* =========================== Checklist Runner =========================== */
function viewChecklistRunner() {
  var a = auditById(state.params.auditId);
  if (!a) return pageHead('Audit not found', '') + '<div class="empty">This audit could not be found.</div>';
  var tpl = state.checklist;
  var answers = state.checklistAnswers;
  var answered = Object.keys(answers).filter(function (q) { return answers[q] && answers[q].answer; }).length;
  var pct = Math.round((answered / tpl.items.length) * 100);

  var itemsHtml = tpl.items.map(function (it, idx) {
    var ans = answers[it.id] || {};
    var sel = ans.answer || '';
    function aBtn(val, label, selCls) {
      return '<button class="answer ' + (sel === val ? selCls : '') + '" data-act="answer" data-q="' + it.id + '" data-val="' + val + '">' + esc(label) + '</button>';
    }
    var flagged = sel === 'noncompliant';
    var noteHtml = '';
    if (flagged) {
      if (ans.findingId) {
        noteHtml = '<div class="cl-finding-note"><span>⚑</span><div>Finding <b>' + esc(ans.findingId) + '</b> created from this item. ' +
          '<a data-act="nav" data-view="finding" data-id="' + ans.findingId + '" style="cursor:pointer">Open finding →</a></div></div>';
      } else {
        noteHtml = '<div class="cl-finding-note"><span>⚑</span><div>Marked <b>Non-Compliant</b>. This requires a finding.' +
          '</div><button class="btn btn--danger btn--sm" style="margin-left:auto" data-act="create-finding" data-q="' + it.id + '" data-id="' + a.id + '">Create Finding</button></div>';
      }
    }
    return '<div class="cl-item' + (flagged ? ' flagged' : '') + '">' +
      '<div class="cl-item__head">' +
        '<div class="cl-item__num">' + (idx + 1) + '</div>' +
        '<div style="flex:1"><div class="cl-item__q">' + esc(it.text) + '</div>' +
          '<div class="cl-item__refs">' +
            '<span><b>Regulatory reference:</b> ' + esc(it.ref) + '</span>' +
            '<span><b>Expected evidence:</b> ' + esc(it.evidence) + '</span>' +
          '</div>' +
          regulatoryTraceHtml(regulatoryTraceForQuestion(it.id), true) +
        '</div>' +
      '</div>' +
      '<div class="cl-item__body">' +
        '<div class="answers">' +
          aBtn('compliant', 'Compliant', 'sel-compliant') +
          aBtn('noncompliant', 'Non-Compliant', 'sel-noncompliant') +
          aBtn('observation', 'Observation', 'sel-observation') +
          aBtn('na', 'Not Applicable', 'sel-na') +
        '</div>' + noteHtml +
      '</div>' +
    '</div>';
  }).join('');

  return '' +
    pageHead('Checklist Runner — ' + tpl.name, orgName(a.orgId) + ' · ' + a.ref + ' · ' + tpl.version,
      '<button class="btn" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">Back to audit</button>') +
    '<div class="card mb-16"><div class="card__body">' +
      '<div class="row-between mb-8"><span class="muted small">Progress</span><b>' + answered + ' of ' + tpl.items.length + ' answered</b></div>' +
      '<div class="progress"><div class="progress__bar" style="width:' + pct + '%"></div></div>' +
      '<div class="callout mt-12">Mark <b>Are crew training records complete and up to date?</b> as <b>Non-Compliant</b> to raise a finding, as in the demo scenario.</div>' +
    '</div></div>' +
    itemsHtml;
}

/* =========================== Finding Detail =========================== */
function viewFinding() {
  var f = findingById(state.params.findingId);
  if (!f) return pageHead('Finding not found', '') + '<div class="empty">This finding could not be found.</div>';
  var isAuditee = state.role === 'auditee';

  /* CAP block */
  var capHtml;
  if (f.cap) {
    capHtml =
      '<div class="metaline">' +
        metaItem('Root cause', f.cap.rootCause) +
        metaItem('Corrective action', f.cap.correctiveAction) +
        metaItem('Preventive action', f.cap.preventiveAction) +
        metaItem('Responsible person', f.cap.responsible) +
        metaItem('Target completion date', fmtDate(f.cap.targetDate)) +
        metaItem('CAP status', f.cap.status) +
      '</div>';
  } else {
    capHtml = '<div class="empty">No CAP submitted yet.' + (isAuditee ? ' Use “Submit CAP”.' : ' Waiting for the auditee.') + '</div>';
  }

  /* Evidence block (version history preserved) */
  var evHtml;
  if (f.evidence && f.evidence.length) {
    evHtml = f.evidence.map(function (e) {
      var bcls = e.status === 'Accepted' ? 'ok' : e.status === 'Rejected' ? 'danger' : 'info';
      return '<div class="filechip"><div class="filechip__icon">PDF</div>' +
        '<div style="flex:1"><div class="filechip__name">' + esc(e.fileName) + '</div>' +
        '<div class="filechip__meta">Version ' + e.version + ' · ' + esc(e.size) + ' · uploaded ' + esc(fmtDate(e.uploadedDate)) + '</div></div>' +
        '<span class="badge badge--' + bcls + '"><span class="dot"></span>' + esc(e.status) + '</span></div>';
    }).join('');
  } else {
    evHtml = '<div class="empty">No evidence uploaded yet.</div>';
  }

  /* Comments to auditee (visible to all) */
  var commentsHtml = (f.commentsToAuditee && f.commentsToAuditee.length)
    ? f.commentsToAuditee.map(function (c) {
        return '<div class="note-auditee mb-8"><div class="tag">Comment to Auditee</div>' + esc(c.text) +
          '<div class="muted small mt-12">' + esc(c.author) + ' · ' + esc(fmtDate(c.date)) + '</div></div>';
      }).join('')
    : '<div class="muted small">No comments to auditee yet.</div>';

  /* Internal CAA notes — NEVER shown to auditee */
  var internalHtml = '';
  if (!isAuditee) {
    internalHtml = '<div class="card mt-16"><div class="card__head"><h3>Internal CAA Notes</h3>' +
      '<span class="sub">Not visible to the auditee</span></div><div class="card__body">' +
      ((f.internalNotes && f.internalNotes.length)
        ? f.internalNotes.map(function (n) {
            return '<div class="note-internal mb-8"><div class="tag">Internal CAA Note</div>' + esc(n.text) +
              '<div class="muted small mt-12">' + esc(n.author) + ' · ' + esc(fmtDate(n.date)) + '</div></div>';
          }).join('')
        : '<div class="muted small">No internal notes recorded.</div>') +
      '</div></div>';
  }

  /* Related audit-log entries */
  var logEntries = state.auditLog.filter(function (l) { return l.target === f.id; });
  var logHtml = logEntries.length
    ? '<div class="timeline">' + logEntries.map(function (l) {
        return '<div class="tl-item"><div class="tl-item__time">' + esc(l.time) + '</div>' +
          '<div class="tl-item__txt"><b>' + esc(l.action) + '</b></div>' +
          '<div class="tl-item__actor">' + esc(l.actor) + '</div></div>';
      }).join('') + '</div>'
    : '<div class="muted small">No audit-log entries yet.</div>';

  var d = dueInfo(f);
  var dueDisplay = f.status === 'CLOSED' ? 'Closed ' + fmtDate(f.closedDate) : fmtDate(f.dueDate) + (d.label !== '—' ? ' (' + d.label + ')' : '');

  /* CAA-only actions on an open finding: reminder (when the auditee owes a
     response) and authorized closure (explicit, audit-logged). */
  var authClose = '';
  if (!isAuditee && f.status !== 'CLOSED') {
    var ownerIsAuditee = statusMeta(f).ownerRole === 'auditee';
    var reminderBtn = ownerIsAuditee
      ? '<button class="btn btn--sm" data-act="send-reminder" data-id="' + f.id + '">⏰ Send reminder to auditee</button>' : '';
    authClose = '<div class="callout row-between mb-16" style="border-style:dashed">' +
      '<span>⚖️ <b>CAA actions</b> — nudge the auditee with a traceable reminder, or close this finding ' +
      'without evidence under an authorized closure (reason required, recorded in the audit trail).</span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap">' + reminderBtn +
      '<button class="btn btn--danger btn--sm" data-act="authclose" data-id="' + f.id + '">Authorized closure…</button></span></div>';
  }

  return '' +
    pageHead('Finding ' + f.id, esc(f.title),
      '<button class="btn" data-act="nav" data-view="' + (isAuditee ? 'my-findings' : 'findings') + '">Back to findings</button>') +
    nextActionBar(f) +
    authClose +
    '<div class="card mb-16"><div class="card__head"><h3>Lifecycle</h3>' +
      '<span class="sub">CAP accepted is not closure — a finding closes only after evidence is accepted</span></div>' +
      '<div class="card__body">' + lifecycleStepper(f) + '</div></div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Finding Details</h3></div><div class="card__body">' +
          '<div class="metaline">' +
            metaItem('Status', statusMeta(f).label) +
            metaItem('Severity', SEVERITY[f.severity].label) +
            metaItem('Current owner', ownerLabel(f)) +
            metaItem('Next action', nextActionLabel(f)) +
            metaItem('Due Date', dueDisplay) +
            metaItem('Organization', orgName(f.orgId)) +
            metaItem('Related audit', f.auditId || '—') +
            metaItem('Responsible person', f.responsiblePerson || '—') +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="metaline__k">Description</div><div class="mt-12">' + esc(f.description) + '</div>' +
          '<div class="metaline__k mt-16">Finding basis / regulatory reference</div>' +
          '<div class="mt-12 small muted">' + esc(f.reference) + ' · ' + esc(f.basis) + '</div>' +
          regulatoryTraceHtml(regulatoryTraceForFinding(f), true) +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Corrective Action Plan (CAP)</h3><div class="spacer"></div>' +
          (isAuditee && (f.status === 'WAITING_CAP' || f.status === 'CAP_MORE_INFO')
            ? '<button class="btn btn--primary btn--sm" data-act="cap" data-id="' + f.id + '">Submit CAP</button>' : '') +
          ((!isAuditee && f.status === 'CAP_SUBMITTED')
            ? '<button class="btn btn--primary btn--sm" data-act="reviewcap" data-id="' + f.id + '">Review CAP</button>' : '') +
          '</div><div class="card__body">' + capHtml + '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Evidence</h3>' +
          '<span class="sub">Version history is preserved</span><div class="spacer"></div>' +
          (isAuditee && (f.status === 'EVIDENCE_REQUIRED' || f.status === 'EVIDENCE_MORE_INFO')
            ? '<button class="btn btn--primary btn--sm" data-act="evidence" data-id="' + f.id + '">Upload evidence</button>' : '') +
          ((!isAuditee && f.status === 'EVIDENCE_SUBMITTED')
            ? '<button class="btn btn--primary btn--sm" data-act="reviewev" data-id="' + f.id + '">Review evidence</button>' : '') +
          '</div><div class="card__body">' + evHtml + '</div></div>' +
        internalHtml +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Comments to Auditee</h3></div><div class="card__body">' + commentsHtml + '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Audit Trail</h3></div><div class="card__body">' + logHtml + '</div></div>' +
      '</div>' +
    '</div>';
}

/* =========================== Findings list (manager/inspector) =========================== */
var FILTER_LABELS = {
  all: 'All Findings', open: 'Open Findings', overdue: 'Overdue Findings', critical: 'Critical Findings',
  closed: 'Closed Findings', capreview: 'CAPs Waiting Review', evreview: 'Evidence Waiting Review', duesoon: 'Findings Due Soon'
};

function filterFindings(filter) {
  var f = visibleFindings();
  switch (filter) {
    case 'open': return f.filter(function (x) { return x.status !== 'CLOSED'; });
    case 'overdue': return f.filter(function (x) { return dueInfo(x).overdue; });
    case 'critical': return f.filter(function (x) { return x.severity === 1 && x.status !== 'CLOSED'; });
    case 'closed': return f.filter(function (x) { return x.status === 'CLOSED'; });
    case 'capreview': return f.filter(function (x) { return x.status === 'CAP_SUBMITTED'; });
    case 'evreview': return f.filter(function (x) { return x.status === 'EVIDENCE_SUBMITTED'; });
    case 'duesoon': return f.filter(function (x) { return dueInfo(x).dueSoon; });
    default: return f;
  }
}

function viewFindings() {
  var filter = state.params.filter || 'all';
  var list = filterFindings(filter);
  var chips = ['all', 'open', 'overdue', 'critical', 'closed'].map(function (key) {
    return '<button class="btn btn--sm' + (filter === key ? ' btn--primary' : '') + '" data-act="nav" data-view="findings" data-filter="' + key + '">' +
      esc(FILTER_LABELS[key]) + '</button>';
  }).join(' ');
  var rows = list.length ? list.map(findingRow).join('') : '<div class="empty">No findings match this filter.</div>';
  return pageHead('Findings', 'Every finding shows owner, due date, status and next action.', chips) +
    '<div class="card"><div class="card__head"><h3>' + esc(FILTER_LABELS[filter]) + '</h3>' +
    '<span class="sub">' + list.length + ' finding' + (list.length === 1 ? '' : 's') + '</span></div>' +
    '<div class="list">' + rows + '</div></div>';
}

/* =========================== Reports list =========================== */
function viewReports() {
  var closed = visibleFindings().filter(function (f) { return f.status === 'CLOSED'; });
  var rows = closed.length ? closed.map(function (f) {
    return '<div class="list__row" data-act="nav" data-view="report" data-id="' + f.id + '">' +
      '<div class="list__main"><div class="list__title"><span class="tag-pill">' + esc(f.id) + '</span> ' + esc(f.title) + '</div>' +
      '<div class="list__meta"><span><b>Org:</b> ' + esc(orgName(f.orgId)) + '</span><span><b>Closed:</b> ' + esc(fmtDate(f.closedDate)) + '</span></div></div>' +
      '<div class="list__side"><span class="badge badge--ok"><span class="dot"></span>Closed</span>' +
      '<button class="btn btn--sm" data-act="nav" data-view="report" data-id="' + f.id + '">Open report</button></div></div>';
  }).join('') : '<div class="empty">No closed findings to report yet.</div>';
  return pageHead('Reports', 'Generated closure reports (preview only).') +
    '<div class="card"><div class="card__head"><h3>Closure Reports</h3></div><div class="list">' + rows + '</div></div>';
}

/* =========================== Closed Finding / Report Preview =========================== */
function viewReport() {
  var f = findingById(state.params.findingId);
  if (!f) return pageHead('Report not found', '') + '<div class="empty">Report could not be generated.</div>';
  var closedBadge = f.status === 'CLOSED'
    ? '<div class="report__stamp">✔ CLOSED — ' + esc(fmtDate(f.closedDate)) + '</div>'
    : '<span class="badge badge--info">' + esc(statusMeta(f).label) + '</span>';
  var evRows = (f.evidence || []).map(function (e) {
    return '<dt>' + esc(e.fileName) + '</dt><dd>v' + e.version + ' · ' + esc(e.status) + ' · ' + esc(fmtDate(e.uploadedDate)) + '</dd>';
  }).join('') || '<dt>Evidence</dt><dd>None recorded</dd>';

  return '' +
    pageHead('Finding Report — ' + f.id, 'Report preview (mock — not a legally issued document).',
      '<button class="btn" data-act="nav" data-view="' + (state.role === 'auditee' ? 'my-findings' : 'reports') + '">Back</button>' +
      '<button class="btn btn--primary" data-act="mock-export" data-id="' + f.id + '">Export PDF (mock)</button>') +
    '<div class="report"><div class="report__sheet">' +
      '<div class="report__head"><div class="report__seal">A360</div>' +
        '<div style="flex:1"><div class="report__org">Civil Aviation Authority · AviaSurveil360</div>' +
        '<h2 class="report__title">Finding Closure Report</h2>' +
        '<div class="small muted">Generated ' + esc(fmtDate(DEMO_TODAY)) + ' · Reference ' + esc(f.id) + '</div></div>' +
        closedBadge + '</div>' +
      '<div class="report__section"><h4>Finding Summary</h4><dl class="report__kv">' +
        '<dt>Finding ID</dt><dd>' + esc(f.id) + '</dd>' +
        '<dt>Title</dt><dd>' + esc(f.title) + '</dd>' +
        '<dt>Organization</dt><dd>' + esc(orgName(f.orgId)) + '</dd>' +
        '<dt>Severity</dt><dd>' + esc(SEVERITY[f.severity].label) + '</dd>' +
        '<dt>Related audit</dt><dd>' + esc(f.auditId || '—') + '</dd>' +
        '<dt>Regulatory reference</dt><dd>' + esc(f.reference) + '</dd>' +
        '<dt>Issued</dt><dd>' + esc(fmtDate(f.issuedDate)) + '</dd>' +
        '<dt>Due Date</dt><dd>' + esc(fmtDate(f.dueDate)) + '</dd>' +
        (f.closedDate ? '<dt>Closed</dt><dd>' + esc(fmtDate(f.closedDate)) + '</dd>' : '') +
        (f.closureType ? '<dt>Closure basis</dt><dd>' + esc(f.closureType === 'evidence-accepted' ? 'Evidence accepted and verified' : 'Authorized closure (audit-logged)') + '</dd>' : '') +
      '</dl></div>' +
      (f.cap ? '<div class="report__section"><h4>Corrective Action Plan</h4><dl class="report__kv">' +
        '<dt>Root cause</dt><dd>' + esc(f.cap.rootCause) + '</dd>' +
        '<dt>Corrective action</dt><dd>' + esc(f.cap.correctiveAction) + '</dd>' +
        '<dt>Preventive action</dt><dd>' + esc(f.cap.preventiveAction) + '</dd>' +
        '<dt>Responsible</dt><dd>' + esc(f.cap.responsible) + '</dd>' +
        '<dt>Target date</dt><dd>' + esc(fmtDate(f.cap.targetDate)) + '</dd>' +
      '</dl></div>' : '') +
      '<div class="report__section"><h4>Evidence</h4><dl class="report__kv">' + evRows + '</dl></div>' +
      '<div class="report__section"><h4>Audit Trail</h4>' +
        (function () {
          var le = state.auditLog.filter(function (l) { return l.target === f.id; });
          if (!le.length) return '<div class="small muted">No audit-log entries.</div>';
          return '<dl class="report__kv">' + le.map(function (l) {
            return '<dt>' + esc(l.time) + '</dt><dd>' + esc(l.action) + ' — ' + esc(l.actor) + '</dd>';
          }).join('') + '</dl>';
        })() +
      '</div>' +
      '<div class="callout">This is a demo report preview. No real document is generated, stored or signed.</div>' +
    '</div></div>';
}

/* =========================== Auditee Messages =========================== */
function viewMessages() {
  var msgs = state.notifications.filter(function (n) { return n.role === 'auditee'; });
  var rows = msgs.length ? msgs.map(function (n) {
    return '<div class="notif-item ' + (n.unread ? 'unread' : '') + '"><div class="notif-item__icon">' + n.icon + '</div>' +
      '<div><div class="notif-item__txt">' + esc(n.text) + '</div><div class="notif-item__time">' + esc(n.time) + '</div></div></div>';
  }).join('') : '<div class="empty">No messages.</div>';
  return pageHead('Messages from the CAA', 'In-app notifications (mock — no real email or SMS is sent).') +
    '<div class="scope-note">🔒 Messages are limited to ' + esc(ROLES.auditee.orgName) + '.</div>' +
    '<div class="card">' + rows + '</div>';
}

/* =========================== Admin — Templates =========================== */
function viewTemplates() {
  var rows = state.templateLibrary.map(function (t) {
    var open = t.id === 'TPL-FOPS-2026';
    var badge = t.status === 'Published' ? 'ok' : 'neutral';
    return '<tr class="' + (open ? 'row-click' : '') + '"' + (open ? ' data-act="nav" data-view="template-preview" data-id="' + t.id + '"' : '') + '>' +
      '<td><b>' + esc(t.name) + '</b></td><td>' + esc(t.domain) + '</td><td>' + esc(t.version) + '</td>' +
      '<td>' + t.items + ' items</td>' +
      '<td><span class="badge badge--' + badge + '"><span class="dot"></span>' + esc(t.status) + '</span></td>' +
      '<td style="text-align:right">' + (open ? '<button class="btn btn--sm" data-act="nav" data-view="template-preview" data-id="' + t.id + '">Preview</button>' : '<span class="muted small">—</span>') + '</td></tr>';
  }).join('');
  return pageHead('Checklist Templates', 'Which template or rule must be configured? (Preview only.)') +
    '<div class="callout mb-16">Admin can configure templates and rules. In this demo only the <b>Flight Operations Audit</b> template is openable for preview.</div>' +
    '<div class="card card__body--flush"><table class="table"><thead><tr>' +
    '<th>Template</th><th>Domain</th><th>Version</th><th>Items</th><th>Status</th><th></th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
}

function viewTemplatePreview() {
  var tpl = state.checklist;
  var items = tpl.items.map(function (it, i) {
    return '<div class="cl-item"><div class="cl-item__head"><div class="cl-item__num">' + (i + 1) + '</div>' +
      '<div style="flex:1"><div class="cl-item__q">' + esc(it.text) + '</div>' +
      '<div class="cl-item__refs"><span><b>Regulatory reference:</b> ' + esc(it.ref) + '</span>' +
      '<span><b>Expected evidence:</b> ' + esc(it.evidence) + '</span></div>' +
      regulatoryTraceHtml(regulatoryTraceForQuestion(it.id), true) +
      '<div class="answers" style="opacity:.55;pointer-events:none">' +
        '<span class="answer">Compliant</span><span class="answer">Non-Compliant</span>' +
        '<span class="answer">Observation</span><span class="answer">Not Applicable</span></div>' +
      '</div></div></div>';
  }).join('');
  return pageHead('Template Preview — ' + tpl.name, 'Read-only preview of the published checklist template.',
    '<button class="btn" data-act="nav" data-view="templates">Back to templates</button>') +
    '<div class="card mb-16"><div class="card__body"><div class="metaline">' +
      metaItem('Template ID', tpl.id) + metaItem('Domain', tpl.domain) +
      metaItem('Version', tpl.version) + metaItem('Owner', tpl.owner) +
      metaItem('Items', String(tpl.items.length)) + metaItem('Status', 'Published') +
    '</div></div></div>' + items;
}

/* =========================== Admin — Audit Log =========================== */
function viewAuditLog() {
  var rows = state.auditLog.map(function (l) {
    return '<tr><td class="muted">' + esc(l.time) + '</td><td><b>' + esc(l.action) + '</b></td>' +
      '<td><span class="tag-pill">' + esc(l.target) + '</span></td><td>' + esc(l.actor) + '</td></tr>';
  }).join('');
  return pageHead('Audit Log', 'Critical actions are recorded for traceability (mock).') +
    '<div class="card card__body--flush"><table class="table"><thead><tr>' +
    '<th>Time</th><th>Action</th><th>Target</th><th>Actor</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* =========================== Organizations (registry) =========================== */
function orgStats(orgId) {
  var fs = state.findings.filter(function (f) { return f.orgId === orgId; });
  var open = fs.filter(function (f) { return f.status !== 'CLOSED'; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });
  var audits = state.audits.filter(function (a) { return a.orgId === orgId; });
  var done = audits.filter(isClosedAudit).map(function (a) { return a.date; }).sort();
  return { open: open.length, overdue: overdue.length, audits: audits.length, lastAudit: done.length ? done[done.length - 1] : null };
}

function viewOrganizations() {
  var rows = state.orgs.map(function (o) {
    var s = orgStats(o.id);
    return '<tr class="row-click" data-act="nav" data-view="org-detail" data-id="' + o.id + '">' +
      '<td><b>' + esc(o.name) + '</b></td><td>' + esc(o.type) + '</td>' +
      '<td>' + s.open + '</td>' +
      '<td>' + (s.overdue ? '<span class="badge badge--danger"><span class="dot"></span>' + s.overdue + '</span>' : '0') + '</td>' +
      '<td>' + (o.repeatFindings > 0 ? '<span class="badge badge--warn"><span class="dot"></span>' + o.repeatFindings + '</span>' : '<span class="muted">None</span>') + '</td>' +
      '<td>' + (s.lastAudit ? esc(fmtDate(s.lastAudit)) : '<span class="muted">—</span>') + '</td>' +
      '<td style="text-align:right"><button class="btn btn--sm" data-act="nav" data-view="org-detail" data-id="' + o.id + '">Open</button></td></tr>';
  }).join('');
  return pageHead('Organizations', 'Regulated organizations under surveillance.') +
    '<div class="card card__body--flush"><table class="table"><thead><tr>' +
    '<th>Organization</th><th>Type</th><th>Open findings</th><th>Overdue</th><th>Repeat findings</th><th>Last audit</th><th></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewOrgDetail() {
  var o = orgById(state.params.orgId);
  if (!o) return pageHead('Organization not found', '') + '<div class="empty">This organization could not be found.</div>';
  var s = orgStats(o.id);
  var audits = state.audits.filter(function (a) { return a.orgId === o.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var findings = state.findings.filter(function (f) { return f.orgId === o.id; });

  var auditRows = audits.length ? audits.map(function (a) {
    var cls = isClosedAudit(a) ? 'ok' : (a.status === 'In Progress' ? 'warn' : 'info');
    return '<div class="list__row" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">' +
      '<div class="list__main"><div class="list__title">' + esc(a.ref) + ' <span class="tag-pill">' + esc(a.id) + '</span></div>' +
      '<div class="list__meta"><span><b>Domain:</b> ' + esc(a.domain) + '</span><span><b>Date:</b> ' + esc(fmtDate(a.date)) + '</span></div></div>' +
      '<div class="list__side"><span class="badge badge--' + cls + '"><span class="dot"></span>' + esc(a.status) + '</span></div></div>';
  }).join('') : '<div class="empty">No audits for this organization.</div>';

  var findingRows = findings.length ? findings.map(findingRow).join('') : '<div class="empty">No findings for this organization.</div>';

  return pageHead(o.name, esc(o.type),
    '<button class="btn" data-act="nav" data-view="organizations">Back to organizations</button>') +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Open Findings', s.open, 'Currently open', { tone: s.open ? 'warn' : 'ok' }) +
      kpiCard('Overdue', s.overdue, 'Past due date', { tone: s.overdue ? 'danger' : 'ok' }) +
      kpiCard('Audits', s.audits, 'In the 2026 plan') +
    '</div>' +
    '<div class="card mb-16"><div class="card__body"><div class="metaline">' +
      metaItem('Organization', o.name) + metaItem('Type', o.type) +
      metaItem('Primary contact', o.contact) +
      metaItem('Repeat findings', o.repeatFindings > 0 ? String(o.repeatFindings) : 'None') +
      metaItem('Last completed audit', s.lastAudit ? fmtDate(s.lastAudit) : '—') +
    '</div></div></div>' +
    '<div class="grid grid--main">' +
      '<div class="card"><div class="card__head"><h3>Findings</h3></div><div class="list">' + findingRows + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Audits</h3></div><div class="list">' + auditRows + '</div></div>' +
    '</div>';
}

/* =========================== Admin — Users (read-only preview) =========================== */
function viewUsers() {
  var rows = SEED_USERS.map(function (u) {
    var badge = u.status === 'Active' ? 'ok' : 'warn';
    return '<tr><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.role) + '</td><td>' + esc(u.org) + '</td>' +
      '<td>' + esc(u.mfa) + '</td>' +
      '<td><span class="badge badge--' + badge + '"><span class="dot"></span>' + esc(u.status) + '</span></td></tr>';
  }).join('');
  return pageHead('Users', 'Who can access AviaSurveil360, and in which role.') +
    '<div class="callout mb-16">Preview only — user management, invitations and MFA are not editable in this demo. Internal users are expected to use MFA.</div>' +
    '<div class="card card__body--flush"><table class="table"><thead><tr>' +
    '<th>Name</th><th>Role</th><th>Organization</th><th>MFA</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* =========================== Admin — Settings (read-only preview) =========================== */
function viewSettings() {
  var ohi = computeOHI();
  var sevList = [SEVERITY[1], SEVERITY[2], SEVERITY[3], SEVERITY[0]].map(function (s) {
    return '<span class="badge badge--' + s.badge + '"><span class="dot"></span>' + esc(s.label) + '</span>';
  }).join(' ');
  var lifecycle = LIFECYCLE_STEPS.map(function (l, i) { return (i + 1) + '. ' + esc(l); }).join(' &nbsp;→&nbsp; ');
  var weights = ohi.components.map(function (c) {
    return '<div class="row-between small" style="padding:3px 0"><span class="muted">' + esc(c.label) + '</span><b>' + c.weight + '%</b></div>';
  }).join('');
  return pageHead('Settings', 'Configured rules and parameters (preview only).') +
    '<div class="callout mb-16">Preview only — these are read-only in the demo. They show the configured rules the product would manage, not editable controls.</div>' +
    '<div class="grid grid--2">' +
      '<div class="card"><div class="card__head"><h3>Severity scheme</h3></div><div class="card__body">' + sevList + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Finding lifecycle</h3></div><div class="card__body small">' + lifecycle + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Closure policy</h3></div><div class="card__body small">' +
        'A finding closes only after <b>required evidence is accepted</b>, or via an explicit <b>authorized closure</b> that is recorded in the audit trail. CAP acceptance alone does not close a finding.' +
      '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Due-date language</h3></div><div class="card__body">' +
        '<span class="badge badge--info"><span class="dot"></span>Due Date</span> ' +
        '<span class="badge badge--neutral"><span class="dot"></span>Target</span> ' +
        '<span class="badge badge--warn"><span class="dot"></span>Due Soon (≤ 7 days)</span> ' +
        '<span class="badge badge--danger"><span class="dot"></span>Overdue</span>' +
        '<div class="small muted mt-12">No heavy SLA module — simple due-date language only.</div>' +
      '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Oversight Health Index weights</h3><span class="sub">Indicator only</span></div><div class="card__body">' + weights + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Notifications</h3></div><div class="card__body small">' +
        'In-app reminders and notification cards only in this demo. No real email, SMS or messaging service is connected.' +
      '</div></div>' +
    '</div>';
}

/* =========================== Modals =========================== */
function modalShell(title, bodyHtml, footHtml, wide) {
  return '<div class="modal' + (wide ? ' modal--wide' : '') + '">' +
    '<div class="modal__head"><h3>' + esc(title) + '</h3>' +
    '<button class="modal__close" data-act="close-modal" aria-label="Close">×</button></div>' +
    '<div class="modal__body">' + bodyHtml + '</div>' +
    '<div class="modal__foot">' + footHtml + '</div></div>';
}

function modalCapForm(f) {
  var intro = 'Tell the CAA why this happened and how you will fix it. Plain language is fine.';
  var body =
    '<div class="modal__intro">📝 Finding <b>' + esc(f.id) + '</b> — ' + esc(f.title) + '. ' + esc(intro) + '</div>' +
    '<div class="form-row"><label>Why did this happen? <span class="req">*</span></label>' +
      '<div class="help">Root cause</div><textarea id="cap-root" placeholder="Describe the underlying reason."></textarea></div>' +
    '<div class="form-row"><label>What will you do to fix it? <span class="req">*</span></label>' +
      '<div class="help">Corrective action</div><textarea id="cap-corr" placeholder="The action that fixes the issue now."></textarea></div>' +
    '<div class="form-row"><label>What will you change so it does not happen again? <span class="req">*</span></label>' +
      '<div class="help">Preventive action</div><textarea id="cap-prev" placeholder="The change that prevents recurrence."></textarea></div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>Who is responsible? <span class="req">*</span></label>' +
        '<input type="text" id="cap-resp" placeholder="Name or role" value="Director of Flight Operations"></div>' +
      '<div class="form-row"><label>When will it be completed? <span class="req">*</span></label>' +
        '<div class="help">Target completion date</div><input type="date" id="cap-date" value="2026-07-15"></div>' +
    '</div>' +
    '<div class="form-row"><label>Upload evidence (optional now)</label>' +
      '<div class="help">You can also upload evidence later, after the CAP is accepted.</div>' +
      '<div class="filebox" data-act="mock-pick" data-target="cap-file"><div class="filebox__icon">📎</div>' +
      '<div>Click to attach a file (mock)</div><div class="filebox__hint">No real file is uploaded — the name is shown for the demo.</div></div>' +
      '<div id="cap-file"></div></div>';
  var foot = '<button class="btn" data-act="close-modal">Cancel</button>' +
    '<button class="btn btn--primary" data-act="submit-cap" data-id="' + f.id + '">Submit CAP</button>';
  return modalShell('Submit Corrective Action Plan', body, foot, true);
}

function modalEvidence(f) {
  var body =
    '<div class="modal__intro">📎 Finding <b>' + esc(f.id) + '</b>. Upload files that show the corrective action is complete. ' +
    'Expected: proof the crew training records are now complete and maintained.</div>' +
    '<div class="form-row"><label>Evidence file <span class="req">*</span></label>' +
      '<div class="filebox" data-act="mock-pick" data-target="ev-file"><div class="filebox__icon">📄</div>' +
      '<div>Click to select a file (mock)</div><div class="filebox__hint">Suggested: Training_Record_Updated.pdf</div></div>' +
      '<div id="ev-file"></div></div>' +
    '<div class="form-row"><label>Note to CAA (optional)</label>' +
      '<textarea id="ev-note" placeholder="Anything the inspector should know about this evidence."></textarea></div>';
  var foot = '<button class="btn" data-act="close-modal">Cancel</button>' +
    '<button class="btn btn--primary" data-act="submit-evidence" data-id="' + f.id + '">Upload evidence</button>';
  return modalShell('Upload Evidence', body, foot);
}

function modalReviewCap(f) {
  var c = f.cap || {};
  var body =
    '<div class="modal__intro">Review the auditee CAP for <b>' + esc(f.id) + '</b>. Accepting the CAP does <b>not</b> close the finding — evidence is still required.</div>' +
    '<div class="card mb-16"><div class="card__body"><div class="metaline">' +
      metaItem('Root cause', c.rootCause || '—') +
      metaItem('Corrective action', c.correctiveAction || '—') +
      metaItem('Preventive action', c.preventiveAction || '—') +
      metaItem('Responsible', c.responsible || '—') +
      metaItem('Target date', fmtDate(c.targetDate)) +
    '</div></div></div>' +
    '<div class="form-row"><label>Comment to Auditee</label>' +
      '<textarea id="cap-comment" placeholder="Visible to the auditee.">CAP accepted. Please upload evidence that the action is complete.</textarea></div>' +
    '<div class="form-row"><label>Internal CAA Note</label>' +
      '<div class="help">Not visible to the auditee.</div>' +
      '<textarea id="cap-internal" placeholder="Internal only."></textarea></div>';
  var foot =
    '<button class="btn btn--danger" data-act="cap-decision" data-id="' + f.id + '" data-decision="moreinfo">Request More Information</button>' +
    '<button class="btn btn--ok" data-act="cap-decision" data-id="' + f.id + '" data-decision="accept">Accept CAP</button>';
  return modalShell('Review CAP — ' + f.id, body, foot, true);
}

function modalReviewEvidence(f) {
  var latest = (f.evidence && f.evidence.length) ? f.evidence[f.evidence.length - 1] : null;
  var prev = (f.evidence || []).slice(0, -1);
  var body =
    '<div class="modal__intro">Review the submitted evidence for <b>' + esc(f.id) + '</b>. Accepting verified evidence will <b>close</b> the finding.</div>' +
    (latest
      ? '<div class="filechip mb-16"><div class="filechip__icon">PDF</div><div style="flex:1">' +
        '<div class="filechip__name">' + esc(latest.fileName) + '</div>' +
        '<div class="filechip__meta">Version ' + latest.version + ' · ' + esc(latest.size) + ' · uploaded ' + esc(fmtDate(latest.uploadedDate)) + '</div>' +
        '</div><span class="badge badge--info"><span class="dot"></span>' + esc(latest.status) + '</span></div>'
      : '<div class="empty">No evidence to review.</div>') +
    (prev.length ? '<div class="metaline__k">Previous versions (preserved)</div>' + prev.map(function (e) {
        return '<div class="filechip mt-12"><div class="filechip__icon">PDF</div><div style="flex:1">' +
          '<div class="filechip__name">' + esc(e.fileName) + '</div><div class="filechip__meta">Version ' + e.version + ' · ' + esc(e.status) + '</div></div></div>';
      }).join('') : '') +
    '<div class="form-row mt-16"><label>Comment to Auditee</label>' +
      '<textarea id="ev-comment" placeholder="Visible to the auditee.">Evidence reviewed and accepted. Finding closed. Thank you.</textarea></div>' +
    '<div class="form-row"><label>Internal CAA Note</label><div class="help">Not visible to the auditee.</div>' +
      '<textarea id="ev-internal" placeholder="Internal only.">Closure verified against expected evidence.</textarea></div>';
  var foot =
    '<button class="btn btn--danger" data-act="ev-decision" data-id="' + f.id + '" data-decision="moreinfo">Request More Information</button>' +
    '<button class="btn btn--ok" data-act="ev-decision" data-id="' + f.id + '" data-decision="accept">Accept Evidence & Close</button>';
  return modalShell('Review Evidence — ' + f.id, body, foot, true);
}

/* Issue-finding modal (from checklist Non-Compliant) */
function modalFindingForm(auditId, qId) {
  var a = auditById(auditId);
  var item = null;
  for (var i = 0; i < state.checklist.items.length; i++) if (state.checklist.items[i].id === qId) item = state.checklist.items[i];
  var nextId = 'OPS-2026-' + String(state.findingSeq).padStart(3, '0');
  var body =
    '<div class="modal__intro">A finding will be created from the Non-Compliant checklist item. Organization, audit and reference are prefilled.</div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>Finding ID</label><input type="text" id="fd-id" value="' + esc(nextId) + '" readonly></div>' +
      '<div class="form-row"><label>Organization</label><input type="text" value="' + esc(orgName(a.orgId)) + '" readonly></div>' +
    '</div>' +
    '<div class="form-row"><label>Title <span class="req">*</span></label>' +
      '<input type="text" id="fd-title" value="Crew training records incomplete"></div>' +
    '<div class="form-row"><label>Description <span class="req">*</span></label>' +
      '<textarea id="fd-desc">Sampled crew training records were incomplete and not up to date at the time of the audit.</textarea></div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>Severity</label><select id="fd-sev">' +
        '<option value="1">Level 1 Critical</option>' +
        '<option value="2" selected>Level 2 Major</option>' +
        '<option value="3">Level 3 Minor</option>' +
        '<option value="0">Observation</option></select></div>' +
      '<div class="form-row"><label>Due Date</label><input type="date" id="fd-due" value="2026-07-15"></div>' +
    '</div>' +
    '<div class="form-row"><label>Regulatory reference</label>' +
      '<input type="text" id="fd-ref" value="' + esc(item ? item.ref : '') + '" readonly></div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>CAP required</label><select id="fd-cap"><option selected>Yes</option><option>No</option></select></div>' +
      '<div class="form-row"><label>Evidence required</label><select id="fd-ev"><option selected>Yes</option><option>No</option></select></div>' +
    '</div>' +
    '<div class="form-row"><label>Internal CAA Note (optional)</label><div class="help">Not visible to the auditee.</div>' +
      '<textarea id="fd-internal" placeholder="Internal only."></textarea></div>';
  var foot = '<button class="btn" data-act="close-modal">Cancel</button>' +
    '<button class="btn btn--primary" data-act="issue-finding" data-id="' + auditId + '" data-q="' + qId + '">Issue Finding</button>';
  return modalShell('Issue Finding', body, foot, true);
}

/* Authorized closure modal (CAA-only). */
function modalAuthorizedClosure(f) {
  var body =
    '<div class="modal__intro">⚖️ You are closing <b>' + esc(f.id) + '</b> without evidence acceptance. ' +
    'This is an <b>authorized closure</b> and will be recorded in the audit trail. A reason is required.</div>' +
    '<div class="form-row"><label>Reason for authorized closure <span class="req">*</span></label>' +
      '<textarea id="ac-reason" placeholder="e.g. Risk accepted by management; finding superseded; equivalent action verified by other means."></textarea></div>' +
    '<div class="form-row"><label>Comment to Auditee (optional)</label>' +
      '<textarea id="ac-comment" placeholder="Visible to the auditee.">This finding has been closed by the CAA under an authorized closure decision.</textarea></div>' +
    '<div class="form-row"><label>Internal CAA Note (optional)</label><div class="help">Not visible to the auditee.</div>' +
      '<textarea id="ac-internal" placeholder="Internal only."></textarea></div>';
  var foot = '<button class="btn" data-act="close-modal">Cancel</button>' +
    '<button class="btn btn--danger" data-act="do-authclose" data-id="' + f.id + '">Authorize closure</button>';
  return modalShell('Authorized Closure — ' + f.id, body, foot, true);
}

/* =========================== New Audit Wizard =========================== */
function viewAuditWizard() {
  var w = state.wizard || {};
  var step = w.step || 1;

  var steps = ['What are you inspecting?', 'When and where?', 'Who will inspect?', 'What checklist?', 'Review & schedule'];
  var rail = '<div class="stepper mb-16">' + steps.map(function (label, i) {
    var n = i + 1;
    var cls = n < step ? 'done' : (n === step ? 'current' : '');
    return '<div class="step ' + cls + '"><div class="step__dot">' + (n < step ? '✓' : n) + '</div>' +
      '<div class="step__label">' + esc(label) + '</div></div>';
  }).join('') + '</div>';

  var bodyHtml = '';
  if (step === 1) {
    bodyHtml =
      '<div class="form-row"><label>Organization <span class="req">*</span></label><select id="wz-org">' +
        state.orgs.map(function (o) { return '<option value="' + o.id + '"' + (w.orgId === o.id ? ' selected' : '') + '>' + esc(o.name) + ' — ' + esc(o.type) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-2col">' +
        '<div class="form-row"><label>Audit type <span class="req">*</span></label><select id="wz-type">' +
          AUDIT_TYPES.map(function (t) { return '<option' + (w.type === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
        '<div class="form-row"><label>Domain <span class="req">*</span></label><select id="wz-domain">' +
          AUDIT_DOMAINS.map(function (t) { return '<option' + (w.domain === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
      '</div>';
  } else if (step === 2) {
    bodyHtml =
      '<div class="form-2col">' +
        '<div class="form-row"><label>Date <span class="req">*</span></label><input type="date" id="wz-date" value="' + esc(w.date || '2026-12-10') + '"></div>' +
        '<div class="form-row"><label>Mode</label><select id="wz-mode">' +
          ['On-site', 'Remote'].map(function (m) { return '<option' + (w.mode === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="form-row"><label>Location <span class="req">*</span></label><input type="text" id="wz-loc" value="' + esc(w.location || '') + '" placeholder="e.g. Airline XYZ HQ"></div>';
  } else if (step === 3) {
    bodyHtml =
      '<div class="form-row"><label>Lead inspector <span class="req">*</span></label><select id="wz-lead">' +
        INSPECTORS.map(function (n) { return '<option' + (w.lead === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-row"><label>Team members</label><div class="help">Select additional inspectors (optional).</div>' +
        INSPECTORS.map(function (n) {
          var checked = (w.team || []).indexOf(n) > -1 ? ' checked' : '';
          return '<label style="display:flex;align-items:center;gap:8px;font-weight:500;margin-bottom:6px">' +
            '<input type="checkbox" class="wz-team" value="' + esc(n) + '"' + checked + '> ' + esc(n) + '</label>';
        }).join('') +
      '</div>';
  } else if (step === 4) {
    bodyHtml =
      '<div class="form-row"><label>Checklist template <span class="req">*</span></label><select id="wz-tpl">' +
        state.templateLibrary.map(function (t) { return '<option value="' + t.id + '"' + (w.templateId === t.id ? ' selected' : '') + '>' + esc(t.name) + ' · ' + esc(t.version) + '</option>'; }).join('') +
      '</select><div class="help">Only the Flight Operations Audit template is runnable in this demo.</div></div>' +
      '<div class="form-row"><label>Scope (optional)</label><textarea id="wz-scope" placeholder="Areas in scope for this audit.">' + esc(w.scope || '') + '</textarea></div>';
  } else {
    var orgN = orgName(w.orgId);
    var tpl = null;
    state.templateLibrary.forEach(function (t) { if (t.id === w.templateId) tpl = t; });
    bodyHtml =
      '<div class="callout mb-16">Review the audit before scheduling it into the 2026 plan.</div>' +
      '<div class="card"><div class="card__body"><div class="metaline">' +
        metaItem('Organization', orgN) + metaItem('Audit type', w.type) + metaItem('Domain', w.domain) +
        metaItem('Date', fmtDate(w.date)) + metaItem('Mode', w.mode || 'On-site') + metaItem('Location', w.location || '—') +
        metaItem('Lead inspector', w.lead) + metaItem('Team', (w.team && w.team.length ? w.team.join(', ') : w.lead)) +
        metaItem('Checklist', tpl ? tpl.name + ' · ' + tpl.version : '—') +
      '</div></div></div>';
  }

  var backBtn = step > 1
    ? '<button class="btn" data-act="wizard-back">Back</button>'
    : '<button class="btn" data-act="nav" data-view="calendar">Cancel</button>';
  var fwdBtn = step < 5
    ? '<button class="btn btn--primary" data-act="wizard-next">Next</button>'
    : '<button class="btn btn--primary" data-act="wizard-create">Create &amp; schedule audit</button>';

  return pageHead('New Audit Wizard', 'Plan a new surveillance audit and schedule it into the 2026 plan.') +
    rail +
    '<div class="card" style="max-width:680px"><div class="card__head"><h3>Step ' + step + ' of 5 — ' + esc(steps[step - 1]) + '</h3></div>' +
      '<div class="card__body">' + bodyHtml + '</div>' +
      '<div class="modal__foot" style="border-top:1px solid var(--line)">' + backBtn + fwdBtn + '</div>' +
    '</div>';
}
