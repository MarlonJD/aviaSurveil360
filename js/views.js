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
      '<button class="btn btn--sm" data-act="reviewcap" data-id="' + esc(finding.id) + '">Review</button>'
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
    inspectorTable(['Inspection ID', 'Organization', 'Type', 'Status', 'Due Date', 'Progress', 'Action'], assignedRows, 'No inspections assigned to you.') +
    '<h2 class="section-heading mt-24">CAP Reviews</h2>' +
    inspectorTable(['CAP ID', 'Inspection ID', 'Organization', 'Submitted By', 'Due Date', 'Status', 'Action'], capRows, 'No CAP reviews are pending.') +
    '<h2 class="section-heading mt-24">Draft Reports</h2>' +
    inspectorTable(['Report ID', 'Inspection ID', 'Organization', 'Last Updated', 'Status', 'Action'], reportRows, 'No draft reports are ready to submit.');
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
  return '<button class="inspection-status inspection-status--' + esc(meta.cls) + '" data-act="inspection-status-cycle" data-id="' + esc(row.id) + '">' +
    '<span class="inspection-status__icon">' + meta.icon + '</span>' +
    '<span>' + esc(meta.label) + '</span>' +
    '<span class="inspection-status__chev">&#8964;</span>' +
  '</button>';
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
  var sectionRows = INSPECTOR_EXECUTION_SECTIONS.map(function (section) {
    return '<button class="inspection-section' + (section.active ? ' is-active' : '') + '" data-act="inspection-section-preview" data-id="' + esc(section.no) + '">' +
      '<span>' + esc(section.no + ' ' + section.title) + '</span>' +
      '<b>' + esc(section.done + ' / ' + section.total) + '</b>' +
    '</button>';
  }).join('');

  var checklistRows = INSPECTOR_EXECUTION_ITEMS.map(function (row) {
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
          '<div class="inspection-status-line">' + demoBadge('In Progress', 'info') + '</div>' +
        '</div>' +
        '<div class="inspection-exec__actions">' +
          '<button class="btn" data-act="inspection-download-checklist" data-id="' + esc(audit.id) + '"><span>&#8681;</span>Download Checklist</button>' +
          '<button class="btn" data-act="inspection-save-draft" data-id="' + esc(audit.id) + '"><span>&#128190;</span>Save Draft</button>' +
          '<button class="btn btn--primary" data-act="inspection-submit-lead" data-id="' + esc(audit.id) + '"><span>&#10148;</span>Submit to Lead Inspector</button>' +
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
            '<h2>1. Safety Policy and Objectives</h2>' +
            '<div class="inspection-card__meta">5 / 6 Completed <span>&#8963;</span></div>' +
          '</div>' +
          '<div class="inspection-table-wrap">' +
            '<table class="inspection-table"><thead><tr>' +
              '<th style="width:58px">No.</th><th>Checklist Item</th><th style="width:190px">Compliance</th><th>Comments</th><th style="width:180px">Attached File</th><th style="width:44px"></th>' +
            '</tr></thead><tbody>' + checklistRows + '</tbody></table>' +
          '</div>' +
          '<div class="inspection-bottom-nav">' +
            '<button class="btn" data-act="inspection-section-preview" data-id="previous">&larr; Previous Section</button>' +
            '<span>Next Section</span>' +
            '<button class="btn btn--primary" data-act="inspection-section-preview" data-id="next">2. Safety Risk Management &rarr;</button>' +
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
            metaItem('Audit type', a.type) +
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

function viewLeadReviewQueue() {
  var reviews = (state.leadAuditReviews || []).slice();
  var selectedAuditId = (state.params && state.params.auditId) || (reviews[0] && reviews[0].auditId);
  var review = leadAuditReviewForAudit(selectedAuditId) || reviews[0];
  var audit = review ? auditById(review.auditId) : null;
  var report = review ? (auditReportById(review.reportId) || reportForAudit(review.auditId)) : null;
  var potentials = (state.potentialFindings || []).slice().sort(function (a, b) {
    return (b.createdDate || '').localeCompare(a.createdDate || '');
  });

  if (!review) {
    return pageHead('Lead Inspector Workspace', 'Completed checklist reports and preliminary inspection reports owned by the Lead Inspector.') +
      '<div class="empty">No completed checklist reports are ready for lead review.</div>';
  }

  var completed = review.assignments.filter(function (item) { return item.status === 'Completed'; }).length;
  var inProgress = review.assignments.filter(function (item) { return item.status === 'In Progress'; }).length;
  var waiting = review.assignments.filter(function (item) { return item.status === 'Waiting'; }).length;

  return pageHead('Lead Inspector Workspace', 'Completed checklist reports, inspector findings, and preliminary inspection report preparation for assigned audits.',
    '<button class="btn" data-act="nav" data-view="audit-detail" data-id="' + esc(review.auditId) + '">Open audit</button>' +
    '<button class="btn btn--primary" data-act="nav" data-view="audit-reports" data-id="' + esc(review.auditId) + '">Open Preliminary Report</button>') +
    guardrailStrip([
      { label: 'Lead Inspector orchestration' },
      { label: 'Inspector checklist outputs consolidated', tone: 'info' },
      { label: 'Service Provider sees approved report only', tone: 'warn' }
    ]) +
    '<div class="grid grid--kpi mb-16">' +
      kpiCard('Completed checklist reports', String(completed), inProgress + ' in progress · ' + waiting + ' waiting', { tone: completed ? 'ok' : 'neutral' }) +
      kpiCard('Inspectors assigned', String(review.assignments.length), audit ? audit.team.join(', ') : review.auditId, { tone: 'info' }) +
      kpiCard('Submitted findings', String(review.submittedFindings.length), 'Inspector findings and comments', { tone: review.submittedFindings.length ? 'warn' : 'ok' }) +
      kpiCard('Preliminary report', review.reportStatus, 'Next: Submit to Department Manager', { tone: 'info' }) +
    '</div>' +
    '<div class="card mb-16"><div class="card__head"><h3>Report tracking</h3><span class="sub">one table for Lead Inspector follow-up</span><div class="spacer"></div>' +
      demoBadge(report ? humanStatus(report.status) : 'Draft', 'info') + '</div><div class="card__body card__body--flush">' +
      leadReportTrackingHtml(reviews, review.auditId) +
    '</div></div>' +
    '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="card"><div class="card__head"><h3>' + esc(review.title) + '</h3><div class="spacer"></div>' +
          demoBadge(audit ? audit.status : review.stage, 'info') + '</div><div class="card__body">' +
          '<div class="metaline">' +
            metaItem('Audit', review.auditId) +
            metaItem('Service Provider', audit ? orgName(audit.orgId) : '—') +
            metaItem('Lead Inspector', audit ? audit.lead : '—') +
            metaItem('Date', audit ? fmtDate(audit.date) : '—') +
            metaItem('Location', audit ? audit.location : '—') +
            metaItem('Stage', review.stage) +
          '</div>' +
        '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Checklist assignments</h3><span class="sub">by inspector</span></div><div class="card__body">' + leadAssignmentsHtml(review) + '</div></div>' +
        '<div class="card"><div class="card__head"><h3>Submitted findings and comments</h3><span class="sub">from inspectors</span></div><div class="card__body">' + leadSubmittedFindingsHtml(review) + '</div></div>' +
        leadPotentialDecisionRowsHtml(potentials) +
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
      '<option value="">No recommendation</option><option>Administrative</option><option>Warning</option><option>Suspension</option><option>Other</option></select></div>' +
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
