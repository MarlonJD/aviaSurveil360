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

function renderAttentionStrip(items) {
  return '<div class="attention-strip">' + items.map(function (item) {
    return '<div class="attention-pill' + (item.tone ? ' is-' + item.tone : '') + '">' +
      '<span>' + esc(item.label) + '</span><b>' + esc(item.value) + '</b></div>';
  }).join('') + '</div>';
}

function workItemActionButton(item) {
  var action = item.primaryAction;
  if (!action) return '';
  var id = action.id || (item.route && item.route.id) || item.id;
  var attrs = ' data-act="' + esc(action.action || 'nav') + '"';
  if (action.view) attrs += ' data-view="' + esc(action.view) + '"';
  if (id) attrs += ' data-id="' + esc(id) + '"';
  return '<button class="' + esc(action.cls || 'btn') + ' btn--sm"' + attrs + '>' + esc(action.label || 'Open') + '</button>';
}

function workItemRowAttrs(item) {
  if (!item.route || !item.route.view) return '';
  return ' data-act="nav" data-view="' + esc(item.route.view) + '"' + (item.route.id ? ' data-id="' + esc(item.route.id) + '"' : '');
}

function workItemRowHtml(item, options) {
  options = options || {};
  var priority = item.priority || { label: 'Normal', tone: 'neutral' };
  var rowClasses = ['ops-row'];
  if (item.child) rowClasses.push('ops-row--child');
  else rowClasses.push('ops-row--parent');
  if (priority.tone === 'danger') rowClasses.push('ops-row--danger');
  else if (priority.tone === 'warn') rowClasses.push('ops-row--attention');
  else if (priority.tone === 'ok') rowClasses.push('ops-row--ok');
  if (options.selectedId && (options.selectedId === item.id || (item.route && options.selectedId === item.route.id))) rowClasses.push('is-selected');

  var orgCell = options.hideOrganization ? '' : '<td data-col="org">' + esc(item.organization || '-') + '</td>';
  return '<tr class="' + rowClasses.join(' ') + '"' + workItemRowAttrs(item) + '>' +
    '<td data-col="priority"><span class="ops-priority is-' + esc(priority.tone || 'neutral') + '">' + esc(priority.label || 'Normal') + '</span></td>' +
    '<td data-col="item"><div class="ops-cell-title">' + esc(item.title) + '</div><div class="ops-cell-sub">' + esc(item.subtitle || item.type || item.id) + '</div></td>' +
    orgCell +
    '<td data-col="owner" data-label="Owner:"' + (!item.owner || item.owner === '-' || item.owner === '—' ? ' data-empty="1"' : '') + '>' + esc(item.owner || '-') + '</td>' +
    '<td data-col="next" data-label="Next:"><b>' + esc(item.nextAction || '-') + '</b></td>' +
    '<td data-col="due">' + esc(item.dueText || '-') + '</td>' +
    '<td data-col="status">' + (item.statusHtml || '') + '</td>' +
    '<td data-col="actions"><div class="ops-actions">' + workItemActionButton(item) + '</div></td>' +
  '</tr>';
}

function flattenWorkItems(items, includeChildren) {
  var out = [];
  items.forEach(function (item) {
    out.push(item);
    if (includeChildren && item.children && item.children.length) {
      item.children.forEach(function (child) { out.push(child); });
    }
  });
  return out;
}

function renderOpsTable(items, options) {
  options = options || {};
  if (!items || !items.length) return '<div class="empty">' + esc(options.empty || 'No work items match this view.') + '</div>';
  var rows = flattenWorkItems(items, options.includeChildren).map(function (item) {
    return workItemRowHtml(item, options);
  }).join('');
  var orgHead = options.hideOrganization ? '' : '<th>Organization</th>';
  return '<div class="ops-table-wrap ops-table-wrap--stack"><table class="ops-table"><thead><tr>' +
    '<th style="width:96px">Priority</th><th>Item</th>' + orgHead +
    '<th>Owner</th><th>Next Action</th><th>Due Date / Target</th><th>Status</th><th style="width:124px;text-align:right">Open</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function dossierPanel(title, bodyHtml, subHtml) {
  return '<div class="dossier-panel"><div class="dossier-panel__head"><h3>' + esc(title) + '</h3>' +
    (subHtml ? '<span class="sub">' + esc(subHtml) + '</span>' : '') + '</div><div class="dossier-panel__body">' + bodyHtml + '</div></div>';
}

function approvalProgressHtml(record) {
  var approval = record.approval;
  if (!approval || !approval.chain) return '';
  var summary = approvalSummary(record);
  return '<div class="approval-rail">' + approval.chain.map(function (stage, idx) {
    var cls = idx < approval.currentIndex || summary.outcome === 'approved' ? ' done' : (idx === approval.currentIndex && !summary.outcome ? ' current' : '');
    var mark = idx < approval.currentIndex || summary.outcome === 'approved' ? '✓' : (idx === approval.currentIndex && !summary.outcome ? '•' : idx + 1);
    return '<div class="approval-step' + cls + '">' +
      '<div class="approval-step__dot">' + esc(mark) + '</div>' +
      '<div class="approval-step__label">' + esc(stage.label) + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function approvalHistoryHtml(record) {
  var history = record.approval && record.approval.history ? record.approval.history : [];
  if (!history.length) return '<div class="muted small">No approval history yet.</div>';
  return '<div class="approval-history">' + history.map(function (entry) {
    return '<div class="approval-history__item">' +
      '<div class="approval-history__head"><b>' + esc(approvalActionLabel(entry.action)) + '</b><span>' + esc(entry.date) + '</span></div>' +
      '<div class="approval-history__actor">' + esc(entry.actor) + ' · ' + esc(roleName(entry.role)) + '</div>' +
      (entry.comment ? '<div class="approval-history__comment">' + esc(entry.comment) + '</div>' : '') +
    '</div>';
  }).join('') + '</div>';
}

function approvalDecisionButton(record, decision, label, tone, primary) {
  var cls = 'btn btn--sm';
  if (primary) cls += ' btn--primary';
  else if (tone === 'ok') cls += ' btn--ok';
  else if (tone === 'danger') cls += ' btn--danger';
  return '<button class="' + cls + '" data-act="approval-action" data-id="' + esc(record.id) +
    '" data-decision="' + esc(decision) + '">' + esc(label) + '</button>';
}

function approvalDecisionPanelHtml(record) {
  var summary = approvalSummary(record);
  if (summary.outcome) {
    return '<div class="decision-panel is-final">' +
      '<div class="decision-panel__title">' + esc(summary.statusLabel) + '</div>' +
      '<p class="small muted">This demo item has no current approval owner.</p>' +
    '</div>';
  }

  if (summary.ownerRole !== state.role) {
    return '<div class="decision-panel">' +
      '<div class="decision-panel__title">Waiting for ' + esc(summary.ownerLabel) + '</div>' +
      '<p class="small muted">Current next action: ' + esc(summary.nextAction) + '.</p>' +
    '</div>';
  }

  var buttons = '';
  if (state.role === 'manager') {
    buttons = approvalDecisionButton(record, 'forward', 'Submit to GM', null, true);
  } else if (state.role === 'gm') {
    if (record.approvalType === 'checklist') {
      buttons =
        approvalDecisionButton(record, 'approve', 'Approve Checklist', 'ok') +
        approvalDecisionButton(record, 'return', 'Return to Department Manager', 'danger') +
        approvalDecisionButton(record, 'reject', 'Reject', 'danger');
    } else {
      buttons =
        approvalDecisionButton(record, 'forward', record.budgetRequired ? 'Send to Finance Review' : 'Forward to ED', null, true) +
        approvalDecisionButton(record, 'return', 'Return to Department Manager', 'danger') +
        approvalDecisionButton(record, 'reject', 'Reject', 'danger');
    }
  } else if (state.role === 'finance') {
    buttons =
      approvalDecisionButton(record, 'approve', 'Approve Budget', 'ok') +
      approvalDecisionButton(record, 'approve_with_adjustment', 'Approve with Adjustment', null, true) +
      approvalDecisionButton(record, 'finance_not_approved', 'Finance Not Approved', 'danger');
  } else if (state.role === 'executiveDirector') {
    buttons =
      approvalDecisionButton(record, 'approve', 'Approve Plan', 'ok') +
      approvalDecisionButton(record, 'return', 'Return to GM', 'danger') +
      approvalDecisionButton(record, 'reject', 'Reject', 'danger');
  }

  return '<div class="decision-panel">' +
    '<div class="decision-panel__title">' + esc(summary.ownerLabel) + ' Decision</div>' +
    '<label class="decision-panel__label" for="approval-note-' + esc(record.id) + '">Decision note / mandatory reason</label>' +
    '<textarea id="approval-note-' + esc(record.id) + '" class="decision-panel__note" placeholder="Required for Return, Reject, and Finance Not Approved. Optional for approvals."></textarea>' +
    '<div class="decision-panel__actions">' + buttons + '</div>' +
  '</div>';
}

function planningApprovalPurposeForRole() {
  if (state.role === 'manager') return 'Track planning approvals, release acceptance and department preparation in one panel.';
  if (state.role === 'gm') return 'Route the planning item through Finance and ED, then release it to the department.';
  if (state.role === 'finance') return 'Review the mock budget and return the item to GM action if needed.';
  if (state.role === 'executiveDirector') return 'Give final planning approval or return the item to GM with a reason.';
  if (state.role === 'leadInspector') return 'Prepare the released audit by proposing team, dates and resources.';
  return 'Review the internal CAA planning workflow.';
}

function planningPrepActionPanel(item) {
  var prep = item.preparation;
  var body = '<div class="decision-panel__title">Current preparation step</div>' +
    '<p class="small muted">' + esc(planningPrepMeta(prep.status).label) + '</p>';

  if (state.role === 'gm' && item.approval.outcome === 'approved' && prep.status === 'not_released') {
    body += '<div class="decision-panel__actions"><button class="btn btn--primary" data-act="planning-release" data-id="' + esc(item.id) + '">Release to Department</button></div>';
  } else if (state.role === 'manager' && prep.status === 'released_to_department') {
    body += '<div class="decision-panel__actions"><button class="btn btn--primary" data-act="planning-accept" data-id="' + esc(item.id) + '">Accept Released Audit</button></div>';
  } else if (state.role === 'manager' && prep.status === 'accepted_by_department') {
    body += '<div class="form-row"><label>Lead Inspector</label><select id="prep-lead"><option>Caner Yildiz</option><option>Aylin Sezer</option></select></div>' +
      '<div class="decision-panel__actions"><button class="btn btn--primary" data-act="planning-assign-lead" data-id="' + esc(item.id) + '">Assign Lead Inspector</button></div>';
  } else if (state.role === 'leadInspector' && prep.status === 'lead_inspector_assigned') {
    body += '<div class="form-2col"><div class="form-row"><label>Start date</label><input id="prep-start" type="date" value="2026-09-10"></div>' +
      '<div class="form-row"><label>End date</label><input id="prep-end" type="date" value="2026-09-12"></div></div>' +
      '<div class="form-row"><label>Resources</label><textarea id="prep-resources">2 inspectors, document review package</textarea></div>' +
      '<div class="decision-panel__actions"><button class="btn btn--primary" data-act="planning-propose-team" data-id="' + esc(item.id) + '">Propose Team / Dates / Resources</button></div>';
  } else if (state.role === 'manager' && prep.status === 'team_schedule_proposed') {
    body += '<div class="callout">Lead proposed ' + esc((prep.proposedTeam || []).join(', ')) + ' · ' + esc(prep.proposedStartDate || '—') + ' to ' + esc(prep.proposedEndDate || '—') + '.</div>' +
      '<div class="decision-panel__actions"><button class="btn btn--primary" data-act="planning-confirm-prep" data-id="' + esc(item.id) + '">Confirm & Generate Mock Package</button></div>';
  } else {
    body += '<div class="callout">No action is available for this role at the current step.</div>';
  }
  return '<div class="decision-panel">' + body + '</div>';
}

function planningWorkspaceTab(forcedTab) {
  var tab = forcedTab || (state.params && state.params.tab);
  if (!tab && state.view === 'planning-approvals') tab = 'approval';
  if (!tab && state.view === 'planning-board') tab = 'preparation';
  var allowed = { overview: true, approval: true, preparation: true };
  return allowed[tab] ? tab : 'overview';
}

function planningWorkspaceTabsHtml(activeTab) {
  var tabs = [
    ['overview', 'Overview'],
    ['approval', 'Approval'],
    ['preparation', 'Preparation']
  ];
  return '<div class="planning-tabs mb-16" role="tablist">' + tabs.map(function (tab) {
    var active = tab[0] === activeTab;
    return '<button class="planning-tab' + (active ? ' is-active' : '') + '" role="tab" aria-selected="' + (active ? 'true' : 'false') +
      '" data-act="nav" data-view="planning" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function planningNextAction(item) {
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

function planningCurrentOwner(item) {
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

function planningFinanceReviewText(item) {
  if (!item.financeReview) return 'Not reviewed yet';
  return humanStatus(item.financeReview.decision) + ' · ' + (item.financeReview.reason || item.financeReview.comment || 'No note');
}

function planningApprovalCompleteText(summary) {
  if (summary.outcome === 'approved') return 'Yes - Approved';
  if (summary.outcome === 'rejected') return 'No - Rejected';
  return 'No - ' + summary.statusLabel;
}

function planningPrepCompleteText(prep) {
  return prep.status === 'ready_for_execution' ? 'Yes - Ready for execution' : 'No - ' + planningPrepMeta(prep.status).label;
}

function planningNextActionPanelHtml(item) {
  var summary = approvalSummary(item);
  var prep = item.preparation;
  return '<div class="decision-panel planning-next-action">' +
    '<div class="decision-panel__title">Next Action</div>' +
    '<div class="metaline">' +
      metaItem('Who owns this now?', planningCurrentOwner(item)) +
      metaItem('What must happen next?', planningNextAction(item)) +
      metaItem('Is approval complete?', planningApprovalCompleteText(summary)) +
      metaItem('Is preparation complete?', planningPrepCompleteText(prep)) +
    '</div>' +
  '</div>';
}

function planningDossierHtml(item) {
  return '<div class="metaline">' +
    metaItem('Organization', item.organization) +
    metaItem('Department', item.department) +
    metaItem('Risk category', item.riskCategory) +
    metaItem('Trigger type', item.triggerType) +
    metaItem('Requested budget', item.requestedBudget) +
    metaItem('Budget required', item.budgetRequired ? 'Yes' : 'No') +
    metaItem('Target month', item.targetMonth) +
    metaItem('Proposed inspectors', item.proposedInspectors.join(', ')) +
    metaItem('Finance review', planningFinanceReviewText(item)) +
  '</div>';
}

function planningPreparationDetailHtml(item) {
  var prep = item.preparation;
  return '<div class="metaline">' +
    metaItem('Preparation status', planningPrepMeta(prep.status).label) +
    metaItem('Lead Inspector', prep.leadInspector || '-') +
    metaItem('Team', prep.proposedTeam.length ? prep.proposedTeam.join(', ') : '-') +
    metaItem('Date range', prep.proposedStartDate ? prep.proposedStartDate + ' to ' + prep.proposedEndDate : '-') +
    metaItem('Resources', prep.resources || '-') +
  '</div>';
}

function planningAssignmentPackageHtml(item) {
  var pkg = item.preparation.assignmentPackage;
  if (!pkg) return '<div class="muted small">Assignment package is generated only after Department Manager confirmation.</div>';
  return '<div class="callout"><b>' + esc(pkg.title) + '</b><br><span class="small muted">' + esc(pkg.note) + '</span></div>';
}

function planningPrepHistoryHtml(item) {
  var history = item.preparation.history || [];
  if (!history.length) return '<div class="muted small">No release/preparation events yet.</div>';
  return '<div class="approval-history">' + history.map(function (entry) {
    return '<div class="approval-history__item"><div class="approval-history__head"><b>' + esc(humanStatus(entry.action)) + '</b><span>' + esc(entry.date) + '</span></div>' +
      '<div class="approval-history__actor">' + esc(entry.actor) + ' · ' + esc(roleName(entry.role)) + '</div>' +
      (entry.comment ? '<div class="approval-history__comment">' + esc(entry.comment) + '</div>' : '') + '</div>';
  }).join('') + '</div>';
}

function planningWorkspaceOverviewHtml(item) {
  var prepMeta = planningPrepMeta(item.preparation.status);
  return '<div class="grid grid--main">' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Planning Item Detail</h3><span class="sub">CAA internal mock item</span></div><div class="card__body">' + planningDossierHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Approval Progress</h3><span class="sub">Department Manager -> GM -> Finance Review -> Executive Director</span></div><div class="card__body">' + approvalProgressHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Preparation Detail</h3><div class="spacer"></div>' + demoBadge(prepMeta.label, prepMeta.tone) + '</div><div class="card__body">' + planningPreparationDetailHtml(item) + '</div></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Current Planning Step</h3></div><div class="card__body">' + planningNextActionPanelHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Approval Decision</h3><span class="sub">Role-aware controls</span></div><div class="card__body">' + approvalDecisionPanelHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Preparation Action</h3><span class="sub">Release and audit preparation</span></div><div class="card__body">' + planningPrepActionPanel(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Approval History</h3><span class="sub">Append-only demo log</span></div><div class="card__body">' + approvalHistoryHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Preparation History</h3><span class="sub">Release and readiness events</span></div><div class="card__body">' + planningPrepHistoryHtml(item) + '</div></div>' +
    '</div>' +
  '</div>';
}

function planningWorkspaceApprovalHtml(item) {
  return '<div class="grid grid--main">' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Approval Progress</h3><span class="sub">Configured owner path</span></div><div class="card__body">' + approvalProgressHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Planning Item Detail</h3><span class="sub">Approval context</span></div><div class="card__body">' + planningDossierHtml(item) + '</div></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Decision Panel</h3><span class="sub">Role-aware controls</span></div><div class="card__body">' + approvalDecisionPanelHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Approval History</h3><span class="sub">Append-only demo log</span></div><div class="card__body">' + approvalHistoryHtml(item) + '</div></div>' +
    '</div>' +
  '</div>';
}

function planningWorkspacePreparationHtml(item) {
  var prepMeta = planningPrepMeta(item.preparation.status);
  return '<div class="grid grid--main">' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Preparation Detail</h3><div class="spacer"></div>' + demoBadge(prepMeta.label, prepMeta.tone) + '</div><div class="card__body">' + planningPreparationDetailHtml(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Mock Audit Assignment Package</h3></div><div class="card__body">' + planningAssignmentPackageHtml(item) + '</div></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="card"><div class="card__head"><h3>Next Preparation Action</h3></div><div class="card__body">' + planningPrepActionPanel(item) + '</div></div>' +
      '<div class="card"><div class="card__head"><h3>Release / Preparation History</h3></div><div class="card__body">' + planningPrepHistoryHtml(item) + '</div></div>' +
    '</div>' +
  '</div>';
}

function viewPlanningWorkspace(forcedTab) {
  var item = state.planningItems && state.planningItems.length ? state.planningItems[0] : null;
  if (!item) return pageHead('Planning', '') + '<div class="empty">No planning item is seeded.</div>';
  if (!item.preparation) item.preparation = { status: 'not_released', proposedTeam: [], history: [] };
  if (!item.preparation.proposedTeam) item.preparation.proposedTeam = [];
  if (!item.preparation.history) item.preparation.history = [];
  var activeTab = planningWorkspaceTab(forcedTab);
  var approval = approvalSummary(item);
  var prepMeta = planningPrepMeta(item.preparation.status);
  var approvalMeta = approvalMetaForStatus(item.status);
  var planningItems = (state.planningItems || []).map(workItemFromPlanningItem).sort(workItemSort);
  var body = activeTab === 'approval'
    ? planningWorkspaceApprovalHtml(item)
    : (activeTab === 'preparation' ? planningWorkspacePreparationHtml(item) : planningWorkspaceOverviewHtml(item));

  return pageHead('Planning', 'Single planning panel for approval, release, and audit preparation.') +
    guardrailStrip([
      { label: 'Frontend-only demo' },
      { label: 'Mock approval history', tone: 'info' },
      { label: 'No real authorization service', tone: 'warn' }
    ]) +
    '<h2 class="section-heading">Planning Workbench</h2>' +
    renderOpsTable(planningItems, { selectedId: item.id, empty: 'No planning work items are seeded.' }) +
    '<div class="governance-hero planning-workspace__hero mb-16">' +
      '<div>' +
        '<div class="governance-hero__eyebrow">Canonical planning workspace</div>' +
        '<h2>' + esc(item.title) + '</h2>' +
        '<p>' + esc(item.purpose) + '</p>' +
      '</div>' +
      '<div class="governance-hero__metrics">' +
        compactMetric('Current owner', planningCurrentOwner(item), approval.outcome === 'approved' ? prepMeta.tone : approval.statusTone) +
        compactMetric('Next action', planningNextAction(item), 'info') +
        compactMetric('Approval status', approval.statusLabel, approvalMeta.tone) +
        compactMetric('Preparation status', prepMeta.label, prepMeta.tone) +
      '</div>' +
    '</div>' +
    planningWorkspaceTabsHtml(activeTab) +
    body;
}

function viewPlanningApprovals() {
  return viewPlanningWorkspace('approval');
}

function viewPlanningBoard() {
  return viewPlanningWorkspace('preparation');
}

function activeChecklistApproval() {
  var checklist = state.managedChecklists && state.managedChecklists.length ? state.managedChecklists[0] : null;
  if (!checklist) return null;
  var version = null;
  for (var i = 0; i < checklist.versions.length; i++) {
    if (checklist.versions[i].id === 'CL-FOPS-v2.4') version = checklist.versions[i];
  }
  return { checklist: checklist, version: version || checklist.versions[0] };
}

function viewChecklistApprovals() {
  var bundle = activeChecklistApproval();
  if (!bundle || !bundle.version) return pageHead('Checklist Approvals', '') + '<div class="empty">No checklist approval items are seeded.</div>';
  var checklist = bundle.checklist;
  var version = bundle.version;
  var summary = approvalSummary(version);
  var meta = approvalMetaForStatus(version.status);
  var questionCount = version.questionIds ? version.questionIds.length : 0;
  var activeVersion = checklist.versions.filter(function (item) { return item.version === checklist.publishedVersion; })[0];
  var approvalItem = {
    id: version.id,
    type: 'Checklist Version',
    title: checklist.name + ' v' + version.version,
    subtitle: version.changeReason,
    organization: checklist.department,
    priority: summary.ownerRole === state.role ? workItemPriority('Your review', 'warn', 3) : workItemPriority('Approval', meta.tone, 20),
    lifecycle: summary.statusLabel,
    owner: summary.ownerLabel,
    nextAction: summary.nextAction,
    dueText: 'Target before Q3 surveillance',
    statusHtml: checklistStatusBadge(version.status),
    primaryAction: { label: 'Open dossier', action: 'nav', view: 'checklist-approvals', cls: 'btn btn--primary' },
    route: { view: 'checklist-approvals', id: version.id },
    children: []
  };

  return pageHead('Checklist Approval — ' + checklist.name, 'Department Manager to GM approval shell using the shared approval primitive.') +
    guardrailStrip([
      { label: 'Frontend-only demo' },
      { label: 'Mock checklist approval', tone: 'info' },
      { label: 'Inspector cannot edit configuration', tone: 'warn' }
    ]) +
    renderAttentionStrip([
      { label: 'Version Status', value: meta.label, tone: meta.tone },
      { label: 'Questions', value: String(questionCount), tone: 'info' },
      { label: 'Published Active', value: activeVersion ? 'v' + activeVersion.version : 'None', tone: 'ok' }
    ]) +
    '<h2 class="section-heading">Checklist Approval Queue</h2>' +
    renderOpsTable([approvalItem], { empty: 'No checklist approval items are seeded.' }) +
    '<div class="governance-hero mt-16 mb-16">' +
      '<div>' +
        '<div class="governance-hero__eyebrow">Phase 1A · checklist approval shell</div>' +
        '<h2>' + esc(checklist.name) + ' v' + esc(version.version) + '</h2>' +
        '<p>' + esc(version.changeReason) + '</p>' +
      '</div>' +
      '<div class="governance-hero__metrics">' +
        compactMetric('Current owner', summary.ownerLabel, summary.statusTone) +
        compactMetric('Next action', summary.nextAction, 'info') +
        compactMetric('Status', summary.statusLabel, summary.statusTone) +
      '</div>' +
    '</div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        dossierPanel('Checklist Version Dossier',
          '<div class="metaline">' +
            metaItem('Checklist ID', checklist.id) +
            metaItem('Department', checklist.department) +
            metaItem('Inspection type', checklist.inspectionType) +
            metaItem('Version', version.version) +
            metaItem('Created by', version.createdBy) +
            metaItem('Reason for change', version.changeReason) +
            metaItem('Impact', version.impact || 'No impact note') +
            metaItem('Current owner', summary.ownerLabel) +
          '</div>' +
          '<div class="callout mt-16">This shell proves GM approval controls only. Question Bank, Builder, Version History, and publish/archive behavior remain Phase 1B/1C.</div>',
          'Phase 1A shell only') +
        dossierPanel('Approval Progress', approvalProgressHtml(version), 'Department Manager -> GM') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        dossierPanel('Decision Panel', approvalDecisionPanelHtml(version), 'GM approve / return / reject') +
        dossierPanel('Approval History', approvalHistoryHtml(version), 'Append-only demo log') +
      '</div>' +
    '</div>';
}

function checklistStatusBadge(status) {
  var meta = approvalMetaForStatus(status);
  return demoBadge(meta.label, meta.tone);
}

function viewQuestionBank() {
  var canEdit = canManageChecklistConfig(state.role);
  var rows = (state.questionBank || []).map(function (q) {
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(q.title) + '</div><div class="ops-cell-sub">' + esc(q.id) + ' · ' + esc(q.text) + '</div></td>' +
      '<td>' + esc(q.department) + '</td>' +
      '<td>' + esc(q.category) + '</td>' +
      '<td>' + esc(q.regulationRef) + '<div class="ops-cell-sub">Expected evidence: ' + esc(q.exampleEvidence) + '</div></td>' +
      '<td>' + (q.commentRequired ? demoBadge('Comment required', 'warn') : demoBadge('Comment optional', 'neutral')) + '</td>' +
      '<td>' + demoBadge(q.status, q.status === 'Active' ? 'ok' : 'neutral') + '</td>' +
    '</tr>';
  }).join('');
  var createPanel = canEdit
    ? '<div class="card mb-16"><div class="card__head"><h3>New Question</h3><span class="sub">Mock item, saved in browser</span></div><div class="card__body">' +
        '<div class="form-2col"><div class="form-row"><label>Title</label><input id="qb-title" type="text" value="Training evidence reconciliation"></div>' +
        '<div class="form-row"><label>Question text</label><input id="qb-text" type="text" value="Does the training matrix reconcile to sampled crew certificate evidence?"></div></div>' +
        '<button class="btn btn--primary" data-act="qb-create">+ New Question</button>' +
      '</div></div>'
    : '<div class="scope-note">Read-only preview. Inspectors cannot edit checklist configuration in this demo.</div>';

  return pageHead('Question Bank', 'Reusable checklist questions with configured references and expected evidence.') +
    guardrailStrip([
      { label: 'Mock configuration data' },
      { label: 'Regulatory references only', tone: 'warn' }
    ]) +
    createPanel +
    '<h2 class="section-heading">Questions</h2>' +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>Question</th><th>Department</th><th>Category</th><th>Reference / expected evidence</th><th>Comment</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewChecklistBuilder() {
  var checklist = activeManagedChecklist();
  if (!checklist) return pageHead('Checklist Builder', '') + '<div class="empty">No managed checklist is seeded.</div>';
  var canEdit = canManageChecklistConfig(state.role);
  var editable = editableChecklistVersion(checklist);
  var active = checklist.versions.filter(function (version) { return version.status === 'published_active'; })[0];
  var working = editable || active;
  var isEditable = canEdit && editable && (editable.status === 'draft' || editable.status === 'checklist_returned');

  var bankRows = (state.questionBank || []).map(function (q) {
    var already = working && working.questionIds && working.questionIds.indexOf(q.id) > -1;
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(q.title) + '</div><div class="ops-cell-sub">' + esc(q.id) + ' · ' + esc(q.text) + '</div></td>' +
      '<td>' + esc(q.regulationRef) + '</td>' +
      '<td>' + esc(q.exampleEvidence) + '</td>' +
      '<td><div class="ops-actions">' + (isEditable && !already ? '<button class="btn btn--sm" data-act="checklist-add-question" data-id="' + esc(working.id) + '" data-question="' + esc(q.id) + '">Add</button>' :
        '<span class="badge badge--neutral"><span class="dot"></span>' + (already ? 'In version' : 'Read-only') + '</span>') + '</div></td>' +
    '</tr>';
  }).join('');

  var versionRows = working && working.questionIds ? working.questionIds.map(function (qid, idx) {
    return '<tr>' +
      '<td><span class="ops-priority is-neutral">' + esc(idx + 1) + '</span></td>' +
      '<td><div class="ops-cell-title">' + esc(checklistQuestionLabel(qid)) + '</div><div class="ops-cell-sub">' + esc(qid) + '</div></td>' +
      '<td>' + checklistStatusBadge(working.status) + '</td>' +
      '<td><div class="ops-actions">' + (isEditable ?
        '<button class="btn btn--sm" data-act="checklist-move-question" data-id="' + esc(working.id) + '" data-question="' + esc(qid) + '" data-direction="up">Up</button>' +
        '<button class="btn btn--sm" data-act="checklist-move-question" data-id="' + esc(working.id) + '" data-question="' + esc(qid) + '" data-direction="down">Down</button>'
        : '<span class="muted small">Locked</span>') + '</div></td>' +
    '</tr>';
  }).join('') : '';
  var currentVersionTable = versionRows
    ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th style="width:82px">Order</th><th>Question</th><th>Status</th><th style="width:150px;text-align:right">Actions</th></tr></thead><tbody>' + versionRows + '</tbody></table></div>'
    : '<div class="empty">No questions in this version.</div>';
  var bankTable = '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Reusable question</th><th>Reference</th><th>Expected evidence</th><th style="width:130px;text-align:right">Action</th></tr></thead><tbody>' + bankRows + '</tbody></table></div>';

  var draftPanel = editable
    ? '<div class="callout mb-16"><b>Working version:</b> v' + esc(editable.version) + ' · ' + esc(approvalMetaForStatus(editable.status).label) + '. Reason for Change: ' + esc(editable.changeReason) + '</div>'
    : '<div class="card mb-16"><div class="card__head"><h3>Create New Draft Version</h3><span class="sub">Reason for Change is mandatory</span></div><div class="card__body">' +
        '<div class="form-row"><label>Reason for Change <span class="req">*</span></label><textarea id="cl-change-reason" placeholder="Explain why this checklist needs a new version."></textarea></div>' +
        (canEdit ? '<button class="btn btn--primary" data-act="checklist-draft">Create Draft From Active</button>' : '<div class="scope-note">Read-only preview. Inspectors cannot create checklist versions.</div>') +
      '</div></div>';

  var submitAction = editable && state.role === 'manager' && (editable.status === 'draft' || editable.status === 'checklist_returned')
    ? '<button class="btn btn--primary" data-act="checklist-submit-version" data-id="' + esc(editable.id) + '">Submit for GM Approval</button>' : '';

  return pageHead('Checklist Builder', 'Build and order checklist questions without changing the active published version.', submitAction) +
    guardrailStrip([
      { label: 'Frontend-only demo' },
      { label: 'Version history preserved', tone: 'info' },
      { label: 'No production rule publishing', tone: 'warn' }
    ]) +
    (!canEdit ? '<div class="scope-note">Read-only preview. Inspectors cannot edit checklist configuration.</div>' : '') +
    draftPanel +
    '<div class="grid grid--main">' +
      dossierPanel(checklist.name + ' Questions', currentVersionTable, 'v' + working.version) +
      dossierPanel('Question Bank', bankTable, 'Add from reusable bank') +
    '</div>';
}

function viewChecklistVersions() {
  var checklist = activeManagedChecklist();
  if (!checklist) return pageHead('Version History', '') + '<div class="empty">No managed checklist is seeded.</div>';
  var rows = checklist.versions.slice().reverse().map(function (version) {
    var summary = approvalSummary(version);
    var publish = state.role === 'manager' && version.status === 'checklist_approved'
      ? '<button class="btn btn--sm btn--primary" data-act="checklist-publish-version" data-id="' + esc(version.id) + '">Publish Active</button>' : '';
    return '<tr class="ops-row">' +
      '<td><b>v' + esc(version.version) + '</b><div class="small muted">' + esc(version.id) + '</div></td>' +
      '<td>' + checklistStatusBadge(version.status) + '</td>' +
      '<td>' + esc(version.createdBy) + '</td>' +
      '<td>' + esc(version.changeReason) + '</td>' +
      '<td>' + esc(summary.ownerLabel) + '</td>' +
      '<td style="text-align:right">' + publish + '</td>' +
    '</tr>';
  }).join('');
  return pageHead('Version History — ' + checklist.name, 'Checklist versions are never edited in place; publishing archives the prior active version.') +
    guardrailStrip([
      { label: 'Append-only version concept' },
      { label: 'Mock publishing only', tone: 'warn' }
    ]) +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>Version</th><th>Status</th><th>Created By</th><th>Reason for Change</th><th>Current Owner</th><th></th></tr></thead><tbody>' +
      rows + '</tbody></table></div>';
}

function viewRoleHome() {
  var role = state.role;
  var r = ROLES[role] || {};
  var profiles = {
    leadInspector: {
      title: 'Lead Inspector',
      purpose: 'Review assigned inspections, potential findings and report readiness.',
      queueTitle: 'Lead Review Queue',
      queueSub: 'Inspection execution and report-control work',
      chain: 'Report approval: Lead Inspector -> Department Manager -> GM -> ED',
      boundary: 'Lead Inspector reviews potential findings and sets severity before conversion. Finding closure still requires accepted evidence or authorized closure.',
      kpis: [
        ['Potential Findings', '2', 'Awaiting lead review', 'warn', 'findings'],
        ['Reports In Draft', '3', 'Preliminary or final', 'info', 'reports'],
        ['Audit Preparation', '1', 'Released planning item', 'neutral', 'planning']
      ],
      rows: [
        ['OPS-2026-001', 'Potential finding from Flight Operations checklist', 'Severity review pending', 'findings'],
        ['AUD-2026-001', 'Airline XYZ Operator Audit', 'Team and checklist execution', 'calendar'],
        ['RPT-2026-004', 'Preliminary report package', 'Lead sign-off before DM review', 'reports']
      ]
    },
    gm: {
      title: 'General Manager',
      purpose: 'Review planning packages, budget routing and report approvals.',
      queueTitle: 'GM Approval Queue',
      queueSub: 'Plans and reports requiring management decision',
      chain: 'Planning approval: Department Manager -> GM -> Finance -> ED',
      boundary: 'GM approval does not release an audit by itself. Finance and ED approval are still required before release.',
      kpis: [
        ['Plans Waiting', '3', 'Department submissions', 'warn', 'planning'],
        ['Finance Routing', '2', 'Budget review needed', 'info', 'planning'],
        ['Reports Waiting', '1', 'Final report review', 'neutral', 'reports']
      ],
      rows: [
        ['PLAN-2026-Q3', 'Quarterly surveillance plan', 'Check scope and budget rationale', 'planning'],
        ['AUD-2026-001', 'Airline XYZ Operator Audit', 'Release candidate after approvals', 'planning'],
        ['RPT-2026-002', 'Final report package', 'GM review before ED approval', 'reports']
      ]
    },
    finance: {
      title: 'Finance Review',
      purpose: 'Review planned audit budget and resource requests before ED approval.',
      queueTitle: 'Finance Review Queue',
      queueSub: 'Budget, travel and resource checks',
      chain: 'Finance is between GM review and ED approval for planning.',
      boundary: 'Finance reviews cost and resource justification only. It does not make regulatory, finding-closure or enforcement decisions.',
      kpis: [
        ['Budget Reviews', '2', 'Waiting finance action', 'warn', 'planning'],
        ['Returned Items', '1', 'Needs department revision', 'danger', 'planning'],
        ['Ready For ED', '1', 'Finance accepted', 'ok', 'planning']
      ],
      rows: [
        ['PLAN-2026-Q3', 'Surveillance plan budget', 'Travel and inspector-day review', 'planning'],
        ['AUD-2026-006', 'Maintenance provider inspection', 'Budget rationale returned', 'planning'],
        ['AUD-2026-001', 'Airline XYZ Operator Audit', 'Finance accepted for ED review', 'planning']
      ]
    },
    executiveDirector: {
      title: 'Executive Director',
      purpose: 'Final approval for released plans and final report packages.',
      queueTitle: 'Executive Approval Queue',
      queueSub: 'Final governance approvals',
      chain: 'Planning: DM -> GM -> Finance -> ED. Report: Lead -> DM -> GM -> ED.',
      boundary: 'ED approval is an internal governance step in this demo. Enforcement remains a separate authorized process, not an automatic outcome.',
      kpis: [
        ['Plan Approvals', '1', 'Ready for final approval', 'warn', 'planning'],
        ['Final Reports', '2', 'Awaiting ED approval', 'info', 'reports'],
        ['Returned', '0', 'Revision requested', 'ok', 'reports']
      ],
      rows: [
        ['PLAN-2026-Q3', 'Quarterly surveillance plan', 'Final approval before GM release', 'planning'],
        ['RPT-2026-002', 'Final report package', 'ED approval required', 'reports'],
        ['RPT-2026-004', 'Preliminary report path', 'Not ready for ED review', 'reports']
      ]
    }
  };
  var cfg = profiles[role] || profiles.leadInspector;
  var rows = cfg.rows.map(function (row) {
    return '<div class="list__row" data-act="nav" data-view="' + row[3] + '">' +
      '<div class="list__main"><div class="list__title"><span class="tag-pill">' + esc(row[0]) + '</span>' + esc(row[1]) + '</div>' +
      '<div class="list__meta"><span><b>Next action:</b> ' + esc(row[2]) + '</span></div></div>' +
      '<div class="list__side"><button class="btn btn--sm" data-act="nav" data-view="' + row[3] + '">Open</button></div>' +
    '</div>';
  }).join('');
  var kpis = cfg.kpis.map(function (k) {
    return kpiCard(k[0], k[1], k[2], { tone: k[3], view: k[4] });
  }).join('');

  return pageHead(cfg.title, r.question || cfg.purpose) +
    guardrailStrip([
      { label: 'Frontend-only demo' },
      { label: 'Mock governance queues', tone: 'info' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) +
    '<div class="grid grid--kpi mb-16">' + kpis + '</div>' +
    '<div class="grid grid--main">' +
      '<div class="card"><div class="card__head"><h3>' + esc(cfg.queueTitle) + '</h3><span class="sub">' + esc(cfg.queueSub) + '</span></div>' +
        '<div class="list">' + rows + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Approval Chain</h3></div><div class="card__body">' +
          '<div class="callout">' + esc(cfg.chain) + '</div>' +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Authority Boundary</h3></div><div class="card__body small">' + esc(cfg.boundary) + '</div></div>' +
      '</div>' +
    '</div>';
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

  var filteredProfiles = state.riskProfiles.filter(function (r) {
    if (filter === 'repeat') return r.drivers.join(' ').toLowerCase().indexOf('repeat') > -1;
    if (filter === 'overdue') return state.findings.some(function (f) { return f.orgId === r.orgId && dueInfo(f).overdue; });
    return true;
  });
  var signalItems = filteredProfiles.map(workItemFromRiskProfile).sort(workItemSort);

  return pageHead('Safety Intelligence Dashboard', 'Decide which risk, delay, or workload issue needs management attention today.', chips) +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'mock risk indicator', tone: 'info' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: DEMO_PERSISTENCE_CONFIG.label, tone: 'neutral' }
    ]) +
    renderAttentionStrip([
      { label: 'Highest Mock Risk', value: topRisk ? topRisk.score + ' · ' + orgName(topRisk.orgId) : '0', tone: topRisk ? 'warn' : 'ok' },
      { label: 'Overdue CAP/Evidence', value: String(overdue.length), tone: overdue.length ? 'danger' : 'ok' },
      { label: 'Waiting CAA Review', value: String(waiting.length), tone: waiting.length ? 'warn' : 'ok' },
      { label: 'Repeat risk profiles', value: String(repeat.length), tone: repeat.length ? 'warn' : 'ok' }
    ]) +
    '<div class="grid grid--main">' +
      '<div><h2 class="section-heading">Management Signal Table</h2>' +
        renderOpsTable(signalItems, { empty: 'No safety intelligence signals for this filter.' }) + '</div>' +
      '<div class="v2-panel">' +
        '<h3>Recommended Management Action</h3>' +
        '<p>' + esc(topRisk ? topRisk.recommendedAction : 'Review open findings and CAP/evidence queues.') + '</p>' +
        '<div class="divider"></div>' +
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

  var findings = renderOpsTable(fs.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }), { includeChildren: true, empty: 'No findings for this organization.' });
  var auditRows = renderOpsTable(audits.map(workItemFromAudit), { empty: 'No audits for this organization.' });

  return pageHead('Organization Risk Profile — ' + org.name, 'Understand why this organization needs oversight attention before planning or opening an inspection.',
    '<button class="btn" data-act="nav" data-view="safety-intelligence">Back to safety intelligence</button>') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'mock risk indicator', tone: 'info' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) +
    '<div class="risk-header">' +
      '<div class="risk-score__num">' + profile.score + '</div>' +
      '<div class="risk-header__main">' +
        '<b>' + esc(profile.band) + '</b>' +
        '<p>' + esc(profile.recommendedAction) + '</p>' +
        '<div class="chip-list">' + profile.drivers.map(function (d) { return '<span class="tag-pill">' + esc(d) + '</span>'; }).join('') + '</div>' +
        regulatoryTraceHtml(trace, true) +
      '</div>' +
      '<div class="risk-header__facts">' +
        compactMetric('CAP performance', profile.capPerformance, 'warn') +
        compactMetric('Fleet/management change', profile.fleetChange, 'info') +
        compactMetric('Occurrence trend placeholder', profile.occurrenceTrend, 'neutral') +
      '</div>' +
    '</div>' +
    '<h2 class="section-heading">Findings</h2>' +
    findings +
    '<h2 class="section-heading mt-16">Audit History</h2>' +
    auditRows;
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
      return '<div><b>' + esc(c.reference) + '</b> · ' + esc(c.title) + '<div class="ops-cell-sub">' +
        esc(c.applicability) + ' · Expected evidence: ' + esc(c.expectedEvidence.join(', ')) + '</div></div>';
    }).join('<div class="divider"></div>');
    var changes = d.changeHistory.map(function (c) {
      return esc(fmtDate(c.date)) + ': ' + esc(c.summary);
    }).join(' | ');
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(d.family + ' · ' + d.title) + '</div><div class="ops-cell-sub">' + esc(d.id) + '</div></td>' +
      '<td>' + esc(d.version) + '<div class="ops-cell-sub">Effective ' + esc(fmtDate(d.effectiveDate)) + '</div></td>' +
      '<td>' + v2Badge(d.status) + '</td>' +
      '<td>' + clauses + '</td>' +
      '<td class="ops-cell-muted">' + changes + '</td>' +
    '</tr>';
  }).join('');

  return pageHead('Regulatory Library', 'Inspect current references, versions, effective dates, configured rules and change status.', chips) +
    guardrailStrip([
      { label: 'Mock regulatory library' },
      { label: 'Demo data' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: 'No real regulatory ingestion', tone: 'neutral' }
    ]) +
    (rows ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>Reference</th><th>Version / effective</th><th>Status</th><th>Configured rules</th><th>Mock change history</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">No regulatory documents match this filter.</div>');
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
        metaItem('Application type', pkg.auditType) + metaItem('Domain', pkg.domain) + metaItem('Status', humanStatus(pkg.status)) + '</div>' +
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
  var statusBadge = demoBadge('Evidence capture demo', 'neutral');
  var outboxRows = outbox.length ? outbox.map(function (item) {
    return '<tr><td><div class="ops-cell-title">' + esc(item.id) + '</div><div class="ops-cell-sub">' + esc(item.payloadSummary) + '</div></td>' +
      '<td>' + esc(pkg.auditId) + '</td><td>' + esc(item.createdAt) + '</td><td>' + demoBadge(item.status || 'Saved note', 'ok') + '</td>' +
      '<td class="ops-cell-muted">Demo evidence note; no real upload/storage.</td></tr>';
  }).join('') : '';
  var outboxTable = outboxRows
    ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Evidence note</th><th>Audit</th><th>Created</th><th>Status</th><th>Boundary</th></tr></thead><tbody>' + outboxRows + '</tbody></table></div>'
    : '<div class="empty">No evidence notes yet.</div>';

  return pageHead('Inspection Evidence', 'Review mock field evidence captured during an inspection.',
    '<button class="btn btn--primary" data-act="offline-field-action">Save mock evidence note</button>') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'Filename placeholders only', tone: 'neutral' },
      { label: DEMO_PERSISTENCE_CONFIG.label }
    ]) +
    '<div class="offline-status mb-16">' + statusBadge +
      '<div><b>Use Save mock evidence note to add a demo evidence entry.</b>' +
      '<p>This is a stakeholder illustration only. It is not a production evidence repository or chain-of-custody record.</p></div></div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Field Evidence Package</h3><span class="sub">demo package</span></div><div class="card__body">' +
          '<div class="metaline mb-16">' + metaItem('Package', pkg.id) + metaItem('Audit', pkg.auditId) + metaItem('Checked out by', pkg.checkedOutBy) +
          metaItem('Status', humanStatus(pkg.status)) + '</div>' +
          '<div class="chip-list">' + pkg.localItems.map(function (i) { return '<span class="tag-pill">' + esc(i) + '</span>'; }).join('') + '</div>' +
          '<div class="divider"></div><button class="btn btn--primary" data-act="offline-field-action">Save mock evidence note</button>' +
        '</div></div>' +
        dossierPanel('Evidence Notes', outboxTable, outbox.length + ' saved in demo') +
      '</div>' +
      '<div class="v2-panel"><h3>Field Capture Placeholders</h3>' +
        compactMetric('Photos/videos/audio', 'Filename placeholders only', 'neutral') +
        compactMetric('Signature', 'Placeholder only', 'neutral') +
        compactMetric('Finding link', 'Example state only', 'warn') +
        compactMetric('Attachments', waiting + ' pending', waiting ? 'warn' : 'ok') +
      '</div>' +
    '</div>';
}

function viewUsoapReadiness() {
  var rows = state.usoapReadiness.map(function (r) {
    var history = r.verificationHistory.map(function (v) {
      return fmtDate(v.date) + ': ' + v.result;
    }).join(' | ');
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(r.pqId) + '</div><div class="ops-cell-sub">' + esc(r.note) + '</div></td>' +
      '<td>' + esc(r.criticalElement) + '</td>' +
      '<td>' + esc(r.auditArea) + '</td>' +
      '<td>' + esc(r.linkedCapIds.join(', ') || '-') + '</td>' +
      '<td>' + v2Badge(r.readinessStatus) + '</td>' +
      '<td class="ops-cell-muted">' + esc(history) + '</td>' +
    '</tr>';
  }).join('');
  return pageHead('USOAP Readiness Workspace', 'See PQ/CE gaps, missing evidence and readiness history without claiming official EI outcome.') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'Mock PQ readiness' },
      { label: 'No official EI score', tone: 'warn' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>PQ readiness item</th><th>Critical Element</th><th>Audit area</th><th>Linked CAP/Finding</th><th>Status</th><th>Verification history</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewCapEffectiveness() {
  var rows = state.capEffectiveness.map(function (c) {
    var f = findingById(c.findingId);
    var revs = c.revisionHistory.map(function (r) {
      return r.id + ' · ' + fmtDate(r.submittedDate) + ' · ' + humanStatus(r.status);
    }).join(' | ');
    return '<tr class="ops-row" data-act="nav" data-view="finding" data-id="' + esc(c.findingId) + '">' +
      '<td><div class="ops-cell-title">' + esc(c.findingId) + '</div><div class="ops-cell-sub">' + esc(f ? f.title : 'Historical CAP') + '</div></td>' +
      '<td>' + esc(orgName(c.orgId)) + '</td>' +
      '<td>' + esc(c.rootCauseQuality) + '</td>' +
      '<td>' + esc(humanStatus(c.verificationStatus)) + '</td>' +
      '<td>' + esc(c.recurrenceIndicator) + '<div class="ops-cell-sub">' + esc(c.reopenPath) + '</div></td>' +
      '<td class="ops-cell-muted">' + esc(revs) + '</td>' +
    '</tr>';
  }).join('');
  return pageHead('CAP Effectiveness', 'Decide whether accepted CAP actions worked after closure and whether recurrence needs attention.') +
    guardrailStrip([
      { label: 'Demo data' },
      { label: 'CAP accepted is not finding closed', tone: 'warn' },
      { label: 'Not a legal decision', tone: 'warn' }
    ]) +
    '<div class="callout mb-16">CAP acceptance is not finding closure. Effectiveness review is separate from evidence acceptance and closure.</div>' +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>Finding / CAP</th><th>Organization</th><th>Root cause quality</th><th>Effectiveness verification</th><th>Recurrence / reopen path</th><th>Revision history</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewAiAssistant() {
  var rows = state.aiSuggestions.map(function (s) {
    var decision = s.decision ? '<div class="callout mt-12"><b>Recorded decision:</b> ' + humanStatus(s.decision.status) +
      ' by ' + esc(s.decision.reviewer) + ' · saved in this browser for demo only.</div>' : '';
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(s.title) + '</div><div class="ops-cell-sub">Sources: ' + esc(s.sourceRefs.join(' · ')) + '</div></td>' +
      '<td>' + v2Badge(s.status) + '</td>' +
      '<td><textarea class="ai-draft" id="ai-edit-' + esc(s.id) + '">' + esc(s.decision && s.decision.finalText ? s.decision.finalText : s.draft) + '</textarea>' +
        '<div class="ops-cell-sub">' + esc(s.limitation) + ' Not a legal decision.</div>' + decision + '</td>' +
      '<td><div class="ops-actions">' +
        '<button class="btn btn--ok btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.accepted + '">Accept draft</button>' +
        '<button class="btn btn--primary btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.edited + '">Record edit</button>' +
        '<button class="btn btn--danger btn--sm" data-act="ai-decision" data-id="' + s.id + '" data-decision="' + V2_STATUS.rejected + '">Reject</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
  return pageHead('AI Inspector Assistant Panel', 'Review source-referenced draft assistance with accept, edit and reject controls.') +
    guardrailStrip([
      { label: 'AI-generated draft - requires authorized review', tone: 'warn' },
      { label: 'Demo data' },
      { label: 'Not a legal decision', tone: 'warn' },
      { label: 'No real AI service', tone: 'neutral' }
    ]) +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Draft suggestion</th><th>Status</th><th>Review text</th><th style="width:220px;text-align:right">Authorized review</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewSspNaspDashboard() {
  var objectives = state.sspNasp.objectives.map(function (o) {
    var spiRows = o.spis.map(function (s) {
      return '<tr><td><div class="ops-cell-title">' + esc(s.label) + '</div><div class="ops-cell-sub">Target: ' + esc(s.target) + '</div></td>' +
        '<td>' + esc(s.current) + '</td><td>' + esc(s.trend) + '</td></tr>';
    }).join('');
    var actionRows = o.naspActions.map(function (a) {
      return '<tr><td><div class="ops-cell-title">' + esc(a.id) + '</div><div class="ops-cell-sub">Linked oversight findings: ' + esc(a.linkedFindingIds.join(', ')) + '</div></td>' +
        '<td>' + esc(a.owner) + '</td><td>' + esc(fmtDate(a.targetDate)) + '</td><td>' + v2Badge(a.status) + '</td></tr>';
    }).join('');
    return dossierPanel(o.title,
      '<div class="reg-section-title">Safety Performance Indicators</div>' +
      '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>SPI</th><th>Current</th><th>Trend</th></tr></thead><tbody>' + spiRows + '</tbody></table></div>' +
      '<div class="reg-section-title mt-16">NASP actions</div>' +
      '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Action</th><th>Owner</th><th>Target</th><th>Status</th></tr></thead><tbody>' + actionRows + '</tbody></table></div>',
      humanStatus(o.status));
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
  var d = dueInfo(f);
  var dueTxt = f.dueDate
    ? ' &nbsp;·&nbsp; <b>Due Date:</b> ' + esc(fmtDate(f.dueDate) + (d.label !== '—' ? ' (' + d.label + ')' : ''))
    : '';
  return '<div class="nextbar">' +
    '<div class="nextbar__icon">➡️</div>' +
    '<div class="nextbar__txt"><b>Next action:</b> ' + esc(nextActionLabel(f)) +
    ' &nbsp;·&nbsp; <b>Owner:</b> ' + esc(ownerLabel(f)) + dueTxt + '</div>' +
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
  var attentionItems = needsAttention.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }).concat(notStarted.map(workItemFromAudit)).sort(workItemSort);

  return '' +
    pageHead('Supervisor / Manager Dashboard', 'Performance, risk, workload, SSP and CAP oversight.') +
    renderAttentionStrip([
      { label: 'Open Findings', value: String(k.openFindings), tone: k.openFindings ? 'warn' : 'ok' },
      { label: 'Overdue Findings', value: String(k.overdueFindings), tone: k.overdueFindings ? 'danger' : 'ok' },
      { label: 'Critical Findings', value: String(k.criticalFindings), tone: k.criticalFindings ? 'danger' : 'ok' },
      { label: 'Plan Completion', value: k.planCompletion + '%', tone: 'info' },
      { label: 'OHI', value: ohi.score + ' · ' + ohi.band, tone: ohi.score < 60 ? 'danger' : (ohi.score < 75 ? 'warn' : 'ok') }
    ]) +
    '<div class="guardrail-note"><b>Oversight Health Index:</b> Management indicator only. It does not trigger automatic enforcement, suspension or closure.</div>' +
    '<div class="row-actions mb-16">' +
      '<button class="btn btn--primary" data-act="nav" data-view="findings" data-filter="overdue">Open overdue findings</button>' +
      '<button class="btn" data-act="nav" data-view="calendar">Open audit work queue</button>' +
      '<button class="btn" data-act="nav" data-view="planning">Open planning</button>' +
    '</div>' +
    '<h2 class="section-heading">Management Attention</h2>' +
    renderOpsTable(attentionItems, { includeChildren: true, empty: 'No critical, overdue, or not-started management items right now.' });
}

function workbenchItem(tone, title, meta, actionLabel, view, id, filter) {
  var act = view ? ' data-act="nav" data-view="' + esc(view) + '"' : '';
  var idAttr = id ? ' data-id="' + esc(id) + '"' : '';
  var filterAttr = filter ? ' data-filter="' + esc(filter) + '"' : '';
  return '<div class="workbench-item' + (tone ? ' is-' + tone : '') + '"' + act + idAttr + filterAttr + '>' +
    '<div class="workbench-item__main"><b>' + esc(title) + '</b><span>' + esc(meta) + '</span></div>' +
    (actionLabel ? '<button class="btn btn--sm" data-act="nav" data-view="' + esc(view) + '"' + idAttr + filterAttr + '>' + esc(actionLabel) + '</button>' : '') +
  '</div>';
}

function quickAction(label, view, id, filter, primary) {
  return '<button class="btn ' + (primary ? 'btn--primary' : '') + '" data-act="nav" data-view="' + esc(view) + '"' +
    (id ? ' data-id="' + esc(id) + '"' : '') + (filter ? ' data-filter="' + esc(filter) + '"' : '') + '>' + esc(label) + '</button>';
}

/* =========================== Inspector dashboard =========================== */
function inspectorInspectionId(audit) {
  return audit && audit.id ? audit.id.replace('AUD-', 'INS-') : '-';
}

function inspectorCapId(finding) {
  if (!finding || !finding.id) return 'CAP-';
  var displayIds = {
    'SEC-2026-002': 'CAP-2026-021',
    'RAMP-2026-005': 'CAP-2026-020',
    'AWO-2026-003': 'CAP-2026-019',
    'CAB-2026-004': 'CAP-2026-018',
    'OPS-2025-014': 'CAP-2025-014'
  };
  if (displayIds[finding.id]) return displayIds[finding.id];
  var parts = finding.id.split('-');
  return 'CAP-' + parts.slice(1).join('-');
}

function inspectorProgressForAudit(audit) {
  if (isClosedAudit(audit)) return 100;
  if (audit.status === 'In Progress') return 65;
  if (audit.status === 'Scheduled' && audit.checklistStarted) return 30;
  return 0;
}

function inspectorProgressHtml(value) {
  var safe = Math.max(0, Math.min(100, Number(value) || 0));
  return '<div class="mini-progress"><span style="width:' + safe + '%"></span></div><span class="mini-progress__value">' + safe + '%</span>';
}

function reportLastUpdated(report) {
  var history = report && report.approval && report.approval.history ? report.approval.history : [];
  var last = history.length ? history[history.length - 1].date : '';
  return last ? fmtDate(last.slice(0, 10)) : '-';
}

function inspectorTable(headers, rows, empty) {
  if (!rows.length) return '<div class="empty">' + esc(empty || 'No rows to show.') + '</div>';
  return '<div class="ops-table-wrap inspector-table-wrap"><table class="ops-table inspector-table"><thead><tr>' +
    headers.map(function (header) { return '<th>' + esc(header) + '</th>'; }).join('') +
    '</tr></thead><tbody>' + rows.map(function (cells) {
      return '<tr>' + cells.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
}

function viewInspectorDashboard() {
  var assignedAudits = sortedAuditsForQueue(state.audits.filter(function (audit) {
    return auditAssignedToCurrentUser(audit) && !isClosedAudit(audit);
  }));
  var actionableFindings = inspectorActionableFindings();
  var capReview = actionableFindings.filter(function (f) { return f.status === 'CAP_SUBMITTED'; });
  var activeAudits = assignedAudits.filter(function (audit) {
    return audit.status === 'Scheduled' || audit.status === 'In Progress';
  });
  var draftReports = (state.auditReports || []).filter(function (report) {
    var audit = auditById(report.auditId);
    return report.status === 'draft' && audit && auditAssignedToCurrentUser(audit) && audit.status === 'In Progress';
  });

  var assignedRows = assignedAudits.map(function (audit) {
    return [
      esc(inspectorInspectionId(audit)),
      esc(orgName(audit.orgId)),
      esc(audit.type),
      auditStatusBadge(audit),
      esc(fmtDate(audit.date)),
      inspectorProgressHtml(inspectorProgressForAudit(audit)),
      '<button class="btn btn--sm" data-act="nav" data-view="audit-detail" data-id="' + esc(audit.id) + '">Open</button>'
    ];
  });

  var capRows = capReview.map(function (finding) {
    return [
      esc(inspectorCapId(finding)),
      esc(inspectorInspectionId(auditById(finding.auditId))),
      esc(orgName(finding.orgId)),
      esc(finding.responsiblePerson || 'Service provider'),
      esc(fmtDate(finding.cap && finding.cap.targetDate ? finding.cap.targetDate : finding.dueDate)),
      demoBadge('Pending Review', 'warn'),
      '<button class="btn btn--sm" data-act="nav" data-view="findings" data-filter="capreview" data-id="' + esc(finding.id) + '">Review</button>'
    ];
  });

  var reportRows = draftReports.map(function (report) {
    var audit = auditById(report.auditId);
    return [
      esc(report.id.replace('RPT-AUD-', 'RPT-')),
      esc(inspectorInspectionId(audit)),
      esc(audit ? orgName(audit.orgId) : '-'),
      esc(reportLastUpdated(report)),
      demoBadge('Ready to Submit', 'ok'),
      '<button class="btn btn--primary btn--sm" data-act="nav" data-view="audit-reports" data-id="' + esc(report.auditId) + '">Submit to Lead Inspector</button>'
    ];
  });

  return '' +
    pageHead('My Inspections', '') +
    '<div class="grid grid--kpi grid--kpi-4 mb-24">' +
      kpiCard('My Inspections', String(assignedAudits.length), 'Assigned to me', { view: 'calendar', tone: 'info' }) +
      kpiCard('In Progress', String(activeAudits.length), 'Inspections', { view: 'calendar', tone: 'warn' }) +
      kpiCard('CAP Reviews', String(capReview.length), 'Pending review', { view: 'findings', filter: 'capreview', tone: capReview.length ? 'ok' : 'neutral' }) +
      kpiCard('Draft Reports', String(draftReports.length), 'Ready to submit', { view: 'reports', tone: draftReports.length ? 'info' : 'neutral' }) +
    '</div>' +
    '<h2 class="section-heading">Assigned Inspections</h2>' +
    inspectorTable(['Inspection ID', 'Organization', 'Application Type', 'Status', 'Due Date', 'Progress', 'Action'], assignedRows, 'No inspections assigned to you.') +
    '<h2 class="section-heading mt-24">CAP Reviews</h2>' +
    inspectorTable(['CAP ID', 'Inspection ID', 'Organization', 'Submitted By', 'Due Date', 'Status', 'Action'], capRows, 'No CAP reviews are pending.') +
    '<h2 class="section-heading mt-24">Draft Reports</h2>' +
    inspectorTable(['Report ID', 'Inspection ID', 'Organization', 'Last Updated', 'Status', 'Action'], reportRows, 'No draft reports are ready to submit.');
}

/* =========================== Inspector CAP reviews =========================== */
function capReviewUiState() {
  var fallback = {
    expandedId: 'SEC-2026-002',
    tab: 'details',
    status: 'all',
    due: 'all',
    query: '',
    decision: '',
    comment: ''
  };
  state.capReviewUi = Object.assign(fallback, state.capReviewUi || {});
  if (['details', 'evidence', 'history'].indexOf(state.capReviewUi.tab) === -1) state.capReviewUi.tab = 'details';
  return state.capReviewUi;
}

function capReviewSourceFindings() {
  return visibleFindings().filter(function (finding) {
    return finding.capRequired && finding.cap;
  }).sort(function (a, b) {
    var aDate = (a.cap && a.cap.submittedDate) || a.issuedDate || '';
    var bDate = (b.cap && b.cap.submittedDate) || b.issuedDate || '';
    return bDate.localeCompare(aDate);
  });
}

function capReviewFindingDisplayId(finding) {
  var displayIds = {
    'SEC-2026-002': 'F-2026-001',
    'AWO-2026-003': 'F-2026-002',
    'RAMP-2026-005': 'F-2026-003',
    'CAB-2026-004': 'F-2026-004',
    'OPS-2025-014': 'F-2025-014'
  };
  return displayIds[finding.id] || finding.id;
}

function capReviewTargetDate(finding) {
  return (finding.cap && finding.cap.targetDate) || finding.dueDate || '';
}

function capReviewDueMeta(finding) {
  var target = capReviewTargetDate(finding);
  if (!target) return { key: 'later', label: '-', overdue: false, dueSoon: false };
  var days = daysBetween(DEMO_TODAY, target);
  if (days < 0) return { key: 'overdue', label: Math.abs(days) + ' day' + (Math.abs(days) === 1 ? '' : 's') + ' overdue', overdue: true, dueSoon: false };
  if (days <= 7) return { key: 'due_soon', label: days === 0 ? 'Due today' : 'Due in ' + days + ' day' + (days === 1 ? '' : 's'), overdue: false, dueSoon: true };
  return { key: 'later', label: 'Due in ' + days + ' days', overdue: false, dueSoon: false };
}

function capReviewStatusMeta(finding) {
  var capStatus = finding.cap && finding.cap.status ? finding.cap.status : '';
  if (finding.status === 'CAP_MORE_INFO' || /more information|returned|revision/i.test(capStatus)) {
    return { key: 'returned', label: 'Returned', tone: 'danger', icon: '!' };
  }
  if (finding.status === 'CAP_SUBMITTED' || /submitted|pending/i.test(capStatus)) {
    return { key: 'pending', label: 'Pending Review', tone: 'warn', icon: '!' };
  }
  if (/in review|under review/i.test(capStatus)) {
    return { key: 'in_review', label: 'In Review', tone: 'info', icon: '...' };
  }
  return { key: 'accepted', label: 'Accepted', tone: 'ok', icon: '✓' };
}

function capReviewMatchesFilters(finding, ui) {
  var query = (ui.query || '').toLowerCase().trim();
  var status = capReviewStatusMeta(finding);
  var due = capReviewDueMeta(finding);
  if (ui.status && ui.status !== 'all') {
    if (ui.status === 'overdue') {
      if (!due.overdue || status.key === 'accepted') return false;
    } else if (status.key !== ui.status) {
      return false;
    }
  }
  if (ui.due && ui.due !== 'all' && due.key !== ui.due) return false;
  if (!query) return true;
  var audit = auditById(finding.auditId);
  var haystack = [
    inspectorCapId(finding),
    inspectorInspectionId(audit),
    orgName(finding.orgId),
    capReviewFindingDisplayId(finding),
    finding.id,
    finding.title,
    finding.cap && finding.cap.responsible,
    finding.responsiblePerson
  ].join(' ').toLowerCase();
  return haystack.indexOf(query) !== -1;
}

function capReviewKpis(items) {
  var counts = { pending: 0, in_review: 0, accepted: 0, returned: 0, overdue: 0 };
  items.forEach(function (finding) {
    var status = capReviewStatusMeta(finding);
    var due = capReviewDueMeta(finding);
    counts[status.key] = (counts[status.key] || 0) + 1;
    if (due.overdue && status.key !== 'accepted') counts.overdue++;
  });
  return counts;
}

function capReviewStatCard(label, value, status, tone, icon) {
  return '<button class="cap-review-stat is-' + esc(tone || 'neutral') + '" data-act="cap-review-filter" data-status="' + esc(status) + '">' +
    '<span class="cap-review-stat__icon">' + esc(icon || '') + '</span>' +
    '<span><b>' + esc(label) + '</b><strong>' + esc(value) + '</strong></span>' +
    '<small>View <span aria-hidden="true">›</span></small>' +
  '</button>';
}

function capReviewSelectOptions(options, selected) {
  return options.map(function (option) {
    return '<option value="' + esc(option.value) + '"' + (option.value === selected ? ' selected' : '') + '>' + esc(option.label) + '</option>';
  }).join('');
}

function capReviewEvidenceRows(finding) {
  var rows = (finding.evidence || []).map(function (e) {
    return {
      id: e.id,
      fileName: e.fileName,
      type: e.type === 'mock-file-name-only' ? 'Document' : 'Document',
      uploadedBy: orgName(finding.orgId),
      uploadDate: e.uploadedDate,
      status: e.status
    };
  });
  if (rows.length) return rows;
  return [
    { id: 'CAP-EV-' + finding.id + '-1', fileName: 'risk_assessment.pdf', type: 'Document', uploadedBy: orgName(finding.orgId), uploadDate: (finding.cap && finding.cap.submittedDate) || DEMO_TODAY, status: 'Submitted' },
    { id: 'CAP-EV-' + finding.id + '-2', fileName: 'training_plan.xlsx', type: 'Document', uploadedBy: orgName(finding.orgId), uploadDate: (finding.cap && finding.cap.submittedDate) || DEMO_TODAY, status: 'Submitted' }
  ];
}

function capReviewEvidenceTable(finding, compact) {
  var rows = capReviewEvidenceRows(finding).map(function (file) {
    if (compact) {
      return '<tr>' +
        '<td><button class="cap-file-link" data-act="cap-review-evidence" data-id="' + esc(finding.id) + '" data-file="' + esc(file.fileName) + '">▧ ' + esc(file.fileName) + '</button></td>' +
        '<td>' + esc(file.type) + '</td>' +
        '<td>' + esc(file.uploadedBy) + '</td>' +
        '<td>' + esc(fmtDate(file.uploadDate)) + '</td>' +
      '</tr>';
    }
    return '<tr>' +
      '<td><button class="cap-file-link" data-act="cap-review-evidence" data-id="' + esc(finding.id) + '" data-file="' + esc(file.fileName) + '">▧ ' + esc(file.fileName) + '</button></td>' +
      '<td>' + esc(file.type) + '</td>' +
      '<td>' + esc(file.uploadedBy) + '</td>' +
      '<td>' + esc(fmtDate(file.uploadDate)) + '</td>' +
      '<td><button class="icon-btn" data-act="cap-review-evidence" data-id="' + esc(finding.id) + '" data-file="' + esc(file.fileName) + '" aria-label="Open ' + esc(file.fileName) + '">↓</button></td>' +
    '</tr>';
  }).join('');
  return '<div class="cap-review-evidence-table' + (compact ? ' is-compact' : '') + '"><table><thead><tr>' +
    (compact
      ? '<th>File Name</th><th>Type</th><th>Uploaded By</th><th>Upload Date</th>'
      : '<th>File Name</th><th>Type</th><th>Uploaded By</th><th>Upload Date</th><th></th>') +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function capReviewMetaGrid(finding) {
  var audit = auditById(finding.auditId);
  var status = capReviewStatusMeta(finding);
  return '<div class="cap-review-meta-grid">' +
    '<dl>' +
      '<dt>Organization</dt><dd>' + esc(orgName(finding.orgId)) + '</dd>' +
      '<dt>Inspection ID</dt><dd>' + esc(inspectorInspectionId(audit)) + '</dd>' +
      '<dt>Finding ID</dt><dd>' + esc(capReviewFindingDisplayId(finding)) + '</dd>' +
      '<dt>Finding Title</dt><dd>' + esc(finding.title) + '</dd>' +
      '<dt>Severity</dt><dd>' + severityHtml(finding) + '</dd>' +
    '</dl>' +
    '<dl>' +
      '<dt>Responsible Person</dt><dd>' + esc((finding.cap && finding.cap.responsible) || finding.responsiblePerson || '-') + '</dd>' +
      '<dt>Target Completion Date</dt><dd>' + esc(fmtDate(capReviewTargetDate(finding))) + '</dd>' +
      '<dt>CAP Status</dt><dd>' + demoBadge(status.label, status.tone) + '</dd>' +
      '<dt>Submitted By</dt><dd>' + esc(orgName(finding.orgId)) + '</dd>' +
      '<dt>Submitted Date</dt><dd>' + esc(fmtDate(finding.cap && finding.cap.submittedDate)) + '</dd>' +
    '</dl>' +
  '</div>';
}

function capReviewPlanHtml(finding) {
  var cap = finding.cap || {};
  var actions = (cap.correctiveAction || 'Corrective action not provided.').split(/\.\s*/).filter(Boolean);
  var actionList = actions.map(function (item, index) {
    return '<li>' + esc(item.replace(/\.$/, '')) + (index === actions.length - 1 ? '.' : '') + '</li>';
  }).join('');
  return '<div class="cap-review-text">' +
    '<h4>Corrective Action Plan</h4>' +
    '<p>' + esc(cap.correctiveAction || 'No corrective action plan has been submitted.') + '</p>' +
    '<h5>Root Cause</h5>' +
    '<p>' + esc(cap.rootCause || 'No root cause submitted.') + '</p>' +
    '<h5>Corrective Actions</h5>' +
    '<ol>' + (actionList || '<li>' + esc(cap.correctiveAction || 'No corrective action submitted.') + '</li>') + '</ol>' +
    '<h5>Preventive Action</h5>' +
    '<p>' + esc(cap.preventiveAction || 'No preventive action submitted.') + '</p>' +
  '</div>';
}

function capReviewDecisionPanel(finding, ui) {
  var decision = ui.decision || '';
  var comment = ui.comment || '';
  var returning = decision === 'return';
  var submitDisabled = !decision || (returning && !comment.trim());
  return '<div class="cap-review-decision">' +
    '<h4>Review Decision</h4>' +
    '<label class="cap-review-radio">' +
      '<input type="radio" name="cap-review-decision-' + esc(finding.id) + '" data-field="cap-review-decision" data-id="' + esc(finding.id) + '" value="accept"' + (decision === 'accept' ? ' checked' : '') + '>' +
      '<span><b>Accept CAP</b><small>The corrective actions are acceptable.</small></span>' +
    '</label>' +
    '<label class="cap-review-radio is-return">' +
      '<input type="radio" name="cap-review-decision-' + esc(finding.id) + '" data-field="cap-review-decision" data-id="' + esc(finding.id) + '" value="return"' + (decision === 'return' ? ' checked' : '') + '>' +
      '<span><b>Return for Revision</b><small>The corrective actions need improvement.</small></span>' +
    '</label>' +
    '<label class="cap-review-comment-label" for="cap-review-comment-' + esc(finding.id) + '">Comments ' + (returning ? '(required if returning)' : '(optional)') + '</label>' +
    '<textarea id="cap-review-comment-' + esc(finding.id) + '" data-field="cap-review-comment" data-id="' + esc(finding.id) + '" maxlength="1000" placeholder="Enter your comments...">' + esc(comment) + '</textarea>' +
    '<div class="cap-review-count">' + esc(String(comment.length)) + ' / 1000</div>' +
    '<button class="btn btn--primary cap-review-submit" data-act="cap-review-submit-decision" data-id="' + esc(finding.id) + '"' + (submitDisabled ? ' disabled' : '') + '>Submit Decision</button>' +
  '</div>';
}

function capReviewDetailsTab(finding, ui) {
  return capReviewMetaGrid(finding) +
    '<div class="cap-review-detail-grid">' +
      '<div>' + capReviewPlanHtml(finding) + '</div>' +
      '<div><h4>Evidence Provided (' + esc(String(capReviewEvidenceRows(finding).length)) + ')</h4>' +
        capReviewEvidenceTable(finding, true) +
        '<button class="btn btn--sm mt-12" data-act="cap-review-tab" data-id="' + esc(finding.id) + '" data-tab="evidence">View All Evidence</button>' +
        '<div class="cap-review-comments"><h4>Comments</h4>' +
          ((finding.commentsToAuditee || []).length
            ? '<ul>' + finding.commentsToAuditee.map(function (c) { return '<li><b>' + esc(c.author) + '</b> · ' + esc(fmtDate(c.date)) + '<br>' + esc(c.text) + '</li>'; }).join('') + '</ul>'
            : '<p>No comments added.</p>') +
        '</div>' +
      '</div>' +
      capReviewDecisionPanel(finding, ui) +
    '</div>';
}

function capReviewEvidenceTab(finding) {
  return '<div class="cap-review-tab-panel">' +
    '<h4>Evidence Provided</h4>' +
    capReviewEvidenceTable(finding, false) +
    '<div class="cap-review-note">File actions open the evidence record in this demo. No real file is downloaded or stored.</div>' +
  '</div>';
}

function capReviewHistoryTab(finding) {
  var events = [];
  (finding.capRevisions || []).forEach(function (rev) {
    events.push({ date: rev.submittedDate || finding.cap.submittedDate, title: humanStatus(rev.status), body: rev.payloadSummary || 'CAP revision submitted.' });
  });
  (finding.commentsToAuditee || []).forEach(function (comment) {
    events.push({ date: comment.date, title: 'Comment to Auditee - ' + comment.author, body: comment.text });
  });
  (finding.internalNotes || []).forEach(function (note) {
    events.push({ date: note.date, title: 'Internal CAA Note - ' + note.author, body: note.text });
  });
  state.auditLog.filter(function (entry) { return entry.target === finding.id; }).forEach(function (entry) {
    events.push({ date: entry.time ? entry.time.slice(0, 10) : '', title: entry.action, body: entry.actor || 'System' });
  });
  events.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  if (!events.length) events.push({ date: finding.cap && finding.cap.submittedDate, title: 'CAP submitted', body: 'Waiting for inspector review.' });
  return '<div class="cap-review-timeline">' + events.map(function (event) {
    return '<div class="cap-review-event"><span>' + esc(fmtDate(event.date)) + '</span><b>' + esc(event.title) + '</b><p>' + esc(event.body) + '</p></div>';
  }).join('') + '</div>';
}

function capReviewExpandedRow(finding, ui) {
  var status = capReviewStatusMeta(finding);
  var activeTab = ui.tab || 'details';
  var tabBody = activeTab === 'evidence'
    ? capReviewEvidenceTab(finding)
    : (activeTab === 'history' ? capReviewHistoryTab(finding) : capReviewDetailsTab(finding, ui));
  function tabButton(key, label) {
    return '<button class="cap-review-tab' + (activeTab === key ? ' is-active' : '') + '" data-act="cap-review-tab" data-id="' + esc(finding.id) + '" data-tab="' + esc(key) + '">' + esc(label) + '</button>';
  }
  return '<tr class="cap-review-expanded-row"><td colspan="8">' +
    '<div class="cap-review-expanded">' +
      '<div class="cap-review-expanded__head">' +
        '<h3>Finding: ' + esc(capReviewFindingDisplayId(finding)) + ' - ' + esc(finding.title) + '</h3>' +
        '<span>Submitted on: ' + esc(fmtDate(finding.cap && finding.cap.submittedDate)) + '</span>' +
      '</div>' +
      '<div class="cap-review-tabs">' + tabButton('details', 'CAP Details') + tabButton('evidence', 'Evidence') + tabButton('history', 'History') + '</div>' +
      '<div class="cap-review-tab-content is-' + esc(status.key) + '">' + tabBody + '</div>' +
    '</div>' +
  '</td></tr>';
}

function capReviewTableRows(items, ui) {
  if (!items.length) {
    return '<tr><td colspan="8"><div class="empty">No CAP reviews match these filters.</div></td></tr>';
  }
  return items.map(function (finding) {
    var audit = auditById(finding.auditId);
    var status = capReviewStatusMeta(finding);
    var expanded = ui.expandedId === finding.id;
    var chevron = expanded ? '⌃' : '⌄';
    var row = '<tr class="cap-review-row' + (expanded ? ' is-expanded' : '') + '">' +
      '<td>' + esc(inspectorCapId(finding)) + '</td>' +
      '<td>' + esc(inspectorInspectionId(audit)) + '</td>' +
      '<td>' + esc(orgName(finding.orgId)) + '</td>' +
      '<td>' + esc(capReviewFindingDisplayId(finding)) + '</td>' +
      '<td>' + esc(orgName(finding.orgId)) + '</td>' +
      '<td>' + esc(fmtDate(capReviewTargetDate(finding))) + '</td>' +
      '<td>' + demoBadge(status.label, status.tone) + '</td>' +
      '<td><div class="cap-review-actions">' +
        '<button class="btn btn--sm" data-act="cap-review-row" data-id="' + esc(finding.id) + '">Review</button>' +
        '<button class="icon-btn" data-act="cap-review-row" data-id="' + esc(finding.id) + '" aria-label="Toggle CAP details">' + esc(chevron) + '</button>' +
      '</div></td>' +
    '</tr>';
    return row + (expanded ? capReviewExpandedRow(finding, ui) : '');
  }).join('');
}

function viewInspectorCapReviews() {
  var ui = capReviewUiState();
  var allItems = capReviewSourceFindings();
  if (allItems.length && !findingById(ui.expandedId)) ui.expandedId = allItems[0].id;
  var kpis = capReviewKpis(allItems);
  var rows = allItems.filter(function (finding) { return capReviewMatchesFilters(finding, ui); });
  if (rows.length && ui.expandedId && !rows.some(function (finding) { return finding.id === ui.expandedId; })) {
    ui.expandedId = rows[0].id;
  }
  var statusOptions = capReviewSelectOptions([
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'in_review', label: 'In Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'returned', label: 'Returned' },
    { value: 'overdue', label: 'Overdue' }
  ], ui.status || 'all');
  var dueOptions = capReviewSelectOptions([
    { value: 'all', label: 'All' },
    { value: 'due_soon', label: 'Due Soon' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'later', label: 'Later' }
  ], ui.due || 'all');
  return '<div class="cap-review-page">' +
    pageHead('CAP Reviews', '') +
    '<div class="cap-review-stats">' +
      capReviewStatCard('Pending Review', kpis.pending, 'pending', 'warn', '○') +
      capReviewStatCard('In Review', kpis.in_review, 'in_review', 'info', '⌂') +
      capReviewStatCard('Accepted', kpis.accepted, 'accepted', 'ok', '✓') +
      capReviewStatCard('Returned', kpis.returned, 'returned', 'danger', '↩') +
      capReviewStatCard('Overdue', kpis.overdue, 'overdue', 'neutral', '↗') +
    '</div>' +
    '<div class="cap-review-filters">' +
      '<div class="cap-review-search"><input id="cap-review-search" type="search" data-field="cap-review-search" value="' + esc(ui.query || '') + '" placeholder="Search CAP ID, Inspection ID, Organization...">' +
        '<button class="icon-btn" data-act="cap-review-apply-filters" aria-label="Search">⌕</button></div>' +
      '<label>Status<select data-field="cap-review-status">' + statusOptions + '</select></label>' +
      '<label>Due Date<select data-field="cap-review-due">' + dueOptions + '</select></label>' +
      '<button class="btn btn--sm" data-act="cap-review-clear">↻ Clear Filters</button>' +
    '</div>' +
    '<div class="cap-review-table-wrap"><table class="cap-review-table"><thead><tr>' +
      '<th>CAP ID</th><th>Inspection ID</th><th>Organization</th><th>Finding ID</th><th>Submitted By</th><th>Due Date</th><th>Status</th><th>Action</th>' +
    '</tr></thead><tbody>' + capReviewTableRows(rows, ui) + '</tbody></table></div>' +
    '<div class="cap-review-footer"><span>Showing ' + esc(rows.length ? '1 to ' + rows.length + ' of ' + rows.length : '0') + ' results</span>' +
      '<div><button class="icon-btn" disabled>‹</button><button class="cap-review-page-btn is-active">1</button><button class="icon-btn" disabled>›</button><select aria-label="Rows per page"><option>10 / page</option></select></div>' +
    '</div>' +
  '</div>';
}

function capTrackingUiState() {
  var fallback = {
    tab: 'overview',
    reminderSentAt: '',
    exportedAt: '',
    selectedFindingId: '',
    detailTab: 'details',
    reviewStatus: 'not_effective',
    reviewComments: 'The submitted CAP does not address all required actions. Training records are still incomplete for some staff. Additional corrective actions are required.',
    reviewOutcome: 'needs_action',
    enforcementLevel: 'administrative_penalty',
    enforcementJustification: '',
    internalComment: '',
    inspectorReviewSentAt: '',
    leadInspectorRecommendationAt: '',
    unitEffectiveness: 'partially_effective',
    unitRecommendationType: 'administrative_penalty',
    unitRecommendationLevel: 'administrative_penalty',
    unitComplianceDueDate: '2026-09-20',
    unitJustification: 'The CAP has initiated corrective actions; however, updated training records are still incomplete for multiple staff members. Therefore, an administrative penalty is recommended to ensure timely compliance.',
    unitAttachmentName: '',
    unitManagerRecommendationAt: '',
    secondReportPreparedAt: '',
    submittedToUnitManagerAt: '',
    submittedToGeneralManagerAt: ''
  };
  state.capTrackingUi = Object.assign(fallback, state.capTrackingUi || {});
  if (['overview', 'timeline', 'communications', 'documents'].indexOf(state.capTrackingUi.tab) === -1) state.capTrackingUi.tab = 'overview';
  if (['details', 'history', 'communications', 'documents', 'enforcement'].indexOf(state.capTrackingUi.detailTab) === -1) state.capTrackingUi.detailTab = 'details';
  return state.capTrackingUi;
}

function capTrackingRows() {
  return [
    { id: 'F-2026-001', title: 'Risk assessment process is not comprehensive', level: 'Level 1', cap: 'Yes', owner: 'Safety Manager', due: '2026-07-06', status: 'CAP Submitted', days: '2 days', action: 'Review CAP', actionKey: 'review', tone: 'ok' },
    { id: 'F-2026-002', title: 'Training records incomplete for ground handling staff', level: 'Level 2', cap: 'Yes', owner: 'Training Manager', due: '2026-09-20', status: 'In Review', days: '77 days', action: 'View CAP', actionKey: 'view', tone: 'info' },
    { id: 'F-2026-003', title: 'Safety objectives are not measurable', level: 'Observation', cap: 'No', owner: '-', due: '', status: 'Observation', days: '-', action: 'View Finding', actionKey: 'finding', tone: 'neutral' },
    { id: 'F-2026-004', title: 'Emergency response procedures not documented', level: 'Level 1', cap: 'Yes', owner: 'Operations Manager', due: '2026-07-06', status: 'Overdue', days: '-1 day', action: 'Escalate', actionKey: 'escalate', tone: 'danger' },
    { id: 'F-2026-005', title: 'Internal audit program not fully implemented', level: 'Level 2', cap: 'Yes', owner: 'Quality Manager', due: '2026-09-20', status: 'Not Submitted', days: '77 days', action: 'Not Submitted', actionKey: 'pending', tone: 'warn' },
    { id: 'F-2026-006', title: 'Equipment maintenance records demonstrate compliance', level: 'Observation', cap: 'No', owner: '-', due: '', status: 'Observation', days: '-', action: 'View Finding', actionKey: 'finding', tone: 'neutral' },
    { id: 'F-2026-007', title: 'Procedures for contractor oversight need improvement', level: 'Level 2', cap: 'Yes', owner: 'Procurement Manager', due: '2026-09-20', status: 'Not Submitted', days: '77 days', action: 'Not Submitted', actionKey: 'pending', tone: 'warn' },
    { id: 'F-2026-008', title: 'Management review meetings not held regularly', level: 'Observation', cap: 'No', owner: '-', due: '', status: 'Observation', days: '-', action: 'View Finding', actionKey: 'finding', tone: 'neutral' }
  ];
}

function capTrackLevelBadge(level) {
  var tone = level === 'Level 1' ? 'danger' : (level === 'Level 2' ? 'warn' : 'info');
  return '<span class="cap-track-level is-' + tone + '">' + esc(level) + '</span>';
}

function capTrackStatusBadge(row) {
  return '<span class="cap-track-status is-' + esc(row.tone) + '">' + esc(row.status) + '</span>';
}

function capTrackStat(label, value, detail, tone) {
  return '<div class="cap-track-stat' + (tone ? ' is-' + tone : '') + '">' +
    '<span>' + esc(label) + '</span><b>' + esc(value) + '</b>' +
    (detail ? '<small>' + esc(detail) + '</small>' : '') +
  '</div>';
}

function capTrackTabButton(key, label, active) {
  return '<button class="cap-track-tab' + (active === key ? ' is-active' : '') + '" data-act="cap-track-tab" data-tab="' + esc(key) + '">' + esc(label) + '</button>';
}

function capTrackingTable(rows) {
  return '<div class="cap-track-table-wrap"><table class="cap-track-table"><thead><tr>' +
    '<th>Finding ID</th><th>Title</th><th>Level</th><th>CAP Required</th><th>CAP Owner</th><th>Due Date</th><th>Status</th><th>Days Remaining</th><th>Action</th>' +
  '</tr></thead><tbody>' + rows.map(function (row) {
    var actionDisabled = row.actionKey === 'pending' ? ' is-disabled' : '';
    return '<tr>' +
      '<td><b>' + esc(row.id) + '</b></td>' +
      '<td>' + esc(row.title) + '</td>' +
      '<td>' + capTrackLevelBadge(row.level) + '</td>' +
      '<td>' + esc(row.cap) + '</td>' +
      '<td>' + esc(row.owner) + '</td>' +
      '<td>' + esc(row.due ? fmtDate(row.due) : '-') + '</td>' +
      '<td>' + capTrackStatusBadge(row) + '</td>' +
      '<td class="' + (row.days.charAt(0) === '-' ? 'is-danger' : '') + '">' + esc(row.days) + '</td>' +
      '<td><div class="cap-track-actions">' +
        '<button class="btn btn--sm' + actionDisabled + '" data-act="cap-track-row-action" data-id="' + esc(row.id) + '" data-track-action="' + esc(row.actionKey) + '">' + esc(row.action) + '</button>' +
        '<button class="icon-btn" data-act="cap-track-row-action" data-id="' + esc(row.id) + '" data-track-action="menu" aria-label="More actions">...</button>' +
      '</div></td>' +
    '</tr>';
  }).join('') + '</tbody></table></div>' +
  '<div class="cap-track-footer"><span>Showing 1 to ' + rows.length + ' of ' + rows.length + ' findings</span>' +
    '<div><button class="icon-btn" disabled>‹</button><button class="cap-review-page-btn is-active">1</button><button class="icon-btn" disabled>›</button><select aria-label="Rows per page"><option>20 / page</option></select></div></div>';
}

function capTrackingOverview(ui, rows) {
  var reminderLabel = ui.reminderSentAt ? 'Reminder Sent' : 'Send Reminder';
  return '<div class="cap-track-overview">' +
    '<div class="cap-track-banner">' +
      '<div><b>The final report has been approved by the Executive Director and sent to the service provider on 22 Jun 2026.</b>' +
      '<p>The service provider must submit corrective action plans for each applicable finding within the defined deadlines.</p></div>' +
      '<button class="btn btn--sm" data-act="cap-track-reminder">Send Reminder</button>' +
      (ui.reminderSentAt ? '<span class="cap-track-reminder-note">' + esc(reminderLabel) + ' · ' + esc(ui.reminderSentAt) + '</span>' : '') +
    '</div>' +
    capTrackingTable(rows) +
  '</div>';
}

function capTrackingTimeline() {
  var events = [
    ['22 Jun 2026 14:30', 'Final report approved by Executive Director and sent to service provider.', 'John Lead Inspector'],
    ['22 Jun 2026 14:25', 'Final report submitted to Executive Director for approval.', 'John Lead Inspector'],
    ['21 Jun 2026 10:15', 'Final report approved by General Manager.', 'Michael General Manager'],
    ['20 Jun 2026 16:40', 'Final report approved by Unit Manager.', 'Ayse Unit Manager']
  ];
  return '<div class="cap-track-panel"><h2>Timeline</h2><div class="cap-track-activity">' + events.map(function (event) {
    return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-ok">✓</span><p><b>' + esc(event[1]) + '</b><small>' + esc(event[2]) + '</small></p></div>';
  }).join('') + '</div></div>';
}

function capTrackingCommunications(ui) {
  var sent = ui.reminderSentAt || 'Not sent in this browser session';
  return '<div class="cap-track-panel"><h2>Communications</h2>' +
    '<div class="cap-track-message"><b>Final report package sent</b><p>Sent to SkyCargo Air safety contact after ED approval on 22 Jun 2026.</p></div>' +
    '<div class="cap-track-message"><b>Latest reminder</b><p>' + esc(sent) + '</p></div>' +
    '<button class="btn btn--primary btn--sm" data-act="cap-track-reminder">Send Reminder to Service Provider</button>' +
  '</div>';
}

function capTrackingDocuments(ui) {
  var exported = ui.exportedAt ? '<p class="muted">Latest status export: ' + esc(ui.exportedAt) + '</p>' : '';
  var docs = [
    ['Final_Report_Approved.pdf', '1.0', '22 Jun 2026'],
    ['CAP_Request_Package.pdf', '1.0', '22 Jun 2026'],
    ['Findings_Index.pdf', '1.0', '22 Jun 2026'],
    ['Evidence_Index.pdf', '1.0', '22 Jun 2026']
  ];
  return '<div class="cap-track-panel"><h2>Documents</h2>' + exported +
    '<table class="cap-track-docs"><thead><tr><th>Document</th><th>Version</th><th>Date</th><th>Action</th></tr></thead><tbody>' +
      docs.map(function (doc) {
        return '<tr><td>' + esc(doc[0]) + '</td><td>' + esc(doc[1]) + '</td><td>' + esc(doc[2]) + '</td>' +
          '<td><button class="cap-file-link" data-act="cap-track-view-report">View</button></td></tr>';
      }).join('') +
    '</tbody></table></div>';
}

function capTrackingSide() {
  var steps = [
    ['done', '1. Final Report Approved', '22 Jun 2026 by Executive Director'],
    ['done', '2. Sent to Service Provider', '22 Jun 2026'],
    ['active', '3. CAP Submission', 'In Progress'],
    ['', '4. CAP Review', 'Waiting'],
    ['', '5. Implementation', 'Waiting'],
    ['', '6. Closure', 'Waiting']
  ];
  return '<aside class="cap-track-side">' +
    '<div class="cap-track-side-card">' +
      '<h2>CAP Process Overview</h2>' +
      '<div class="cap-track-process">' + steps.map(function (step, index) {
        return '<div class="cap-track-process-step is-' + esc(step[0] || 'waiting') + '">' +
          '<span>' + (step[0] === 'done' ? '✓' : (index + 1)) + '</span><p><b>' + esc(step[1]) + '</b><small>' + esc(step[2]) + '</small></p>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>' +
    '<div class="cap-track-side-card">' +
      '<h2>Enforcement Information</h2>' +
      '<dl class="cap-track-deadlines">' +
        '<dt>' + capTrackLevelBadge('Level 1') + '</dt><dd>14 days</dd>' +
        '<dt>' + capTrackLevelBadge('Level 2') + '</dt><dd>90 days</dd>' +
        '<dt>' + capTrackLevelBadge('Observation') + '</dt><dd>No CAP</dd>' +
      '</dl>' +
      '<button class="btn btn--sm" data-act="cap-track-quick-action" data-track-action="enforcement">View Enforcement Matrix</button>' +
    '</div>' +
    '<div class="cap-track-side-card">' +
      '<h2>Service Provider</h2>' +
      '<p><b>SkyCargo Air</b><br><span class="muted">Contact: safety@skycargoair.com</span></p>' +
      '<button class="btn btn--sm" data-act="cap-track-row-action" data-id="ORG-SKY" data-track-action="menu">View Organization Details</button>' +
    '</div>' +
  '</aside>';
}

function capTrackingRecentAndQuick() {
  var events = [
    ['22 Jun 2026 14:30', 'Final report approved by Executive Director and sent to service provider.', 'John Lead Inspector'],
    ['22 Jun 2026 14:25', 'Final report submitted to Executive Director for approval.', 'John Lead Inspector'],
    ['21 Jun 2026 10:15', 'Final report approved by General Manager.', 'Michael General Manager'],
    ['20 Jun 2026 16:40', 'Final report approved by Unit Manager.', 'Ayse Unit Manager']
  ];
  return '<div class="cap-track-lower">' +
    '<div class="cap-track-panel"><h2>Recent Activities</h2><div class="cap-track-activity">' +
      events.map(function (event, index) {
        return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-' + (index < 1 ? 'ok' : 'info') + '">' + (index < 1 ? '✓' : 'i') + '</span><p><b>' + esc(event[1]) + '</b><small>' + esc(event[2]) + '</small></p></div>';
      }).join('') +
    '</div></div>' +
    '<div class="cap-track-panel"><h2>Quick Actions</h2><div class="cap-track-quick">' +
      '<button data-act="cap-track-quick-action" data-track-action="report">View Final Report <span>›</span></button>' +
      '<button data-act="cap-track-quick-action" data-track-action="reminder">Send Reminder to Service Provider <span>›</span></button>' +
      '<button data-act="cap-track-row-action" data-id="F-2026-004" data-track-action="escalate">Escalate Overdue CAP <span>›</span></button>' +
      '<button data-act="cap-track-quick-action" data-track-action="export">Download CAP Status Report <span>›</span></button>' +
    '</div></div>' +
  '</div>';
}

function viewLeadCapTracking() {
  var ui = capTrackingUiState();
  var rows = capTrackingRows();
  var tabBody = ui.tab === 'timeline'
    ? capTrackingTimeline()
    : (ui.tab === 'communications'
      ? capTrackingCommunications(ui)
      : (ui.tab === 'documents' ? capTrackingDocuments(ui) : capTrackingOverview(ui, rows)));
  return '<div class="cap-track-page">' +
    '<div class="cap-track-head">' +
      '<div>' +
        '<div class="cap-track-breadcrumb">Inspections / INS-2026-015 / CAP Tracking</div>' +
        '<h1>CAP Tracking - Service Provider ' + demoBadge('Report Approved by ED', 'ok') + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Inspection Dates: <b>15 - 18 Jun 2026</b></span><span>Final Report Approved: <b>22 Jun 2026</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="cap-track-head-actions">' +
        '<button class="btn" data-act="cap-track-view-report">View Final Report</button>' +
        '<button class="btn" data-act="cap-track-export">Export</button>' +
      '</div>' +
    '</div>' +
    '<div class="cap-track-stats">' +
      capTrackStat('Total Findings', '8', 'Level 1: 2     Level 2: 3     Obs: 3') +
      capTrackStat('CAP Required', '5', 'Level 1: 2     Level 2: 3') +
      capTrackStat('CAP Submitted', '2', '40%', 'info') +
      capTrackStat('CAP In Review', '2', '40%', 'info') +
      capTrackStat('CAP Overdue', '1', '20%', 'danger') +
      capTrackStat('Closed', '0', '0%') +
      '<div class="cap-track-stat cap-track-stat--progress is-warn"><span>Overall CAP Status</span><b>In Progress</b><div class="bar"><i style="width:40%"></i></div><small>40%</small></div>' +
    '</div>' +
    '<div class="cap-track-tabs">' +
      capTrackTabButton('overview', 'CAP Overview', ui.tab) +
      capTrackTabButton('timeline', 'Timeline', ui.tab) +
      capTrackTabButton('communications', 'Communications', ui.tab) +
      capTrackTabButton('documents', 'Documents', ui.tab) +
    '</div>' +
    '<div class="cap-track-layout">' +
      '<main class="cap-track-main">' + tabBody + capTrackingRecentAndQuick() + '</main>' +
      capTrackingSide() +
    '</div>' +
  '</div>';
}

function capDetailRowById(id) {
  var rows = capTrackingRows();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  return rows[1] || rows[0];
}

function capDetailData(id) {
  var row = capDetailRowById(id || 'F-2026-002');
  var detail = {
    id: row.id,
    title: row.title,
    level: row.level,
    owner: row.owner,
    status: row.status,
    due: row.due,
    days: row.days,
    requirement: 'SMS 2.4 - Competency and Training',
    description: 'Training records for ground handling staff are incomplete. Some records do not include training dates, instructor names, and training content.',
    capDeadline: row.level === 'Level 1' ? '14 days' : (row.level === 'Level 2' ? '90 days' : 'No CAP'),
    originalDue: row.due || '2026-09-20',
    capSubmittedDate: row.id === 'F-2026-001' ? '2026-06-28' : '2026-06-28',
    rootCause: 'Lack of structured record-keeping process and insufficient oversight by training coordinator.',
    correctiveActions: [
      'Develop and implement training record standard template.',
      'Conduct training for all training coordinators.',
      'Review and update all existing training records.'
    ],
    evidence: [
      ['Training_Record_Template.pdf', 'Document', '216 KB'],
      ['Training_Coordinator_Training.xlsx', 'Spreadsheet', '512 KB'],
      ['Updated_Records_Sample.jpg', 'Image', '1.2 MB']
    ],
    previousReview: {
      reviewer: 'John Inspector',
      date: '05 Jul 2026',
      status: 'Needs Further Action',
      comments: 'Partial improvement observed. However, records remain incomplete for several employees.',
      requiredActions: [
        'Ensure all training records include missing information.',
        'Implement internal audit to verify compliance.',
        'Provide evidence of completed audit.'
      ]
    },
    actions: [
      ['22 Jun 2026 14:30', 'Executive Director', 'Final report approved and sent to service provider.', '-'],
      ['28 Jun 2026 09:15', 'Service Provider', 'CAP submitted.', 'Initial CAP submission.'],
      ['05 Jul 2026 11:20', 'Inspector', 'CAP reviewed (2nd review).', 'Partial improvement observed.'],
      ['05 Jul 2026 11:25', 'Inspector', 'CAP review sent to Lead Inspector.', 'Additional actions required.']
    ]
  };
  if (row.id !== 'F-2026-002') {
    detail.requirement = row.level === 'Level 1' ? 'SMS 2.1 - Risk Management Process' : detail.requirement;
    detail.description = row.title + ' is tracked under the ED-approved final report CAP package.';
    detail.previousReview.status = row.status === 'CAP Submitted' ? 'Pending 1st Review' : detail.previousReview.status;
  }
  return detail;
}

function capDetailTabButton(key, label, active) {
  return '<button class="cap-detail-tab' + (active === key ? ' is-active' : '') + '" data-act="cap-detail-tab" data-tab="' + esc(key) + '">' + esc(label) + '</button>';
}

function capDetailStep(stateKey, label, date, number) {
  var icon = stateKey === 'done' ? '✓' : number;
  return '<div class="cap-detail-step is-' + esc(stateKey || 'waiting') + '">' +
    '<span>' + esc(icon) + '</span><p><b>' + esc(label) + '</b><small>' + esc(date || 'Pending') + '</small></p>' +
  '</div>';
}

function capDetailProgress(ui) {
  var inspectorSent = !!ui.inspectorReviewSentAt;
  var unitReady = !!ui.submittedToUnitManagerAt || !!ui.leadInspectorRecommendationAt;
  return '<div class="cap-detail-steps">' +
    capDetailStep('done', 'Final Report Approved', '22 Jun 2026', 1) +
    capDetailStep('done', 'Sent to Service Provider', '22 Jun 2026', 2) +
    capDetailStep('done', 'CAP Submitted', '28 Jun 2026', 3) +
    capDetailStep(inspectorSent ? 'done' : 'active', 'Inspector CAP Review', inspectorSent ? ui.inspectorReviewSentAt : 'In Progress', 4) +
    capDetailStep(unitReady ? 'done' : 'waiting', 'Lead Inspector Validation', unitReady ? 'Ready for Unit Manager' : 'Pending', 5) +
    capDetailStep('waiting', 'Unit Manager Review', 'Pending', 6) +
    capDetailStep('waiting', 'General Manager Review', 'Pending', 7) +
    capDetailStep('waiting', 'ED Decision', 'Pending', 8) +
  '</div>';
}

function capDetailFindingPanel(data) {
  return '<section class="cap-detail-panel cap-detail-finding">' +
    '<h2>Finding Information</h2>' +
    '<dl>' +
      '<dt>Finding ID</dt><dd>' + esc(data.id) + '</dd>' +
      '<dt>Title</dt><dd>' + esc(data.title) + '</dd>' +
      '<dt>Requirement</dt><dd>' + esc(data.requirement) + '</dd>' +
      '<dt>Description</dt><dd>' + esc(data.description) + '</dd>' +
      '<dt>Level</dt><dd>' + capTrackLevelBadge(data.level) + '</dd>' +
      '<dt>Original Due Date</dt><dd>' + esc(fmtDate(data.originalDue)) + '</dd>' +
      '<dt>CAP Deadline (' + esc(data.level) + ')</dt><dd>' + esc(data.capDeadline) + '</dd>' +
      '<dt>Days Remaining</dt><dd><b class="' + (data.days.charAt(0) === '-' ? 'is-danger' : 'is-link') + '">' + esc(data.days) + '</b></dd>' +
    '</dl>' +
  '</section>';
}

function capDetailEvidenceList(data) {
  return '<div class="cap-detail-evidence-list">' + data.evidence.map(function (file) {
    var tone = file[1] === 'Image' ? 'info' : (file[1] === 'Spreadsheet' ? 'ok' : 'danger');
    return '<button class="cap-detail-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="' + esc(file[0]) + '">' +
      '<span class="cap-detail-file__icon is-' + tone + '">' + esc(file[1].slice(0, 1)) + '</span>' +
      '<span><b>' + esc(file[0]) + '</b><small>' + esc(file[2]) + '</small></span>' +
    '</button>';
  }).join('') + '</div>';
}

function capDetailReviewForm(ui, data) {
  var statusOptions = capReviewSelectOptions([
    { value: 'effective', label: 'Effective - close after verification' },
    { value: 'partially_effective', label: 'Partially Effective' },
    { value: 'not_effective', label: 'Not Effective' }
  ], ui.reviewStatus);
  var outcomeOptions = capReviewSelectOptions([
    { value: 'needs_action', label: 'Needs Further Action' },
    { value: 'prepare_enforcement', label: 'Prepare Enforcement Review' },
    { value: 'monitoring', label: 'Monitor Implementation' },
    { value: 'close_ready', label: 'Ready for Closure' }
  ], ui.reviewOutcome);
  return '<section class="cap-detail-panel cap-detail-review-form">' +
    '<h2>Inspector Review</h2>' +
    '<div class="form-row"><label>Review Status</label><select data-field="cap-detail-review-status">' + statusOptions + '</select></div>' +
    '<div class="form-row"><label>Review Comments</label><textarea data-field="cap-detail-review-comments" rows="4">' + esc(ui.reviewComments) + '</textarea></div>' +
    '<div class="cap-detail-form-row">' +
      '<div class="form-row"><label>Outcome</label><select data-field="cap-detail-review-outcome">' + outcomeOptions + '</select></div>' +
      '<button class="btn btn--primary" data-act="cap-detail-prepare-second-report" data-id="' + esc(data.id) + '">Send Review to Lead Inspector</button>' +
    '</div>' +
    (ui.inspectorReviewSentAt ? '<p class="cap-detail-note is-ok">Inspector review sent to Lead Inspector at ' + esc(ui.inspectorReviewSentAt) + '.</p>' : '') +
  '</section>';
}

function capDetailSubmittedCap(ui, data) {
  return '<section class="cap-detail-panel">' +
    '<div class="cap-detail-panel-head"><h2>CAP Submitted by Service Provider</h2>' + demoBadge('Submitted on ' + fmtDate(data.capSubmittedDate), 'ok') + '</div>' +
    '<h3>Root Cause</h3><p>' + esc(data.rootCause) + '</p>' +
    '<h3>Corrective Actions</h3><ol>' + data.correctiveActions.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ol>' +
    '<h3>Supporting Evidence</h3>' + capDetailEvidenceList(data) +
    capDetailReviewForm(ui, data) +
  '</section>';
}

function capDetailPreviousReview(data) {
  return '<section class="cap-detail-panel">' +
    '<h2>Previous Review Summary (1st Review)</h2>' +
    '<dl class="cap-detail-summary-dl">' +
      '<dt>Reviewed by</dt><dd>' + esc(data.previousReview.reviewer) + '</dd>' +
      '<dt>Review Date</dt><dd>' + esc(data.previousReview.date) + '</dd>' +
      '<dt>Review Status</dt><dd>' + esc(data.previousReview.status) + '</dd>' +
      '<dt>Comments</dt><dd>' + esc(data.previousReview.comments) + '</dd>' +
    '</dl>' +
    '<h3>Required Actions Provided</h3><ol>' + data.previousReview.requiredActions.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ol>' +
  '</section>';
}

function capDetailStatusCard(data) {
  return '<section class="cap-detail-panel">' +
    '<h2>CAP Status</h2>' +
    '<dl class="cap-detail-summary-dl">' +
      '<dt>Current Status</dt><dd><b class="is-warn">In Review (2nd Review)</b></dd>' +
      '<dt>CAP Submitted On</dt><dd>' + esc(fmtDate(data.capSubmittedDate)) + '</dd>' +
      '<dt>Next Review Due</dt><dd>15 Jul 2026</dd>' +
      '<dt>Overdue</dt><dd><b class="is-ok">No</b></dd>' +
    '</dl>' +
  '</section>';
}

function capDetailWorkflow(ui) {
  var leadState = ui.inspectorReviewSentAt ? 'Ready for validation' : 'Waiting for Inspector';
  var unitState = ui.submittedToUnitManagerAt || ui.leadInspectorRecommendationAt ? 'Ready for recommendation' : 'Pending';
  return '<section class="cap-detail-panel">' +
    '<h2>Inspector Review Handoff</h2>' +
    '<div class="cap-detail-workflow">' +
      '<div class="cap-detail-workflow-step is-active"><span>1</span><p><b>Inspector Review</b><small>CAP closure/effectiveness decision</small></p></div>' +
      '<div class="cap-detail-workflow-step' + (ui.inspectorReviewSentAt ? ' is-active' : '') + '"><span>2</span><p><b>Lead Inspector</b><small>' + esc(leadState) + '</small></p></div>' +
      '<div class="cap-detail-workflow-step' + (unitState.indexOf('Ready') === 0 ? ' is-active' : '') + '"><span>3</span><p><b>Unit Manager</b><small>' + esc(unitState) + '</small></p></div>' +
    '</div>' +
  '</section>';
}

function capDetailEnforcement(ui, data) {
  var selectedDecision = ui.enforcementLevel === 'level2' ? 'administrative_penalty' : (ui.enforcementLevel || 'administrative_penalty');
  var options = capReviewSelectOptions([
    { value: 'warning_letter', label: 'Warning Letter' },
    { value: 'administrative_penalty', label: 'Administrative Penalty' },
    { value: 'additional_cap_required', label: 'Additional CAP Required' },
    { value: 'increased_surveillance', label: 'Increased Surveillance' },
    { value: 'follow_up_inspection', label: 'Follow-up Inspection' },
    { value: 'operational_restriction', label: 'Operational Restriction' },
    { value: 'suspend_specific_privilege', label: 'Suspend Specific Privilege' },
    { value: 'suspend_certificate', label: 'Suspend Certificate' },
    { value: 'revoke_certificate', label: 'Revoke Certificate' },
    { value: 'reject_application', label: 'Reject Application' },
    { value: 'refuse_renewal', label: 'Refuse Renewal' },
    { value: 'other_regulatory_action', label: 'Other Regulatory Action' }
  ], selectedDecision);
  var cards = [
    ['warning_letter', 'Warning Letter', 'Written warning and continued CAP tracking.'],
    ['administrative_penalty', 'Administrative Penalty', 'Penalty recommendation according to configured regulation.'],
    ['additional_cap_required', 'Additional CAP Required', 'Require revised corrective and preventive action before closure.'],
    ['increased_surveillance', 'Increased Surveillance', 'Increase oversight frequency until risk is reduced.'],
    ['follow_up_inspection', 'Follow-up Inspection', 'Schedule verification inspection for finding closure evidence.'],
    ['operational_restriction', 'Operational Restriction', 'Limit the affected operation until compliance is restored.'],
    ['suspend_specific_privilege', 'Suspend Specific Privilege', 'Suspend a defined privilege rather than the full certificate.'],
    ['suspend_certificate', 'Suspend Certificate', 'Recommend certificate suspension through authorized approval.'],
    ['revoke_certificate', 'Revoke Certificate', 'Recommend revocation through authorized approval.'],
    ['reject_application', 'Reject Application', 'Reject the related application where requirements are not met.'],
    ['refuse_renewal', 'Refuse Renewal', 'Refuse renewal where renewal criteria are not satisfied.'],
    ['other_regulatory_action', 'Other Regulatory Action', 'Escalate to a configured regulatory action outside the standard list.']
  ];
  return '<section class="cap-detail-panel">' +
    '<h2>Enforcement Decision Options (if CAP not effective)</h2>' +
    '<div class="form-row"><label>Select Recommended Enforcement Decision</label><select data-field="cap-detail-enforcement-level">' + options + '</select></div>' +
    '<div class="cap-detail-enforcement-options">' + cards.map(function (card) {
      return '<label class="cap-detail-enforcement-option' + (selectedDecision === card[0] ? ' is-selected' : '') + '">' +
        '<input type="radio" name="cap-enforcement-level" value="' + esc(card[0]) + '" data-field="cap-detail-enforcement-level"' + (selectedDecision === card[0] ? ' checked' : '') + '>' +
        '<span><b>' + esc(card[1]) + '</b><small>' + esc(card[2]) + '</small></span>' +
      '</label>';
    }).join('') + '</div>' +
    '<div class="form-row"><label>Recommended Action Justification</label><textarea data-field="cap-detail-enforcement-justification" rows="3" placeholder="Provide justification for the recommended enforcement action.">' + esc(ui.enforcementJustification) + '</textarea></div>' +
    '<button class="btn btn--primary btn--block" data-act="cap-detail-submit-general-manager" data-id="' + esc(data.id) + '">Submit to General Manager</button>' +
    (ui.submittedToGeneralManagerAt ? '<p class="cap-detail-note is-ok">Recommendation submitted to General Manager at ' + esc(ui.submittedToGeneralManagerAt) + '.</p>' : '') +
  '</section>';
}

function capDetailQuickActions(data) {
  return '<section class="cap-detail-panel">' +
    '<h2>Quick Actions</h2>' +
    '<div class="cap-track-quick">' +
      '<button data-act="cap-track-view-report">View Final Report <span>›</span></button>' +
      '<button data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">Download Finding <span>›</span></button>' +
      '<button data-act="nav" data-view="unit-manager-review" data-id="' + esc(data.id) + '">Open Unit Manager Review <span>›</span></button>' +
      '<button data-act="cap-track-reminder">Send Reminder to Service Provider <span>›</span></button>' +
      '<button data-act="cap-track-row-action" data-id="' + esc(data.id) + '" data-track-action="escalate">Escalate Overdue CAP <span>›</span></button>' +
    '</div>' +
  '</section>';
}

function capDetailActionHistory(data) {
  return '<section class="cap-detail-panel cap-detail-action-history">' +
    '<h2>Action History</h2>' +
    '<table class="cap-detail-table"><thead><tr><th>Date</th><th>By</th><th>Action</th><th>Comments</th></tr></thead><tbody>' +
      data.actions.map(function (action) {
        return '<tr><td>' + esc(action[0]) + '</td><td>' + esc(action[1]) + '</td><td>' + esc(action[2]) + '</td><td>' + esc(action[3]) + '</td></tr>';
      }).join('') +
    '</tbody></table>' +
  '</section>';
}

function capDetailInternalComments(ui, data) {
  return '<section class="cap-detail-panel">' +
    '<h2>Internal Comments</h2>' +
    '<textarea data-field="cap-detail-internal-comment" rows="4" placeholder="Add internal CAA note...">' + esc(ui.internalComment) + '</textarea>' +
    '<button class="btn btn--sm" data-act="cap-detail-add-comment" data-id="' + esc(data.id) + '">Add Comment</button>' +
  '</section>';
}

function capDetailDocuments(data) {
  var docs = [
    ['Final_Report_Approved.pdf', 'Final report', '22 Jun 2026'],
    ['CAP_Submission_' + data.id + '.pdf', 'Service provider CAP', '28 Jun 2026'],
    ['Finding_' + data.id + '_Packet.pdf', 'Finding packet', '22 Jun 2026']
  ];
  return '<section class="cap-detail-panel"><h2>Documents</h2>' +
    '<table class="cap-detail-table"><thead><tr><th>Document</th><th>Type</th><th>Date</th><th>Action</th></tr></thead><tbody>' +
      docs.map(function (doc) {
        return '<tr><td>' + esc(doc[0]) + '</td><td>' + esc(doc[1]) + '</td><td>' + esc(doc[2]) + '</td><td><button class="cap-file-link" data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">Download</button></td></tr>';
      }).join('') +
    '</tbody></table></section>';
}

function capDetailCommunications(ui) {
  var sent = ui.reminderSentAt || 'No reminder sent in this browser session';
  return '<section class="cap-detail-panel"><h2>Communications</h2>' +
    '<div class="cap-track-message"><b>CAP submitted by service provider</b><p>SkyCargo Air submitted updated CAP evidence on 28 Jun 2026.</p></div>' +
    '<div class="cap-track-message"><b>Latest reminder</b><p>' + esc(sent) + '</p></div>' +
    '<button class="btn btn--primary btn--sm" data-act="cap-track-reminder">Send Reminder to Service Provider</button>' +
  '</section>';
}

function capDetailEnforcementProcess(ui) {
  return '<section class="cap-detail-panel"><h2>Enforcement Process</h2>' +
    '<p>The Inspector reviews CAP closure/effectiveness and sends the review to the Lead Inspector. After Lead Inspector validation, the Unit Manager recommends the enforcement, operational, licence renewal, or initial application decision. The General Manager reviews and may adjust the recommendation. The Executive Director makes the final decision.</p>' +
    '<div class="lead-preview-deadlines"><span>Level 1: 14 days</span><span>Level 2: 90 days</span><span>Observation: No CAP</span></div>' +
    '<p class="muted">Demo guardrail: enforcement is staged as an approval workflow, not an automatic legal action.</p>' +
  '</section>';
}

function capDetailMainBody(ui, data) {
  if (ui.detailTab === 'history') return capDetailActionHistory(data);
  if (ui.detailTab === 'communications') return capDetailCommunications(ui);
  if (ui.detailTab === 'documents') return capDetailDocuments(data);
  if (ui.detailTab === 'enforcement') return capDetailEnforcementProcess(ui);
  return '<div class="cap-detail-workspace">' +
    capDetailFindingPanel(data) +
    '<div class="cap-detail-center">' +
      capDetailSubmittedCap(ui, data) +
      capDetailActionHistory(data) +
    '</div>' +
  '</div>';
}

function viewLeadCapReviewDetail() {
  var ui = capTrackingUiState();
  var id = state.params.findingId || ui.selectedFindingId || 'F-2026-002';
  var data = capDetailData(id);
  ui.selectedFindingId = data.id;
  var body = capDetailMainBody(ui, data);
  return '<div class="cap-detail-page">' +
    '<div class="cap-detail-head">' +
      '<div>' +
        '<div class="cap-track-breadcrumb">CAP Tracking › Finding: ' + esc(data.id) + '</div>' +
        '<h1>CAP Review - Finding ' + esc(data.id) + ' ' + capTrackLevelBadge(data.level) + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Final Report Approved: <b>22 Jun 2026</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="cap-track-head-actions">' +
        '<button class="btn" data-act="cap-track-view-report">View Final Report</button>' +
        '<button class="btn" data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">Download Finding</button>' +
        '<button class="btn" data-act="nav" data-view="findings" data-filter="capreview">Back to CAP Tracking</button>' +
      '</div>' +
    '</div>' +
    capDetailProgress(ui) +
    '<div class="cap-detail-tabs">' +
      capDetailTabButton('details', 'Finding Details', ui.detailTab) +
      capDetailTabButton('history', 'CAP History', ui.detailTab) +
      capDetailTabButton('communications', 'Communications', ui.detailTab) +
      capDetailTabButton('documents', 'Documents', ui.detailTab) +
      capDetailTabButton('enforcement', 'Enforcement Process', ui.detailTab) +
    '</div>' +
    '<div class="cap-detail-layout">' +
      '<main>' + body + '</main>' +
      '<aside class="cap-detail-side">' +
        capDetailPreviousReview(data) +
        capDetailStatusCard(data) +
        capDetailWorkflow(ui) +
        capDetailInternalComments(ui, data) +
        capDetailQuickActions(data) +
      '</aside>' +
    '</div>' +
  '</div>';
}

function capUnitStep(stateKey, label, date, number) {
  return '<div class="cap-unit-step is-' + esc(stateKey || 'waiting') + '">' +
    '<span>' + esc(stateKey === 'done' ? '✓' : number) + '</span>' +
    '<p><b>' + esc(label) + '</b><small>' + esc(date || 'Pending') + '</small></p>' +
  '</div>';
}

function capUnitProgress(ui) {
  var submitted = !!ui.submittedToGeneralManagerAt;
  return '<div class="cap-unit-steps">' +
    capUnitStep('done', 'Final Report Approved', '22 Jun 2026', 1) +
    capUnitStep('done', 'Sent to Service Provider', '22 Jun 2026', 2) +
    capUnitStep('done', 'CAP Submitted', '28 Jun 2026', 3) +
    capUnitStep('done', 'CAP Reviewed (1st)', '05 Jul 2026', 4) +
    capUnitStep('done', '2nd Final Report (Inspectors)', '05 Jul 2026', 5) +
    capUnitStep(submitted ? 'done' : 'active', 'Unit Manager Review', submitted ? ui.submittedToGeneralManagerAt : 'In Progress', 6) +
    capUnitStep(submitted ? 'active' : 'waiting', 'General Manager Review', submitted ? 'In Review' : 'Pending', 7) +
    capUnitStep('waiting', 'ED Decision', 'Pending', 8) +
    capUnitStep('waiting', 'Enforcement Implemented', 'Pending', 9) +
  '</div>';
}

function capUnitRadio(name, field, value, selected, title, detail) {
  return '<label class="cap-unit-radio' + (selected === value ? ' is-selected' : '') + '">' +
    '<input type="radio" name="' + esc(name) + '" data-field="' + esc(field) + '" value="' + esc(value) + '"' + (selected === value ? ' checked' : '') + '>' +
    '<span><b>' + esc(title) + '</b>' + (detail ? '<small>' + esc(detail) + '</small>' : '') + '</span>' +
  '</label>';
}

function capUnitSummaryPanel(data) {
  return '<section class="cap-detail-panel">' +
    '<div class="cap-detail-panel-head"><h2>Summary of CAP Submitted by Service Provider (28 Jun 2026)</h2>' + demoBadge('Submitted', 'ok') + '</div>' +
    '<h3>Root Cause</h3><p>' + esc(data.rootCause) + '</p>' +
    '<h3>Corrective Actions</h3><ol>' + data.correctiveActions.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ol>' +
    '<h3>Evidence Provided</h3>' + capDetailEvidenceList(data) +
  '</section>';
}

function capUnitInspectorReviewPanel(data) {
  return '<section class="cap-detail-panel">' +
    '<h2>Review by Inspectors (2nd Review)</h2>' +
    '<dl class="cap-detail-summary-dl">' +
      '<dt>Lead Inspector</dt><dd>John Lead Inspector</dd>' +
      '<dt>Review Date</dt><dd>05 Jul 2026</dd>' +
      '<dt>Review Status</dt><dd><b class="is-warn">Needs Further Action</b></dd>' +
      '<dt>Comments</dt><dd>The CAP addresses some of the issues, but updated training records are still incomplete for several employees. Additional corrective actions are required.</dd>' +
    '</dl>' +
    '<button class="btn btn--sm mt-12" data-act="cap-unit-view-inspector-report" data-id="' + esc(data.id) + '">View 2nd Final Report (Inspectors)</button>' +
  '</section>';
}

function capUnitRecommendationForm(ui, data) {
  var effectiveness = ui.unitEffectiveness || 'partially_effective';
  var legacyDecisionMap = {
    level1: 'warning_letter',
    level2: 'administrative_penalty',
    level3: 'operational_restriction',
    level4: 'suspend_certificate',
    operational_restrictions: 'operational_restriction',
    certificate_action: 'suspend_certificate',
    license_suspension: 'suspend_certificate',
    revocation: 'revoke_certificate',
    accept_initial_application: 'other_regulatory_action',
    accept_with_conditions: 'additional_cap_required',
    license_renewal: 'refuse_renewal',
    variation_limitation: 'operational_restriction'
  };
  var recommendation = legacyDecisionMap[ui.unitRecommendationType] || ui.unitRecommendationType || 'administrative_penalty';
  var selectedDecision = legacyDecisionMap[ui.unitRecommendationLevel] || ui.unitRecommendationLevel || recommendation;
  var enforcementDecisionOptions = [
    { value: 'warning_letter', label: 'Warning Letter' },
    { value: 'administrative_penalty', label: 'Administrative Penalty' },
    { value: 'additional_cap_required', label: 'Additional CAP Required' },
    { value: 'increased_surveillance', label: 'Increased Surveillance' },
    { value: 'follow_up_inspection', label: 'Follow-up Inspection' },
    { value: 'operational_restriction', label: 'Operational Restriction' },
    { value: 'suspend_specific_privilege', label: 'Suspend Specific Privilege' },
    { value: 'suspend_certificate', label: 'Suspend Certificate' },
    { value: 'revoke_certificate', label: 'Revoke Certificate' },
    { value: 'reject_application', label: 'Reject Application' },
    { value: 'refuse_renewal', label: 'Refuse Renewal' },
    { value: 'other_regulatory_action', label: 'Other Regulatory Action' }
  ];
  var levelOptions = capReviewSelectOptions(enforcementDecisionOptions, selectedDecision);
  return '<section class="cap-detail-panel cap-unit-evaluation">' +
    '<h2>Unit Manager Evaluation &amp; Recommendation</h2>' +
    '<p class="muted">Based on the inspectors review and CAP submitted, provide your evaluation and recommendation.</p>' +
    '<h3>CAP Effectiveness</h3>' +
    '<div class="cap-unit-radio-list">' +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'effective', effectiveness, 'Effective', 'CAP fully addresses the finding.') +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'partially_effective', effectiveness, 'Partially Effective', 'CAP addresses some issues but additional actions are required.') +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'not_effective', effectiveness, 'Not Effective', 'CAP does not adequately address the finding.') +
    '</div>' +
    '<h3>Enforcement Decision</h3>' +
    '<div class="cap-unit-choice-grid">' +
      '<div><h4>CAP / Surveillance</h4>' +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'warning_letter', recommendation, 'Warning Letter', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'administrative_penalty', recommendation, 'Administrative Penalty', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'additional_cap_required', recommendation, 'Additional CAP Required', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'increased_surveillance', recommendation, 'Increased Surveillance', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'follow_up_inspection', recommendation, 'Follow-up Inspection', '') +
      '</div>' +
      '<div><h4>Operational / Certificate</h4>' +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'operational_restriction', recommendation, 'Operational Restriction', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'suspend_specific_privilege', recommendation, 'Suspend Specific Privilege', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'suspend_certificate', recommendation, 'Suspend Certificate', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'revoke_certificate', recommendation, 'Revoke Certificate', '') +
      '</div>' +
      '<div><h4>Application / Other</h4>' +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'reject_application', recommendation, 'Reject Application', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'refuse_renewal', recommendation, 'Refuse Renewal', '') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'other_regulatory_action', recommendation, 'Other Regulatory Action', '') +
      '</div>' +
    '</div>' +
    '<div class="cap-unit-form-grid">' +
      '<div class="form-row"><label>Recommended Enforcement Decision</label><select data-field="cap-unit-recommendation-level">' + levelOptions + '</select></div>' +
      '<div class="form-row"><label>Recommended Due Date for Compliance</label><input type="date" data-field="cap-unit-compliance-due-date" value="' + esc(ui.unitComplianceDueDate || '2026-09-20') + '"></div>' +
      '<div class="form-row cap-unit-justification"><label>Justification / Recommendation Details</label><textarea data-field="cap-unit-justification" rows="5">' + esc(ui.unitJustification || '') + '</textarea></div>' +
      '<div class="form-row"><label>Attachments (Optional)</label><div class="cap-unit-file-row"><span>' + esc(ui.unitAttachmentName || 'No file chosen') + '</span><button class="btn btn--sm" data-act="cap-unit-choose-file" data-id="' + esc(data.id) + '">Choose File</button></div></div>' +
    '</div>' +
    '<button class="btn btn--primary" data-act="cap-unit-submit-general-manager" data-id="' + esc(data.id) + '">Submit Recommendation to General Manager</button>' +
    (ui.submittedToGeneralManagerAt ? '<p class="cap-detail-note is-ok">Recommendation submitted to General Manager at ' + esc(ui.submittedToGeneralManagerAt) + '.</p>' : '') +
  '</section>';
}

function capUnitWorkflow(ui) {
  var submitted = !!ui.submittedToGeneralManagerAt;
  var steps = [
    ['done', 'Inspectors Review', 'Completed', '05 Jul 2026'],
    [submitted ? 'done' : 'active', 'Unit Manager Review', submitted ? 'Submitted' : 'In Progress', submitted ? ui.submittedToGeneralManagerAt : ''],
    [submitted ? 'active' : 'waiting', 'General Manager Review', submitted ? 'In Review' : 'Pending', ''],
    ['waiting', 'Executive Director (ED) Decision', 'Pending', ''],
    ['waiting', 'Enforcement Implemented', 'Pending', '']
  ];
  return '<section class="cap-detail-panel"><h2>Approval Workflow</h2><div class="cap-track-process">' +
    steps.map(function (step, index) {
      return '<div class="cap-track-process-step is-' + esc(step[0]) + '">' +
        '<span>' + esc(step[0] === 'done' ? '✓' : index + 1) + '</span><p><b>' + esc(step[1]) + '</b><small>' + esc(step[2]) + (step[3] ? '<br>' + esc(step[3]) : '') + '</small></p>' +
      '</div>';
    }).join('') + '</div></section>';
}

function capUnitHistory() {
  var events = [
    ['22 Jun 2026', 'Final report approved by ED and sent to service provider.'],
    ['28 Jun 2026', 'CAP submitted by service provider.'],
    ['05 Jul 2026', 'Reviewed by inspectors (2nd review).'],
    ['Today', 'Pending Unit Manager review and recommendation.']
  ];
  return '<section class="cap-detail-panel"><h2>Finding History</h2><div class="cap-track-activity cap-unit-history">' +
    events.map(function (event) {
      return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-info">o</span><p><b>' + esc(event[1]) + '</b></p></div>';
    }).join('') + '</div></section>';
}

function capUnitDocuments(data) {
  var docs = [
    ['Final Report (1st)', '22 Jun 2026'],
    ['2nd Final Report (Inspectors)', '05 Jul 2026'],
    ['CAP Submission', '28 Jun 2026']
  ];
  return '<section class="cap-detail-panel"><h2>Related Documents</h2><div class="cap-track-quick">' +
    docs.map(function (doc) {
      return '<button data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">' + esc(doc[0]) + '<span>' + esc(doc[1]) + '</span></button>';
    }).join('') + '</div></section>';
}

function capUnitReminder(data) {
  return '<section class="cap-unit-reminder"><h2>Reminder</h2>' +
    '<p>CAP due date: ' + esc(fmtDate(data.due)) + '</p>' +
    '<b>' + esc(data.days) + ' remaining</b>' +
  '</section>';
}

function viewUnitManagerCapReview() {
  var ui = capTrackingUiState();
  var id = state.params.findingId || ui.selectedFindingId || 'F-2026-002';
  var data = capDetailData(id);
  ui.selectedFindingId = data.id;
  return '<div class="cap-detail-page cap-unit-page">' +
    '<div class="cap-detail-head">' +
      '<div>' +
        '<div class="cap-track-breadcrumb">CAP Reviews › Finding: ' + esc(data.id) + ' › Unit Manager Review</div>' +
        '<h1>Unit Manager Review - Finding ' + esc(data.id) + ' ' + capTrackLevelBadge(data.level) + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Final Report Approved: <b>22 Jun 2026</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="cap-track-head-actions">' +
        '<button class="btn" data-act="cap-track-view-report">View Final Report (1st)</button>' +
        '<button class="btn" data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">Download Finding</button>' +
        '<button class="btn" data-act="nav" data-view="findings" data-filter="capreview">Back to CAP Tracking</button>' +
      '</div>' +
    '</div>' +
    capUnitProgress(ui) +
    '<div class="cap-unit-layout">' +
      '<aside class="cap-unit-left">' + capDetailFindingPanel(data) + '</aside>' +
      '<main class="cap-unit-main">' +
        capUnitSummaryPanel(data) +
        capUnitRecommendationForm(ui, data) +
      '</main>' +
      '<aside class="cap-unit-right">' +
        capUnitInspectorReviewPanel(data) +
        capUnitWorkflow(ui) +
        capUnitHistory() +
        capUnitDocuments(data) +
        '<section class="cap-detail-panel"><h2>Quick Actions</h2><div class="cap-track-quick">' +
          '<button data-act="open" data-id="' + esc(data.id) + '">View Finding Details <span>›</span></button>' +
          '<button data-act="cap-unit-view-inspector-report" data-id="' + esc(data.id) + '">View All CAP Submissions <span>›</span></button>' +
          '<button data-act="cap-track-reminder">Send Message to Service Provider <span>›</span></button>' +
          '<button data-act="cap-track-row-action" data-id="' + esc(data.id) + '" data-track-action="escalate">Escalate Overdue CAP <span>›</span></button>' +
        '</div></section>' +
        capUnitReminder(data) +
      '</aside>' +
    '</div>' +
  '</div>';
}

function viewProfile() {
  var r = ROLES[state.role] || ROLES.inspector;
  return pageHead('Profile', '') +
    '<div class="card"><div class="card__body">' +
      '<div class="metaline">' +
        metaItem('Name', r.user) +
        metaItem('Role', EXPERIENCE_LABEL[state.role] || r.name) +
        metaItem('Workspace', state.role === 'inspector' ? 'My Inspections' : homeView(state.role)) +
        metaItem('Demo scope', 'Frontend-only mock data') +
      '</div>' +
    '</div></div>';
}

/* =========================== Auditee — My Findings =========================== */
function viewAuditeeMyFindings() {
  var mine = visibleFindings();
  var open = mine.filter(function (f) { return f.status !== 'CLOSED'; });
  var capReq = mine.filter(function (f) { return f.status === 'WAITING_CAP' || f.status === 'CAP_MORE_INFO'; });
  var evReq = mine.filter(function (f) { return f.status === 'EVIDENCE_REQUIRED' || f.status === 'EVIDENCE_MORE_INFO'; });
  var dueSoon = open.filter(function (f) { return dueInfo(f).dueSoon; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });

  var items = mine.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }).sort(workItemSort);

  return '' +
    pageHead('Service Provider Portal — ' + ROLES.auditee.orgName, 'What the CAA needs from your organization, and by when.') +
    '<div class="scope-note">🔒 You are viewing only ' + esc(ROLES.auditee.orgName) + ' portal data. CAA-only working information is outside this portal.</div>' +
    renderAttentionStrip([
      { label: 'CAP required', value: String(capReq.length), tone: capReq.length ? 'warn' : 'ok' },
      { label: 'Evidence required', value: String(evReq.length), tone: evReq.length ? 'warn' : 'ok' },
      { label: 'Due Soon', value: String(dueSoon.length), tone: dueSoon.length ? 'warn' : 'ok' },
      { label: 'Overdue', value: String(overdue.length), tone: overdue.length ? 'danger' : 'ok' }
    ]) +
    '<h2 class="section-heading">My CAA Requests</h2>' +
    renderOpsTable(items, {
      includeChildren: true,
      hideOrganization: true,
      empty: 'Your organization has no open findings. Nothing is required right now.'
    });
}

/* =========================== Audit Work Queue =========================== */
var AUDIT_FILTER_LABELS = {
  active: 'Active audits',
  completed: 'Completed'
};
var AUDIT_QUEUE_FILTERS = ['active', 'completed'];

function sortedAuditsForQueue(list) {
  return list.slice().sort(function (a, b) {
    var aClosed = isClosedAudit(a);
    var bClosed = isClosedAudit(b);
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    var ad = auditDueInfo(a).days;
    var bd = auditDueInfo(b).days;
    if (ad === null && bd === null) return a.date < b.date ? -1 : 1;
    if (ad === null) return 1;
    if (bd === null) return -1;
    if (ad !== bd) return ad - bd;
    return a.id.localeCompare(b.id);
  });
}

function auditsForQueueScope() {
  var audits = state.audits.slice();
  if (state.role !== 'inspector') return audits;
  return audits.filter(function (a) {
    if (!auditAssignedToCurrentUser(a)) return false;
    if (isClosedAudit(a)) return true;
    var ownerRole = auditStatusMeta(a).ownerRole;
    return ownerRole === 'inspector' || ownerRole === 'leadInspector';
  });
}

function filterAudits(filter) {
  var audits = auditsForQueueScope();
  switch (filter) {
    case 'completed': return audits.filter(isClosedAudit);
    case 'active':
    default: return audits.filter(function (a) { return !isClosedAudit(a); });
  }
}

function auditRow(a) {
  var d = auditDueInfo(a);
  var dueText = isClosedAudit(a) ? a.status + ' · ' + fmtDate(a.date) : fmtDate(a.date) + ' · ' + d.label;
  var dueCls = d.overdue ? 'style="color:var(--danger);font-weight:600"' : (d.dueSoon ? 'style="color:var(--warn);font-weight:600"' : '');
  var pa = primaryActionForAudit(a);
  var actionView = pa.view ? ' data-view="' + esc(pa.view) + '"' : '';
  return '' +
    '<div class="list__row audit-row" data-act="nav" data-view="audit-detail" data-id="' + esc(a.id) + '">' +
      '<div class="list__main">' +
        '<div class="list__title">' +
          '<span class="tag-pill">' + esc(a.id) + '</span> ' + esc(orgName(a.orgId)) + ' · ' + esc(a.type) +
        '</div>' +
        '<div class="list__meta">' +
          '<span><b>Next action:</b> ' + esc(auditStatusMeta(a).next) + '</span>' +
          '<span><b>Owner:</b> ' + esc(auditOwnerLabel(a)) + '</span>' +
          '<span ' + dueCls + '><b>Due Date:</b> ' + esc(dueText) + '</span>' +
          '<span><b>Lead:</b> ' + esc(a.lead) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="list__side">' +
        auditStatusBadge(a) +
        '<button class="' + pa.cls + ' btn--sm" data-act="' + esc(pa.action) + '"' + actionView + ' data-id="' + esc(a.id) + '">' + esc(pa.label) + '</button>' +
      '</div>' +
    '</div>';
}

function auditNextActionBar(a) {
  var turn = auditTurnInfo(a);
  var pa = primaryActionForAudit(a);
  var actionView = pa.view ? ' data-view="' + esc(pa.view) + '"' : '';
  var toneStyle = turn.tone === 'danger'
    ? 'background:var(--danger-bg);border-color:#eccbc6'
    : (turn.tone === 'ok' ? 'background:var(--ok-bg);border-color:#bfe6d0' : '');
  return '<div class="nextbar" style="' + toneStyle + '">' +
    '<div class="nextbar__icon">-&gt;</div>' +
    '<div class="nextbar__txt"><b>Next action:</b> ' + esc(auditStatusMeta(a).next) +
    ' &nbsp;·&nbsp; <b>Current owner:</b> ' + esc(auditOwnerLabel(a)) + '</div>' +
    '<button class="' + pa.cls + '" data-act="' + esc(pa.action) + '"' + actionView + ' data-id="' + esc(a.id) + '">' + esc(pa.label) + '</button>' +
  '</div>';
}

function viewCalendar() {
  var requestedFilter = state.params.filter || selectedFilter('calendar', 'active');
  var filter = AUDIT_QUEUE_FILTERS.indexOf(requestedFilter) > -1 ? requestedFilter : 'active';
  state.params.filter = filter;
  if (state.selectedFilters) state.selectedFilters.calendar = filter;
  var scopedAudits = auditsForQueueScope();
  var list = sortedAuditsForQueue(filterAudits(filter));
  var counts = {
    active: scopedAudits.filter(function (a) { return !isClosedAudit(a); }).length,
    completed: scopedAudits.filter(isClosedAudit).length
  };
  var chips = AUDIT_QUEUE_FILTERS.map(function (key) {
    return '<button class="btn btn--sm' + (filter === key ? ' btn--primary' : '') + '" data-act="nav" data-view="calendar" data-filter="' + key + '">' +
      esc(AUDIT_FILTER_LABELS[key]) + ' (' + counts[key] + ')</button>';
  }).join(' ');
  var actions = chips;
  if (state.role === 'manager') {
    actions += ' <button class="btn btn--primary btn--sm" data-act="new-audit">+ New Audit</button>';
  }
  var items = list.map(workItemFromAudit);
  return pageHead('Audit Work Queue', 'Assigned audits in a simple queue, sorted by Due Date. Use Active for open work and Completed for finished audits.', actions) +
    renderOpsTable(items, { empty: 'No assigned audits match this filter.' });
}

/* =========================== Inspector audit execution =========================== */
var INSPECTOR_EXECUTION_SECTIONS = [
  { no: '1.', title: 'Safety Policy and Objectives', done: 5, total: 6, active: true },
  { no: '2.', title: 'Safety Risk Management', done: 4, total: 7 },
  { no: '3.', title: 'Safety Assurance', done: 6, total: 8 },
  { no: '4.', title: 'Safety Promotion', done: 3, total: 6 },
  { no: '5.', title: 'Safety Management Processes', done: 7, total: 9 },
  { no: '6.', title: 'Emergency Preparedness', done: 4, total: 6 },
  { no: '7.', title: 'Management of Change', done: 2, total: 4 },
  { no: '8.', title: 'Continuous Improvement', done: 2, total: 4 }
];

var INSPECTOR_EXECUTION_ITEMS = [
  {
    id: 'sms-1-1',
    no: '1.1',
    item: 'Is there an established safety policy?',
    status: 'compliant',
    comment: 'Safety policy is established and approved by the accountable manager.',
    file: 'safety_policy.pdf'
  },
  {
    id: 'sms-1-2',
    no: '1.2',
    item: 'Is the safety policy communicated?',
    status: 'compliant',
    comment: 'Communicated via email and intranet to all staff.',
    file: 'email_communication.pdf'
  },
  {
    id: 'sms-1-3',
    no: '1.3',
    item: 'Are safety objectives defined?',
    status: 'observed',
    comment: 'Objectives are defined, but KPIs are not clearly measurable.',
    file: 'objectives_snapshot.png'
  },
  {
    id: 'sms-1-4',
    no: '1.4',
    item: 'Are safety objectives reviewed?',
    status: 'noncompliant',
    comment: 'No evidence of regular review of safety objectives.',
    file: ''
  },
  {
    id: 'sms-1-5',
    no: '1.5',
    item: 'Is accountability for safety assigned?',
    status: 'compliant',
    comment: 'Accountabilities are clearly assigned in the organization.',
    file: 'org_structure.pdf'
  },
  {
    id: 'sms-1-6',
    no: '1.6',
    item: 'Is there management commitment to safety?',
    status: 'na',
    comment: '',
    file: ''
  }
];

var INSPECTOR_EXECUTION_STATUS_META = {
  compliant: { label: 'Compliant', cls: 'ok', icon: '&#10003;' },
  noncompliant: { label: 'Non-Compliant', cls: 'danger', icon: '&#10005;' },
  observed: { label: 'Observed', cls: 'warn', icon: '&#9678;' },
  na: { label: 'Not Applicable', cls: 'neutral', icon: '&#8722;' }
};
var INSPECTOR_EXECUTION_STATUS_FLOW = ['compliant', 'observed', 'noncompliant', 'na'];

var INSPECTOR_EXECUTION_SECTION_ITEMS = {
  '2.': [
    'Are operational hazards formally identified?',
    'Is the risk assessment method documented?',
    'Are risk controls assigned to accountable owners?',
    'Are cargo gate risks reviewed after incidents?',
    'Are mitigations tracked to completion?',
    'Is residual risk accepted by authorized staff?',
    'Are risk records available for CAA review?'
  ],
  '3.': [
    'Are internal audit results reviewed by management?',
    'Are SMS performance indicators monitored?',
    'Are corrective actions verified after closure?',
    'Are trend reviews performed for repeated findings?',
    'Are contracted activities included in assurance?',
    'Are audit records retained and traceable?',
    'Are safety meetings minuted with actions?',
    'Are assurance outcomes fed back into planning?'
  ],
  '4.': [
    'Is safety communication issued to operational staff?',
    'Are SMS training needs identified?',
    'Are safety lessons shared after events?',
    'Is reporting culture promoted by management?',
    'Are promotion materials current and controlled?',
    'Are staff briefings recorded?'
  ],
  '5.': [
    'Is the SMS manual controlled and current?',
    'Are SMS roles documented in job descriptions?',
    'Are safety accountabilities reviewed annually?',
    'Are interfaces with operations documented?',
    'Are management reviews scheduled?',
    'Are SMS records indexed and retrievable?',
    'Are changes to SMS procedures approved?',
    'Are outsourced process controls documented?',
    'Are internal CAA observations tracked?'
  ],
  '6.': [
    'Is the emergency response plan current?',
    'Are emergency contact lists verified?',
    'Are exercises scheduled and documented?',
    'Are exercise findings tracked to closure?',
    'Are emergency roles assigned to named staff?',
    'Are coordination records available for review?'
  ],
  '7.': [
    'Are operational changes risk assessed before release?',
    'Are change approvals documented?',
    'Are affected staff briefed before implementation?',
    'Are post-implementation reviews completed?'
  ],
  '8.': [
    'Are SMS improvement actions prioritized?',
    'Are lessons learned recorded after audits?',
    'Are improvement owners and target dates assigned?',
    'Are completed improvements verified?'
  ]
};

function inspectionExecutionSectionByNo(sectionNo) {
  return INSPECTOR_EXECUTION_SECTIONS.filter(function (section) { return section.no === sectionNo; })[0] || null;
}

function inspectionExecutionSectionIndex(sectionNo) {
  for (var i = 0; i < INSPECTOR_EXECUTION_SECTIONS.length; i++) {
    if (INSPECTOR_EXECUTION_SECTIONS[i].no === sectionNo) return i;
  }
  return 0;
}

function inspectionExecutionSelectedSection() {
  var sectionNo = state.inspectionWorkspaceSection || INSPECTOR_EXECUTION_SECTIONS[0].no;
  return inspectionExecutionSectionByNo(sectionNo) || INSPECTOR_EXECUTION_SECTIONS[0];
}

function inspectionExecutionResolveSection(sectionId) {
  var current = inspectionExecutionSelectedSection();
  var index = inspectionExecutionSectionIndex(current.no);
  if (sectionId === 'previous') return INSPECTOR_EXECUTION_SECTIONS[Math.max(index - 1, 0)];
  if (sectionId === 'next') return INSPECTOR_EXECUTION_SECTIONS[Math.min(index + 1, INSPECTOR_EXECUTION_SECTIONS.length - 1)];
  return inspectionExecutionSectionByNo(sectionId);
}

function inspectionExecutionGeneratedItems(section) {
  var titles = INSPECTOR_EXECUTION_SECTION_ITEMS[section.no] || [];
  var sectionNumber = section.no.replace('.', '');
  var statusCycle = ['compliant', 'observed', 'compliant', 'noncompliant', 'compliant', 'na', 'observed', 'compliant', 'compliant'];
  return titles.map(function (title, index) {
    var itemNo = sectionNumber + '.' + (index + 1);
    return {
      id: 'sms-' + sectionNumber + '-' + (index + 1),
      no: itemNo,
      item: title,
      status: statusCycle[index % statusCycle.length],
      comment: index < section.done ? 'Reviewed during this inspection section.' : '',
      file: index % 3 === 0 ? 'section_' + sectionNumber + '_evidence_' + (index + 1) + '.pdf' : ''
    };
  });
}

function inspectionExecutionItemsForSection(sectionNo) {
  if (sectionNo === '1.') return INSPECTOR_EXECUTION_ITEMS;
  var section = inspectionExecutionSectionByNo(sectionNo) || INSPECTOR_EXECUTION_SECTIONS[0];
  return inspectionExecutionGeneratedItems(section);
}

function inspectionExecutionAllItems() {
  var rows = INSPECTOR_EXECUTION_ITEMS.slice();
  INSPECTOR_EXECUTION_SECTIONS.forEach(function (section) {
    if (section.no !== '1.') rows = rows.concat(inspectionExecutionGeneratedItems(section));
  });
  return rows;
}

function inspectionExecutionAnswer(row) {
  var answers = state.inspectionWorkspaceAnswers || {};
  return answers[row.id] || {};
}

function inspectionExecutionStatus(row) {
  return inspectionExecutionAnswer(row).status || row.status;
}

function inspectionExecutionComment(row) {
  var answer = inspectionExecutionAnswer(row);
  return answer.comment !== undefined ? answer.comment : row.comment;
}

function inspectionExecutionStatusButton(row) {
  var status = inspectionExecutionStatus(row);
  var meta = INSPECTOR_EXECUTION_STATUS_META[status] || INSPECTOR_EXECUTION_STATUS_META.na;
  var options = INSPECTOR_EXECUTION_STATUS_FLOW.map(function (key) {
    var optionMeta = INSPECTOR_EXECUTION_STATUS_META[key];
    return '<option value="' + esc(key) + '"' + (key === status ? ' selected' : '') + '>' + esc(optionMeta.label) + '</option>';
  }).join('');
  return '<select class="inspection-status-select inspection-status-select--' + esc(meta.cls) +
    '" data-field="inspection-status" data-id="' + esc(row.id) + '" aria-label="Compliance for ' + esc(row.no) + '">' +
    options +
  '</select>';
}

function inspectionExecutionFile(row) {
  if (!row.file) {
    return '<span class="inspection-file inspection-file--empty"><span class="inspection-file__icon">&#128206;</span>No file attached</span>';
  }
  return '<span class="inspection-file"><span class="inspection-file__icon">&#128206;</span>' + esc(row.file) + '</span>';
}

function inspectionExecutionLegendItem(status) {
  var meta = INSPECTOR_EXECUTION_STATUS_META[status];
  return '<div class="inspection-legend__item">' +
    '<span class="inspection-legend__mark inspection-status--' + esc(meta.cls) + '">' + meta.icon + '</span>' +
    '<span>' + esc(meta.label) + '</span>' +
  '</div>';
}

function viewInspectorAuditExecution(audit) {
  var org = orgName(audit.orgId);
  var activeSection = inspectionExecutionSelectedSection();
  var activeIndex = inspectionExecutionSectionIndex(activeSection.no);
  var previousSection = activeIndex > 0 ? INSPECTOR_EXECUTION_SECTIONS[activeIndex - 1] : null;
  var nextSection = activeIndex < INSPECTOR_EXECUTION_SECTIONS.length - 1 ? INSPECTOR_EXECUTION_SECTIONS[activeIndex + 1] : null;
  var submitted = !!state.inspectionWorkspaceSubmittedAt;
  var downloadNote = state.inspectionWorkspaceDownloadedAt ? '<span class="inspection-save-state">Checklist downloaded</span>' : '';
  var draftNote = state.inspectionWorkspaceDraftSavedAt ? '<span class="inspection-save-state">Draft saved</span>' : '';
  var submitNote = submitted ? '<span class="inspection-save-state inspection-save-state--submitted">Submitted to Lead Inspector</span>' : '';
  var sectionRows = INSPECTOR_EXECUTION_SECTIONS.map(function (section) {
    return '<button class="inspection-section' + (section.no === activeSection.no ? ' is-active' : '') + '" data-act="inspection-section-preview" data-id="' + esc(section.no) + '">' +
      '<span>' + esc(section.no + ' ' + section.title) + '</span>' +
      '<b>' + esc(section.done + ' / ' + section.total) + '</b>' +
    '</button>';
  }).join('');

  var checklistRows = inspectionExecutionItemsForSection(activeSection.no).map(function (row) {
    return '<tr>' +
      '<td>' + esc(row.no) + '</td>' +
      '<td><div class="inspection-question">' + esc(row.item) + '</div></td>' +
      '<td>' + inspectionExecutionStatusButton(row) + '</td>' +
      '<td><textarea class="inspection-comment" data-field="inspection-comment" data-id="' + esc(row.id) +
        '" placeholder="Add comments (optional)...">' + esc(inspectionExecutionComment(row)) + '</textarea></td>' +
      '<td>' + inspectionExecutionFile(row) + '</td>' +
      '<td class="inspection-row-menu"><button class="iconbtn iconbtn--small" data-act="inspection-row-menu" data-id="' + esc(row.id) + '" aria-label="Row actions">&#8942;</button></td>' +
    '</tr>';
  }).join('');

  return '' +
    '<div class="inspection-exec">' +
      '<button class="inspection-back" data-act="nav" data-view="dashboard">&larr; Back to Inspections</button>' +
      '<div class="inspection-exec__head">' +
        '<div>' +
          '<h1>SMS Oversight Audit</h1>' +
          '<div class="inspection-title-meta"><span>' + esc(org) + '</span><span>Routine Inspection</span></div>' +
          '<div class="inspection-status-line">' + demoBadge(submitted ? 'Submitted' : 'In Progress', submitted ? 'ok' : 'info') + downloadNote + draftNote + submitNote + '</div>' +
        '</div>' +
        '<div class="inspection-exec__actions">' +
          '<button class="btn" data-act="inspection-download-checklist" data-id="' + esc(audit.id) + '"><span>&#8681;</span>Download Checklist</button>' +
          '<button class="btn" data-act="inspection-save-draft" data-id="' + esc(audit.id) + '"><span>&#128190;</span>Save Draft</button>' +
          '<button class="btn btn--primary" data-act="inspection-submit-lead" data-id="' + esc(audit.id) + '"' + (submitted ? ' disabled' : '') + '><span>&#10148;</span>' + (submitted ? 'Submitted' : 'Submit to Lead Inspector') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="inspection-summary-card">' +
        '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>Inspection ID</span><b>INS-2026-015</b></div></div>' +
        '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>Start Date</span><b>15 Jun 2026</b></div></div>' +
        '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>End Date</span><b>18 Jun 2026</b></div></div>' +
        '<div class="inspection-summary-item inspection-summary-item--wide"><div><span>Checklist Progress</span><b>45 / 60 (75%)</b></div><div class="inspection-progress"><span style="width:75%"></span></div></div>' +
      '</div>' +
      '<div class="inspection-workspace">' +
        '<aside class="inspection-side">' +
          '<div class="inspection-panel">' +
            '<h2>Checklist Sections</h2>' +
            '<div class="inspection-sections">' + sectionRows + '</div>' +
          '</div>' +
          '<div class="inspection-panel inspection-legend">' +
            '<h2>Legend</h2>' +
            inspectionExecutionLegendItem('compliant') +
            inspectionExecutionLegendItem('noncompliant') +
            inspectionExecutionLegendItem('observed') +
            inspectionExecutionLegendItem('na') +
          '</div>' +
        '</aside>' +
        '<section class="inspection-card">' +
          '<div class="inspection-card__head">' +
            '<h2>' + esc(activeSection.no + ' ' + activeSection.title) + '</h2>' +
            '<div class="inspection-card__meta">' + esc(activeSection.done + ' / ' + activeSection.total) + ' Completed <span>&#8963;</span></div>' +
          '</div>' +
          '<div class="inspection-table-wrap">' +
            '<table class="inspection-table"><thead><tr>' +
              '<th style="width:58px">No.</th><th>Checklist Item</th><th style="width:190px">Compliance</th><th>Comments</th><th style="width:180px">Attached File</th><th style="width:44px"></th>' +
            '</tr></thead><tbody>' + checklistRows + '</tbody></table>' +
          '</div>' +
          '<div class="inspection-bottom-nav">' +
            '<button class="btn" data-act="inspection-section-preview" data-id="previous"' + (previousSection ? '' : ' disabled') + '>&larr; ' + esc(previousSection ? previousSection.title : 'Previous Section') + '</button>' +
            '<span>' + esc(nextSection ? 'Next Section' : 'Final Section') + '</span>' +
            '<button class="btn btn--primary" data-act="inspection-section-preview" data-id="next"' + (nextSection ? '' : ' disabled') + '>' + esc(nextSection ? nextSection.no + ' ' + nextSection.title : 'All Sections Complete') + ' &rarr;</button>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</div>';
}

/* =========================== Audit Detail =========================== */
function viewAuditDetail() {
  var a = auditById(state.params.auditId);
  if (!a) return pageHead('Audit not found', '') + '<div class="empty">This audit could not be found.</div>';
  if (state.role === 'inspector') return viewInspectorAuditExecution(a);
  var auditFindings = state.findings.filter(function (f) { return f.auditId === a.id; });
  var canRun = (state.role === 'inspector') && (a.status === 'Scheduled' || a.status === 'In Progress' || a.status === 'Planned');
  var runLabel = a.checklistStarted ? 'Continue checklist' : 'Start checklist';

  var actions = '';
  if (canRun) {
    actions = '<button class="btn btn--primary" data-act="' + (a.checklistStarted ? 'nav' : 'start-checklist') + '"' +
      (a.checklistStarted ? ' data-view="checklist"' : '') + ' data-id="' + a.id + '">' + esc(runLabel) + '</button>';
  }

  var findingsHtml = renderOpsTable(auditFindings.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }), {
    includeChildren: true,
    empty: 'No findings raised from this audit yet.'
  });

  return '' +
    pageHead(a.ref + ' — ' + orgName(a.orgId), 'Operator Audit overview and checklist entry point.', actions) +
    auditNextActionBar(a) +
    '<div class="dossier-sections">' +
      '<div class="dossier-stack">' +
        dossierPanel('Audit Details',
          '<div class="metaline">' +
            metaItem('Next action', auditStatusMeta(a).next) +
            metaItem('Current owner', auditOwnerLabel(a)) +
            metaItem('Organization', orgName(a.orgId)) +
            metaItem('Application type', a.type) +
            metaItem('Domain', a.domain) +
            metaItem('Date', fmtDate(a.date)) +
            metaItem('Mode', a.mode) +
            metaItem('Location', a.location) +
            metaItem('Lead inspector', a.lead) +
            metaItem('Team', a.team.join(', ')) +
          '</div>', 'Selected row dossier') +
        dossierPanel('Findings from this audit', findingsHtml, 'Related Finding -> CAP -> Evidence rows') +
      '</div>' +
      '<div class="dossier-stack">' +
        dossierPanel('Checklist Entry',
          '<div class="metaline">' +
            metaItem('Checklist template', state.checklist.name) +
            metaItem('Template version', state.checklist.version) +
            metaItem('Audit status', a.status) +
          '</div>' +
          '<div class="divider"></div>' +
          (canRun ? '<button class="btn btn--primary btn--block" data-act="' + (a.checklistStarted ? 'nav' : 'start-checklist') + '"' +
            (a.checklistStarted ? ' data-view="checklist"' : '') + ' data-id="' + a.id + '">' + esc(runLabel) + '</button>' : '<div class="muted small">Checklist is not editable in this state.</div>')) +
        dossierPanel('Status', auditStatusBadge(a), 'Audit lifecycle') +
      '</div>' +
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

  var activeQuestionId = state.params.questionId;
  if (!activeQuestionId) {
    var flaggedItem = tpl.items.filter(function (item) {
      var ans = answers[item.id] || {};
      return ans.answer === 'noncompliant' || ans.answer === 'observation' || ans.potentialFindingId || ans.findingId;
    })[0];
    var unanswered = tpl.items.filter(function (item) { return !(answers[item.id] && answers[item.id].answer); })[0];
    activeQuestionId = (flaggedItem || unanswered || tpl.items[0]).id;
  }
  var activeItem = tpl.items.filter(function (item) { return item.id === activeQuestionId; })[0] || tpl.items[0];
  var activeAnswer = answers[activeItem.id] || {};
  var selected = activeAnswer.answer || '';
  var activeFlagged = selected === 'noncompliant' || selected === 'observation';

  function answerBadge(ans) {
    if (!ans || !ans.answer) return demoBadge('Not answered', 'neutral');
    var tone = ans.answer === 'compliant' ? 'ok' : (ans.answer === 'noncompliant' ? 'danger' : (ans.answer === 'observation' ? 'warn' : 'neutral'));
    return demoBadge(CHECKLIST_RESULTS[ans.answer] || ans.answer, tone);
  }

  var rows = tpl.items.map(function (it, idx) {
    var ans = answers[it.id] || {};
    var findingState = ans.findingId
      ? '<button class="btn btn--sm" data-act="nav" data-view="finding" data-id="' + esc(ans.findingId) + '">Open finding</button>'
      : (ans.potentialFindingId ? demoBadge('Potential Finding', 'warn') : '<span class="muted small">No finding</span>');
    return '<tr class="ops-row' + (it.id === activeItem.id ? ' is-selected' : '') + '" data-act="select-checklist-question" data-q="' + esc(it.id) + '">' +
      '<td data-col="priority"><span class="ops-priority is-' + (ans.answer === 'noncompliant' ? 'danger' : (ans.answer === 'observation' ? 'warn' : 'neutral')) + '">Q' + (idx + 1) + '</span></td>' +
      '<td data-col="item"><div class="ops-cell-title">' + esc(it.text) + '</div><div class="ops-cell-sub">' + esc(it.ref) + '</div></td>' +
      '<td data-col="status">' + answerBadge(ans) + '</td>' +
      '<td data-col="lifecycle">' + esc(it.evidence) + '</td>' +
      '<td data-col="next" data-label="Finding:">' + findingState + '</td>' +
      '<td data-col="actions"><button class="btn btn--sm" data-act="select-checklist-question" data-q="' + esc(it.id) + '">Open question</button></td>' +
    '</tr>';
  }).join('');

  function aBtn(val, label, selCls) {
    return '<button class="answer ' + (selected === val ? selCls : '') + '" data-act="answer" data-q="' + activeItem.id + '" data-val="' + val + '">' + esc(label) + '</button>';
  }
  var commentRequired = checklistResultRequiresComment(selected);
  var commentHtml = '<div class="form-row mt-12">' +
    '<label>Inspector comment' + (commentRequired ? ' <span class="req">*</span>' : '') + '</label>' +
    '<textarea data-field="checklist-comment" data-q="' + esc(activeItem.id) + '" placeholder="' +
      (commentRequired ? 'Required for Non-Compliant or Observation.' : 'Optional note for the audit report.') + '">' +
      esc(activeAnswer.comment || '') + '</textarea></div>';
  var noteHtml = '';
  if (activeFlagged) {
    if (activeAnswer.findingId) {
      noteHtml = '<div class="cl-finding-note"><span>Flag</span><div>Finding <b>' + esc(activeAnswer.findingId) + '</b> created from this item. ' +
        '<a data-act="nav" data-view="finding" data-id="' + activeAnswer.findingId + '" style="cursor:pointer">Open finding</a></div></div>';
    } else if (activeAnswer.potentialFindingId) {
      var pf = potentialFindingById(activeAnswer.potentialFindingId);
      noteHtml = '<div class="cl-finding-note"><span>Flag</span><div>Potential Finding <b>' + esc(activeAnswer.potentialFindingId) + '</b> ' +
        (pf ? esc(approvalMetaForStatus(pf.status).label || humanStatus(pf.status)) : 'created') +
        '. Lead Inspector review is required before a real Finding is issued.</div></div>';
    } else {
      var fileList = activeAnswer.evidenceFiles && activeAnswer.evidenceFiles.length
        ? '<div class="filechip"><div class="filechip__icon">PDF</div><div style="flex:1"><div class="filechip__name">' + esc(activeAnswer.evidenceFiles.join(', ')) + '</div><div class="filechip__meta">selected (mock filename only)</div></div></div>'
        : '<div class="small muted mt-12">No mock evidence filename selected.</div>';
      var evidenceFormatHelp = '<div class="small muted mt-12"><b>Accepted evidence examples:</b> report/document (PDF, DOCX), image/photo (JPG, PNG), audio recording (MP3, M4A), spreadsheet/data (XLSX, CSV). Demo only: select a filename; no real upload occurs.</div>';
      noteHtml = '<div class="cl-finding-note"><span>Flag</span><div style="flex:1">Marked <b>' + esc(CHECKLIST_RESULTS[selected]) + '</b>. Add the required comment above before creating a Potential Finding.' +
        evidenceFormatHelp + fileList + '<div class="row-actions mt-12">' +
        '<button class="btn btn--sm" data-act="mock-checklist-evidence" data-q="' + esc(activeItem.id) + '">Select mock evidence filename</button>' +
        '<button class="btn btn--danger btn--sm" data-act="create-potential" data-q="' + esc(activeItem.id) + '" data-id="' + a.id + '">Create Potential Finding</button></div>' +
        '</div></div>';
    }
  }
  var checklistTable = '<div class="ops-table-wrap ops-table-wrap--stack"><table class="ops-table"><thead><tr>' +
    '<th style="width:82px">Row</th><th>Checklist question</th><th>Answer</th><th>Expected evidence</th><th>Finding status</th><th style="width:110px"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  var activePanel = '<div class="active-row-panel">' +
    '<div class="active-row-panel__title">' + esc(activeItem.text) + '</div>' +
    '<div class="active-row-panel__meta">' + esc(activeItem.ref) + ' · Expected evidence: ' + esc(activeItem.evidence) + '</div>' +
    regulatoryTraceHtml(regulatoryTraceForQuestion(activeItem.id), true) +
    '<div class="answers">' +
      aBtn('compliant', 'Compliant', 'sel-compliant') +
      aBtn('noncompliant', 'Non-Compliant', 'sel-noncompliant') +
      aBtn('observation', 'Observation', 'sel-observation') +
      aBtn('na', 'Not Applicable', 'sel-na') +
    '</div>' + commentHtml + noteHtml +
  '</div>';

  return '' +
    pageHead('Checklist Runner — ' + tpl.name, orgName(a.orgId) + ' · ' + a.ref + ' · ' + tpl.version,
      '<button class="btn" data-act="nav" data-view="audit-detail" data-id="' + a.id + '">Back to audit</button>') +
    '<div class="progress-band">' +
      '<span class="progress-band__count">' + answered + ' of ' + tpl.items.length + ' answered</span>' +
      '<div class="progress"><div class="progress__bar" style="width:' + pct + '%"></div></div>' +
      '<div class="progress-band__hint">Demo scenario: mark <b>Are crew training records complete and up to date?</b> as <b>Non-Compliant</b> to raise a finding.</div>' +
    '</div>' +
    '<div class="active-row-layout">' +
      '<div>' + checklistTable + '</div>' +
      activePanel +
    '</div>';
}

function leadAuditReviewForAudit(auditId) {
  var reviews = state.leadAuditReviews || [];
  for (var i = 0; i < reviews.length; i++) {
    if (reviews[i].auditId === auditId) return reviews[i];
  }
  return null;
}

function leadChecklistStatusBadge(status) {
  var tone = 'neutral';
  if (status === 'Completed') tone = 'ok';
  else if (status === 'In Progress') tone = 'warn';
  else if (status === 'Waiting') tone = 'neutral';
  return demoBadge(status, tone);
}

function leadReportTrackingHtml(reviews, selectedAuditId) {
  if (!reviews.length) return '<div class="empty">No report packages are ready for Lead Inspector tracking.</div>';
  return '<table class="table table--report-tracking"><thead><tr>' +
    '<th>Audit / report</th><th>Checklist reports</th><th>Findings</th><th>Status</th><th>Owner</th><th>Next action</th><th>Approval outcome</th><th></th>' +
    '</tr></thead><tbody>' +
    reviews.map(function (item) {
      var audit = auditById(item.auditId);
      var report = auditReportById(item.reportId) || reportForAudit(item.auditId);
      var completed = item.assignments.filter(function (assignment) { return assignment.status === 'Completed'; }).length;
      var total = item.assignments.length;
      var findings = item.submittedFindings ? item.submittedFindings.length : 0;
      var rowClass = item.auditId === selectedAuditId ? ' class="is-selected"' : '';
      return '<tr' + rowClass + '>' +
        '<td><b>' + esc(item.title) + '</b><div class="small muted">' + esc(item.auditId + ' · ' + (audit ? orgName(audit.orgId) : '—')) + '</div>' +
          '<div class="small muted">' + esc(report ? report.id : 'No report record') + '</div></td>' +
        '<td><b>' + esc(String(completed) + '/' + String(total)) + '</b><div class="small muted">' + esc(item.stage) + '</div></td>' +
        '<td><b>' + esc(String(findings)) + '</b><div class="small muted">Inspector findings and comments</div></td>' +
        '<td>' + demoBadge(item.reportStatus, item.auditId === selectedAuditId ? 'info' : 'neutral') + '</td>' +
        '<td><b>Lead Inspector</b><div class="small muted">' + esc(audit ? audit.lead : '—') + '</div></td>' +
        '<td><b>Submit to Department Manager</b><div class="small muted">Prepare preliminary report package</div></td>' +
        '<td class="small muted">' + esc(item.serviceProviderStep) + '</td>' +
        '<td><div class="row-actions row-actions--nowrap">' +
          '<button class="btn btn--sm" data-act="nav" data-view="lead-review" data-id="' + esc(item.auditId) + '">Track</button>' +
          '<button class="btn btn--sm btn--primary" data-act="nav" data-view="audit-reports" data-id="' + esc(item.auditId) + '">Open report</button>' +
        '</div></td>' +
      '</tr>';
    }).join('') +
    '</tbody></table>';
}

function leadAssignmentsHtml(review) {
  if (!review || !review.assignments || !review.assignments.length) {
    return '<div class="empty">No checklist assignments are available for this audit.</div>';
  }
  return '<table class="table"><thead><tr>' +
    '<th>Inspector</th><th>Checklist assignments</th><th>Questions</th><th>Status</th><th>Inspector comment</th>' +
    '</tr></thead><tbody>' +
    review.assignments.map(function (row) {
      return '<tr>' +
        '<td><b>' + esc(row.inspector) + '</b><div class="small muted">' + esc(row.role) + '</div></td>' +
        '<td>' + esc(row.checklist) + '<div class="small muted">' + esc(row.resultSummary) + '</div></td>' +
        '<td>' + esc(row.questions) + '</td>' +
        '<td>' + leadChecklistStatusBadge(row.status) + '</td>' +
        '<td class="small muted">' + esc(row.comment) + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table>';
}

function leadSubmittedFindingsHtml(review) {
  var submitted = review && review.submittedFindings ? review.submittedFindings : [];
  if (!submitted.length) return '<div class="empty">No submitted findings or inspector comments are recorded for this audit yet.</div>';
  return submitted.map(function (item) {
    return '<div class="package-question">' +
      '<div class="package-question__head"><div><b>' + esc(item.title) + '</b>' +
        '<p>' + esc(item.question) + ' · ' + esc(item.inspector) + '</p></div>' +
        demoBadge(item.severity, item.severity.indexOf('Critical') > -1 ? 'danger' : 'warn') +
      '</div>' +
      '<div class="metaline mt-12">' +
        metaItem('Finding', item.findingId) +
        metaItem('Inspector comment', item.comment) +
        metaItem('Lead assessment', item.leadAssessment) +
      '</div>' +
    '</div>';
  }).join('');
}

function leadPotentialDecisionRowsHtml(potentials) {
  if (!potentials.length) return '';
  return '<div class="card mt-16"><div class="card__head"><h3>Pending Inspector Finding Decisions</h3><span class="sub">Lead only</span></div><div class="card__body">' +
    potentials.map(function (pf) {
      var audit = auditById(pf.auditId);
      var status = approvalMetaForStatus(pf.status);
      var canDecide = state.role === 'leadInspector' && pf.status === 'pending_lead_review';
      var decision = canDecide
        ? '<div class="divider"></div><div class="form-row"><label>Finding title</label><input id="pf-title-' + esc(pf.id) + '" type="text" value="Crew training records incomplete"></div>' +
          '<div class="form-row"><label>Lead severity <span class="req">*</span></label><select id="pf-severity-' + esc(pf.id) + '">' +
            '<option value="">Select severity</option><option value="3">Level 3 Minor</option><option value="2">Level 2 Major</option><option value="1">Level 1 Critical</option><option value="0">Observation</option>' +
          '</select></div>' +
          '<div class="form-row"><label>Reason for return/dismissal</label><textarea id="pf-reason-' + esc(pf.id) + '" placeholder="Required only for Return or Dismiss."></textarea></div>' +
          '<div class="row-actions">' +
            '<button class="btn btn--primary" data-act="convert-potential" data-id="' + esc(pf.id) + '">Convert to Finding</button>' +
            '<button class="btn" data-act="return-potential" data-id="' + esc(pf.id) + '">Return to Inspector</button>' +
            '<button class="btn btn--danger" data-act="dismiss-potential" data-id="' + esc(pf.id) + '">Dismiss</button>' +
          '</div>'
        : (pf.findingId ? '<div class="mt-12"><button class="btn btn--sm" data-act="nav" data-view="finding" data-id="' + esc(pf.findingId) + '">Open Finding</button></div>' : '');
      return '<div class="package-question"><div class="package-question__head"><div><b>' + esc(pf.id) + ' · ' + esc(CHECKLIST_RESULTS[pf.result] || humanStatus(pf.result)) + '</b>' +
        '<p>' + esc((audit ? audit.ref : pf.auditId) + ' · ' + pf.checklistText) + '</p></div>' +
        demoBadge(status.label || humanStatus(pf.status), status.tone || statusTone(pf.status)) + '</div>' +
        '<div class="small muted mt-12">' + esc(pf.comment) + '</div>' + decision + '</div>';
    }).join('') +
  '</div></div>';
}

var LEAD_REVIEW_TABS = [
  { id: 'report', label: 'Report Details' },
  { id: 'findings', label: 'Findings', count: 8 },
  { id: 'cap', label: 'CAP Summary', count: 8 },
  { id: 'conclusion', label: 'Conclusion' },
  { id: 'appendices', label: 'Appendices' }
];

var LEAD_REPORT_SECTIONS = [
  { id: 'executive', label: 'Executive Summary', state: 'active' },
  { id: 'scope', label: 'Audit Scope', state: 'done' },
  { id: 'team', label: 'Inspection Team', state: 'done' },
  { id: 'methodology', label: 'Audit Methodology', state: 'done' },
  { id: 'findings-summary', label: 'Findings Summary', state: 'done' },
  { id: 'detailed-findings', label: 'Detailed Findings', state: 'done' },
  { id: 'enforcement-cap', label: 'Enforcement & CAP', state: 'warn' },
  { id: 'conclusion', label: 'Conclusion', state: 'done' },
  { id: 'approval', label: 'Approval Workflow', state: 'done' }
];

var LEAD_REPORT_SECTION_COPY = {
  executive: {
    title: '1. Executive Summary',
    body: [
      'The inspection was conducted between 15 - 18 June 2026 at SkyCargo Air facilities as part of the scheduled routine inspection.',
      'Overall, the organization demonstrates a satisfactory level of compliance with applicable regulations and internal procedures. However, several areas were identified that require corrective actions.',
      'A total of 8 findings were raised during the inspection, consisting of 2 Level 1, 3 Level 2 and 3 Observations.',
      'The organization is expected to address all findings within the defined corrective action timelines.'
    ]
  },
  scope: {
    title: '2. Audit Scope',
    body: [
      'The audit covered SMS policy, operational controls, evidence records, access control arrangements, and CAP readiness for SkyCargo Air.',
      'The final report package will be issued to the service provider after Unit Manager, General Manager, and ED approval.'
    ]
  },
  team: {
    title: '3. Inspection Team',
    body: [
      'Lead Inspector: John Lead Inspector.',
      'Inspector: John Inspector.',
      'Inspection team evidence and checklist inputs were consolidated into this final report draft.'
    ]
  },
  methodology: {
    title: '4. Audit Methodology',
    body: [
      'The inspection used checklist review, document sampling, evidence examination, interviews, and CAP readiness assessment.',
      'Findings were classified by criticality and mapped to corrective action deadlines.'
    ]
  },
  'findings-summary': {
    title: '5. Findings Summary',
    body: [
      'The final report includes 8 findings: 2 Level 1 findings requiring closure within 14 days, 3 Level 2 findings requiring closure within 90 days, and 3 observations with no CAP requirement.',
      'CAP deadlines are included in the service provider report package.'
    ]
  },
  'detailed-findings': {
    title: '6. Detailed Findings',
    body: [
      'Detailed finding records include the finding basis, affected area, CAP requirement, expected evidence, and closure deadline.',
      'Level 1 and Level 2 items require CAP follow-up before closure.'
    ]
  },
  'enforcement-cap': {
    title: '7. Enforcement & CAP',
    body: [
      'Level 1 findings require corrective action closure within 14 days.',
      'Level 2 findings require corrective action closure within 90 days.',
      'Observation items are recorded for monitoring and do not require CAP submission in this demo scenario.'
    ]
  },
  conclusion: {
    title: '8. Conclusion',
    body: [
      'The inspection may proceed to final approval subject to CAP timelines and service provider notification after ED approval.',
      'Final release to the service provider starts the applicable CAP closure clocks.'
    ]
  },
  approval: {
    title: '9. Approval Workflow',
    body: [
      'The Lead Inspector submits the final report draft to the Unit Manager.',
      'The approval chain continues to General Manager and Executive Director. After ED approval, the report is released to the service provider.'
    ]
  }
};

var LEAD_REVIEW_REQUIREMENTS = {
  'sms-1-1': 'The organization shall establish, document and communicate a safety policy.',
  'sms-1-2': 'The safety policy shall be communicated to all personnel.',
  'sms-1-3': 'The organization shall establish measurable safety objectives.',
  'sms-1-4': 'Safety objectives shall be reviewed at planned intervals.',
  'sms-1-5': 'Accountability and responsibilities for safety shall be defined.',
  'sms-1-6': 'Management shall demonstrate commitment to safety.'
};

var LEAD_REVIEW_RESPONSES = {
  'sms-1-1': 'Safety policy is established and communicated across the organization.',
  'sms-1-2': 'Communicated via email and notice boards.',
  'sms-1-3': 'Objectives are defined but not yet measurable.',
  'sms-1-4': 'No documented review found in the last 12 months.',
  'sms-1-5': 'Accountabilities are clearly defined.',
  'sms-1-6': 'Commitment demonstrated in meetings and communications.'
};

var LEAD_REVIEW_FILES = {
  'sms-1-1': ['policy.pdf', 'comms.jpg'],
  'sms-1-2': ['email_2026-06-10.pdf'],
  'sms-1-3': [],
  'sms-1-4': ['objectives_review.xlsx'],
  'sms-1-5': ['org_chart.pdf'],
  'sms-1-6': ['meeting_minutes.pdf', 'announcement.jpg']
};

var LEAD_REVIEW_STATUS_OVERRIDES = {
  'sms-1-6': 'observed'
};

var LEAD_REVIEW_INSPECTOR_COMMENT_COUNTS = {
  'sms-1-1': 74,
  'sms-1-2': 45,
  'sms-1-3': 56,
  'sms-1-4': 61,
  'sms-1-5': 34,
  'sms-1-6': 63
};

function leadReviewUiState() {
  if (!state.leadReviewUi) {
    state.leadReviewUi = {
      tab: 'report',
      section: '1.',
      downloadedAt: '',
      finalizedAt: '',
      reportGeneratedAt: '',
      reportDraftSavedAt: '',
      reportSection: 'executive',
      reportRating: 'Acceptable with CAP',
      reportRisk: 'Medium',
      sentToUnitManagerAt: '',
      workflowComment: '',
      actionsOpen: false,
      workflowVersion: 7,
      overallComment: '',
      rowReviews: {}
    };
  }
  if (!state.leadReviewUi.workflowVersion || state.leadReviewUi.workflowVersion < 7) {
    state.leadReviewUi.tab = 'report';
    state.leadReviewUi.reportSection = 'executive';
    state.leadReviewUi.downloadedAt = '';
    state.leadReviewUi.finalizedAt = '';
    state.leadReviewUi.reportGeneratedAt = '';
    state.leadReviewUi.reportDraftSavedAt = '';
    state.leadReviewUi.sentToUnitManagerAt = '';
  }
  state.leadReviewUi.workflowVersion = 7;
  if (!state.leadReviewUi.tab || state.leadReviewUi.tab === 'workflow') state.leadReviewUi.tab = 'report';
  if (!state.leadReviewUi.section) state.leadReviewUi.section = '1.';
  if (!state.leadReviewUi.rowReviews || typeof state.leadReviewUi.rowReviews !== 'object') state.leadReviewUi.rowReviews = {};
  if (state.leadReviewUi.overallComment === undefined || state.leadReviewUi.overallComment === null) state.leadReviewUi.overallComment = '';
  if (state.leadReviewUi.workflowComment === undefined || state.leadReviewUi.workflowComment === null) state.leadReviewUi.workflowComment = '';
  if (!state.leadReviewUi.reportDraftSavedAt) state.leadReviewUi.reportDraftSavedAt = '';
  if (!state.leadReviewUi.reportSection) state.leadReviewUi.reportSection = 'executive';
  if (!state.leadReviewUi.reportRating) state.leadReviewUi.reportRating = 'Acceptable with CAP';
  if (!state.leadReviewUi.reportRisk) state.leadReviewUi.reportRisk = 'Medium';
  if (state.leadReviewUi.actionsOpen === undefined || state.leadReviewUi.actionsOpen === null) state.leadReviewUi.actionsOpen = false;
  return state.leadReviewUi;
}

function leadReviewNormalizeRow(row) {
  var files = LEAD_REVIEW_FILES[row.id];
  if (files === undefined) files = row.file ? [row.file] : [];
  return Object.assign({}, row, {
    status: LEAD_REVIEW_STATUS_OVERRIDES[row.id] || row.status,
    requirement: LEAD_REVIEW_REQUIREMENTS[row.id] || 'Configured checklist requirement for this SMS section.',
    inspectorResponse: LEAD_REVIEW_RESPONSES[row.id] || (row.comment || 'Reviewed during the inspection.'),
    files: files.slice(),
    inspectorCommentCount: LEAD_REVIEW_INSPECTOR_COMMENT_COUNTS[row.id] || (row.comment ? row.comment.length : 0)
  });
}

function leadReviewRowsForSection(sectionNo) {
  var rows = typeof inspectionExecutionItemsForSection === 'function' ? inspectionExecutionItemsForSection(sectionNo) : [];
  return rows.map(leadReviewNormalizeRow);
}

function leadReviewAllRows() {
  var rows = [];
  INSPECTOR_EXECUTION_SECTIONS.forEach(function (section) {
    rows = rows.concat(leadReviewRowsForSection(section.no));
  });
  return rows;
}

function leadReviewRowById(rowId) {
  var rows = leadReviewAllRows();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === rowId) return rows[i];
  }
  return null;
}

function leadReviewDefaultDecisionForRow(row) {
  return row.id === 'sms-1-4' ? 'return' : 'accept';
}

function leadReviewDefaultCommentForRow(row) {
  return row.id === 'sms-1-4' ? 'Please provide evidence of periodic review of safety objectives.' : '';
}

function leadReviewDisplayDecision(row) {
  var ui = leadReviewUiState();
  var saved = ui.rowReviews[row.id] || {};
  return saved.decision || leadReviewDefaultDecisionForRow(row);
}

function leadReviewDisplayComment(row) {
  var ui = leadReviewUiState();
  var saved = ui.rowReviews[row.id] || {};
  if (saved.comment !== undefined) return saved.comment;
  return leadReviewDefaultCommentForRow(row);
}

function leadReviewStatusBadge(status) {
  var meta = INSPECTOR_EXECUTION_STATUS_META[status] || INSPECTOR_EXECUTION_STATUS_META.na;
  return '<span class="lead-status lead-status--' + esc(meta.cls) + '">' +
    '<span class="lead-status__icon">' + meta.icon + '</span>' + esc(meta.label) +
  '</span>';
}

function leadReviewTabsHtml(activeTab) {
  return '<div class="lead-review-tabs">' + LEAD_REVIEW_TABS.map(function (tab) {
    var count = tab.count ? '<span class="lead-tab-count">' + esc(String(tab.count)) + '</span>' : '';
    return '<button class="lead-review-tab' + (tab.id === activeTab ? ' is-active' : '') +
      '" data-act="lead-review-tab" data-tab="' + esc(tab.id) + '">' + esc(tab.label) + count + '</button>';
  }).join('') + '</div>';
}

function leadReviewAttachmentHtml(row) {
  if (!row.files.length) return '<span class="lead-attachment-empty">0 files</span>';
  return '<div class="lead-attachments">' +
    '<div class="lead-attachments__count">&#128206; ' + esc(row.files.length + (row.files.length === 1 ? ' file' : ' files')) + '</div>' +
    row.files.map(function (file) {
      return '<button class="lead-attachment" data-act="lead-review-file" data-id="' + esc(row.id) + '" data-file="' + esc(file) + '">' + esc(file) + '</button>';
    }).join('') +
  '</div>';
}

function leadReviewDecisionControls(row) {
  var decision = leadReviewDisplayDecision(row);
  var comment = leadReviewDisplayComment(row);
  var name = 'lead-review-' + row.id;
  function radio(value, label) {
    return '<label class="lead-review-radio' + (decision === value ? ' is-selected' : '') + ' is-' + esc(value) + '">' +
      '<input type="radio" name="' + esc(name) + '" value="' + esc(value) + '" data-field="lead-review-decision" data-id="' + esc(row.id) + '"' +
        (decision === value ? ' checked' : '') + '> <span>' + esc(label) + '</span></label>';
  }
  return '<div class="lead-review-decision">' +
    radio('accept', 'Accept') +
    radio('return', 'Return for Revision') +
    radio('na', 'Not Applicable') +
    '<textarea class="lead-review-note" data-field="lead-review-comment" data-id="' + esc(row.id) + '" placeholder="Add comments (optional)...">' +
      esc(comment) + '</textarea>' +
    '<div class="lead-review-count">' + esc(String(comment.length)) + ' / 1000</div>' +
  '</div>';
}

function leadReviewChecklistPanelHtml() {
  var ui = leadReviewUiState();
  var activeSection = inspectionExecutionSectionByNo(ui.section) || INSPECTOR_EXECUTION_SECTIONS[0];
  var activeIndex = inspectionExecutionSectionIndex(activeSection.no);
  var previousSection = activeIndex > 0 ? INSPECTOR_EXECUTION_SECTIONS[activeIndex - 1] : null;
  var nextSection = activeIndex < INSPECTOR_EXECUTION_SECTIONS.length - 1 ? INSPECTOR_EXECUTION_SECTIONS[activeIndex + 1] : null;
  var rows = leadReviewRowsForSection(activeSection.no).map(function (row) {
    return '<tr>' +
      '<td>' + esc(row.no) + '</td>' +
      '<td><div class="lead-review-question">' + esc(row.item) + '</div></td>' +
      '<td>' + esc(row.requirement) + '</td>' +
      '<td>' + esc(row.inspectorResponse) + '</td>' +
      '<td>' + leadReviewStatusBadge(row.status) + '</td>' +
      '<td><span class="lead-review-comment-count">' + esc(String(row.inspectorCommentCount)) + ' / 1000</span></td>' +
      '<td>' + leadReviewAttachmentHtml(row) + '</td>' +
      '<td>' + leadReviewDecisionControls(row) + '</td>' +
    '</tr>';
  }).join('');

  return '<section class="lead-review-panel">' +
    '<div class="lead-review-panel__head">' +
      '<h2>' + esc(activeSection.no + ' ' + activeSection.title) + '</h2>' +
      '<div>' + esc(activeSection.done + ' / ' + activeSection.total) + ' Completed <span>&#8964;</span></div>' +
    '</div>' +
    '<div class="lead-review-table-wrap">' +
      '<table class="lead-review-table"><thead><tr>' +
        '<th style="width:58px">No.</th>' +
        '<th style="width:170px">Checklist Item</th>' +
        '<th style="width:220px">Requirement</th>' +
        '<th style="width:200px">Inspector Response</th>' +
        '<th style="width:150px">Compliance</th>' +
        '<th style="width:110px">Comments</th>' +
        '<th style="width:150px">Attached Files</th>' +
        '<th style="width:280px">Lead Inspector Review</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
    '</div>' +
    '<div class="lead-review-bottom-nav">' +
      '<button class="btn" data-act="lead-review-section" data-id="previous"' + (previousSection ? '' : ' disabled') + '>&larr; Previous Section</button>' +
      '<button class="btn" data-act="lead-review-section" data-id="next"' + (nextSection ? '' : ' disabled') + '>Next Section &rarr;</button>' +
      '<button class="btn btn--primary" data-act="lead-review-finalize" data-id="INS-2026-015">&#10148; Finalize Review &amp; Send Back</button>' +
    '</div>' +
  '</section>';
}

function leadReviewFindingsPanelHtml(review) {
  return '<section class="lead-review-panel lead-review-panel--padded">' +
    '<h2>Findings</h2>' +
    '<p class="lead-review-muted">Final report findings are grouped by criticality before the service provider receives the approved report.</p>' +
    '<div class="mt-16">' + leadSubmittedFindingsHtml(review) + '</div>' +
  '</section>';
}

function leadReviewCapPanelHtml() {
  var items = typeof capReviewSourceFindings === 'function' ? capReviewSourceFindings().slice(0, 5) : [];
  var rows = items.map(function (finding) {
    var audit = auditById(finding.auditId);
    var status = typeof capReviewStatusMeta === 'function' ? capReviewStatusMeta(finding) : { label: finding.status, tone: statusTone(finding.status) };
    return '<tr>' +
      '<td>' + esc(typeof inspectorCapId === 'function' ? inspectorCapId(finding) : finding.id) + '</td>' +
      '<td>' + esc(typeof inspectorInspectionId === 'function' ? inspectorInspectionId(audit) : finding.auditId) + '</td>' +
      '<td>' + esc(orgName(finding.orgId)) + '</td>' +
      '<td>' + esc(finding.title) + '</td>' +
      '<td>' + demoBadge(status.label, status.tone) + '</td>' +
    '</tr>';
  }).join('');
  if (!rows) rows = '<tr><td colspan="5" class="muted">No CAP review rows are available for this report.</td></tr>';
  return '<section class="lead-review-panel lead-review-panel--padded">' +
    '<h2>CAP Summary</h2>' +
    '<p class="lead-review-muted">CAP requirements are summarized for final report approval. Level 1 findings close in 14 days; Level 2 findings close in 90 days.</p>' +
    '<div class="lead-simple-table mt-16"><table><thead><tr><th>CAP ID</th><th>Inspection ID</th><th>Organization</th><th>Finding</th><th>Status</th></tr></thead><tbody>' +
      rows +
    '</tbody></table></div>' +
  '</section>';
}

function leadConclusionPanelHtml() {
  var ui = leadReviewUiState();
  var text = 'The Lead Inspector recommends submission of the final report to Unit Manager review. After General Manager and ED approval, the final report will be released to the service provider with CAP deadlines based on finding criticality.';
  return '<section class="lead-review-panel lead-review-panel--padded">' +
    '<h2>Conclusion</h2>' +
    '<p class="lead-review-muted">The conclusion confirms the approval path and the service provider release condition.</p>' +
    '<div class="lead-overall-comment">' +
      '<textarea data-field="lead-workflow-comment" placeholder="Add final approval comments...">' + esc(ui.workflowComment || text) + '</textarea>' +
      '<div class="lead-review-count">' + esc(String(text.length)) + ' / 1000</div>' +
    '</div>' +
  '</section>';
}

function leadAppendicesPanelHtml() {
  return '<section class="lead-review-panel lead-review-panel--padded">' +
    '<h2>Appendices</h2>' +
    '<p class="lead-review-muted">Checklist summary, findings summary, CAP summary, evidence index, and final report draft are attached to the approval package.</p>' +
    '<div class="mt-16">' + leadReportDocumentsHtml() + '</div>' +
  '</section>';
}

function leadReportSubmitted(report, ui) {
  if (ui && ui.sentToUnitManagerAt) return true;
  var summary = report ? approvalSummary(report) : null;
  return !!(summary && summary.currentIndex > 0);
}

function leadWorkflowStep(label, sub, tone, icon, active) {
  return '<div class="lead-workflow-step is-' + esc(tone || 'neutral') + (active ? ' is-active' : '') + '">' +
    '<div class="lead-workflow-step__icon">' + icon + '</div>' +
    '<div><b>' + esc(label) + '</b><span>' + esc(sub) + '</span></div>' +
  '</div>';
}

function leadReportWorkflowStepsHtml(report, ui) {
  var sent = leadReportSubmitted(report, ui);
  return '<div class="lead-workflow-steps">' +
    leadWorkflowStep('Report Finalized', '15 Jun 2026', 'ok', '&#10003;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Unit Manager Review', sent ? 'In Review' : 'Pending', sent ? 'warn' : 'neutral', '&#9711;', sent) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('General Manager Review', 'Pending', 'neutral', '&#9711;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Executive Director Review', 'Pending', 'neutral', '&#9711;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('ED Signature (Final)', 'Pending', 'neutral', '&#9998;', false) +
  '</div>';
}

function leadReportCurrentReviewHtml(report, ui) {
  var sent = leadReportSubmitted(report, ui);
  var comment = ui.workflowComment || '-';
  var rows = [
    { level: '1', reviewer: 'Unit Manager', role: 'Unit Manager', status: sent ? 'In Review' : 'Pending Review', tone: sent ? 'info' : 'warn', date: sent ? fmtDate(DEMO_TODAY) : '-', comment: sent ? comment : '-' },
    { level: '2', reviewer: 'General Manager', role: 'General Manager', status: 'Pending Review', tone: 'info', date: '-', comment: '-' },
    { level: '3', reviewer: 'Executive Director', role: 'Executive Director', status: 'Pending Review', tone: 'neutral', date: '-', comment: '-' },
    { level: '4', reviewer: 'ED Signature', role: 'Executive Director', status: 'Pending Signature', tone: 'neutral', date: '-', comment: '-' }
  ];
  return '<div class="lead-simple-table"><table><thead><tr><th>Level</th><th>Reviewer</th><th>Role</th><th>Status</th><th>Action Date</th><th>Comments</th></tr></thead><tbody>' +
    rows.map(function (row) {
      return '<tr><td>' + esc(row.level) + '</td><td>' + esc(row.reviewer) + '</td><td>' + esc(row.role) + '</td><td>' +
        demoBadge(row.status, row.tone) + '</td><td>' + esc(row.date) + '</td><td>' + esc(row.comment) + '</td></tr>';
    }).join('') +
  '</tbody></table></div>';
}

function leadReportSectionNavHtml(ui) {
  var current = ui.reportSection || 'executive';
  return '<aside class="lead-report-sections">' +
    '<h2>Report Sections</h2>' +
    '<div class="lead-report-section-list">' + LEAD_REPORT_SECTIONS.map(function (section, index) {
      var icon = section.state === 'warn' ? '!' : (section.id === current ? '›' : '✓');
      var stateClass = section.state === 'active' ? 'current' : section.state;
      return '<button class="lead-report-section' + (section.id === current ? ' is-active' : '') + ' is-' + esc(stateClass) + '" data-act="lead-report-section" data-id="' + esc(section.id) + '">' +
        '<span>' + esc(icon) + '</span><b>' + esc((index + 1) + '. ' + section.label) + '</b>' +
      '</button>';
    }).join('') + '</div>' +
  '</aside>';
}

function leadReportEditorHtml(ui) {
  var sectionId = ui.reportSection || 'executive';
  var copy = LEAD_REPORT_SECTION_COPY[sectionId] || LEAD_REPORT_SECTION_COPY.executive;
  var body = sectionId === 'executive' && ui.overallComment ? ui.overallComment : copy.body.join('\n\n');
  return '<section class="lead-review-panel lead-final-editor">' +
    '<div class="lead-final-editor__head"><h2>' + esc(copy.title) + '</h2><span>Final report draft</span></div>' +
    '<div class="lead-editor-toolbar" aria-label="Report editor toolbar">' +
      '<select aria-label="Paragraph style"><option>Paragraph</option><option>Heading</option></select>' +
      '<button type="button" title="Bold">B</button><button type="button" title="Italic">I</button><button type="button" title="Underline">U</button>' +
      '<button type="button" title="Align left">≡</button><button type="button" title="Bullet list">•</button><button type="button" title="Link">↗</button>' +
    '</div>' +
    '<textarea class="lead-report-textarea" data-field="lead-review-overall-comment" placeholder="Write the final report section...">' + esc(body) + '</textarea>' +
    '<div class="lead-review-count">' + esc(String(body.length)) + ' / 2000</div>' +
  '</section>';
}

function leadReportDecisionCardsHtml(ui) {
  return '<div class="lead-report-decision-grid">' +
    '<label class="lead-report-decision-card"><span>Overall Compliance Rating</span>' +
      '<select data-field="lead-report-rating">' +
        '<option' + (ui.reportRating === 'Acceptable with CAP' ? ' selected' : '') + '>Acceptable with CAP</option>' +
        '<option' + (ui.reportRating === 'Acceptable' ? ' selected' : '') + '>Acceptable</option>' +
        '<option' + (ui.reportRating === 'Requires Management Review' ? ' selected' : '') + '>Requires Management Review</option>' +
      '</select></label>' +
    '<label class="lead-report-decision-card"><span>Overall Risk Level</span>' +
      '<select data-field="lead-report-risk">' +
        '<option' + (ui.reportRisk === 'Medium' ? ' selected' : '') + '>Medium</option>' +
        '<option' + (ui.reportRisk === 'High' ? ' selected' : '') + '>High</option>' +
        '<option' + (ui.reportRisk === 'Low' ? ' selected' : '') + '>Low</option>' +
      '</select></label>' +
    '<button class="lead-report-link-card" data-act="lead-review-tab" data-tab="findings"><span>Positive Practices</span><b>4</b><em>View / Edit →</em></button>' +
    '<button class="lead-report-link-card" data-act="lead-review-tab" data-tab="findings"><span>Major Risks / Concerns</span><b>2</b><em>View / Edit →</em></button>' +
  '</div>';
}

function leadFinalReportFindingsOverviewHtml() {
  var rows = [
    ['Level 1', '2', 'Major non-compliance with high safety impact.', 'Yes', '14 days', 'danger'],
    ['Level 2', '3', 'Significant non-compliance.', 'Yes', '90 days', 'warn'],
    ['Observation', '3', 'Opportunities for improvement.', 'No', '-', 'info']
  ];
  return '<section class="lead-review-panel lead-final-findings">' +
    '<h2>Findings Overview (8)</h2>' +
    '<div class="lead-simple-table"><table><thead><tr><th>Level</th><th>No. of Findings</th><th>Description</th><th>CAP Required</th><th>Due Date</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return '<tr><td>' + demoBadge(row[0], row[5]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td><b>' + esc(row[4]) + '</b></td></tr>';
      }).join('') +
    '</tbody></table></div>' +
    '<button class="lead-download-link lead-final-view-all" data-act="lead-review-tab" data-tab="findings">View All Findings →</button>' +
  '</section>';
}

function leadApprovalWorkflowSideHtml(report, ui) {
  var sent = leadReportSubmitted(report, ui);
  var steps = [
    ['Lead Inspector', 'John Lead Inspector', sent ? 'Completed' : 'In Progress', sent ? 'done' : 'active'],
    ['Unit Manager', '', sent ? 'In Review' : 'Pending', sent ? 'active' : 'pending'],
    ['General Manager', '', 'Pending', 'pending'],
    ['Executive Director (ED)', '', 'Pending', 'pending']
  ];
  return '<div class="lead-side-card lead-approval-side"><h2>Approval Workflow</h2>' +
    '<div class="lead-approval-steps">' + steps.map(function (step) {
      return '<div class="lead-approval-step is-' + esc(step[3]) + '">' +
        '<span class="lead-approval-step__dot"></span><div><b>' + esc(step[0]) + '</b>' +
        (step[1] ? '<small>' + esc(step[1]) + '</small>' : '') +
        '<em>' + esc(step[2]) + '</em></div></div>';
    }).join('') + '</div>' +
    '<p class="lead-review-muted mt-12">After ED approval, the final report is released to the service provider with CAP closure deadlines.</p>' +
  '</div>';
}

function leadCapDeadlinesCardHtml() {
  var rows = [
    ['Level 1', '14 days', 'danger'],
    ['Level 2', '90 days', 'warn'],
    ['Observation', 'No CAP', 'info']
  ];
  return '<div class="lead-side-card"><h2>CAP Deadlines by Level</h2><div class="lead-deadline-list">' +
    rows.map(function (row) {
      return '<div><span class="lead-risk-dot is-' + esc(row[2]) + '"></span><b>' + esc(row[0]) + '</b><strong>' + esc(row[1]) + '</strong></div>';
    }).join('') +
  '</div></div>';
}

function leadReferencesCardHtml() {
  return '<div class="lead-side-card"><h2>References & Attachments</h2>' +
    '<button class="lead-reference-link" data-act="lead-review-download" data-id="INS-2026-015">3 files attached <span>›</span></button>' +
  '</div>';
}

function leadFinalReportPanelHtml(report) {
  var ui = leadReviewUiState();
  var sent = leadReportSubmitted(report, ui);
  return '<div class="lead-final-layout">' +
    leadReportSectionNavHtml(ui) +
    '<main class="lead-final-main">' +
      leadReportEditorHtml(ui) +
      leadReportDecisionCardsHtml(ui) +
      leadFinalReportFindingsOverviewHtml() +
    '</main>' +
    '<aside class="lead-final-side">' + leadApprovalWorkflowSideHtml(report, ui) + leadReportSummaryHtml() + leadCapDeadlinesCardHtml() + leadReferencesCardHtml() + '</aside>' +
  '</div>' +
  '<div class="lead-final-bottom">' +
    '<button class="btn" data-act="lead-report-section" data-id="executive">← Previous</button>' +
    '<div><button class="btn" data-act="lead-report-save-draft" data-id="INS-2026-015">▣ Save Draft</button>' +
    '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>➤ ' + esc(sent ? 'Submitted to Unit Manager' : 'Submit to Unit Manager') + '</button></div>' +
  '</div>';
}

function leadReportDocumentsHtml() {
  var docs = [
    ['Draft Report', 'SMS_Audit_Draft_v1.0.pdf', '1.0', '15 Jun 2026'],
    ['Checklist Summary', 'Checklist_Summary.pdf', '1.0', '15 Jun 2026'],
    ['Findings Summary', 'Findings_Summary.pdf', '1.0', '15 Jun 2026'],
    ['CAP Summary', 'CAP_Summary.pdf', '1.0', '15 Jun 2026'],
    ['Evidence Index', 'Evidence_Index.pdf', '1.0', '15 Jun 2026']
  ];
  return '<div class="lead-simple-table"><table><thead><tr><th>Document Type</th><th>File Name</th><th>Version</th><th>Date</th><th>Action</th></tr></thead><tbody>' +
    docs.map(function (doc) {
      return '<tr><td>' + esc(doc[0]) + '</td><td>' + esc(doc[1]) + '</td><td>' + esc(doc[2]) + '</td><td>' + esc(doc[3]) + '</td>' +
        '<td><button class="lead-download-link" data-act="lead-review-download" data-id="INS-2026-015">&#8681; Download</button></td></tr>';
    }).join('') +
  '</tbody></table></div>';
}

function leadReportSummaryHtml() {
  var ui = leadReviewUiState();
  var saved = ui.reportDraftSavedAt ? fmtDate(DEMO_TODAY) + ' 14:30' : 'Not saved';
  var rows = [
    ['Total Findings', '8'],
    ['CAP Required', '5'],
    ['Observations', '3'],
    ['Report Version', '1.0'],
    ['Last Saved', saved]
  ];
  return '<div class="lead-side-card"><h2>Report Summary</h2><dl class="lead-report-summary">' +
    rows.map(function (row) { return '<dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd>'; }).join('') +
  '</dl></div>';
}

function leadEnforcementMechanismHtml() {
  var rows = [
    ['High', 'Operational Restriction; Suspend Specific Privilege; Suspend Certificate; Revoke Certificate', 'danger'],
    ['Medium', 'Administrative Penalty; Additional CAP Required; Increased Surveillance; Follow-up Inspection', 'warn'],
    ['Low', 'Warning Letter; Other Regulatory Action', 'ok']
  ];
  return '<div class="lead-side-card"><h2>Enforcement Mechanism</h2>' +
    '<p class="lead-review-muted">If corrective actions are not implemented by the due date, enforcement actions may be applied based on severity and risk.</p>' +
    '<div class="lead-enforcement-table"><table><thead><tr><th>Severity / Risk Level</th><th>Potential Enforcement Actions</th></tr></thead><tbody>' +
      rows.map(function (row) {
        var actions = row[1].split('; ').map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
        return '<tr><td><span class="lead-risk-dot is-' + esc(row[2]) + '"></span>' + esc(row[0]) + '</td><td><ul>' + actions + '</ul></td></tr>';
      }).join('') +
    '</tbody></table></div><p class="lead-review-muted mt-12">Final enforcement decision will be approved by the ED.</p></div>';
}

function leadReportWorkflowPanelHtml(report) {
  var ui = leadReviewUiState();
  var sent = leadReportSubmitted(report, ui);
  var comment = ui.workflowComment || '';
  return '<div class="lead-workflow-layout">' +
    '<div class="lead-workflow-main">' +
      '<section class="lead-review-panel lead-workflow-card">' +
        '<div class="lead-workflow-card__head"><h2>Report Approval Workflow</h2><p>The report will be reviewed and approved through the following hierarchy. Final approval and signature by the ED is required.</p></div>' +
        leadReportWorkflowStepsHtml(report, ui) +
        '<div class="lead-workflow-section"><h3>Current Review Status</h3>' + leadReportCurrentReviewHtml(report, ui) + '</div>' +
      '</section>' +
      '<section class="lead-review-panel lead-workflow-card">' +
        '<div class="lead-workflow-section"><h3>Report Documents</h3>' + leadReportDocumentsHtml() + '</div>' +
        '<div class="lead-workflow-section"><h3>Workflow Comments</h3><div class="lead-overall-comment lead-overall-comment--wide">' +
          '<textarea data-field="lead-workflow-comment" placeholder="Add comments for the next reviewer...">' + esc(comment) + '</textarea>' +
          '<div class="lead-review-count">' + esc(String(comment.length)) + ' / 1000</div></div></div>' +
      '</section>' +
      '<div class="lead-workflow-bottom">' +
        '<button class="btn" data-act="lead-review-tab" data-tab="checklist">&larr; Back to Inspection</button>' +
        '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>&#10148; ' + esc(sent ? 'Sent to Unit Manager' : 'Send to Unit Manager') + '</button>' +
      '</div>' +
    '</div>' +
    '<aside class="lead-workflow-side">' + leadReportSummaryHtml() + leadEnforcementMechanismHtml() + '</aside>' +
  '</div>';
}

function leadReviewHistoryPanelHtml(review, report) {
  var rows = [
    { date: '15 Jun 2026 09:12', actor: 'John Inspector', action: 'Checklist submitted', note: 'SMS Oversight Audit submitted to Lead Inspector review.' },
    { date: '15 Jun 2026 11:40', actor: 'Lead Inspector', action: 'Checklist review opened', note: 'Checklist Review tab opened for consolidation.' },
    { date: '15 Jun 2026 14:10', actor: report && report.approval && report.approval.history[0] ? report.approval.history[0].actor : 'Lead Inspector', action: 'Report draft created', note: review ? review.stage : 'Preliminary report draft assembled.' }
  ];
  return '<section class="lead-review-panel lead-review-panel--padded">' +
    '<h2>History</h2>' +
    '<div class="lead-review-timeline">' + rows.map(function (row) {
      return '<div class="lead-review-event">' +
        '<span>' + esc(row.date) + '</span>' +
        '<b>' + esc(row.action) + '</b>' +
        '<p>' + esc(row.actor + ' - ' + row.note) + '</p>' +
      '</div>';
    }).join('') + '</div>' +
  '</section>';
}

function leadReviewReturnedCount() {
  return leadReviewAllRows().filter(function (row) {
    return leadReviewDisplayDecision(row) === 'return';
  }).length;
}

function viewLeadReviewQueue() {
  var reviews = (state.leadAuditReviews || []).slice();
  var selectedAuditId = (state.params && state.params.auditId) || (reviews[0] && reviews[0].auditId);
  var review = leadAuditReviewForAudit(selectedAuditId) || reviews[0];
  var audit = review ? auditById(review.auditId) : null;
  var report = review ? (auditReportById(review.reportId) || reportForAudit(review.auditId)) : null;
  var ui = leadReviewUiState();
  var activeTab = ui.tab || 'report';

  if (!review) {
    return pageHead('Final Report', 'Completed checklist reports and preliminary inspection reports owned by the Lead Inspector.') +
      '<div class="empty">No completed checklist reports are ready for lead review.</div>';
  }

  var sent = leadReportSubmitted(report, ui);
  var generated = ui.reportGeneratedAt || ui.finalizedAt;
  var saved = ui.reportDraftSavedAt || generated;
  var workflowBadge = sent ? demoBadge('Report Status: Submitted to Unit Manager', 'info') : demoBadge('Report Status: Draft', 'ok');
  var tabContent = '';
  if (activeTab === 'findings') tabContent = leadReviewFindingsPanelHtml(review);
  else if (activeTab === 'cap') tabContent = leadReviewCapPanelHtml();
  else if (activeTab === 'conclusion') tabContent = leadConclusionPanelHtml();
  else if (activeTab === 'appendices') tabContent = leadAppendicesPanelHtml();
  else tabContent = leadFinalReportPanelHtml(report);

  return '<div class="lead-review-page">' +
    '<div class="lead-final-breadcrumb"><button data-act="nav" data-view="dashboard">☰</button><span>Inspections</span><span>/</span><span>INS-2026-015</span><span>/</span><b>Reports</b></div>' +
    '<div class="lead-review-head">' +
      '<div>' +
        '<h1>Final Report - Routine Inspection</h1>' +
        '<div class="lead-review-title-meta lead-final-meta"><span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Dates: <b>15 - 18 Jun 2026</b></span><span>Lead Inspector: <b>John Lead Inspector</b></span>' + workflowBadge + '</div>' +
        '<div class="inspection-status-line">' +
          (generated ? '<span class="inspection-save-state inspection-save-state--submitted">Report draft generated</span>' : '') +
          (saved ? '<span class="inspection-save-state">Draft saved</span>' : '') +
          (ui.downloadedAt ? '<span class="inspection-save-state">Draft downloaded</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="lead-review-actions">' +
        '<button class="btn" data-act="lead-report-preview" data-id="INS-2026-015">◎ Preview Report</button>' +
        '<button class="btn" data-act="lead-report-save-draft" data-id="INS-2026-015">▣ Save Draft</button>' +
        '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>➤ ' + esc(sent ? 'Submitted to Unit Manager' : 'Submit to Unit Manager') + '</button>' +
      '</div>' +
    '</div>' +
    leadReviewTabsHtml(activeTab) +
    tabContent +
  '</div>';
}

function reportDecisionButton(report, decision, label, tone, primary) {
  var cls = 'btn btn--sm';
  if (primary) cls += ' btn--primary';
  else if (tone === 'ok') cls += ' btn--ok';
  else if (tone === 'danger') cls += ' btn--danger';
  return '<button class="' + cls + '" data-act="report-approval" data-id="' + esc(report.id) + '" data-decision="' + esc(decision) + '">' + esc(label) + '</button>';
}

function reportDecisionPanelHtml(report) {
  var summary = approvalSummary(report);
  if (report.finalLocked) {
    return '<div class="decision-panel is-final"><div class="decision-panel__title">Final Report Locked</div>' +
      '<p class="small muted">Final report is non-editable in demo state. Audit closes only after ED approval.</p></div>';
  }
  if (summary.ownerRole !== state.role) {
    return '<div class="decision-panel"><div class="decision-panel__title">Waiting for ' + esc(summary.ownerLabel) + '</div>' +
      '<p class="small muted">Current next action: ' + esc(summary.nextAction) + '.</p></div>';
  }
  var buttons = '';
  if (state.role === 'leadInspector') {
    buttons = reportDecisionButton(report, 'forward', 'Submit Preliminary Report', null, true);
  } else if (state.role === 'manager') {
    buttons =
      reportDecisionButton(report, 'approve', 'Approve to GM', 'ok') +
      reportDecisionButton(report, 'return', 'Return to Lead', 'danger') +
      reportDecisionButton(report, 'reject', 'Reject', 'danger');
  } else if (state.role === 'gm') {
    buttons =
      reportDecisionButton(report, 'approve', 'Approve to ED', 'ok') +
      reportDecisionButton(report, 'return', 'Return to Department Manager', 'danger') +
      reportDecisionButton(report, 'reject', 'Reject', 'danger');
  } else if (state.role === 'executiveDirector') {
    buttons =
      reportDecisionButton(report, 'approve', 'Approve Final Report', 'ok') +
      reportDecisionButton(report, 'return', 'Return to GM', 'danger') +
      reportDecisionButton(report, 'reject', 'Reject', 'danger');
  }
  var enforcement = state.role === 'manager'
    ? '<div class="divider"></div><div class="form-row"><label>Enforcement recommendation only</label><select id="report-enforcement-type-' + esc(report.id) + '">' +
      '<option value="">No recommendation</option><option>Warning Letter</option><option>Administrative Penalty</option><option>Additional CAP Required</option><option>Increased Surveillance</option><option>Follow-up Inspection</option><option>Operational Restriction</option><option>Suspend Specific Privilege</option><option>Suspend Certificate</option><option>Revoke Certificate</option><option>Reject Application</option><option>Refuse Renewal</option><option>Other Regulatory Action</option></select></div>' +
      '<div class="form-row"><label>Recommendation reason</label><textarea id="report-enforcement-reason-' + esc(report.id) + '" placeholder="Recommendation only; never automatic."></textarea></div>'
    : '';
  return '<div class="decision-panel"><div class="decision-panel__title">' + esc(summary.ownerLabel) + ' Decision</div>' +
    '<label class="decision-panel__label" for="report-note-' + esc(report.id) + '">Decision note / mandatory return reason</label>' +
    '<textarea id="report-note-' + esc(report.id) + '" class="decision-panel__note" placeholder="Required for Return or Reject. Optional for approval."></textarea>' +
    enforcement +
    '<div class="decision-panel__actions">' + buttons + '</div></div>';
}

function viewAuditReportsApproval() {
  var requestedAuditId = state.params && state.params.auditId;
  var report = requestedAuditId ? reportForAudit(requestedAuditId) : null;
  if (!report) report = state.auditReports && state.auditReports.length ? state.auditReports[0] : null;
  if (!report) return pageHead('Audit Reports', '') + '<div class="empty">No audit report is seeded.</div>';
  var audit = auditById(report.auditId);
  var leadReview = leadAuditReviewForAudit(report.auditId);
  var summary = approvalSummary(report);
  var status = approvalMetaForStatus(report.status);
  var recommendation = report.enforcementRecommendation
    ? report.enforcementRecommendation.type + ' — ' + report.enforcementRecommendation.reason
    : 'None recorded';
  var signature = report.mockDigitalSignature
    ? '<div class="report__stamp">' + esc(report.mockDigitalSignature.label) + '</div><div class="small muted mt-12">Signed by ' + esc(report.mockDigitalSignature.signer) + ' · ' + esc(fmtDate(report.mockDigitalSignature.date)) + '</div>'
    : '<div class="muted small">Mock signature appears only after ED approval.</div>';
  var findings = state.findings.filter(function (finding) { return finding.auditId === report.auditId; });
  var reportQueue = (state.auditReports || []).map(workItemFromReport).sort(workItemSort);
  var findingsTable = renderOpsTable(findings.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }), { includeChildren: true, empty: 'No converted findings for this audit yet.' });

  return pageHead(report.title || ('Preliminary / Final Report — ' + report.id), 'Mock report approval chain: Lead Inspector -> Department Manager -> GM -> Executive Director.',
    '<button class="btn" data-act="mock-export">Preview PDF (mock)</button><button class="btn" data-act="mock-export">Preview Word (mock)</button>') +
    guardrailStrip([
      { label: 'Mock report module' },
      { label: 'Mock digital signature only', tone: 'warn' },
      { label: 'Enforcement recommendation only', tone: 'warn' }
    ]) +
    '<h2 class="section-heading">Report Approval Queue</h2>' +
    renderOpsTable(reportQueue, { selectedId: report.id, empty: 'No audit report approvals are seeded.' }) +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Report Status', esc(status.label), report.finalLocked ? 'Locked final report' : 'Editable demo draft', { tone: status.tone }) +
      kpiCard('Current Owner', esc(summary.ownerLabel), summary.nextAction, { tone: summary.statusTone }) +
      kpiCard('Audit Status', audit ? esc(audit.status) : '—', report.auditId) +
    '</div>' +
    '<div class="grid grid--main">' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>Report Overview</h3><div class="spacer"></div>' + demoBadge(status.label, status.tone) + '</div><div class="card__body">' +
          '<div class="metaline">' +
            metaItem('Audit', report.auditId) +
            metaItem('Report number', report.reportNumber || 'Generated after ED approval') +
            metaItem('Lead Inspector', audit ? audit.lead : '—') +
            metaItem('Approved by', report.approvedBy || '—') +
            metaItem('Approval date', report.approvalDate ? fmtDate(report.approvalDate) : '—') +
            metaItem('Enforcement recommendation', recommendation) +
          '</div>' +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Executive Summary</h3><span class="sub">AI-generated draft requires authorized review</span></div><div class="card__body">' +
          '<div class="callout">' + esc(report.executiveSummaryDraft) + '</div>' +
        '</div></div>' +
        (leadReview ? '<div class="card"><div class="card__head"><h3>Audit team checklist summary</h3><span class="sub">Inspectors assigned</span></div><div class="card__body">' + leadAssignmentsHtml(leadReview) + '</div></div>' : '') +
        '<div class="card"><div class="card__head"><h3>Findings / Observations / Recommendations</h3></div><div class="card__body">' +
          '<div class="reg-section-title">Findings from audit</div>' +
          findingsTable +
          (leadReview ? '<div class="reg-section-title mt-16">Submitted findings and comments</div>' + leadSubmittedFindingsHtml(leadReview) : '') +
          '<div class="reg-section-title mt-16">Observations</div>' + report.observations.map(function (item) { return '<div class="small muted mb-8">' + esc(item) + '</div>'; }).join('') +
          '<div class="reg-section-title mt-16">Recommendations</div>' + report.recommendations.map(function (item) { return '<div class="small muted mb-8">' + esc(item) + '</div>'; }).join('') +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Final Report Signature</h3></div><div class="card__body">' + signature + '</div></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card approval-card--compact"><div class="card__head"><h3>Approval Progress</h3></div><div class="card__body">' + approvalProgressHtml(report) + '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Decision Panel</h3></div><div class="card__body">' + reportDecisionPanelHtml(report) + '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Approval History</h3></div><div class="card__body">' + approvalHistoryHtml(report) + '</div></div>' +
      '</div>' +
    '</div>';
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
    evHtml = '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
      '<th>Version</th><th>Filename</th><th>Uploaded</th><th>Status</th><th>Demo boundary</th></tr></thead><tbody>' +
      f.evidence.map(function (e) {
      var bcls = e.status === 'Accepted' ? 'ok' : e.status === 'Rejected' ? 'danger' : 'info';
      return '<tr><td><b>v' + esc(e.version) + '</b></td>' +
        '<td><div class="ops-cell-title">' + esc(e.fileName) + '</div><div class="ops-cell-sub">' + esc(e.size) + ' · mock filename only</div></td>' +
        '<td>' + esc(fmtDate(e.uploadedDate)) + '</td>' +
        '<td><span class="badge badge--' + bcls + '"><span class="dot"></span>' + esc(e.status) + '</span></td>' +
        '<td class="ops-cell-muted">Version history preserved; no real file storage.</td></tr>';
    }).join('') + '</tbody></table></div>';
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

  /* Related audit-log entries */
  var logEntries = state.auditLog.filter(function (l) { return l.target === f.id; });
  var logHtml = logEntries.length
    ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th></tr></thead><tbody>' +
      logEntries.map(function (l) {
        return '<tr><td class="ops-cell-muted">' + esc(l.time) + '</td><td><b>' + esc(l.action) + '</b></td><td>' + esc(l.actor) + '</td><td>' + esc(l.target) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
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

  var capActions = (isAuditee && (f.status === 'WAITING_CAP' || f.status === 'CAP_MORE_INFO')
    ? '<div class="mt-12"><button class="btn btn--primary btn--sm" data-act="cap" data-id="' + f.id + '">Submit CAP</button></div>' : '') +
    ((!isAuditee && f.status === 'CAP_SUBMITTED')
      ? '<div class="mt-12"><button class="btn btn--primary btn--sm" data-act="reviewcap" data-id="' + f.id + '">Review CAP</button></div>' : '');
  var evidenceActions = (isAuditee && (f.status === 'EVIDENCE_REQUIRED' || f.status === 'EVIDENCE_MORE_INFO')
    ? '<div class="mt-12"><button class="btn btn--primary btn--sm" data-act="evidence" data-id="' + f.id + '">Upload evidence</button></div>' : '') +
    ((!isAuditee && f.status === 'EVIDENCE_SUBMITTED')
      ? '<div class="mt-12"><button class="btn btn--primary btn--sm" data-act="reviewev" data-id="' + f.id + '">Review evidence</button></div>' : '');
  var internalPanel = '';
  if (!isAuditee) {
    internalPanel = dossierPanel('Internal CAA Notes',
      ((f.internalNotes && f.internalNotes.length)
        ? f.internalNotes.map(function (n) {
            return '<div class="note-internal mb-8"><div class="tag">Internal CAA Note</div>' + esc(n.text) +
              '<div class="muted small mt-12">' + esc(n.author) + ' · ' + esc(fmtDate(n.date)) + '</div></div>';
          }).join('')
        : '<div class="muted small">No internal notes recorded.</div>'),
      'Not visible to the auditee');
  }

  return '' +
    pageHead('Finding ' + f.id, esc(f.title),
      '<button class="btn" data-act="nav" data-view="' + (isAuditee ? 'my-findings' : 'findings') + '">Back to findings</button>') +
    nextActionBar(f) +
    authClose +
    '<div class="lifecycle-strip">' + lifecycleStepper(f) +
      '<div class="lifecycle-strip__note">CAP accepted is not closure - a finding closes only after evidence is accepted, verification is completed, or an authorized closure is recorded.</div>' +
    '</div>' +
    '<div class="dossier-sections">' +
      '<div class="dossier-stack">' +
        dossierPanel('Finding Details',
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
          regulatoryTraceHtml(regulatoryTraceForFinding(f), true)) +
        dossierPanel('Corrective Action Plan (CAP)', capHtml + capActions, 'CAP acceptance does not close the finding') +
        dossierPanel('Evidence', evHtml + evidenceActions, 'Version history is preserved') +
        internalPanel +
      '</div>' +
      '<div class="dossier-stack">' +
        dossierPanel('Comments to Auditee', commentsHtml) +
        dossierPanel('Audit Trail', logHtml) +
      '</div>' +
    '</div>';
}

/* =========================== Findings list (manager/inspector) =========================== */
var FILTER_LABELS = {
  all: 'All Findings', open: 'Open Findings', overdue: 'Overdue Findings', critical: 'Critical Findings',
  closed: 'Closed Findings', capreview: 'CAPs Waiting Review', evreview: 'Evidence Waiting Review', duesoon: 'Findings Due Soon'
};

function inspectorActionableFindings() {
  return visibleFindings().filter(function (finding) {
    return !dueInfo(finding).overdue;
  });
}

function findingsForCurrentRoleList() {
  return visibleFindings();
}

function filterFindings(filter) {
  var f = findingsForCurrentRoleList();
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
  if (state.role === 'inspector' && filter === 'capreview') return viewInspectorCapReviews();
  if (state.role === 'leadInspector' && filter === 'capreview') return viewLeadCapTracking();
  var chipKeys = state.role === 'inspector'
    ? ['all', 'open', 'capreview', 'evreview', 'duesoon', 'critical', 'closed']
    : ['all', 'open', 'overdue', 'capreview', 'evreview', 'duesoon', 'critical', 'closed'];
  if (chipKeys.indexOf(filter) === -1) filter = 'open';
  var list = filterFindings(filter);
  var chips = chipKeys.map(function (key) {
    return '<button class="btn btn--sm' + (filter === key ? ' btn--primary' : '') + '" data-act="nav" data-view="findings" data-filter="' + key + '">' +
      esc(FILTER_LABELS[key]) + '</button>';
  }).join(' ');
  var items = list.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: filter === 'evreview' });
  }).sort(workItemSort);
  return pageHead('Findings', 'Every finding shows owner, due date, status and next action.', chips) +
    renderAttentionStrip([
      { label: FILTER_LABELS[filter], value: list.length + ' finding' + (list.length === 1 ? '' : 's'), tone: list.length ? 'info' : 'neutral' },
      { label: 'CAP review rows', value: String(list.filter(function (f) { return f.status === 'CAP_SUBMITTED'; }).length), tone: 'warn' },
      { label: 'Evidence review rows', value: String(list.filter(function (f) { return f.status === 'EVIDENCE_SUBMITTED'; }).length), tone: 'warn' }
    ]) +
    renderOpsTable(items, { includeChildren: filter === 'capreview' || filter === 'evreview', empty: 'No findings match this filter.' });
}

/* =========================== Reports list =========================== */
function viewReports() {
  var closed = visibleFindings().filter(function (f) { return f.status === 'CLOSED'; });
  var items = closed.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }).sort(workItemSort);
  return pageHead(state.role === 'auditee' ? 'Documents Shared / Reports' : 'Reports', 'Generated closure reports (preview only).') +
    (state.role === 'auditee' ? '<div class="scope-note">🔒 Shared documents are limited to ' + esc(ROLES.auditee.orgName) + '.</div>' : '') +
    '<h2 class="section-heading">Closure Reports</h2>' +
    renderOpsTable(items, {
      includeChildren: true,
      hideOrganization: state.role === 'auditee',
      empty: 'No closed findings to report yet.'
    });
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
    return '<tr>' +
      '<td><div class="ops-cell-title">' + esc(n.text) + '</div><div class="ops-cell-sub">' + esc(n.id) + ' · related CAA request where applicable</div></td>' +
      '<td>' + esc(ROLES.auditee.orgName) + '</td>' +
      '<td>' + esc(n.time) + '</td>' +
      '<td>' + demoBadge(n.unread ? 'Unread' : 'Read', n.unread ? 'info' : 'neutral') + '</td>' +
    '</tr>';
  }).join('') : '';
  return pageHead('Messages from the CAA', 'In-app notifications (mock — no real email or SMS is sent).') +
    '<div class="scope-note">🔒 Messages are limited to ' + esc(ROLES.auditee.orgName) + '.</div>' +
    (rows ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Message</th><th>Organization</th><th>Date</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">No messages.</div>');
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
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
    '<th>Template</th><th>Domain</th><th>Version</th><th>Items</th><th>Status</th><th></th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
}

function viewTemplatePreview() {
  var tpl = state.checklist;
  var items = tpl.items.map(function (it, i) {
    var trace = regulatoryTraceForQuestion(it.id);
    return '<tr class="ops-row">' +
      '<td><span class="ops-priority is-neutral">' + esc(i + 1) + '</span></td>' +
      '<td><div class="ops-cell-title">' + esc(it.text) + '</div><div class="ops-cell-sub">' + esc(it.id) + '</div></td>' +
      '<td>' + esc(it.ref) + '</td>' +
      '<td>' + esc(it.evidence) + '</td>' +
      '<td>' + (trace ? demoBadge(trace.approvalState, statusTone(trace.approvalState)) : demoBadge('No trace', 'neutral')) + '</td>' +
    '</tr>';
  }).join('');
  var table = '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
    '<th style="width:82px">Row</th><th>Question</th><th>Regulatory reference</th><th>Expected evidence</th><th>Trace</th>' +
    '</tr></thead><tbody>' + items + '</tbody></table></div>';
  return pageHead('Template Preview — ' + tpl.name, 'Read-only preview of the published checklist template.',
    '<button class="btn" data-act="nav" data-view="templates">Back to templates</button>') +
    '<div class="card mb-16"><div class="card__body"><div class="metaline">' +
      metaItem('Template ID', tpl.id) + metaItem('Domain', tpl.domain) +
      metaItem('Version', tpl.version) + metaItem('Owner', tpl.owner) +
      metaItem('Items', String(tpl.items.length)) + metaItem('Status', 'Published') +
    '</div></div></div>' + table;
}

/* =========================== Admin — Audit Log =========================== */
function viewAuditLog() {
  var rows = state.auditLog.map(function (l) {
    return '<tr><td class="muted">' + esc(l.time) + '</td><td><b>' + esc(l.action) + '</b></td>' +
      '<td><span class="tag-pill">' + esc(l.target) + '</span></td><td>' + esc(l.actor) + '</td>' +
      '<td>' + demoBadge(l.system ? 'System' : 'Manual', l.system ? 'info' : 'neutral') + '</td></tr>';
  }).join('');
  return pageHead('Audit Log', 'Critical actions are recorded for traceability (mock).') +
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
    '<th>Time</th><th>Action</th><th>Target</th><th>Actor</th><th>System / Manual</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
    '<th>Organization</th><th>Type</th><th>Open findings</th><th>Overdue</th><th>Repeat findings</th><th>Last audit</th><th></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function viewOrgDetail() {
  var o = orgById(state.params.orgId);
  if (!o) return pageHead('Organization not found', '') + '<div class="empty">This organization could not be found.</div>';
  var s = orgStats(o.id);
  var audits = state.audits.filter(function (a) { return a.orgId === o.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var findings = state.findings.filter(function (f) { return f.orgId === o.id; });

  var auditRows = renderOpsTable(audits.map(workItemFromAudit), { empty: 'No audits for this organization.' });
  var findingRows = renderOpsTable(findings.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }), { includeChildren: true, empty: 'No findings for this organization.' });

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
      dossierPanel('Findings', findingRows, 'Open and closed findings') +
      dossierPanel('Audits', auditRows, 'Surveillance history') +
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
    '<div class="ops-table-wrap"><table class="ops-table"><thead><tr>' +
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
        '<div class="form-row"><label>Application type <span class="req">*</span></label><select id="wz-type">' +
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
        metaItem('Organization', orgN) + metaItem('Application type', w.type) + metaItem('Domain', w.domain) +
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
