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

function commandMetric(label, value, tone) {
  return '<div class="command-metric' + (tone ? ' is-' + esc(tone) : '') + '">' +
    '<span>' + esc(label) + '</span><b>' + esc(value || '-') + '</b></div>';
}

function workbenchCommand(title, purpose, metrics, actionsHtml, modifier) {
  var cls = 'workbench-command' + (modifier ? ' workbench-command--' + esc(modifier) : '');
  return '<section class="' + cls + '">' +
    '<div class="workbench-command__main">' +
      '<h2>' + esc(title) + '</h2>' +
      (purpose ? '<p>' + esc(purpose) + '</p>' : '') +
    '</div>' +
    '<div class="workbench-command__meta">' + (metrics || []).map(function (metric) {
      return commandMetric(metric.label, metric.value, metric.tone);
    }).join('') + '</div>' +
    (actionsHtml ? '<div class="workbench-command__actions">' + actionsHtml + '</div>' : '') +
  '</section>';
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
  var priorityHead = options.priorityHead || 'Priority';
  var priorityWidth = options.priorityWidth || '96px';
  return '<div class="ops-table-wrap ops-table-wrap--stack"><table class="ops-table"><thead><tr>' +
    '<th style="width:' + esc(priorityWidth) + '">' + esc(priorityHead) + '</th><th>Item</th>' + orgHead +
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

function planningBlockingReason(item) {
  var approval = approvalSummary(item);
  var prep = item.preparation || { status: 'not_released' };
  if (approval.outcome === 'rejected') return 'Approval rejected; revise or archive the plan.';
  if (approval.outcome !== 'approved') return 'Waiting for ' + approval.ownerLabel + ' decision.';
  if (prep.status === 'ready_for_execution') return 'No blocker in demo data.';
  return planningNextAction(item);
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
    '<div class="approval-package">' +
      workbenchCommand('Planning approval package', item.title, [
        { label: 'Current owner', value: planningCurrentOwner(item), tone: approval.outcome === 'approved' ? prepMeta.tone : approval.statusTone },
        { label: 'Next action', value: planningNextAction(item), tone: 'info' },
        { label: 'Blocking reason', value: planningBlockingReason(item), tone: approval.outcome === 'approved' ? prepMeta.tone : approval.statusTone }
      ], '', 'approval') +
      '<div class="approval-package__queue">' +
        '<h2 class="section-heading">Planning Workbench</h2>' +
        renderOpsTable(planningItems, { selectedId: item.id, empty: 'No planning work items are seeded.' }) +
      '</div>' +
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
      '<div class="approval-package__decision">' +
        planningWorkspaceTabsHtml(activeTab) +
        body +
      '</div>' +
    '</div>';
}

function viewPlanningApprovals() {
  return viewPlanningWorkspace('approval');
}

function viewPlanningBoard() {
  return viewPlanningWorkspace('preparation');
}

function financeReviewStatus(item) {
  var summary = approvalSummary(item);
  if (item.financeReview && item.financeReview.decision === 'not_approved') return { key: 'returned', label: 'Returned for Revision', tone: 'warn' };
  if (item.financeReview && /^approved/.test(item.financeReview.decision || '')) return { key: 'approved', label: 'Budget Approved', tone: 'ok' };
  if (summary.ownerRole === 'finance') return { key: 'pending', label: 'Pending Finance Review', tone: 'warn' };
  return { key: 'waiting', label: 'Waiting for ' + summary.ownerLabel, tone: 'neutral' };
}

function financeReviewRows(ui) {
  var query = (ui.query || '').trim().toLowerCase();
  return state.planningItems.filter(function (item) {
    if (!item.budgetRequired) return false;
    var status = financeReviewStatus(item);
    if (ui.status !== 'all' && ui.status !== status.key) return false;
    return !query || [item.id, item.title, item.department, item.organization, item.riskCategory].join(' ').toLowerCase().indexOf(query) !== -1;
  });
}

function financeMoney(amount, currency) {
  return esc((currency || 'USD') + ' ' + Number(amount || 0).toLocaleString('en-US'));
}

function financeReviewTabs(active) {
  return '<div class="finance-review-tabs">' + [
    ['summary', 'Budget Summary'], ['breakdown', 'Budget Breakdown'], ['documents', 'Supporting Documents'], ['history', 'Comments & History']
  ].map(function (tab) { return '<button class="' + (active === tab[0] ? 'is-active' : '') + '" data-act="finance-review-tab" data-tab="' + tab[0] + '">' + esc(tab[1]) + '</button>'; }).join('') + '</div>';
}

function financeReviewTabBody(item, active) {
  if (active === 'breakdown') {
    return '<section class="finance-review-panel"><h2>Budget Breakdown</h2><div class="responsive-table-shell"><table class="finance-budget-table"><thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead><tbody>' + item.budget.lines.map(function (line) { return '<tr><td>' + esc(line.category) + '</td><td>' + financeMoney(line.amount, item.budget.currency) + '</td><td>' + esc(String(Math.round((line.amount / item.budget.requested) * 100))) + '%</td></tr>'; }).join('') + '<tr class="is-total"><td>Total Requested</td><td>' + financeMoney(planningBudgetTotal(item), item.budget.currency) + '</td><td>100%</td></tr></tbody></table></div></section>';
  }
  if (active === 'documents') {
    return '<section class="finance-review-panel"><h2>Supporting Documents</h2><p>Mock filenames only; no real finance document storage is used.</p><div class="finance-document-list"><button data-act="finance-review-document" data-id="request">Budget Request · ' + esc(item.id) + '</button><button data-act="finance-review-document" data-id="travel">Travel Estimate · ' + esc(item.id) + '</button><button data-act="finance-review-document" data-id="scope">Inspection Scope · ' + esc(item.id) + '</button></div></section>';
  }
  if (active === 'history') {
    return '<section class="finance-review-panel"><h2>Comments &amp; History</h2>' + approvalHistoryHtml(item) + '</section>';
  }
  return '<section class="finance-review-panel"><h2>Budget Summary</h2><div class="finance-summary-grid"><div><span>Requested Budget</span><b>' + financeMoney(item.budget.requested, item.budget.currency) + '</b></div><div><span>Available for Plan</span><b>' + financeMoney(item.budget.availableForPlan, item.budget.currency) + '</b></div><div><span>Remaining Annual Budget</span><b>' + financeMoney(item.budget.remainingAnnualBudget, item.budget.currency) + '</b></div><div><span>Budget Reconciliation</span><b>' + financeMoney(planningBudgetTotal(item), item.budget.currency) + ' / ' + financeMoney(item.budget.requested, item.budget.currency) + '</b></div></div><h3>Resource justification</h3><p>' + esc(item.purpose) + '</p><div class="callout"><b>Finance boundary:</b> Finance reviews budget and resource justification only. It cannot sign or release the plan, change inspection scope, close a Finding, or make a regulatory decision.</div></section>';
}

function financeReviewDecisionPanel(item, ui) {
  var summary = approvalSummary(item);
  var eligible = summary.ownerRole === 'finance' && !summary.outcome;
  var selected = ui.decision;
  return '<section class="finance-review-decision"><div><span>Current owner</span><b>' + esc(summary.ownerLabel) + '</b><small>' + esc(summary.nextAction) + '</small></div><div class="finance-decision-buttons"><button class="btn btn--primary" data-act="finance-review-choice" data-decision="approve"' + (eligible ? '' : ' disabled') + '>Approve Budget</button><button class="btn" data-act="finance-review-choice" data-decision="return"' + (eligible ? '' : ' disabled') + '>Return for Revision</button></div>' +
    (selected ? '<div class="finance-decision-form"><h3>' + esc(selected === 'approve' ? 'Approve Budget' : 'Return for Revision') + '</h3><label>Decision note' + (selected === 'return' ? ' <span class="req">*</span>' : ' (optional)') + '<textarea id="finance-review-comment" data-field="finance-review-comment" placeholder="' + esc(selected === 'return' ? 'Required: explain what must be revised.' : 'Optional finance note.') + '">' + esc(ui.comment || '') + '</textarea></label><button class="btn btn--primary" data-act="finance-review-confirm" data-id="' + esc(item.id) + '">Confirm Finance Decision</button></div>' : '') + '</section>';
}

function viewFinanceReviewWorkspace() {
  var ui = state.financeUi;
  var all = state.planningItems.filter(function (item) { return item.budgetRequired; });
  var rows = financeReviewRows(ui);
  var selected = all.filter(function (item) { return item.id === ui.selectedPlanId; })[0] || rows[0] || all[0] || null;
  if (!selected) return pageHead('Finance Review', 'Budget and resource review queue.') + '<div class="empty">No budget-required plans.</div>';
  var activeTab = state.params && ['summary', 'breakdown', 'documents', 'history'].indexOf(state.params.tab) !== -1 ? state.params.tab : 'summary';
  var pending = all.filter(function (item) { return approvalSummary(item).ownerRole === 'finance'; });
  var totalBudget = all.reduce(function (total, item) { return total + Number(item.budget && item.budget.requested || 0); }, 0);
  var rowHtml = rows.length ? rows.map(function (item) { var status = financeReviewStatus(item); return '<tr class="' + (selected.id === item.id ? 'is-selected' : '') + '"><td><button class="service-link" data-act="finance-review-select" data-id="' + esc(item.id) + '">' + esc(item.id) + '</button><small>' + esc(item.title) + '</small></td><td>' + esc(item.department) + '</td><td>' + financeMoney(item.budget.requested, item.budget.currency) + '</td><td>' + esc(approvalSummary(item).ownerLabel) + '</td><td>' + demoBadge(status.label, status.tone) + '</td><td><button class="btn btn--sm" data-act="finance-review-select" data-id="' + esc(item.id) + '">Review</button></td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty">No plans match the Finance filters.</div></td></tr>';
  return '<div class="finance-review-page">' + pageHead('Finance Review', 'Approve the requested budget or return it to General Manager action for revision.') + guardrailStrip([{ label: 'Budget approval only', tone: 'info' }, { label: 'No plan signature or release', tone: 'warn' }, { label: 'Frontend-only demo' }]) + '<div class="finance-summary-strip"><div><span>Pending Finance Review</span><b>' + esc(String(pending.length)) + '</b></div><div><span>Total Requested Budget</span><b>' + financeMoney(totalBudget, selected.budget.currency) + '</b></div><div><span>Approval path</span><b>Department Manager → GM → Finance Review → Executive Director</b></div></div><div class="finance-filter-row"><label>Search<input type="search" data-field="finance-review-query" value="' + esc(ui.query) + '" placeholder="Plan, department, organization"></label><label>Status<select data-field="finance-review-status"><option value="pending"' + (ui.status === 'pending' ? ' selected' : '') + '>Pending</option><option value="approved"' + (ui.status === 'approved' ? ' selected' : '') + '>Approved</option><option value="returned"' + (ui.status === 'returned' ? ' selected' : '') + '>Returned</option><option value="all"' + (ui.status === 'all' ? ' selected' : '') + '>All</option></select></label></div><div class="finance-review-layout"><main><section class="finance-review-queue"><h2>Review Queue</h2><div class="responsive-table-shell"><table><thead><tr><th>Plan</th><th>Department</th><th>Requested</th><th>Current Owner</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rowHtml + '</tbody></table></div></section><section class="finance-review-detail"><div class="finance-review-title"><div><span>Selected Plan</span><h2>' + esc(selected.title) + '</h2><p>' + esc(selected.id + ' · ' + selected.organization) + '</p></div>' + demoBadge(financeReviewStatus(selected).label, financeReviewStatus(selected).tone) + '</div>' + financeReviewTabs(activeTab) + financeReviewTabBody(selected, activeTab) + '</section></main><aside><section class="finance-review-rail"><h2>Approval Flow</h2>' + approvalProgressHtml(selected) + '</section>' + financeReviewDecisionPanel(selected, ui) + '</aside></div></div>';
}

/* ======================= Executive Director workspace ======================= */

function executivePendingPlanningItems() {
  return state.planningItems.filter(function (item) {
    return approvalSummary(item).ownerRole === 'executiveDirector';
  });
}

function executiveDashboardMetrics() {
  var pendingPlans = executivePendingPlanningItems();
  var pendingReports = executiveFinalReportProjection(state, { status: 'pending' }).rows;
  var openFindings = state.findings.filter(function (finding) { return finding.status !== 'CLOSED'; });
  var closedAudits = state.audits.filter(function (audit) { return audit.status === 'Closed'; });
  return {
    pendingPlans: pendingPlans,
    pendingReports: pendingReports,
    auditsInProgress: state.audits.filter(function (audit) { return ['Scheduled', 'In Progress', 'Follow-up Open'].indexOf(audit.status) !== -1; }).length,
    finalReports: state.managerReports.filter(function (report) { return report.reportType === 'Final Report'; }).length,
    overdueActions: openFindings.filter(function (finding) { return dueInfo(finding).overdue; }),
    closedThisPeriod: closedAudits.length + state.findings.filter(function (finding) { return finding.status === 'CLOSED'; }).length
  };
}

function executiveKpiButton(label, value, foot, target, status, tone) {
  return '<button class="executive-kpi' + (tone ? ' is-' + esc(tone) : '') + '" data-act="executive-dashboard-kpi" data-target="' + esc(target) + '" data-status="' + esc(status || 'all') + '">' +
    '<span>' + esc(label) + '</span><b>' + esc(String(value)) + '</b><small>' + esc(foot) + '</small></button>';
}

function executivePlanningQueueHtml(items) {
  if (!items.length) return '<div class="executive-empty"><b>No plans require an Executive Director decision.</b><span>Approved or returned items remain available in Planning.</span></div>';
  return '<div class="executive-decision-list">' + items.map(function (item) {
    var summary = approvalSummary(item);
    return '<article><div><span>' + esc(item.id + ' · ' + item.department) + '</span><b>' + esc(item.title) + '</b><small>' + esc(item.organization + ' · Target ' + item.targetMonth) + '</small></div><div>' + demoBadge(summary.statusLabel, summary.statusTone) + '<button class="btn btn--sm btn--primary" data-act="executive-open-plan" data-id="' + esc(item.id) + '">Review plan</button></div></article>';
  }).join('') + '</div>';
}

function executiveReportQueueHtml(items) {
  if (!items.length) return '<div class="executive-empty"><b>No Final Reports require an Executive Director decision.</b><span>Issued and returned reports remain available in Final Reports.</span></div>';
  return '<div class="executive-decision-list">' + items.map(function (report) {
    return '<article><div><span>' + esc(report.id + ' · ' + report.auditId) + '</span><b>' + esc(report.organization) + '</b><small>' + esc(report.leadInspector + ' · Submitted ' + report.submittedAt) + '</small></div><div>' + managerReportStatusBadge(report.status) + '<button class="btn btn--sm btn--primary" data-act="executive-open-report" data-id="' + esc(report.id) + '">Review report</button></div></article>';
  }).join('') + '</div>';
}

function executiveDepartmentOverviewHtml() {
  var grouped = {};
  state.audits.forEach(function (audit) {
    var key = audit.domain || 'Other';
    if (!grouped[key]) grouped[key] = { total: 0, active: 0, openFindings: 0 };
    grouped[key].total += 1;
    if (['Closed', 'Report Issued'].indexOf(audit.status) === -1) grouped[key].active += 1;
    grouped[key].openFindings += state.findings.filter(function (finding) { return finding.auditId === audit.id && finding.status !== 'CLOSED'; }).length;
  });
  return '<div class="executive-department-list">' + Object.keys(grouped).sort().map(function (name) {
    var row = grouped[name];
    return '<div><span><b>' + esc(name) + '</b><small>' + esc(row.total + ' audits') + '</small></span><span><b>' + esc(String(row.active)) + '</b><small>active</small></span><span><b>' + esc(String(row.openFindings)) + '</b><small>open Findings</small></span></div>';
  }).join('') + '</div>';
}

function executiveOverdueActionsHtml(items) {
  if (!items.length) return '<div class="executive-empty"><b>No overdue actions.</b><span>Due Date monitoring remains informational.</span></div>';
  return '<div class="executive-overdue-list">' + items.slice(0, 5).map(function (finding) {
    var audit = state.audits.filter(function (candidate) { return candidate.id === finding.auditId; })[0];
    return '<div><span><b>' + esc(finding.id) + '</b><small>' + esc(finding.title) + '</small></span><span>' + severityHtml(finding) + '<small>' + esc(dueInfo(finding).label + (audit ? ' · ' + audit.domain : '')) + '</small></span></div>';
  }).join('') + '</div>';
}

function viewExecutiveDirectorDashboard() {
  var metrics = executiveDashboardMetrics();
  return '<div class="executive-dashboard-page">' +
    pageHead('Executive Director Dashboard', 'Final decision workbench for surveillance plans and Final Reports.') +
    guardrailStrip([{ label: 'Final authorized demo approval', tone: 'info' }, { label: 'Mock approval mark — no real e-signature', tone: 'warn' }, { label: 'No automatic enforcement or closure decision', tone: 'neutral' }]) +
    '<section class="executive-kpi-grid" aria-label="Executive overview">' +
      executiveKpiButton('Total Audits', state.audits.length, 'Current demo portfolio', 'reports', 'all', 'neutral') +
      executiveKpiButton('Audits in Progress', metrics.auditsInProgress, 'Scheduled, active, or follow-up', 'reports', 'pending', 'info') +
      executiveKpiButton('Pending Approval', metrics.pendingPlans.length + metrics.pendingReports.length, metrics.pendingPlans.length + ' plans · ' + metrics.pendingReports.length + ' reports', 'planning', 'pending', 'warn') +
      executiveKpiButton('Final Reports', metrics.finalReports, 'All visible Final Report records', 'reports', 'all', 'ok') +
      executiveKpiButton('Overdue Actions', metrics.overdueActions.length, 'Open Finding Due Dates', 'reports', 'all', metrics.overdueActions.length ? 'danger' : 'ok') +
      executiveKpiButton('Closed This Period', metrics.closedThisPeriod, 'Closed audits and Findings', 'reports', 'approved', 'ok') +
    '</section>' +
    '<section class="executive-decision-grid"><div class="executive-panel"><header><div><span>Decision queue</span><h2>Planning approvals</h2></div><button class="btn btn--sm" data-act="executive-dashboard-kpi" data-target="planning" data-status="all">View all</button></header>' + executivePlanningQueueHtml(metrics.pendingPlans) + '</div>' +
    '<div class="executive-panel"><header><div><span>Decision queue</span><h2>Final Report approvals</h2></div><button class="btn btn--sm" data-act="executive-dashboard-kpi" data-target="reports" data-status="all">View all</button></header>' + executiveReportQueueHtml(metrics.pendingReports) + '</div></section>' +
    '<section class="executive-lower-grid"><div class="executive-panel"><header><div><span>Portfolio context</span><h2>Department overview</h2></div></header>' + executiveDepartmentOverviewHtml() + '</div>' +
    '<div class="executive-panel"><header><div><span>Due Date attention</span><h2>Overdue actions</h2></div></header>' + executiveOverdueActionsHtml(metrics.overdueActions) + '</div>' +
    '<aside class="executive-risk-guardrail"><span>Oversight Health context</span><h2>Management indicator only</h2><p>Risk and workload summaries are informational only. They do not make an automatic legal, enforcement, certificate suspension, Finding closure, or audit closure decision.</p></aside></section>' +
  '</div>';
}

function viewExecutivePlanningWorkspace() {
  var rows = state.planningItems;
  return '<div class="executive-workspace-page">' + pageHead('Planning', 'Review surveillance plans that have completed Department, GM, and Finance stages.') + guardrailStrip([{ label: 'Executive Director final plan approval', tone: 'info' }, { label: 'GM release remains a separate next step', tone: 'warn' }]) + '<section class="executive-panel"><header><div><span>Planning register</span><h2>Surveillance plans</h2></div></header>' + executivePlanningQueueHtml(rows) + '</section></div>';
}

function viewExecutiveFinalReportsWorkspace() {
  var projection = executiveFinalReportProjection(state, { query: state.executiveDirectorUi.reportQuery, organization: state.executiveDirectorUi.reportOrganization, status: state.executiveDirectorUi.reportStatus });
  return '<div class="executive-workspace-page">' + pageHead('Final Reports', 'Review Final Reports forwarded by the General Manager.') + guardrailStrip([{ label: 'Executive Director is the final report authority', tone: 'info' }, { label: 'Approval does not bypass CAP or Finding closure', tone: 'warn' }]) + '<section class="executive-panel"><header><div><span>Final Report register</span><h2>Authorized review queue</h2></div></header>' + executiveReportQueueHtml(projection.rows) + '</section></div>';
}

function viewExecutiveNotifications() {
  var notifications = state.notifications.filter(function (notification) { return notification.role === 'executiveDirector'; });
  return '<div class="executive-workspace-page">' + pageHead('Notifications', 'In-app Executive Director notices; no real email, SMS, or external service is used.') + '<section class="executive-panel"><div class="executive-notification-list">' + (notifications.length ? notifications.map(function (notification) { return '<article><span>' + esc(notification.icon || 'RPT') + '</span><div><b>' + esc(notification.text) + '</b><small>' + esc(notification.time) + '</small></div></article>'; }).join('') : '<div class="executive-empty"><b>No Executive Director notifications.</b><span>New planning and Final Report submissions appear here.</span></div>') + '</div></section></div>';
}

function viewExecutiveReportPreview() {
  return '<div class="executive-workspace-page">' + pageHead('Final Report Preview', 'Select a Final Report from the review workspace to open its state-backed document preview.') + '<div class="executive-empty"><b>No report selected for preview.</b><span>Use Final Reports to select a report record.</span><button class="btn btn--primary" data-act="nav" data-view="executive-final-reports">Return to Final Reports</button></div></div>';
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
  var questions = state.questionBank || [];
  var selected = questions[0] || null;
  var rows = questions.map(function (q, idx) {
    return '<div class="configuration-list-item' + (idx === 0 ? ' is-selected' : '') + '">' +
      '<span><b>' + esc(q.title) + '</b><small>' + esc(q.id) + ' · ' + esc(q.department) + ' · ' + esc(q.category) + '</small></span>' +
      demoBadge(q.status, q.status === 'Active' ? 'ok' : 'neutral') +
    '</div>';
  }).join('');
  var createPanel = canEdit
    ? '<div class="configuration-create-panel"><h3>New Question</h3><span class="sub">Mock item, saved in browser</span>' +
        '<div class="form-2col"><div class="form-row"><label>Title</label><input id="qb-title" type="text" value="Training evidence reconciliation"></div>' +
        '<div class="form-row"><label>Question text</label><input id="qb-text" type="text" value="Does the training matrix reconcile to sampled crew certificate evidence?"></div></div>' +
        '<button class="btn btn--primary" data-act="qb-create">+ New Question</button>' +
      '</div>'
    : '<div class="scope-note">Read-only preview. Inspectors cannot edit checklist configuration in this demo.</div>';
  var preview = selected
    ? '<div class="selected-question-preview">' +
        '<div class="configuration-preview-head"><div><span>Selected Question Preview</span><h2>' + esc(selected.title) + '</h2></div>' + demoBadge(selected.status, selected.status === 'Active' ? 'ok' : 'neutral') + '</div>' +
        '<p>' + esc(selected.text) + '</p>' +
        '<div class="decision-bar decision-bar--configuration">' +
          commandMetric('Current owner', canEdit ? 'Admin / Department Manager' : 'Configuration owner', 'info') +
          commandMetric('Next action', canEdit ? 'Review reference and publish through version flow' : 'Read-only preview', 'warn') +
          commandMetric('Version status', 'Reusable question', 'neutral') +
        '</div>' +
        '<div class="reg-trace reg-trace--compact configuration-trace">' +
          '<div class="reg-trace__head"><span class="reg-trace__mark">Regulatory reference</span>' + demoBadge('Reference only', 'warn') + '</div>' +
          '<div class="reg-trace__grid">' +
            '<div><span>Department</span><b>' + esc(selected.department) + '</b></div>' +
            '<div><span>Category</span><b>' + esc(selected.category) + '</b></div>' +
            '<div><span>Reference</span><b>' + esc(selected.regulationRef) + '</b></div>' +
            '<div><span>Expected evidence preview</span><b>' + esc(selected.exampleEvidence) + '</b></div>' +
            '<div><span>Comment requirement</span><b>' + esc(selected.commentRequired ? 'Comment required for exception answers' : 'Comment optional') + '</b></div>' +
            '<div><span>Demo boundary</span><b>Mock configuration data only</b></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    : '<div class="empty">No question bank records are seeded.</div>';

  return pageHead('Question Bank', 'Reusable checklist questions with configured references and expected evidence.') +
    guardrailStrip([
      { label: 'Mock configuration data' },
      { label: 'Regulatory references only', tone: 'warn' }
    ]) +
    '<div class="configuration-studio">' +
      '<aside class="configuration-studio__list">' +
        '<div class="configuration-search"><label>Search questions</label><input type="search" value="" placeholder="PBE, emergency equipment, evidence"></div>' +
        '<div class="configuration-list">' + rows + '</div>' +
      '</aside>' +
      '<main class="configuration-studio__preview">' +
        preview +
        createPanel +
      '</main>' +
    '</div>';
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
      purpose: 'Review assigned audits, findings, preliminary reports and final report readiness.',
      queueTitle: 'Assigned Audits',
      queueSub: 'Inspection execution, report preparation and CAP verification work',
      chain: 'Report approval: Lead Inspector -> Department Manager -> Executive Director / GM -> Final Report Issued.',
      boundary: 'Lead Inspector reviews potential findings and sets severity before conversion. Finding closure still requires accepted evidence or authorized closure.',
      kpis: [
        ['Potential Findings', '2', 'Awaiting lead review', 'warn', 'findings'],
        ['Reports In Draft', '3', 'Preliminary or final', 'info', 'audit-reports'],
        ['Finding Closure', '7', 'After final report', 'neutral', 'findings']
      ],
      rows: [
        ['CAB-2026-001', 'Potential finding from Cabin Inspection checklist', 'Severity review pending', 'findings'],
        ['AUD-2026-001', 'Fly Namibia Cabin Inspection', 'Team and checklist execution', 'calendar'],
        ['RPT-2026-004', 'Preliminary report package', 'Lead sign-off before Department Manager review', 'audit-reports']
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
        ['AUD-2026-001', 'Fly Namibia Cabin Inspection', 'Release candidate after approvals', 'planning'],
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
        ['AUD-2026-001', 'Fly Namibia Cabin Inspection', 'Finance accepted for ED review', 'planning']
      ]
    },
    executiveDirector: {
      title: 'Executive Director',
      purpose: 'Final approval for released plans and final report packages.',
      queueTitle: 'Executive Approval Queue',
      queueSub: 'Final governance approvals',
      chain: 'Planning: DM -> GM -> Finance -> ED. Report: Lead -> Department Manager -> Executive Director / GM -> Final Report Issued.',
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
  var signalCards = filteredProfiles.sort(function (a, b) { return b.score - a.score; }).map(function (profile) {
    var org = orgById(profile.orgId);
    var tone = profile.score >= 80 ? 'danger' : 'warn';
    var openForOrg = state.findings.filter(function (finding) { return finding.orgId === profile.orgId && finding.status !== 'CLOSED'; });
    var overdueForOrg = openForOrg.filter(function (finding) { return dueInfo(finding).overdue; });
    return '<article class="safety-signal-card is-' + tone + '" data-act="nav" data-view="org-risk" data-id="' + esc(profile.orgId) + '">' +
      '<div class="safety-signal-card__score"><span>Mock risk</span><b>' + esc(String(profile.score)) + '</b></div>' +
      '<div class="safety-signal-card__main">' +
        '<div class="safety-signal-card__head"><h3>' + esc(org ? org.name : profile.orgId) + '</h3>' + demoBadge(profile.band, tone) + '</div>' +
        '<p><b>Recommended action:</b> ' + esc(profile.recommendedAction) + '</p>' +
        '<div class="safety-signal-card__drivers"><span>Risk drivers</span><div>' +
          profile.drivers.map(function (driver) { return '<em>' + esc(driver) + '</em>'; }).join('') +
        '</div></div>' +
      '</div>' +
      '<div class="safety-signal-card__decision">' +
        commandMetric('Current owner', 'CAA Manager', 'info') +
        commandMetric('Open findings', String(openForOrg.length), openForOrg.length ? 'warn' : 'ok') +
        commandMetric('Overdue', String(overdueForOrg.length), overdueForOrg.length ? 'danger' : 'ok') +
        '<button class="btn btn--primary btn--sm" data-act="nav" data-view="org-risk" data-id="' + esc(profile.orgId) + '">Open profile</button>' +
      '</div>' +
    '</article>';
  }).join('');

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
    workbenchCommand('Management attention command', topRisk ? topRisk.recommendedAction : 'Review open findings and CAP/evidence queues.', [
      { label: 'Current owner', value: 'CAA Manager', tone: 'info' },
      { label: 'Next action', value: 'Open highest-risk profile', tone: 'warn' },
      { label: 'Blocking reason', value: overdue.length ? 'Overdue CAP/evidence exists' : 'No blocker in demo data', tone: overdue.length ? 'danger' : 'ok' }
    ], '<button class="btn btn--primary" data-act="nav" data-view="org-risk" data-id="' + esc(topRisk ? topRisk.orgId : 'ORG-XYZ') + '">Open highest risk profile</button>', 'safety') +
    '<h2 class="section-heading">Management Signal Dossiers</h2>' +
    '<div class="safety-signal-grid">' +
      (signalCards || '<div class="empty">No safety intelligence signals for this filter.</div>') +
    '</div>' +
    '<div class="v2-panel mt-16">' +
      '<h3>Recommended Management Action</h3>' +
      '<p>' + esc(topRisk ? topRisk.recommendedAction : 'Review open findings and CAP/evidence queues.') + '</p>' +
      '<div class="divider"></div>' +
      compactMetric('Section workload', 'Balanced (demo)', 'info') +
      compactMetric('Plan slippage', '2 planned audits not started', 'warn') +
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
  var dashboard = managerDashboardProjection(state);
  var kpis = [
    ['Total Audits', dashboard.totalAudits, dashboard.inProgressAudits + ' in progress', 'info'],
    ['Reports Awaiting Approval', dashboard.reportsAwaitingApproval, 'Preliminary and Final', 'warn'],
    ['Open Findings', dashboard.openFindings, 'CAA review and auditee action', 'danger'],
    ['CAPs In Progress', dashboard.capInProgress, 'CAP acceptance is not closure', 'info'],
    ['Overdue CAPs', dashboard.overdueCaps, 'Management follow-up', dashboard.overdueCaps ? 'danger' : 'ok'],
    ['Inspection Team', dashboard.teamMembers, 'Manager reporting line', 'ok']
  ];
  var tasks = [
    ['Audits', 'Review the audit work queue and upcoming inspections.', 'calendar', '▤'],
    ['Reports Approval', 'Decide Preliminary and Final Report submissions.', 'reports-approval', '□'],
    ['Risk Dashboard', 'Review department exposure and high-risk areas.', 'manager-risk', '⌁'],
    ['Inspection Team', 'Review teams, assignments, and schedules.', 'inspection-team', '▥'],
    ['Findings Review', 'Inspect findings requiring management attention.', 'findings-review', '⚑'],
    ['CAP Monitoring', 'Track CAP owners, Due Dates, and evidence action.', 'cap-monitoring', '✓'],
    ['Checklist Management', 'Maintain department packages and versions.', 'manager-checklists', '▧']
  ];
  var recentRows = dashboard.recentHighRiskFindings.length ? dashboard.recentHighRiskFindings.map(function (finding) {
    return '<tr><td><b>' + esc(finding.id) + '</b><small>' + esc(finding.title) + '</small></td><td>' + esc(orgName(finding.orgId)) + '</td><td>' + severityHtml(finding) + '</td><td>' + esc(ownerLabel(finding)) + '</td><td>' + esc(nextActionLabel(finding)) + '</td><td>' + esc(finding.dueDate ? fmtDate(finding.dueDate) : '—') + '</td><td><button class="btn btn--sm" data-act="go" data-view="finding" data-id="' + esc(finding.id) + '">Open</button></td></tr>';
  }).join('') : '<tr><td colspan="7"><div class="empty">No open high-risk findings require attention.</div></td></tr>';
  var upcomingRows = dashboard.upcomingAudits.length ? dashboard.upcomingAudits.map(function (audit) {
    return '<tr><td><b>' + esc(audit.id) + '</b><small>' + esc(audit.ref || audit.type) + '</small></td><td>' + esc(orgName(audit.orgId)) + '</td><td>' + esc(audit.domain || '—') + '</td><td>' + esc(fmtDate(audit.date)) + '</td><td>' + demoBadge(audit.status, audit.status === 'In Progress' ? 'warn' : 'info') + '</td><td><button class="btn btn--sm" data-act="go" data-view="audit-detail" data-id="' + esc(audit.id) + '">Open</button></td></tr>';
  }).join('') : '<tr><td colspan="6"><div class="empty">No upcoming audits are available.</div></td></tr>';

  return pageHead('Department Manager Dashboard', 'Operational oversight for ' + dashboard.organization + ', report decisions, findings, CAPs, and inspection teams.') +
    '<div class="manager-dashboard-kpis">' + kpis.map(function (item) {
      return '<article class="is-' + esc(item[3]) + '"><span>' + esc(item[0]) + '</span><strong>' + esc(String(item[1])) + '</strong><small>' + esc(item[2]) + '</small></article>';
    }).join('') + '</div>' +
    '<section class="manager-dashboard-tasks"><div class="manager-dashboard-section-head"><div><span>Manager workspace</span><h2>What needs attention?</h2></div></div><div>' + tasks.map(function (task) {
      return '<button class="manager-dashboard-task" data-act="go" data-view="' + esc(task[2]) + '"><span>' + esc(task[3]) + '</span><div><b>' + esc(task[0]) + '</b><small>' + esc(task[1]) + '</small></div><em>Open →</em></button>';
    }).join('') + '</div></section>' +
    '<div class="manager-dashboard-grid">' +
      '<section class="manager-dashboard-panel"><div class="manager-dashboard-section-head"><div><span>Priority review</span><h2>Recent High-Risk Findings</h2></div><button class="btn btn--sm" data-act="go" data-view="findings-review">View Findings Review</button></div><div class="manager-dashboard-table"><table><thead><tr><th>Finding</th><th>Organization</th><th>Severity</th><th>Current Owner</th><th>Next Action</th><th>Due Date</th><th></th></tr></thead><tbody>' + recentRows + '</tbody></table></div></section>' +
      '<section class="manager-dashboard-panel"><div class="manager-dashboard-section-head"><div><span>Surveillance schedule</span><h2>Upcoming Audits</h2></div><button class="btn btn--sm" data-act="go" data-view="calendar">View Audits</button></div><div class="manager-dashboard-table"><table><thead><tr><th>Audit</th><th>Organization</th><th>Department</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>' + upcomingRows + '</tbody></table></div></section>' +
    '</div>' +
    '<div class="guardrail-note"><b>Management indicators only:</b> Dashboard and risk values do not trigger automatic legal, enforcement, certificate, or finding-closure decisions.</div>';
}

function viewManagerWorkspacePlaceholder(title, message) {
  return pageHead(title, message) + '<section class="manager-dashboard-panel manager-dashboard-placeholder"><div class="empty"><b>' + esc(title) + '</b><span>This route is reserved for the approved frontend-only manager workspace and is not a production service.</span></div></section>';
}

function managerRiskUiState() {
  if (!state.managerRiskUi || typeof state.managerRiskUi !== 'object') state.managerRiskUi = {};
  var ui = state.managerRiskUi;
  if (['all', 'last-30', 'last-90', 'year'].indexOf(ui.dateRange) === -1) ui.dateRange = 'all';
  if (typeof ui.department !== 'string') ui.department = 'all';
  if (typeof ui.inspection !== 'string') ui.inspection = 'all';
  if (['all', 'High', 'Medium', 'Low', 'Very Low'].indexOf(ui.risk) === -1) ui.risk = 'all';
  if (typeof ui.exportedAt !== 'string') ui.exportedAt = '';
  return ui;
}

function managerRiskOption(value, label, selected) {
  return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
}

function managerRiskFilters(ui, projection) {
  return '<div class="manager-risk-filters"><label><span>Date Range</span><select data-field="manager-risk-date">' + managerRiskOption('all', 'All Dates', ui.dateRange) + managerRiskOption('last-30', 'Last 30 Days', ui.dateRange) + managerRiskOption('last-90', 'Last 90 Days', ui.dateRange) + managerRiskOption('year', 'Current Year', ui.dateRange) + '</select></label>' +
    '<label><span>Department</span><select data-field="manager-risk-department">' + managerRiskOption('all', 'All Departments', ui.department) + projection.availableDepartments.map(function (department) { return managerRiskOption(department, department, ui.department); }).join('') + '</select></label>' +
    '<label><span>Inspection</span><select data-field="manager-risk-inspection">' + managerRiskOption('all', 'All Inspections', ui.inspection) + projection.availableInspections.map(function (inspection) { return managerRiskOption(inspection.id, inspection.id + ' · ' + inspection.label, ui.inspection); }).join('') + '</select></label>' +
    '<label><span>Risk Level</span><select data-field="manager-risk-level">' + managerRiskOption('all', 'All Risk Levels', ui.risk) + managerRiskOption('High', 'High', ui.risk) + managerRiskOption('Medium', 'Medium', ui.risk) + managerRiskOption('Low', 'Low', ui.risk) + managerRiskOption('Very Low', 'Very Low', ui.risk) + '</select></label>' +
    '<button class="btn btn--sm" data-act="manager-risk-reset">Reset</button><button class="btn btn--primary btn--sm" data-act="manager-risk-export">Export CSV</button></div>';
}

function managerRiskKpis(projection) {
  var cards = [
    ['Total Findings', projection.totalFindings, 'info'],
    ['High Risk', projection.high, 'danger'],
    ['Medium Risk', projection.medium, 'warn'],
    ['Low Risk', projection.low, 'info'],
    ['Very Low Risk', projection.veryLow, 'neutral'],
    ['Overdue CAPs', projection.overdueCaps, projection.overdueCaps ? 'danger' : 'ok']
  ];
  return '<div class="manager-risk-kpis">' + cards.map(function (card) { return '<article class="is-' + esc(card[2]) + '"><span>' + esc(card[0]) + '</span><strong>' + esc(String(card[1])) + '</strong></article>'; }).join('') + '</div>';
}

function managerRiskRing(projection) {
  var total = Math.max(projection.totalFindings, 1);
  var highEnd = projection.high / total * 100;
  var mediumEnd = highEnd + projection.medium / total * 100;
  var lowEnd = mediumEnd + projection.low / total * 100;
  var background = projection.totalFindings ? 'conic-gradient(var(--danger) 0 ' + highEnd + '%, var(--warning) ' + highEnd + '% ' + mediumEnd + '%, var(--brand) ' + mediumEnd + '% ' + lowEnd + '%, var(--line) ' + lowEnd + '% 100%)' : 'conic-gradient(var(--line-soft) 0 100%)';
  var legend = [['High', projection.high, 'danger'], ['Medium', projection.medium, 'warn'], ['Low', projection.low, 'info'], ['Very Low', projection.veryLow, 'neutral']].map(function (item) {
    return '<li class="is-' + item[2] + '"><span></span><b>' + esc(item[0]) + '</b><em>' + item[1] + '</em></li>';
  }).join('');
  return '<section class="manager-risk-panel"><header><span>Risk distribution</span><h2>Findings by Risk</h2></header><div class="manager-risk-ring-wrap"><div class="manager-risk-ring" style="background:' + esc(background) + '"><div><strong>' + projection.totalFindings + '</strong><span>Findings</span></div></div><ul>' + legend + '</ul></div></section>';
}

function managerRiskTrend(projection) {
  var max = projection.trend.reduce(function (value, item) { return Math.max(value, item.total); }, 1);
  var bars = projection.trend.length ? projection.trend.map(function (item) {
    var height = Math.max(5, Math.round(item.total / max * 100));
    return '<div title="' + esc(item.week + ': ' + item.total + ' findings') + '"><span style="height:' + height + '%"><i style="height:' + (item.high / Math.max(item.total, 1) * 100) + '%"></i></span><small>' + esc(item.week.replace(/^\d{4}-/, '')) + '</small></div>';
  }).join('') : '<div class="manager-risk-chart-empty">No trend data</div>';
  return '<section class="manager-risk-panel"><header><span>Weekly view</span><h2>Risk Trend</h2></header><div class="manager-risk-trend">' + bars + '</div></section>';
}

function managerRiskMatrix(projection) {
  function tone(score) { return score >= 15 ? 'critical' : (score >= 10 ? 'high' : (score >= 5 ? 'medium' : 'low')); }
  var cells = projection.matrix.map(function (cell) {
    return '<div class="is-' + tone(cell.score) + '" title="Likelihood ' + cell.likelihood + ', Impact ' + cell.impact + '"><span>' + cell.count + '</span><small>' + cell.score + '</small></div>';
  }).join('');
  return '<section class="manager-risk-panel manager-risk-matrix-panel"><header><span>Likelihood × Impact</span><h2>Risk Exposure Matrix</h2></header><div class="manager-risk-matrix"><div class="manager-risk-axis-y">Likelihood</div><div class="manager-risk-matrix-grid">' + cells + '</div><div class="manager-risk-axis-x">Impact →</div></div></section>';
}

function managerRiskTopAreas(projection) {
  var max = projection.topRiskyAreas.reduce(function (value, row) { return Math.max(value, row.score); }, 1);
  var rows = projection.topRiskyAreas.length ? projection.topRiskyAreas.map(function (row) {
    return '<li><div><b>' + esc(row.department) + '</b><span>' + row.total + ' findings</span></div><span><i style="width:' + Math.round(row.score / max * 100) + '%"></i></span><em>' + row.score + '</em></li>';
  }).join('') : '<li class="is-empty">No risk areas match these filters.</li>';
  return '<section class="manager-risk-panel"><header><span>Weighted exposure</span><h2>Top Risky Areas</h2></header><ol class="manager-risk-areas">' + rows + '</ol></section>';
}

function managerRiskDepartments(projection) {
  var rows = projection.departmentDistribution.length ? projection.departmentDistribution.map(function (row) {
    function width(value) { return value / Math.max(row.total, 1) * 100; }
    return '<li><div><b>' + esc(row.department) + '</b><span>' + row.total + '</span></div><div class="manager-risk-stack" title="High ' + row.high + ', Medium ' + row.medium + ', Low ' + row.low + ', Very Low ' + row.veryLow + '"><i class="is-high" style="width:' + width(row.high) + '%"></i><i class="is-medium" style="width:' + width(row.medium) + '%"></i><i class="is-low" style="width:' + width(row.low) + '%"></i><i class="is-very-low" style="width:' + width(row.veryLow) + '%"></i></div></li>';
  }).join('') : '<li class="is-empty">No department distribution is available.</li>';
  return '<section class="manager-risk-panel"><header><span>Finding mix</span><h2>Department Risk Distribution</h2></header><ul class="manager-risk-departments">' + rows + '</ul></section>';
}

function managerRiskOverdue(projection) {
  return '<section class="manager-risk-panel"><header><span>Corrective action attention</span><h2>Overdue CAPs by Risk</h2></header><div class="manager-risk-overdue">' + projection.overdueByRisk.map(function (item) {
    return '<article class="is-' + esc(item.riskLevel.toLowerCase().replace(/\s/g, '-')) + '"><span>' + esc(item.riskLevel) + '</span><strong>' + item.count + '</strong></article>';
  }).join('') + '</div><p>CAP acceptance is not finding closure. Required evidence and authorized verification remain separate.</p></section>';
}

function managerRiskRecent(projection) {
  var body = projection.recentHighRiskFindings.length ? projection.recentHighRiskFindings.map(function (row) {
    return '<tr><td><button data-act="go" data-view="finding" data-id="' + esc(row.id) + '">' + esc(row.id) + '</button><small>' + esc(row.title) + '</small></td><td>' + esc(row.organization) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.inspectionId) + '</td><td>' + esc(fmtDate(row.issuedDate)) + '</td><td>' + esc(row.status.replace(/_/g, ' ')) + '</td><td>' + (row.overdueCap ? demoBadge('Overdue', 'danger') : demoBadge('On track', 'ok')) + '</td></tr>';
  }).join('') : '<tr><td colspan="7"><div class="empty">No recent high-risk findings match these filters.</div></td></tr>';
  return '<section class="manager-risk-panel manager-risk-recent"><header><span>Priority review</span><h2>Recent High-Risk Findings</h2></header><div><table><thead><tr><th>Finding</th><th>Organization</th><th>Department</th><th>Inspection</th><th>Issued</th><th>Status</th><th>CAP Due</th></tr></thead><tbody>' + body + '</tbody></table></div></section>';
}

function viewManagerRiskDashboard() {
  var ui = managerRiskUiState();
  var projection = managerRiskProjection(state, ui);
  var empty = projection.totalFindings === 0 ? '<div class="manager-risk-empty"><b>No risk records match these filters.</b><span>Reset or change a filter to restore the management view.</span></div>' : '';
  return pageHead('Risk Dashboard', 'Review finding exposure, Due Dates, and CAP attention across the department using management indicators.') +
    '<section class="manager-risk-workspace">' + managerRiskFilters(ui, projection) + managerRiskKpis(projection) + empty + '<div class="manager-risk-grid">' + managerRiskRing(projection) + managerRiskTrend(projection) + managerRiskMatrix(projection) + managerRiskTopAreas(projection) + managerRiskDepartments(projection) + managerRiskOverdue(projection) + '</div>' + managerRiskRecent(projection) + '</section>' +
    '<div class="guardrail-note"><b>Management indicator only:</b> This risk dashboard supports oversight prioritization and does not trigger automatic legal, enforcement, certificate, or closure action.</div>';
}

function generalManagerUiState() {
  if (!state.generalManagerUi || typeof state.generalManagerUi !== 'object') state.generalManagerUi = {};
  var ui = state.generalManagerUi;
  if (typeof ui.selectedReportId !== 'string') ui.selectedReportId = '';
  if (typeof ui.validationMessage !== 'string') ui.validationMessage = '';
  return ui;
}

function generalManagerKpis(projection) {
  var items = [
    ['Pending Final Reports', projection.pendingFinalReports, 'warn'],
    ['High Risk Findings', projection.highRiskFindings, 'danger'],
    ['Reports Awaiting Your Approval', projection.reportsAwaitingApproval, 'info'],
    ['Overdue CAPs', projection.overdueCaps, projection.overdueCaps ? 'danger' : 'ok']
  ];
  return '<div class="gm-kpis">' + items.map(function (item) { return '<article class="is-' + item[2] + '"><span>' + esc(item[0]) + '</span><strong>' + item[1] + '</strong></article>'; }).join('') + '</div>';
}

function generalManagerDepartmentTable(projection, compact) {
  var body = projection.departments.length ? projection.departments.map(function (row) {
    return '<tr><td><b>' + esc(row.department) + '</b></td><td>' + row.audits + '</td><td>' + row.activeAudits + '</td><td>' + row.totalFindings + '</td><td>' + row.high + '</td><td>' + row.medium + '</td><td>' + row.overdueCaps + '</td><td><span class="gm-exposure-score">' + row.exposureScore + '</span></td></tr>';
  }).join('') : '<tr><td colspan="8"><div class="empty">No department data is available.</div></td></tr>';
  return '<div class="gm-table"><table><thead><tr><th>Department</th><th>Audits</th><th>Active</th><th>Findings</th><th>High</th><th>Medium</th><th>Overdue CAPs</th><th>Exposure</th></tr></thead><tbody>' + body + '</tbody></table></div>' + (compact ? '<button class="btn btn--sm" data-act="go" data-view="gm-departments">View All Departments</button>' : '');
}

function generalManagerHeatMap(projection, title) {
  function tone(score) { return score >= 15 ? 'critical' : (score >= 10 ? 'high' : (score >= 5 ? 'medium' : 'low')); }
  return '<section class="gm-panel gm-risk-heat"><header><span>Likelihood × Impact</span><h2>' + esc(title || 'Risk Heat Map') + '</h2></header><div class="gm-risk-matrix">' + projection.riskMatrix.map(function (cell) {
    return '<div class="is-' + tone(cell.score) + '" title="Likelihood ' + cell.likelihood + ', Impact ' + cell.impact + '"><b>' + cell.count + '</b><small>' + cell.score + '</small></div>';
  }).join('') + '</div><div class="gm-risk-axis"><span>Higher likelihood ↑</span><span>Impact →</span></div></section>';
}

function generalManagerApprovalTable(projection, compact) {
  var body = projection.approvalRows.length ? projection.approvalRows.map(function (row) {
    return '<tr><td><b>' + esc(row.id) + '</b><small>' + esc(row.auditId) + '</small></td><td>' + esc(row.organization) + '</td><td>' + esc(row.department) + '</td><td>v' + esc(row.version) + '</td><td>' + esc(row.leadInspector) + '</td><td>' + esc(row.submittedAt) + '</td><td><div class="gm-report-actions"><button class="btn btn--sm" data-act="gm-report-open" data-id="' + esc(row.id) + '">Open Report</button><button class="btn btn--sm" data-act="gm-report-decision" data-id="' + esc(row.id) + '" data-decision="return">Return Report</button><button class="btn btn--primary btn--sm" data-act="gm-report-decision" data-id="' + esc(row.id) + '" data-decision="approve">Approve Final Report</button></div></td></tr>';
  }).join('') : '<tr><td colspan="7"><div class="empty"><b>No Final Reports awaiting approval</b><span>Department Manager-approved Final Reports will appear here.</span></div></td></tr>';
  return '<div class="gm-table gm-approval-table"><table><thead><tr><th>Report</th><th>Organization</th><th>Department</th><th>Version</th><th>Lead Inspector</th><th>Submitted</th><th>Decision</th></tr></thead><tbody>' + body + '</tbody></table></div>' + (compact ? '<button class="btn btn--sm" data-act="go" data-view="gm-report-approvals">Open Report Approvals</button>' : '');
}

function generalManagerRecentRisk(projection) {
  var rows = projection.recentHighRiskFindings.length ? projection.recentHighRiskFindings.map(function (row) {
    return '<tr><td><b>' + esc(row.id) + '</b><small>' + esc(row.title) + '</small></td><td>' + esc(row.organization) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.inspectionId) + '</td><td>' + esc(fmtDate(row.issuedDate)) + '</td><td>' + esc(row.status.replace(/_/g, ' ')) + '</td></tr>';
  }).join('') : '<tr><td colspan="6"><div class="empty">No recent high-risk findings are available.</div></td></tr>';
  return '<section class="gm-panel gm-recent-risk"><header><span>Priority visibility</span><h2>Recent High-Risk Findings</h2></header><div class="gm-table"><table><thead><tr><th>Finding</th><th>Organization</th><th>Department</th><th>Inspection</th><th>Issued</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

function viewGeneralManagerDashboard() {
  var projection = generalManagerProjection(state);
  return pageHead('General Manager Dashboard', 'Review final authorized report decisions, department exposure, high-risk findings, and overdue CAPs.') + generalManagerKpis(projection) +
    '<div class="gm-dashboard-grid"><section class="gm-panel"><header><span>Cross-department oversight</span><h2>Department Overview</h2></header>' + generalManagerDepartmentTable(projection, true) + '</section>' + generalManagerHeatMap(projection, 'Risk Heat Map') + '</div>' +
    '<section class="gm-panel gm-dashboard-queue"><header><span>Final authorized stage</span><h2>Final Report Approval Queue</h2></header>' + generalManagerApprovalTable(projection, true) + '</section>' +
    '<div class="guardrail-note"><b>Final authorization boundary:</b> Department Manager approval alone does not issue or lock a Final Report. Only the configured final General Manager authorization can issue and lock it in this demo.</div>';
}

function generalManagerReportDetail(row) {
  if (!row) return '<section class="gm-report-detail"><div class="empty"><b>Select a Final Report</b><span>Open a queue row to inspect the report and its authorization history.</span></div></section>';
  var history = row.report.history.slice().reverse().map(function (entry) { return '<li><time>' + esc(entry.at) + '</time><div><b>' + esc(entry.action) + '</b><small>' + esc(entry.actor) + (entry.comment ? ' · ' + esc(entry.comment) : '') + '</small></div></li>'; }).join('');
  return '<section class="gm-report-detail"><header><div><span>Selected Final Report</span><h2>' + esc(row.id) + ' · ' + esc(row.organization) + '</h2><p>' + esc(row.auditId + ' · ' + row.department) + '</p></div>' + demoBadge('Awaiting Final Authorization', 'warn') + '</header><dl><div><dt>Version</dt><dd>' + esc(row.version) + '</dd></div><div><dt>Lead Inspector</dt><dd>' + esc(row.leadInspector) + '</dd></div><div><dt>Submitted</dt><dd>' + esc(row.submittedAt) + '</dd></div><div><dt>Locked</dt><dd>No</dd></div></dl><section><h3>Executive Summary</h3><p>' + esc(row.summary) + '</p></section><div class="gm-detail-actions"><button class="btn" data-act="gm-report-decision" data-id="' + esc(row.id) + '" data-decision="return">Return Report</button><button class="btn btn--primary" data-act="gm-report-decision" data-id="' + esc(row.id) + '" data-decision="approve">Approve Final Report</button></div><section><h3>Authorization History</h3><ol>' + history + '</ol></section><div class="gm-final-rule"><b>Issuance rule:</b> This approval is the configured final authorization. A successful approval issues and locks this Final Report.</div></section>';
}

function viewGeneralManagerReportApprovals() {
  var ui = generalManagerUiState();
  var projection = generalManagerProjection(state);
  var selected = projection.approvalRows.filter(function (row) { return row.id === ui.selectedReportId; })[0] || projection.approvalRows[0] || null;
  ui.selectedReportId = selected ? selected.id : '';
  return pageHead('Report Approvals', 'Review only Department Manager-approved Final Reports at the configured final authorized stage.') + generalManagerKpis(projection) + '<div class="gm-approval-workspace"><section class="gm-panel"><header><span>Authorization queue</span><h2>Final Reports Awaiting Your Approval</h2></header>' + generalManagerApprovalTable(projection, false) + '</section>' + generalManagerReportDetail(selected) + '</div>' +
    '<div class="guardrail-note"><b>Restricted workspace:</b> General Manager users do not receive Department Manager team-editing or checklist-editing controls.</div>';
}

function viewGeneralManagerDepartments() {
  var projection = generalManagerProjection(state);
  return pageHead('Departments', 'Compare audit activity, findings, risk exposure, and overdue CAP attention across departments.') + '<section class="gm-panel"><header><span>Cross-department oversight</span><h2>Department Overview</h2></header>' + generalManagerDepartmentTable(projection, false) + '</section><div class="gm-dashboard-grid">' + generalManagerHeatMap(projection, 'Department Risk Heat Map') + managerRiskRing(projection.risk) + '</div>';
}

function viewGeneralManagerRiskDashboard() {
  var projection = generalManagerProjection(state);
  return pageHead('Cross-Department Risk Dashboard', 'Review aggregated department exposure without team or checklist editing controls.') + generalManagerKpis(projection) + '<div class="gm-dashboard-grid">' + generalManagerHeatMap(projection, 'Risk Exposure Matrix') + managerRiskRing(projection.risk) + managerRiskDepartments(projection.risk) + managerRiskOverdue(projection.risk) + '</div>' + generalManagerRecentRisk(projection) +
    '<div class="guardrail-note"><b>Management indicator only:</b> Cross-department risk values do not trigger automatic legal, enforcement, certificate, or closure action.</div>';
}

function modalGeneralManagerDecision(report, decision) {
  var approve = decision === 'approve';
  var body = '<div class="modal__intro"><b>' + esc(report.id) + '</b> · ' + esc(report.organization) + '<br>' + (approve ? 'This is the configured final authorization and will issue and lock the Final Report.' : 'A comment is required before returning the Final Report to the Department Manager.') + '</div><div class="form-row"><label>General Manager Comment' + (approve ? '' : ' <span class="req">*</span>') + '</label><textarea id="gm-report-comment" placeholder="Record the authorization rationale or required revision."></textarea><div id="gm-report-validation" class="gm-decision-validation" role="alert"></div></div>';
  return modalShell(approve ? 'Approve Final Report' : 'Return Final Report', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn ' + (approve ? 'btn--primary' : 'btn--danger') + '" data-act="gm-report-confirm-decision" data-id="' + esc(report.id) + '" data-decision="' + esc(decision) + '">' + (approve ? 'Approve & Issue Final Report' : 'Return Report') + '</button>');
}

function managerChecklistUiState() {
  if (!state.managerChecklistUi || typeof state.managerChecklistUi !== 'object') state.managerChecklistUi = {};
  var ui = state.managerChecklistUi;
  if (['Active', 'Draft', 'Published', 'Archived'].indexOf(ui.status) === -1) ui.status = 'Active';
  if (typeof ui.selectedPackageId !== 'string') ui.selectedPackageId = '';
  if (typeof ui.selectedSectionId !== 'string') ui.selectedSectionId = '';
  if (typeof ui.selectedQuestionId !== 'string') ui.selectedQuestionId = '';
  if (typeof ui.validationMessage !== 'string') ui.validationMessage = '';
  return ui;
}

function managerChecklistStatusBadge(status) {
  var tone = status === 'Published' ? 'ok' : (status === 'Draft' ? 'warn' : (status === 'Archived' ? 'neutral' : 'info'));
  return demoBadge(status, tone);
}

function managerChecklistPackageRail(packages, selectedId, ui) {
  var tabs = ['Active', 'Draft', 'Published', 'Archived'].map(function (status) {
    return '<button class="' + (ui.status === status ? 'is-active' : '') + '" data-act="manager-checklist-filter" data-value="' + esc(status) + '">' + esc(status) + '</button>';
  }).join('');
  var rows = packages.length ? packages.map(function (item) {
    var selected = item.id === selectedId;
    var questionCount = item.sections.reduce(function (count, section) { return count + section.questionIds.length; }, 0);
    return '<button class="manager-checklist-package' + (selected ? ' is-selected' : '') + '" data-act="manager-checklist-select" data-id="' + esc(item.id) + '"' + (selected ? ' aria-current="true"' : '') + '>' +
      '<span>' + esc(item.name) + '</span><small>' + esc(item.department) + ' · ' + questionCount + ' questions</small><em>v' + esc(item.version) + ' · ' + esc(item.status) + '</em></button>';
  }).join('') : '<div class="empty"><b>No packages</b><span>Create a package or change the status filter.</span></div>';
  return '<aside class="manager-checklist-packages"><header><div><span>Department workspace</span><h2>Checklist Packages</h2></div><button class="btn btn--primary btn--sm" data-act="manager-checklist-create">Create Package</button></header><div class="manager-checklist-status-tabs" role="tablist" aria-label="Package status">' + tabs + '</div><div class="manager-checklist-package-list">' + rows + '</div></aside>';
}

function managerChecklistPackageInfo(item) {
  var attachments = item.attachments.length ? item.attachments.map(function (filename) {
    return '<li><span>📎</span><div><b>' + esc(filename) + '</b><small>Selected filename only · no file storage</small></div></li>';
  }).join('') : '<li class="is-empty">No attachment filenames recorded.</li>';
  var history = item.history.length ? item.history.slice().reverse().map(function (entry) {
    return '<li><time>' + esc(entry.at) + '</time><div><b>' + esc(entry.action) + '</b><small>' + esc(entry.actor) + '</small></div></li>';
  }).join('') : '<li class="is-empty">No package history recorded.</li>';
  var versions = item.versions.length ? item.versions.slice().reverse().map(function (version) {
    return '<li><div><b>Version ' + esc(version.version) + '</b><small>' + esc(version.createdDate || '—') + ' · ' + esc(version.createdBy || '—') + '</small></div><span>' + esc(String(version.status || '').replace(/_/g, ' ')) + '</span></li>';
  }).join('') : '<li class="is-empty">No published versions yet.</li>';
  return '<section class="manager-checklist-package-info"><div class="manager-checklist-section-title"><div><span>Selected package</span><h3>Package Information</h3></div>' + managerChecklistStatusBadge(item.status) + '</div>' +
    '<dl><div><dt>Name</dt><dd>' + esc(item.name) + '</dd></div><div><dt>Department</dt><dd>' + esc(item.department) + '</dd></div><div><dt>Owner</dt><dd>' + esc(item.owner) + '</dd></div><div><dt>Inspection Type</dt><dd>' + esc(item.inspectionType) + '</dd></div><div><dt>Effective Date</dt><dd>' + esc(fmtDate(item.effectiveDate)) + '</dd></div><div><dt>Version</dt><dd>v' + esc(item.version) + '</dd></div></dl>' +
    '<div class="manager-checklist-package-actions"><button class="btn btn--sm" data-act="manager-checklist-duplicate" data-id="' + esc(item.id) + '">Duplicate</button><button class="btn btn--sm" data-act="manager-checklist-archive" data-id="' + esc(item.id) + '"' + (item.status === 'Archived' ? ' disabled' : '') + '>Archive</button><button class="btn btn--primary btn--sm" data-act="manager-checklist-publish" data-id="' + esc(item.id) + '"' + (item.status === 'Archived' ? ' disabled' : '') + '>Publish New Version</button></div>' +
    '<details><summary>Attachments</summary><ul class="manager-checklist-mini-list">' + attachments + '</ul><label class="manager-checklist-file">Add attachment filename<input id="manager-checklist-attachment" type="file"><button class="btn btn--sm" data-act="manager-checklist-attachment" data-id="' + esc(item.id) + '">Add Filename</button></label></details>' +
    '<details><summary>Version History</summary><ul class="manager-checklist-mini-list">' + versions + '</ul></details>' +
    '<details><summary>History</summary><ol class="manager-checklist-history">' + history + '</ol></details></section>';
}

function managerChecklistSections(item, ui) {
  var sections = item.sections.map(function (section, index) {
    var selected = section.id === ui.selectedSectionId;
    return '<li class="' + (selected ? 'is-selected' : '') + '"><button data-act="manager-checklist-section-select" data-id="' + esc(section.id) + '"><span>' + esc(section.name) + '</span><small>' + section.questionIds.length + ' questions</small></button><div><button data-act="manager-checklist-section-move" data-id="' + esc(section.id) + '" data-direction="up" aria-label="Move section up"' + (index === 0 ? ' disabled' : '') + '>↑</button><button data-act="manager-checklist-section-move" data-id="' + esc(section.id) + '" data-direction="down" aria-label="Move section down"' + (index === item.sections.length - 1 ? ' disabled' : '') + '>↓</button><button data-act="manager-checklist-section-remove" data-id="' + esc(section.id) + '" aria-label="Remove section"' + (item.sections.length === 1 ? ' disabled' : '') + '>×</button></div></li>';
  }).join('');
  return '<section class="manager-checklist-sections"><div class="manager-checklist-section-title"><div><span>Package structure</span><h3>Sections & Questions</h3></div><button class="btn btn--sm" data-act="manager-checklist-section-add" data-id="' + esc(item.id) + '">Add Section</button></div><ol>' + sections + '</ol></section>';
}

function managerChecklistQuestionRows(item, section, ui) {
  var questions = section ? section.questionIds.map(function (questionId) { return managerChecklistQuestionById(state, questionId); }).filter(Boolean) : [];
  var rows = questions.length ? questions.map(function (question, index) {
    var selected = question.id === ui.selectedQuestionId;
    return '<button class="manager-checklist-question-row' + (selected ? ' is-selected' : '') + '" data-act="manager-checklist-question-select" data-id="' + esc(question.id) + '"><span>' + (index + 1) + '</span><div><b>' + esc(question.text || question.title) + '</b><small>' + esc(question.status || 'Active') + ' · ' + esc(question.riskLevel || 'Not assessed') + '</small></div></button>';
  }).join('') : '<div class="empty"><b>No questions in this section</b><span>Add a question to begin the browser-local draft.</span></div>';
  return '<div class="manager-checklist-question-list"><header><b>' + esc(section ? section.name : 'Select a section') + '</b><button class="btn btn--primary btn--sm" data-act="manager-checklist-question-add"' + (section ? '' : ' disabled') + '>Add Question</button></header>' + rows + '</div>';
}

function managerChecklistOptions(values, selected) {
  return values.map(function (value) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(value) + '</option>'; }).join('');
}

function managerChecklistQuestionEditor(question, item, section, ui) {
  var draft = question || {};
  var likelihood = draft.likelihood || 'Rare';
  var impact = draft.impact || 'Insignificant';
  var risk = managerChecklistRisk(likelihood, impact);
  var evidenceMethods = Array.isArray(draft.evidenceMethods) ? draft.evidenceMethods.join(', ') : (draft.exampleEvidence ? 'Document Review' : '');
  var findingTypes = Array.isArray(draft.findingTypes) ? draft.findingTypes.join(', ') : (draft.findingType || 'Compliance');
  var reference = draft.reference || draft.regulationRef || '';
  var guidance = draft.guidance || draft.inspectorGuidance || '';
  return '<form class="manager-checklist-question-editor" onsubmit="return false"><div class="manager-checklist-section-title"><div><span>Question editor</span><h3>' + (question ? 'Edit Question' : 'New Question') + '</h3></div><span class="manager-checklist-risk is-' + esc(risk.level.toLowerCase()) + '">' + esc(risk.level) + ' · ' + risk.score + '</span></div>' +
    '<div class="manager-checklist-editor-grid"><label class="is-wide"><span>Question Text</span><textarea id="manager-checklist-question-text" placeholder="Enter a clear inspection question.">' + esc(draft.text || '') + '</textarea></label>' +
    '<label class="is-wide"><span>Configured Requirement / Reference</span><input id="manager-checklist-question-reference" value="' + esc(reference) + '" placeholder="Configured reference or finding basis"></label>' +
    '<label class="is-wide"><span>Guidance Note</span><textarea id="manager-checklist-question-guidance" placeholder="Inspector guidance for this demo question.">' + esc(guidance) + '</textarea></label>' +
    '<label><span>Evidence Methods</span><input id="manager-checklist-question-evidence" value="' + esc(evidenceMethods) + '" placeholder="Document Review, Interview"></label>' +
    '<label><span>Finding Types</span><input id="manager-checklist-question-findings" value="' + esc(findingTypes) + '" placeholder="Compliance, Equipment"></label>' +
    '<label><span>Likelihood</span><select id="manager-checklist-question-likelihood">' + managerChecklistOptions(['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'], likelihood) + '</select></label>' +
    '<label><span>Impact</span><select id="manager-checklist-question-impact">' + managerChecklistOptions(['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'], impact) + '</select></label>' +
    '<label><span>Status</span><select id="manager-checklist-question-status">' + managerChecklistOptions(['Active', 'Inactive'], draft.status || 'Active') + '</select></label>' +
    '<div class="manager-checklist-toggles"><label><input id="manager-checklist-question-mandatory" type="checkbox"' + (draft.mandatory ? ' checked' : '') + '> Mandatory</label><label><input id="manager-checklist-question-critical" type="checkbox"' + (draft.critical ? ' checked' : '') + '> Critical</label></div></div>' +
    '<div class="manager-checklist-validation" role="alert">' + esc(ui.validationMessage) + '</div><footer><button class="btn" data-act="manager-checklist-question-duplicate" data-id="' + esc(draft.id || '') + '"' + (question ? '' : ' disabled') + '>Duplicate</button><button class="btn btn--danger" data-act="manager-checklist-question-remove" data-id="' + esc(draft.id || '') + '"' + (question ? '' : ' disabled') + '>Remove</button><button class="btn btn--primary" data-act="manager-checklist-question-save" data-id="' + esc(draft.id || '') + '" data-package="' + esc(item.id) + '" data-section="' + esc(section ? section.id : '') + '"' + (section ? '' : ' disabled') + '>Save Question</button></footer></form>';
}

function viewManagerChecklistManagement() {
  var ui = managerChecklistUiState();
  var allPackages = managerChecklistPackages(state);
  var packages = managerChecklistPackages(state, { status: ui.status });
  var item = managerChecklistPackageById(state, ui.selectedPackageId);
  if (!item || (ui.status !== 'Archived' && item.status === 'Archived') || (ui.status === 'Draft' && item.status !== 'Draft') || (ui.status === 'Published' && item.status !== 'Published')) {
    item = packages[0] || null;
    ui.selectedPackageId = item ? item.id : '';
  }
  if (!item && allPackages.length && ui.status === 'Active') item = allPackages[0];
  if (!item) return pageHead('Checklist Management', 'Manage department checklist packages, versions, sections, and questions in browser-local demo state.') + '<div class="manager-checklist-layout">' + managerChecklistPackageRail(packages, '', ui) + '<section class="manager-checklist-empty"><div class="empty"><b>No package selected</b><span>Create a checklist package to begin.</span></div></section></div>';
  ensureManagerChecklistPackageShape(state, item);
  var section = item.sections.filter(function (candidate) { return candidate.id === ui.selectedSectionId; })[0] || item.sections[0];
  ui.selectedSectionId = section ? section.id : '';
  var question = ui.selectedQuestionId ? managerChecklistQuestionById(state, ui.selectedQuestionId) : null;
  if (!question || !section || section.questionIds.indexOf(question.id) === -1) question = section && section.questionIds.length ? managerChecklistQuestionById(state, section.questionIds[0]) : null;
  ui.selectedQuestionId = question ? question.id : '';
  return pageHead('Checklist Management', 'Manage package information, preserved versions, sections, and questions in browser-local demo state.') +
    '<div class="manager-checklist-layout">' + managerChecklistPackageRail(packages, item.id, ui) + '<main class="manager-checklist-workspace">' + managerChecklistPackageInfo(item) + managerChecklistSections(item, ui) + managerChecklistQuestionRows(item, section, ui) + managerChecklistQuestionEditor(question, item, section, ui) + '</main></div>' +
    '<div class="guardrail-note"><b>Demo boundary:</b> Published versions are preserved. Editing creates a browser-local draft and does not change a production rule or legal obligation.</div>';
}

function modalManagerChecklistCreate() {
  var body = '<div class="form-row"><label>Package Name <span class="req">*</span></label><input id="manager-checklist-package-name" placeholder="Checklist package name"></div><div class="form-row"><label>Department</label><input id="manager-checklist-package-department" value="Cabin Safety"></div>';
  return modalShell('Create Checklist Package', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="manager-checklist-confirm-create">Create Package</button>');
}

function modalManagerChecklistSection(packageId) {
  var body = '<div class="form-row"><label>Section Name <span class="req">*</span></label><input id="manager-checklist-section-name" placeholder="Section name"></div>';
  return modalShell('Add Checklist Section', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="manager-checklist-confirm-section" data-id="' + esc(packageId) + '">Add Section</button>');
}

function managerCapUiState() {
  if (!state.managerCapUi || typeof state.managerCapUi !== 'object') state.managerCapUi = {};
  var ui = state.managerCapUi;
  if (!ui.status) ui.status = 'all';
  if (!ui.department) ui.department = 'all';
  if (!ui.inspection) ui.inspection = 'all';
  if (!ui.due) ui.due = 'all';
  if (typeof ui.selectedCapId !== 'string') ui.selectedCapId = '';
  if (typeof ui.drawerOpen !== 'boolean') ui.drawerOpen = false;
  if (['overview', 'action-plan', 'updates', 'documents', 'history'].indexOf(ui.tab) === -1) ui.tab = 'overview';
  if (typeof ui.validationMessage !== 'string') ui.validationMessage = '';
  return ui;
}

function managerCapOption(value, label, selected) {
  return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
}

function managerCapStatusBadge(row) {
  var tone = row.overdue ? 'danger' : (row.statusKey === 'evidence-required' ? 'warn' : (row.statusKey === 'not-submitted' ? 'neutral' : 'info'));
  return demoBadge(row.overdue ? 'Overdue' : row.status, tone);
}

function managerCapDaysLabel(row) {
  if (row.daysLeft === null) return '—';
  if (row.daysLeft < 0) return Math.abs(row.daysLeft) + ' days overdue';
  if (row.daysLeft === 0) return 'Due today';
  return row.daysLeft + ' days left';
}

function managerCapFilters(ui, allRows) {
  var departments = Array.from(new Set(allRows.map(function (row) { return row.department; }))).sort();
  var inspections = Array.from(new Set(allRows.map(function (row) { return row.inspectionId; }))).sort();
  return '<div class="manager-cap-filters">' +
    '<label><span>Status</span><select data-field="manager-cap-status">' + managerCapOption('all', 'All Statuses', ui.status) + managerCapOption('not-submitted', 'Not Submitted', ui.status) + managerCapOption('in-progress', 'In Progress', ui.status) + managerCapOption('evidence-required', 'Evidence Required', ui.status) + managerCapOption('overdue', 'Overdue', ui.status) + managerCapOption('completed', 'Completed', ui.status) + '</select></label>' +
    '<label><span>Department</span><select data-field="manager-cap-department">' + managerCapOption('all', 'All Departments', ui.department) + departments.map(function (item) { return managerCapOption(item, item, ui.department); }).join('') + '</select></label>' +
    '<label><span>Inspection</span><select data-field="manager-cap-inspection">' + managerCapOption('all', 'All Inspections', ui.inspection) + inspections.map(function (item) { return managerCapOption(item, item, ui.inspection); }).join('') + '</select></label>' +
    '<label><span>Due Date</span><select data-field="manager-cap-due">' + managerCapOption('all', 'All Due Dates', ui.due) + managerCapOption('overdue', 'Overdue', ui.due) + managerCapOption('next-7', 'Next 7 Days', ui.due) + managerCapOption('next-30', 'Next 30 Days', ui.due) + '</select></label>' +
    '<button class="btn btn--sm" data-act="manager-cap-filter" data-key="reset">Reset</button>' +
  '</div>';
}

function managerCapMetricCards(metrics) {
  var items = [
    ['Total CAPs', metrics.total, 'info'],
    ['Not Submitted', metrics.notSubmitted, 'neutral'],
    ['In Progress', metrics.inProgress, 'info'],
    ['Evidence Required', metrics.evidenceRequired, 'warn'],
    ['Overdue CAPs', metrics.overdue, 'danger'],
    ['Completed', metrics.completed, 'ok']
  ];
  return '<div class="manager-cap-metrics">' + items.map(function (item) {
    return '<article class="is-' + esc(item[2]) + '"><span>' + esc(item[0]) + '</span><strong>' + esc(String(item[1])) + '</strong></article>';
  }).join('') + '</div>';
}

function managerCapTable(rows) {
  var body = rows.length ? rows.map(function (row) {
    return '<tr>' +
      '<td><b>' + esc(row.id) + '</b></td>' +
      '<td><b>' + esc(row.findingId) + '</b><small>' + esc(row.findingTitle) + '</small></td>' +
      '<td><b>' + esc(row.inspectionId) + '</b><small>' + esc(row.organization) + '</small></td>' +
      '<td>' + esc(row.department) + '</td>' +
      '<td>' + esc(row.findingLevel) + '</td>' +
      '<td>' + managerCapStatusBadge(row) + '</td>' +
      '<td>' + esc(row.actionOwner) + '</td>' +
      '<td><b>' + esc(fmtDate(row.dueDate)) + '</b></td>' +
      '<td class="' + (row.overdue ? 'is-overdue' : '') + '">' + esc(managerCapDaysLabel(row)) + '</td>' +
      '<td><div class="manager-cap-progress"><span><i style="width:' + esc(String(row.progress)) + '%"></i></span><b>' + esc(String(row.progress)) + '%</b></div></td>' +
      '<td>' + esc(row.lastUpdate) + '</td>' +
      '<td><button class="manager-cap-menu" data-act="manager-cap-menu" data-id="' + esc(row.id) + '" aria-label="Open CAP actions for ' + esc(row.id) + '" aria-expanded="false">⋯</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="12"><div class="empty">No CAPs match these filters.</div></td></tr>';
  return '<div class="manager-cap-table"><table><thead><tr><th>CAP ID</th><th>Related Finding</th><th>Inspection</th><th>Department</th><th>Finding Level</th><th>Status</th><th>Action Owner</th><th>Due Date</th><th>Days Left / Overdue</th><th>Progress</th><th>Last Update</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>';
}

function managerCapSummaryPanels(rows) {
  var metrics = managerCapMetrics(rows);
  var overdue = rows.filter(function (row) { return row.overdue; });
  var upcoming = rows.filter(function (row) { return row.daysLeft !== null && row.daysLeft >= 0 && row.daysLeft <= 30; });
  function miniRows(items, empty) {
    return items.length ? items.slice(0, 4).map(function (row) {
      return '<li><div><b>' + esc(row.id) + '</b><span>' + esc(row.findingTitle) + '</span></div><em>' + esc(managerCapDaysLabel(row)) + '</em></li>';
    }).join('') : '<li class="is-empty">' + esc(empty) + '</li>';
  }
  return '<div class="manager-cap-summaries">' +
    '<section><h3>Status Overview</h3><dl><div><dt>Not Submitted</dt><dd>' + metrics.notSubmitted + '</dd></div><div><dt>In Progress</dt><dd>' + metrics.inProgress + '</dd></div><div><dt>Evidence Required</dt><dd>' + metrics.evidenceRequired + '</dd></div></dl></section>' +
    '<section><h3>Overdue CAPs</h3><ul>' + miniRows(overdue, 'No overdue CAPs in this view.') + '</ul></section>' +
    '<section><h3>Upcoming Due Dates</h3><ul>' + miniRows(upcoming, 'No CAPs due in the next 30 days.') + '</ul></section>' +
  '</div>';
}

function managerCapDrawerTabs(active) {
  var tabs = [['overview', 'Overview'], ['action-plan', 'Action Plan'], ['updates', 'Updates'], ['documents', 'Documents'], ['history', 'History']];
  return '<div class="manager-cap-drawer-tabs" role="tablist" aria-label="CAP detail sections">' + tabs.map(function (tab) {
    return '<button role="tab" aria-selected="' + (tab[0] === active ? 'true' : 'false') + '" class="' + (tab[0] === active ? 'is-active' : '') + '" data-act="manager-cap-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function managerCapOverview(row) {
  return '<div class="manager-cap-drawer-panel"><dl class="manager-cap-definition">' +
    '<div><dt>Status</dt><dd>' + managerCapStatusBadge(row) + '</dd></div><div><dt>Action Owner</dt><dd>' + esc(row.actionOwner) + '</dd></div><div><dt>Assignee</dt><dd>' + esc(row.assignee) + '</dd></div><div><dt>Due Date</dt><dd>' + esc(fmtDate(row.dueDate)) + '</dd></div><div><dt>Priority</dt><dd>' + esc(row.priority) + '</dd></div><div><dt>Target Closure Date</dt><dd>' + esc(fmtDate(row.targetClosureDate)) + '</dd></div>' +
  '</dl><section><h3>Finding Description</h3><p>' + esc(row.findingDescription) + '</p></section><section><h3>Impact / Risk</h3><p>' + esc(row.impactRisk) + '</p></section><section><h3>Root Cause</h3><p>' + esc(row.rootCause || 'Not yet submitted.') + '</p></section><section><h3>Configured Reference</h3><p>' + esc(row.reference) + '</p></section><section><h3>Linked Finding</h3><p>' + esc(row.findingId + ' · ' + row.findingTitle) + '</p></section><div class="manager-cap-drawer-progress"><span><i style="width:' + esc(String(row.progress)) + '%"></i></span><b>' + esc(String(row.progress)) + '% complete</b></div><button class="btn btn--primary btn--sm" data-act="manager-cap-tab" data-tab="updates">Add Update</button><div class="manager-cap-closure-rule"><b>Closure boundary:</b> CAP acceptance is not finding closure. Required evidence and authorized verification remain separate.</div></div>';
}

function managerCapActionPlan(row) {
  return '<div class="manager-cap-drawer-panel"><section><h3>Corrective Action</h3><p>' + esc(row.correctiveAction || 'Not yet submitted.') + '</p></section><section><h3>Preventive Action</h3><p>' + esc(row.preventiveAction || 'Not yet submitted.') + '</p></section><section><h3>Target</h3><p>' + esc(row.targetClosureDate ? fmtDate(row.targetClosureDate) : 'Not configured') + '</p></section></div>';
}

function managerCapUpdates(row, ui) {
  var items = row.updates.slice().reverse().map(function (update) {
    return '<li><time>' + esc(update.at) + '</time><div><b>' + esc(update.actor) + '</b><p>' + esc(update.text) + '</p></div></li>';
  }).join('') || '<li class="is-empty">No CAP updates have been recorded.</li>';
  return '<div class="manager-cap-drawer-panel"><div class="manager-cap-update-form"><label for="manager-cap-update-text">Add Update</label><textarea id="manager-cap-update-text" placeholder="Record a browser-local CAP update."></textarea><div role="alert">' + esc(ui.validationMessage) + '</div><button class="btn btn--primary btn--sm" data-act="manager-cap-add-update" data-id="' + esc(row.id) + '">Add Update</button></div><ol class="manager-cap-timeline">' + items + '</ol></div>';
}

function managerCapDocuments(row) {
  var docs = row.documents.map(function (filename) { return '<li><span>📄</span><div><b>' + esc(filename) + '</b><small>Selected filename only · no file storage</small></div></li>'; }).join('') || '<li class="is-empty">No document filenames are listed.</li>';
  return '<div class="manager-cap-drawer-panel"><ul class="manager-cap-documents">' + docs + '</ul></div>';
}

function managerCapHistory(row) {
  var history = row.history.slice().reverse().map(function (entry) { return '<li><time>' + esc(entry.at) + '</time><div><b>' + esc(entry.action) + '</b><small>' + esc(entry.actor) + '</small></div></li>'; }).join('') || '<li class="is-empty">No history is available.</li>';
  var notifications = row.notifications.slice().reverse().map(function (entry) { return '<li><time>' + esc(entry.at) + '</time><div><b>' + esc(entry.audience) + '</b><small>' + esc(entry.text) + '</small></div></li>'; }).join('') || '<li class="is-empty">No mock notifications are recorded.</li>';
  return '<div class="manager-cap-drawer-panel"><h3>CAP History</h3><ol class="manager-cap-timeline">' + history + '</ol><h3>Mock Notification History</h3><ol class="manager-cap-timeline">' + notifications + '</ol></div>';
}

function managerCapDrawer(row, ui) {
  var panel = ui.tab === 'action-plan' ? managerCapActionPlan(row) : (ui.tab === 'updates' ? managerCapUpdates(row, ui) : (ui.tab === 'documents' ? managerCapDocuments(row) : (ui.tab === 'history' ? managerCapHistory(row) : managerCapOverview(row))));
  return '<div class="manager-cap-drawer-backdrop" data-act="manager-cap-close"></div><aside class="manager-cap-drawer" aria-label="CAP Detail"><header><div><span>CAP Detail</span><h2>' + esc(row.id) + '</h2><p>' + esc(row.findingId + ' · ' + row.organization) + '</p></div><button data-act="manager-cap-close" aria-label="Close CAP detail">×</button></header>' + managerCapDrawerTabs(ui.tab) + panel + '</aside>';
}

function viewManagerCapMonitoring() {
  var ui = managerCapUiState();
  var allRows = managerCapRows(state, { status: 'all', department: 'all', inspection: 'all', due: 'all' });
  var rows = managerCapRows(state, ui);
  var selected = ui.selectedCapId ? managerCapById(state, ui.selectedCapId) : null;
  return pageHead('CAP Monitoring', 'Monitor corrective action owners, Due Dates, progress, updates, and expected evidence without closing Findings.') +
    '<section class="manager-cap-workspace">' + managerCapFilters(ui, allRows) + managerCapMetricCards(managerCapMetrics(rows)) + managerCapTable(rows) + managerCapSummaryPanels(rows) + '</section>' +
    (ui.drawerOpen && selected ? managerCapDrawer(selected, ui) : '');
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

var INSPECTOR_ASSIGNMENT_ROWS = [
  {
    id: 'PR-2026-018',
    auditId: 'AUD-2026-001',
    title: 'Cabin Inspection',
    code: 'PR-2026-018',
    organization: 'Fly Namibia',
    location: 'Fly Namibia aircraft cabin / on-site inspection',
    type: 'Cabin Safety',
    dates: '15 Jun 2026',
    status: 'in-progress',
    statusLabel: 'In Progress',
    progress: 10,
    questionsDone: 12,
    questionsTotal: 126,
    completedQuestions: 10,
    dueDate: '15 Jun 2026',
    dueNote: '(Today)',
    dueTone: 'warn',
    icon: 'plane',
    iconLabel: 'CI',
    sections: [
      { name: 'Galley', total: 21, done: 2 },
      { name: 'Lavatories', total: 20, done: 1 },
      { name: 'Passenger Seats', total: 21, done: 2 },
      { name: 'Emergency Equipment', total: 22, done: 4 },
      { name: 'Video + Crew Seat', total: 21, done: 1 },
      { name: 'Cockpit, Cabin Condition + Exits', total: 21, done: 2 }
    ]
  },
  {
    id: 'PR-2026-017',
    auditId: 'AUD-2026-001',
    title: 'Ramp Safety Inspection',
    code: 'PR-2026-017',
    organization: 'AirMove Ground',
    location: 'JFK International Airport',
    type: 'Safety',
    dates: '10 - 11 Jun 2026',
    status: 'in-progress',
    statusLabel: 'In Progress',
    progress: 30,
    questionsDone: 24,
    questionsTotal: 80,
    completedQuestions: 16,
    dueDate: '11 Jun 2026',
    dueNote: '(2 days left)',
    dueTone: 'warn',
    icon: 'vehicle',
    iconLabel: 'RS',
    sections: [
      { name: 'Ramp Operations', total: 12, done: 4 },
      { name: 'Ground Equipment', total: 10, done: 3 },
      { name: 'Apron Safety', total: 8, done: 2 }
    ]
  },
  {
    id: 'PR-2026-016',
    auditId: 'AUD-2026-006',
    title: 'SMS Audit',
    code: 'PR-2026-016',
    organization: 'BlueWings Airlines',
    location: 'Head Office',
    type: 'SMS',
    dates: '5 - 7 Jun 2026',
    status: 'in-progress',
    statusLabel: 'In Progress',
    progress: 75,
    questionsDone: 60,
    questionsTotal: 80,
    completedQuestions: 45,
    dueDate: '07 Jun 2026',
    dueNote: '(Overdue)',
    dueTone: 'danger',
    icon: 'checklist',
    iconLabel: 'SM',
    sections: [
      { name: 'Safety Policy', total: 10, done: 8 },
      { name: 'Risk Management', total: 12, done: 9 },
      { name: 'Safety Assurance', total: 10, done: 7 }
    ]
  },
  {
    id: 'PR-2026-015',
    auditId: 'AUD-2026-001',
    title: 'Dangerous Goods Inspection',
    code: 'PR-2026-015',
    organization: 'TransAir Cargo',
    location: 'Cargo Terminal 3',
    type: 'Cargo',
    dates: '2 - 3 Jun 2026',
    status: 'open',
    statusLabel: 'Open',
    progress: 0,
    questionsDone: 0,
    questionsTotal: 64,
    completedQuestions: 0,
    dueDate: '03 Jun 2026',
    dueNote: '(Overdue)',
    dueTone: 'danger',
    icon: 'box',
    iconLabel: 'DG',
    sections: []
  },
  {
    id: 'PR-2026-014',
    auditId: 'AUD-2026-005',
    title: 'Security Inspection',
    code: 'PR-2026-014',
    organization: 'JetFast Aviation',
    location: 'Terminal 2',
    type: 'Security',
    dates: '1 - 2 Jun 2026',
    status: 'in-progress',
    statusLabel: 'In Progress',
    progress: 10,
    questionsDone: 6,
    questionsTotal: 60,
    completedQuestions: 6,
    dueDate: '05 Jun 2026',
    dueNote: '(Overdue)',
    dueTone: 'danger',
    icon: 'shield',
    iconLabel: 'SE',
    sections: [
      { name: 'Terminal Access', total: 10, done: 2 },
      { name: 'Security Patrols', total: 8, done: 1 },
      { name: 'Records', total: 6, done: 1 }
    ]
  },
  {
    id: 'PR-2026-013',
    auditId: 'AUD-2026-005',
    title: 'Access Control Audit',
    code: 'PR-2026-013',
    organization: 'Global Handling',
    location: 'Operations Center',
    type: 'Security',
    dates: '20 - 21 May 2026',
    status: 'in-progress',
    statusLabel: 'In Progress',
    progress: 20,
    questionsDone: 16,
    questionsTotal: 80,
    completedQuestions: 8,
    dueDate: '21 May 2026',
    dueNote: '',
    dueTone: 'neutral',
    icon: 'users',
    iconLabel: 'AC',
    sections: [
      { name: 'Badging', total: 10, done: 2 },
      { name: 'Access Logs', total: 10, done: 2 },
      { name: 'Visitor Control', total: 8, done: 1 }
    ]
  },
  {
    id: 'PR-2026-012',
    auditId: 'AUD-2026-002',
    title: 'Baggage Handling Audit',
    code: 'PR-2026-012',
    organization: 'AirMove Ground',
    location: 'Baggage Terminal',
    type: 'Operations',
    dates: '18 - 19 May 2026',
    status: 'completed',
    statusLabel: 'Completed',
    progress: 100,
    questionsDone: 72,
    questionsTotal: 72,
    completedQuestions: 72,
    dueDate: '19 May 2026',
    dueNote: '',
    dueTone: 'neutral',
    icon: 'baggage',
    iconLabel: 'BH',
    sections: []
  },
  {
    id: 'PR-2026-011',
    auditId: 'AUD-2026-003',
    title: 'Training & Awareness Audit',
    code: 'PR-2026-011',
    organization: 'SkyCargo Air',
    location: 'Training Center',
    type: 'Training',
    dates: '15 - 16 May 2026',
    status: 'completed',
    statusLabel: 'Completed',
    progress: 100,
    questionsDone: 48,
    questionsTotal: 48,
    completedQuestions: 48,
    dueDate: '16 May 2026',
    dueNote: '',
    dueTone: 'neutral',
    icon: 'training',
    iconLabel: 'TR',
    sections: []
  }
];

function inspectorAssignmentsUiDefaults() {
  return {
    query: '',
    status: 'all',
    type: 'all',
    organization: 'all',
    dateRange: 'all',
    selectedAssignmentId: 'PR-2026-018',
    appliedAt: '',
    downloadedAt: ''
  };
}

function inspectorAssignmentsUiState() {
  if (!state.inspectorAssignmentsUi) state.inspectorAssignmentsUi = {};
  state.inspectorAssignmentsUi = Object.assign(inspectorAssignmentsUiDefaults(), state.inspectorAssignmentsUi || {});
  if (!state.inspectorAssignmentsUi.query) state.inspectorAssignmentsUi.query = '';
  if (!state.inspectorAssignmentsUi.status) state.inspectorAssignmentsUi.status = 'all';
  if (!state.inspectorAssignmentsUi.type) state.inspectorAssignmentsUi.type = 'all';
  if (!state.inspectorAssignmentsUi.organization) state.inspectorAssignmentsUi.organization = 'all';
  if (!state.inspectorAssignmentsUi.dateRange) state.inspectorAssignmentsUi.dateRange = 'all';
  if (!state.inspectorAssignmentsUi.selectedAssignmentId) state.inspectorAssignmentsUi.selectedAssignmentId = 'PR-2026-018';
  return state.inspectorAssignmentsUi;
}

function inspectorAssignmentById(id) {
  return INSPECTOR_ASSIGNMENT_ROWS.filter(function (row) { return row.id === id; })[0] || null;
}

function inspectorAssignmentStats() {
  var inProgressRows = INSPECTOR_ASSIGNMENT_ROWS.filter(function (row) { return row.status === 'in-progress'; });
  var questionsAssigned = inProgressRows.reduce(function (sum, row) { return sum + (Number(row.questionsTotal) || 0); }, 0);
  var questionsCompleted = inProgressRows.reduce(function (sum, row) { return sum + (Number(row.completedQuestions) || 0); }, 0);
  var questionsRemaining = Math.max(questionsAssigned - questionsCompleted, 0);
  var averageCompletion = questionsAssigned ? Math.round((questionsCompleted / questionsAssigned) * 100) : 0;
  return {
    open: 8,
    inProgress: inProgressRows.length,
    completed: 3,
    overdue: 1,
    totalAssigned: 17,
    questionsAssigned: questionsAssigned,
    questionsCompleted: questionsCompleted,
    questionsRemaining: questionsRemaining,
    averageCompletion: averageCompletion
  };
}

function inspectorAssignmentSelect(name, field, value, options) {
  return '<label class="inspector-assignment-filter"><span>' + esc(name) + '</span><select data-field="' + esc(field) + '">' +
    options.map(function (option) {
      return '<option value="' + esc(option[0]) + '"' + (value === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
    }).join('') +
  '</select></label>';
}

function inspectorAssignmentFilteredRows(ui) {
  var query = String(ui.query || '').trim().toLowerCase();
  return INSPECTOR_ASSIGNMENT_ROWS.filter(function (row) {
    if (ui.status === 'in-progress' && row.status !== 'in-progress') return false;
    if (ui.status === 'open' && row.status !== 'open') return false;
    if (ui.status === 'completed' && row.status !== 'completed') return false;
    if (ui.status === 'overdue' && row.dueTone !== 'danger') return false;
    if (ui.type !== 'all' && row.type !== ui.type) return false;
    if (ui.organization !== 'all' && row.organization !== ui.organization) return false;
    if (ui.dateRange === 'overdue' && row.dueTone !== 'danger') return false;
    if (ui.dateRange === 'this-week' && row.status === 'completed') return false;
    if (query) {
      var haystack = [row.title, row.code, row.organization, row.location, row.type, row.statusLabel].join(' ').toLowerCase();
      if (haystack.indexOf(query) === -1) return false;
    }
    return true;
  });
}

function inspectorAssignmentStatusBadge(row) {
  var tone = row.status === 'completed' ? 'ok' : (row.status === 'open' ? 'neutral' : 'info');
  return demoBadge(row.statusLabel, tone);
}

function inspectorAssignmentProgressHtml(row) {
  var value = Math.max(0, Math.min(100, Number(row.progress) || 0));
  var done = row.status === 'completed';
  return '<div class="inspector-assignment-progress">' +
    '<div class="inspector-assignment-progress__bar' + (done ? ' is-complete' : '') + '"><span style="width:' + value + '%"></span></div>' +
    '<b>' + value + '%</b>' +
  '</div>';
}

function inspectorAssignmentIcon(row) {
  return '<span class="inspector-assignment-tile inspector-assignment-tile--' + esc(row.icon || 'default') + '">' + esc(row.iconLabel || row.type.slice(0, 2)) + '</span>';
}

function inspectorAssignmentActionLabel(row) {
  if (row.status === 'completed') return 'View Report';
  if (row.status === 'open') return 'Start';
  return 'Continue';
}

function inspectorAssignmentRow(row) {
  return '<tr>' +
    '<td><div class="inspector-assignment-main">' + inspectorAssignmentIcon(row) +
      '<button class="inspector-assignment-link" data-act="inspector-assignment-select" data-id="' + esc(row.id) + '">' + esc(row.title) + '<span>' + esc(row.code) + '</span></button></div></td>' +
    '<td><b>' + esc(row.organization) + '</b><span>' + esc(row.location) + '</span></td>' +
    '<td><span class="inspector-assignment-type">' + esc(row.type) + '</span></td>' +
    '<td>' + esc(row.dates) + '</td>' +
    '<td>' + inspectorAssignmentStatusBadge(row) + '</td>' +
    '<td>' + inspectorAssignmentProgressHtml(row) + '</td>' +
    '<td class="inspector-assignment-due is-' + esc(row.dueTone) + '"><b>' + esc(row.dueDate) + '</b>' + (row.dueNote ? '<span>' + esc(row.dueNote) + '</span>' : '') + '</td>' +
    '<td><div class="inspector-assignment-actions">' +
      '<button class="btn btn--sm' + (row.status === 'completed' ? '' : ' btn--primary') + '" data-act="inspector-assignment-open" data-id="' + esc(row.id) + '">' + esc(inspectorAssignmentActionLabel(row)) + '</button>' +
      '<button class="iconbtn iconbtn--small" data-act="inspector-assignment-menu" data-id="' + esc(row.id) + '" aria-label="More actions for ' + esc(row.title) + '">&#8942;</button>' +
    '</div></td>' +
  '</tr>';
}

function inspectorAssignmentFilterBar(ui) {
  var typeOptions = [['all', 'All Types'], ['Cabin Safety', 'Cabin Safety'], ['AVSEC', 'AVSEC'], ['Safety', 'Safety'], ['SMS', 'SMS'], ['Cargo', 'Cargo'], ['Security', 'Security'], ['Operations', 'Operations'], ['Training', 'Training']];
  var orgOptions = [['all', 'All Organizations'], ['Fly Namibia', 'Fly Namibia'], ['SkyCargo Air', 'SkyCargo Air'], ['AirMove Ground', 'AirMove Ground'], ['BlueWings Airlines', 'BlueWings Airlines'], ['TransAir Cargo', 'TransAir Cargo'], ['JetFast Aviation', 'JetFast Aviation'], ['Global Handling', 'Global Handling']];
  return '<div class="inspector-assignment-filters responsive-filter-row">' +
    '<label class="inspector-assignment-filter inspector-assignment-filter--search"><span>Search audits</span><input type="search" data-field="inspector-assignment-query" value="' + esc(ui.query || '') + '" placeholder="Search audits..."><b aria-hidden="true">&#8981;</b></label>' +
    inspectorAssignmentSelect('Status', 'inspector-assignment-status', ui.status, [['all', 'All Status'], ['open', 'Open'], ['in-progress', 'In Progress'], ['completed', 'Completed'], ['overdue', 'Overdue']]) +
    inspectorAssignmentSelect('Type', 'inspector-assignment-type', ui.type, typeOptions) +
    inspectorAssignmentSelect('Organization', 'inspector-assignment-organization', ui.organization, orgOptions) +
    inspectorAssignmentSelect('Date', 'inspector-assignment-date', ui.dateRange, [['all', 'Date Range'], ['this-week', 'This Week'], ['overdue', 'Overdue']]) +
    '<button class="btn" data-act="inspector-assignment-apply"><span>&#9661;</span> Filters</button>' +
  '</div>';
}

function inspectorAssignmentKpi(label, value, sub, icon, status, tone, progress) {
  var active = inspectorAssignmentsUiState().status === status;
  return '<button class="inspector-assignment-kpi is-' + esc(tone || 'info') + (active ? ' is-active' : '') + '" data-act="inspector-assignment-filter" data-status="' + esc(status) + '">' +
    '<span class="inspector-assignment-kpi__icon">' + icon + '</span>' +
    '<span><b>' + esc(label) + '</b><strong>' + esc(value) + '</strong><em>' + esc(sub) + '</em>' +
      (progress !== undefined ? '<i><span style="width:' + esc(String(progress)) + '%"></span></i>' : '') +
    '</span>' +
  '</button>';
}

function inspectorAssignmentKpis(ui) {
  var stats = inspectorAssignmentStats();
  if (ui.status === 'in-progress') {
    var completedPct = stats.questionsAssigned ? Math.round((stats.questionsCompleted / stats.questionsAssigned) * 100) : 0;
    var remainingPct = stats.questionsAssigned ? Math.max(0, 100 - completedPct) : 0;
    return '<div class="inspector-assignment-kpis inspector-assignment-kpis--progress">' +
      inspectorAssignmentKpi('In Progress Assignments', String(stats.inProgress), 'Audits', '&#128203;', 'in-progress', 'info') +
      inspectorAssignmentKpi('Questions Assigned', String(stats.questionsAssigned), 'Total', '&#9716;', 'in-progress', 'warn') +
      inspectorAssignmentKpi('Completed', String(stats.questionsCompleted), '(' + completedPct + '%)', '&#10003;', 'completed', 'ok') +
      inspectorAssignmentKpi('Remaining', String(stats.questionsRemaining), '(' + remainingPct + '%)', '&#8987;', 'in-progress', 'purple') +
      inspectorAssignmentKpi('Avg. Completion', String(stats.averageCompletion) + '%', 'Across all audits', '&#128197;', 'in-progress', 'neutral', stats.averageCompletion) +
    '</div>';
  }
  return '<div class="inspector-assignment-kpis">' +
    inspectorAssignmentKpi('Open Assignments', String(stats.open), 'Audits', '&#128196;', 'all', 'info') +
    inspectorAssignmentKpi('In Progress', String(stats.inProgress), 'Audits', '&#9716;', 'in-progress', 'warn') +
    inspectorAssignmentKpi('Completed', String(stats.completed), 'Audits', '&#10003;', 'completed', 'ok') +
    inspectorAssignmentKpi('Overdue', String(stats.overdue), 'Audits', '&#128197;', 'overdue', 'danger') +
    inspectorAssignmentKpi('Total Assigned', String(stats.totalAssigned), 'Audits', '&#128452;', 'all', 'neutral') +
  '</div>';
}

function inspectorAssignmentHeader(ui) {
  var inProgress = ui.status === 'in-progress';
  return '<div class="page-head inspector-assignment-head">' +
    '<div class="page-head__main">' +
      '<h1>My Assignments' + (inProgress ? ' / <span>In Progress</span>' : '') + '</h1>' +
      '<div class="purpose">' + (inProgress ? 'Audits and tasks that are currently in progress.' : 'View and manage all audits and tasks assigned to you.') + '</div>' +
    '</div>' +
  '</div>';
}

function inspectorAssignmentTable(rows, ui) {
  if (!rows.length) return '<div class="inspector-assignment-panel"><div class="empty">No assignments match these filters.</div></div>';
  return '<div class="inspector-assignment-panel">' +
    '<div class="inspector-assignment-table-wrap"><table class="inspector-assignment-table"><thead><tr>' +
      '<th>Audit / Inspection</th><th>Organization</th><th>Type</th><th>Inspection Dates</th><th>Status</th><th>Progress</th><th>Due Date</th><th>Actions</th>' +
    '</tr></thead><tbody>' + rows.map(inspectorAssignmentRow).join('') + '</tbody></table></div>' +
    '<div class="inspector-assignment-table-foot">' +
      '<span>Showing 1 to ' + esc(String(rows.length)) + ' of ' + esc(String(rows.length)) + ' results</span>' +
      '<div class="inspector-assignment-pager"><button disabled>&lsaquo;</button><button disabled>&lsaquo;</button><button class="is-active">1</button><button disabled>&rsaquo;</button><button disabled>&rsaquo;</button></div>' +
      '<label><select><option>10 per page</option></select></label>' +
    '</div>' +
  '</div>';
}

function inspectorAssignmentSectionRow(section, assignmentId) {
  var pct = section.total ? Math.round((section.done / section.total) * 100) : 0;
  return '<button data-act="inspector-assignment-select" data-id="' + esc(assignmentId || 'PR-2026-018') + '">' +
    '<span>' + esc(section.name) + ' (' + esc(String(section.total)) + ' Questions)</span>' +
    '<i><b style="width:' + pct + '%"></b></i>' +
    '<em>' + esc(String(section.done)) + '/' + esc(String(section.total)) + ' (' + pct + '%)</em>' +
    '<strong>&rsaquo;</strong>' +
  '</button>';
}

function inspectorAssignmentDetailPanel(rows, ui) {
  var selected = inspectorAssignmentById(ui.selectedAssignmentId);
  if (!selected || selected.status !== 'in-progress') selected = rows[0] || inspectorAssignmentById('PR-2026-018');
  if (!selected) return '';
  var completed = Number(selected.completedQuestions) || Math.round((selected.progress * selected.questionsTotal) / 100);
  var inProgress = Math.max(selected.questionsDone - completed, 0);
  var notStarted = Math.max(selected.questionsTotal - selected.questionsDone, 0);
  var sections = selected.sections && selected.sections.length ? selected.sections : INSPECTOR_ASSIGNMENT_ROWS[0].sections;
  return '<div class="inspector-assignment-detail">' +
    '<section class="inspector-assignment-detail-card inspector-assignment-detail-card--summary">' +
      '<div class="inspector-assignment-detail-title">' + inspectorAssignmentIcon(selected) +
        '<div><h2>' + esc(selected.title) + '</h2><span>' + esc(selected.code) + '</span></div>' +
        inspectorAssignmentStatusBadge(selected) +
      '</div>' +
      '<dl><dt>Organization</dt><dd>' + esc(selected.organization) + '</dd><dt>Location</dt><dd>' + esc(selected.location) + '</dd><dt>Inspection Dates</dt><dd>' + esc(selected.dates) + '</dd><dt>Lead Inspector</dt><dd>John Lead Inspector</dd></dl>' +
      '<button class="btn" data-act="nav" data-view="audit-detail" data-id="' + esc(selected.auditId) + '">View Audit Details</button>' +
    '</section>' +
    '<section class="inspector-assignment-detail-card inspector-assignment-progress-card">' +
      '<h2>My Progress</h2>' +
      '<div class="inspector-assignment-donut" style="--value:' + esc(String(selected.progress)) + '"><b>' + esc(String(selected.progress)) + '%</b><span>' + esc(String(selected.questionsDone)) + ' / ' + esc(String(selected.questionsTotal)) + '</span></div>' +
      '<div class="inspector-assignment-legend">' +
        '<span><i class="is-ok"></i>Completed <b>' + esc(String(completed)) + ' (' + Math.round((completed / selected.questionsTotal) * 100) + '%)</b></span>' +
        '<span><i class="is-info"></i>In Progress <b>' + esc(String(inProgress)) + ' (' + Math.round((inProgress / selected.questionsTotal) * 100) + '%)</b></span>' +
        '<span><i class="is-warn"></i>Not Started <b>' + esc(String(notStarted)) + ' (' + Math.round((notStarted / selected.questionsTotal) * 100) + '%)</b></span>' +
      '</div>' +
    '</section>' +
    '<section class="inspector-assignment-detail-card inspector-assignment-sections">' +
      '<div class="inspector-assignment-section-head"><h2>Sections Overview</h2><button data-act="inspector-assignment-select" data-id="' + esc(selected.id) + '">View All Questions</button></div>' +
      '<div class="inspector-assignment-section-list">' + sections.map(function (section) { return inspectorAssignmentSectionRow(section, selected.id); }).join('') + '</div>' +
      '<div class="inspector-assignment-detail-actions">' +
        '<button class="btn" data-act="inspector-assignment-download"><span>&#8681;</span> Download Assignment</button>' +
        '<button class="btn btn--primary" data-act="inspector-assignment-open" data-id="' + esc(selected.id) + '"><span>&#8618;</span> Continue Working</button>' +
      '</div>' +
    '</section>' +
  '</div>';
}

function inspectorNextAssignmentDossier(rows, ui) {
  var source = INSPECTOR_ASSIGNMENT_ROWS.filter(function (row) { return row.status !== 'completed'; });
  var selected = inspectorAssignmentById(ui.selectedAssignmentId) || rows[0] || source[0] || inspectorAssignmentById('PR-2026-018');
  if (!selected) return '';
  var completed = Number(selected.completedQuestions) || Math.round((selected.progress * selected.questionsTotal) / 100);
  var remaining = Math.max((selected.questionsTotal || 0) - completed, 0);
  return '<section class="inspector-next-dossier">' +
    '<div class="inspector-next-dossier__main">' +
      '<div class="workbench-command__eyebrow">Next inspection</div>' +
      '<h2>' + esc(selected.title) + '</h2>' +
      '<p>' + esc(selected.organization) + ' · ' + esc(selected.type) + ' · ' + esc(selected.location) + '</p>' +
      '<div class="inspector-next-dossier__meta">' +
        commandMetric('Current owner', 'CAA Inspector', 'info') +
        commandMetric('Next action', inspectorAssignmentActionLabel(selected), selected.status === 'overdue' ? 'danger' : 'warn') +
        commandMetric('Due Date', selected.dueDate + (selected.dueNote ? ' · ' + selected.dueNote : ''), selected.dueTone || 'neutral') +
        commandMetric('Remaining questions', String(remaining), remaining ? 'warn' : 'ok') +
      '</div>' +
    '</div>' +
    '<div class="inspector-next-dossier__progress">' +
      '<div class="inspector-assignment-donut" style="--value:' + esc(String(selected.progress)) + '"><b>' + esc(String(selected.progress)) + '%</b><span>' + esc(String(completed)) + ' / ' + esc(String(selected.questionsTotal)) + '</span></div>' +
      '<button class="btn btn--primary" data-act="inspector-assignment-open" data-id="' + esc(selected.id) + '">Continue Work</button>' +
      '<button class="btn" data-act="nav" data-view="audit-detail" data-id="' + esc(selected.auditId) + '">Open audit dossier</button>' +
    '</div>' +
  '</section>';
}

function viewInspectorAssignments() {
  var ui = inspectorAssignmentsUiState();
  if (state.params && state.params.filter === 'checklists' && ui.status === 'all') ui.status = 'in-progress';
  var rows = inspectorAssignmentFilteredRows(ui);
  return '<div class="inspector-assignment-page">' +
    inspectorAssignmentHeader(ui) +
    inspectorNextAssignmentDossier(rows, ui) +
    inspectorAssignmentKpis(ui) +
    inspectorAssignmentFilterBar(ui) +
    inspectorAssignmentTable(rows, ui) +
    (ui.status === 'in-progress' ? inspectorAssignmentDetailPanel(rows, ui) : '') +
  '</div>';
}

function viewInspectorDashboard() {
  return viewInspectorAssignments();
}

/* =========================== Inspector CAP reviews =========================== */
function capReviewUiState() {
  var fallback = {
    expandedId: 'F-014-02',
    tab: 'cap',
    status: 'all',
    due: 'all',
    organization: 'all',
    level: 'all',
    query: '',
    selectedProviderId: 'skycargo-air',
    decision: '',
    comment: '',
    filtersOpen: true,
    findingTabChosen: false,
    findingDecisions: {}
  };
  state.capReviewUi = Object.assign(fallback, state.capReviewUi || {});
  if (['details', 'cap', 'conversation', 'files', 'history', 'evidence'].indexOf(state.capReviewUi.tab) === -1) state.capReviewUi.tab = 'cap';
  if (state.capReviewUi.tab === 'evidence') state.capReviewUi.tab = 'files';
  if (state.capReviewUi.tab === 'details' && !state.capReviewUi.findingTabChosen) state.capReviewUi.tab = 'cap';
  if (!state.capReviewUi.selectedProviderId) state.capReviewUi.selectedProviderId = 'skycargo-air';
  if (!state.capReviewUi.findingDecisions || typeof state.capReviewUi.findingDecisions !== 'object') state.capReviewUi.findingDecisions = {};
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

function capReviewExpandedPanel(finding, ui) {
  var status = capReviewStatusMeta(finding);
  var activeTab = ui.tab || 'details';
  var tabBody = activeTab === 'evidence'
    ? capReviewEvidenceTab(finding)
    : (activeTab === 'history' ? capReviewHistoryTab(finding) : capReviewDetailsTab(finding, ui));
  function tabButton(key, label) {
    return '<button class="cap-review-tab' + (activeTab === key ? ' is-active' : '') + '" data-act="cap-review-tab" data-id="' + esc(finding.id) + '" data-tab="' + esc(key) + '">' + esc(label) + '</button>';
  }
  return '<section class="cap-review-expanded" aria-label="Selected CAP review details">' +
    '<div class="cap-review-expanded__head">' +
      '<h3>Finding: ' + esc(capReviewFindingDisplayId(finding)) + ' - ' + esc(finding.title) + '</h3>' +
      '<span>Submitted on: ' + esc(fmtDate(finding.cap && finding.cap.submittedDate)) + '</span>' +
    '</div>' +
    '<div class="cap-review-tabs">' + tabButton('details', 'CAP Details') + tabButton('evidence', 'Evidence') + tabButton('history', 'History') + '</div>' +
    '<div class="cap-review-tab-content is-' + esc(status.key) + '">' + tabBody + '</div>' +
  '</section>';
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
        '<button class="btn btn--sm" data-act="nav" data-view="cap-review-detail" data-id="' + esc(finding.id) + '">Review</button>' +
        '<button class="icon-btn" data-act="cap-review-row" data-id="' + esc(finding.id) + '" aria-label="Toggle CAP details">' + esc(chevron) + '</button>' +
      '</div></td>' +
    '</tr>';
    return row;
  }).join('');
}

function inspectorCapReviewProviders() {
  return [
    { id: 'skycargo-air', icon: 'AIR', name: 'SkyCargo Air', role: 'Service Provider', status: 'submitted', findings: 9, caps: 9, submittedOn: '27 Jun 2026 09:15' },
    { id: 'skycargo-ground', icon: 'GND', name: 'SkyCargo Ground Handling Ltd.', role: 'Ground Handler', status: 'submitted', findings: 5, caps: 5, submittedOn: '27 Jun 2026 09:15' },
    { id: 'skyfuel', icon: 'FUEL', name: 'SkyFuel Services', role: 'Fuel Services', status: 'submitted', findings: 3, caps: 3, submittedOn: '27 Jun 2026 09:15' },
    { id: 'skysecurity', icon: 'SEC', name: 'SkySecurity Services', role: 'Security Services', status: 'submitted', findings: 4, caps: 4, submittedOn: '27 Jun 2026 09:15' },
    { id: 'skycatering', icon: 'CAT', name: 'SkyCatering Ltd.', role: 'Catering Provider', status: 'pending', findings: 2, caps: 0, submittedOn: '-' }
  ];
}

function inspectorCapReviewProviderById(id) {
  var providers = inspectorCapReviewProviders();
  for (var i = 0; i < providers.length; i++) {
    if (providers[i].id === id) return providers[i];
  }
  return providers[0];
}

function inspectorCapReviewRowsForProvider(providerId) {
  var skyCargoRows = [
    { id: 'F-014-01', detailId: 'F-014-01', title: 'Access control to restricted areas', checklist: 'Access Control', level: 'Level 1', levelKey: 'l1', levelLabel: 'Level 1 (Critical)', due: '2026-06-30', dueDateText: '30 Jun 2026', dueRule: '14 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-04', detailId: 'F-014-04', title: 'Screening procedure compliance', checklist: 'Screening', level: 'Level 1', levelKey: 'l1', levelLabel: 'Level 1 (Critical)', due: '2026-06-30', dueDateText: '30 Jun 2026', dueRule: '14 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-02', detailId: 'F-014-02', title: 'Staff training records', checklist: 'Training', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-03', detailId: 'F-014-03', title: 'Vehicle security inspection', checklist: 'Ground Handling', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-07', detailId: 'F-014-07', title: 'Emergency exit signage', checklist: 'Safety Signage', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-05', detailId: 'F-014-05', title: 'Signage and awareness', checklist: 'Security Awareness', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-06', detailId: 'F-014-06', title: 'Tarmac safety cones availability', checklist: 'Ramp Safety', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-08', detailId: 'F-014-08', title: 'Wildlife control program', checklist: 'Wildlife Hazard', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
    { id: 'F-014-09', detailId: 'F-014-09', title: 'Housekeeping in operational areas', checklist: 'Operations', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' }
  ];
  var providerRows = {
    'skycargo-air': skyCargoRows,
    'skycargo-ground': [
      { id: 'F-GND-01', detailId: 'F-GND-01', title: 'Ground handling training records incomplete', checklist: 'Ground Handling', level: 'Level 1', levelKey: 'l1', levelLabel: 'Level 1 (Critical)', due: '2026-06-30', dueDateText: '30 Jun 2026', dueRule: '14 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-GND-02', detailId: 'F-GND-02', title: 'Baggage reconciliation evidence missing', checklist: 'Security', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-GND-03', detailId: 'F-GND-03', title: 'Vehicle access logs not retained', checklist: 'Access Control', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-GND-04', detailId: 'F-GND-04', title: 'Ramp escort process not consistently documented', checklist: 'Ramp Safety', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-GND-05', detailId: 'F-GND-05', title: 'Shift briefing records need standardization', checklist: 'Operations', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' }
    ],
    skyfuel: [
      { id: 'F-FUEL-01', detailId: 'F-FUEL-01', title: 'Fuel quality sampling records incomplete', checklist: 'Fuel Quality', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-FUEL-02', detailId: 'F-FUEL-02', title: 'Spill response drill evidence missing', checklist: 'Emergency Response', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-FUEL-03', detailId: 'F-FUEL-03', title: 'Fuel truck inspection labels unclear', checklist: 'Equipment', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' }
    ],
    skysecurity: [
      { id: 'F-SEC-01', detailId: 'F-SEC-01', title: 'Security patrol records incomplete', checklist: 'Security Patrol', level: 'Level 1', levelKey: 'l1', levelLabel: 'Level 1 (Critical)', due: '2026-06-30', dueDateText: '30 Jun 2026', dueRule: '14 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-SEC-02', detailId: 'F-SEC-02', title: 'CCTV retention validation not evidenced', checklist: 'Surveillance', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-SEC-03', detailId: 'F-SEC-03', title: 'Access control badge reconciliation delayed', checklist: 'Access Control', level: 'Level 2', levelKey: 'l2', levelLabel: 'Level 2 (Major)', due: '2026-09-14', dueDateText: '14 Sep 2026', dueRule: '90 days', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' },
      { id: 'F-SEC-04', detailId: 'F-SEC-04', title: 'Visitor log countersignature missing', checklist: 'Visitor Control', level: 'Level 3', levelKey: 'l3', levelLabel: 'Level 3 (Observation)', due: '', dueDateText: 'Observation', dueRule: 'Observation / No due date', submittedOn: '27 Jun 2026 09:15', statusKey: 'pending_review', statusLabel: 'Pending Review', statusTone: 'info' }
    ],
    skycatering: []
  };
  return providerRows[providerId] || skyCargoRows;
}

function inspectorCapReviewRowById(id) {
  var verificationRows = typeof inspectorCapVerificationRows === 'function' ? inspectorCapVerificationRows() : [];
  for (var v = 0; v < verificationRows.length; v++) {
    if (verificationRows[v].id === id || verificationRows[v].detailId === id) return verificationRows[v];
  }
  var providers = inspectorCapReviewProviders();
  for (var i = 0; i < providers.length; i++) {
    var rows = inspectorCapReviewRowsForProvider(providers[i].id);
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].id === id || rows[j].detailId === id) return rows[j];
    }
  }
  return null;
}

function inspectorCapReviewFilteredRows(rows, ui) {
  var query = (ui.query || '').toLowerCase().trim();
  var status = ui.status || 'all';
  if (status === 'pending') status = 'pending_review';
  return rows.filter(function (row) {
    if (status !== 'all' && row.statusKey !== status) return false;
    if (!query) return true;
    return [row.id, row.title, row.checklist, row.levelLabel, row.statusLabel].join(' ').toLowerCase().indexOf(query) !== -1;
  });
}

function inspectorCapVerificationRows() {
  var base = [
    { id: 'F-014-01', detailId: 'F-014-01', title: 'Perimeter Fence Security', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Access Control', levelKey: 'l1', levelLabel: 'Level 1', statusKey: 'waiting_cap', statusLabel: 'Waiting for CAP', statusTone: 'warn', dueDateText: '14 Jul 2026', dueRule: '3 days left', dueKey: 'due7', owner: 'John Doe', submittedOn: '-', description: 'Perimeter fence is damaged in the east section allowing unauthorized access.', reference: 'ICAO Annex 17 - 4.2.3.8', location: 'East Perimeter' },
    { id: 'F-014-02', detailId: 'F-014-02', title: 'Access Control System', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Access Control', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '20 Jul 2026', dueRule: '9 days left', dueKey: 'later', owner: 'John Doe', submittedOn: '17 Jun 2026', description: 'Access control software did not enforce password policy and badge exception review was not consistently completed.', reference: 'ICAO Annex 17 - 4.2.3.8', location: 'Main Cargo Gate' },
    { id: 'F-014-03', detailId: 'F-014-03', title: 'CCTV Coverage Gaps', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Surveillance', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'returned', statusLabel: 'Returned', statusTone: 'danger', dueDateText: '25 Jul 2026', dueRule: '14 days left', dueKey: 'later', owner: 'John Doe', submittedOn: '18 Jun 2026', description: 'CCTV coverage map does not prove that blind spots near the cargo gate are monitored.', reference: 'Security Program 6.4', location: 'Cargo Gate' },
    { id: 'F-014-04', detailId: 'F-014-04', title: 'Security Training Records', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Training', levelKey: 'l3', levelLabel: 'Level 3', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '28 Jul 2026', dueRule: '17 days left', dueKey: 'later', owner: 'John Doe', submittedOn: '19 Jun 2026', description: 'Training records are not consistently attached for all access control personnel.', reference: 'Training Manual 2.1', location: 'Security Office' },
    { id: 'F-014-05', detailId: 'F-014-05', title: 'Vehicle Access Procedures', organization: 'SkyCargo Ground Handling Ltd.', orgKey: 'skycargo-ground', checklist: 'Access Control', levelKey: 'l1', levelLabel: 'Level 1', statusKey: 'waiting_cap', statusLabel: 'Waiting for CAP', statusTone: 'warn', dueDateText: '30 Jul 2026', dueRule: '19 days left', dueKey: 'later', owner: 'Sarah K.', submittedOn: '-', description: 'Vehicle access procedure is not consistently enforced for contractor vehicles.', reference: 'Airport Security Program 5.7', location: 'Vehicle Gate' },
    { id: 'F-014-06', detailId: 'F-014-06', title: 'ID Card Management', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Access Control', levelKey: 'l3', levelLabel: 'Level 3', statusKey: 'closed', statusLabel: 'Closed', statusTone: 'neutral', dueDateText: '10 Jul 2026', dueRule: 'closed', dueKey: 'no_due', owner: 'John Doe', submittedOn: '16 Jun 2026', description: 'Temporary ID card register required cleanup. Corrective evidence has been reviewed and accepted.', reference: 'Access Control SOP 3.2', location: 'Admin Office' },
    { id: 'F-014-07', detailId: 'F-014-07', title: 'Lighting Adequacy', organization: 'SkyCargo Air', orgKey: 'skycargo-air', checklist: 'Surveillance', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'returned', statusLabel: 'Returned', statusTone: 'danger', dueDateText: '16 Jul 2026', dueRule: '5 days left', dueKey: 'due7', owner: 'John Doe', submittedOn: '20 Jun 2026', description: 'Night inspection evidence did not demonstrate adequate perimeter lighting.', reference: 'Physical Security 4.8', location: 'East Apron' },
    { id: 'F-014-08', detailId: 'F-014-08', title: 'Guard Patrol Frequency', organization: 'SkySecurity Services', orgKey: 'skysecurity', checklist: 'Security Patrol', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '30 Jul 2026', dueRule: '19 days left', dueKey: 'later', owner: 'David L.', submittedOn: '19 Jun 2026', description: 'Patrol log frequency did not match the approved patrol schedule.', reference: 'Patrol Procedure 7.1', location: 'Cargo Apron' },
    { id: 'F-014-09', detailId: 'F-014-09', title: 'Visitor Access Logs', organization: 'SkySecurity Services', orgKey: 'skysecurity', checklist: 'Visitor Control', levelKey: 'l3', levelLabel: 'Level 3', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '31 Jul 2026', dueRule: '20 days left', dueKey: 'later', owner: 'David L.', submittedOn: '19 Jun 2026', description: 'Visitor access logs did not consistently include escort signatures.', reference: 'Visitor Control 2.4', location: 'Reception' },
    { id: 'F-014-10', detailId: 'F-014-10', title: 'Fuel Storage Area Security', organization: 'SkyFuel Services', orgKey: 'skyfuel', checklist: 'Fuel Security', levelKey: 'l1', levelLabel: 'Level 1', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '30 Jul 2026', dueRule: '19 days left', dueKey: 'later', owner: 'Michael T.', submittedOn: '19 Jun 2026', description: 'Fuel storage area access evidence was incomplete for two sample dates.', reference: 'Fuel Security 6.1', location: 'Fuel Farm' },
    { id: 'F-014-11', detailId: 'F-014-11', title: 'Spill Response Equipment', organization: 'SkyFuel Services', orgKey: 'skyfuel', checklist: 'Emergency Response', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'cap_submitted', statusLabel: 'CAP Submitted', statusTone: 'ok', dueDateText: '2 Aug 2026', dueRule: '22 days left', dueKey: 'later', owner: 'Michael T.', submittedOn: '20 Jun 2026', description: 'Spill response equipment inspection records were incomplete.', reference: 'Emergency Response 8.2', location: 'Fuel Farm' },
    { id: 'F-014-12', detailId: 'F-014-12', title: 'Cold Chain Monitoring', organization: 'SkyCatering Ltd.', orgKey: 'skycatering', checklist: 'Catering', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'waiting_cap', statusLabel: 'Waiting for CAP', statusTone: 'warn', dueDateText: '5 Aug 2026', dueRule: '25 days left', dueKey: 'later', owner: 'Emma R.', submittedOn: '-', description: 'Cold chain temperature records were not complete for two inspected routes.', reference: 'Catering Quality 3.5', location: 'Catering Store' },
    { id: 'F-014-13', detailId: 'F-014-13', title: 'Emergency Communication', organization: 'SkySecurity Services', orgKey: 'skysecurity', checklist: 'Emergency Preparedness', levelKey: 'l3', levelLabel: 'Level 3', statusKey: 'closed', statusLabel: 'Closed', statusTone: 'neutral', dueDateText: '9 Jul 2026', dueRule: 'closed', dueKey: 'no_due', owner: 'David L.', submittedOn: '17 Jun 2026', description: 'Emergency communication contact list needed update. Evidence accepted.', reference: 'ERP 1.4', location: 'Security Control Room' },
    { id: 'F-014-14', detailId: 'F-014-14', title: 'Food Safety Training', organization: 'SkyCatering Ltd.', orgKey: 'skycatering', checklist: 'Training', levelKey: 'l2', levelLabel: 'Level 2', statusKey: 'closed', statusLabel: 'Closed', statusTone: 'neutral', dueDateText: '10 Jul 2026', dueRule: 'closed', dueKey: 'no_due', owner: 'Emma R.', submittedOn: '18 Jun 2026', description: 'Food safety refresher training matrix was corrected and accepted.', reference: 'Catering Training 2.2', location: 'Catering Office' }
  ];
  var generated = (state.findings || []).filter(function (finding) {
    return /^SMS-2026-/.test(finding.id);
  }).map(function (finding) {
    return {
      id: finding.id,
      detailId: finding.id,
      title: finding.title,
      organization: orgName(finding.orgId),
      orgKey: 'skycargo-air',
      checklist: finding.reference || 'Checklist',
      levelKey: finding.severity === 1 ? 'l1' : (finding.severity === 2 ? 'l2' : 'l3'),
      levelLabel: finding.severity === 1 ? 'Level 1' : (finding.severity === 2 ? 'Level 2' : 'Level 3'),
      statusKey: 'waiting_cap',
      statusLabel: 'Waiting for CAP',
      statusTone: 'warn',
      dueDateText: fmtDate(finding.dueDate),
      dueRule: 'CAP required',
      dueKey: 'later',
      owner: finding.responsiblePerson || 'Service Provider CAP Owner',
      submittedOn: '-',
      description: finding.description,
      reference: finding.reference,
      location: 'SMS Oversight Audit'
    };
  });
  return base.concat(generated);
}

function inspectorCapVerificationNormalizedStatus(status) {
  if (status === 'pending' || status === 'waiting') return 'waiting_cap';
  if (status === 'verified' || status === 'accepted' || status === 'cap') return 'cap_submitted';
  if (status === 'not_due' || status === 'all_verified') return 'closed';
  if (status === 'revision_requested' || status === 'rejected') return 'returned';
  return status || 'all';
}

function inspectorCapVerificationCounts(rows) {
  var counts = { all: rows.length, waiting_cap: 0, cap_submitted: 0, returned: 0, closed: 0, l1: 0, l2: 0, l3: 0, due7: 0, overdue: 0 };
  rows.forEach(function (row) {
    counts[row.statusKey] = (counts[row.statusKey] || 0) + 1;
    counts[row.levelKey] = (counts[row.levelKey] || 0) + 1;
    if (row.dueKey === 'due7') counts.due7++;
    if (row.dueKey === 'overdue') counts.overdue++;
  });
  return counts;
}

function inspectorCapVerificationFilteredRows(ui) {
  var query = (ui.query || '').toLowerCase().trim();
  var status = inspectorCapVerificationNormalizedStatus(ui.status || 'all');
  return inspectorCapVerificationRows().filter(function (row) {
    if (status === 'all_verified') {
      if (row.statusKey !== 'verified' && row.statusKey !== 'not_due') return false;
    } else if (status !== 'all' && row.statusKey !== status) {
      return false;
    }
    if (ui.organization && ui.organization !== 'all' && row.orgKey !== ui.organization) return false;
    if (ui.level && ui.level !== 'all' && row.levelKey !== ui.level) return false;
    if (ui.due && ui.due !== 'all' && row.dueKey !== ui.due) return false;
    if (!query) return true;
    return [row.id, row.title, row.organization, row.checklist, row.owner, row.levelLabel, row.statusLabel].join(' ').toLowerCase().indexOf(query) !== -1;
  });
}

function inspectorCapVerificationSelectOptions(options, selected) {
  return options.map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + (option[0] === selected ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
}

function inspectorCapVerificationTabs(ui, counts) {
  var active = inspectorCapVerificationNormalizedStatus(ui.status || 'all');
  var tabs = [
    ['all', 'All Findings', counts.all, 'neutral', '▤'],
    ['waiting_cap', 'Waiting for CAP', counts.waiting_cap, 'warn', '⌛'],
    ['cap_submitted', 'CAP Submitted', counts.cap_submitted, 'ok', '➤'],
    ['returned', 'Returned', counts.returned, 'danger', '↩'],
    ['closed', 'Closed', counts.closed, 'info', '✓']
  ];
  return '<div class="finding-stat-grid">' + tabs.map(function (tab) {
    return '<button class="finding-stat-card is-' + esc(tab[3]) + (active === tab[0] ? ' is-active' : '') + '" data-act="cap-review-filter" data-status="' + esc(tab[0]) + '">' +
      '<span class="finding-stat-card__icon">' + esc(tab[4]) + '</span><span><b>' + esc(tab[1]) + '</b><strong>' + esc(String(tab[2])) + '</strong></span>' +
    '</button>';
  }).join('') + '</div>';
}

function inspectorCapVerificationFilters(ui) {
  var levelOptions = inspectorCapVerificationSelectOptions([
    ['all', 'All Levels'],
    ['l1', 'Level 1'],
    ['l2', 'Level 2'],
    ['l3', 'Level 3']
  ], ui.level || 'all');
  var statusOptions = inspectorCapVerificationSelectOptions([
    ['all', 'All Statuses'],
    ['waiting_cap', 'Waiting for CAP'],
    ['cap_submitted', 'CAP Submitted'],
    ['returned', 'Returned'],
    ['closed', 'Closed']
  ], inspectorCapVerificationNormalizedStatus(ui.status || 'all'));
  var dueOptions = inspectorCapVerificationSelectOptions([
    ['all', 'All Due Dates'],
    ['due7', 'Due in 7 Days'],
    ['later', 'Later'],
    ['no_due', 'Closed / No Due Date']
  ], ui.due || 'all');
  return '<div class="finding-filter-row responsive-filter-row">' +
    '<label class="finding-search"><span class="sr-only">Search findings</span><input id="cap-review-search" type="search" data-field="cap-review-search" value="' + esc(ui.query || '') + '" placeholder="Search by ID, title, or keyword..."><button class="icon-btn" data-act="cap-review-apply-filters" aria-label="Search findings">⌕</button></label>' +
    '<label><span>CAP Level</span><select data-field="cap-review-level">' + levelOptions + '</select></label>' +
    '<label><span>CAP Status</span><select data-field="cap-review-status">' + statusOptions + '</select></label>' +
    '<label><span>Due Date</span><select data-field="cap-review-due">' + dueOptions + '</select></label>' +
    '<button class="btn btn--sm" data-act="cap-review-clear">Reset</button>' +
  '</div>';
}

function inspectorFindingRowsHtml(rows, selectedId) {
  if (!rows.length) {
    return '<tr><td colspan="6"><div class="empty">No findings match these filters.</div></td></tr>';
  }
  return rows.map(function (row) {
    return '<tr class="finding-list-row' + (row.id === selectedId ? ' is-selected' : '') + '" data-act="cap-review-row" data-id="' + esc(row.id) + '">' +
      '<td><button class="prelim-report-link" data-act="cap-review-row" data-id="' + esc(row.id) + '">' + esc(row.id) + '</button></td>' +
      '<td><b>' + esc(row.title) + '</b><span class="question-title">' + esc(row.checklist) + '</span></td>' +
      '<td><span class="sp-level is-' + esc(row.levelKey) + '">' + esc(row.levelLabel) + '</span></td>' +
      '<td>' + demoBadge(row.statusLabel, row.statusTone) + '</td>' +
      '<td><b' + (row.dueKey === 'due7' ? ' class="is-danger"' : '') + '>' + esc(row.dueDateText) + '</b><span>' + esc(row.dueRule) + '</span></td>' +
      '<td><button class="icon-btn" data-act="cap-review-row" data-id="' + esc(row.id) + '" aria-label="Open finding">›</button></td>' +
    '</tr>';
  }).join('');
}

function inspectorFindingTable(rows, selectedId) {
  return '<section class="finding-list-panel">' +
    '<div class="finding-list-table-wrap responsive-table-shell"><table class="finding-list-table"><thead><tr>' +
      '<th>Finding ID</th><th>Title</th><th>CAP Level</th><th>Status</th><th>Due Date</th><th></th>' +
    '</tr></thead><tbody>' + inspectorFindingRowsHtml(rows, selectedId) + '</tbody></table></div>' +
    '<div class="finding-pagination"><span>Showing 1 to ' + esc(String(Math.min(rows.length, 7))) + ' of ' + esc(String(rows.length)) + ' findings</span><div><button class="icon-btn" disabled>‹</button><button class="finding-page-btn is-active" disabled>1</button><button class="finding-page-btn" disabled>2</button><button class="finding-page-btn" disabled>3</button><button class="icon-btn" disabled>›</button></div></div>' +
  '</section>';
}

function inspectorFindingQueueRowsHtml(rows, selectedId) {
  if (!rows.length) {
    return '<div class="empty">No findings match these filters.</div>';
  }
  return rows.map(function (row) {
    var selected = row.id === selectedId;
    return '<button class="finding-queue-item' + (selected ? ' is-selected' : '') + '" data-act="cap-review-row" data-id="' + esc(row.id) + '"' + (selected ? ' aria-current="true"' : '') + ' aria-label="Open finding ' + esc(row.id) + '">' +
      '<span class="finding-queue-item__top"><b>' + esc(row.id) + '</b>' + demoBadge(row.statusLabel, row.statusTone) + '</span>' +
      '<strong>' + esc(row.title) + '</strong>' +
      '<span class="finding-queue-item__meta">' + esc(row.checklist) + ' · ' + esc(row.levelLabel) + '</span>' +
      '<span class="finding-queue-item__due"><em' + (row.dueKey === 'due7' ? ' class="is-danger"' : '') + '>' + esc(row.dueDateText) + '</em><small>' + esc(row.dueRule) + '</small></span>' +
    '</button>';
  }).join('');
}

function inspectorFindingQueue(rows, selectedId) {
  return '<section class="finding-queue-panel">' +
    '<div class="finding-queue-head"><h2>Finding Queue</h2><span>' + esc(String(rows.length)) + ' findings</span></div>' +
    '<div class="finding-queue-list">' + inspectorFindingQueueRowsHtml(rows, selectedId) + '</div>' +
  '</section>';
}

function inspectorFindingEvidenceStrip(row) {
  var labels = row.statusKey === 'waiting_cap' ? ['Photo', 'Log', 'Note'] : ['CAP', 'Photo', 'Record'];
  return '<div class="finding-evidence-strip">' + labels.map(function (label, index) {
    return '<button class="finding-evidence-thumb is-' + esc(String(index + 1)) + '" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="' + esc(row.id + '_' + label + '.pdf') + '"><span>' + esc(label) + '</span></button>';
  }).join('') + '<button class="finding-evidence-more" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="Additional evidence">+2</button></div>';
}

function inspectorFindingTimeline(row) {
  var steps = [
    ['done', 'Finding Issued', '15 Jun 2026 10:30', 'Finding has been raised.'],
    [row.statusKey === 'waiting_cap' ? 'active' : 'done', 'Waiting for CAP', 'Service provider to submit CAP for this finding.', ''],
    [row.statusKey === 'cap_submitted' ? 'active' : (row.statusKey === 'returned' || row.statusKey === 'closed' ? 'done' : 'waiting'), 'CAP Submitted', row.submittedOn || '-', ''],
    [row.statusKey === 'returned' ? 'active' : (row.statusKey === 'closed' ? 'done' : 'waiting'), 'Returned', row.statusKey === 'returned' ? 'Revision requested.' : '-', ''],
    [row.statusKey === 'closed' ? 'done' : 'waiting', 'Closed', row.statusKey === 'closed' ? 'Finding closed.' : '-', '']
  ];
  return '<div class="finding-timeline">' + steps.map(function (step) {
    return '<div class="finding-timeline-step is-' + esc(step[0]) + '"><span></span><p><b>' + esc(step[1]) + '</b><small>' + esc(step[2]) + '</small>' + (step[3] ? '<em>' + esc(step[3]) + '</em>' : '') + '</p></div>';
  }).join('') + '</div>';
}

function inspectorFindingNextAction(row) {
  if (row.statusKey === 'waiting_cap') return 'Await CAP submission';
  if (row.statusKey === 'cap_submitted') return 'Review CAP and evidence';
  if (row.statusKey === 'returned') return 'Await revised CAP';
  if (row.statusKey === 'closed') return 'Closed';
  return 'Review finding';
}

function inspectorFindingCurrentOwner(row) {
  if (row.statusKey === 'waiting_cap' || row.statusKey === 'returned') return row.organization + ' (Service Provider)';
  if (row.statusKey === 'closed') return 'CAA Inspector';
  return 'CAA Inspector';
}

function inspectorFindingActionStrip(row) {
  return '<div class="finding-action-strip">' +
    '<div><span>Current Owner</span><b>' + esc(inspectorFindingCurrentOwner(row)) + '</b></div>' +
    '<div><span>Next Action</span><b>' + esc(inspectorFindingNextAction(row)) + '</b></div>' +
    '<div><span>Due Date</span><b' + (row.dueKey === 'due7' ? ' class="is-danger"' : '') + '>' + esc(row.dueDateText) + '</b><small>' + esc(row.dueRule) + '</small></div>' +
    '<div><span>Organization</span><b>' + esc(row.organization) + '</b></div>' +
  '</div>';
}

function inspectorFindingDetailBody(row, ui) {
  var tab = ui.tab || 'details';
  var decision = ui.findingDecisions && ui.findingDecisions[row.id];
  var decisionLabel = decision && decision.decision === 'accept'
    ? 'Accepted in this session'
    : (decision && decision.decision === 'return'
      ? 'Returned for revision'
      : (decision && decision.decision === 'resubmitted' ? 'Resubmitted for review' : row.statusLabel));
  if (tab === 'cap') {
    return '<div class="finding-cap-grid">' +
      '<section class="finding-detail-card"><h3>CAP Summary</h3><dl class="finding-detail-dl">' +
        '<dt>Submitted by</dt><dd>' + esc(row.organization) + ' (Service Provider)</dd>' +
        '<dt>Submitted on</dt><dd>' + esc(row.submittedOn === '-' ? 'Pending submission' : row.submittedOn) + '</dd>' +
        '<dt>Due Date</dt><dd>' + esc(row.dueDateText + ' (' + row.dueRule + ')') + '</dd>' +
        '<dt>Status</dt><dd><b class="is-' + esc(row.statusTone) + '">' + esc(decisionLabel) + '</b></dd>' +
      '</dl><button class="btn btn--sm" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="CAP_' + esc(row.id) + '.pdf">View CAP Document</button></section>' +
      '<section class="finding-detail-card"><h3>Inspector Verification</h3><p>Review the submitted CAP and supporting evidence.</p>' +
        '<div class="finding-verification-actions"><button class="btn btn--ok" data-act="finding-accept-cap" data-id="' + esc(row.id) + '">Accept CAP</button><button class="btn btn--danger" data-act="finding-return-cap" data-id="' + esc(row.id) + '">Return for Revision</button></div>' +
        (decision ? '<p class="finding-decision-note">Latest update: <b>' + esc(decisionLabel) + '</b> at ' + esc(decision.at) + '</p>' : '') +
      '</section></div>';
  }
  if (tab === 'conversation') {
    return '<section class="finding-detail-card"><h3>Conversation</h3><div class="finding-message"><b>Inspector</b><p>Please submit CAP evidence and implementation notes for this finding.</p></div><div class="finding-message is-provider"><b>Service Provider</b><p>CAP package has been submitted for review.</p></div></section>';
  }
  if (tab === 'files') {
    return '<section class="finding-detail-card"><h3>Files</h3><button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="CAP_' + esc(row.id) + '.pdf"><b>CAP_' + esc(row.id) + '.pdf</b><small>PDF · 245 KB</small><span>↓</span></button><button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="Evidence_' + esc(row.id) + '.zip"><b>Evidence_' + esc(row.id) + '.zip</b><small>ZIP · 1.8 MB</small><span>↓</span></button></section>';
  }
  if (tab === 'history') {
    return '<section class="finding-detail-card"><h3>History</h3>' + inspectorFindingTimeline(row) + '</section>';
  }
  return '<div class="finding-detail-split"><section><h3>Finding Description</h3><p>' + esc(row.description) + '</p><h3>Reference</h3><p><a href="#" data-act="cap-review-evidence" data-id="' + esc(row.id) + '" data-file="' + esc(row.reference || 'Reference') + '">' + esc(row.reference || 'Configured reference') + '</a></p><h3>Evidence</h3>' + inspectorFindingEvidenceStrip(row) + '<div class="finding-meta-card"><div><span>Organization</span><b>' + esc(row.organization) + '</b></div><div><span>Location</span><b>' + esc(row.location || 'Main Terminal') + '</b></div><div><span>Inspection</span><b>Routine Inspection<br>(INS-2026-015)</b></div><div><span>Finding Type</span><b>Non-Compliant</b></div></div></section><aside><h3>CAP Timeline</h3>' + inspectorFindingTimeline(row) + '</aside></div>';
}

function inspectorFindingDetailPanel(row, ui) {
  var active = ui.tab || 'details';
  function tabButton(key, label, badge) {
    return '<button class="' + (active === key ? 'is-active' : '') + '" data-act="cap-review-tab" data-id="' + esc(row.id) + '" data-tab="' + esc(key) + '">' + esc(label) + (badge ? '<span>' + esc(badge) + '</span>' : '') + '</button>';
  }
  return '<section class="finding-detail-panel">' +
    '<div class="finding-detail-head"><div><h2><span>' + esc(row.id) + '</span> ' + esc(row.title) + '</h2><p><span>⌘</span> ' + esc(row.checklist) + '<span>▣</span> Raised on 15 Jun 2026 by ' + esc(row.owner) + '</p></div><div>' + demoBadge(row.levelLabel, row.levelKey === 'l1' ? 'danger' : (row.levelKey === 'l2' ? 'warn' : 'info')) + demoBadge(row.statusLabel, row.statusTone) + '</div></div>' +
    inspectorFindingActionStrip(row) +
    '<div class="finding-detail-tabs">' +
      tabButton('details', 'Details') +
      tabButton('cap', 'CAP & Verification') +
      tabButton('conversation', 'Conversation', '2') +
      tabButton('files', 'Files', '3') +
      tabButton('history', 'History') +
    '</div>' +
    '<div class="finding-detail-body">' + inspectorFindingDetailBody(row, ui) + '</div>' +
    '<div class="finding-detail-actions"><button class="btn" data-act="finding-edit" data-id="' + esc(row.id) + '">Edit Finding</button><button class="btn btn--primary" data-act="cap-track-reminder">Remind Service Provider</button></div>' +
  '</section>';
}

function inspectorFindingReturnedFlow() {
  var stages = [
    ['1. Finding Raised', 'Inspector raises a finding.'],
    ['2. CAP Submitted', 'Service provider submits CAP and evidence.'],
    ['3. Inspector Review', 'Inspector reviews the CAP.'],
    ['4. Returned', 'Inspector returns it with comments.'],
    ['5. Revision by Service Provider', 'CAP and uploads are updated.'],
    ['6. Resubmitted', 'Revised CAP is resubmitted.'],
    ['7. Inspector Review', 'Inspector reviews again.'],
    ['8. Closed', 'Inspector accepts and closes.']
  ];
  return '<section class="finding-return-flow"><h3>Returned Flow <span>(Lifecycle)</span></h3><div class="finding-flow-steps">' +
    stages.map(function (stage, index) {
      return '<div class="finding-flow-step"><b>' + esc(stage[0]) + '</b><p>' + esc(stage[1]) + '</p></div>' + (index < stages.length - 1 ? '<span class="finding-flow-arrow">→</span>' : '');
    }).join('') +
    '</div><div class="finding-return-columns">' +
      '<section><h4>Service Provider View</h4><div class="finding-flow-card"><b>F-014-03 · CCTV Coverage Gaps</b><p class="is-danger">Status: Returned</p><p>Evidence is not sufficient. Please provide updated photos and coverage map.</p><button class="btn btn--primary btn--sm" data-act="finding-submit-revised" data-id="F-014-03">Submit Revised CAP</button></div></section>' +
      '<section><h4>Inspector View</h4><div class="finding-flow-card"><b>Review Revised CAP</b><p>Supporting evidence and revised comments are available for inspection.</p><div class="finding-verification-actions"><button class="btn btn--ok btn--sm" data-act="finding-accept-cap" data-id="F-014-03">Accept CAP</button><button class="btn btn--danger btn--sm" data-act="finding-return-cap" data-id="F-014-03">Return for Revision</button></div></div></section>' +
    '</div></section>';
}

function inspectorCapReviewProviderCards(ui) {
  var selectedId = ui.selectedProviderId || 'skycargo-air';
  return inspectorCapReviewProviders().map(function (provider) {
    var active = provider.id === selectedId;
    var submitted = provider.status === 'submitted';
    return '<button class="cap-provider-card' + (active ? ' is-active' : '') + (submitted ? '' : ' is-pending') + '" data-act="cap-review-provider" data-id="' + esc(provider.id) + '">' +
      '<span class="cap-provider-card__icon">' + esc(provider.icon) + '</span>' +
      '<span class="cap-provider-card__body"><b>' + esc(provider.name) + '</b><small>' + esc(provider.role) + '</small>' +
        demoBadge(submitted ? 'CAP Submitted' : 'Pending CAP', submitted ? 'ok' : 'warn') + '</span>' +
      (active ? '<span class="cap-provider-card__check">✓</span>' : '') +
      '<span class="cap-provider-card__foot"><em>' + esc(String(provider.findings)) + ' Findings</em><em>' + esc(String(provider.caps)) + ' CAPs</em></span>' +
    '</button>';
  }).join('');
}

function inspectorCapReviewStatusTabs(ui, rows) {
  var counts = { all: rows.length, pending_review: 0, accepted: 0, revision_requested: 0, rejected: 0 };
  rows.forEach(function (row) {
    counts[row.statusKey] = (counts[row.statusKey] || 0) + 1;
  });
  var tabs = [
    ['all', 'All CAPs'],
    ['pending_review', 'Pending Review'],
    ['accepted', 'Accepted'],
    ['revision_requested', 'Revision Requested'],
    ['rejected', 'Rejected']
  ];
  return '<div class="cap-submission-tabs">' + tabs.map(function (tab) {
    return '<button class="' + ((ui.status || 'all') === tab[0] ? 'is-active' : '') + '" data-act="cap-review-filter" data-status="' + esc(tab[0]) + '">' +
      esc(tab[1]) + ' (' + esc(String(counts[tab[0]] || 0)) + ')' +
    '</button>';
  }).join('') + '</div>';
}

function inspectorCapReviewRowsHtml(rows) {
  if (!rows.length) {
    return '<tr><td colspan="7"><div class="empty">No CAPs match this organization or filter.</div></td></tr>';
  }
  return rows.map(function (row) {
    var due = row.dueDateText === 'Observation'
      ? '<b>Observation</b>'
      : '<b>' + esc(row.dueDateText) + '</b><small>(' + esc(row.dueRule) + ')</small>';
    return '<tr>' +
      '<td><button class="cap-review-expand" data-act="nav" data-view="cap-review-detail" data-id="' + esc(row.detailId) + '">›</button><b>' + esc(row.id) + '</b></td>' +
      '<td>' + esc(row.title) + '<small>' + esc(row.checklist) + '</small></td>' +
      '<td><span class="sp-level is-' + esc(row.levelKey) + '">' + esc(row.levelLabel) + '</span></td>' +
      '<td class="cap-review-due">' + due + '</td>' +
      '<td>' + esc(row.submittedOn) + '</td>' +
      '<td>' + demoBadge(row.statusLabel, row.statusTone) + '</td>' +
      '<td><button class="btn btn--sm" data-act="nav" data-view="cap-review-detail" data-id="' + esc(row.detailId) + '">Review</button></td>' +
    '</tr>';
  }).join('');
}

function inspectorCapReviewSummary(provider, rows) {
  var pending = rows.filter(function (row) { return row.statusKey === 'pending_review'; }).length;
  var accepted = rows.filter(function (row) { return row.statusKey === 'accepted'; }).length;
  var revision = rows.filter(function (row) { return row.statusKey === 'revision_requested'; }).length;
  var rejected = rows.filter(function (row) { return row.statusKey === 'rejected'; }).length;
  return '<section class="cap-review-side-card">' +
    '<h2>Organization Summary</h2>' +
    '<div class="cap-review-org-name"><span>⌂</span><b>' + esc(provider.name) + '</b><small>(' + esc(provider.role) + ')</small></div>' +
    '<dl class="cap-review-summary-list">' +
      '<dt>Total Findings</dt><dd>' + esc(String(provider.findings)) + '</dd>' +
      '<dt>CAPs Submitted</dt><dd>' + esc(String(provider.caps)) + '</dd>' +
      '<dt class="is-info">Pending Review</dt><dd class="is-info">' + esc(String(pending)) + '</dd>' +
      '<dt class="is-ok">Accepted</dt><dd class="is-ok">' + esc(String(accepted)) + '</dd>' +
      '<dt class="is-warn">Revision Requested</dt><dd class="is-warn">' + esc(String(revision)) + '</dd>' +
      '<dt class="is-danger">Rejected</dt><dd class="is-danger">' + esc(String(rejected)) + '</dd>' +
    '</dl>' +
  '</section>';
}

function inspectorCapReviewDueGuide() {
  return '<section class="cap-review-side-card is-guide">' +
    '<h2>Level Due Date Guide</h2>' +
    '<dl class="cap-review-due-guide">' +
      '<dt><span class="is-l1"></span>Level 1 (Critical)</dt><dd>14 days</dd>' +
      '<dt><span class="is-l2"></span>Level 2 (Major)</dt><dd>90 days</dd>' +
      '<dt><span class="is-l3"></span>Level 3 (Observation)</dt><dd>Observation / No due date</dd>' +
    '</dl>' +
  '</section>';
}

function inspectorCapReviewTimeline() {
  var steps = [
    ['done', 'CAP Submitted by Service Provider', '27 Jun 2026 09:15'],
    ['current', 'Inspector Review', 'Pending'],
    ['waiting', 'Lead Inspector Review', 'Pending'],
    ['waiting', 'Department Manager Approval', 'Pending'],
    ['waiting', 'General Manager Approval', 'Pending'],
    ['waiting', 'ED Final Approval', 'Pending']
  ];
  return '<section class="cap-review-side-card"><h2>Review Timeline</h2><div class="cap-review-mini-timeline">' +
    steps.map(function (step, index) {
      return '<div class="cap-review-mini-step is-' + esc(step[0]) + '">' +
        '<span>' + (step[0] === 'done' ? '✓' : esc(String(index + 1))) + '</span>' +
        '<p><b>' + esc(step[1]) + '</b><small>' + esc(step[2]) + '</small></p>' +
      '</div>';
    }).join('') +
  '</div></section>';
}

function viewInspectorCapReviews() {
  var ui = capReviewUiState();
  var allRows = inspectorCapVerificationRows();
  var counts = inspectorCapVerificationCounts(allRows);
  var visibleRows = inspectorCapVerificationFilteredRows(ui);
  var selected = null;
  var i;
  var matchedSelected = false;
  for (i = 0; i < visibleRows.length; i++) {
    if (visibleRows[i].id === ui.expandedId) {
      selected = visibleRows[i];
      matchedSelected = true;
    }
  }
  if (!selected) selected = visibleRows[0] || allRows[0] || null;
  if (!selected && allRows.length) selected = allRows[0];
  if (!matchedSelected && (!ui.status || ui.status === 'all')) {
    for (i = 0; i < visibleRows.length; i++) {
      if (visibleRows[i].id === 'F-014-02') selected = visibleRows[i];
    }
  }
  if (selected) ui.expandedId = selected.id;
  var actions = '<button class="btn" data-act="mock-export">⇩ Export</button>' +
    '<button class="btn" data-act="finding-filter-toggle">▽ Filter</button>' +
    '<button class="btn btn--primary" data-act="finding-new">+ New Finding</button>';
  return '<div class="finding-workspace cap-review-page">' +
    '<div class="cap-review-crumb"><span>SkyCargo Air</span><span>›</span><span>Routine Inspection</span><span>›</span><b>Findings</b></div>' +
    pageHead('Findings', 'All findings and CAPs from this inspection', actions) +
    inspectorCapVerificationTabs(ui, counts) +
    (ui.filtersOpen === false ? '' : inspectorCapVerificationFilters(ui)) +
    '<div class="finding-board finding-board--dossier responsive-workbench responsive-workbench--with-rail">' +
      '<aside class="finding-queue-column">' + inspectorFindingQueue(visibleRows, selected ? selected.id : '') + '</aside>' +
      '<main class="finding-dossier-column">' + (selected ? inspectorFindingDetailPanel(selected, ui) : '<section class="finding-detail-panel"><div class="empty">No findings match these filters.</div></section>') + '</main>' +
    '</div>' +
    inspectorFindingReturnedFlow() +
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
    inspectorRootCause: 'yes',
    inspectorActions: 'yes',
    inspectorEvidence: 'yes',
    inspectorImplementation: 'yes',
    inspectorOnsite: 'no',
    inspectorAssessment: 'acceptable',
    inspectorComments: 'The CAP adequately addresses the root cause. Evidence provided is sufficient and implementation has been verified through records. No on-site verification is required.',
    inspectorReviewDate: '2025-05-19',
    leadInspectorRecommendationAt: '',
    unitEffectiveness: 'partially_effective',
    unitRecommendationType: 'administrative_penalty',
    unitRecommendationLevel: 'administrative_penalty',
    unitComplianceDueDate: '2026-09-20',
    unitJustification: 'The CAP has initiated corrective actions; however, updated training records are still incomplete for multiple staff members. Therefore, an administrative penalty is recommended to ensure timely compliance.',
    unitAttachmentName: '',
    unitManagerRecommendationAt: '',
    inspectorPackageDecision: '',
    inspectorPackageEvaluation: 'acceptable',
    inspectorPackageComment: '',
    inspectorPackageAcceptedAt: '',
    allCapsApprovedAt: '',
    finalReportReadyAt: '',
    finalReportPreparedAt: '',
    finalReportPrepareStep: 'executive',
    finalReportContent: '',
    finalReportSavedAt: '',
    finalReportSubmittedAt: '',
    secondReportPreparedAt: '',
    submittedToUnitManagerAt: '',
    submittedToGeneralManagerAt: ''
  };
  state.capTrackingUi = Object.assign(fallback, state.capTrackingUi || {});
  if (['overview', 'timeline', 'communications', 'documents'].indexOf(state.capTrackingUi.tab) === -1) state.capTrackingUi.tab = 'overview';
  if (['details', 'cap', 'evaluation', 'attachments', 'evidence', 'assessment', 'history', 'communications', 'documents', 'enforcement'].indexOf(state.capTrackingUi.detailTab) === -1) state.capTrackingUi.detailTab = 'details';
  if (!state.capTrackingUi.inspectorRootCause) state.capTrackingUi.inspectorRootCause = 'yes';
  if (!state.capTrackingUi.inspectorActions) state.capTrackingUi.inspectorActions = 'yes';
  if (!state.capTrackingUi.inspectorEvidence) state.capTrackingUi.inspectorEvidence = 'yes';
  if (!state.capTrackingUi.inspectorImplementation) state.capTrackingUi.inspectorImplementation = 'yes';
  if (!state.capTrackingUi.inspectorOnsite) state.capTrackingUi.inspectorOnsite = 'no';
  if (!state.capTrackingUi.inspectorAssessment) state.capTrackingUi.inspectorAssessment = 'acceptable';
  if (state.capTrackingUi.inspectorComments === undefined || state.capTrackingUi.inspectorComments === null) state.capTrackingUi.inspectorComments = 'The CAP adequately addresses the root cause. Evidence provided is sufficient and implementation has been verified through records. No on-site verification is required.';
  if (!state.capTrackingUi.inspectorReviewDate) state.capTrackingUi.inspectorReviewDate = '2025-05-19';
  if (!state.capTrackingUi.inspectorPackageEvaluation) state.capTrackingUi.inspectorPackageEvaluation = 'acceptable';
  if (state.capTrackingUi.inspectorPackageComment === undefined || state.capTrackingUi.inspectorPackageComment === null) state.capTrackingUi.inspectorPackageComment = '';
  if (!state.capTrackingUi.finalReportPrepareStep) state.capTrackingUi.finalReportPrepareStep = 'executive';
  if (state.capTrackingUi.finalReportContent === undefined || state.capTrackingUi.finalReportContent === null) state.capTrackingUi.finalReportContent = '';
  if (state.capTrackingUi.finalReportSavedAt === undefined || state.capTrackingUi.finalReportSavedAt === null) state.capTrackingUi.finalReportSavedAt = '';
  if (state.capTrackingUi.finalReportSubmittedAt === undefined || state.capTrackingUi.finalReportSubmittedAt === null) state.capTrackingUi.finalReportSubmittedAt = '';
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
      '<div><b>Final Report Issued after Executive Director / GM approval completed and sent to the service provider on 22 Jun 2026.</b>' +
      '<p>The service provider must submit corrective action plans for each applicable finding within the defined deadlines.</p></div>' +
      '<button class="btn btn--sm" data-act="cap-track-reminder">Send Reminder</button>' +
      (ui.reminderSentAt ? '<span class="cap-track-reminder-note">' + esc(reminderLabel) + ' · ' + esc(ui.reminderSentAt) + '</span>' : '') +
    '</div>' +
    capTrackingTable(rows) +
  '</div>';
}

function capTrackingTimeline() {
  var events = [
    ['22 Jun 2026 14:30', 'Final Report Issued after Executive Director / GM approval and sent to service provider.', 'Ufuk Aslan'],
    ['22 Jun 2026 14:20', 'Department Manager approved the report for Executive Director / GM approval.', 'Selin Department Manager'],
    ['22 Jun 2026 14:10', 'Final report finalized by Lead Inspector.', 'John Lead Inspector'],
    ['21 Jun 2026 10:15', 'Service Provider comments reviewed.', 'John Lead Inspector'],
    ['20 Jun 2026 16:40', 'Preliminary report released after Department Manager review.', 'Selin Department Manager']
  ];
  return '<div class="cap-track-panel"><h2>Timeline</h2><div class="cap-track-activity">' + events.map(function (event) {
    return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-ok">✓</span><p><b>' + esc(event[1]) + '</b><small>' + esc(event[2]) + '</small></p></div>';
  }).join('') + '</div></div>';
}

function capTrackingCommunications(ui) {
  var sent = ui.reminderSentAt || 'Not sent in this browser session';
  return '<div class="cap-track-panel"><h2>Communications</h2>' +
    '<div class="cap-track-message"><b>Final report package sent</b><p>Sent to SkyCargo Air safety contact after Executive Director / GM approval and Final Report Issued on 22 Jun 2026.</p></div>' +
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
    ['done', '1. Final Report Issued', '22 Jun 2026 after Executive Director / GM approval'],
    ['done', '2. CAP Process Starts', 'Service provider notified'],
    ['active', '3. CAP Submitted', 'In Progress'],
    ['', '4. Inspector verifies CAP', 'Waiting'],
    ['', '5. Lead Inspector recommends closure', 'Waiting'],
    ['', '6. Department Manager approves closure', 'Waiting'],
    ['', '7. Finding Closed', 'Waiting']
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

function capTrackingRecentActivities() {
  var events = [
    ['22 Jun 2026 14:30', 'Final Report Issued after Executive Director / GM approval and sent to service provider.', 'Ufuk Aslan'],
    ['22 Jun 2026 14:20', 'Department Manager approved the report for Executive Director / GM approval.', 'Selin Department Manager'],
    ['22 Jun 2026 14:10', 'Final report finalized by Lead Inspector.', 'John Lead Inspector'],
    ['21 Jun 2026 10:15', 'Service Provider comments reviewed.', 'John Lead Inspector'],
    ['20 Jun 2026 16:40', 'Preliminary report released after Department Manager review.', 'Selin Department Manager']
  ];
  return '<div class="cap-track-lower">' +
    '<div class="cap-track-panel"><h2>Recent Activities</h2><div class="cap-track-activity">' +
      events.map(function (event, index) {
        return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-' + (index < 1 ? 'ok' : 'info') + '">' + (index < 1 ? '✓' : 'i') + '</span><p><b>' + esc(event[1]) + '</b><small>' + esc(event[2]) + '</small></p></div>';
      }).join('') +
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
        '<h1>CAP Tracking - Service Provider ' + demoBadge('Final Report Issued', 'ok') + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Inspection Dates: <b>15 - 18 Jun 2026</b></span><span>Final Report Issued: <b>22 Jun 2026</b></span><span>Executive Director / GM approval completed</span>' +
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
      '<main class="cap-track-main">' + tabBody + capTrackingRecentActivities() + '</main>' +
      capTrackingSide() +
    '</div>' +
  '</div>';
}

function capDetailRowById(id) {
  var submittedCap = inspectorCapReviewRowById(id);
  if (submittedCap) {
    return {
      id: submittedCap.id,
      title: submittedCap.title,
      level: submittedCap.level,
      levelLabel: submittedCap.levelLabel,
      department: submittedCap.checklist,
      cap: 'Yes',
      owner: submittedCap.organization || 'SkyCargo Air',
      due: submittedCap.due || '',
      status: submittedCap.statusLabel,
      days: submittedCap.dueRule,
      action: 'Review CAP',
      actionKey: 'review',
      tone: 'info'
    };
  }
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
    levelLabel: row.levelLabel || row.level,
    owner: row.owner,
    status: row.status,
    due: row.due,
    days: row.days,
    requirement: 'SMS 2.4 - Competency and Training',
    description: 'Training records for ground handling staff are incomplete. Some records do not include training dates, instructor names, and training content.',
    capDeadline: row.level === 'Level 1' ? '14 days' : (row.level === 'Level 2' ? '90 days' : 'No CAP'),
    originalDue: row.due || '2026-09-20',
    department: row.department || 'Flight Operations (OPS)',
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
      ['22 Jun 2026 14:30', 'Executive Director / GM', 'Final Report Issued and sent to service provider.', '-'],
      ['22 Jun 2026 14:20', 'Department Manager', 'Report approved for Executive Director / GM approval.', '-'],
      ['28 Jun 2026 09:15', 'Service Provider', 'CAP submitted.', 'Initial CAP submission.'],
      ['05 Jul 2026 11:20', 'Inspector', 'CAP reviewed (2nd review).', 'Partial improvement observed.'],
      ['05 Jul 2026 11:25', 'Inspector', 'CAP review sent to Lead Inspector.', 'Additional actions required.']
    ]
  };
  if (row.id !== 'F-2026-002') {
    detail.requirement = row.level === 'Level 1' ? 'SMS 2.1 - Risk Management Process' : detail.requirement;
    detail.description = row.title + ' is tracked under the issued final report CAP package.';
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
  var leadReady = !!ui.submittedToUnitManagerAt || !!ui.leadInspectorRecommendationAt;
  var departmentApproved = !!ui.departmentManagerApprovedAt;
  var findingClosed = !!ui.findingClosedAt;
  return '<div class="cap-detail-steps">' +
    capDetailStep('done', 'Final Report Issued', '22 Jun 2026', 1) +
    capDetailStep('done', 'CAP Submitted', '28 Jun 2026', 2) +
    capDetailStep(inspectorSent ? 'done' : 'active', 'Inspector verifies CAP', inspectorSent ? ui.inspectorReviewSentAt : 'In Progress', 3) +
    capDetailStep(leadReady ? 'done' : 'waiting', 'Lead Inspector recommends closure', leadReady ? 'Ready for Department Manager' : 'Pending', 4) +
    capDetailStep(departmentApproved ? 'done' : 'waiting', 'Department Manager approves closure', departmentApproved ? ui.departmentManagerApprovedAt : 'Pending', 5) +
    capDetailStep(findingClosed ? 'done' : 'waiting', 'Finding Closed', findingClosed ? ui.findingClosedAt : 'Pending', 6) +
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
  var leadState = ui.inspectorReviewSentAt ? 'Ready for recommendation' : 'Waiting for Inspector';
  var managerState = ui.submittedToUnitManagerAt || ui.leadInspectorRecommendationAt ? 'Ready for approval' : 'Pending';
  return '<section class="cap-detail-panel">' +
    '<h2>Inspector Review Handoff</h2>' +
    '<div class="cap-detail-workflow">' +
      '<div class="cap-detail-workflow-step is-active"><span>1</span><p><b>Inspector Review</b><small>CAP closure/effectiveness decision</small></p></div>' +
      '<div class="cap-detail-workflow-step' + (ui.inspectorReviewSentAt ? ' is-active' : '') + '"><span>2</span><p><b>Lead Inspector Recommendation</b><small>' + esc(leadState) + '</small></p></div>' +
      '<div class="cap-detail-workflow-step' + (managerState.indexOf('Ready') === 0 ? ' is-active' : '') + '"><span>3</span><p><b>Department Manager approves closure</b><small>' + esc(managerState) + '</small></p></div>' +
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
    '<h2>Optional Escalation Options</h2>' +
    '<div class="form-row"><label>Select Recommended Enforcement Decision</label><select data-field="cap-detail-enforcement-level">' + options + '</select></div>' +
    '<div class="cap-detail-enforcement-options">' + cards.map(function (card) {
      return '<label class="cap-detail-enforcement-option' + (selectedDecision === card[0] ? ' is-selected' : '') + '">' +
        '<input type="radio" name="cap-enforcement-level" value="' + esc(card[0]) + '" data-field="cap-detail-enforcement-level"' + (selectedDecision === card[0] ? ' checked' : '') + '>' +
        '<span><b>' + esc(card[1]) + '</b><small>' + esc(card[2]) + '</small></span>' +
      '</label>';
    }).join('') + '</div>' +
    '<div class="form-row"><label>Recommended Action Justification</label><textarea data-field="cap-detail-enforcement-justification" rows="3" placeholder="Provide justification for the recommended enforcement action.">' + esc(ui.enforcementJustification) + '</textarea></div>' +
    '<button class="btn btn--primary btn--block" data-act="cap-detail-submit-general-manager" data-id="' + esc(data.id) + '">Send Recommendation to Department Manager</button>' +
    (ui.departmentManagerApprovedAt ? '<p class="cap-detail-note is-ok">Department Manager approved closure decision at ' + esc(ui.departmentManagerApprovedAt) + '.</p>' : '') +
  '</section>';
}

function capDetailQuickActions(data) {
  return '<section class="cap-detail-panel">' +
    '<h2>Quick Actions</h2>' +
    '<div class="cap-track-quick">' +
      '<button data-act="cap-track-view-report">View Final Report <span>›</span></button>' +
      '<button data-act="cap-detail-download-finding" data-id="' + esc(data.id) + '">Download Finding <span>›</span></button>' +
      '<button data-act="nav" data-view="unit-manager-review" data-id="' + esc(data.id) + '">Open Department Manager Approval <span>›</span></button>' +
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

function leadCapReviewList(selectedId) {
  var items = [
    { capId: 'CAP-2025-045-001', finding: 'OPS-001', dept: 'Flight Operations (OPS)', due: '20 May 2025', inspector: 'Mary Adams', tone: 'danger', risk: 'High', id: 'F-2026-002' },
    { capId: 'CAP-2025-038-002', finding: 'OPS-004', dept: 'Flight Operations (OPS)', due: '22 May 2025', inspector: 'Ahmed Khan', tone: 'warn', risk: 'Medium', id: 'F-2026-001' },
    { capId: 'CAP-2025-028-001', finding: 'PEL-002', dept: 'Personnel Licensing (PEL)', due: '25 May 2025', inspector: 'Peter Shikongo', tone: 'ok', risk: 'Low', id: 'F-2026-007' }
  ];
  return '<aside class="lead-cap-list cap-detail-panel">' +
    '<div class="lead-cap-list__head"><h2>CAP Review List</h2><button class="icon-btn" data-act="cap-track-quick-action" data-track-action="filter" aria-label="Filter CAP review list">⌁</button></div>' +
    '<div class="lead-cap-list__tabs"><button class="is-active">Waiting (3)</button><button>Reviewed (12)</button></div>' +
    '<div class="lead-cap-search"><input type="search" placeholder="Search..." aria-label="Search CAP reviews"><span>⌕</span></div>' +
    '<div class="lead-cap-list__items">' + items.map(function (item) {
      return '<button class="lead-cap-card' + (item.id === selectedId ? ' is-active' : '') + '" data-act="nav" data-view="cap-review-detail" data-id="' + esc(item.id) + '">' +
        '<span><b>' + esc(item.capId) + '</b>' + demoBadge(item.risk, item.tone) + '</span>' +
        '<small>Finding: ' + esc(item.finding) + '</small>' +
        '<small>Dept: ' + esc(item.dept) + '</small>' +
        '<small>Due: ' + esc(item.due) + (item.capId === 'CAP-2025-045-001' ? ' <b>(Today)</b>' : '') + '</small>' +
        '<small>Inspector: ' + esc(item.inspector) + '</small>' +
      '</button>';
    }).join('') + '</div>' +
    '<div class="lead-cap-list__foot"><span>Showing 1 to 3 of 3</span><button class="icon-btn" disabled>‹</button><button class="cap-review-page-btn is-active">1</button><button class="icon-btn" disabled>›</button></div>' +
  '</aside>';
}

function leadCapFindingInformation(data) {
  return '<section class="cap-detail-panel lead-cap-finding-info">' +
    '<div class="cap-detail-panel-head"><h2>Finding Information</h2><button class="cap-file-link" data-act="open" data-id="' + esc(data.id) + '">View Finding Details ↗</button></div>' +
    '<div class="lead-cap-info-grid">' +
      '<div><span>Audit No.</span><b>AUD-2025-045</b></div>' +
      '<div><span>Department</span><b>Flight Operations (OPS)</b></div>' +
      '<div><span>Finding ID</span><b>OPS-001</b></div>' +
      '<div><span>Risk Level</span>' + demoBadge('High', 'danger') + '</div>' +
      '<div><span>Regulation</span><b>NAMCAR OPS 1.1005(a)</b></div>' +
      '<div><span>Original Due Date</span><b>20 May 2025</b></div>' +
      '<div class="is-wide"><span>Finding Title</span><b>Inadequate Flight Duty Time Monitoring</b></div>' +
      '<div><span>Finding Raised On</span><b>14 May 2025</b></div>' +
      '<div class="is-full"><span>Finding Description</span><p>The operator did not consistently monitor and record cumulative flight duty time for flight crew members. Records for 3 out of 10 sampled pilots did not demonstrate compliance with regulatory limitations.</p></div>' +
    '</div>' +
  '</section>';
}

function leadCapSubmittedPlan(data) {
  var files = [
    ['PDF', 'FDT_Monitoring_Procedure_v2.0.pdf', '1.2 MB', 'danger'],
    ['XLS', 'FDT_Training_Records_May2025.xlsx', '850 KB', 'ok'],
    ['PDF', 'Internal_Audit_Report_May2025.pdf', '2.4 MB', 'danger']
  ];
  return '<section class="cap-detail-panel lead-cap-service-provider">' +
    '<h2>Corrective Action Plan (CAP) by Service Provider</h2>' +
    '<h3>Corrective Action</h3><p>We have implemented an automated flight duty time monitoring system integrated with scheduling to ensure compliance. All affected pilots have been briefed and records updated.</p>' +
    '<h3>Preventive Action</h3><p>Introduce monthly compliance monitoring and internal audits to ensure continued adherence. Recurrent training will be conducted every 6 months.</p>' +
    '<div class="lead-cap-meta-row">' +
      '<div><span>Responsible Person</span><b>Operations Manager</b></div>' +
      '<div><span>Target Completion Date</span><b>18 May 2025</b></div>' +
      '<div><span>Actual Completion Date</span><b>17 May 2025</b></div>' +
      '<div><span>CAP Submitted On</span><b>18 May 2025</b></div>' +
    '</div>' +
    '<h3>Evidence Submitted</h3><div class="lead-cap-evidence-grid">' + files.map(function (file) {
      return '<button class="cap-detail-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="' + esc(file[1]) + '" title="' + esc(file[1]) + '">' +
        '<span class="cap-detail-file__icon is-' + esc(file[3]) + '">' + esc(file[0]) + '</span><span><b>' + esc(file[1]) + '</b><small>' + esc(file[2]) + '</small></span>' +
      '</button>';
    }).join('') + '<button class="lead-cap-more-files" data-act="cap-track-quick-action" data-track-action="documents"><b>+2</b><small>More Files</small></button></div>' +
  '</section>';
}

function leadCapInspectorAssessment(data) {
  return '<section class="cap-detail-panel lead-cap-assessment">' +
    '<div class="cap-detail-panel-head"><h2>Inspector Assessment</h2><button class="cap-file-link" data-act="cap-unit-view-inspector-report" data-id="' + esc(data.id) + '">View Inspector Assessment →</button></div>' +
    '<div class="lead-cap-assessment-grid">' +
      '<div><span>Inspector</span><b>Mary Adams</b></div>' +
      '<div><span>Reviewed On</span><b>18 May 2025</b></div>' +
      '<div><span>Overall Recommendation</span>' + demoBadge('Recommend Closure', 'ok') + '</div>' +
    '</div>' +
    '<p class="lead-review-muted mt-12">Inspector reviewed the CAP and evidence first. The package is now waiting for Lead Inspector decision.</p>' +
  '</section>';
}

function leadCapQualityPanel() {
  return '<section class="cap-detail-panel lead-cap-quality">' +
    '<h2>Lead Inspector Review</h2>' +
    '<div class="lead-cap-quality-row"><span>CAP Quality</span><b class="lead-cap-stars">★ ★ ★ ★ ☆</b></div>' +
    '<div class="lead-cap-quality-row"><span>Evidence Completeness</span><b>92%</b><div class="bar"><i style="width:92%"></i></div></div>' +
    '<div class="lead-cap-quality-row"><span>Root Cause Addressed</span><b class="is-ok">● High</b></div>' +
  '</section>';
}

function leadCapDecisionPanel(ui, data) {
  var decision = ui.leadDecision || 'recommend_closure';
  var comments = ui.leadComments || '';
  var options = [
    ['recommend_closure', 'Recommend Closure (Approve CAP)', 'The CAP is adequate and effective.'],
    ['request_revision', 'Request Revision', 'CAP requires changes before approval.'],
    ['request_more_evidence', 'Request More Evidence', 'Additional evidence is required.'],
    ['schedule_verification', 'Schedule On-site Verification', 'On-site verification is required.'],
    ['return_to_inspector', 'Return to Inspector', 'Return CAP for re-assessment.']
  ];
  return '<section class="cap-detail-panel lead-cap-decision">' +
    '<h2>Lead Inspector Decision</h2>' +
    '<div class="lead-cap-decision-options">' + options.map(function (option) {
      return '<label class="cap-unit-radio' + (decision === option[0] ? ' is-selected' : '') + '">' +
        '<input type="radio" name="cap-lead-decision" data-field="cap-lead-decision" value="' + esc(option[0]) + '"' + (decision === option[0] ? ' checked' : '') + '>' +
        '<span><b>' + esc(option[1]) + '</b><small>' + esc(option[2]) + '</small></span>' +
      '</label>';
    }).join('') + '</div>' +
    '<h2 class="mt-16">Lead Inspector Comments</h2>' +
    '<textarea data-field="cap-lead-comments" rows="5">' + esc(comments) + '</textarea>' +
    '<div class="lead-cap-signoff"><div><span>Lead Inspector</span><b>John Smith</b></div><div><span>Date</span><b>19 May 2025</b></div></div>' +
    '<div class="lead-cap-bottom-actions"><button class="btn" data-act="cap-lead-save" data-id="' + esc(data.id) + '">Save Draft</button><button class="btn" data-act="cap-lead-return" data-id="' + esc(data.id) + '">Return to Inspector</button><button class="btn btn--primary" data-act="cap-lead-submit" data-id="' + esc(data.id) + '">Recommend Closure</button></div>' +
    (ui.leadInspectorRecommendationAt ? '<p class="cap-detail-note is-ok">Lead Inspector recommendation sent at ' + esc(ui.leadInspectorRecommendationAt) + '.</p>' : '') +
  '</section>';
}

function viewLeadInspectorCapReviewDetail(ui, data) {
  return '<div class="cap-detail-page lead-cap-review-page">' +
    '<section class="workbench-command workbench-command--lead-cap cap-detail-head">' +
      '<div class="workbench-command__main">' +
        '<div class="cap-track-breadcrumb">Dashboard › Finding Closure › CAP Review › CAP-2025-045-001</div>' +
        '<h1>CAP Review (Lead Inspector) ' + demoBadge('Waiting for Review', 'info') + '</h1>' +
        '<p class="lead-review-muted">Review the corrective action plan and inspector assessment, then make your decision.</p>' +
      '</div>' +
      '<div class="workbench-command__meta">' +
        commandMetric('Current owner', 'Lead Inspector', 'info') +
        commandMetric('Decision needed', 'Recommend, return, or request evidence', 'warn') +
        commandMetric('Due Date', '20 May 2025 · Due today', 'danger') +
      '</div>' +
      '<div class="cap-track-head-actions">' +
        '<button class="btn" data-act="cap-track-export">Export PDF</button>' +
        '<button class="btn btn--primary" data-act="cap-track-quick-action" data-track-action="actions">Actions ▾</button>' +
      '</div>' +
    '</section>' +
    '<div class="lead-cap-review-layout">' +
      leadCapReviewList(data.id) +
      '<main class="lead-cap-main">' + leadCapFindingInformation(data) + leadCapSubmittedPlan(data) + leadCapInspectorAssessment(data) + '</main>' +
      '<aside class="lead-cap-side">' + leadCapQualityPanel() + leadCapDecisionPanel(ui, data) + '</aside>' +
    '</div>' +
  '</div>';
}

function inspectorCapEvidenceFiles() {
  return [
    ['PDF', 'FDT_Monitoring_Procedure_v2.0.pdf', '1.2 MB', 'danger'],
    ['XLS', 'FDT_Training_Records_May2025.xlsx', '850 KB', 'ok'],
    ['PDF', 'Internal_Audit_Report_May2025.pdf', '2.4 MB', 'danger'],
    ['JPG', 'System_Screenshot_01.jpg', '1.1 MB', 'info'],
    ['ZIP', 'Pilot_Briefing_Photos.zip', '4.6 MB', 'ok']
  ];
}

function inspectorCapFindingSummary(data) {
  var submittedPackageRow = /^F-(014|GND|FUEL|SEC)-/.test(data.id || '');
  var displayLevel = submittedPackageRow ? data.level : 'High';
  var riskTone = displayLevel === 'Level 1' ? 'danger' : (displayLevel === 'Level 2' ? 'warn' : (displayLevel === 'High' ? 'danger' : 'info'));
  return '<section class="cap-detail-panel inspector-cap-summary">' +
    '<div class="cap-detail-panel-head"><h2>Finding Information</h2><button class="cap-file-link" data-act="open" data-id="' + esc(data.id) + '">View Finding Details ↗</button></div>' +
    '<div class="inspector-cap-summary-grid">' +
      '<div><span>Audit No.</span><b>AUD-2025-045</b></div>' +
      '<div><span>Department</span><b>' + esc(submittedPackageRow ? (data.department || '-') : 'Flight Operations (OPS)') + '</b></div>' +
      '<div><span>Finding ID</span><b>' + esc(submittedPackageRow ? data.id : 'OPS-001') + '</b></div>' +
      '<div><span>Finding Title</span><b>' + esc(submittedPackageRow ? data.title : 'Inadequate Flight Duty Time Monitoring') + '</b></div>' +
      '<div><span>Risk Level</span>' + demoBadge(displayLevel, riskTone) + '</div>' +
      '<div><span>Regulation</span><b>NAMCAR OPS 1.1005(a)</b></div>' +
      '<div><span>Original Due Date</span><b>' + esc(submittedPackageRow ? fmtDate(data.originalDue || '') : '20 May 2025') + '</b></div>' +
      '<div><span>Finding Raised On</span><b>14 May 2025</b></div>' +
      '<div><span>Lead Inspector</span><b>John Smith</b></div>' +
    '</div>' +
  '</section>';
}

function inspectorCapEvidenceGrid(data) {
  return '<div class="inspector-cap-evidence-grid">' + inspectorCapEvidenceFiles().map(function (file) {
    return '<button class="inspector-cap-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="' + esc(file[1]) + '" title="' + esc(file[1]) + '">' +
      '<span class="cap-detail-file__icon is-' + esc(file[3]) + '">' + esc(file[0]) + '</span>' +
      '<span><b>' + esc(file[1]) + '</b><small>' + esc(file[2]) + '</small></span>' +
      '<em>↓</em>' +
    '</button>';
  }).join('') + '</div>';
}

function inspectorCapDetailsPanel(data) {
  return '<section class="cap-detail-panel inspector-cap-main-card">' +
    '<h2>Corrective Action Plan by Service Provider</h2>' +
    '<h3>Corrective Action</h3>' +
    '<p>We have implemented an automated flight duty time monitoring system integrated with scheduling to ensure compliance. All affected pilots have been briefed and records updated.</p>' +
    '<h3>Preventive Action</h3>' +
    '<p>Introduce monthly compliance monitoring and internal audits to ensure continued adherence. Recurrent training will be conducted every 6 months.</p>' +
    '<div class="inspector-cap-meta-row">' +
      '<div><span>Responsible Person</span><b>Operations Manager</b></div>' +
      '<div><span>Target Completion Date</span><b>18 May 2025</b></div>' +
      '<div><span>Actual Completion Date</span><b>17 May 2025</b></div>' +
      '<div><span>CAP Effective Date</span><b>17 May 2025</b></div>' +
    '</div>' +
    '<div class="inspector-cap-divider"></div>' +
    '<h3>Evidence Submitted (5)</h3>' +
    inspectorCapEvidenceGrid(data) +
    '<button class="inspector-cap-comments" data-act="cap-track-quick-action" data-track-action="comments"><span>⌕</span><b>Service Provider Comments</b><em>›</em></button>' +
  '</section>';
}

function inspectorCapEvidencePanel(data) {
  return '<section class="cap-detail-panel inspector-cap-main-card">' +
    '<h2>Evidence Submitted (5)</h2>' +
    '<p>Review each evidence item before completing the Inspector assessment.</p>' +
    inspectorCapEvidenceGrid(data) +
    '<div class="cap-detail-note mt-12">File buttons open evidence records only. No real file is downloaded or stored in this demo.</div>' +
  '</section>';
}

function inspectorCapAssessmentSummary(ui) {
  return '<section class="cap-detail-panel inspector-cap-main-card">' +
    '<h2>Inspector Assessment Summary</h2>' +
    '<div class="inspector-cap-assessment-summary">' +
      '<div><span>Root Cause Addressed</span><b>' + esc(ui.inspectorRootCause === 'yes' ? 'Yes' : 'No') + '</b></div>' +
      '<div><span>Actions Specific & Measurable</span><b>' + esc(ui.inspectorActions === 'yes' ? 'Yes' : 'No') + '</b></div>' +
      '<div><span>Evidence Sufficient</span><b>' + esc(ui.inspectorEvidence === 'yes' ? 'Yes' : 'No') + '</b></div>' +
      '<div><span>Implementation Completed</span><b>' + esc(ui.inspectorImplementation === 'yes' ? 'Yes' : 'No') + '</b></div>' +
      '<div><span>On-site Verification Required</span><b>' + esc(ui.inspectorOnsite === 'yes' ? 'Yes' : 'No') + '</b></div>' +
      '<div><span>Overall Assessment</span><b>' + esc(inspectorCapAssessmentLabel(ui.inspectorAssessment)) + '</b></div>' +
    '</div>' +
    '<p class="mt-12">' + esc(ui.inspectorComments || '') + '</p>' +
  '</section>';
}

function inspectorCapHistoryPanel(data) {
  return '<section class="cap-detail-panel inspector-cap-main-card">' +
    '<h2>Comments & History</h2>' +
    '<table class="cap-detail-table"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Comments</th></tr></thead><tbody>' +
      data.actions.map(function (action) {
        return '<tr><td>' + esc(action[0]) + '</td><td>' + esc(action[1]) + '</td><td>' + esc(action[2]) + '</td><td>' + esc(action[3]) + '</td></tr>';
      }).join('') +
    '</tbody></table>' +
  '</section>';
}

function inspectorCapMainPanel(ui, data) {
  if (ui.detailTab === 'evidence') return inspectorCapEvidencePanel(data);
  if (ui.detailTab === 'assessment') return inspectorCapAssessmentSummary(ui);
  if (ui.detailTab === 'history') return inspectorCapHistoryPanel(data);
  return inspectorCapDetailsPanel(data);
}

function inspectorCapReviewStatus(ui) {
  var sent = !!ui.inspectorReviewSentAt;
  var steps = [
    ['done', 'CAP Submitted by Service Provider', '18 May 2025'],
    [sent ? 'done' : 'active', 'Under Inspector Review', sent ? ui.inspectorReviewSentAt : 'Current'],
    [sent ? 'active' : 'waiting', 'Pending Lead Inspector Review', sent ? 'Waiting' : 'Pending'],
    ['waiting', 'Department Decision', ''],
    ['waiting', 'Closed', '']
  ];
  return '<section class="cap-detail-panel inspector-cap-status">' +
    '<h2>Review Status</h2>' +
    '<div class="inspector-cap-status-meta"><span>CAP Submitted On</span><b>18 May 2025</b>' + demoBadge(sent ? 'Submitted to Lead Inspector' : 'Under Inspector Review', sent ? 'info' : 'ok') + '</div>' +
    '<div class="inspector-cap-status-list">' + steps.map(function (step) {
      return '<div class="inspector-cap-status-step is-' + esc(step[0]) + '"><span>' + esc(step[0] === 'done' ? '✓' : '') + '</span><b>' + esc(step[1]) + '</b><small>' + esc(step[2]) + '</small></div>';
    }).join('') + '</div>' +
  '</section>';
}

function inspectorCapAssessmentLabel(value) {
  var labels = {
    acceptable: 'Acceptable - Recommend to Lead Inspector',
    request_revision: 'Request Revision',
    request_more_evidence: 'Request More Evidence',
    onsite_required: 'On-site Verification Required'
  };
  return labels[value] || labels.acceptable;
}

function inspectorCapYesNo(field, selected, title, detail) {
  function choice(value, label) {
    return '<label class="inspector-cap-choice' + (selected === value ? ' is-selected' : '') + '">' +
      '<input type="radio" name="' + esc(field) + '" data-field="' + esc(field) + '" value="' + esc(value) + '"' + (selected === value ? ' checked' : '') + '>' +
      '<span>' + esc(label) + '</span>' +
    '</label>';
  }
  return '<div class="inspector-cap-check-row">' +
    '<div><b>' + esc(title) + '</b><small>' + esc(detail) + '</small></div>' +
    '<div class="inspector-cap-choice-group">' + choice('yes', 'Yes') + choice('no', 'No') + '</div>' +
  '</div>';
}

function inspectorCapReviewPanel(ui, data) {
  var assessmentOptions = capReviewSelectOptions([
    { value: 'acceptable', label: 'Acceptable - Recommend to Lead Inspector' },
    { value: 'request_revision', label: 'Request Revision' },
    { value: 'request_more_evidence', label: 'Request More Evidence' },
    { value: 'onsite_required', label: 'On-site Verification Required' }
  ], ui.inspectorAssessment || 'acceptable');
  return '<section class="cap-detail-panel inspector-cap-review-panel">' +
    '<h2>Inspector Review</h2>' +
    inspectorCapYesNo('cap-inspector-root-cause', ui.inspectorRootCause, 'Root Cause Addressed', 'CAP addresses the root cause.') +
    inspectorCapYesNo('cap-inspector-actions', ui.inspectorActions, 'Actions are Specific & Measurable', 'Actions are clear and measurable.') +
    inspectorCapYesNo('cap-inspector-evidence', ui.inspectorEvidence, 'Evidence is Sufficient', 'Evidence supports implementation.') +
    inspectorCapYesNo('cap-inspector-implementation', ui.inspectorImplementation, 'Implementation Completed', 'Actions have been implemented.') +
    inspectorCapYesNo('cap-inspector-onsite', ui.inspectorOnsite, 'On-site Verification Required', 'Additional on-site verification needed.') +
    '<div class="form-row"><label>Overall Assessment</label><select data-field="cap-inspector-assessment">' + assessmentOptions + '</select></div>' +
    '<div class="form-row"><label>Inspector Comments</label><textarea data-field="cap-inspector-comments" rows="5">' + esc(ui.inspectorComments || '') + '</textarea></div>' +
    '<div class="inspector-cap-signoff"><div><span>Inspector</span><b>Mary Adams</b></div><div><span>Review Date</span><input type="date" data-field="cap-inspector-review-date" value="' + esc(ui.inspectorReviewDate || '2025-05-19') + '"></div></div>' +
  '</section>';
}

function isInspectorSubmittedCapPackage(data) {
  return /^F-(014|GND|FUEL|SEC)-/.test(data && data.id ? data.id : '');
}

function inspectorCapPackageLevelTone(data) {
  if (data.level === 'Level 1') return 'danger';
  if (data.level === 'Level 2') return 'warn';
  return 'info';
}

function inspectorCapPackageMeta(data) {
  return '<div class="inspector-package-meta">' +
    '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
    '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
    '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
    '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
    '<div><span>Report Version</span><b>2.0 (CAP Submitted)</b></div>' +
    '<div><span>CAP Submitted On</span><b>27 Jun 2026 09:15</b><small>by SkyCargo Air</small></div>' +
  '</div>';
}

function inspectorCapPackageTabs(active) {
  var tabs = [
    ['details', 'Finding Details'],
    ['cap', 'Service Provider CAP'],
    ['evaluation', 'Inspector Evaluation'],
    ['history', 'Comments & History'],
    ['attachments', 'Attachments (2)']
  ];
  return '<div class="inspector-package-tabs">' + tabs.map(function (tab) {
    return '<button class="' + (active === tab[0] ? 'is-active' : '') + '" data-act="cap-detail-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function inspectorCapPackageFindingCard(data) {
  return '<section class="inspector-package-card inspector-package-finding">' +
    '<h2>Finding Information</h2>' +
    '<div class="inspector-package-info-grid">' +
      '<div><span>Finding ID</span><b>' + esc(data.id) + '</b></div>' +
      '<div><span>Finding Title</span><b>' + esc(data.title) + '</b></div>' +
      '<div><span>Level</span>' + demoBadge(data.levelLabel || data.level, inspectorCapPackageLevelTone(data)) + '</div>' +
      '<div><span>Due Date</span><b>' + esc(fmtDate(data.originalDue || data.due)) + '</b><small>(14 days left)</small></div>' +
      '<div><span>Status</span>' + demoBadge('Pending Review', 'info') + '</div>' +
    '</div>' +
    '<h3>Finding Description</h3>' +
    '<p>During the inspection, it was observed that access control procedures for restricted areas are not consistently enforced. Several individuals were able to enter restricted zones without proper identification or authorization.</p>' +
    '<h3>Evidence</h3>' +
    '<ul><li>Access doors were left open at the time of inspection.</li><li>Visitor logs were incomplete.</li></ul>' +
    '<h3>Initial Recommendation</h3>' +
    '<p>Ensure strict implementation of access control procedures and maintain complete visitor records.</p>' +
    '<h3>Related Checklist</h3>' +
    '<div class="inspector-package-table-wrap"><table class="inspector-package-table"><thead><tr><th>Checklist Section</th><th>Question</th><th>Your Finding</th><th>Status</th></tr></thead><tbody>' +
      '<tr><td>Physical Security</td><td>Are access control procedures implemented for restricted areas?</td><td>' + demoBadge('Non-Compliant', 'danger') + '</td><td>' + demoBadge('CAP Required', 'warn') + '</td></tr>' +
      '<tr><td>Physical Security</td><td>Are access points monitored and recorded?</td><td>' + demoBadge('Non-Compliant', 'danger') + '</td><td>' + demoBadge('CAP Required', 'warn') + '</td></tr>' +
      '<tr><td>Physical Security</td><td>Are visitors properly identified and authorized?</td><td>' + demoBadge('Non-Compliant', 'danger') + '</td><td>' + demoBadge('CAP Required', 'warn') + '</td></tr>' +
    '</tbody></table></div>' +
    '<div class="inspector-package-due-note"><b>Level Due Date Guide</b><span>Level 1 (Critical) findings must be closed within 14 days.</span><em>Due Date: 30 Jun 2026 (14 days left)</em></div>' +
  '</section>';
}

function inspectorCapPackagePlanCard(data) {
  return '<section class="inspector-package-card inspector-package-cap-plan">' +
    '<h2>Service Provider Corrective Action Plan (CAP)</h2>' +
    demoBadge('CAP Submitted', 'ok') +
    '<h3>Root Cause</h3>' +
    '<p>Inadequate supervision of access points during peak hours and insufficient security personnel.</p>' +
    '<h3>Corrective Action</h3>' +
    '<p>Additional security personnel have been assigned to all access points during peak hours. Access control procedures have been reinforced.</p>' +
    '<h3>Preventive Action</h3>' +
    '<p>Regular training will be provided to security staff. Periodic internal audits will be conducted to ensure compliance.</p>' +
    '<dl class="inspector-package-cap-dl">' +
      '<dt>CAP Submitted On</dt><dd>27 Jun 2026 09:15</dd>' +
      '<dt>Submitted By</dt><dd>SkyCargo Air</dd>' +
      '<dt>Target Completion Date</dt><dd>30 Jun 2026</dd>' +
      '<dt>Attachments</dt><dd>2 files</dd>' +
    '</dl>' +
    '<button class="btn btn--sm" data-act="cap-detail-tab" data-tab="attachments">View Attachments</button>' +
  '</section>';
}

function inspectorCapPackageSnapshot(data) {
  return '<aside class="inspector-package-side">' +
    '<section class="inspector-package-card">' +
      '<h2>Finding Snapshot</h2>' +
      '<dl class="inspector-package-snapshot">' +
        '<dt>Department</dt><dd>Security</dd>' +
        '<dt>Checklist Section</dt><dd>Physical Security</dd>' +
        '<dt>Question</dt><dd>Are access control procedures implemented for restricted areas?</dd>' +
        '<dt>Your Finding</dt><dd>Non-Compliant</dd>' +
        '<dt>Evidence Provided</dt><dd>Yes (2 files)</dd>' +
        '<dt>CAP Required</dt><dd>Yes</dd>' +
        '<dt>CAP Submitted On</dt><dd>27 Jun 2026 09:15</dd>' +
        '<dt>Submitted By</dt><dd>SkyCargo Air</dd>' +
        '<dt>Due Date</dt><dd class="is-danger">30 Jun 2026 (14 days left)</dd>' +
      '</dl>' +
    '</section>' +
    '<section class="inspector-package-card">' +
      '<h2>Attachments (2)</h2>' +
      '<button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="CAP_AccessControl_F-014-01.pdf"><b>CAP_AccessControl_F-014-01.pdf</b><small>1.2 MB</small><span>↓</span></button>' +
      '<button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="Evidence_Photos.zip"><b>Evidence_Photos.zip</b><small>14.7 MB</small><span>↓</span></button>' +
      '<button class="cap-file-link mt-12" data-act="cap-detail-tab" data-tab="attachments">View all attachments</button>' +
    '</section>' +
    '<section class="inspector-package-card">' +
      '<h2>Review Timeline</h2>' +
      '<div class="cap-review-mini-timeline">' +
        '<div class="cap-review-mini-step is-done"><span>✓</span><p><b>CAP Submitted by Service Provider</b><small>27 Jun 2026 09:15</small></p></div>' +
        '<div class="cap-review-mini-step is-current"><span>2</span><p><b>Inspector Review</b><small>In Progress</small></p></div>' +
        '<div class="cap-review-mini-step is-waiting"><span>3</span><p><b>Lead Inspector Review</b><small>Pending</small></p></div>' +
        '<div class="cap-review-mini-step is-waiting"><span>4</span><p><b>Department Manager Approval</b><small>Pending</small></p></div>' +
        '<div class="cap-review-mini-step is-waiting"><span>5</span><p><b>General Manager Approval</b><small>Pending</small></p></div>' +
        '<div class="cap-review-mini-step is-waiting"><span>6</span><p><b>ED Final Approval</b><small>Pending</small></p></div>' +
      '</div>' +
    '</section>' +
  '</aside>';
}

function inspectorCapPackageEvaluation(ui, data) {
  var selected = ui.inspectorPackageEvaluation || 'acceptable';
  var options = capReviewSelectOptions([
    { value: 'acceptable', label: 'Accept CAP' },
    { value: 'revision', label: 'Request Revision' },
    { value: 'reject', label: 'Reject CAP' }
  ], selected);
  return '<section class="inspector-package-card inspector-package-evaluation">' +
    '<h2>Inspector Evaluation</h2>' +
    '<p>Evaluate the CAP submitted by the Service Provider.</p>' +
    '<div class="inspector-package-form">' +
      '<label>Evaluation <span>*</span><select id="inspector-cap-package-evaluation">' + options + '</select></label>' +
      '<label>Comments <span>*</span><textarea id="inspector-cap-package-comment" rows="4" placeholder="Enter your comments and justification...">' + esc(ui.inspectorPackageComment || '') + '</textarea></label>' +
    '</div>' +
    '<div class="inspector-package-actions">' +
      '<button class="btn" data-act="inspector-cap-package-revision" data-id="' + esc(data.id) + '">Request Revision</button>' +
      '<button class="btn btn--danger" data-act="inspector-cap-package-reject" data-id="' + esc(data.id) + '">Reject CAP</button>' +
      '<button class="btn btn--primary" data-act="inspector-cap-package-accept" data-id="' + esc(data.id) + '">Accept CAP</button>' +
    '</div>' +
  '</section>';
}

function viewInspectorSubmittedCapPackageDetail(ui, data) {
  var activeTab = ['details', 'cap', 'evaluation', 'history', 'attachments'].indexOf(ui.detailTab) > -1 ? ui.detailTab : 'details';
  var mainContent = '';
  if (activeTab === 'cap') {
    mainContent = inspectorCapPackagePlanCard(data) + inspectorCapPackageEvaluation(ui, data);
  } else if (activeTab === 'evaluation') {
    mainContent = inspectorCapPackageEvaluation(ui, data);
  } else if (activeTab === 'history') {
    mainContent = '<section class="inspector-package-card"><h2>Comments & History</h2><div class="cap-review-mini-timeline">' +
      '<div class="cap-review-mini-step is-done"><span>✓</span><p><b>CAP submitted by Service Provider</b><small>27 Jun 2026 09:15</small></p></div>' +
      '<div class="cap-review-mini-step is-current"><span>2</span><p><b>Inspector opened CAP review</b><small>Pending decision</small></p></div>' +
    '</div></section>';
  } else if (activeTab === 'attachments') {
    mainContent = '<section class="inspector-package-card"><h2>Attachments (2)</h2>' +
      '<button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="CAP_AccessControl_F-014-01.pdf"><b>CAP_AccessControl_F-014-01.pdf</b><small>1.2 MB</small><span>↓</span></button>' +
      '<button class="inspector-package-file" data-act="cap-review-evidence" data-id="' + esc(data.id) + '" data-file="Evidence_Photos.zip"><b>Evidence_Photos.zip</b><small>14.7 MB</small><span>↓</span></button>' +
    '</section>' + inspectorCapPackageEvaluation(ui, data);
  } else {
    mainContent = '<div class="inspector-package-top-grid">' + inspectorCapPackageFindingCard(data) + inspectorCapPackagePlanCard(data) + '</div>' + inspectorCapPackageEvaluation(ui, data);
  }
  return '<div class="inspector-package-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><span>CAP Review</span><span>›</span><b>' + esc(data.id) + '</b></div>' +
    '<div class="inspector-package-head">' +
      '<div><h1>CAP Review - ' + esc(data.title) + ' (' + esc(data.id) + ') ' + demoBadge(data.levelLabel || data.level, inspectorCapPackageLevelTone(data)) + demoBadge('Pending Review', 'info') + '</h1></div>' +
      '<div class="cap-track-head-actions"><button class="btn" data-act="nav" data-view="findings" data-filter="capreview">← Back to List</button><button class="btn btn--primary" data-act="nav" data-view="cap-review-detail" data-id="' + esc(data.id) + '">View Final Report Progress</button></div>' +
    '</div>' +
    inspectorCapPackageMeta(data) +
    inspectorCapPackageTabs(activeTab) +
    '<div class="inspector-package-layout">' +
      '<main class="inspector-package-main">' + mainContent + '</main>' +
      inspectorCapPackageSnapshot(data) +
    '</div>' +
  '</div>';
}

function viewInspectorCapReviewDetail(ui, data) {
  if (isInspectorSubmittedCapPackage(data)) return viewInspectorSubmittedCapPackageDetail(ui, data);
  return '<div class="cap-detail-page inspector-cap-page">' +
    '<div class="cap-detail-head inspector-cap-head">' +
      '<div>' +
        '<div class="cap-track-breadcrumb">Dashboard › Findings › CAP Review (Inspector) › CAP-2025-045-001</div>' +
        '<h1>CAP Review (Inspector) ' + demoBadge('Under Inspector Review', 'ok') + '</h1>' +
        '<p class="lead-review-muted">Review the Corrective Action Plan (CAP) submitted by the service provider and provide your assessment.</p>' +
      '</div>' +
      '<div class="cap-track-head-actions"><button class="btn" data-act="cap-track-export">Export PDF ▾</button></div>' +
    '</div>' +
    '<div class="inspector-cap-review-layout">' +
      '<main class="inspector-cap-main">' +
        inspectorCapFindingSummary(data) +
        '<div class="cap-detail-tabs inspector-cap-tabs">' +
          capDetailTabButton('details', 'CAP Details', ui.detailTab) +
          capDetailTabButton('evidence', 'Evidence', ui.detailTab) +
          capDetailTabButton('assessment', 'Inspector Assessment', ui.detailTab) +
          capDetailTabButton('history', 'Comments & History', ui.detailTab) +
        '</div>' +
        inspectorCapMainPanel(ui, data) +
      '</main>' +
      '<aside class="inspector-cap-side">' +
        inspectorCapReviewStatus(ui) +
        inspectorCapReviewPanel(ui, data) +
      '</aside>' +
    '</div>' +
    '<div class="inspector-cap-bottom-actions">' +
      '<button class="btn" data-act="nav" data-view="findings" data-filter="capreview">Return to My CAP Reviews</button>' +
      '<span></span>' +
      '<button class="btn" data-act="cap-detail-request-revision" data-id="' + esc(data.id) + '">Request Revision</button>' +
      '<button class="btn" data-act="cap-detail-request-more-evidence" data-id="' + esc(data.id) + '">Request More Evidence</button>' +
      '<button class="btn btn--primary" data-act="cap-detail-prepare-second-report" data-id="' + esc(data.id) + '">Submit to Lead Inspector</button>' +
    '</div>' +
  '</div>';
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
    '<p>After Final Report Issued, the CAP Process Starts. The Service Provider submits CAP, the Inspector verifies CAP evidence, the Lead Inspector recommends closure, and the Department Manager approves closure or requests more action.</p>' +
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
  if (state.role === 'leadInspector') return viewLeadInspectorCapReviewDetail(ui, data);
  if (state.role === 'inspector') return viewInspectorCapReviewDetail(ui, data);
  var body = capDetailMainBody(ui, data);
  return '<div class="cap-detail-page">' +
    '<div class="cap-detail-head">' +
      '<div>' +
        '<div class="cap-track-breadcrumb">CAP Tracking › Finding: ' + esc(data.id) + '</div>' +
        '<h1>CAP Review - Finding ' + esc(data.id) + ' ' + capTrackLevelBadge(data.level) + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Final Report Issued: <b>22 Jun 2026</b></span>' +
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
  var approved = !!ui.departmentManagerApprovedAt;
  var closed = !!ui.findingClosedAt;
  return '<div class="cap-unit-steps">' +
    capUnitStep('done', 'Final Report Issued', '22 Jun 2026', 1) +
    capUnitStep('done', 'CAP Submitted', '28 Jun 2026', 2) +
    capUnitStep('done', 'Inspector Review', '05 Jul 2026', 3) +
    capUnitStep('done', 'Lead Inspector Recommendation', '05 Jul 2026', 4) +
    capUnitStep(approved ? 'done' : 'active', 'Department Manager approves closure', approved ? ui.departmentManagerApprovedAt : 'In Progress', 5) +
    capUnitStep(closed ? 'done' : 'waiting', 'Finding Closed', closed ? ui.findingClosedAt : 'Pending', 6) +
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
    '<h2>Inspector Review</h2>' +
    '<dl class="cap-detail-summary-dl">' +
      '<dt>Inspector</dt><dd>John Inspector</dd>' +
      '<dt>Review Date</dt><dd>05 Jul 2026</dd>' +
      '<dt>Review Status</dt><dd><b class="is-warn">Needs Further Action</b></dd>' +
      '<dt>Comments</dt><dd>The CAP addresses some of the issues, but updated training records are still incomplete for several employees. Additional corrective actions are required.</dd>' +
      '<dt>Lead Inspector Recommendation</dt><dd>Recommend Department Manager closure approval for additional CAP or closure decision.</dd>' +
    '</dl>' +
    '<button class="btn btn--sm mt-12" data-act="cap-unit-view-inspector-report" data-id="' + esc(data.id) + '">View Inspector Review</button>' +
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
  var closureDecisionOptions = [
    { value: 'close_finding', label: 'Close Finding' },
    { value: 'more_information', label: 'Request More Information' },
    { value: 'additional_cap_required', label: 'Additional CAP Required' },
    { value: 'escalate_high_risk', label: 'Escalate High-Risk / Enforcement' }
  ];
  if (recommendation === 'administrative_penalty') recommendation = 'additional_cap_required';
  if (selectedDecision === 'administrative_penalty') selectedDecision = 'additional_cap_required';
  var levelOptions = capReviewSelectOptions(closureDecisionOptions, selectedDecision);
  return '<section class="cap-detail-panel cap-unit-evaluation">' +
    '<h2>Department Manager Approval</h2>' +
    '<p class="muted">Based on the Inspector review and Lead Inspector recommendation, approve closure or request additional action.</p>' +
    '<h3>CAP Effectiveness</h3>' +
    '<div class="cap-unit-radio-list">' +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'effective', effectiveness, 'Effective', 'CAP fully addresses the finding.') +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'partially_effective', effectiveness, 'Partially Effective', 'CAP addresses some issues but additional actions are required.') +
      capUnitRadio('cap-unit-effectiveness', 'cap-unit-effectiveness', 'not_effective', effectiveness, 'Not Effective', 'CAP does not adequately address the finding.') +
    '</div>' +
    '<h3>Closure / Verification Decision</h3>' +
    '<div class="cap-unit-choice-grid">' +
      '<div><h4>Decision</h4>' +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'close_finding', recommendation, 'Close Finding', 'Evidence is sufficient for closure.') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'more_information', recommendation, 'Request More Information', 'Return to service provider for clarification.') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'additional_cap_required', recommendation, 'Additional CAP Required', 'Require additional corrective action before closure.') +
        capUnitRadio('cap-unit-recommendation-type', 'cap-unit-recommendation-type', 'escalate_high_risk', recommendation, 'Escalate High-Risk / Enforcement', 'Use the configured enforcement governance route if required.') +
      '</div>' +
    '</div>' +
    '<div class="cap-unit-form-grid">' +
      '<div class="form-row"><label>Closure Decision</label><select data-field="cap-unit-recommendation-level">' + levelOptions + '</select></div>' +
      '<div class="form-row"><label>Follow-up Due Date</label><input type="date" data-field="cap-unit-compliance-due-date" value="' + esc(ui.unitComplianceDueDate || '2026-09-20') + '"></div>' +
      '<div class="form-row cap-unit-justification"><label>Decision Note</label><textarea data-field="cap-unit-justification" rows="5">' + esc(ui.unitJustification || '') + '</textarea></div>' +
      '<div class="form-row"><label>Attachments (Optional)</label><div class="cap-unit-file-row"><span>' + esc(ui.unitAttachmentName || 'No file chosen') + '</span><button class="btn btn--sm" data-act="cap-unit-choose-file" data-id="' + esc(data.id) + '">Choose File</button></div></div>' +
    '</div>' +
    '<button class="btn btn--primary" data-act="cap-unit-submit-general-manager" data-id="' + esc(data.id) + '">Approve Closure Decision</button>' +
    (ui.departmentManagerApprovedAt ? '<p class="cap-detail-note is-ok">Department Manager approved closure decision at ' + esc(ui.departmentManagerApprovedAt) + '.</p>' : '') +
  '</section>';
}

function capUnitWorkflow(ui) {
  var approved = !!ui.departmentManagerApprovedAt;
  var closed = !!ui.findingClosedAt;
  var steps = [
    ['done', 'CAP Submitted', 'Completed', '28 Jun 2026'],
    ['done', 'Inspector Review', 'Completed', '05 Jul 2026'],
    ['done', 'Lead Inspector Recommendation', 'Completed', '05 Jul 2026'],
    [approved ? 'done' : 'active', 'Department Manager approves closure', approved ? 'Approved' : 'In Progress', approved ? ui.departmentManagerApprovedAt : ''],
    [closed ? 'done' : 'waiting', 'Finding Closed', closed ? 'Closed' : 'Pending', closed ? ui.findingClosedAt : '']
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
    ['22 Jun 2026', 'Final Report Issued after Executive Director / GM approval and sent to service provider.'],
    ['28 Jun 2026', 'CAP submitted by service provider.'],
    ['05 Jul 2026', 'Inspector review sent to Lead Inspector recommendation.'],
    ['Today', 'Pending Department Manager closure approval and closure decision.']
  ];
  return '<section class="cap-detail-panel"><h2>Finding History</h2><div class="cap-track-activity cap-unit-history">' +
    events.map(function (event) {
      return '<div><time>' + esc(event[0]) + '</time><span class="cap-track-event-dot is-info">o</span><p><b>' + esc(event[1]) + '</b></p></div>';
    }).join('') + '</div></section>';
}

function capUnitDocuments(data) {
  var docs = [
    ['Final Report', '22 Jun 2026'],
    ['Inspector Review', '05 Jul 2026'],
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
        '<div class="cap-track-breadcrumb">CAP Reviews › Finding: ' + esc(data.id) + ' › Department Manager Approval</div>' +
        '<h1>Department Manager Approval - Finding ' + esc(data.id) + ' ' + capTrackLevelBadge(data.level) + '</h1>' +
        '<div class="cap-track-meta">' +
          '<span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Inspection Type: <b>Routine Inspection</b></span><span>Final Report Issued: <b>22 Jun 2026</b></span>' +
        '</div>' +
      '</div>' +
      '<div class="cap-track-head-actions">' +
        '<button class="btn" data-act="cap-track-view-report">View Final Report</button>' +
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
function auditeeRequestAction(finding) {
  if (finding.status === 'WAITING_CAP') return { label: 'Submit CAP', action: 'cap', tone: 'primary' };
  if (finding.status === 'CAP_MORE_INFO') return { label: 'Respond to CAA', action: 'cap', tone: 'primary' };
  if (finding.status === 'EVIDENCE_REQUIRED') return { label: 'Upload Evidence', action: 'evidence', tone: 'primary' };
  if (finding.status === 'EVIDENCE_MORE_INFO') return { label: 'Respond to CAA', action: 'evidence', tone: 'primary' };
  if (finding.status === 'CAP_SUBMITTED' || finding.status === 'EVIDENCE_SUBMITTED') return { label: 'View submitted package', action: 'nav', tone: 'secondary' };
  if (finding.status === 'CLOSED') return { label: 'View Report', action: 'nav', tone: 'secondary' };
  return { label: 'Open request', action: 'nav', tone: 'secondary' };
}

function auditeeRequestCard(finding) {
  var d = dueInfo(finding);
  var action = auditeeRequestAction(finding);
  var actionAttrs = action.action === 'nav'
    ? ' data-act="nav" data-view="' + (finding.status === 'CLOSED' ? 'report' : 'finding') + '" data-id="' + esc(finding.id) + '"'
    : ' data-act="' + esc(action.action) + '" data-id="' + esc(finding.id) + '"';
  return '<article class="auditee-request-card">' +
    '<div class="auditee-request-card__main">' +
      '<div class="auditee-request-card__top"><b>' + esc(finding.id) + '</b>' + demoBadge(statusMeta(finding).label, statusMeta(finding).badge) + '</div>' +
      '<h3>' + esc(finding.title) + '</h3>' +
      '<p>' + esc(nextActionLabel(finding)) + '</p>' +
      '<div class="auditee-request-card__meta">' +
        commandMetric('Due Date', finding.status === 'CLOSED' ? 'Closed ' + fmtDate(finding.closedDate) : fmtDate(finding.dueDate) + (d.label !== '—' ? ' · ' + d.label : ''), d.overdue ? 'danger' : (d.dueSoon ? 'warn' : 'neutral')) +
        commandMetric('Related audit', finding.auditId || 'Pending CAA assignment', 'info') +
        commandMetric('Expected evidence', finding.evidenceRequired ? 'Evidence required before closure' : 'No evidence requested', finding.evidenceRequired ? 'warn' : 'neutral') +
      '</div>' +
    '</div>' +
    '<div class="auditee-request-card__action">' +
      '<button class="btn' + (action.tone === 'primary' ? ' btn--primary' : '') + ' btn--sm"' + actionAttrs + '>' + esc(action.label) + '</button>' +
    '</div>' +
  '</article>';
}

function auditeeRequestGroup(title, description, findings, tone) {
  return '<section class="auditee-request-group is-' + esc(tone || 'neutral') + '">' +
    '<div class="auditee-request-group__head"><div><h2>' + esc(title) + '</h2><p>' + esc(description) + '</p></div><b>' + esc(String(findings.length)) + '</b></div>' +
    '<div class="auditee-request-group__body">' +
      (findings.length ? findings.map(auditeeRequestCard).join('') : '<div class="empty">No requests in this group.</div>') +
    '</div>' +
  '</section>';
}

function viewAuditeeMyFindings() {
  var mine = visibleFindings();
  var open = mine.filter(function (f) { return f.status !== 'CLOSED'; });
  var dueSoon = open.filter(function (f) { return dueInfo(f).dueSoon; });
  var overdue = open.filter(function (f) { return dueInfo(f).overdue; });
  var requiredNow = mine.filter(function (f) {
    return f.status === 'WAITING_CAP' || f.status === 'EVIDENCE_REQUIRED';
  });
  var waitingCaa = mine.filter(function (f) {
    return f.status === 'CAP_SUBMITTED' || f.status === 'EVIDENCE_SUBMITTED';
  });
  var returned = mine.filter(function (f) {
    return f.status === 'CAP_MORE_INFO' || f.status === 'EVIDENCE_MORE_INFO';
  });
  var closed = mine.filter(function (f) { return f.status === 'CLOSED'; });

  var items = mine.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }).sort(workItemSort);

  return '' +
    pageHead('Service Provider Portal — ' + ROLES.auditee.orgName, 'What the CAA needs from your organization, and by when.') +
    '<div class="scope-note">🔒 You are viewing only ' + esc(ROLES.auditee.orgName) + ' portal data. CAA-only working information is outside this portal.</div>' +
    workbenchCommand('Auditee request center', 'Plain-language view of what the CAA needs from your organization.', [
      { label: 'Required now', value: String(requiredNow.length + returned.length), tone: requiredNow.length || returned.length ? 'warn' : 'ok' },
      { label: 'Waiting CAA review', value: String(waitingCaa.length), tone: waitingCaa.length ? 'info' : 'neutral' },
      { label: 'Due soon / overdue', value: String(dueSoon.length) + ' / ' + String(overdue.length), tone: overdue.length ? 'danger' : (dueSoon.length ? 'warn' : 'ok') }
    ], '', 'auditee') +
    '<h2 class="section-heading">My CAA Requests</h2>' +
    '<div class="auditee-request-center">' +
      auditeeRequestGroup('Required Now', 'Submit a CAP, upload evidence, or answer the latest CAA request.', requiredNow, 'warn') +
      auditeeRequestGroup('Waiting CAA Review', 'You have submitted information and the CAA owns the next review step.', waitingCaa, 'info') +
      auditeeRequestGroup('Returned / More Information Requested', 'The CAA needs a response before review can continue.', returned, 'danger') +
      auditeeRequestGroup('Closed / Archive', 'Closed findings and final reports remain available for reference.', closed, 'ok') +
    '</div>' +
    '<h2 class="section-heading mt-16">All CAA Requests</h2>' +
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
var INSPECTOR_EXECUTION_STATUS_META = {
  compliant: { label: 'Compliant', cls: 'ok', icon: '&#10003;' },
  noncompliant: { label: 'Non-Compliant', cls: 'danger', icon: '&#10005;' },
  observation: { label: 'Observation', cls: 'warn', icon: '&#9678;' },
  na: { label: 'Not Applicable', cls: 'neutral', icon: '&#8722;' }
};
var INSPECTOR_EXECUTION_STATUS_FLOW = ['compliant', 'noncompliant', 'observation', 'na'];

function currentInspectionAuditId() {
  return (state.params && state.params.auditId) || 'AUD-2026-001';
}

function currentInspectionExecutionPackage() {
  return typeof inspectionExecutionPackageForAudit === 'function'
    ? inspectionExecutionPackageForAudit(state, currentInspectionAuditId())
    : null;
}

function inspectionExecutionSectionByKey(sectionKey, executionPackage) {
  var pkg = executionPackage || currentInspectionExecutionPackage();
  return pkg && pkg.sections.filter(function (section) { return section.key === sectionKey; })[0] || null;
}

function inspectionExecutionSectionIndex(sectionKey, executionPackage) {
  var pkg = executionPackage || currentInspectionExecutionPackage();
  if (!pkg) return 0;
  for (var i = 0; i < pkg.sections.length; i++) if (pkg.sections[i].key === sectionKey) return i;
  return 0;
}

function inspectionExecutionSelectedSection(executionPackage) {
  var pkg = executionPackage || currentInspectionExecutionPackage();
  if (!pkg || !pkg.sections.length) return null;
  return inspectionExecutionSectionByKey(pkg.workspace.selectedSectionKey, pkg) || pkg.sections[0];
}

function inspectionExecutionResolveSection(sectionId) {
  var pkg = currentInspectionExecutionPackage();
  var current = inspectionExecutionSelectedSection(pkg);
  if (!pkg || !current) return null;
  var index = inspectionExecutionSectionIndex(current.key, pkg);
  if (sectionId === 'previous') return pkg.sections[Math.max(index - 1, 0)];
  if (sectionId === 'next') return pkg.sections[Math.min(index + 1, pkg.sections.length - 1)];
  return inspectionExecutionSectionByKey(sectionId, pkg);
}

function inspectionExecutionItemsForSection(sectionKey) {
  var section = inspectionExecutionSectionByKey(sectionKey);
  return section ? section.questions : [];
}

function inspectionExecutionAllItems() {
  var pkg = currentInspectionExecutionPackage();
  return pkg ? pkg.questions.slice() : [];
}

function inspectionExecutionAnswer(row) {
  var pkg = currentInspectionExecutionPackage();
  return pkg && pkg.workspace.answersByQuestionId[row.id] || {};
}

function inspectionExecutionStatus(row) {
  var status = inspectionExecutionAnswer(row).status || row.status || 'na';
  return status === 'observed' ? 'observation' : status;
}

function inspectionExecutionComment(row) {
  var answer = inspectionExecutionAnswer(row);
  return answer.comment !== undefined ? answer.comment : (row.comment || '');
}

function inspectionExecutionFileName(row) {
  var answer = inspectionExecutionAnswer(row);
  return answer.file !== undefined ? answer.file : (row.file || '');
}

function inspectionExecutionStatusButton(row, readOnly) {
  var status = inspectionExecutionStatus(row);
  var meta = INSPECTOR_EXECUTION_STATUS_META[status] || INSPECTOR_EXECUTION_STATUS_META.na;
  var options = INSPECTOR_EXECUTION_STATUS_FLOW.map(function (key) {
    var optionMeta = INSPECTOR_EXECUTION_STATUS_META[key];
    return '<option value="' + esc(key) + '"' + (key === status ? ' selected' : '') + '>' + esc(optionMeta.label) + '</option>';
  }).join('');
  return '<select class="inspection-status-select inspection-status-select--' + esc(meta.cls) +
    '" data-field="inspection-status" data-id="' + esc(row.id) + '" aria-label="Compliance for ' + esc(row.no) + '"' + (readOnly ? ' disabled' : '') + '>' +
    options +
  '</select>';
}

function inspectionExecutionFile(row, readOnly) {
  var file = inspectionExecutionFileName(row);
  if (!file) {
    return '<button class="inspection-file inspection-file--empty" data-act="inspection-file-open" data-id="' + esc(row.id) + '"' + (readOnly ? ' disabled' : '') + '>' +
      '<span class="inspection-file__icon">&#128206;</span><span class="inspection-file__name">No file attached</span></button>';
  }
  return '<button class="inspection-file" data-act="inspection-file-download" data-id="' + esc(row.id) + '" aria-label="Download mock attachment ' + esc(file) + '">' +
    '<span class="inspection-file__icon">&#128206;</span><span class="inspection-file__name">' + esc(file) + '</span></button>';
}

function inspectionExecutionLegendItem(status) {
  var meta = INSPECTOR_EXECUTION_STATUS_META[status];
  return '<div class="inspection-legend__item"><span class="inspection-legend__mark inspection-status--' + esc(meta.cls) + '">' + meta.icon + '</span><span>' + esc(meta.label) + '</span></div>';
}

function viewInspectorAuditExecution(audit) {
  var pkg = inspectionExecutionPackageForAudit(state, audit.id);
  if (!pkg) return pageHead('Checklist unavailable', 'No published checklist package is linked to this audit.');
  var workspace = pkg.workspace;
  var activeSection = inspectionExecutionSelectedSection(pkg);
  var activeIndex = inspectionExecutionSectionIndex(activeSection.key, pkg);
  var previousSection = activeIndex > 0 ? pkg.sections[activeIndex - 1] : null;
  var nextSection = activeIndex < pkg.sections.length - 1 ? pkg.sections[activeIndex + 1] : null;
  var submitted = !!workspace.submittedAt;
  var allSectionsComplete = !!workspace.allSectionsCompletedAt;
  var downloadNote = workspace.downloadedAt ? '<span class="inspection-save-state">Checklist downloaded</span>' : '';
  var attachmentDownloadNote = Object.keys(workspace.downloadedAttachmentIds || {}).length ? '<span class="inspection-save-state">Attachment downloaded</span>' : '';
  var draftNote = workspace.draftSavedAt ? '<span class="inspection-save-state">Draft saved</span>' : '';
  var completeNote = allSectionsComplete ? '<span class="inspection-save-state inspection-save-state--submitted">All sections complete</span>' : '';
  var submitNote = submitted ? '<span class="inspection-save-state inspection-save-state--submitted">Submitted to Lead Inspector</span>' : '';
  var sectionRows = pkg.sections.map(function (section) {
    return '<button class="inspection-section' + (section.key === activeSection.key ? ' is-active' : '') + '" data-act="inspection-section-preview" data-id="' + esc(section.key) + '">' +
      '<span>' + esc(String(section.order) + '. ' + section.label) + (section.key === 'em-eq' ? '<small>EM EQ / PBE</small>' : '') + '</span><b>' + esc(section.completed + ' / ' + section.total) + '</b></button>';
  }).join('');
  var checklistRows = activeSection.questions.map(function (row) {
    var required = row.commentRequired || inspectionExecutionStatus(row) === 'noncompliant' || inspectionExecutionStatus(row) === 'observation';
    return '<tr>' +
      '<td>' + esc(row.no) + '</td>' +
      '<td><div class="inspection-question checklist-item-title">' + esc(row.item) + '</div><small class="muted">' + esc(row.reference) + '</small></td>' +
      '<td>' + inspectionExecutionStatusButton(row, submitted) + '</td>' +
      '<td><textarea class="inspection-comment" data-field="inspection-comment" data-id="' + esc(row.id) + '" placeholder="' + esc(required ? 'Comment required for exception results' : 'Add comments (optional)') + '"' + (submitted ? ' disabled' : '') + '>' + esc(inspectionExecutionComment(row)) + '</textarea></td>' +
      '<td>' + inspectionExecutionFile(row, submitted) + '</td>' +
      '<td class="inspection-row-menu"><button class="iconbtn iconbtn--small" data-act="inspection-row-menu" data-id="' + esc(row.id) + '" aria-label="Row details">&#8942;</button></td>' +
    '</tr>';
  }).join('');
  return '<div class="inspection-exec">' +
    '<button class="inspection-back" data-act="nav" data-view="inspector-assignments">&larr; Back to Inspections</button>' +
    '<div class="inspection-exec__head"><div><h1>' + esc(pkg.title) + '</h1>' +
      '<div class="inspection-title-meta"><span>' + esc(pkg.organization) + '</span><span>' + esc(pkg.inspectionType) + '</span><span>' + esc(pkg.templateName + ' ' + pkg.templateVersion) + '</span></div>' +
      '<div class="inspection-status-line">' + demoBadge(submitted ? 'Submitted' : (allSectionsComplete ? 'Ready to Submit' : 'In Progress'), submitted || allSectionsComplete ? 'ok' : 'info') + downloadNote + attachmentDownloadNote + draftNote + completeNote + submitNote + '</div></div>' +
      '<div class="inspection-exec__actions">' +
        '<button class="btn" data-act="inspection-download-checklist" data-id="' + esc(audit.id) + '"><span>&#8681;</span>Download Checklist</button>' +
        '<button class="btn" data-act="inspection-save-draft" data-id="' + esc(audit.id) + '"' + (submitted ? ' disabled' : '') + '><span>&#128190;</span>Save Draft</button>' +
        '<button class="btn btn--primary inspection-submit-action" data-act="inspection-submit-lead" data-id="' + esc(audit.id) + '"><span>&#10148;</span>' + (submitted ? 'Submitted' : 'Submit to Lead Inspector') + '</button>' +
      '</div></div>' +
    '<div class="inspection-summary-card">' +
      '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>Inspection ID</span><b>' + esc(pkg.inspectionId) + '</b></div></div>' +
      '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>Start Date</span><b>' + esc(fmtDate(pkg.startDate)) + '</b></div></div>' +
      '<div class="inspection-summary-item"><span class="inspection-summary-icon">&#128197;</span><div><span>End Date</span><b>' + esc(fmtDate(pkg.endDate)) + '</b></div></div>' +
      '<div class="inspection-summary-item inspection-summary-item--wide"><div><span>Checklist Progress</span><b>' + esc(pkg.answered + ' / ' + pkg.total + ' (' + pkg.progressPercent + '%)') + '</b></div><div class="inspection-progress"><span style="width:' + esc(String(pkg.progressPercent)) + '%"></span></div></div>' +
    '</div>' +
    (submitted ? '<div class="inspection-readonly-banner"><b>Submitted checklist — read-only</b><span>Waiting for Lead Inspector Review. Submission timestamp: ' + esc(workspace.submittedAt) + '</span></div>' : '') +
    '<div class="inspection-workspace"><aside class="inspection-side"><div class="inspection-panel"><h2>Checklist Sections</h2><div class="inspection-sections">' + sectionRows + '</div></div>' +
      '<div class="inspection-panel inspection-legend"><h2>Legend</h2>' + inspectionExecutionLegendItem('compliant') + inspectionExecutionLegendItem('noncompliant') + inspectionExecutionLegendItem('observation') + inspectionExecutionLegendItem('na') + '</div></aside>' +
      '<section class="inspection-card"><div class="inspection-card__head"><h2>' + esc(String(activeSection.order) + '. ' + activeSection.label) + '</h2><div class="inspection-card__meta">' + esc(activeSection.completed + ' / ' + activeSection.total) + ' Completed <span>&#8963;</span></div></div>' +
        '<div class="inspection-table-wrap responsive-table-shell"><table class="inspection-table"><thead><tr><th style="width:58px">No.</th><th>Checklist Item</th><th style="width:190px">Compliance</th><th>Comments</th><th style="width:260px">Attached File</th><th style="width:44px"></th></tr></thead><tbody>' + checklistRows + '</tbody></table></div>' +
        '<div class="inspection-bottom-nav"><button class="btn" data-act="inspection-section-preview" data-id="previous"' + (previousSection ? '' : ' disabled') + '>&larr; ' + esc(previousSection ? previousSection.label : 'Previous Section') + '</button><span>' + esc(nextSection ? 'Next Section' : 'Final Section') + '</span>' +
          (nextSection ? '<button class="btn btn--primary" data-act="inspection-section-preview" data-id="next">' + esc(String(nextSection.order) + '. ' + nextSection.label) + ' &rarr;</button>' : '<button class="btn btn--primary" data-act="inspection-complete-sections" data-id="' + esc(audit.id) + '"' + (allSectionsComplete || submitted ? ' disabled' : '') + '>' + esc(allSectionsComplete ? 'Sections Complete' : 'All Sections Complete') + ' &rarr;</button>') +
        '</div></section></div></div>';
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
    pageHead(a.ref + ' — ' + orgName(a.orgId), 'Inspection overview and checklist entry point.', actions) +
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
    var heroItem = tpl.items.filter(function (item) { return item.id === 'cab-em-eq-pbe'; })[0];
    activeQuestionId = (flaggedItem || heroItem || unanswered || tpl.items[0]).id;
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
      '<td data-col="item"><div class="ops-cell-title">' + esc(it.text) + '</div><div class="ops-cell-sub">' + esc((it.section ? it.section + ' / ' : '') + (it.subSection ? it.subSection + ' · ' : '') + it.ref) + '</div></td>' +
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
  var activePanel = '<div class="active-row-panel question-dossier">' +
    '<div class="active-row-panel__title">' + esc(activeItem.text) + '</div>' +
    '<div class="active-row-panel__meta">' + esc((activeItem.section ? activeItem.section + ' / ' : '') + (activeItem.subSection ? activeItem.subSection + ' · ' : '') + activeItem.ref) + ' · Expected Evidence: ' + esc(activeItem.evidence) + '</div>' +
    regulatoryTraceHtml(regulatoryTraceForQuestion(activeItem.id), true) +
    '<div class="decision-bar decision-bar--checklist">' +
      commandMetric('Current owner', 'CAA Inspector', 'info') +
      commandMetric('Next action', selected ? 'Confirm answer and notes' : 'Choose an answer', selected ? 'ok' : 'warn') +
      commandMetric('Finding path', activeFlagged ? 'Potential finding required' : 'No finding yet', activeFlagged ? 'danger' : 'neutral') +
    '</div>' +
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
      '<div class="progress-band__hint">Demo scenario: mark <b>EM EQ / PBE serviceability</b> as <b>Non-Compliant</b> to raise a finding. Source sections: GALLEY, LAV, PAX SEAT, EM EQ, VID+CREW SEAT, COCKPIT+CAB GEN COND+EXITS.</div>' +
    '</div>' +
    '<div class="checklist-dossier-layout active-row-layout">' +
      activePanel +
      '<aside class="checklist-question-queue"><h2 class="section-heading">Question navigation</h2>' + checklistTable + '</aside>' +
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
        ? '<div class="divider"></div><div class="form-row"><label>Finding title</label><input id="pf-title-' + esc(pf.id) + '" type="text" value="PBE not serviceable or not accessible in cabin emergency equipment check"></div>' +
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
      'After Department Manager review, the Preliminary Report is released to the Service Provider only when CAP-required findings exist. The Final Report is prepared after the CAP completion window is completed.'
    ]
  },
  team: {
    title: '3. Inspection Team',
    body: [
      'Lead Inspector: John Lead Inspector.',
      'Inspector: John Inspector.',
      'Inspection team evidence and checklist inputs were consolidated into this preliminary report draft.'
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
      'The inspection may proceed from Preliminary Report release to the Service Provider CAP completion window when CAP-required findings exist.',
      'After the Service Provider completes CAP actions and submits evidence or closure response within the window, the Lead Inspector prepares the Final Report.',
      'After Final Report Issued, the CAP Process Starts and the applicable CAP closure clocks are visible to the service provider.'
    ]
  },
  approval: {
    title: '9. Approval Workflow',
    body: [
      'Inspector prepares the preliminary report and uploads supporting evidence.',
      'Lead Inspector Review can return the preliminary report to the Inspector for revision.',
      'Department Manager Review can return the package to the Lead Inspector.',
      'After Department Manager review, the Preliminary Report is released to the Service Provider if CAP-required findings exist.',
      'Service Provider CAP completion, evidence, and closure response are captured during the CAP window.',
      'After the Service Provider completes the CAP response within the due date, the Lead Inspector prepares the Final Report.',
      'Department Manager Final Approval sends the report to Executive Director / GM Approval.',
      'Executive Director / GM approval is required before Final Report Issued.',
      'After Final Report Issued, CAP Process Starts, Inspector verifies CAP, Lead Inspector recommends closure, and Department Manager approves closure.'
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
      section: 'galley',
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
      workflowVersion: 8,
      overallComment: '',
      rowReviews: {}
    };
  }
  if (!state.leadReviewUi.workflowVersion || state.leadReviewUi.workflowVersion < 8) {
    state.leadReviewUi.tab = 'report';
    state.leadReviewUi.reportSection = 'executive';
    state.leadReviewUi.downloadedAt = '';
    state.leadReviewUi.finalizedAt = '';
    state.leadReviewUi.reportGeneratedAt = '';
    state.leadReviewUi.reportDraftSavedAt = '';
    state.leadReviewUi.sentToUnitManagerAt = '';
  }
  state.leadReviewUi.workflowVersion = 8;
  if (!state.leadReviewUi.tab || state.leadReviewUi.tab === 'workflow') state.leadReviewUi.tab = 'report';
  if (!state.leadReviewUi.section || /^\d+\.$/.test(state.leadReviewUi.section)) state.leadReviewUi.section = 'galley';
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
    requirement: LEAD_REVIEW_REQUIREMENTS[row.id] || row.reference || 'Configured checklist requirement for this inspection section.',
    inspectorResponse: LEAD_REVIEW_RESPONSES[row.id] || (row.comment || 'Reviewed during the inspection.'),
    files: files.slice(),
    inspectorCommentCount: LEAD_REVIEW_INSPECTOR_COMMENT_COUNTS[row.id] || (row.comment ? row.comment.length : 0)
  });
}

function leadReviewPackage() {
  var requestedAuditId = state.params && state.params.auditId;
  return inspectionExecutionPackageForAudit(state, requestedAuditId || 'AUD-2026-001') || inspectionExecutionPackageForAudit(state, 'AUD-2026-001');
}

function leadReviewRowsForSection(sectionKey) {
  var pkg = leadReviewPackage();
  var section = pkg && pkg.sections.filter(function (item) { return item.key === sectionKey; })[0];
  var rows = section ? section.questions : [];
  return rows.map(leadReviewNormalizeRow);
}

function leadReviewAllRows() {
  var rows = [];
  var pkg = leadReviewPackage();
  (pkg ? pkg.sections : []).forEach(function (section) {
    rows = rows.concat(leadReviewRowsForSection(section.key));
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
  return row.status === 'noncompliant' ? 'return' : 'accept';
}

function leadReviewDefaultCommentForRow(row) {
  return row.status === 'noncompliant' ? 'Please provide supporting evidence or revise the checklist response.' : '';
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
      return '<button class="lead-attachment" data-act="lead-review-file-download" data-id="' + esc(row.id) + '" data-file="' + esc(file) + '" aria-label="Download mock attachment ' + esc(file) + '">' + esc(file) + '</button>';
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
  var pkg = leadReviewPackage();
  var sections = pkg ? pkg.sections : [];
  var activeSection = sections.filter(function (section) { return section.key === ui.section; })[0] || sections[0];
  if (!activeSection) return '<section class="lead-review-panel"><div class="empty">No submitted checklist package is available.</div></section>';
  var activeIndex = sections.indexOf(activeSection);
  var previousSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
  var nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;
  var rows = leadReviewRowsForSection(activeSection.key).map(function (row) {
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
      '<h2>' + esc(String(activeSection.order) + '. ' + activeSection.label) + '</h2>' +
      '<div>' + esc(activeSection.completed + ' / ' + activeSection.total) + ' Completed <span>&#8964;</span></div>' +
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
  var text = 'The Lead Inspector finalizes the report after Service Provider comments. After Executive Director / GM approval, the final report is issued to the service provider and the CAP Process Starts.';
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
    '<p class="lead-review-muted">Checklist summary, findings summary, CAP summary, evidence index, and preliminary report draft are attached to the approval package.</p>' +
    '<div class="mt-16">' + leadReportDocumentsHtml() + '</div>' +
  '</section>';
}

function leadReportSubmitted(report, ui) {
  if (ui && ui.sentToUnitManagerAt) return true;
  var summary = report ? approvalSummary(report) : null;
  return !!(summary && summary.currentIndex > 0);
}

function displayReportTypeLabel(report) {
  if (typeof reportTypeLabel === 'function') return reportTypeLabel(report);
  return report && report.reportType ? report.reportType : 'Report';
}

function displayReportTypeTone(report) {
  if (typeof reportTypeTone === 'function') return reportTypeTone(report);
  return displayReportTypeLabel(report) === 'Final Report' ? 'ok' : 'info';
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
    leadWorkflowStep('Inspector', 'Preliminary Report prepared', 'ok', '&#10003;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Lead Inspector Review', 'Revise -> Inspector if needed', 'ok', '&#10003;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Department Manager Review', 'Release if CAP required', sent ? 'warn' : 'neutral', '&#9711;', sent) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Service Provider CAP', 'Complete before Final Report', 'neutral', '&#9711;', false) +
    '<span class="lead-workflow-arrow">&rarr;</span>' +
    leadWorkflowStep('Final Report Preparation', 'After CAP completion', 'neutral', '&#9998;', false) +
  '</div>';
}

function leadReportCurrentReviewHtml(report, ui) {
  var sent = leadReportSubmitted(report, ui);
  var comment = ui.workflowComment || '-';
  var rows = [
    { level: '1', reviewer: 'Lead Inspector Review', role: 'Lead Inspector', status: sent ? 'Completed' : 'In Progress', tone: sent ? 'ok' : 'warn', date: sent ? fmtDate(DEMO_TODAY) : '-', comment: sent ? comment : '-' },
    { level: '2', reviewer: 'Department Manager Review', role: 'Department Manager', status: sent ? 'In Review' : 'Pending', tone: sent ? 'info' : 'neutral', date: sent ? fmtDate(DEMO_TODAY) : '-', comment: sent ? 'Release to Service Provider only if CAP is required' : '-' },
    { level: '3', reviewer: 'Service Provider CAP Completion', role: 'Service Provider', status: 'Pending', tone: 'neutral', date: '-', comment: 'Complete CAP actions and submit evidence / closure response' },
    { level: '4', reviewer: 'Lead Inspector Finalization', role: 'Lead Inspector', status: 'Pending', tone: 'neutral', date: '-', comment: 'Prepare Final Report after CAP completion' },
    { level: '5', reviewer: 'Executive Director / GM Approval', role: 'Executive Director / GM', status: 'Pending', tone: 'neutral', date: '-', comment: 'Required before Final Report Issued' }
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
    ['Inspector', 'Preliminary Report + evidence', 'Completed', 'done'],
    ['Preliminary Report', 'Submitted for lead review', 'Completed', 'done'],
    ['Lead Inspector Review', 'Revise -> Inspector', sent ? 'Completed' : 'In Progress', sent ? 'done' : 'active'],
    ['Department Manager Review', 'Release if CAP required', sent ? 'In Review' : 'Pending', sent ? 'active' : 'pending'],
    ['Preliminary Report Released', 'Notify Service Provider for CAP', 'Pending', 'pending'],
    ['Service Provider CAP Completion', 'CAP evidence / closure response due', 'Pending', 'pending'],
    ['Lead Inspector Finalizes Report', 'Prepare after CAP completion', 'Pending', 'pending'],
    ['Department Manager Final Approval', 'Approves to ED/GM', 'Pending', 'pending'],
    ['Executive Director / GM Approval', 'Required before issue', 'Pending', 'pending'],
    ['Final Report Issued', 'Released to service provider', 'Pending', 'pending'],
    ['CAP Process Starts', 'After final issue', 'Pending', 'pending'],
    ['Inspector verifies CAP', 'Evidence verification', 'Pending', 'pending'],
    ['Lead Inspector recommends closure', 'Closure recommendation', 'Pending', 'pending'],
    ['Department Manager approves closure', 'Finding closure decision', 'Pending', 'pending']
  ];
  return '<div class="lead-side-card lead-approval-side"><h2>Approval Workflow</h2>' +
    '<div class="lead-approval-steps">' + steps.map(function (step) {
      return '<div class="lead-approval-step is-' + esc(step[3]) + '">' +
        '<span class="lead-approval-step__dot"></span><div><b>' + esc(step[0]) + '</b>' +
        (step[1] ? '<small>' + esc(step[1]) + '</small>' : '') +
        '<em>' + esc(step[2]) + '</em></div></div>';
    }).join('') + '</div>' +
    '<p class="lead-review-muted mt-12">After Department Manager review, the Preliminary Report goes to the Service Provider only if CAP is required. When the provider completes CAP within the window, the Lead Inspector prepares the Final Report.</p>' +
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
      leadFinalReportFindingsOverviewHtml() +
    '</main>' +
    '<aside class="lead-final-side">' + leadApprovalWorkflowSideHtml(report, ui) + leadCapDeadlinesCardHtml() + leadReferencesCardHtml() + '</aside>' +
  '</div>' +
  '<div class="lead-final-bottom">' +
    '<button class="btn" data-act="lead-report-section" data-id="executive">← Previous</button>' +
    '<div><button class="btn" data-act="lead-report-save-draft" data-id="INS-2026-015">▣ Save Draft</button>' +
    '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>➤ ' + esc(sent ? 'Submitted to Department Manager' : 'Submit to Department Manager') + '</button></div>' +
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
    ['Compliance Rating', ui.reportRating || 'Acceptable with CAP'],
    ['Risk Level', ui.reportRisk || 'Medium'],
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
    '</tbody></table></div><p class="lead-review-muted mt-12">Enforcement approval is handled through the configured high-risk governance route; it is not automatic.</p></div>';
}

function leadReportWorkflowPanelHtml(report) {
  var ui = leadReviewUiState();
  var sent = leadReportSubmitted(report, ui);
  var comment = ui.workflowComment || '';
  return '<div class="lead-workflow-layout">' +
    '<div class="lead-workflow-main">' +
      '<section class="lead-review-panel lead-workflow-card">' +
        '<div class="lead-workflow-card__head"><h2>Report Approval Workflow</h2><p>The Preliminary Report is reviewed by the Department Manager, released to the Service Provider only if CAP is required, and finalized after the provider completes the CAP response in the defined window.</p></div>' +
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
        '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>&#10148; ' + esc(sent ? 'Sent to Department Manager' : 'Send to Department Manager') + '</button>' +
      '</div>' +
    '</div>' +
    '<aside class="lead-workflow-side">' + leadEnforcementMechanismHtml() + '</aside>' +
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

var LEAD_ASSIGNED_AUDIT_TOTAL = 18;

function leadAssignedAuditDefaultUi() {
  return {
    query: '',
    status: 'all',
    department: 'all',
    auditType: 'all',
    risk: 'all',
    due: 'all',
    stage: 'all',
    advanced: false,
    appliedAt: ''
  };
}

function leadAssignedAuditsUiState() {
  if (!state.leadAssignedAuditsUi) state.leadAssignedAuditsUi = {};
  state.leadAssignedAuditsUi = Object.assign(leadAssignedAuditDefaultUi(), state.leadAssignedAuditsUi || {});
  if (!state.leadAssignedAuditsUi.query) state.leadAssignedAuditsUi.query = '';
  state.leadAssignedAuditsUi.status = 'all';
  if (!state.leadAssignedAuditsUi.department) state.leadAssignedAuditsUi.department = 'all';
  if (!state.leadAssignedAuditsUi.auditType) state.leadAssignedAuditsUi.auditType = 'all';
  if (!state.leadAssignedAuditsUi.risk) state.leadAssignedAuditsUi.risk = 'all';
  if (!state.leadAssignedAuditsUi.due) state.leadAssignedAuditsUi.due = 'all';
  if (!state.leadAssignedAuditsUi.stage) state.leadAssignedAuditsUi.stage = 'all';
  state.leadAssignedAuditsUi.advanced = !!state.leadAssignedAuditsUi.advanced;
  return state.leadAssignedAuditsUi;
}

function leadAssignedAuditRows() {
  return [
    { id: 'AUD-2025-045', detailAuditId: 'AUD-2026-001', operator: 'Fly Namibia', department: 'OPS', departmentTone: 'info', auditType: 'Cabin Inspection', auditTypeKey: 'cabin-inspection', risk: 'High', riskTone: 'high', dates: ['15 Jun 2026', '15 Jun 2026'], status: 'In Progress', statusKey: 'in-progress', statusTone: 'info', progress: 75, dueDate: '15 Jun 2026', dueStage: 'Checklist Execution', stageKey: 'checklist-execution', dueKey: 'due-soon' },
    { id: 'AUD-2025-038', detailAuditId: 'AUD-2026-005', operator: 'National Airways Corp', department: 'PEL', departmentTone: 'ok', auditType: 'Certification', auditTypeKey: 'certification', risk: 'Medium', riskTone: 'medium', dates: ['05 May 2025', '09 May 2025'], status: 'Draft Report', statusKey: 'draft-report', statusTone: 'draft', progress: 60, dueDate: '25 May 2025', dueStage: 'Preliminary Report', stageKey: 'preliminary-report', dueKey: 'due-soon' },
    { id: 'AUD-2025-031', detailAuditId: 'AUD-2026-005', operator: 'Skyline Aviation (Pty) Ltd', department: 'AIR', departmentTone: 'teal', auditType: 'Ramp Inspection', auditTypeKey: 'ramp-inspection', risk: 'High', riskTone: 'high', dates: ['28 Apr 2025', '30 Apr 2025'], status: 'Pending Approval', statusKey: 'pending-approval', statusTone: 'pending', progress: 90, dueDate: '22 May 2025', dueStage: 'Dept. Review', stageKey: 'department-review', dueKey: 'due-soon' },
    { id: 'AUD-2025-019', detailAuditId: 'AUD-2026-005', operator: 'Desert Air Maintenance', department: 'AIR', departmentTone: 'teal', auditType: 'Continued Airworthiness', auditTypeKey: 'continued-airworthiness', risk: 'Medium', riskTone: 'medium', dates: ['14 Apr 2025', '17 Apr 2025'], status: 'In Progress', statusKey: 'in-progress', statusTone: 'info', progress: 40, dueDate: '26 May 2025', dueStage: 'Evidence Review', stageKey: 'evidence-review', dueKey: 'due-soon' },
    { id: 'AUD-2025-012', detailAuditId: 'AUD-2026-005', operator: 'NamAir Connect', department: 'ANS', departmentTone: 'warn', auditType: 'Service Provider Audit', auditTypeKey: 'service-provider-audit', risk: 'Low', riskTone: 'low', dates: ['07 Apr 2025', '11 Apr 2025'], status: 'Draft Report', statusKey: 'draft-report', statusTone: 'draft', progress: 55, dueDate: '24 May 2025', dueStage: 'Preliminary Report', stageKey: 'preliminary-report', dueKey: 'due-soon' },
    { id: 'AUD-2025-007', detailAuditId: 'AUD-2026-005', operator: 'Fly Namibia', department: 'OPS', departmentTone: 'info', auditType: 'Regular Surveillance', auditTypeKey: 'regular-surveillance', risk: 'High', riskTone: 'high', dates: ['31 Mar 2025', '04 Apr 2025'], status: 'Overdue', statusKey: 'overdue', statusTone: 'overdue', progress: 80, dueDate: '15 May 2025', dueStage: 'Findings Review', stageKey: 'findings-review', dueKey: 'overdue' },
    { id: 'AUD-2025-003', detailAuditId: 'AUD-2026-005', operator: 'Aero Taxi Services', department: 'OPS', departmentTone: 'info', auditType: 'Focused Inspection', auditTypeKey: 'focused-inspection', risk: 'Medium', riskTone: 'medium', dates: ['24 Mar 2025', '25 Mar 2025'], status: 'In Progress', statusKey: 'in-progress', statusTone: 'info', progress: 30, dueDate: '27 May 2025', dueStage: 'Evidence Review', stageKey: 'evidence-review', dueKey: 'due-soon' },
    { id: 'AUD-2025-001', detailAuditId: 'AUD-2026-005', operator: 'Aviation Training Academy', department: 'PEL', departmentTone: 'ok', auditType: 'Certification', auditTypeKey: 'certification', risk: 'Low', riskTone: 'low', dates: ['20 Mar 2025', '21 Mar 2025'], status: 'Pending Approval', statusKey: 'pending-approval', statusTone: 'pending', progress: 95, dueDate: '21 May 2025', dueStage: 'Final Review', stageKey: 'final-review', dueKey: 'due-soon' }
  ];
}

function leadAssignedAuditFilteredRows(ui) {
  var query = (ui.query || '').toLowerCase().trim();
  return leadAssignedAuditRows().filter(function (row) {
    var text = [row.id, row.operator, row.department, row.auditType, row.risk, row.dates.join(' '), String(row.progress)].join(' ').toLowerCase();
    if (query && text.indexOf(query) === -1) return false;
    if (ui.department !== 'all' && row.department !== ui.department) return false;
    if (ui.auditType !== 'all' && row.auditTypeKey !== ui.auditType) return false;
    if (ui.risk !== 'all' && row.riskTone !== ui.risk) return false;
    if (ui.due !== 'all' && row.dueKey !== ui.due) return false;
    if (ui.stage !== 'all' && row.stageKey !== ui.stage) return false;
    return true;
  });
}

function leadAssignedOptions(options, selected) {
  return options.map(function (option) {
    return '<option value="' + esc(option.value) + '"' + (option.value === selected ? ' selected' : '') + '>' + esc(option.label) + '</option>';
  }).join('');
}

function leadAssignedKpiCard(title, value, suffix, percent, tone, icon) {
  return '<article class="lead-assigned-card is-' + esc(tone) + '">' +
    '<div class="lead-assigned-card__icon">' + esc(icon) + '</div>' +
    '<div class="lead-assigned-card__body">' +
      '<span>' + esc(title) + '</span>' +
      '<strong>' + esc(value) + '</strong><em>' + esc(suffix) + '</em>' +
      '<small>' + esc(String(percent)) + '% of all</small>' +
      '<div class="lead-assigned-card__bar"><i style="width:' + esc(String(percent)) + '%"></i></div>' +
    '</div>' +
  '</article>';
}

function leadAssignedFiltersHtml(ui) {
  var departmentOptions = leadAssignedOptions([
    { value: 'all', label: 'All Departments' },
    { value: 'OPS', label: 'OPS' },
    { value: 'PEL', label: 'PEL' },
    { value: 'AIR', label: 'AIR' },
    { value: 'ANS', label: 'ANS' }
  ], ui.department);
  var auditTypeOptions = leadAssignedOptions([
    { value: 'all', label: 'All Types' },
    { value: 'regular-surveillance', label: 'Regular Surveillance' },
    { value: 'cabin-inspection', label: 'Cabin Inspection' },
    { value: 'certification', label: 'Certification' },
    { value: 'ramp-inspection', label: 'Ramp Inspection' },
    { value: 'continued-airworthiness', label: 'Continued Airworthiness' },
    { value: 'service-provider-audit', label: 'Service Provider Audit' },
    { value: 'focused-inspection', label: 'Focused Inspection' }
  ], ui.auditType);
  var riskOptions = leadAssignedOptions([
    { value: 'all', label: 'All Levels' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ], ui.risk);
  var dueOptions = leadAssignedOptions([
    { value: 'all', label: 'All Due Dates' },
    { value: 'due-soon', label: 'Due Soon' },
    { value: 'overdue', label: 'Overdue' }
  ], ui.due);
  var stageOptions = leadAssignedOptions([
    { value: 'all', label: 'All Stages' },
    { value: 'findings-review', label: 'Findings Review' },
    { value: 'preliminary-report', label: 'Preliminary Report' },
    { value: 'department-review', label: 'Department Review' },
    { value: 'evidence-review', label: 'Evidence Review' },
    { value: 'final-review', label: 'Final Review' }
  ], ui.stage);
  return '<div class="lead-assigned-filterbar">' +
    '<label class="lead-assigned-filter lead-assigned-filter--search"><span>Search audits</span><input type="search" data-field="lead-assigned-query" value="' + esc(ui.query || '') + '" placeholder="Search audits..."></label>' +
    '<label class="lead-assigned-filter"><span>Department</span><select data-field="lead-assigned-department">' + departmentOptions + '</select></label>' +
    '<label class="lead-assigned-filter"><span>Audit Type</span><select data-field="lead-assigned-audit-type">' + auditTypeOptions + '</select></label>' +
    '<label class="lead-assigned-filter"><span>Risk Level</span><select data-field="lead-assigned-risk">' + riskOptions + '</select></label>' +
    '<div class="lead-assigned-filter-actions">' +
      '<button class="btn" data-act="lead-assigned-more-filters">⌁ More Filters</button>' +
      '<button class="btn" data-act="lead-assigned-reset">Reset</button>' +
      '<button class="btn btn--primary" data-act="lead-assigned-apply">Apply Filters</button>' +
    '</div>' +
    (ui.advanced ? '<div class="lead-assigned-advanced">' +
      '<label class="lead-assigned-filter"><span>Due Window</span><select data-field="lead-assigned-due">' + dueOptions + '</select></label>' +
      '<label class="lead-assigned-filter"><span>Report Stage</span><select data-field="lead-assigned-stage">' + stageOptions + '</select></label>' +
    '</div>' : '') +
  '</div>';
}

function leadAssignedTableHtml(rows, filteredCount) {
  var visibleRows = rows.slice(0, 8);
  var totalLabel = filteredCount === leadAssignedAuditRows().length ? LEAD_ASSIGNED_AUDIT_TOTAL : filteredCount;
  var body = visibleRows.length ? visibleRows.map(function (row) {
    return '<tr>' +
      '<td><input type="checkbox" aria-label="Select ' + esc(row.id) + '"></td>' +
      '<td><button class="lead-audit-link" data-act="nav" data-view="lead-assignment" data-id="' + esc(row.detailAuditId) + '">' + esc(row.id) + '</button></td>' +
      '<td><b>' + esc(row.operator) + '</b></td>' +
      '<td><span class="lead-department-pill is-' + esc(row.departmentTone) + '">' + esc(row.department) + '</span></td>' +
      '<td>' + esc(row.auditType) + '</td>' +
      '<td><span class="lead-risk-pill is-' + esc(row.riskTone) + '">' + esc(row.risk) + '</span></td>' +
      '<td>' + esc(row.dates[0]) + '<br><span>' + esc(row.dates[1]) + '</span></td>' +
      '<td><div class="lead-progress-cell"><span>' + esc(String(row.progress)) + '%</span><div class="lead-progress"><i class="is-' + esc(row.riskTone) + '" style="width:' + esc(String(row.progress)) + '%"></i></div></div></td>' +
      '<td><div class="lead-row-actions">' +
        '<button class="iconbtn iconbtn--small" data-act="nav" data-view="lead-assignment" data-id="' + esc(row.detailAuditId) + '" aria-label="Open ' + esc(row.id) + '">◎</button>' +
      '</div></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="9"><div class="empty">No assigned audits match the current filters.</div></td></tr>';

  return '<section class="lead-assigned-table-panel">' +
    '<div class="lead-assigned-table-wrap"><table class="lead-assigned-table"><thead><tr>' +
      '<th><input type="checkbox" aria-label="Select all visible audits"></th><th>Audit No. <span>↕</span></th><th>Operator / Organisation</th><th>Department <span>↕</span></th><th>Audit Type</th><th>Risk Level <span>↕</span></th><th>Audit Dates<br><small>Start - End</small></th><th>Progress <span>↕</span></th><th>Actions</th>' +
    '</tr></thead><tbody>' + body + '</tbody></table></div>' +
    '<div class="lead-assigned-table-foot">' +
      '<span>Showing 1 to ' + esc(String(visibleRows.length)) + ' of ' + esc(String(totalLabel)) + ' audits</span>' +
      '<div class="lead-assigned-pager"><span>Rows per page: <b>10</b></span><button disabled>‹‹</button><button disabled>‹</button><button class="is-active">1</button><button>2</button><button>›</button><button>››</button></div>' +
    '</div>' +
  '</section>';
}

function leadAssignmentAuditId() {
  return (state.params && state.params.auditId) || 'AUD-2026-001';
}

function leadAssignmentDefaultUi() {
  return {
    activeInspectorUserId: 'USR-AYLIN',
    selectedQuestionIds: {
      'CAB-Q001': true,
      'CAB-Q002': true,
      'CAB-Q003': true,
      'CAB-Q004': true
    },
    assignmentsByQuestionId: {},
    dueDate: '2026-06-15',
    priority: 'Normal',
    instructions: '',
    department: 'Cabin Safety',
    section: 'emergency-equipment',
    risk: 'all',
    status: 'all',
    query: '',
    assignedAt: '',
    draftSavedAt: '',
    releasedAt: '',
    downloadedAt: ''
  };
}

function leadAssignmentUiState() {
  var auditId = leadAssignmentAuditId();
  if (!state.leadAssignmentsByAudit) state.leadAssignmentsByAudit = {};
  state.leadAssignmentsByAudit[auditId] = Object.assign(leadAssignmentDefaultUi(), state.leadAssignmentsByAudit[auditId] || {});
  var ui = state.leadAssignmentsByAudit[auditId];
  if (!ui.selectedQuestionIds || typeof ui.selectedQuestionIds !== 'object') ui.selectedQuestionIds = {};
  if (!ui.assignmentsByQuestionId || typeof ui.assignmentsByQuestionId !== 'object') ui.assignmentsByQuestionId = {};
  if (!ui.activeInspectorUserId) ui.activeInspectorUserId = 'USR-AYLIN';
  return ui;
}

function leadAssignmentTeam() {
  var auditId = leadAssignmentAuditId();
  return (state.inspectionTeams || []).filter(function (team) { return team.auditId === auditId; })[0] || null;
}

function leadAssignmentInspectors() {
  var team = leadAssignmentTeam();
  var memberIds = team && Array.isArray(team.memberIds) ? team.memberIds : [];
  var assignment = leadAssignmentUiState();
  var tones = ['blue', 'green', 'amber', 'purple', 'teal'];
  return (state.users || []).filter(function (user) {
    return memberIds.indexOf(user.id) !== -1 && user.roleKey === 'inspector' && user.status === 'Active' && user.org === '—';
  }).map(function (user, index) {
    var assigned = Object.keys(assignment.assignmentsByQuestionId).filter(function (questionId) {
      return assignment.assignmentsByQuestionId[questionId].inspectorUserId === user.id;
    }).length;
    return { id: user.id, name: user.name, initials: user.name.split(/\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2), unit: user.department, assigned: assigned, tone: tones[index % tones.length] };
  });
}

function leadAssignmentAvailableInspectors() {
  var team = leadAssignmentTeam();
  var memberIds = team && Array.isArray(team.memberIds) ? team.memberIds : [];
  return (state.users || []).filter(function (user) {
    return user.roleKey === 'inspector' && user.status === 'Active' && user.org === '—' && memberIds.indexOf(user.id) === -1;
  }).map(function (user) {
    return { id: user.id, name: user.name, initials: user.name.split(/\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2), unit: user.department, assigned: 0, tone: 'teal' };
  });
}

function leadAssignmentQuestions() {
  return [
    { id: 'CAB-Q001', no: 1, text: 'Is PBE serviceable and accessible in the required cabin position?', risk: 'High', riskKey: 'high', section: 'Emergency Equipment', sectionKey: 'emergency-equipment' },
    { id: 'CAB-Q002', no: 2, text: 'Are fire extinguishers within inspection date and correctly secured?', risk: 'High', riskKey: 'high', section: 'Emergency Equipment', sectionKey: 'emergency-equipment' },
    { id: 'CAB-Q003', no: 3, text: 'Are oxygen bottles serviceable, secured, and pressure checked?', risk: 'Medium', riskKey: 'medium', section: 'Emergency Equipment', sectionKey: 'emergency-equipment' },
    { id: 'CAB-Q004', no: 4, text: 'Are emergency lights and exit signs serviceable?', risk: 'Medium', riskKey: 'medium', section: 'Emergency Equipment', sectionKey: 'emergency-equipment' },
    { id: 'CAB-Q005', no: 5, text: 'Are galley latches, carts, and stowage areas secured?', risk: 'Low', riskKey: 'low', section: 'Galley', sectionKey: 'galley' },
    { id: 'CAB-Q006', no: 6, text: 'Are lavatory smoke detectors and placards serviceable?', risk: 'High', riskKey: 'high', section: 'Lavatories', sectionKey: 'lavatories' },
    { id: 'CAB-Q007', no: 7, text: 'Are passenger seats, belts, and placards in acceptable condition?', risk: 'Medium', riskKey: 'medium', section: 'Passenger Seats', sectionKey: 'passenger-seats' },
    { id: 'CAB-Q008', no: 8, text: 'Are crew seats and restraints serviceable?', risk: 'Low', riskKey: 'low', section: 'Video + Crew Seat', sectionKey: 'video-crew-seat' },
    { id: 'CAB-Q009', no: 9, text: 'Are exits unobstructed and correctly placarded?', risk: 'High', riskKey: 'high', section: 'Cockpit, Cabin Condition + Exits', sectionKey: 'cockpit-cabin-exits' },
    { id: 'CAB-Q010', no: 10, text: 'Is general cabin condition acceptable for the inspection scope?', risk: 'Medium', riskKey: 'medium', section: 'Cockpit, Cabin Condition + Exits', sectionKey: 'cockpit-cabin-exits' }
  ];
}

function leadAssignmentSelectedQuestionIds(ui) {
  return Object.keys(ui.selectedQuestionIds || {}).filter(function (id) { return !!ui.selectedQuestionIds[id]; });
}

function leadAssignmentOptions(options, selected) {
  return options.map(function (option) {
    return '<option value="' + esc(option.value) + '"' + (option.value === selected ? ' selected' : '') + '>' + esc(option.label) + '</option>';
  }).join('');
}

function leadAssignmentStatusLabel(ui) {
  if (ui.releasedAt) return 'Released to Inspectors';
  if (ui.assignedAt) return 'Draft Assignment Saved';
  return 'Not Started';
}

function leadAssignmentSummaryStatus(ui) {
  if (ui.releasedAt) return 'Inspectors notified; execution can begin.';
  if (ui.assignedAt) return 'Checklist assignment draft updated.';
  return 'Checklist not yet assigned to inspectors';
}

function leadAssignmentStepperHtml(ui) {
  var released = !!ui.releasedAt;
  var steps = [
    { label: 'Planning', state: 'Completed', tone: 'done', icon: '✓' },
    { label: 'Approval', state: 'Completed', tone: 'done', icon: '✓' },
    { label: 'Assignment', state: released ? 'Completed' : 'In Progress', tone: released ? 'done' : 'active', icon: '☷' },
    { label: 'Execution', state: released ? 'Ready' : 'Pending', tone: released ? 'active' : 'pending', icon: '▤' }
  ];
  return '<div class="lead-assignment-stepper">' + steps.map(function (step) {
    return '<div class="lead-assignment-step is-' + esc(step.tone) + '">' +
      '<span>' + esc(step.icon) + '</span>' +
      '<b>' + esc(step.label) + '</b>' +
      '<small>' + esc(step.state) + '</small>' +
    '</div>';
  }).join('') + '</div>';
}

function leadAssignmentOverviewRow(icon, label, value, note, buttonHtml) {
  return '<div class="lead-assignment-overview-row">' +
    '<span class="lead-assignment-row-icon">' + esc(icon) + '</span>' +
    '<div><small>' + esc(label) + '</small><b>' + esc(value) + '</b>' + (note ? '<p>' + esc(note) + '</p>' : '') + '</div>' +
    (buttonHtml || '') +
  '</div>';
}

function leadAssignmentMetricCard(title, value, sub, tone, icon) {
  return '<article class="lead-assignment-metric is-' + esc(tone) + '">' +
    '<span>' + esc(icon) + '</span>' +
    '<div><small>' + esc(title) + '</small><b>' + esc(String(value)) + '</b><p>' + esc(sub) + '</p></div>' +
  '</article>';
}

function leadAssignmentInspectorAvatar(userId) {
  var inspector = leadAssignmentInspectors().filter(function (item) { return item.id === userId; })[0];
  if (!inspector) return '<span class="lead-assignment-avatar is-muted">-</span>';
  return '<span class="lead-assignment-avatar is-' + esc(inspector.tone) + '">' + esc(inspector.initials) + '</span>';
}

function leadAssignmentInspectorName(userId) {
  var inspector = (state.users || []).filter(function (user) { return user.id === userId; })[0];
  return inspector ? inspector.name : 'Unassigned';
}

function leadAssignmentMetrics(ui) {
  var total = leadAssignmentQuestions().length;
  var assigned = Object.keys(ui.assignmentsByQuestionId || {}).filter(function (questionId) {
    return leadAssignmentQuestions().some(function (row) { return row.id === questionId; });
  }).length;
  var inspectors = leadAssignmentInspectors();
  var workloads = inspectors.map(function (inspector) { return inspector.assigned; });
  var spread = workloads.length ? Math.max.apply(Math, workloads) - Math.min.apply(Math, workloads) : 0;
  return {
    total: total,
    assigned: assigned,
    unassigned: Math.max(0, total - assigned),
    assignedPercent: total ? Math.round((assigned / total) * 100) : 0,
    inspectorCount: inspectors.length,
    workload: spread <= 2 ? 'Balanced' : 'Review balance'
  };
}

function viewLeadAssignmentWorkspace() {
  var ui = leadAssignmentUiState();
  var auditId = (state.params && state.params.auditId) || 'AUD-2026-001';
  var assignmentLabel = leadAssignmentStatusLabel(ui);
  var metrics = leadAssignmentMetrics(ui);
  return '<div class="lead-assignment-page">' +
    '<button class="lead-assignment-back" data-act="nav" data-view="lead-review">&larr; Back to Assigned Audits</button>' +
    '<div class="lead-assignment-titlebar">' +
      '<div><h1>Cabin Inspection <span class="lead-assignment-approved">Approved</span></h1><p>AUD-2026-001</p></div>' +
      '<button class="btn" data-act="lead-assignment-preview-report">▣ View Preliminary Report</button>' +
    '</div>' +
    '<section class="lead-assignment-summary">' +
      '<div><small>Organization</small><b>Fly Namibia</b><small>Organization Type</small><b>Operator / Service Provider</b></div>' +
      '<div><small>Inspection Type</small><b>Cabin Inspection</b><small>Risk Category</small><span class="lead-risk-pill is-high">High</span></div>' +
      '<div><small>Inspection Dates</small><b>▣ 15 Jun 2026</b><small>Location</small><b>Fly Namibia aircraft cabin / on-site inspection</b></div>' +
      '<div><small>Planned By</small><b>Cabin Safety Oversight Department</b><small>Budget (Approved)</small><b>Demo only</b></div>' +
    '</section>' +
    leadAssignmentStepperHtml(ui) +
    '<div class="lead-assignment-grid">' +
      '<section class="lead-assignment-card lead-assignment-card--wide">' +
        '<h2>Assignment Overview</h2><p>Review audit details and manage team assignment.</p>' +
        leadAssignmentOverviewRow('▣', 'Checklist', 'Cabin Inspection Checklist', '126 source rows / 10 runnable questions', '<button class="btn btn--sm" data-act="lead-assignment-preview-checklist">Preview Checklist</button>') +
        leadAssignmentOverviewRow('▦', 'Sections in Scope', '6 Sections', 'Galley, lavatories, seats, emergency equipment and exits', '<button class="btn btn--sm" data-act="lead-assignment-view-details">View Details</button>') +
        leadAssignmentOverviewRow('☷', 'Team Size', metrics.inspectorCount + ' Inspectors', '1 Lead Inspector', '<button class="btn btn--sm" data-act="lead-assignment-view-team">View Team</button>') +
        leadAssignmentOverviewRow('!', 'Assignment Status', assignmentLabel, leadAssignmentSummaryStatus(ui), '<button class="btn btn--sm btn--primary" data-act="nav" data-view="lead-assignment-questions" data-id="' + esc(auditId) + '">' + esc(ui.assignedAt ? 'Continue Assignment' : 'Start Assignment') + '</button>') +
      '</section>' +
      '<section class="lead-assignment-card">' +
        '<h2>Inspection Scope</h2>' +
        '<div class="lead-assignment-scope-row"><span>Sections</span><b>6</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Locations</span><b>1</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Checklist Source</span><b>126 source rows</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Runnable Subset</span><b>10 runnable questions</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Estimated Duration</span><b>1 Day</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Inspectors</span><b>' + esc(String(metrics.inspectorCount)) + '</b></div>' +
        '<div class="lead-assignment-scope-row"><span>Lead Inspector</span><b>John Lead Inspector</b></div>' +
      '</section>' +
      '<section class="lead-assignment-card lead-assignment-next">' +
        '<h2>Next Steps</h2>' +
        '<button class="lead-assignment-next-row is-active" data-act="nav" data-view="lead-assignment-questions" data-id="' + esc(auditId) + '">' +
          '<span>☷</span><b>Assign Checklist Questions</b><small>Assign checklist questions to inspectors based on expertise and workload.</small><em>&rsaquo;</em>' +
        '</button>' +
        '<button class="lead-assignment-next-row" data-act="lead-assignment-guide">' +
          '<span>▣</span><b>Notify Inspectors</b><small>Inspectors will be notified once assignments are released.</small><em>&rsaquo;</em>' +
        '</button>' +
        '<button class="lead-assignment-next-row" data-act="lead-assignment-guide">' +
          '<span>▤</span><b>Begin Execution</b><small>Inspectors can start working on assigned questions.</small><em>&rsaquo;</em>' +
        '</button>' +
        '<button class="btn btn--primary btn--block" data-act="nav" data-view="lead-assignment-questions" data-id="' + esc(auditId) + '">☷ Assign Checklist Questions</button>' +
        '<button class="btn btn--block" data-act="lead-assignment-download">⇩ Download Assignment Plan</button>' +
      '</section>' +
    '</div>' +
    '<section class="lead-assignment-info">' +
      '<button class="is-active">Audit Information</button><button>Departments</button><button>Checklist Summary</button><button>Documents</button><button>History</button>' +
      '<div><span>Created By <b>Cabin Safety Oversight Department</b></span><span>Created On <b>15 Jun 2026 09:15</b></span><span>Last Updated <b>' + esc(ui.assignedAt ? '15 Jun 2026 14:20' : '15 Jun 2026 10:20') + '</b></span><span>Last Updated By <b>Mary Department Manager</b></span></div>' +
    '</section>' +
  '</div>';
}

function leadAssignmentFilteredQuestions(ui) {
  var query = (ui.query || '').toLowerCase().trim();
  return leadAssignmentQuestions().filter(function (row) {
    var assignedRecord = ui.assignmentsByQuestionId[row.id] || null;
    var assigned = assignedRecord ? leadAssignmentInspectorName(assignedRecord.inspectorUserId) : '';
    var status = assignedRecord ? 'assigned' : 'unassigned';
    if (ui.section !== 'all' && row.sectionKey !== ui.section) return false;
    if (ui.risk !== 'all' && row.riskKey !== ui.risk) return false;
    if (ui.status !== 'all' && status !== ui.status) return false;
    if (query && [row.text, row.risk, assigned, row.section].join(' ').toLowerCase().indexOf(query) === -1) return false;
    return true;
  });
}

function leadAssignmentQuestionRowsHtml(ui) {
  var rows = leadAssignmentFilteredQuestions(ui);
  return rows.map(function (row) {
    var selected = !!ui.selectedQuestionIds[row.id];
    var assignedRecord = ui.assignmentsByQuestionId[row.id] || null;
    var assignedTo = assignedRecord ? leadAssignmentInspectorName(assignedRecord.inspectorUserId) : '';
    var assignedHtml = assignedRecord ?
      '<span class="lead-assignment-assignee">' + leadAssignmentInspectorAvatar(assignedRecord.inspectorUserId) + esc(assignedTo) + '</span>' :
      '<span class="lead-assignment-unassigned">-</span>';
    return '<tr' + (selected ? ' class="is-selected"' : '') + '>' +
      '<td><input type="checkbox" data-field="lead-assignment-question" data-id="' + esc(row.id) + '"' + (selected ? ' checked' : '') + ' aria-label="Select question ' + esc(String(row.no)) + '"></td>' +
      '<td>' + esc(String(row.no)) + '.</td>' +
      '<td><span class="question-title">' + esc(row.text) + '</span></td>' +
      '<td><span class="lead-risk-pill is-' + esc(row.riskKey) + '">' + esc(row.risk) + '</span></td>' +
      '<td>' + assignedHtml + '</td>' +
    '</tr>';
  }).join('');
}

function viewLeadAssignmentQuestions() {
  var ui = leadAssignmentUiState();
  var auditId = (state.params && state.params.auditId) || 'AUD-2026-001';
  var inspectorMode = state.role === 'inspector';
  var selectedCount = leadAssignmentSelectedQuestionIds(ui).length;
  var inspectors = leadAssignmentInspectors();
  var metrics = leadAssignmentMetrics(ui);
  var inspectorOptions = leadAssignmentOptions(inspectors.map(function (inspector) {
    return { value: inspector.id, label: inspector.name };
  }), ui.activeInspectorUserId);
  var priorityOptions = leadAssignmentOptions([
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
  ], ui.priority);
  var departmentOptions = leadAssignmentOptions([
    { value: 'Cabin Safety', label: 'Cabin Safety' },
    { value: 'Emergency Equipment', label: 'Emergency Equipment' },
    { value: 'Cabin Condition', label: 'Cabin Condition' }
  ], ui.department);
  var sectionOptions = leadAssignmentOptions([
    { value: 'emergency-equipment', label: 'Emergency Equipment' },
    { value: 'galley', label: 'Galley' },
    { value: 'lavatories', label: 'Lavatories' },
    { value: 'passenger-seats', label: 'Passenger Seats' },
    { value: 'video-crew-seat', label: 'Video + Crew Seat' },
    { value: 'cockpit-cabin-exits', label: 'Cockpit, Cabin Condition + Exits' }
  ], ui.section);
  var riskOptions = leadAssignmentOptions([
    { value: 'all', label: 'All' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ], ui.risk);
  var statusOptions = leadAssignmentOptions([
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'unassigned', label: 'Unassigned' }
  ], ui.status);
  var noteLength = (ui.instructions || '').length;
  var activeInspectorName = leadAssignmentInspectorName(ui.activeInspectorUserId);
  return '<div class="lead-assignment-question-page">' +
    '<div class="lead-assignment-question-head">' +
      '<div><button class="lead-assignment-back" data-act="nav" data-view="' + esc(inspectorMode ? 'audit-detail' : 'lead-assignment') + '" data-id="' + esc(auditId) + '">&larr; ' + esc(inspectorMode ? 'Back to Inspection' : 'Back to Assignment Overview') + '</button><h1>' + esc(inspectorMode ? 'Inspector Question Workspace' : 'Assign Checklist Questions') + '</h1><p>' + esc(inspectorMode ? 'Review the submitted checklist package and assigned questions without routing every row through the Lead Inspector.' : 'Assign checklist questions to inspectors for this audit.') + '</p></div>' +
      '<button class="btn" data-act="lead-assignment-guide">' + esc(inspectorMode ? 'ⓘ Submitted Package Guide' : 'ⓘ Start Assignment Guide') + '</button>' +
    '</div>' +
    '<section class="lead-assignment-strip">' +
      '<span class="lead-assignment-strip-icon">▣</span>' +
      '<div><small>Inspection</small><b>Cabin Inspection</b><p>AUD-2026-001</p></div>' +
      '<div><small>Organization</small><b>Fly Namibia</b></div>' +
      '<div><small>Inspection Dates</small><b>▣ 15 Jun 2026</b></div>' +
      '<div><small>Lead Inspector</small><b>John Lead Inspector</b></div>' +
      '<div><small>Status</small><span class="lead-assignment-status">' + esc(ui.releasedAt ? 'Released' : (ui.assignedAt ? 'Assignment Draft' : 'Planning')) + '</span></div>' +
    '</section>' +
    '<div class="lead-assignment-metrics">' +
      leadAssignmentMetricCard('Checklist Items', String(metrics.total), 'Curated runnable questions', 'blue', '▣') +
      leadAssignmentMetricCard('Assigned', String(metrics.assigned), String(metrics.assignedPercent) + '%', 'green', '✓') +
      leadAssignmentMetricCard('Unassigned', String(metrics.unassigned), String(100 - metrics.assignedPercent) + '%', 'orange', '⌁') +
      leadAssignmentMetricCard('Inspectors', String(metrics.inspectorCount), 'Team Members', 'purple', '☷') +
      leadAssignmentMetricCard('Sections', '6', 'In Scope', 'teal', '▤') +
    '</div>' +
    '<div class="lead-assignment-workspace">' +
      '<aside class="lead-assignment-inspectors"><div class="lead-assignment-panel-head"><h2>Inspectors</h2>' + (inspectorMode ? '' : '<button data-act="lead-assignment-add-inspector">+ Add Inspector</button>') + '</div>' +
        inspectors.map(function (inspector) {
          var isActive = inspector.id === ui.activeInspectorUserId;
          return '<button class="lead-assignment-inspector' + (isActive ? ' is-active' : '') + '" data-act="lead-assignment-pick-inspector" data-id="' + esc(inspector.id) + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
            leadAssignmentInspectorAvatar(inspector.id) +
            '<span><b>' + esc(inspector.name) + '</b><small>' + esc(inspector.unit) + '</small><em>Assigned: ' + esc(String(inspector.assigned)) + ' questions</em><i style="width:' + esc(String(Math.max(8, inspector.assigned))) + '%"></i></span>' +
          '</button>';
        }).join('') +
        '<button class="lead-assignment-workload" data-act="lead-assignment-view-team">↗ View Workload Summary</button>' +
      '</aside>' +
      '<section class="lead-assignment-question-table-panel">' +
        '<div class="lead-assignment-question-filters responsive-filter-row">' +
          '<label><span>Department</span><select data-field="lead-assignment-department">' + departmentOptions + '</select></label>' +
          '<label><span>Section</span><select data-field="lead-assignment-section">' + sectionOptions + '</select></label>' +
          '<label><span>Risk Level</span><select data-field="lead-assignment-risk">' + riskOptions + '</select></label>' +
          '<label><span>Status</span><select data-field="lead-assignment-status">' + statusOptions + '</select></label>' +
          '<label class="lead-assignment-search"><span>Search</span><input type="search" data-field="lead-assignment-query" value="' + esc(ui.query || '') + '" placeholder="Search questions..."></label>' +
        '</div>' +
        '<div class="lead-assignment-table-wrap responsive-table-shell"><table class="lead-assignment-table assignment-question-table"><thead><tr><th><input type="checkbox" data-field="lead-assignment-select-visible" aria-label="Select visible questions"></th><th>No.</th><th>Checklist Item</th><th>Risk Level</th><th>Assigned To</th></tr></thead><tbody>' + leadAssignmentQuestionRowsHtml(ui) + '</tbody></table></div>' +
      '</section>' +
      '<aside class="lead-assignment-side">' +
        '<div class="lead-assignment-side-head"><h2>' + esc(inspectorMode ? 'Selected Questions' : 'Assign Selected') + ' (' + esc(String(selectedCount)) + ')</h2><button data-act="lead-assignment-clear-selection" aria-label="Clear selected questions">×</button></div>' +
        '<label><span>Assign To</span><select data-field="lead-assignment-assignee">' + inspectorOptions + '</select></label>' +
        '<label><span>Due Date</span><input type="date" data-field="lead-assignment-due" value="' + esc(ui.dueDate) + '"></label>' +
        '<label><span>Priority</span><select data-field="lead-assignment-priority">' + priorityOptions + '</select></label>' +
        '<label><span>Instructions <small>(Optional)</small></span><textarea maxlength="500" data-field="lead-assignment-note" placeholder="Add any specific instructions for the inspector...">' + esc(ui.instructions || '') + '</textarea></label>' +
        '<p>Characters: <span class="lead-assignment-note-count">' + esc(String(noteLength)) + '</span>/500</p>' +
        '<div class="lead-assignment-side-summary">' + (inspectorMode ? esc(String(selectedCount)) + ' questions selected for inspector review.' : esc(String(selectedCount)) + ' questions will be assigned to <b>' + esc(activeInspectorName) + '</b>') + '</div>' +
        '<button class="btn btn--primary btn--block" data-act="lead-assignment-assign"' + (selectedCount ? '' : ' disabled') + '>➤ ' + esc(inspectorMode ? 'Mark Selected for Review' : 'Assign Questions') + '</button>' +
      '</aside>' +
    '</div>' +
    '<div class="lead-assignment-bottom">' +
      '<section><h3>Assignment Summary</h3><div><span>Inspectors <b>' + esc(String(metrics.inspectorCount)) + '</b></span><span>Assigned <b>' + esc(String(metrics.assigned)) + '</b></span><span>Unassigned <b>' + esc(String(metrics.unassigned)) + '</b></span><span>Total <b>' + esc(String(metrics.total)) + '</b></span><span>Workload <b>' + esc(metrics.workload) + '</b></span></div></section>' +
      '<section><h3>Bulk Actions</h3><div class="lead-assignment-bulk"><button data-act="lead-assignment-bulk" data-mode="assign-section">Assign Section</button><button data-act="lead-assignment-bulk" data-mode="reassign">Reassign</button><button class="is-danger" data-act="lead-assignment-bulk" data-mode="remove">Remove Assignment</button><button data-act="lead-assignment-bulk" data-mode="export">Export Assignment</button></div></section>' +
      '<section class="lead-assignment-bottom-actions"><button class="btn" data-act="lead-assignment-save">Save Draft</button><button class="btn" data-act="lead-assignment-preview">◎ ' + esc(inspectorMode ? 'Preview Submitted Package' : 'Preview Assignment') + '</button><button class="btn btn--primary" data-act="lead-assignment-release">➤ ' + esc(inspectorMode ? 'Confirm Inspector Review' : 'Release to Inspectors') + '</button><p>' + esc(inspectorMode ? 'Inspector review remains in this workspace; Lead Inspector does not need to inspect each row one by one.' : 'Inspectors will be notified and can start working.') + '</p></section>' +
    '</div>' +
  '</div>';
}

function viewLeadAssignedAudits() {
  var ui = leadAssignedAuditsUiState();
  var rows = leadAssignedAuditFilteredRows(ui);
  var potentialPanel = leadPotentialDecisionRowsHtml((state.potentialFindings || []).slice().reverse());
  return '<div class="lead-assigned-page">' +
    '<div class="lead-assigned-crumb">Dashboard <span>›</span> <b>Assigned Audits</b></div>' +
    '<div class="lead-assigned-head">' +
      '<div><h1>Assigned Audits</h1><p>View and manage all audits assigned to you.</p></div>' +
      '<button class="btn btn--primary" data-act="lead-assigned-new">+ New Audit Assignment</button>' +
    '</div>' +
    '<div class="lead-assigned-kpis">' +
      leadAssignedKpiCard('Total Assigned', '18', 'Audits', 100, 'total', '▣') +
      leadAssignedKpiCard('In Progress', '9', 'Audits', 50, 'progress', '◷') +
      leadAssignedKpiCard('Reports', '4', 'Audits', 22, 'draft', '▤') +
      leadAssignedKpiCard('Pending Approval', '3', 'Audits', 17, 'pending', '➤') +
      leadAssignedKpiCard('Overdue', '2', 'Audits', 11, 'overdue', '!') +
    '</div>' +
    potentialPanel +
    leadAssignedFiltersHtml(ui) +
    leadAssignedTableHtml(rows, rows.length) +
    '<div class="lead-assigned-legend"><span><b class="is-high"></b>High Risk</span><span><b class="is-medium"></b>Medium Risk</span><span><b class="is-low"></b>Low Risk</span></div>' +
  '</div>';
}

function viewLeadReviewQueue() {
  var reviews = (state.leadAuditReviews || []).slice();
  var selectedAuditId = state.params && state.params.auditId;
  if (!selectedAuditId) return viewLeadAssignedAudits();
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
  var reportKind = displayReportTypeLabel(report);
  var reportTypeBadge = demoBadge('Report Type: ' + reportKind, displayReportTypeTone(report));
  var workflowBadge = sent ? demoBadge('Report Status: Submitted to Department Manager', 'info') : demoBadge('Report Status: Draft', 'ok');
  var previewLabel = reportKind === 'Final Report' ? '◎ Preview Final Report' : '◎ Preview Preliminary Report';
  var tabContent = '';
  if (activeTab === 'findings') tabContent = leadReviewFindingsPanelHtml(review);
  else if (activeTab === 'cap') tabContent = leadReviewCapPanelHtml();
  else if (activeTab === 'conclusion') tabContent = leadConclusionPanelHtml();
  else if (activeTab === 'appendices') tabContent = leadAppendicesPanelHtml();
  else tabContent = leadFinalReportPanelHtml(report);

  return '<div class="lead-review-page">' +
    '<div class="lead-final-breadcrumb"><button data-act="nav" data-view="lead-review">☰</button><span>Assigned Audits</span><span>/</span><span>INS-2026-015</span><span>/</span><b>Reports</b></div>' +
    '<div class="lead-review-head">' +
      '<div>' +
        '<h1>' + esc(reportKind) + ' - Routine Inspection</h1>' +
        '<div class="lead-review-title-meta lead-final-meta"><span>Inspection ID: <b>INS-2026-015</b></span><span>Organization: <b>SkyCargo Air</b></span><span>Dates: <b>15 - 18 Jun 2026</b></span><span>Lead Inspector: <b>John Lead Inspector</b></span>' + reportTypeBadge + workflowBadge + '</div>' +
        '<div class="inspection-status-line">' +
          (generated ? '<span class="inspection-save-state inspection-save-state--submitted">Report draft generated</span>' : '') +
          (saved ? '<span class="inspection-save-state">Draft saved</span>' : '') +
          (ui.downloadedAt ? '<span class="inspection-save-state">Draft downloaded</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="lead-review-actions">' +
        '<button class="btn" data-act="lead-report-preview" data-id="INS-2026-015">' + esc(previewLabel) + '</button>' +
        '<button class="btn" data-act="lead-report-save-draft" data-id="INS-2026-015">▣ Save Draft</button>' +
        '<button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="INS-2026-015"' + (sent ? ' disabled' : '') + '>➤ ' + esc(sent ? 'Submitted to Department Manager' : 'Submit to Department Manager') + '</button>' +
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
  var stage = approvalStage(report);
  var stageLabel = stage && stage.label ? stage.label : '';
  if (report.finalLocked) {
    return '<div class="decision-panel is-final"><div class="decision-panel__title">Final Report Locked</div>' +
      '<p class="small muted">Final report is non-editable in demo state. Final Report Issued happens after Executive Director / GM approval.</p></div>';
  }
  if (summary.ownerRole !== state.role) {
    return '<div class="decision-panel"><div class="decision-panel__title">Waiting for ' + esc(summary.ownerLabel) + '</div>' +
      '<p class="small muted">Current next action: ' + esc(summary.nextAction) + '.</p></div>';
  }
  var buttons = '';
  if (state.role === 'leadInspector') {
    buttons = /Finalization/i.test(stageLabel)
      ? reportDecisionButton(report, 'forward', 'Proceed to Final Report', null, true)
      : reportDecisionButton(report, 'forward', 'Submit Preliminary Report', null, true);
  } else if (state.role === 'manager') {
    if (/Final Approval/i.test(stageLabel)) {
      buttons =
        reportDecisionButton(report, 'approve', 'Approve Final Report to Executive Director / GM', 'ok') +
        reportDecisionButton(report, 'return', 'Return to Lead Inspector', 'danger') +
        reportDecisionButton(report, 'reject', 'Reject', 'danger');
    } else {
      buttons =
        reportDecisionButton(report, 'approve', 'Release Preliminary Report to Service Provider for CAP', 'ok') +
        reportDecisionButton(report, 'return', 'Return to Lead Inspector', 'danger') +
        reportDecisionButton(report, 'reject', 'Reject', 'danger');
    }
  } else if (state.role === 'gm') {
    buttons =
      reportDecisionButton(report, 'approve', 'Approve to ED', 'ok') +
      reportDecisionButton(report, 'return', 'Return to Department Manager', 'danger') +
      reportDecisionButton(report, 'reject', 'Reject', 'danger');
  } else if (state.role === 'executiveDirector') {
    buttons =
      reportDecisionButton(report, 'approve', 'Issue Final Report', 'ok') +
      reportDecisionButton(report, 'return', 'Return to Department Manager', 'danger') +
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

function preliminaryNoticeCardHtml(report) {
  var notice = report && report.preliminaryNotice;
  if (!notice) return '';
  return '<div class="card"><div class="card__head"><h3>Preliminary Report Notice</h3><span class="sub">Mock CAP completion window</span></div><div class="card__body">' +
    '<div class="metaline">' +
      metaItem('Report type', displayReportTypeLabel(report)) +
      metaItem('CAP required?', notice.capRequired ? 'Yes' : 'No') +
      metaItem('CAP required findings', notice.capRequiredCount !== undefined ? String(notice.capRequiredCount) : '-') +
      metaItem('Recipient', notice.recipient || 'Service Provider') +
      metaItem('Status', notice.status || 'Not released') +
      metaItem('Release trigger', notice.releaseTrigger || 'After Department Manager review, if CAP is required') +
      metaItem('CAP completion window', notice.responseWindow || '-') +
      metaItem('CAP due date', notice.responseDueDate ? fmtDate(notice.responseDueDate) : '-') +
      metaItem('Required action', notice.requiredAction || 'Submit factual comments and corrective response.') +
      metaItem('Completion rule', notice.completionRule || 'Final Report is prepared after CAP completion.') +
      metaItem('Late / no completion rule', notice.lateRule || 'Mark overdue and prepare Final Report with unresolved CAP noted.') +
    '</div>' +
    '<div class="callout mt-16"><b>Demo notification flow:</b> after Department Manager review, the Service Provider is notified only when CAP is required. Once the provider completes the CAP response within the window, the Lead Inspector prepares the Final Report.</div>' +
  '</div></div>';
}

function leadPreliminaryReportRows() {
  return state.managerReports.filter(function (report) {
    return normalizeReportType(report.reportType) === 'Preliminary Report';
  }).map(function (report) {
    var audit = auditById(report.auditId);
    var artifact = reportArtifactById(report.id, state);
    var linkedFindings = state.findings.filter(function (finding) { return finding.auditId === report.auditId; });
    var counts = linkedFindings.reduce(function (summary, finding) {
      if (finding.severity === 1) summary.critical += 1;
      else if (finding.severity === 2) summary.major += 1;
      else summary.observation += 1;
      return summary;
    }, { critical: 0, major: 0, observation: 0 });
    var statusMeta = leadPreliminaryStatusMeta(report.status);
    var updated = report.sharedAt || report.submittedAt || (report.history && report.history.length ? report.history[report.history.length - 1].at : '');
    var month = audit && audit.date ? MONTHS[parseInt(audit.date.split('-')[1], 10) - 1].toLowerCase() : 'all';
    return {
      id: report.id,
      auditId: report.auditId,
      approvalPackageId: report.approvalPackageId || '',
      completePackage: !!artifact && !!report.approvalPackageId,
      inspection: audit ? audit.type : report.reportType,
      organization: report.organization,
      dates: audit ? fmtDate(audit.date) : 'Not configured',
      status: report.status,
      statusLabel: statusMeta.label,
      owner: report.ownerRole ? roleName(report.ownerRole) : 'Read-only history',
      nextAction: report.ownerRole === 'leadInspector' ? 'Continue report' : (report.ownerRole === 'manager' ? 'Waiting for Department Manager' : 'View history'),
      updated: updated || 'Not recorded',
      period: month,
      findings: counts,
      projection: report,
      artifact: artifact
    };
  }).sort(function (left, right) { return right.updated.localeCompare(left.updated) || left.id.localeCompare(right.id); });
}

function leadPreliminaryReportById(id) {
  return leadPreliminaryReportRows().filter(function (row) { return row.id === id; })[0] || null;
}

function leadPreliminaryReportsUiState() {
  if (typeof ensureLeadPreliminaryReportsUi === 'function') return ensureLeadPreliminaryReportsUi();
  if (!state.leadPreliminaryReportsUi) {
    state.leadPreliminaryReportsUi = { query: '', status: 'all', organization: 'all', period: 'all' };
  }
  return state.leadPreliminaryReportsUi;
}

function leadPreliminaryStatusMeta(status) {
  var map = {
    draft: { label: 'Draft', tone: 'draft' },
    submitted: { label: 'Submitted', tone: 'submitted' },
    pending_manager: { label: 'Department Review', tone: 'submitted' },
    approved: { label: 'Approved', tone: 'approved' },
    released: { label: 'Released', tone: 'released' },
    released_to_service_provider: { label: 'Released to Service Provider', tone: 'released' },
    closed: { label: 'Closed', tone: 'approved' }
  };
  return map[status] || { label: humanStatus(status), tone: 'draft' };
}

function leadPreliminaryFilteredRows(ui) {
  var query = (ui.query || '').toLowerCase().trim();
  return leadPreliminaryReportRows().filter(function (row) {
    if (ui.status && ui.status !== 'all' && row.status !== ui.status) return false;
    if (ui.organization && ui.organization !== 'all' && row.organization !== ui.organization) return false;
    if (ui.period && ui.period !== 'all' && row.period !== ui.period) return false;
    if (!query) return true;
    return (row.id + ' ' + row.inspection + ' ' + row.organization).toLowerCase().indexOf(query) >= 0;
  });
}

function leadPreliminaryMetricCard(label, value, tone, iconName) {
  var icon = typeof navIconSvg === 'function'
    ? '<svg viewBox="0 0 24 24" focusable="false">' + navIconSvg(iconName || 'file-text') + '</svg>'
    : '';
  return '<article class="prelim-report-metric is-' + esc(tone) + '">' +
    '<div class="prelim-report-metric__icon">' + icon + '</div>' +
    '<div><span>' + esc(label) + '</span><strong>' + esc(String(value)) + '</strong></div>' +
  '</article>';
}

function leadPreliminaryMetricsHtml(rows) {
  function count(statuses) {
    return rows.filter(function (row) { return statuses.indexOf(row.status) !== -1; }).length;
  }
  return '<div class="prelim-report-metrics">' +
    leadPreliminaryMetricCard('Draft', count(['draft']), 'draft', 'file-text') +
    leadPreliminaryMetricCard('In Review', count(['submitted', 'pending_manager']), 'submitted', 'mail') +
    leadPreliminaryMetricCard('Approved', count(['approved']), 'approved', 'clipboard-check') +
    leadPreliminaryMetricCard('Released / Closed', count(['released', 'released_to_service_provider', 'closed']), 'released', 'calendar') +
    leadPreliminaryMetricCard('Total', rows.length, 'total', 'file-text') +
  '</div>';
}

function leadPreliminaryFiltersHtml(ui) {
  var organizations = leadPreliminaryReportRows().map(function (row) { return row.organization; }).filter(function (org, index, list) {
    return list.indexOf(org) === index;
  }).sort();
  var statusOptions = [
    ['all', 'All Status'],
    ['draft', 'Draft'],
    ['pending_manager', 'Department Review'],
    ['released_to_service_provider', 'Released to Service Provider'],
    ['closed', 'Closed']
  ].map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + (ui.status === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
  var orgOptions = '<option value="all"' + (ui.organization === 'all' ? ' selected' : '') + '>All Organizations</option>' +
    organizations.map(function (org) {
      return '<option value="' + esc(org) + '"' + (ui.organization === org ? ' selected' : '') + '>' + esc(org) + '</option>';
    }).join('');
  var periods = leadPreliminaryReportRows().map(function (row) { return row.period; }).filter(function (period, index, list) { return period !== 'all' && list.indexOf(period) === index; });
  var periodOptions = [['all', 'Date Range']].concat(periods.map(function (period) { return [period, period.toUpperCase()]; })).map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + (ui.period === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
  return '<div class="prelim-report-filters responsive-filter-row">' +
    '<label class="prelim-report-search"><span class="prelim-report-filter-icon">⌕</span><input type="search" data-field="preliminary-report-query" value="' + esc(ui.query || '') + '" placeholder="Search reports..."></label>' +
    '<label><span>Status</span><select data-field="preliminary-report-status">' + statusOptions + '</select></label>' +
    '<label><span>Organization</span><select data-field="preliminary-report-organization">' + orgOptions + '</select></label>' +
    '<label><span>Date</span><select data-field="preliminary-report-period">' + periodOptions + '</select></label>' +
    '<button class="btn btn--primary prelim-report-new" data-act="preliminary-report-open-package">Open Report Package</button>' +
  '</div>';
}

function leadPreliminaryFindingCountsHtml(counts) {
  return '<div class="prelim-finding-counts" aria-label="Finding counts">' +
    '<span class="is-critical"><b></b>' + esc(String(counts.critical)) + '</span>' +
    '<span class="is-major"><b></b>' + esc(String(counts.major)) + '</span>' +
    '<span class="is-observation"><b></b>' + esc(String(counts.observation)) + '</span>' +
  '</div>';
}

function leadPreliminaryTableHtml(rows, totalCount) {
  var visibleRows = rows.slice(0, 8);
  var body = visibleRows.length ? visibleRows.map(function (row) {
    var status = leadPreliminaryStatusMeta(row.status);
    return '<tr>' +
      '<td><button class="prelim-report-link" data-act="preliminary-report-open" data-id="' + esc(row.id) + '">' + esc(row.id) + '</button></td>' +
      '<td>' + esc(row.inspection) + '</td>' +
      '<td>' + esc(row.organization) + '</td>' +
      '<td>' + esc(row.dates) + '</td>' +
      '<td><span class="prelim-status is-' + esc(status.tone) + '">' + esc(status.label) + '</span></td>' +
      '<td>' + leadPreliminaryFindingCountsHtml(row.findings) + '</td>' +
      '<td>' + esc(row.updated) + '</td>' +
      '<td><button class="btn btn--sm" data-act="preliminary-report-actions" data-id="' + esc(row.id) + '">' + esc(row.completePackage ? 'Continue Existing Report' : 'View History') + '</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="8"><div class="empty">No preliminary reports match the current filters.</div></td></tr>';
  return '<section class="prelim-report-table-panel">' +
    '<div class="prelim-report-table-wrap"><table class="prelim-report-table"><thead><tr>' +
      '<th>Report ID</th><th>Inspection</th><th>Organization</th><th>Inspection Dates</th><th>Status</th><th>Findings</th><th>Last Updated</th><th>Actions</th>' +
    '</tr></thead><tbody>' + body + '</tbody></table></div>' +
    '<div class="prelim-report-table-foot">' +
      '<span>Showing ' + (visibleRows.length ? '1' : '0') + ' to ' + esc(String(visibleRows.length)) + ' of ' + esc(String(totalCount)) + ' reports</span>' +
      '<div class="prelim-report-pager"><button disabled>‹</button><button class="is-active">1</button><button disabled>›</button></div>' +
    '</div>' +
  '</section>';
}

function viewLeadPreliminaryReports() {
  var ui = leadPreliminaryReportsUiState();
  var allRows = leadPreliminaryReportRows();
  var rows = leadPreliminaryFilteredRows(ui);
  return '<div class="prelim-reports-page">' +
    '<div class="prelim-reports-head">' +
      '<div><h1>Preliminary Reports</h1><p>View and manage all preliminary inspection reports.</p></div>' +
    '</div>' +
    leadPreliminaryMetricsHtml(allRows) +
    leadPreliminaryFiltersHtml(ui) +
    leadPreliminaryTableHtml(rows, rows.length) +
  '</div>';
}

function leadPreliminaryActiveRow() {
  var ui = leadPreliminaryReportsUiState();
  return leadPreliminaryReportById(ui.selectedReportId) || leadPreliminaryReportRows()[0] || null;
}

function leadPreliminaryWorkflowFindings(row) {
  var selectedRow = row || leadPreliminaryActiveRow();
  if (!selectedRow) return [];
  return state.findings.filter(function (finding) { return finding.auditId === selectedRow.auditId; }).map(function (finding) {
    var level = finding.severity === 1 ? 'L1' : (finding.severity === 2 ? 'L2' : (finding.severity === 3 ? 'L3' : 'OBS'));
    var levelLabel = finding.severity === 1 ? 'Level 1 Critical' : (finding.severity === 2 ? 'Level 2 Major' : (finding.severity === 3 ? 'Level 3 Minor' : 'Observation'));
    return {
      id: finding.id,
      level: level,
      levelLabel: levelLabel,
      title: finding.title,
      area: finding.department || finding.riskCategory || 'Cabin Safety',
      status: FINDING_STATUS[finding.status] ? FINDING_STATUS[finding.status].label : humanStatus(finding.status),
      statusKey: finding.status,
      dueDate: finding.dueDate || 'Not configured',
      reviewed: finding.status !== 'WAITING_CAP'
    };
  });
}

function leadPreliminaryWorkflowAttachments(ui) {
  var row = leadPreliminaryActiveRow();
  var sourceFiles = row && row.artifact && Array.isArray(row.artifact.attachments) ? row.artifact.attachments : [];
  var rows = sourceFiles.map(function (file, index) {
    var name = String(file).replace(/ \(mock.*\)$/i, '');
    return { id: 'artifact-' + index, name: name, description: 'Report-linked supporting record', by: row && row.projection ? row.projection.leadInspector : 'Lead Inspector', date: row ? row.updated : 'Not recorded', size: 'Filename only', type: /\.(jpg|jpeg|png)$/i.test(name) ? 'image' : 'doc' };
  });
  (ui && Array.isArray(ui.mockAttachmentNames) ? ui.mockAttachmentNames : []).forEach(function (name, index) {
    rows.push({ id: 'file-mock-upload-' + index, name: name, description: 'Additional supporting evidence', by: 'Caner Yildiz', date: logTimestamp(), size: 'Filename only', type: 'doc' });
  });
  return rows;
}

function leadPreliminarySelectedFindings(ui) {
  return leadPreliminaryWorkflowFindings().filter(function (finding) {
    return ui.includedFindingIds[finding.id] !== false;
  });
}

function leadPreliminaryFindingCounts(findings) {
  return findings.reduce(function (counts, finding) {
    counts[finding.level] = (counts[finding.level] || 0) + 1;
    counts.all += 1;
    return counts;
  }, { all: 0, L1: 0, L2: 0, L3: 0, OBS: 0 });
}

function leadPreliminaryFilteredFindings(ui) {
  var query = (ui.findingQuery || '').toLowerCase().trim();
  var level = ui.findingLevel || 'all';
  return leadPreliminaryWorkflowFindings().filter(function (finding) {
    if (level !== 'all' && finding.level !== level) return false;
    if (!query) return true;
    return (finding.id + ' ' + finding.title + ' ' + finding.area + ' ' + finding.levelLabel).toLowerCase().indexOf(query) >= 0;
  });
}

function leadPreliminaryWorkflowStepMeta(step) {
  var map = {
    inspection: { index: 1, label: 'Inspection & Findings', next: 'Next: Report Content', nextStep: 'content' },
    content: { index: 2, label: 'Report Content', next: 'Next: Attachments', nextStep: 'attachments' },
    attachments: { index: 3, label: 'Attachments', next: 'Next: Review & Submit', nextStep: 'review' },
    review: { index: 4, label: 'Review & Submit', next: 'Submit to Department Manager', nextStep: 'review' }
  };
  return map[step] || map.inspection;
}

function leadPreliminaryWorkflowHeader(row, ui) {
  var step = ui.step || 'inspection';
  var meta = leadPreliminaryWorkflowStepMeta(step);
  var statusText = ui.submittedAt ? 'Pending Department Manager Review' : row.statusLabel;
  var nextAction = step === 'review'
    ? '<button class="btn btn--primary" data-act="preliminary-report-submit"' + (ui.submittedAt ? ' disabled' : '') + '>' + esc(ui.submittedAt ? 'Submitted to Department Manager' : meta.next) + ' →</button>'
    : '<button class="btn btn--primary" data-act="preliminary-report-next">' + esc(meta.next) + ' →</button>';
  return '<div class="prelim-workflow-head">' +
    '<div class="prelim-workflow-crumb"><button data-act="nav" data-view="audit-reports" data-filter="preliminary">⌂</button><span>Preliminary Reports</span><span>›</span><span>' + esc(row.id) + '</span><span>›</span><b>' + esc(meta.label) + '</b></div>' +
    '<div class="prelim-workflow-title">' +
      '<div><h1>Preliminary Report <span>– ' + esc(row.inspection) + ' – ' + esc(row.organization) + '</span></h1>' + leadPreliminaryWorkflowBadge(statusText, ui.submittedAt ? 'pending' : 'draft') + '</div>' +
      '<div class="prelim-workflow-actions"><button class="btn" data-act="preliminary-report-save">Save Draft</button><button class="btn" data-act="preliminary-report-preview">Preview PDF</button>' + nextAction + '</div>' +
    '</div>' +
    '<div class="prelim-workflow-meta">' +
      leadPreliminaryMetaItem('Inspection', row.inspection + '<br><a>' + esc(row.auditId) + '</a>') +
      leadPreliminaryMetaItem('Organization', row.organization) +
      leadPreliminaryMetaItem('Inspection Dates', row.dates) +
      leadPreliminaryMetaItem('Lead Inspector', row.projection.leadInspector) +
      leadPreliminaryMetaItem('Report Version', row.projection.version + ' (' + (ui.submittedAt ? 'Submitted' : 'Working') + ')') +
      leadPreliminaryMetaItem('Status', statusText) +
    '</div>' +
  '</div>';
}

function leadPreliminaryWorkflowBadge(label, tone) {
  return '<span class="prelim-workflow-badge is-' + esc(tone || 'draft') + '">' + esc(label) + '</span>';
}

function leadPreliminaryMetaItem(label, value) {
  return '<div><span>' + esc(label) + '</span><b>' + value + '</b></div>';
}

function leadPreliminaryWorkflowStepper(activeStep) {
  var steps = [
    { id: 'inspection', label: 'Inspection & Findings' },
    { id: 'content', label: 'Report Content' },
    { id: 'attachments', label: 'Attachments' },
    { id: 'review', label: 'Review & Submit' }
  ];
  var activeIndex = leadPreliminaryWorkflowStepMeta(activeStep).index;
  return '<div class="prelim-workflow-stepper report-step-grid">' + steps.map(function (step, index) {
    var stepIndex = index + 1;
    var cls = stepIndex < activeIndex ? ' is-done' : (stepIndex === activeIndex ? ' is-active' : '');
    var marker = stepIndex < activeIndex ? '✓' : String(stepIndex);
    return '<button class="prelim-workflow-step' + cls + '" data-act="preliminary-report-step" data-step="' + esc(step.id) + '"><span>' + esc(marker) + '</span><b>' + esc(step.label) + '</b></button>';
  }).join('') + '</div>';
}

function leadPreliminaryFindingsSidePanel(ui, compact) {
  var findings = leadPreliminaryWorkflowFindings();
  var filteredFindings = leadPreliminaryFilteredFindings(ui);
  var counts = leadPreliminaryFindingCounts(findings);
  var selectedCount = leadPreliminarySelectedFindings(ui).length;
  var levelOptions = [
    ['all', 'All Levels (' + counts.all + ')'],
    ['L1', 'Level 1 Critical (' + counts.L1 + ')'],
    ['L2', 'Level 2 Major (' + counts.L2 + ')'],
    ['L3', 'Level 3 Minor (' + counts.L3 + ')'],
    ['OBS', 'Observation (' + counts.OBS + ')']
  ].map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + ((ui.findingLevel || 'all') === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
  return '<aside class="prelim-findings-panel' + (compact ? ' is-compact' : '') + '">' +
    '<div class="prelim-panel-title"><h2>Findings from Inspection (' + esc(String(selectedCount)) + ')</h2><span>' + esc(String(filteredFindings.length)) + ' shown</span></div>' +
    '<div class="prelim-finding-filters">' +
      '<label><span>Severity</span><select data-field="preliminary-report-finding-level">' + levelOptions + '</select></label>' +
      '<label class="prelim-finding-search"><span>Search</span><input type="search" data-field="preliminary-report-finding-query" value="' + esc(ui.findingQuery || '') + '" placeholder="Search findings..." aria-label="Search findings"></label>' +
    '</div>' +
    '<div class="prelim-finding-list">' + (filteredFindings.length ? filteredFindings.map(function (finding) {
      var checked = ui.includedFindingIds[finding.id] !== false;
      return '<div class="prelim-finding-item is-' + esc(finding.level.toLowerCase()) + '">' +
        '<label aria-label="Include ' + esc(finding.id) + ' in report"><input type="checkbox" data-field="preliminary-report-finding" data-id="' + esc(finding.id) + '"' + (checked ? ' checked' : '') + '></label>' +
        '<span class="prelim-finding-level">' + esc(finding.level) + '</span>' +
        '<span><small>' + esc(finding.id) + '</small><b>' + esc(finding.title) + '</b></span>' +
        '<em>' + esc(finding.area) + '</em>' +
        '<i>' + esc(finding.status) + '</i>' +
        '<button type="button" class="btn btn--sm" data-act="preliminary-report-view-finding" data-id="' + esc(finding.id) + '">View</button>' +
      '</div>';
    }).join('') : '<div class="empty">No findings match this filter.</div>') + '</div>' +
  '</aside>';
}

function leadPreliminaryInspectionStep(row, ui) {
  var audit = auditById(row.auditId);
  var team = state.inspectionTeams.filter(function (item) { return item.auditId === row.auditId; })[0];
  var teamNames = team ? team.memberIds.map(function (userId) {
    var user = state.users.filter(function (item) { return item.id === userId; })[0];
    return user ? user.name : userId;
  }).join(', ') : (audit && audit.team ? audit.team.join(', ') : 'Not assigned');
  var findings = leadPreliminaryWorkflowFindings(row);
  var counts = leadPreliminaryFindingCounts(findings);
  var percent = function (value) { return findings.length ? Math.round((value / findings.length) * 100) : 0; };
  var statusRows = findings.map(function (finding) {
    return '<tr><td>' + esc(finding.id) + '</td><td>' + esc(finding.levelLabel) + '</td><td>' + esc(finding.status) + '</td><td>' + esc(fmtDate(finding.dueDate)) + '</td><td><button class="btn btn--sm" data-act="preliminary-report-view-finding" data-id="' + esc(finding.id) + '">Review</button></td></tr>';
  }).join('');
  return '<div class="prelim-workflow-grid">' +
    '<section class="prelim-workflow-card">' +
      '<h2>Inspection Overview</h2>' +
      '<table class="prelim-detail-table"><tbody>' +
        '<tr><th>Audit ID</th><td>' + esc(row.auditId) + '</td><th>Lead Inspector</th><td>' + esc(row.projection.leadInspector) + '</td></tr>' +
        '<tr><th>Inspection Type</th><td>' + esc(row.inspection) + '</td><th>Inspection Team</th><td>' + esc(teamNames) + '</td></tr>' +
        '<tr><th>Organization</th><td>' + esc(row.organization) + '</td><th>Checklist Template</th><td>' + esc(audit ? audit.templateId : 'Not linked') + '</td></tr>' +
        '<tr><th>Location</th><td>' + esc(audit ? audit.location : 'Not configured') + '</td><th>Last Updated</th><td>' + esc(row.updated) + '</td></tr>' +
        '<tr><th>Inspection Dates</th><td>' + esc(row.dates) + '</td><th></th><td></td></tr>' +
      '</tbody></table>' +
      '<h2 class="mt-24">Findings Summary</h2>' +
      '<div class="prelim-summary-cards">' +
        '<div class="is-l1"><span>Level 1 Critical</span><b>' + esc(String(counts.L1)) + '</b><em>' + esc(String(percent(counts.L1))) + '%</em></div>' +
        '<div class="is-l2"><span>Level 2 Major</span><b>' + esc(String(counts.L2)) + '</b><em>' + esc(String(percent(counts.L2))) + '%</em></div>' +
        '<div class="is-l3"><span>Level 3 Minor</span><b>' + esc(String(counts.L3)) + '</b><em>' + esc(String(percent(counts.L3))) + '%</em></div>' +
        '<div><span>Observation</span><b>' + esc(String(counts.OBS)) + '</b><em>' + esc(String(percent(counts.OBS))) + '%</em></div>' +
        '<div><span>Total Findings</span><b>' + esc(String(counts.all)) + '</b></div>' +
      '</div>' +
      '<h2 class="mt-24">Findings Review</h2>' +
      '<div class="prelim-report-table-wrap"><table class="prelim-area-table"><thead><tr><th>Finding</th><th>Level</th><th>Status</th><th>Due Date</th><th>Action</th></tr></thead><tbody>' + statusRows + '</tbody></table></div>' +
    '</section>' +
    leadPreliminaryFindingsSidePanel(ui, false) +
  '</div>';
}

function leadPreliminaryReportBody(ui) {
  if (ui.content) return ui.content;
  var row = leadPreliminaryActiveRow();
  var artifact = row && row.artifact;
  var findings = leadPreliminaryWorkflowFindings(row);
  return '1. EXECUTIVE SUMMARY\n' + (artifact && artifact.executiveSummaryDraft ? artifact.executiveSummaryDraft : 'Preliminary Report draft for authorized review.') + '\n\n2. INSPECTION CONTEXT\nReport ID: ' + (row ? row.id : 'Not selected') + '\nAudit ID: ' + (row ? row.auditId : 'Not selected') + '\nOrganization: ' + (row ? row.organization : 'Not selected') + '\n\n3. FINDINGS REVIEW\n' + findings.map(function (finding) { return '- ' + finding.id + ' · ' + finding.levelLabel + ' · ' + finding.status + ': ' + finding.title; }).join('\n') + '\n\n4. REVIEW BOUNDARY\nThis browser-local draft requires Department Manager authorization before any configured release to the Service Provider.';
}

function leadPreliminaryContentStep(row, ui) {
  return '<div class="prelim-content-grid">' +
    '<section class="prelim-editor-card">' +
      '<div class="prelim-editor-toolbar">' +
        '<select aria-label="Text style"><option>Heading 1</option><option>Heading 2</option><option>Paragraph</option></select>' +
        '<button disabled>B</button><button disabled>I</button><button disabled>U</button><button disabled>•</button><button disabled>1.</button><button disabled>≡</button><button disabled>↶</button><button disabled>↷</button>' +
      '</div>' +
      '<div class="prelim-report-paper">' +
        '<div class="prelim-report-logo">' + renderBrandMark('brand-mark--report') + '<b>AviaSurveil360</b></div>' +
        '<h2>PRELIMINARY INSPECTION REPORT</h2>' +
        '<table><tbody>' +
          '<tr><th>Inspection:</th><td>' + esc(row.inspection) + ' – ' + esc(row.organization) + '</td><th>Audit ID:</th><td>' + esc(row.auditId) + '</td></tr>' +
          '<tr><th>Organization:</th><td>' + esc(row.organization) + '</td><th>Inspection Dates:</th><td>' + esc(row.dates) + '</td></tr>' +
          '<tr><th>Lead Inspector:</th><td>' + esc(row.projection.leadInspector) + '</td><th>Report Version:</th><td>' + esc(row.projection.version) + ' (Working)</td></tr>' +
          '<tr><th>Report Status:</th><td>' + esc(ui.submittedAt ? 'Pending Department Manager Review' : 'Draft') + '</td><th>Date of Report:</th><td>15 June 2026</td></tr>' +
        '</tbody></table>' +
        '<textarea data-field="preliminary-report-content" aria-label="Preliminary report content">' + esc(leadPreliminaryReportBody(ui)) + '</textarea>' +
      '</div>' +
      '<div class="prelim-editor-foot"><span>Word Count: 862</span><span>Page 1 of 6</span><span>Last saved: ' + esc(ui.draftSavedAt || row.updated) + '</span><span>100%</span></div>' +
    '</section>' +
    leadPreliminaryFindingsSidePanel(ui, true) +
  '</div>';
}

function leadPreliminaryAttachmentsStep(row, ui) {
  var files = leadPreliminaryWorkflowAttachments(ui);
  var documents = files.filter(function (file) { return file.type === 'doc'; }).length;
  var images = files.filter(function (file) { return file.type === 'image'; }).length;
  return '<div class="prelim-attachments-layout">' +
    '<section class="prelim-workflow-card">' +
      '<div class="prelim-attachment-head"><div><h2>Attachments</h2><p>Upload supporting documents, evidence photos, records or any other files relevant to this report.</p></div><div><button class="btn btn--sm" data-act="preliminary-report-new-folder">+ New Folder</button></div></div>' +
      '<div class="prelim-upload-box"><div><b>Drag & drop files here or</b><button class="btn" data-act="preliminary-report-browse-file">Browse Files</button></div><p>Max file size: 50MB per file / Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p></div>' +
      '<table class="prelim-attachment-table"><thead><tr><th>File Name</th><th>Description</th><th>Uploaded By</th><th>Upload Date</th><th>Size</th><th>Action</th></tr></thead><tbody>' +
        files.map(function (file) {
          return '<tr><td><span class="prelim-file-icon is-' + esc(file.type) + '"></span>' + esc(file.name) + '</td><td>' + esc(file.description) + '</td><td>' + esc(file.by) + '</td><td>' + esc(file.date) + '</td><td>' + esc(file.size) + '</td><td><button class="prelim-row-action" data-act="preliminary-report-attachment-action" data-id="' + esc(file.id) + '">⋮</button></td></tr>';
        }).join('') +
      '</tbody></table>' +
      '<div class="prelim-report-table-foot"><span>Showing 1 to ' + esc(String(files.length)) + ' of ' + esc(String(files.length)) + ' files</span></div>' +
    '</section>' +
    '<aside class="prelim-attachment-side">' +
      '<h2>Attachment Summary</h2>' +
      '<div class="prelim-attachment-stats"><div><span>Total Files</span><b>' + esc(String(files.length)) + '</b><em>Filename records</em></div><div><span>Storage</span><b>Browser-local names</b></div><div><span>Documents</span><b>' + esc(String(documents)) + '</b></div><div><span>Images</span><b>' + esc(String(images)) + '</b></div></div>' +
      '<h2 class="mt-24">Quick Tips</h2>' +
      '<ul><li>Upload files that support your findings and observations.</li><li>Ensure all evidence is relevant and properly referenced.</li><li>You can organize files using folders for better structure.</li></ul>' +
    '</aside>' +
  '</div>';
}

function leadPreliminaryReviewStep(row, ui) {
  var files = leadPreliminaryWorkflowAttachments(ui);
  var selected = leadPreliminarySelectedFindings(ui);
  var counts = leadPreliminaryFindingCounts(selected);
  var submitted = !!ui.submittedAt;
  return '<div class="prelim-review-layout">' +
    '<section class="prelim-workflow-card">' +
      '<h2>Review Before Submit</h2><p>Please review all sections of the preliminary report. Ensure the information is complete and accurate before submitting for Department Manager review.</p>' +
      '<div class="prelim-review-checklist">' +
        leadPreliminaryReviewRow('1. Inspection & Findings', 'Inspection overview, team, scope, objectives and findings selected for report.', 'Complete', 'inspection') +
        leadPreliminaryReviewRow('2. Report Content', 'Executive summary, overall assessment, scope and objective.', 'Complete', 'content') +
        leadPreliminaryReviewRow('3. Attachments', 'Supporting documents, evidence photos, records and other files.', 'Complete (' + files.length + ' files)', 'attachments') +
        leadPreliminaryReviewRow('4. Review & Submit', 'Final review and submit the report for approval.', submitted ? 'Submitted' : 'Ready', 'review') +
      '</div>' +
      '<h2 class="mt-24">Lead Inspector Declaration</h2>' +
      '<p>By submitting this preliminary report, I confirm that:</p>' +
      '<label class="prelim-declaration"><input type="checkbox" data-field="preliminary-report-declaration" data-id="accurate"' + (ui.declarations.accurate ? ' checked' : '') + '> The information contained in this report is accurate and complete to the best of my knowledge.</label>' +
      '<label class="prelim-declaration"><input type="checkbox" data-field="preliminary-report-declaration" data-id="evidenceBased"' + (ui.declarations.evidenceBased ? ' checked' : '') + '> The findings are based on verified evidence and observations collected during the inspection.</label>' +
      '<label class="prelim-declaration"><input type="checkbox" data-field="preliminary-report-declaration" data-id="readyForReview"' + (ui.declarations.readyForReview ? ' checked' : '') + '> This report is ready for review and approval by the relevant authority.</label>' +
      '<div class="prelim-signature-grid"><label>Lead Inspector Name<input value="' + esc(row.projection.leadInspector) + '" readonly></label><label>Date<input value="' + esc(fmtDate(DEMO_TODAY)) + '" readonly></label><label>Approval mark<div class="prelim-signature">' + esc(row.projection.leadInspector) + ' <span>Demo acknowledgment</span></div></label></div>' +
      '<div class="prelim-next-step">' +
        '<div class="prelim-next-step__intro"><h3>Next Step</h3><p>After Lead Inspector signature, the preliminary report is always forwarded to Department Manager Review. If CAP is required, the Department Manager releases it to the Service Provider; if no CAP is required, the Department Manager continues the approval path.</p></div>' +
        '<div class="prelim-flow-card is-current"><b>Department Manager</b><span>Review & Sign</span></div>' +
        '<div class="prelim-flow-card is-cap"><b>If CAP Required</b><span>Department Manager → Service Provider</span></div>' +
        '<div class="prelim-flow-card is-ok"><b>If No CAP Required</b><span>Department Manager Approval</span></div>' +
      '</div>' +
    '</section>' +
    '<aside class="prelim-review-side">' +
      '<h2>Report Summary</h2>' +
      '<dl><dt>Report ID</dt><dd>' + esc(row.id) + '</dd><dt>Audit ID</dt><dd>' + esc(row.auditId) + '</dd><dt>Organization</dt><dd>' + esc(row.organization) + '</dd><dt>Inspection Dates</dt><dd>' + esc(row.dates) + '</dd><dt>Lead Inspector</dt><dd>' + esc(row.projection.leadInspector) + '</dd><dt>Report Version</dt><dd>' + esc(row.projection.version) + ' (Working)</dd><dt>Total Findings</dt><dd>' + esc(String(selected.length)) + ' selected</dd><dt>Attachments</dt><dd>' + esc(String(files.length)) + ' filename records</dd></dl>' +
      '<h2 class="mt-24">Findings Summary</h2>' +
      '<div class="prelim-review-findings"><span>Level 1 Critical<b>' + esc(String(counts.L1)) + '</b></span><span>Level 2 Major<b>' + esc(String(counts.L2)) + '</b></span><span>Level 3 Minor<b>' + esc(String(counts.L3)) + '</b></span><span>Observation<b>' + esc(String(counts.OBS)) + '</b></span><span>Total Findings<b>' + esc(String(counts.all)) + '</b></span></div>' +
      '<h2 class="mt-24">Submission Flow</h2>' +
      '<ol class="prelim-submit-flow"><li><b>Lead Inspector</b><span>' + (submitted ? 'Completed' : 'Current') + '</span><em>Submit for Review</em></li><li><b>Department Manager</b><span>' + (submitted ? 'Current' : 'Pending') + '</span><em>Review & Sign</em></li><li><b>Release to Service Provider (if CAP required)</b><span>Pending</span><em>Department Manager sends if needed</em></li><li><b>Department Manager Approval (if no CAP required)</b><span>Pending</span><em>Continues approval path</em></li></ol>' +
    '</aside>' +
  '</div>';
}

function leadPreliminaryReviewRow(title, text, status, step) {
  return '<div><span class="prelim-review-icon">▣</span><div><b>' + esc(title) + '</b><p>' + esc(text) + '</p></div><em>' + esc(status) + '</em><button class="btn btn--sm" data-act="preliminary-report-step" data-step="' + esc(step) + '">View</button></div>';
}

function leadPreliminaryWorkflowBottom(ui) {
  var step = ui.step || 'inspection';
  var backLabel = step === 'inspection' ? 'Back: Preliminary Reports' : 'Back: ' + leadPreliminaryWorkflowStepMeta(preliminaryReportPreviousStep(step)).label;
  var primary = step === 'review'
    ? '<button class="btn btn--primary" data-act="preliminary-report-submit"' + (ui.submittedAt ? ' disabled' : '') + '>' + esc(ui.submittedAt ? 'Submitted to Department Manager' : 'Submit to Department Manager') + ' →</button>'
    : '<button class="btn btn--primary" data-act="preliminary-report-next">' + esc(leadPreliminaryWorkflowStepMeta(step).next) + ' →</button>';
  return '<div class="prelim-workflow-bottom"><button class="btn" data-act="preliminary-report-back">← ' + esc(backLabel) + '</button><div><button class="btn" data-act="preliminary-report-save">Save Draft</button>' + primary + '</div></div>';
}

function preliminaryReportPreviousStep(step) {
  var order = ['inspection', 'content', 'attachments', 'review'];
  var index = order.indexOf(step);
  return index <= 0 ? 'inspection' : order[index - 1];
}

function viewLeadPreliminaryWorkflow() {
  var listUi = leadPreliminaryReportsUiState();
  var row = leadPreliminaryReportById(listUi.selectedReportId) || leadPreliminaryReportRows()[0];
  if (!row || !row.completePackage) return viewLeadPreliminaryReports();
  var draft = preliminaryReportDraftById(row.id, state);
  var step = draft.step || 'inspection';
  var body = step === 'content' ? leadPreliminaryContentStep(row, draft)
    : step === 'attachments' ? leadPreliminaryAttachmentsStep(row, draft)
    : step === 'review' ? leadPreliminaryReviewStep(row, draft)
    : leadPreliminaryInspectionStep(row, draft);
  return '<div class="prelim-workflow-page">' +
    leadPreliminaryWorkflowHeader(row, draft) +
    leadPreliminaryWorkflowStepper(step) +
    body +
    leadPreliminaryWorkflowBottom(draft) +
  '</div>';
}

function departmentPreliminaryReviewUiState() {
  if (typeof ensureDepartmentPreliminaryReviewUi === 'function') return ensureDepartmentPreliminaryReviewUi();
  if (!state.departmentPreliminaryReviewUi) {
    state.departmentPreliminaryReviewUi = {
      tab: 'summary',
      selectedReportId: 'PR-2026-018',
      capRequired: true,
      approveMenuOpen: true,
      approvedAt: '',
      approvedPath: '',
      returnedAt: ''
    };
  }
  return state.departmentPreliminaryReviewUi;
}

function departmentPreliminaryStatus(ui) {
  if (ui.returnedAt) return { label: 'Changes Requested', tone: 'returned' };
  if (ui.approvedPath === 'service_provider') return { label: 'Sent to Service Provider', tone: 'sent' };
  if (ui.approvedPath === 'gm') return { label: 'Sent to General Manager', tone: 'sent' };
  return { label: 'Pending Your Approval', tone: 'pending' };
}

function departmentPreliminaryBadge(label, tone) {
  return '<span class="dm-prelim-badge is-' + esc(tone || 'pending') + '">' + esc(label) + '</span>';
}

function departmentPreliminaryMetaItem(label, value) {
  return '<div><span>' + esc(label) + '</span><b>' + value + '</b></div>';
}

function departmentPreliminaryApproveControl(ui, showMenu) {
  var currentPath = ui.capRequired ? 'service_provider' : 'gm';
  var disabled = ui.approvedAt ? ' disabled' : '';
  var menu = showMenu && ui.approveMenuOpen && !ui.approvedAt
    ? '<div class="dm-prelim-approve-menu">' +
        '<button data-act="department-prelim-approve" data-path="service_provider"><span></span>If CAP Required, send to Service Provider</button>' +
        '<button data-act="department-prelim-approve" data-path="gm"><span></span>If No CAP Required, send to General Manager for Approval</button>' +
      '</div>'
    : '';
  return '<div class="dm-prelim-approve-wrap">' +
    '<button class="btn btn--primary" data-act="department-prelim-approve" data-path="' + esc(currentPath) + '"' + disabled + '>' + esc(ui.approvedAt ? 'Approved / Sent' : 'Approve / Send to Next Step') + '</button>' +
    '<button class="btn btn--primary dm-prelim-approve-caret" data-act="department-prelim-toggle-menu"' + disabled + ' aria-label="Approval path options">⌄</button>' +
    menu +
  '</div>';
}

function departmentPreliminaryHeader(row, ui) {
  var status = departmentPreliminaryStatus(ui);
  return '<div class="dm-prelim-head">' +
    '<div class="dm-prelim-crumb"><button data-act="nav" data-view="audit-reports" data-filter="preliminary">⌂</button><span>Preliminary Reports</span><span>›</span><span>PR-2026-014</span><span>›</span><b>Review by Department Manager</b></div>' +
    '<div class="dm-prelim-title">' +
      '<div><h1>Preliminary Report <span>– ' + esc(row.inspection) + ' – ' + esc(row.organization) + '</span></h1>' + departmentPreliminaryBadge(status.label, status.tone) + '</div>' +
      '<div class="dm-prelim-actions"><button class="btn" data-act="department-prelim-download">Download PDF</button>' + departmentPreliminaryApproveControl(ui, false) + '</div>' +
    '</div>' +
    '<div class="dm-prelim-meta">' +
      departmentPreliminaryMetaItem('Inspection ID', '<a>INS-2026-014</a>') +
      departmentPreliminaryMetaItem('Organization', esc(row.organization)) +
      departmentPreliminaryMetaItem('Inspection Dates', esc(row.dates)) +
      departmentPreliminaryMetaItem('Lead Inspector', 'Aylin Sezer') +
      departmentPreliminaryMetaItem('Report Version', '1.0 (Draft)') +
      departmentPreliminaryMetaItem('Submitted on', '15 Jun 2026 14:30') +
      departmentPreliminaryMetaItem('Submitted by', 'Aylin Sezer<br><small>Lead Inspector</small>') +
    '</div>' +
  '</div>';
}

function departmentPreliminaryTabs(ui) {
  var tabs = [
    ['summary', 'Summary'],
    ['findings', 'Inspection & Findings'],
    ['content', 'Report Content'],
    ['attachments', 'Attachments (7)'],
    ['audit', 'Audit Trail']
  ];
  return '<div class="dm-prelim-tabs">' + tabs.map(function (tab) {
    return '<button class="' + (ui.tab === tab[0] ? 'is-active' : '') + '" data-act="department-prelim-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function departmentPreliminaryFindingStats() {
  return '<div class="dm-prelim-stat-grid">' +
    '<div><span>Total Findings</span><b>9</b><em>☷</em></div>' +
    '<div class="is-l1"><span>Level 1 (Critical)</span><b>2</b></div>' +
    '<div class="is-l2"><span>Level 2 (Major)</span><b>3</b></div>' +
    '<div class="is-l3"><span>Level 3 (Observation)</span><b>4</b></div>' +
  '</div>';
}

function departmentPreliminaryDepartmentRows() {
  var rows = [
    ['Operations', '3', '1', '1', '1'],
    ['Security', '2', '0', '1', '1'],
    ['Training', '1', '0', '1', '0'],
    ['Quality Management', '2', '1', '0', '1'],
    ['Ground Handling', '1', '0', '0', '1']
  ];
  return rows.map(function (row) {
    return '<tr><td><span>›</span><b>' + esc(row[0]) + '</b></td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td>' + esc(row[4]) + '</td></tr>';
  }).join('');
}

function departmentPreliminarySidePanel(ui) {
  var sentToService = ui.approvedPath === 'service_provider';
  var sentToGm = ui.approvedPath === 'gm';
  var returned = !!ui.returnedAt;
  function flowItem(number, title, subtitle, stateLabel, cls) {
    return '<li class="' + esc(cls || '') + '"><span>' + esc(number) + '</span><div><b>' + esc(title) + '</b><small>' + esc(subtitle) + '</small></div>' + (stateLabel ? '<em>' + esc(stateLabel) + '</em>' : '') + '</li>';
  }
  return '<aside class="dm-prelim-side">' +
    '<section class="dm-prelim-panel">' +
      '<h2>Submission & Next Steps</h2>' +
      '<ol class="dm-prelim-flow">' +
        flowItem('✓', 'Submitted by Lead Inspector', '15 Jun 2026 14:30', 'Completed', 'is-done') +
        flowItem('2', 'Department Manager Review', returned ? 'Changes requested' : (ui.approvedAt ? 'Completed' : 'You are here'), ui.approvedAt ? 'Completed' : '', ui.approvedAt ? 'is-done' : 'is-current') +
        flowItem('3', 'If CAP Required', sentToService ? 'Sent to Service Provider' : 'Send to Service Provider', sentToService ? 'Done' : '', sentToService ? 'is-done' : '') +
        flowItem('4', 'If No CAP Required', sentToGm ? 'Sent to General Manager' : 'Send to General Manager for Approval', sentToGm ? 'Done' : '', sentToGm ? 'is-done' : '') +
      '</ol>' +
      '<div class="dm-prelim-detail-list"><h2>Inspection Details</h2>' +
        '<dl><dt>Inspection Type</dt><dd>Routine (Announced)</dd><dt>Scope</dt><dd>AVSEC Compliance</dd><dt>Risk Category</dt><dd>High</dd><dt>Team Members</dt><dd>5 Inspectors</dd><dt>Checklist Used</dt><dd>AVSEC Comprehensive Checklist v3.2</dd></dl>' +
      '</div>' +
      '<div class="dm-prelim-action-note"><b>Your Action Required</b><p>Please review the report thoroughly. If everything is in order:</p><ul><li>If CAP is required, the report will be sent to the Service Provider.</li><li>If no CAP is required, the report will be sent to the General Manager for approval.</li></ul></div>' +
    '</section>' +
  '</aside>';
}

function departmentPreliminarySummaryTab(row, ui) {
  return '<div class="dm-prelim-layout">' +
    '<main class="dm-prelim-main">' +
      '<section class="dm-prelim-panel">' +
        '<h2>Report Summary</h2>' +
        '<p>The preliminary report has been completed by the Lead Inspector. Please review all sections, findings, and supporting evidence before approving.</p>' +
        '<p>If CAP is required, the report will be sent to the Service Provider after your approval.</p>' +
        departmentPreliminaryFindingStats() +
        '<h2 class="mt-24">Findings by Department</h2>' +
        '<table class="dm-prelim-table"><thead><tr><th>Department</th><th>Total Findings</th><th>L1 (Critical)</th><th>L2 (Major)</th><th>L3 (Observation)</th></tr></thead><tbody>' + departmentPreliminaryDepartmentRows() + '</tbody></table>' +
        '<button class="btn btn--sm mt-16" data-act="department-prelim-tab" data-tab="findings">View all Findings</button>' +
      '</section>' +
      '<section class="dm-prelim-panel dm-prelim-declaration">' +
        '<h2>Lead Inspector Declaration</h2>' +
        '<p>I confirm that this preliminary report is complete, accurate, and based on verified evidence collected during the inspection.</p>' +
        '<div><span>Lead Inspector</span><b>Aylin Sezer</b></div><div><span>Date</span><b>15 Jun 2026 14:30</b></div><div><span>Signature</span><b class="dm-prelim-signature">Aylin Sezer</b><em>Signed</em></div>' +
      '</section>' +
    '</main>' +
    departmentPreliminarySidePanel(ui) +
  '</div>';
}

function departmentPreliminaryFindingsTab(ui) {
  var findings = leadPreliminaryWorkflowFindings();
  return '<div class="dm-prelim-layout">' +
    '<main class="dm-prelim-panel">' +
      '<h2>Inspection & Findings</h2><p>Department Manager review list for findings selected by the Lead Inspector.</p>' +
      '<table class="dm-prelim-table"><thead><tr><th>Level</th><th>Finding</th><th>Area</th><th>Status</th><th>CAP</th></tr></thead><tbody>' +
        findings.map(function (finding, index) {
          var requiresCap = finding.level !== 'L3';
          return '<tr><td><span class="dm-finding-level is-' + esc(finding.level.toLowerCase()) + '">' + esc(finding.level) + '</span></td><td><b>' + esc(finding.id) + '</b><br>' + esc(finding.title) + '</td><td>' + esc(finding.area) + '</td><td>Reviewed</td><td>' + esc(requiresCap ? 'Required' : 'Not required') + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
    '</main>' +
    departmentPreliminarySidePanel(ui) +
  '</div>';
}

function departmentPreliminaryContentTab(row, ui) {
  return '<div class="dm-prelim-layout">' +
    '<main class="dm-prelim-panel dm-prelim-report-content">' +
      '<div class="prelim-report-logo">' + renderBrandMark('brand-mark--report') + '<b>AviaSurveil360</b></div>' +
      '<h2>PRELIMINARY INSPECTION REPORT</h2>' +
      '<table><tbody>' +
        '<tr><th>Inspection:</th><td>' + esc(row.inspection) + ' – ' + esc(row.organization) + '</td><th>Inspection ID:</th><td>INS-2026-014</td></tr>' +
        '<tr><th>Organization:</th><td>' + esc(row.organization) + '</td><th>Inspection Dates:</th><td>' + esc(row.dates) + '</td></tr>' +
        '<tr><th>Lead Inspector:</th><td>Aylin Sezer</td><th>Report Version:</th><td>1.0 (Draft)</td></tr>' +
      '</tbody></table>' +
      '<pre>' + esc(leadPreliminaryReportBody({ reportContent: '' })) + '</pre>' +
    '</main>' +
    departmentPreliminarySidePanel(ui) +
  '</div>';
}

function departmentPreliminaryAttachmentsTab(ui) {
  var files = leadPreliminaryWorkflowAttachments({ mockUploadName: '' });
  return '<div class="dm-prelim-layout">' +
    '<main class="dm-prelim-panel">' +
      '<h2>Attachments</h2><p>Supporting documents available for Department Manager review.</p>' +
      '<table class="dm-prelim-table"><thead><tr><th>File Name</th><th>Description</th><th>Uploaded By</th><th>Upload Date</th><th>Size</th></tr></thead><tbody>' +
        files.map(function (file) {
          return '<tr><td><b>' + esc(file.name) + '</b></td><td>' + esc(file.description) + '</td><td>' + esc(file.by) + '</td><td>' + esc(file.date) + '</td><td>' + esc(file.size) + '</td></tr>';
        }).join('') +
      '</tbody></table>' +
    '</main>' +
    departmentPreliminarySidePanel(ui) +
  '</div>';
}

function departmentPreliminaryAuditTrailTab(ui) {
  var rows = [
    ['15 Jun 2026 14:30', 'Lead Inspector', 'Submitted preliminary report for Department Manager review.', 'Aylin Sezer'],
    ['15 Jun 2026 14:10', 'Lead Inspector', 'Report content, findings and attachments prepared.', 'Aylin Sezer'],
    ['15 Jun 2026 13:20', 'Inspection Team', 'Inspection findings marked reviewed.', 'Mehmet Kaya, John Smith, Fatma Yilmaz']
  ];
  if (ui.approvedAt) rows.unshift([ui.approvedAt, 'Department Manager', ui.approvedPath === 'gm' ? 'Sent to General Manager for approval.' : 'Sent to Service Provider because CAP is required.', ROLES.manager.user]);
  if (ui.returnedAt) rows.unshift([ui.returnedAt, 'Department Manager', 'Requested changes from Lead Inspector.', ROLES.manager.user]);
  return '<div class="dm-prelim-layout">' +
    '<main class="dm-prelim-panel">' +
      '<h2>Audit Trail</h2>' +
      '<table class="dm-prelim-table"><thead><tr><th>Date</th><th>Role</th><th>Activity</th><th>User</th></tr></thead><tbody>' +
        rows.map(function (row) { return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td></tr>'; }).join('') +
      '</tbody></table>' +
    '</main>' +
    departmentPreliminarySidePanel(ui) +
  '</div>';
}

function departmentPreliminaryTabBody(row, ui) {
  if (ui.tab === 'findings') return departmentPreliminaryFindingsTab(ui);
  if (ui.tab === 'content') return departmentPreliminaryContentTab(row, ui);
  if (ui.tab === 'attachments') return departmentPreliminaryAttachmentsTab(ui);
  if (ui.tab === 'audit') return departmentPreliminaryAuditTrailTab(ui);
  return departmentPreliminarySummaryTab(row, ui);
}

function departmentPreliminaryBottom(ui) {
  return '<div class="dm-prelim-bottom">' +
    '<button class="btn" data-act="department-prelim-back">← Back</button>' +
    '<div><button class="btn dm-prelim-request" data-act="department-prelim-request-changes"' + (ui.approvedAt ? ' disabled' : '') + '>Request Changes</button>' + departmentPreliminaryApproveControl(ui, true) + '</div>' +
  '</div>';
}

function viewDepartmentPreliminaryReview() {
  var ui = departmentPreliminaryReviewUiState();
  var row = leadPreliminaryReportById(ui.selectedReportId) || leadPreliminaryReportRows()[0];
  return '<div class="dm-prelim-page">' +
    departmentPreliminaryHeader(row, ui) +
    departmentPreliminaryTabs(ui) +
    departmentPreliminaryTabBody(row, ui) +
    departmentPreliminaryBottom(ui) +
  '</div>';
}

function finalReadyStatusStep(label, actor, time) {
  return '<div class="final-ready-status-step"><span>✓</span><p><b>' + esc(label) + '</b><small>Approved</small></p><em>' + esc(time) + '<br>' + esc(actor) + '</em></div>';
}

function finalReadySummaryCard(label, value, detail, tone) {
  return '<article class="final-ready-card is-' + esc(tone || 'neutral') + '"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong><small>' + esc(detail || '') + '</small></article>';
}

function finalReportPdfLines() {
  return [
    'Final Report - Approved',
    'Inspection ID: INS-2026-014',
    'Organization: SkyCargo Air',
    'Inspection Type: Routine (Announced)',
    'Inspection Dates: 12 - 14 Jun 2026',
    'Report Version: 2.0 (Final Report)',
    'Final Report Date: 30 Jun 2026',
    '',
    '1. Executive Summary',
    'This inspection was conducted between 12 - 14 Jun 2026 at SkyCargo Air (Service Provider) in accordance with applicable regulations and standards. A total of 9 findings were identified across 5 organizations.',
    'Overall, the security system is effective; however, certain areas require improvement to ensure full compliance with applicable regulations.',
    '',
    '2. Inspection Overview',
    'Scope: Physical Security',
    'Organizations Included: 5',
    'Inspection Team: Aylin Sezer (Lead Inspector) and 3 Inspectors',
    'Inspection Method: Interviews, Document Review, Observation',
    'Regulatory Basis: ICAO Annex 17, National Regulations',
    'Inspection Plan: INS-2026-014 / Rev. 1',
    'Inspection Duration: 3 Days',
    'Inspection Locations: Head Office, Cargo Terminal, Ramp Area, Warehouse, Access Control Points',
    '',
    '3. Findings Summary',
    'Level 1 Critical: 2 findings, 22 percent',
    'Level 2 Major: 3 findings, 33 percent',
    'Level 3 Observation: 4 findings, 45 percent',
    'Total Findings: 9',
    '',
    '4. CAP Implementation Summary',
    'Total CAPs: 9',
    'Closed: 2 (22 percent)',
    'In Progress: 5 (56 percent)',
    'Not Started: 2 (22 percent)',
    'Overdue: 0',
    'All corrective actions must be completed by the due dates defined in the CAP plan. The organization is responsible for providing evidence of implementation and closure.',
    '',
    '5. Conclusions',
    'SkyCargo Air has an effective security management system. Implementation of the outstanding corrective actions will further enhance compliance and overall security performance.',
    '',
    '6. Recommendations',
    'Ensure all Level 1 and Level 2 findings are addressed within the defined due dates.',
    'Strengthen training and awareness programs for access control procedures.',
    'Improve documentation and record keeping for security equipment maintenance.',
    '',
    '7. Appendices & Attachments',
    'Appendix A - Inspection Plan - PDF - 12 pages',
    'Appendix B - Inspection Team - PDF - 3 pages',
    'Appendix C - Evidence Photos - ZIP',
    'Appendix D - CAP Plan - PDF - 7 pages',
    '',
    'Report Prepared By: Aylin Sezer, Lead Inspector, 30 Jun 2026',
    'Reviewed By: Department Manager, 30 Jun 2026',
    'Approved By: General Manager, 30 Jun 2026'
  ];
}

function finalReportIcon(name) {
  if (typeof navIconSvg !== 'function') return '';
  return '<svg viewBox="0 0 24 24" focusable="false">' + navIconSvg(name || 'file-text') + '</svg>';
}

function finalReportOverviewItem(icon, label, value) {
  return '<div class="final-report-overview-item"><span>' + finalReportIcon(icon) + '</span><p><b>' + esc(label) + '</b><strong>' + esc(value) + '</strong></p></div>';
}

function finalReportFindingRows() {
  var rows = [
    ['Level 1 (Critical)', 'Non-compliance with critical requirements', '2', '22%', 'l1'],
    ['Level 2 (Major)', 'Non-compliance with important requirements', '3', '33%', 'l2'],
    ['Level 3 (Observation)', 'Opportunities for improvement', '4', '45%', 'l3'],
    ['Total', '', '9', '100%', 'total']
  ];
  return rows.map(function (row) {
    return '<tr><td><span class="final-report-level-dot is-' + esc(row[4]) + '"></span>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td></tr>';
  }).join('');
}

function finalReportAttachmentRows() {
  var rows = [
    ['Appendix A - Inspection Plan', 'Inspection plan and schedule', 'PDF', '12'],
    ['Appendix B - Inspection Team', 'Team members and roles', 'PDF', '3'],
    ['Appendix C - Evidence Photos', 'Photos collected during inspection', 'ZIP', '-'],
    ['Appendix D - CAP Plan', 'Corrective Action Plan', 'PDF', '7']
  ];
  return rows.map(function (row) {
    return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td></tr>';
  }).join('');
}

function leadFinalReportRows() {
  var ui = capTrackingUiState();
  var readyUpdated = ui.finalReportPreparedAt || ui.finalReportReadyAt || ui.allCapsApprovedAt || '30 Jun 2026';
  return [
    { reportId: 'FR-2026-014', inspectionId: 'INS-2026-014', organization: 'SkyCargo Air', orgCount: '5 Organizations', type: 'Routine (Announced)', department: 'Security', dates: '12 - 14 Jun 2026', version: '2.0 (Final)', status: ui.finalReportPreparedAt ? 'draft' : 'ready', lastUpdated: readyUpdated, updatedBy: 'Aylin Sezer', dueDate: '05 Jul 2026', dueNote: 'In 5 days', findings: '9 / 9 findings ready', cap: 'All CAPs approved', capDetail: '9 / 9 CAPs approved', period: 'last90', action: ui.finalReportPreparedAt ? 'Continue' : 'Prepare Report', actionType: 'prepare' },
    { reportId: 'FR-2026-021', inspectionId: 'INS-2026-021', organization: 'National Airport Authority', orgCount: '1 Organization', type: 'Risk-based (Announced)', department: 'Aviation Safety', dates: '22 - 24 Jun 2026', version: '1.0 (Draft)', status: 'draft', lastUpdated: '02 Jul 2026', updatedBy: 'Aylin Sezer', dueDate: '12 Jul 2026', dueNote: 'In 12 days', findings: '5 / 7 findings ready', cap: 'CAP implementation open', capDetail: '2 CAPs still open', period: 'last90', action: 'Continue', actionType: 'prepare' },
    { reportId: 'FR-2026-026', inspectionId: 'INS-2026-026', organization: 'AirExpress Ltd.', orgCount: '3 Organizations', type: 'Routine (Announced)', department: 'Security', dates: '18 - 20 Jun 2026', version: '1.0 (Submitted)', status: 'waiting', lastUpdated: '01 Jul 2026', updatedBy: 'Aylin Sezer', dueDate: '-', dueNote: '', findings: '6 / 6 findings closed', cap: 'CAP implementation closed', capDetail: '6 / 6 CAPs closed', period: 'last90', action: 'View Report', actionType: 'preview' },
    { reportId: 'FR-2026-031', inspectionId: 'INS-2026-031', organization: 'Cargo Terminal Services', orgCount: '2 Organizations', type: 'Unannounced', department: 'Operations', dates: '10 - 11 Jun 2026', version: '1.0 (Returned)', status: 'returned', lastUpdated: '29 Jun 2026', updatedBy: 'Mehmet Kaya', dueDate: '-', dueNote: '', findings: '4 / 5 findings ready', cap: 'One CAP needs clarification', capDetail: '1 returned CAP response', period: 'last90', action: 'Revise Report', actionType: 'prepare' },
    { reportId: 'FR-2026-038', inspectionId: 'INS-2026-038', organization: 'FlyHigh Catering', orgCount: '1 Organization', type: 'Routine (Announced)', department: 'Catering', dates: '05 - 07 Jun 2026', version: '1.0 (Final)', status: 'approved', lastUpdated: '25 Jun 2026', updatedBy: 'Elif Demir', dueDate: '-', dueNote: '', findings: '3 / 3 findings closed', cap: 'CAP implementation closed', capDetail: '3 / 3 CAPs closed', period: 'last90', action: 'View Report', actionType: 'preview' },
    { reportId: 'FR-2026-040', inspectionId: 'INS-2026-040', organization: 'SkyFuel Services', orgCount: '1 Organization', type: 'Risk-based (Announced)', department: 'Fuel Operations', dates: '28 - 30 May 2026', version: '1.0 (Final)', status: 'approved', lastUpdated: '20 Jun 2026', updatedBy: 'Elif Demir', dueDate: '-', dueNote: '', findings: '2 / 2 findings closed', cap: 'CAP implementation closed', capDetail: '2 / 2 CAPs closed', period: 'last90', action: 'View Report', actionType: 'preview' },
    { reportId: 'FR-2026-041', inspectionId: 'INS-2026-041', organization: 'Metro Ground Handling', orgCount: '2 Organizations', type: 'Routine', department: 'Ground Handling', dates: '15 - 17 May 2026', version: '1.0 (Final)', status: 'approved', lastUpdated: '18 Jun 2026', updatedBy: 'Selin Yildiz', dueDate: '-', dueNote: '', findings: '4 / 4 findings closed', cap: 'CAP implementation closed', capDetail: '4 / 4 CAPs closed', period: 'last90', action: 'View Report', actionType: 'preview' },
    { reportId: 'FR-2026-045', inspectionId: 'INS-2026-045', organization: 'SecureAir Services', orgCount: '1 Organization', type: 'Unannounced', department: 'Security', dates: '30 Apr - 01 May 2026', version: '1.0 (Final)', status: 'approved', lastUpdated: '10 Jun 2026', updatedBy: 'Elif Demir', dueDate: '-', dueNote: '', findings: '1 / 1 finding closed', cap: 'No CAP required', capDetail: 'Observation closed', period: 'last90', action: 'View Report', actionType: 'preview' }
  ];
}

function leadFinalReportStatusMeta(status) {
  var map = {
    ready: { label: 'Ready for Preparation', tone: 'ready' },
    draft: { label: 'Draft', tone: 'draft' },
    waiting: { label: 'Waiting Approval', tone: 'waiting' },
    returned: { label: 'Returned for Revision', tone: 'returned' },
    approved: { label: 'Approved', tone: 'approved' }
  };
  return map[status] || map.draft;
}

function leadFinalReportFilteredRows(ui) {
  var query = (ui.finalReportQuery || '').toLowerCase().trim();
  return leadFinalReportRows().filter(function (row) {
    if (ui.finalReportStatus && ui.finalReportStatus !== 'all' && row.status !== ui.finalReportStatus) return false;
    if (ui.finalReportDepartment && ui.finalReportDepartment !== 'all' && row.department !== ui.finalReportDepartment) return false;
    if (ui.finalReportPeriod && ui.finalReportPeriod !== 'all' && row.period !== ui.finalReportPeriod) return false;
    if (!query) return true;
    return (row.reportId + ' ' + row.inspectionId + ' ' + row.organization + ' ' + row.department).toLowerCase().indexOf(query) >= 0;
  });
}

function leadFinalReportMetricsHtml(rows) {
  function count(status) {
    return rows.filter(function (row) { return row.status === status; }).length;
  }
  return '<div class="prelim-report-metrics final-report-list-metrics">' +
    leadPreliminaryMetricCard('All Reports', rows.length, 'total', 'file-text') +
    leadPreliminaryMetricCard('Ready for Preparation', count('ready'), 'ready', 'clipboard-check') +
    leadPreliminaryMetricCard('Draft', count('draft'), 'draft', 'file-text') +
    leadPreliminaryMetricCard('Waiting Approval', count('waiting'), 'waiting', 'history') +
    leadPreliminaryMetricCard('Returned', count('returned'), 'returned', 'refresh-cw') +
    leadPreliminaryMetricCard('Approved', count('approved'), 'approved', 'check-circle') +
  '</div>';
}

function leadFinalReportFiltersHtml(ui) {
  var departments = leadFinalReportRows().map(function (row) { return row.department; }).filter(function (department, index, list) {
    return list.indexOf(department) === index;
  }).sort();
  var statusOptions = [
    ['all', 'All Statuses'],
    ['ready', 'Ready for Preparation'],
    ['draft', 'Draft'],
    ['waiting', 'Waiting Approval'],
    ['returned', 'Returned for Revision'],
    ['approved', 'Approved']
  ].map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + ((ui.finalReportStatus || 'all') === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
  var departmentOptions = '<option value="all"' + ((ui.finalReportDepartment || 'all') === 'all' ? ' selected' : '') + '>All Departments</option>' +
    departments.map(function (department) {
      return '<option value="' + esc(department) + '"' + (ui.finalReportDepartment === department ? ' selected' : '') + '>' + esc(department) + '</option>';
    }).join('');
  var periodOptions = [
    ['last90', 'Last 90 Days'],
    ['all', 'All Dates']
  ].map(function (option) {
    return '<option value="' + esc(option[0]) + '"' + ((ui.finalReportPeriod || 'last90') === option[0] ? ' selected' : '') + '>' + esc(option[1]) + '</option>';
  }).join('');
  return '<div class="prelim-report-filters final-report-list-filters responsive-filter-row">' +
    '<label class="prelim-report-search"><span class="prelim-report-filter-icon">⌕</span><input type="search" data-field="final-report-list-query" value="' + esc(ui.finalReportQuery || '') + '" placeholder="Search by inspection ID or organization..."></label>' +
    '<label><span>Status</span><select data-field="final-report-list-status">' + statusOptions + '</select></label>' +
    '<label><span>Department</span><select data-field="final-report-list-department">' + departmentOptions + '</select></label>' +
    '<label><span>Date Range</span><select data-field="final-report-list-period">' + periodOptions + '</select></label>' +
  '</div>';
}

function leadFinalReportTableHtml(rows, totalCount) {
  var visibleRows = rows.slice(0, 8);
  var body = visibleRows.length ? visibleRows.map(function (row) {
    var status = leadFinalReportStatusMeta(row.status);
    var finalAction = row.actionType === 'preview' ? 'preview' : 'prepare';
    return '<tr>' +
      '<td><button class="prelim-report-link" data-act="final-report-list-open" data-id="' + esc(row.reportId) + '">' + esc(row.inspectionId) + '</button><span>' + esc(row.type + ' · ' + row.dates) + '</span></td>' +
      '<td><b>' + esc(row.organization) + '</b><span>' + esc(row.orgCount + ' · ' + row.department) + '</span></td>' +
      '<td><b>' + esc(row.findings) + '</b><span>' + esc(row.capDetail) + '</span></td>' +
      '<td><span class="prelim-status is-' + esc(status.tone) + '">' + esc(status.label) + '</span><span>' + esc(row.cap) + '</span><span>' + esc(row.version) + '</span></td>' +
      '<td><b>' + esc(row.lastUpdated) + '</b><span>' + esc(row.updatedBy) + '</span></td>' +
      '<td><b>' + esc(row.dueDate) + '</b><span>' + esc(row.dueNote) + '</span></td>' +
      '<td><button class="btn btn--sm" data-act="final-report-ready-action" data-final-action="' + esc(finalAction) + '">' + esc(row.action) + '</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7"><div class="empty">No final reports match the current filters.</div></td></tr>';
  return '<section class="prelim-report-table-panel final-report-list-table-panel">' +
    '<div class="prelim-report-table-wrap"><table class="prelim-report-table final-report-list-table"><thead><tr>' +
      '<th>Inspection</th><th>Organization</th><th>Findings Summary</th><th>CAP Implementation</th><th>Last Updated</th><th>Due Date</th><th>Actions</th>' +
    '</tr></thead><tbody>' + body + '</tbody></table></div>' +
    '<div class="prelim-report-table-foot">' +
      '<span>Showing ' + (visibleRows.length ? '1' : '0') + ' to ' + esc(String(visibleRows.length)) + ' of ' + esc(String(totalCount)) + ' reports</span>' +
      '<div class="prelim-report-pager"><button disabled>‹</button><button class="is-active">1</button><button>2</button><button>3</button><button>›</button></div>' +
    '</div>' +
  '</section>';
}

function viewLeadFinalReports() {
  var ui = capTrackingUiState();
  if (!ui.finalReportStatus) ui.finalReportStatus = 'all';
  if (!ui.finalReportDepartment) ui.finalReportDepartment = 'all';
  if (!ui.finalReportPeriod) ui.finalReportPeriod = 'last90';
  if (!ui.finalReportQuery) ui.finalReportQuery = '';
  var allRows = leadFinalReportRows();
  var rows = leadFinalReportFilteredRows(ui);
  return '<div class="prelim-reports-page final-report-list-page">' +
    '<div class="prelim-reports-head">' +
      '<div><h1>Final Reports</h1><p>View and manage all final reports you are leading.</p></div>' +
      '<div class="final-report-list-actions"><button class="btn" data-act="final-report-ready-action" data-final-action="preview">Preview PDF</button></div>' +
    '</div>' +
    leadFinalReportFiltersHtml(ui) +
    leadFinalReportMetricsHtml(allRows) +
    leadFinalReportTableHtml(rows, rows.length) +
  '</div>';
}

function viewLeadFinalReportDocument() {
  return '<div class="final-report-view-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><span>Final Reports</span><span>›</span><b>Final Report</b></div>' +
    '<div class="final-report-view-head">' +
      '<div><h1>Final Report ' + demoBadge('Approved', 'ok') + '</h1></div>' +
      '<div class="final-report-actions"><button class="btn" data-act="final-report-export-pdf"><span>↓</span>Export PDF</button><button class="btn btn--primary" data-act="final-report-print"><span>▦</span>Print Report</button></div>' +
    '</div>' +
    '<article class="final-report-doc">' +
      '<section class="final-report-hero">' +
        '<div class="final-report-brand"><span>' + finalReportIcon('send') + '</span><b>SkyCargo Air</b></div>' +
        '<div class="final-report-meta-grid">' +
          '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
          '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
          '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
          '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
          '<div><span>Report Version</span><b>2.0 (Final Report)</b></div>' +
          '<div><span>Final Report Date</span><b>30 Jun 2026</b></div>' +
        '</div>' +
      '</section>' +
      '<section class="final-report-section"><h2>1. Executive Summary</h2><p>This inspection was conducted between 12 - 14 Jun 2026 at SkyCargo Air (Service Provider) in accordance with applicable regulations and standards. A total of 9 findings were identified across 5 organizations.</p><p>Overall, the security system is effective; however, certain areas require improvement to ensure full compliance with applicable regulations.</p></section>' +
      '<section class="final-report-section"><h2>2. Inspection Overview</h2><div class="final-report-overview-grid">' +
        finalReportOverviewItem('file-text', 'Scope', 'Physical Security') +
        finalReportOverviewItem('shield-alert', 'Regulatory Basis', 'ICAO Annex 17, National Regulations') +
        finalReportOverviewItem('building', 'Organizations Included', '5') +
        finalReportOverviewItem('clipboard-list', 'Inspection Plan', 'INS-2026-014 / Rev. 1') +
        finalReportOverviewItem('users', 'Inspection Team', 'Aylin Sezer (Lead Inspector) and 3 Inspectors') +
        finalReportOverviewItem('history', 'Inspection Duration', '3 Days') +
        finalReportOverviewItem('circle-help', 'Inspection Method', 'Interviews, Document Review, Observation') +
        finalReportOverviewItem('target', 'Inspection Locations', 'Head Office, Cargo Terminal, Ramp Area, Warehouse, Access Control Points') +
      '</div></section>' +
      '<section class="final-report-section"><h2>3. Findings Summary</h2><div class="final-report-findings">' +
        '<aside class="final-report-severity-list"><div><span class="is-l1">×</span><b>Level 1 (Critical)</b><strong>2</strong></div><div><span class="is-l2">!</span><b>Level 2 (Major)</b><strong>3</strong></div><div><span class="is-l3">i</span><b>Level 3 (Observation)</b><strong>4</strong></div><div><b>Total Findings</b><strong>9</strong></div></aside>' +
        '<div class="final-ready-table-wrap"><table class="final-ready-table final-report-table"><thead><tr><th>Level</th><th>Description</th><th>Count</th><th>Percentage</th></tr></thead><tbody>' + finalReportFindingRows() + '</tbody></table></div>' +
      '</div></section>' +
      '<section class="final-report-section"><h2>4. CAP Implementation Summary</h2><div class="final-report-cap-grid"><div><span>Total CAPs</span><b>9</b></div><div><span>Closed</span><b class="is-ok">2 (22%)</b></div><div><span>In Progress</span><b class="is-warn">5 (56%)</b></div><div><span>Not Started</span><b>2 (22%)</b></div><div><span>Overdue</span><b class="is-danger">0</b></div></div><p>All corrective actions must be completed by the due dates defined in the CAP plan. The organization is responsible for providing evidence of implementation and closure.</p></section>' +
      '<section class="final-report-section"><h2>5. Conclusions</h2><p>SkyCargo Air has an effective security management system. Implementation of the outstanding corrective actions will further enhance compliance and overall security performance.</p></section>' +
      '<section class="final-report-section"><h2>6. Recommendations</h2><ul><li>Ensure all Level 1 and Level 2 findings are addressed within the defined due dates.</li><li>Strengthen training and awareness programs for access control procedures.</li><li>Improve documentation and record keeping for security equipment maintenance.</li></ul></section>' +
      '<section class="final-report-section"><h2>7. Appendices & Attachments</h2><div class="final-ready-table-wrap"><table class="final-ready-table final-report-table"><thead><tr><th>File Name</th><th>Description</th><th>File Type</th><th>Pages</th></tr></thead><tbody>' + finalReportAttachmentRows() + '</tbody></table></div><small>Total Attachments: 4</small></section>' +
      '<section class="final-report-signatures"><div><span class="final-report-signature-mark">Aylin</span><b>Report Prepared By</b><p>Aylin Sezer<br>Lead Inspector<br>30 Jun 2026</p></div><div><span class="final-report-signature-mark">Selin</span><b>Reviewed By</b><p>Department Manager<br>30 Jun 2026</p></div><div><span class="final-report-signature-mark">Baran</span><b>Approved By</b><p>General Manager<br>30 Jun 2026</p></div><div class="final-report-stamp"><strong>APPROVED</strong><span>30 JUN 2026</span></div></section>' +
    '</article>' +
  '</div>';
}

function viewLeadFinalReportReady() {
  var ui = capTrackingUiState();
  var readyAt = ui.finalReportReadyAt || ui.allCapsApprovedAt || '30 Jun 2026 16:20';
  var prepared = !!ui.finalReportPreparedAt;
  var orgRows = [
    ['SkyCargo Air (Service Provider)', 'Approved', '9 / 9', '30 Jun 2026 16:20'],
    ['SkyCargo Ground Handling Ltd.', 'Approved', '5 / 5', '30 Jun 2026 14:45'],
    ['SkyFuel Services', 'Approved', '3 / 3', '30 Jun 2026 13:50'],
    ['SkySecurity Services', 'Approved', '4 / 4', '30 Jun 2026 13:10'],
    ['SkyCatering Ltd.', 'Approved', '2 / 2', '30 Jun 2026 12:30']
  ];
  var sections = [
    ['Executive Summary', 'Completed'],
    ['Inspection Overview', 'Completed'],
    ['Findings Summary', 'Completed'],
    ['CAP Implementation Summary', 'Completed'],
    ['Conclusions', prepared ? 'Completed' : 'In Progress'],
    ['Recommendations', prepared ? 'In Progress' : 'Not Started'],
    ['Appendices & Attachments', 'Not Started']
  ];
  return '<div class="final-ready-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><b>Final Reports</b></div>' +
    '<div class="final-ready-head">' +
      '<div><h1>Final Reports - Ready for Preparation ' + demoBadge('All CAPs Approved', 'ok') + '</h1></div>' +
      '<button class="btn btn--primary" data-act="final-report-ready-action" data-final-action="record">View Inspection Record</button>' +
    '</div>' +
    '<div class="final-ready-meta">' +
      '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
      '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
      '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
      '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
      '<div><span>Report Version</span><b>2.0 (Final Report)</b></div>' +
      '<div><span>All Approvals Completed On</span><b>' + esc(readyAt) + '</b></div>' +
    '</div>' +
    '<div class="final-ready-layout">' +
      '<main class="final-ready-main">' +
        '<section class="final-ready-banner"><div><b>All CAPs have been reviewed and approved by all authorities.</b><p>You can now prepare the Final Report.</p></div><button class="btn" data-act="nav" data-view="findings" data-filter="capreview">View CAPs & Approvals</button></section>' +
        '<section class="final-ready-panel"><h2>CAP Summary (All Organizations)</h2><div class="final-ready-cards">' +
          finalReadySummaryCard('Total Findings', '9', '100% addressed') +
          finalReadySummaryCard('Level 1 (Critical)', '2', 'Due in 14 days', 'l1') +
          finalReadySummaryCard('Level 2 (Major)', '3', 'Due in 90 days', 'l2') +
          finalReadySummaryCard('Level 3 (Observation)', '4', 'Observation / No Due Date', 'l3') +
          finalReadySummaryCard('CAP Status', 'Approved', 'On 30 Jun 2026', 'ok') +
        '</div></section>' +
        '<section class="final-ready-panel"><h2>Organizations Included in this Inspection</h2><div class="final-ready-table-wrap"><table class="final-ready-table"><thead><tr><th>Organization</th><th>CAP Status</th><th>CAPs Submitted</th><th>All Approvals Completed On</th><th></th></tr></thead><tbody>' +
          orgRows.map(function (row) {
            return '<tr><td>' + esc(row[0]) + '</td><td class="is-ok">' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td><button class="btn btn--sm" data-act="nav" data-view="findings" data-filter="capreview">View Details</button></td></tr>';
          }).join('') +
        '</tbody></table></div></section>' +
        '<section class="final-ready-panel"><h2>Final Report Preparation</h2><p>All CAPs are approved. You can now prepare the Final Report. Once submitted, it will go through the approval workflow.</p>' +
          '<div class="final-ready-prep-grid">' +
            '<div class="final-ready-prep-card"><h3>Report Information</h3><div class="final-ready-info-list"><div><span>Version</span><b>2.0 (Final)</b></div><div><span>Draft Title</span><b>INS-2026-014 Final Report - SkyCargo Air</b></div><div><span>Language</span><b>English</b></div><div><span>Last Updated</span><b>' + esc(prepared ? ui.finalReportPreparedAt : '30 Jun 2026 16:25') + '</b></div></div><button class="btn btn--sm">Edit Report Information</button></div>' +
            '<div class="final-ready-prep-card"><h3>Report Sections</h3><div class="final-ready-section-list">' + sections.map(function (section) { return '<div><span>' + esc(section[0]) + '</span><em class="is-' + esc(section[1] === 'Completed' ? 'ok' : (section[1] === 'In Progress' ? 'info' : 'neutral')) + '">' + esc(section[1]) + '</em></div>'; }).join('') + '</div></div>' +
            '<div class="final-ready-prep-card final-ready-actions"><h3>Actions</h3><button class="btn btn--primary" data-act="final-report-ready-action" data-final-action="prepare">' + esc(prepared ? 'Continue Final Report' : 'Prepare / Edit Final Report') + '</button><button class="btn" data-act="final-report-ready-action" data-final-action="preview">Preview Final Report</button><button class="btn" data-act="final-report-ready-action" data-final-action="attachments">Manage Attachments</button></div>' +
          '</div></section>' +
      '</main>' +
      '<aside class="final-ready-side">' +
        '<section class="final-ready-panel"><h2>Approval Status</h2>' +
          finalReadyStatusStep('Inspector Review', 'Aylin Sezer', '30 Jun 2026 10:15') +
          finalReadyStatusStep('Lead Inspector Review', 'Aylin Sezer', '30 Jun 2026 11:40') +
          finalReadyStatusStep('Department Manager Approval', 'Mehmet Kaya', '30 Jun 2026 13:05') +
          finalReadyStatusStep('General Manager Approval', 'Selin Yildiz', '30 Jun 2026 14:30') +
          finalReadyStatusStep('ED Final Approval', 'Elif Demir', '30 Jun 2026 16:20') +
        '</section>' +
        '<section class="final-ready-panel"><h2>Inspection Summary</h2><dl class="final-ready-dl"><dt>Department</dt><dd>Security</dd><dt>Checklist Section</dt><dd>Physical Security</dd><dt>Inspection Dates</dt><dd>12 - 14 Jun 2026</dd><dt>CAP Submitted On</dt><dd>27 Jun 2026 09:15</dd><dt>All Approvals Completed On</dt><dd>30 Jun 2026 16:20</dd><dt>Total Attachments</dt><dd>6 files</dd></dl></section>' +
        '<section class="final-ready-panel"><h2>Next Steps</h2><div class="cap-review-mini-timeline">' +
          '<div class="cap-review-mini-step is-current"><span>1</span><p><b>Lead Inspector Review (You)</b><small>Current Step</small></p></div>' +
          '<div class="cap-review-mini-step is-waiting"><span>2</span><p><b>Department Manager Approval</b><small>Pending</small></p></div>' +
          '<div class="cap-review-mini-step is-waiting"><span>3</span><p><b>General Manager Approval</b><small>Pending</small></p></div>' +
          '<div class="cap-review-mini-step is-waiting"><span>4</span><p><b>ED Final Approval</b><small>Pending</small></p></div>' +
          '<div class="cap-review-mini-step is-waiting"><span>5</span><p><b>Report Release to Service Provider</b><small>Pending</small></p></div>' +
        '</div></section>' +
      '</aside>' +
    '</div>' +
  '</div>';
}

function finalReportPrepareStepsData() {
  return [
    ['executive', 'Executive Summary'],
    ['overview', 'Inspection Overview'],
    ['findings', 'Findings Summary'],
    ['cap', 'CAP Implementation Summary'],
    ['conclusions', 'Conclusions'],
    ['recommendations', 'Recommendations'],
    ['appendices', 'Appendices'],
    ['review', 'Review & Submit']
  ];
}

function finalReportPrepareStepMeta(step) {
  var steps = finalReportPrepareStepsData();
  for (var i = 0; i < steps.length; i++) {
    if (steps[i][0] === step) return { id: steps[i][0], label: steps[i][1], index: i + 1 };
  }
  return { id: 'executive', label: 'Executive Summary', index: 1 };
}

function finalReportPrepareStepper(activeStep) {
  var active = finalReportPrepareStepMeta(activeStep);
  return '<div class="final-prepare-stepper">' + finalReportPrepareStepsData().map(function (step, index) {
    var stepIndex = index + 1;
    var cls = stepIndex < active.index ? ' is-done' : (stepIndex === active.index ? ' is-active' : '');
    var marker = stepIndex < active.index ? '✓' : String(stepIndex);
    return '<button class="final-prepare-step' + cls + '" data-act="final-report-prepare-step" data-step="' + esc(step[0]) + '"><span>' + esc(marker) + '</span><b>' + esc(step[1]) + '</b></button>';
  }).join('') + '</div>';
}

function finalReportOverviewStepper() {
  return finalReportPrepareStepper('overview');
}

function finalReportReviewStepper() {
  return finalReportPrepareStepper('review');
}

function finalReportPrepareSectionRail(activeStep) {
  var active = finalReportPrepareStepMeta(activeStep);
  return '<aside class="final-content-rail">' + finalReportPrepareStepsData().filter(function (step) { return step[0] !== 'review'; }).map(function (step, index) {
    var cls = step[0] === active.id ? ' is-active' : '';
    return '<button class="final-content-rail__item' + cls + '" data-act="final-report-prepare-step" data-step="' + esc(step[0]) + '">' +
      '<b>' + esc(String(index + 1) + '. ' + step[1]) + '</b>' +
    '</button>';
  }).join('') + '</aside>';
}

function finalReportPrepareDefaultContent(step) {
  var content = {
    executive: 'This inspection was conducted between 12 - 14 Jun 2026 at SkyCargo Air (Service Provider) and included a review of physical security controls and procedures.\n\nA total of 9 findings were identified across all organizations.\n\nOverall, the security system is effective; however, certain areas require improvement to ensure full compliance with applicable regulations and standards.',
    overview: 'The inspection covered SkyCargo Air and associated service providers involved in cargo security, screening, ground handling, fuel services and catering support.\n\nThe review focused on configured AVSEC checklist requirements, supporting evidence, CAP implementation status and approval records.',
    findings: 'The inspection resulted in 9 findings: 2 Level 1 Critical, 3 Level 2 Major and 4 Level 3 Observation items.\n\nAll required CAPs have been submitted, reviewed and approved before final report preparation.',
    cap: 'CAP implementation was reviewed against the final report CAP requirements. Service providers submitted corrective action plans, target completion dates and supporting evidence for each applicable finding.\n\nAll CAPs are approved and ready for final report consolidation.',
    conclusions: 'The inspection concludes that controls are generally effective with documented improvements required in access control, screening procedure evidence and security awareness records.',
    recommendations: 'Continue monitoring Level 1 and Level 2 corrective actions within the configured due windows. Maintain evidence version history and conduct targeted follow-up where implementation risk remains.',
    appendices: 'Appendices include the final report PDF, inspection plan, findings evidence package, CAP submission references, approval records and supporting documents.',
    review: 'Review the final report sections, confirm the CAP summary and submit the Final Report for Department Manager approval.'
  };
  return content[step] || content.executive;
}

function finalReportPrepareEditor(ui, meta) {
  var body = ui.finalReportContent || finalReportPrepareDefaultContent(meta.id);
  return '<section class="final-prepare-panel final-content-editor-card">' +
    '<div class="final-content-editor-head"><div><h2>' + esc(meta.index + '. ' + meta.label) + '</h2>' +
    '<p>' + esc(meta.id === 'executive' ? 'Provide a high-level overview of the inspection, key findings and overall conclusion.' : 'Write and refine this Final Report section before submission.') + '</p></div>' +
    '<span class="final-prepare-char-count">Characters: ' + esc(String(body.length)) + '</span></div>' +
    '<div class="final-prepare-toolbar">' +
      '<select aria-label="Text style"><option>Paragraph</option><option>Heading 1</option><option>Heading 2</option></select>' +
      '<button type="button" disabled>B</button><button type="button" disabled>I</button><button type="button" disabled>U</button><button type="button" disabled>≡</button><button type="button" disabled>•</button><button type="button" disabled>1.</button><button type="button" disabled>↗</button><button type="button" disabled>▦</button><button type="button" disabled>↶</button><button type="button" disabled>↷</button>' +
    '</div>' +
    '<div class="final-prepare-editor">' +
      '<label class="sr-only" for="final-report-content">Final report content</label>' +
      '<textarea id="final-report-content" data-field="final-report-content" aria-label="Final report content">' + esc(body) + '</textarea>' +
    '</div>' +
    '<div class="final-content-editor-actions"><button class="btn" data-act="final-report-prepare-save">Save as Draft</button><button class="btn btn--primary" data-act="final-report-prepare-next">Next Section -></button></div>' +
  '</section>';
}

function finalReportPrepareSectionRows(activeStep) {
  var active = finalReportPrepareStepMeta(activeStep);
  return '<div class="final-content-section-list">' + finalReportPrepareStepsData().filter(function (step) { return step[0] !== 'review' && step[0] !== active.id; }).map(function (step, index) {
    var meta = finalReportPrepareStepMeta(step[0]);
    return '<button class="final-content-section-row" data-act="final-report-prepare-step" data-step="' + esc(step[0]) + '">' +
      '<b>' + esc(meta.index + '. ' + step[1]) + '</b>' + demoBadge('Completed', 'ok') + '<span>⌄</span>' +
    '</button>';
  }).join('') + '</div>';
}

function finalReportPrepareProgress() {
  return '<section class="final-prepare-panel final-content-progress"><h2>Report Progress</h2>' +
    '<div class="final-content-progress-steps">' +
      '<div class="is-done"><span>✓</span><b>Content</b></div>' +
      '<div class="is-done"><span>✓</span><b>Review</b></div>' +
      '<div class="is-current"><span>3</span><b>Final Report</b></div>' +
    '</div></section>';
}

function finalReportPrepareSummaryPanel() {
  return '<section class="final-prepare-panel final-content-summary"><h2>Report Summary</h2>' +
    '<dl class="final-prepare-info-list"><dt>Total Organizations</dt><dd>5</dd><dt>Total Findings</dt><dd>9</dd></dl>' +
    '<div class="final-content-levels">' +
      '<div><span class="is-l1"></span><b>Level 1 (Critical)</b><em>2</em></div>' +
      '<div><span class="is-l2"></span><b>Level 2 (Major)</b><em>3</em></div>' +
      '<div><span class="is-l3"></span><b>Level 3 (Observation)</b><em>4</em></div>' +
    '</div>' +
    '<dl class="final-prepare-info-list is-separated"><dt>CAPs Approved</dt><dd class="is-ok">9 / 9</dd><dt>CAP Approval Completed On</dt><dd>30 Jun 2026 16:20</dd></dl>' +
  '</section>';
}

function finalReportPrepareAttachmentsPanel() {
  var files = [
    ['Inspection Plan.pdf', '245 KB', 'pdf'],
    ['Organization List.xlsx', '18 KB', 'xls'],
    ['Evidence Photos.zip', '12.4 MB', 'zip'],
    ['CAP Summary.pdf', '320 KB', 'pdf'],
    ['Additional Documents.pdf', '1.1 MB', 'pdf']
  ];
  return '<section class="final-prepare-panel final-content-attachments"><div class="final-content-panel-head"><h2>Attachments (5)</h2><button class="btn btn--sm" data-act="final-report-ready-action" data-final-action="attachments">View All</button></div>' +
    '<div class="final-content-file-list">' + files.map(function (file) {
      return '<button class="final-content-file" data-act="final-report-ready-action" data-final-action="attachments"><span class="is-' + esc(file[2]) + '"></span><b>' + esc(file[0]) + '</b><em>' + esc(file[1]) + '</em></button>';
    }).join('') + '</div></section>';
}

function finalReportPrepareSide(ui) {
  var savedAt = ui.finalReportSavedAt || ui.finalReportPreparedAt || '30 Jun 2026 16:25';
  return '<aside class="final-prepare-side">' +
    finalReportPrepareProgress() +
    finalReportPrepareSummaryPanel() +
    '<section class="final-prepare-panel"><h2>Report Information</h2><dl class="final-prepare-info-list"><dt>Report Title</dt><dd>INS-2026-014 Final Report - SkyCargo Air</dd><dt>Report Version</dt><dd>2.0 (Final Report)</dd><dt>Report Language</dt><dd>English</dd><dt>Last Saved</dt><dd>' + esc(savedAt) + '<br>by Aylin Sezer</dd></dl></section>' +
    finalReportPrepareAttachmentsPanel() +
  '</aside>';
}

function finalReportReviewChecklistRows() {
  var rows = [
    ['executive', '1. Executive Summary', '30 Jun 2026 14:25'],
    ['overview', '2. Inspection Overview', '30 Jun 2026 14:20'],
    ['findings', '3. Findings Summary', '30 Jun 2026 14:22'],
    ['cap', '4. CAP Implementation Summary', '30 Jun 2026 14:23'],
    ['conclusions', '5. Conclusions', '30 Jun 2026 14:24'],
    ['recommendations', '6. Recommendations', '30 Jun 2026 14:24'],
    ['appendices', '7. Appendices & Attachments', '30 Jun 2026 14:24']
  ];
  return rows.map(function (row) {
    return '<tr><td>' + esc(row[1]) + '</td><td>' + demoBadge('Completed', 'ok') + '</td><td>' + esc(row[2]) + '</td><td>Aylin Sezer</td><td><button class="btn btn--sm" data-act="final-report-prepare-step" data-step="' + esc(row[0]) + '">Review</button></td></tr>';
  }).join('');
}

function finalReportReviewAttachmentRows() {
  var files = [
    ['INS-2026-014_Final_Report.pdf', 'PDF', '1.2 MB', '30 Jun 2026 14:24', 'Aylin Sezer'],
    ['Inspection_Plan.pdf', 'PDF', '245 KB', '28 Jun 2026 10:15', 'Aylin Sezer'],
    ['Evidence_Photos.zip', 'ZIP', '12.4 MB', '28 Jun 2026 10:20', 'Aylin Sezer'],
    ['CAP_Summary.pdf', 'PDF', '320 KB', '30 Jun 2026 14:22', 'Aylin Sezer']
  ];
  return files.map(function (file) {
    return '<tr><td>' + esc(file[0]) + '</td><td>' + esc(file[1]) + '</td><td>' + esc(file[2]) + '</td><td>' + esc(file[3]) + '</td><td>' + esc(file[4]) + '</td><td><button class="btn btn--icon" data-act="final-report-ready-action" data-final-action="attachments" aria-label="Download ' + esc(file[0]) + '">↓</button></td></tr>';
  }).join('');
}

function finalReportReviewWorkflowPanel() {
  return '<section class="final-ready-panel"><h2>Approval Workflow</h2><div class="final-overview-workflow">' +
    finalReportOverviewWorkflowStep(1, 'Inspector Review', 'Approved', '30 Jun 2026 10:15', 'approved') +
    finalReportOverviewWorkflowStep(2, 'Lead Inspector Review', 'Approved', '30 Jun 2026 11:40', 'approved') +
    finalReportOverviewWorkflowStep(3, 'Department Manager Approval', 'Pending', '-', 'current') +
    finalReportOverviewWorkflowStep(4, 'General Manager Approval', 'Pending', '-', 'pending') +
    finalReportOverviewWorkflowStep(5, 'ED Final Approval', 'Pending', '-', 'pending') +
  '</div></section>';
}

function modalFinalReportSubmitApproval() {
  var icon = typeof navIconSvg === 'function'
    ? '<svg viewBox="0 0 24 24" focusable="false">' + navIconSvg('send') + '</svg>'
    : '->';
  return '<div class="modal modal--final-submit">' +
    '<div class="modal__head"><h3>Submit Final Report for Approval</h3><button class="modal__close" data-act="close-modal" aria-label="Close">×</button></div>' +
    '<div class="modal__body">' +
      '<div class="final-submit-modal">' +
        '<div class="final-submit-modal__icon">' + icon + '</div>' +
        '<p>You are about to submit the final report for approval.</p>' +
        '<p>Once submitted, the report will move to the next stage of the approval workflow.</p>' +
        '<div class="final-submit-modal__summary"><h4>Summary</h4><dl>' +
          '<dt>Inspection ID</dt><dd>INS-2026-014</dd>' +
          '<dt>Organization</dt><dd>SkyCargo Air</dd>' +
          '<dt>Total Findings</dt><dd>9</dd>' +
          '<dt>CAPs Approved</dt><dd>9 / 9</dd>' +
          '<dt>Next Approver</dt><dd>Department Manager</dd>' +
        '</dl></div>' +
      '</div>' +
    '</div>' +
    '<div class="modal__foot final-submit-modal__foot"><button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="final-report-prepare-confirm-submit">Confirm Submit</button></div>' +
  '</div>';
}

function viewLeadFinalReportReviewSubmit(ui) {
  return '<div class="final-prepare-page final-review-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><span>Final Reports</span><span>›</span><b>Review & Submit</b></div>' +
    '<div class="final-ready-head">' +
      '<div><h1>Review & Submit ' + demoBadge('All CAPs Approved', 'ok') + '</h1></div>' +
      '<div class="cap-track-head-actions"><button class="btn" data-act="final-report-prepare-step" data-step="executive">Back to Report Content</button><button class="btn btn--primary" data-act="final-report-prepare-submit">Submit for Approval</button></div>' +
    '</div>' +
    '<div class="final-ready-meta">' +
      '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
      '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
      '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
      '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
      '<div><span>Report Version</span><b>2.0 (Final Report)</b></div>' +
      '<div><span>All CAPs Approved On</span><b>' + esc(ui.allCapsApprovedAt || ui.finalReportReadyAt || '30 Jun 2026 16:20') + '</b></div>' +
    '</div>' +
    finalReportReviewStepper() +
    '<div class="final-review-layout">' +
      '<main class="final-review-main">' +
        '<section class="final-ready-panel"><h2>Review Checklist</h2><p>Please review all sections before submitting the final report.</p><div class="final-ready-table-wrap"><table class="final-ready-table final-review-table"><thead><tr><th>Section</th><th>Status</th><th>Last Updated</th><th>Updated By</th><th>Action</th></tr></thead><tbody>' + finalReportReviewChecklistRows() + '</tbody></table></div><div class="final-review-ok-note"><span>✓</span><b>All sections are completed and ready for submission.</b></div></section>' +
        '<section class="final-ready-panel final-review-attachments"><div class="final-content-panel-head"><div><h2>Attachments</h2><p>All required attachments have been added.</p></div><button class="btn btn--sm" data-act="final-report-ready-action" data-final-action="attachments">Manage Attachments</button></div><div class="final-ready-table-wrap"><table class="final-ready-table"><thead><tr><th>File Name</th><th>File Type</th><th>Size</th><th>Uploaded On</th><th>Uploaded By</th><th>Action</th></tr></thead><tbody>' + finalReportReviewAttachmentRows() + '</tbody></table></div></section>' +
        '<section class="final-ready-panel final-review-comments"><h2>Lead Inspector Comments <span>(Optional)</span></h2><label class="sr-only" for="final-review-comments">Lead Inspector Comments</label><textarea id="final-review-comments" maxlength="1000" placeholder="Add any additional comments for the approvers (optional)..."></textarea><em>0 / 1000</em></section>' +
      '</main>' +
      '<aside class="final-review-side">' +
        finalReportPrepareSummaryPanel() +
        finalReportReviewWorkflowPanel() +
        '<section class="final-ready-panel final-review-note"><h2>Submission Note</h2><p>By submitting this report, you confirm that all information is accurate and complete to the best of your knowledge.</p></section>' +
      '</aside>' +
    '</div>' +
    '<div class="final-review-bottom"><button class="btn" data-act="final-report-prepare-save">Save as Draft</button><button class="btn btn--primary" data-act="final-report-prepare-submit">Submit for Approval</button></div>' +
  '</div>';
}

function finalReportOverviewOrgs() {
  return [
    ['SkyCargo Air (Service Provider)', '9 / 9', '9 / 9', '2', '3', '4'],
    ['SkyCargo Ground Handling Ltd.', '5 / 5', '5 / 5', '1', '2', '2'],
    ['SkyFuel Services', '3 / 3', '3 / 3', '1', '1', '1'],
    ['SkySecurity Services', '4 / 4', '4 / 4', '1', '2', '1'],
    ['SkyCatering Ltd.', '2 / 2', '2 / 2', '0', '1', '1']
  ];
}

function finalReportOverviewWorkflowStep(index, label, status, time, tone) {
  return '<div class="final-overview-workflow-step is-' + esc(tone || 'pending') + '">' +
    '<span>' + esc(tone === 'approved' ? '✓' : String(index)) + '</span>' +
    '<b>' + esc(label) + '</b>' +
    '<em>' + esc(status) + '</em>' +
    '<small>' + esc(time || '-') + '</small>' +
  '</div>';
}

function finalReportOverviewMetric(label, value, detail, tone, actionLabel) {
  return '<article class="final-overview-finding-card is-' + esc(tone || 'neutral') + '">' +
    '<span></span><p><b>' + esc(label) + '</b><strong>' + esc(value) + '</strong><small>' + esc(detail) + '</small></p>' +
    '<button class="btn btn--sm" data-act="nav" data-view="findings" data-filter="capreview">' + esc(actionLabel || 'View Findings') + '</button>' +
  '</article>';
}

function viewLeadFinalReportInspectionOverview(ui) {
  var savedAt = ui.finalReportSavedAt || ui.finalReportPreparedAt || '30 Jun 2026 16:25';
  return '<div class="final-prepare-page final-overview-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><span>Final Reports</span><span>›</span><b>Inspection Overview</b></div>' +
    '<div class="final-ready-head">' +
      '<div><h1>Inspection Overview ' + demoBadge('All CAPs Approved', 'ok') + '</h1></div>' +
      '<div class="cap-track-head-actions"><button class="btn" data-act="final-report-prepare-back">Back to Final Reports</button><button class="btn btn--primary" data-act="final-report-prepare-step" data-step="executive">Prepare Final Report -></button></div>' +
    '</div>' +
    '<div class="final-ready-meta">' +
      '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
      '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
      '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
      '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
      '<div><span>Report Version</span><b>2.0 (Final Report)</b></div>' +
      '<div><span>All Approvals Completed On</span><b>' + esc(ui.allCapsApprovedAt || ui.finalReportReadyAt || '30 Jun 2026 16:20') + '</b></div>' +
    '</div>' +
    finalReportOverviewStepper() +
    '<div class="final-overview-layout">' +
      '<main class="final-overview-main">' +
        '<section class="final-ready-panel final-overview-org-panel"><h2>Organizations & CAPs Overview</h2><div class="final-ready-table-wrap"><table class="final-ready-table final-overview-table"><thead><tr><th>Organization</th><th>CAPs Submitted</th><th>CAPs Approved</th><th>Level 1 (Critical)</th><th>Level 2 (Major)</th><th>Level 3 (Observation)</th><th>Action</th></tr></thead><tbody>' +
          finalReportOverviewOrgs().map(function (row) {
            return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td><td>' + esc(row[3]) + '</td><td>' + esc(row[4]) + '</td><td>' + esc(row[5]) + '</td><td><button class="btn btn--sm" data-act="nav" data-view="findings" data-filter="capreview">View Details</button></td></tr>';
          }).join('') +
        '</tbody></table></div><div class="final-overview-org-summary">' +
          '<div><span class="is-total"></span><p><b>Total Organizations</b><strong>5</strong></p></div>' +
          '<div><span class="is-submitted"></span><p><b>Total CAPs Submitted</b><strong>23 / 23</strong></p></div>' +
          '<div><span class="is-approved"></span><p><b>Total CAPs Approved</b><strong>23 / 23</strong></p></div>' +
          '<div><span class="is-status"></span><p><b>Overall CAP Status</b><strong>All Approved</strong></p></div>' +
        '</div></section>' +
        '<section class="final-ready-panel"><h2>Key Findings by Level (Across All Organizations)</h2><div class="final-overview-finding-grid">' +
          finalReportOverviewMetric('Level 1 (Critical)', '2', 'Due in 14 days', 'l1') +
          finalReportOverviewMetric('Level 2 (Major)', '3', 'Due in 90 days', 'l2') +
          finalReportOverviewMetric('Level 3 (Observation)', '4', 'Observation / No Due Date', 'l3') +
          finalReportOverviewMetric('Total Findings', '9', '100% addressed', 'total', 'View All Findings') +
        '</div></section>' +
      '</main>' +
      '<aside class="final-overview-side">' +
        '<section class="final-ready-panel"><h2>Approval Workflow Status</h2><div class="final-overview-workflow">' +
          finalReportOverviewWorkflowStep(1, 'Inspector Review', 'Approved', '30 Jun 2026 10:15', 'approved') +
          finalReportOverviewWorkflowStep(2, 'Lead Inspector Review', 'Approved', '30 Jun 2026 11:40', 'approved') +
          finalReportOverviewWorkflowStep(3, 'Department Manager Approval', 'Pending', '-', 'current') +
          finalReportOverviewWorkflowStep(4, 'General Manager Approval', 'Pending', '-', 'pending') +
          finalReportOverviewWorkflowStep(5, 'ED Final Approval', 'Pending', '-', 'pending') +
        '</div></section>' +
        '<section class="final-ready-panel"><h2>Report Information</h2><dl class="final-ready-dl"><dt>Report Title</dt><dd>INS-2026-014 Final Report<br>- SkyCargo Air</dd><dt>Report Version</dt><dd>2.0 (Final Report)</dd><dt>Report Language</dt><dd>English</dd><dt>Last Saved</dt><dd>' + esc(savedAt) + '<br>by Aylin Sezer</dd></dl></section>' +
        '<section class="final-ready-panel"><h2>Next Steps</h2><p>All CAPs have been approved. Please proceed to prepare the final report.</p><ol class="final-overview-next-list"><li>Prepare Final Report</li><li>Submit for ED Approval</li><li>Report will be issued to the service provider</li><li>Track CAP closure in the CAP module</li></ol></section>' +
      '</aside>' +
    '</div>' +
    '<div class="final-overview-bottom"><button class="btn" data-act="final-report-prepare-save">Save Draft</button><button class="btn btn--primary" data-act="final-report-prepare-next">Next: Findings Summary -></button></div>' +
  '</div>';
}

function viewLeadFinalReportPrepare() {
  var ui = capTrackingUiState();
  var meta = finalReportPrepareStepMeta(ui.finalReportPrepareStep || 'executive');
  if (meta.id === 'overview') return viewLeadFinalReportInspectionOverview(ui);
  if (meta.id === 'review') return viewLeadFinalReportReviewSubmit(ui);
  return '<div class="final-prepare-page">' +
    '<div class="cap-review-crumb"><span>Dashboard</span><span>›</span><span>My Assignments</span><span>›</span><span>INS-2026-014</span><span>›</span><span>Final Reports</span><span>›</span><span>Prepare Final Report</span><span>›</span><b>Report Content</b></div>' +
    '<div class="final-ready-head">' +
      '<div><h1>Report Content ' + demoBadge('All CAPs Approved', 'ok') + '</h1></div>' +
      '<div class="cap-track-head-actions"><button class="btn" data-act="final-report-prepare-back">Back to Final Report Submission</button><button class="btn btn--primary" data-act="final-report-prepare-review">Save & Continue to Review -></button></div>' +
    '</div>' +
    '<div class="final-ready-meta">' +
      '<div><span>Inspection ID</span><b>INS-2026-014</b></div>' +
      '<div><span>Organization</span><b>SkyCargo Air</b></div>' +
      '<div><span>Inspection Type</span><b>Routine (Announced)</b></div>' +
      '<div><span>Inspection Dates</span><b>12 - 14 Jun 2026</b></div>' +
      '<div><span>Report Version</span><b>2.0 (Final Report)</b></div>' +
      '<div><span>All CAPs Approved On</span><b>' + esc(ui.allCapsApprovedAt || ui.finalReportReadyAt || '30 Jun 2026 16:20') + '</b></div>' +
    '</div>' +
    '<div class="final-content-layout">' +
      finalReportPrepareSectionRail(meta.id) +
      '<main class="final-prepare-main">' + finalReportPrepareEditor(ui, meta) + finalReportPrepareSectionRows(meta.id) + '</main>' +
      finalReportPrepareSide(ui) +
    '</div>' +
    '<div class="final-content-foot">Last saved: ' + esc(ui.finalReportSavedAt || ui.finalReportPreparedAt || '30 Jun 2026 16:25') + '</div>' +
  '</div>';
}

function viewAuditReportsApproval() {
  var requestedAuditId = state.params && state.params.auditId;
  var requestedFilter = state.params && state.params.filter ? state.params.filter : selectedFilter('audit-reports', 'all');
  if (!requestedAuditId && state.role === 'manager' && requestedFilter === 'preliminary') {
    return viewDepartmentPreliminaryReview();
  }
  if (state.role === 'leadInspector' && requestedFilter === 'preliminary') {
    var preliminaryUi = leadPreliminaryReportsUiState();
    if (preliminaryUi.mode === 'workflow' && state.params && state.params.reportId) return viewLeadPreliminaryWorkflow();
    if (!requestedAuditId) return viewLeadPreliminaryReports();
  }
  if (!requestedAuditId && state.role === 'leadInspector' && requestedFilter === 'final' && state.params && state.params.finalReportId) {
    return viewLeadFinalReportReady();
  }
  if (!requestedAuditId && state.role === 'leadInspector' && requestedFilter === 'final') {
    return viewLeadFinalReports();
  }
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
    : '<div class="muted small">Mock signature appears only after Executive Director / GM approval.</div>';
  var findings = state.findings.filter(function (finding) { return finding.auditId === report.auditId; });
  var reportQueue = (state.auditReports || []).map(workItemFromReport).sort(workItemSort);
  var findingsTable = renderOpsTable(findings.map(function (finding) {
    return workItemFromFinding(finding, { allEvidenceVersions: true });
  }), { includeChildren: true, empty: 'No converted findings for this audit yet.' });
  var reportKind = displayReportTypeLabel(report);
  var signatureTitle = reportKind === 'Final Report' ? 'Final Report Signature' : 'Final Report Signature (later)';

  return pageHead(report.title || (reportKind + ' — ' + report.id), 'Mock report chain: Preliminary Report -> Department Manager review -> Service Provider CAP completion if CAP is required -> Final Report preparation.',
    '<button class="btn" data-act="mock-export">Preview PDF (mock)</button><button class="btn" data-act="mock-export">Preview Word (mock)</button>') +
    guardrailStrip([
      { label: 'Preliminary report example', tone: 'info' },
      { label: 'Mock report module' },
      { label: 'Mock digital signature only', tone: 'warn' },
      { label: 'Enforcement recommendation only', tone: 'warn' }
    ]) +
    '<h2 class="section-heading">Report Approval Queue</h2>' +
    renderOpsTable(reportQueue, { selectedId: report.id, priorityHead: 'Report Type', priorityWidth: '132px', empty: 'No audit report approvals are seeded.' }) +
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
            metaItem('Report type', reportKind) +
            metaItem('Report number', report.reportNumber || 'Generated after Executive Director / GM approval') +
            metaItem('Lead Inspector', audit ? audit.lead : '—') +
            metaItem('Approved by', report.approvedBy || '—') +
            metaItem('Approval date', report.approvalDate ? fmtDate(report.approvalDate) : '—') +
            metaItem('Enforcement recommendation', recommendation) +
          '</div>' +
        '</div></div>' +
        preliminaryNoticeCardHtml(report) +
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
        '<div class="card"><div class="card__head"><h3>' + esc(signatureTitle) + '</h3></div><div class="card__body">' + signature + '</div></div>' +
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
            metaItem('Risk category', f.riskCategory || '—') +
            metaItem('Finding type', f.findingType || '—') +
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

/* =========================== Department Manager findings review =========================== */
function managerFindingsUiState() {
  if (!state.managerFindingsUi || typeof state.managerFindingsUi !== 'object') {
    state.managerFindingsUi = {};
  }
  var ui = state.managerFindingsUi;
  if (typeof ui.query !== 'string') ui.query = '';
  if (!ui.status) ui.status = 'all';
  if (!ui.dateRange) ui.dateRange = 'all';
  if (!ui.selectedAuditId) ui.selectedAuditId = 'AUD-2026-001';
  if (['overview', 'list', 'department', 'level'].indexOf(ui.tab) === -1) ui.tab = 'overview';
  return ui;
}

function managerFindingsOption(value, label, selectedValue) {
  return '<option value="' + esc(value) + '"' + (value === selectedValue ? ' selected' : '') + '>' + esc(label) + '</option>';
}

function managerFindingsAuditStatusBadge(status) {
  var tone = status === 'Closed' || status === 'Report Issued'
    ? 'ok'
    : (status === 'In Progress' ? 'warn' : 'info');
  return demoBadge(status, tone);
}

function managerFindingsTotalCounts(rows) {
  return rows.reduce(function (total, row) {
    Object.keys(total).forEach(function (key) { total[key] += row.counts[key] || 0; });
    return total;
  }, { total: 0, critical: 0, major: 0, minor: 0, observations: 0, open: 0, inReview: 0, closed: 0 });
}

function managerFindingsFilters(ui) {
  return '<div class="manager-findings-filters">' +
    '<label class="manager-findings-search"><span>Search inspections</span><div><input id="manager-findings-query" type="search" value="' + esc(ui.query) + '" placeholder="Audit ID, organization, team leader"><button class="btn btn--primary btn--sm" data-act="manager-findings-filter" data-key="query">Search</button></div></label>' +
    '<label><span>Status</span><select data-field="manager-findings-status">' +
      managerFindingsOption('all', 'All Statuses', ui.status) +
      managerFindingsOption('active', 'Active', ui.status) +
      managerFindingsOption('complete', 'Complete', ui.status) +
      managerFindingsOption('planned', 'Planned', ui.status) +
    '</select></label>' +
    '<label><span>Audit Date</span><select data-field="manager-findings-date-range">' +
      managerFindingsOption('all', 'All Dates', ui.dateRange) +
      managerFindingsOption('today', 'Today', ui.dateRange) +
      managerFindingsOption('past-30', 'Past 30 Days', ui.dateRange) +
      managerFindingsOption('past-90', 'Past 90 Days', ui.dateRange) +
      managerFindingsOption('upcoming', 'Upcoming', ui.dateRange) +
    '</select></label>' +
    '<button class="btn btn--sm manager-findings-reset" data-act="manager-findings-filter" data-key="reset">Reset</button>' +
  '</div>';
}

function managerFindingsKpis(rows) {
  var counts = managerFindingsTotalCounts(rows);
  var items = [
    ['Inspections', rows.length, 'Audits with findings', 'info'],
    ['Total Findings', counts.total, 'Visible inspections', 'neutral'],
    ['Open', counts.open, 'Action remains', 'warn'],
    ['In Review', counts.inReview, 'CAA review queue', 'info'],
    ['Closed', counts.closed, 'Authorized outcome', 'ok']
  ];
  return '<div class="manager-findings-kpis">' + items.map(function (item) {
    return '<div class="manager-findings-kpi is-' + esc(item[3]) + '"><span>' + esc(item[0]) + '</span><strong>' + esc(String(item[1])) + '</strong><small>' + esc(item[2]) + '</small></div>';
  }).join('') + '</div>';
}

function managerFindingsInspectionRows(rows, selectedAuditId) {
  if (!rows.length) {
    return '<tr><td colspan="7"><div class="empty">No inspections match these filters.</div></td></tr>';
  }
  return rows.map(function (row) {
    var selected = row.auditId === selectedAuditId;
    var severity = [
      row.counts.critical + ' Critical',
      row.counts.major + ' Major',
      row.counts.minor + ' Minor',
      row.counts.observations + ' Observation'
    ].join(' · ');
    return '<tr class="manager-findings-inspection-row' + (selected ? ' is-selected' : '') + '">' +
      '<td><button class="manager-findings-audit-link" data-act="manager-findings-select" data-id="' + esc(row.auditId) + '"' + (selected ? ' aria-current="true"' : '') + '>' + esc(row.auditId) + '</button><small>' + esc(row.type) + '</small></td>' +
      '<td><b>' + esc(row.organization) + '</b><small>' + esc(row.department) + '</small></td>' +
      '<td>' + esc(fmtDate(row.auditDate)) + '</td>' +
      '<td>' + esc(row.teamLeader) + '</td>' +
      '<td>' + managerFindingsAuditStatusBadge(row.status) + '</td>' +
      '<td><b>' + esc(String(row.counts.total)) + '</b><small>' + esc(severity) + '</small></td>' +
      '<td><button class="btn btn--sm' + (selected ? ' btn--primary' : '') + '" data-act="manager-findings-select" data-id="' + esc(row.auditId) + '">' + (selected ? 'Selected' : 'Review') + '</button></td>' +
    '</tr>';
  }).join('');
}

function managerFindingsInspectionTable(rows, selectedAuditId) {
  return '<div class="manager-findings-inspection-table"><table><thead><tr>' +
    '<th>Audit ID</th><th>Organization</th><th>Audit Date</th><th>Team Leader</th><th>Status</th><th>Findings</th><th></th>' +
    '</tr></thead><tbody>' + managerFindingsInspectionRows(rows, selectedAuditId) + '</tbody></table></div>';
}

function managerFindingsFocusFinding(findings) {
  return (findings || []).slice().sort(function (left, right) {
    var leftClosed = left.status === 'CLOSED' ? 1 : 0;
    var rightClosed = right.status === 'CLOSED' ? 1 : 0;
    if (leftClosed !== rightClosed) return leftClosed - rightClosed;
    var leftSeverity = left.severity === 0 ? 4 : left.severity;
    var rightSeverity = right.severity === 0 ? 4 : right.severity;
    return leftSeverity - rightSeverity || (left.dueDate || '').localeCompare(right.dueDate || '');
  })[0] || null;
}

function managerFindingsDossierHeader(row) {
  var report = (state.managerReports || []).filter(function (item) { return item.auditId === row.auditId; })[0] || null;
  return '<div class="manager-findings-dossier-head">' +
    '<div><span>Selected inspection</span><h2>' + esc(row.auditId) + ' · ' + esc(row.organization) + '</h2><p>' + esc(row.reference) + '</p></div>' +
    '<div class="manager-findings-dossier-actions">' + managerFindingsAuditStatusBadge(row.status) +
      (report ? '<button class="btn" data-act="manager-findings-open-report" data-id="' + esc(row.auditId) + '">View Full Report</button>' : '') +
    '</div>' +
    '<dl class="manager-findings-audit-meta">' +
      '<div><dt>Audit Date</dt><dd>' + esc(fmtDate(row.auditDate)) + '</dd></div>' +
      '<div><dt>Team Leader</dt><dd>' + esc(row.teamLeader) + '</dd></div>' +
      '<div><dt>Department</dt><dd>' + esc(row.department) + '</dd></div>' +
      '<div><dt>Audit Phase</dt><dd>' + esc(row.phase) + '</dd></div>' +
      '<div><dt>Status</dt><dd>' + esc(row.status) + '</dd></div>' +
      '<div><dt>Organization Type</dt><dd>Operator / Service Provider</dd></div>' +
    '</dl>' +
  '</div>';
}

function managerFindingsTabs(active) {
  var tabs = [
    ['overview', 'Findings Overview'],
    ['list', 'Findings List'],
    ['department', 'By Department'],
    ['level', 'By Level']
  ];
  return '<div class="manager-findings-tabs" role="tablist" aria-label="Findings review sections">' + tabs.map(function (tab) {
    return '<button role="tab" aria-selected="' + (active === tab[0] ? 'true' : 'false') + '" class="' + (active === tab[0] ? 'is-active' : '') + '" data-act="manager-findings-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function managerFindingsSummaryCards(row) {
  var counts = row.counts;
  var levels = [
    ['Level 1 Critical', counts.critical, 'danger'],
    ['Level 2 Major', counts.major, 'warn'],
    ['Level 3 Minor', counts.minor, 'info'],
    ['Observations', counts.observations, 'neutral']
  ];
  var statuses = [
    ['Open', counts.open, 'warn'],
    ['In Review', counts.inReview, 'info'],
    ['Closed', counts.closed, 'ok']
  ];
  function cards(title, items) {
    return '<section class="manager-findings-summary"><h3>' + esc(title) + '</h3><div>' + items.map(function (item) {
      return '<article class="is-' + esc(item[2]) + '"><span>' + esc(item[0]) + '</span><strong>' + esc(String(item[1])) + '</strong></article>';
    }).join('') + '</div></section>';
  }
  return '<div class="manager-findings-summary-grid">' + cards('By Level', levels) + cards('By Status', statuses) + '</div>';
}

function managerFindingsFocusStrip(row) {
  var finding = managerFindingsFocusFinding(row.findings);
  if (!finding) return '<div class="empty">No findings are linked to this inspection.</div>';
  var due = finding.dueDate ? fmtDate(finding.dueDate) : '—';
  var closureMeta = finding.status === 'CLOSED' && finding.closedDate
    ? '<small>Closed ' + esc(fmtDate(finding.closedDate)) + '</small>'
    : '';
  return '<section class="manager-findings-focus">' +
    '<div class="manager-findings-focus__title"><span>Management attention</span><b>' + esc(finding.id + ' · ' + finding.title) + '</b></div>' +
    '<div><span>Current Owner</span><b>' + esc(ownerLabel(finding)) + '</b></div>' +
    '<div><span>Next Action</span><b>' + esc(nextActionLabel(finding)) + '</b></div>' +
    '<div><span>Due Date</span><b>' + esc(due) + '</b>' + closureMeta + '</div>' +
    '<div><span>Status</span>' + statusBadge(finding) + '</div>' +
    '<div><span>Severity</span>' + severityHtml(finding) + '</div>' +
    '<div><span>Related Audit</span><b>' + esc(finding.auditId || '—') + '</b></div>' +
    '<div><span>Organization</span><b>' + esc(row.organization) + '</b></div>' +
    '<button class="btn btn--primary btn--sm" data-act="manager-findings-open-finding" data-id="' + esc(finding.id) + '">Open Finding</button>' +
  '</section>';
}

function managerFindingsOverview(row) {
  return '<div class="manager-findings-tab-panel" role="tabpanel">' +
    managerFindingsSummaryCards(row) +
    managerFindingsFocusStrip(row) +
    '<div class="manager-findings-guardrail"><b>Closure rule:</b> CAP acceptance is not finding closure. Required evidence remains subject to CAA review, and evidence version history is preserved.</div>' +
    '<div class="manager-findings-overview-actions"><button class="btn btn--primary" data-act="manager-findings-tab" data-tab="list">View All Findings</button>' +
      ((state.managerReports || []).some(function (report) { return report.auditId === row.auditId; })
        ? '<button class="btn" data-act="manager-findings-open-report" data-id="' + esc(row.auditId) + '">View Full Report</button>' : '') +
    '</div>' +
  '</div>';
}

function managerFindingsList(row) {
  var body = row.findings.length ? row.findings.map(function (finding) {
    var dueDate = finding.dueDate ? fmtDate(finding.dueDate) : '—';
    var closureMeta = finding.status === 'CLOSED' && finding.closedDate
      ? '<small>Closed ' + esc(fmtDate(finding.closedDate)) + '</small>'
      : '';
    return '<tr>' +
      '<td><button class="manager-findings-finding-link" data-act="manager-findings-open-finding" data-id="' + esc(finding.id) + '">' + esc(finding.id) + '</button><small>' + esc(finding.title) + '</small></td>' +
      '<td>' + esc(ownerLabel(finding)) + '</td>' +
      '<td><b>' + esc(nextActionLabel(finding)) + '</b></td>' +
      '<td><b>' + esc(dueDate) + '</b>' + closureMeta + '</td>' +
      '<td>' + statusBadge(finding) + '</td>' +
      '<td>' + severityHtml(finding) + '</td>' +
      '<td>' + esc(finding.auditId || '—') + '</td>' +
      '<td>' + esc(row.organization) + '</td>' +
      '<td><button class="btn btn--sm" data-act="manager-findings-open-finding" data-id="' + esc(finding.id) + '">Open</button></td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="9"><div class="empty">No findings are linked to this inspection.</div></td></tr>';
  return '<div class="manager-findings-tab-panel" role="tabpanel">' +
    '<div class="manager-findings-table-note">CAP acceptance remains distinct from closure. Evidence versions are preserved through CAA review.</div>' +
    '<div class="manager-findings-list-table"><table><thead><tr><th>Finding</th><th>Current Owner</th><th>Next Action</th><th>Due Date</th><th>Status</th><th>Severity</th><th>Related Audit</th><th>Organization</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
  '</div>';
}

function managerFindingsDepartmentRows(row) {
  var grouped = {};
  row.findings.forEach(function (finding) {
    var department = finding.department || row.department || 'Unassigned';
    if (!grouped[department]) grouped[department] = [];
    grouped[department].push(finding);
  });
  var keys = Object.keys(grouped).sort();
  if (!keys.length) return '<tr><td colspan="9"><div class="empty">No department findings to summarize.</div></td></tr>';
  return keys.map(function (department) {
    var counts = managerFindingCounts(grouped[department]);
    return '<tr><td><b>' + esc(department) + '</b></td><td>' + counts.total + '</td><td>' + counts.critical + '</td><td>' + counts.major + '</td><td>' + counts.minor + '</td><td>' + counts.observations + '</td><td>' + counts.open + '</td><td>' + counts.inReview + '</td><td>' + counts.closed + '</td></tr>';
  }).join('');
}

function managerFindingsDepartment(row) {
  return '<div class="manager-findings-tab-panel" role="tabpanel"><h3>Department Breakdown</h3>' +
    '<div class="manager-findings-breakdown-table"><table><thead><tr><th>Department</th><th>Total</th><th>Critical</th><th>Major</th><th>Minor</th><th>Observations</th><th>Open</th><th>In Review</th><th>Closed</th></tr></thead><tbody>' + managerFindingsDepartmentRows(row) + '</tbody></table></div></div>';
}

function managerFindingsLevel(row) {
  var levels = [
    [1, 'Level 1 Critical'],
    [2, 'Level 2 Major'],
    [3, 'Level 3 Minor'],
    [0, 'Observation']
  ];
  var rows = levels.map(function (level) {
    var findings = row.findings.filter(function (finding) { return finding.severity === level[0]; });
    var counts = managerFindingCounts(findings);
    return '<tr><td>' + (findings.length ? severityHtml(findings[0]) : '<span class="sev sev--obs">' + esc(level[1]) + '</span>') + '</td><td>' + counts.total + '</td><td>' + counts.open + '</td><td>' + counts.inReview + '</td><td>' + counts.closed + '</td></tr>';
  }).join('');
  return '<div class="manager-findings-tab-panel" role="tabpanel"><h3>Finding Level Breakdown</h3>' +
    '<div class="manager-findings-breakdown-table"><table><thead><tr><th>Severity</th><th>Total</th><th>Open</th><th>In Review</th><th>Closed</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function managerFindingsDossier(row, tab) {
  var body = tab === 'list'
    ? managerFindingsList(row)
    : (tab === 'department'
      ? managerFindingsDepartment(row)
      : (tab === 'level' ? managerFindingsLevel(row) : managerFindingsOverview(row)));
  return '<section class="manager-findings-dossier">' + managerFindingsDossierHeader(row) + managerFindingsTabs(tab) + body + '</section>';
}

function viewManagerFindingsReview() {
  var ui = managerFindingsUiState();
  var rows = managerInspectionRows(state, ui);
  var selected = rows.filter(function (row) { return row.auditId === ui.selectedAuditId; })[0] || rows[0] || null;
  if (selected && selected.auditId !== ui.selectedAuditId) ui.selectedAuditId = selected.auditId;
  var left = '<section class="manager-findings-inspections">' +
    '<div class="manager-workbench-panel-head"><div><span>Inspection register</span><h2>Inspections with Findings</h2></div><button class="btn" data-act="manager-findings-export">Export List</button></div>' +
    managerFindingsFilters(ui) + managerFindingsKpis(rows) + managerFindingsInspectionTable(rows, selected ? selected.auditId : '') +
  '</section>';
  var right = selected
    ? managerFindingsDossier(selected, ui.tab)
    : '<section class="manager-findings-dossier manager-findings-dossier--empty"><div class="empty">Select an inspection to review its findings.</div></section>';
  return pageHead('Findings Review', 'Review inspection findings, ownership, next actions, Due Dates, and closure readiness.') +
    '<div class="manager-workbench manager-findings-workbench">' + left + right + '</div>';
}

/* =========================== Department Manager inspection team =========================== */
function inspectionTeamUiState() {
  if (!state.inspectionTeamUi || typeof state.inspectionTeamUi !== 'object') state.inspectionTeamUi = {};
  var ui = state.inspectionTeamUi;
  if (typeof ui.query !== 'string') ui.query = '';
  if (!ui.department) ui.department = 'all';
  if (!ui.status) ui.status = 'all';
  if (!ui.dateRange) ui.dateRange = 'all';
  if (!ui.selectedAuditId) ui.selectedAuditId = 'AUD-2026-001';
  if (['overview', 'members', 'assignments', 'documents', 'history'].indexOf(ui.tab) === -1) ui.tab = 'overview';
  if (typeof ui.openMenuAuditId !== 'string') ui.openMenuAuditId = '';
  return ui;
}

function managerTeamOption(value, label, selectedValue) {
  return '<option value="' + esc(value) + '"' + (value === selectedValue ? ' selected' : '') + '>' + esc(label) + '</option>';
}

function managerTeamStatusBadge(status) {
  var tone = status === 'Completed' || status === 'Closed' || status === 'Report Issued'
    ? 'ok'
    : (status === 'In Progress' ? 'warn' : 'info');
  return demoBadge(status, tone);
}

function managerTeamFilters(ui, rows) {
  var departments = {};
  rows.forEach(function (row) { if (row.department) departments[row.department] = true; });
  return '<div class="manager-team-filters">' +
    '<label class="manager-team-search"><span>Search teams</span><div><input id="manager-team-query" type="search" value="' + esc(ui.query) + '" placeholder="Audit ID, organization, inspector"><button class="btn btn--primary btn--sm" data-act="manager-team-filter" data-key="query">Search</button></div></label>' +
    '<label><span>Department</span><select data-field="manager-team-department">' +
      managerTeamOption('all', 'All Departments', ui.department) +
      Object.keys(departments).sort().map(function (department) { return managerTeamOption(department, department, ui.department); }).join('') +
    '</select></label>' +
    '<label><span>Status</span><select data-field="manager-team-status">' +
      managerTeamOption('all', 'All Statuses', ui.status) +
      managerTeamOption('active', 'Active', ui.status) +
      managerTeamOption('upcoming', 'Upcoming', ui.status) +
      managerTeamOption('completed', 'Completed', ui.status) +
    '</select></label>' +
    '<label><span>Audit Date</span><select data-field="manager-team-date-range">' +
      managerTeamOption('all', 'All Dates', ui.dateRange) +
      managerTeamOption('today', 'Today', ui.dateRange) +
      managerTeamOption('upcoming', 'Upcoming', ui.dateRange) +
      managerTeamOption('past', 'Past', ui.dateRange) +
    '</select></label>' +
    '<button class="btn btn--sm manager-team-reset" data-act="manager-team-filter" data-key="reset">Reset</button>' +
  '</div>';
}

function managerTeamMetrics(rows) {
  var active = rows.filter(function (row) { return row.status === 'In Progress'; }).length;
  var upcoming = rows.filter(function (row) { return row.startDate > DEMO_TODAY; }).length;
  var month = DEMO_TODAY.slice(0, 7);
  var complete = rows.filter(function (row) {
    return row.endDate.slice(0, 7) === month && ['Completed', 'Closed', 'Report Issued'].indexOf(row.status) !== -1;
  }).length;
  var items = [
    ['Total Teams', rows.length, 'Manager-scoped teams', 'info'],
    ['Active Teams', active, 'In progress now', 'warn'],
    ['Upcoming Inspections', upcoming, 'Start after today', 'info'],
    ['Completed This Month', complete, 'Authorized outcomes', 'ok']
  ];
  return '<div class="manager-team-kpis">' + items.map(function (item) {
    return '<div class="manager-team-kpi is-' + esc(item[3]) + '"><span>' + esc(item[0]) + '</span><strong>' + esc(String(item[1])) + '</strong><small>' + esc(item[2]) + '</small></div>';
  }).join('') + '</div>';
}

function managerTeamActionMenu(row, open) {
  var actions = [
    ['manager-team-select', 'View Team Details'],
    ['manager-team-edit', 'Edit Team'],
    ['manager-team-add', 'Add Inspector'],
    ['manager-team-remove', 'Remove Inspector'],
    ['manager-team-lead', 'Change Lead Inspector'],
    ['manager-team-schedule', 'Update Schedule'],
    ['manager-team-package', 'View Assignment Package'],
    ['manager-team-audit', 'View Audit Details'],
    ['manager-team-message', 'Send Message to Team'],
    ['manager-team-download', 'Download Team Assignment'],
    ['manager-team-activity', 'View Activity Log']
  ];
  return '<div class="manager-team-row-actions">' +
    '<button class="manager-team-menu-trigger" data-act="manager-team-menu" data-id="' + esc(row.auditId) + '" aria-label="Open team actions for ' + esc(row.auditId) + '" aria-expanded="' + (open ? 'true' : 'false') + '">⋯</button>' +
    '<div class="manager-team-menu" role="menu"' + (open ? '' : ' hidden') + '>' + actions.map(function (action) {
      return '<button role="menuitem" data-act="' + esc(action[0]) + '" data-id="' + esc(row.auditId) + '">' + esc(action[1]) + '</button>';
    }).join('') + '</div>' +
  '</div>';
}

function managerTeamTable(rows, selectedAuditId, openMenuAuditId) {
  var body = rows.length ? rows.map(function (row) {
    var selected = row.auditId === selectedAuditId;
    return '<tr class="manager-team-row' + (selected ? ' is-selected' : '') + '">' +
      '<td><button class="manager-team-audit-link" data-act="manager-team-select" data-id="' + esc(row.auditId) + '"' + (selected ? ' aria-current="true"' : '') + '>' + esc(row.auditId) + '</button><small>' + esc(row.auditType) + '</small></td>' +
      '<td><b>' + esc(row.organization) + '</b><small>' + esc(row.department) + '</small></td>' +
      '<td><b>' + esc(fmtDate(row.startDate)) + '</b><small>to ' + esc(fmtDate(row.endDate)) + '</small></td>' +
      '<td><b>' + esc(row.lead.name) + '</b><small>Lead Inspector</small></td>' +
      '<td><b>' + esc(String(row.memberCount)) + '</b><small>manager-scoped inspectors</small></td>' +
      '<td>' + managerTeamStatusBadge(row.status) + '</td>' +
      '<td>' + managerTeamActionMenu(row, openMenuAuditId === row.auditId) + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7"><div class="empty">No inspection teams match these filters.</div></td></tr>';
  return '<div class="manager-team-table"><table><thead><tr><th>Audit</th><th>Organization</th><th>Schedule</th><th>Lead Inspector</th><th>Team</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + body + '</tbody></table></div>';
}

function managerTeamTabs(active) {
  var tabs = [
    ['overview', 'Overview'],
    ['members', 'Team Members'],
    ['assignments', 'Assignments'],
    ['documents', 'Documents'],
    ['history', 'History']
  ];
  return '<div class="manager-team-tabs" role="tablist" aria-label="Inspection team sections">' + tabs.map(function (tab) {
    return '<button role="tab" aria-selected="' + (active === tab[0] ? 'true' : 'false') + '" class="' + (active === tab[0] ? 'is-active' : '') + '" data-act="manager-team-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function managerTeamMemberTable(row, allowActions) {
  if (!row.members.length) return '<div class="empty">No manager-scoped inspectors are assigned.</div>';
  return '<div class="manager-team-member-table"><table><thead><tr><th>Role</th><th>Name</th><th>Department</th><th>Email</th><th>Status</th>' + (allowActions ? '<th></th>' : '') + '</tr></thead><tbody>' + row.members.map(function (member) {
    var isLead = member.id === row.team.leadUserId;
    var action = '';
    if (allowActions) {
      action = '<td><div class="manager-team-member-actions">' +
        (!isLead ? '<button class="btn btn--sm" data-act="manager-team-member-lead" data-id="' + esc(row.auditId) + '" data-user="' + esc(member.id) + '">Make Lead</button>' : '') +
        (!isLead ? '<button class="btn btn--sm" data-act="manager-team-member-remove" data-id="' + esc(row.auditId) + '" data-user="' + esc(member.id) + '">Remove</button>' : '') +
      '</div></td>';
    }
    return '<tr><td>' + esc(isLead ? 'Lead Inspector' : member.role) + '</td><td><b>' + esc(member.name) + '</b></td><td>' + esc(member.department) + '</td><td><a href="mailto:' + esc(member.email) + '">' + esc(member.email) + '</a></td><td>' + demoBadge(member.status || 'Active', member.status === 'Active' ? 'ok' : 'neutral') + '</td>' + action + '</tr>';
  }).join('') + '</tbody></table></div>';
}

function managerTeamOverview(row) {
  return '<div class="manager-team-tab-panel" role="tabpanel">' +
    '<div class="manager-team-overview-cards">' +
      '<article><span>Lead Inspector</span><strong>' + esc(row.lead.name) + '</strong></article>' +
      '<article><span>Team Members</span><strong>' + esc(String(row.memberCount)) + '</strong></article>' +
      '<article><span>Department</span><strong>' + esc(row.department) + '</strong></article>' +
      '<article><span>Current Status</span><strong>' + esc(row.status) + '</strong></article>' +
    '</div>' +
    '<div class="manager-team-section-head"><div><h3>Inspection Team</h3><p>Only inspectors in this Department Manager reporting line are shown.</p></div><button class="btn btn--sm" data-act="manager-team-add" data-id="' + esc(row.auditId) + '">Add Inspector</button></div>' +
    managerTeamMemberTable(row, false) +
    '<div class="manager-team-notes"><label for="manager-team-notes">Team notes</label><textarea id="manager-team-notes" placeholder="Add a browser-local team note.">' + esc(row.notes) + '</textarea><div><span>Demo-only note visible in this workspace.</span><button class="btn btn--primary btn--sm" data-act="manager-team-save-notes" data-id="' + esc(row.auditId) + '">Save Notes</button></div></div>' +
  '</div>';
}

function managerTeamMembers(row) {
  return '<div class="manager-team-tab-panel" role="tabpanel"><div class="manager-team-section-head"><div><h3>Team Members</h3><p>Manage membership and Lead Inspector assignment within the allowed reporting line.</p></div><button class="btn btn--primary btn--sm" data-act="manager-team-add" data-id="' + esc(row.auditId) + '">Add Inspector</button></div>' + managerTeamMemberTable(row, true) + '</div>';
}

function managerTeamAssignments(row) {
  return '<div class="manager-team-tab-panel" role="tabpanel"><div class="manager-team-section-head"><div><h3>Assignments</h3><p>The assignment package is a mock preview for stakeholder feedback.</p></div><button class="btn btn--sm" data-act="manager-team-package" data-id="' + esc(row.auditId) + '">View Assignment Package</button></div>' +
    '<dl class="manager-team-definition-grid"><div><dt>Audit</dt><dd>' + esc(row.auditId) + '</dd></div><div><dt>Organization</dt><dd>' + esc(row.organization) + '</dd></div><div><dt>Inspection type</dt><dd>' + esc(row.auditType) + '</dd></div><div><dt>Department</dt><dd>' + esc(row.department) + '</dd></div><div><dt>Schedule</dt><dd>' + esc(fmtDate(row.startDate)) + ' – ' + esc(fmtDate(row.endDate)) + '</dd></div><div><dt>Lead Inspector</dt><dd>' + esc(row.lead.name) + '</dd></div></dl>' +
    '<div class="manager-team-inline-actions"><button class="btn" data-act="manager-team-audit" data-id="' + esc(row.auditId) + '">View Audit Details</button><button class="btn" data-act="manager-team-download" data-id="' + esc(row.auditId) + '">Download Team Assignment</button></div>' +
  '</div>';
}

function managerTeamDocuments(row) {
  var attachmentRows = row.attachments.length ? row.attachments.map(function (filename) {
    return '<li><span>📄</span><div><b>' + esc(filename) + '</b><small>Selected filename only · no file bytes stored</small></div></li>';
  }).join('') : '<li class="is-empty">No additional attachment filenames selected.</li>';
  return '<div class="manager-team-tab-panel" role="tabpanel"><div class="manager-team-section-head"><div><h3>Documents</h3><p>Attachments preserve filenames only; this demo does not upload or store files.</p></div></div>' +
    '<ul class="manager-team-documents"><li><span>📄</span><div><b>Team Assignment Package</b><small>Generated browser-side PDF</small></div><button class="btn btn--sm" data-act="manager-team-download" data-id="' + esc(row.auditId) + '">Download PDF</button></li>' + attachmentRows + '</ul>' +
    '<div class="manager-team-attachment"><label for="manager-team-attachment">Add attachment filename</label><input id="manager-team-attachment" type="file"><button class="btn btn--primary btn--sm" data-act="manager-team-add-attachment" data-id="' + esc(row.auditId) + '">Add Filename</button></div>' +
  '</div>';
}

function managerTeamHistory(row) {
  var items = row.history.slice().reverse().map(function (entry) {
    return '<li><time>' + esc(entry.at) + '</time><div><b>' + esc(entry.action) + '</b><small>' + esc(entry.actor || 'Department Manager') + '</small></div></li>';
  });
  if (!items.length) items.push('<li class="is-empty">No team activity has been recorded.</li>');
  var messages = row.messages.slice().reverse().map(function (message) {
    return '<article><div><b>' + esc(message.author || 'Department Manager') + '</b><time>' + esc(message.at) + '</time></div><p>' + esc(message.body) + '</p></article>';
  }).join('') || '<div class="empty">No team messages have been recorded.</div>';
  return '<div class="manager-team-tab-panel" role="tabpanel"><div class="manager-team-history-grid"><section><h3>Activity Log</h3><ol class="manager-team-history">' + items.join('') + '</ol></section><section><h3>Team Messages</h3><div class="manager-team-messages">' + messages + '</div></section></div></div>';
}

function managerTeamDossier(row, tab) {
  var body = tab === 'members' ? managerTeamMembers(row)
    : (tab === 'assignments' ? managerTeamAssignments(row)
      : (tab === 'documents' ? managerTeamDocuments(row)
        : (tab === 'history' ? managerTeamHistory(row) : managerTeamOverview(row))));
  return '<section class="manager-team-dossier"><div class="manager-team-dossier-head"><div><span>Selected inspection team</span><h2>' + esc(row.auditId) + ' · ' + esc(row.organization) + '</h2><p>' + esc(row.reference) + '</p></div><div class="manager-team-dossier-actions">' + managerTeamStatusBadge(row.status) + '<button class="btn btn--sm" data-act="manager-team-edit" data-id="' + esc(row.auditId) + '">Edit Team</button></div><dl class="manager-team-meta"><div><dt>Start Date</dt><dd>' + esc(fmtDate(row.startDate)) + '</dd></div><div><dt>End Date</dt><dd>' + esc(fmtDate(row.endDate)) + '</dd></div><div><dt>Lead Inspector</dt><dd>' + esc(row.lead.name) + '</dd></div><div><dt>Department</dt><dd>' + esc(row.department) + '</dd></div><div><dt>Members</dt><dd>' + esc(String(row.memberCount)) + '</dd></div><div><dt>Status</dt><dd>' + esc(row.status) + '</dd></div></dl></div>' + managerTeamTabs(tab) + body + '</section>';
}

function viewInspectionTeam() {
  var ui = inspectionTeamUiState();
  var allRows = managerTeamRows(state, { query: '', department: 'all', status: 'all', dateRange: 'all' });
  var rows = managerTeamRows(state, ui);
  var selected = rows.filter(function (row) { return row.auditId === ui.selectedAuditId; })[0] || rows[0] || null;
  if (selected && selected.auditId !== ui.selectedAuditId) ui.selectedAuditId = selected.auditId;
  var left = '<section class="manager-team-list"><div class="manager-workbench-panel-head"><div><span>Department workspace</span><h2>Inspection Teams</h2></div><button class="btn btn--primary btn--sm" data-act="manager-team-add" data-id="' + esc(selected ? selected.auditId : '') + '"' + (selected ? '' : ' disabled') + '>Add Inspector</button></div>' + managerTeamFilters(ui, allRows) + managerTeamMetrics(rows) + managerTeamTable(rows, selected ? selected.auditId : '', ui.openMenuAuditId) + '</section>';
  var right = selected ? managerTeamDossier(selected, ui.tab) : '<section class="manager-team-dossier manager-team-dossier--empty"><div class="empty">Select an inspection team to review its assignment.</div></section>';
  return pageHead('Inspection Team', 'Review manager-scoped inspectors, active teams, schedules, assignments, and team actions.') + '<div class="manager-workbench manager-team-workbench">' + left + right + '</div>';
}

function modalManagerTeamEdit(row) {
  var body = '<div class="modal__intro">Edit browser-local notes for <b>' + esc(row.auditId) + '</b>. Membership and Lead Inspector changes use their focused forms.</div><div class="form-row"><label for="manager-team-edit-notes">Team notes</label><textarea id="manager-team-edit-notes">' + esc(row.notes) + '</textarea></div>';
  return modalShell('Edit Inspection Team', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="manager-team-save-edit" data-id="' + esc(row.auditId) + '">Save Team</button>');
}

function modalManagerTeamAdd(row) {
  var current = row.team.memberIds || [];
  var users = managerScopedTeamUsers(state).filter(function (user) { return current.indexOf(user.id) === -1; });
  var body = users.length
    ? '<div class="modal__intro">Only inspectors who report to this Department Manager can be selected.</div><div class="form-row"><label for="manager-team-add-user">Inspector</label><select id="manager-team-add-user">' + users.map(function (user) { return '<option value="' + esc(user.id) + '">' + esc(user.name + ' · ' + user.department) + '</option>'; }).join('') + '</select></div>'
    : '<div class="empty">All eligible inspectors are already assigned to this team.</div>';
  return modalShell('Add Inspector', body, '<button class="btn" data-act="close-modal">Cancel</button>' + (users.length ? '<button class="btn btn--primary" data-act="manager-team-confirm-add" data-id="' + esc(row.auditId) + '">Add Inspector</button>' : ''));
}

function modalManagerTeamRemove(row) {
  var users = row.members.filter(function (user) { return user.id !== row.team.leadUserId; });
  var body = users.length
    ? '<div class="modal__intro">The current Lead Inspector cannot be removed until another team member is selected as lead.</div><div class="form-row"><label for="manager-team-remove-user">Inspector</label><select id="manager-team-remove-user">' + users.map(function (user) { return '<option value="' + esc(user.id) + '">' + esc(user.name) + '</option>'; }).join('') + '</select></div>'
    : '<div class="empty">No removable inspector is available.</div>';
  return modalShell('Remove Inspector', body, '<button class="btn" data-act="close-modal">Cancel</button>' + (users.length ? '<button class="btn btn--danger" data-act="manager-team-confirm-remove" data-id="' + esc(row.auditId) + '">Remove Inspector</button>' : ''));
}

function modalManagerTeamLead(row) {
  var users = row.members.filter(function (user) { return user.id !== row.team.leadUserId; });
  var body = users.length
    ? '<div class="modal__intro">The new Lead Inspector must already be assigned to this inspection team.</div><div class="form-row"><label for="manager-team-lead-user">New Lead Inspector</label><select id="manager-team-lead-user">' + users.map(function (user) { return '<option value="' + esc(user.id) + '">' + esc(user.name) + '</option>'; }).join('') + '</select></div>'
    : '<div class="empty">Add another team member before changing the Lead Inspector.</div>';
  return modalShell('Change Lead Inspector', body, '<button class="btn" data-act="close-modal">Cancel</button>' + (users.length ? '<button class="btn btn--primary" data-act="manager-team-confirm-lead" data-id="' + esc(row.auditId) + '">Change Lead Inspector</button>' : ''));
}

function modalManagerTeamSchedule(row) {
  var body = '<div class="modal__intro">Update the visible demo schedule. The change will be appended to team history.</div><div class="form-2col"><div class="form-row"><label for="manager-team-start-date">Start date</label><input id="manager-team-start-date" type="date" value="' + esc(row.startDate) + '"></div><div class="form-row"><label for="manager-team-end-date">End date</label><input id="manager-team-end-date" type="date" value="' + esc(row.endDate) + '"></div></div><div id="manager-team-schedule-error" class="manager-team-form-error" role="alert"></div>';
  return modalShell('Update Schedule', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="manager-team-confirm-schedule" data-id="' + esc(row.auditId) + '">Update Schedule</button>');
}

function modalManagerTeamPackage(row) {
  var members = row.members.map(function (member) { return '<li>' + esc(member.name + (member.id === row.team.leadUserId ? ' — Lead Inspector' : ' — ' + member.role)) + '</li>'; }).join('');
  var body = '<div class="manager-team-package-preview"><div><span>AviaSurveil360 demo assignment</span><h3>' + esc(row.organization + ' · ' + row.auditId) + '</h3><p>' + esc(row.auditType) + '</p></div><dl><div><dt>Department</dt><dd>' + esc(row.department) + '</dd></div><div><dt>Schedule</dt><dd>' + esc(fmtDate(row.startDate)) + ' – ' + esc(fmtDate(row.endDate)) + '</dd></div></dl><h4>Assigned inspectors</h4><ul>' + members + '</ul><p class="small muted">Demo preview only. This is not a production document repository or assignment authority.</p></div>';
  return modalShell('View Assignment Package', body, '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="manager-team-download" data-id="' + esc(row.auditId) + '">Download Team Assignment</button>', true);
}

function modalManagerTeamMessage(row) {
  var body = '<div class="modal__intro">Record a mock in-app message for all ' + esc(String(row.memberCount)) + ' team members. No real email, SMS, or external notification will be sent.</div><div class="form-row"><label for="manager-team-message-body">Message <span class="req">*</span></label><textarea id="manager-team-message-body" placeholder="Write the team message."></textarea></div><div id="manager-team-message-error" class="manager-team-form-error" role="alert"></div>';
  return modalShell('Send Message to Team', body, '<button class="btn" data-act="close-modal">Cancel</button><button class="btn btn--primary" data-act="manager-team-confirm-message" data-id="' + esc(row.auditId) + '">Send Message</button>');
}

/* =========================== Department Manager reports approval =========================== */
function managerReportsUiState() {
  if (!state.managerReportsUi || typeof state.managerReportsUi !== 'object') state.managerReportsUi = {};
  var ui = state.managerReportsUi;
  if (typeof ui.query !== 'string') ui.query = '';
  if (!ui.reportType) ui.reportType = 'all';
  if (!ui.status) ui.status = 'all';
  if (!ui.selectedReportId) ui.selectedReportId = 'PR-2026-018';
  if (['summary', 'findings', 'attachments', 'comments', 'history'].indexOf(ui.tab) === -1) ui.tab = 'summary';
  if (typeof ui.validationMessage !== 'string') ui.validationMessage = '';
  return ui;
}

function managerReportStatusLabel(status) {
  var labels = {
    pending_manager: 'Pending My Approval',
    revision_requested: 'Revision Requested',
    returned_to_lead: 'Returned to Lead Inspector',
    released_to_service_provider: 'Released to Service Provider',
    submitted_to_gm: 'Submitted to General Manager',
    submitted_to_executive: 'Pending Final Authorized Approval',
    issued: 'Issued'
  };
  return labels[status] || String(status || 'Unknown').replace(/_/g, ' ');
}

function managerReportStatusBadge(status) {
  var tone = status === 'pending_manager' || status === 'submitted_to_executive'
    ? 'warn'
    : (status === 'revision_requested' || status === 'returned_to_lead'
      ? 'danger'
      : (status === 'issued' || status === 'released_to_service_provider' ? 'ok' : 'info'));
  return demoBadge(managerReportStatusLabel(status), tone);
}

function managerReportOwnerLabel(ownerRole) {
  if (ownerRole === 'auditee') return 'Fly Namibia Service Provider Portal';
  return ROLES[ownerRole] ? ROLES[ownerRole].name : (ownerRole || '—');
}

function managerReportOption(value, label, selected) {
  return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
}

function managerReportFilters(ui) {
  return '<div class="manager-report-filters">' +
    '<label class="manager-report-search"><span>Search reports</span><div><input id="manager-report-query" type="search" value="' + esc(ui.query) + '" placeholder="Report ID, audit, organization"><button class="btn btn--primary btn--sm" data-act="manager-report-filter" data-key="query">Search</button></div></label>' +
    '<label><span>Report Type</span><select data-field="manager-report-type">' +
      managerReportOption('all', 'All Reports', ui.reportType) +
      managerReportOption('Preliminary Report', 'Preliminary Reports', ui.reportType) +
      managerReportOption('Final Report', 'Final Reports', ui.reportType) +
    '</select></label>' +
    '<label><span>Status</span><select data-field="manager-report-status">' +
      managerReportOption('all', 'All Statuses', ui.status) +
      managerReportOption('pending', 'Pending My Approval', ui.status) +
      managerReportOption('revision', 'Revision Requested / Returned', ui.status) +
      managerReportOption('approved', 'Approved / Forwarded', ui.status) +
    '</select></label>' +
    '<button class="btn btn--sm manager-report-reset" data-act="manager-report-filter" data-key="reset">Reset</button>' +
  '</div>';
}

function managerReportCounters(allReports) {
  var counters = [
    ['All Reports', allReports.length, 'all', 'all'],
    ['Preliminary Reports', allReports.filter(function (report) { return report.reportType === 'Preliminary Report'; }).length, 'reportType', 'Preliminary Report'],
    ['Final Reports', allReports.filter(function (report) { return report.reportType === 'Final Report'; }).length, 'reportType', 'Final Report'],
    ['Pending My Approval', allReports.filter(function (report) { return report.status === 'pending_manager'; }).length, 'status', 'pending'],
    ['Revision Requested', allReports.filter(function (report) { return report.status === 'revision_requested' || report.status === 'returned_to_lead'; }).length, 'status', 'revision'],
    ['Approved', allReports.filter(function (report) { return ['released_to_service_provider', 'submitted_to_gm', 'submitted_to_executive', 'issued'].indexOf(report.status) !== -1; }).length, 'status', 'approved']
  ];
  return '<div class="manager-report-counters">' + counters.map(function (counter) {
    var attrs = counter[2] === 'all'
      ? ' data-act="manager-report-filter" data-key="reset"'
      : ' data-act="manager-report-filter" data-key="' + esc(counter[2]) + '" data-value="' + esc(counter[3]) + '"';
    return '<button' + attrs + '><span>' + esc(counter[0]) + '</span><strong>' + esc(String(counter[1])) + '</strong></button>';
  }).join('') + '</div>';
}

function managerReportQueueRows(reports, selectedReportId) {
  if (!reports.length) return '<tr><td colspan="7"><div class="empty">No reports match these filters.</div></td></tr>';
  return reports.map(function (report) {
    var selected = report.id === selectedReportId;
    return '<tr class="manager-report-row' + (selected ? ' is-selected' : '') + '">' +
      '<td><button class="manager-report-id" data-act="manager-report-select" data-id="' + esc(report.id) + '"' + (selected ? ' aria-current="true"' : '') + '>' + esc(report.id) + '</button><small>' + esc(report.auditId) + '</small></td>' +
      '<td><b>' + esc(report.organization) + '</b><small>Operator / Service Provider</small></td>' +
      '<td><b>' + esc(report.reportType) + '</b><small>Version ' + esc(report.version) + '</small></td>' +
      '<td>' + esc(report.leadInspector) + '</td>' +
      '<td>' + esc(report.submittedAt) + '</td>' +
      '<td>' + managerReportStatusBadge(report.status) + '</td>' +
      '<td><button class="btn btn--sm' + (selected ? ' btn--primary' : '') + '" data-act="manager-report-select" data-id="' + esc(report.id) + '">' + (selected ? 'Selected' : 'Review') + '</button></td>' +
    '</tr>';
  }).join('');
}

function managerReportQueue(reports, selectedReportId) {
  return '<div class="manager-report-queue"><table><thead><tr><th>Report</th><th>Organization</th><th>Type</th><th>Lead Inspector</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>' + managerReportQueueRows(reports, selectedReportId) + '</tbody></table></div>';
}

function managerReportTabs(active) {
  var tabs = [
    ['summary', 'Summary'],
    ['findings', 'Findings'],
    ['attachments', 'Attachments'],
    ['comments', 'Comments'],
    ['history', 'History']
  ];
  return '<div class="manager-report-tabs" role="tablist" aria-label="Report dossier sections">' + tabs.map(function (tab) {
    return '<button role="tab" aria-selected="' + (active === tab[0] ? 'true' : 'false') + '" class="' + (active === tab[0] ? 'is-active' : '') + '" data-act="manager-report-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function managerReportSummaryPanel(report) {
  var findings = managerFindingsForAudit(state, report.auditId);
  var counts = managerFindingCounts(findings);
  return '<div class="manager-report-panel" role="tabpanel">' +
    '<div class="manager-report-summary-grid">' +
      '<article><span>Total Findings</span><strong>' + esc(String(counts.total)) + '</strong></article>' +
      '<article><span>Level 1 Critical</span><strong>' + esc(String(counts.critical)) + '</strong></article>' +
      '<article><span>Open / In Review</span><strong>' + esc(String(counts.open + counts.inReview)) + '</strong></article>' +
      '<article><span>CAP Required</span><strong>' + (report.capRequired ? 'Yes' : 'No') + '</strong></article>' +
    '</div>' +
    '<section class="manager-report-copy"><h3>Report Summary</h3><p>' + esc(report.summary || 'No report summary has been entered.') + '</p></section>' +
    '<div class="manager-report-boundary"><b>Approval boundary:</b> Department Manager approval of a Final Report only forwards it to the configured final authorized stage. It does not issue or lock the report.</div>' +
  '</div>';
}

function managerReportFindingsPanel(report) {
  var findings = managerFindingsForAudit(state, report.auditId);
  var rows = findings.length ? findings.map(function (finding) {
    return '<tr><td><b>' + esc(finding.id) + '</b><small>' + esc(finding.title) + '</small></td><td>' + severityHtml(finding) + '</td><td>' + statusBadge(finding) + '</td><td>' + esc(ownerLabel(finding)) + '</td><td>' + esc(nextActionLabel(finding)) + '</td><td>' + esc(finding.dueDate ? fmtDate(finding.dueDate) : '—') + '</td></tr>';
  }).join('') : '<tr><td colspan="6"><div class="empty">No findings are linked to this report.</div></td></tr>';
  return '<div class="manager-report-panel" role="tabpanel"><div class="manager-report-findings"><table><thead><tr><th>Finding</th><th>Severity</th><th>Status</th><th>Current Owner</th><th>Next Action</th><th>Due Date</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function managerReportAttachmentsPanel(report) {
  var items = (report.attachments || []).map(function (filename) {
    return '<li><span>📄</span><div><b>' + esc(filename) + '</b><small>Preserved demo attachment filename · no file storage</small></div></li>';
  }).join('') || '<li class="is-empty">No attachment filenames are listed.</li>';
  return '<div class="manager-report-panel" role="tabpanel"><ul class="manager-report-attachments">' + items + '</ul></div>';
}

function managerReportCommentsPanel(report) {
  return '<div class="manager-report-panel" role="tabpanel"><section class="manager-report-copy"><h3>Manager Comments</h3><p>' + esc(report.managerComment || 'No manager decision comment has been recorded.') + '</p></section><div class="manager-report-boundary">Comments in this manager dossier remain separate from any <b>Comment to Auditee</b> or <b>Internal CAA Note</b>.</div></div>';
}

function managerReportHistoryPanel(report) {
  var items = (report.history || []).slice().reverse().map(function (entry) {
    return '<li><time>' + esc(entry.at || '—') + '</time><div><b>' + esc(entry.action || 'Report updated') + '</b><small>' + esc(entry.actor || 'System') + '</small>' + (entry.comment ? '<p>' + esc(entry.comment) + '</p>' : '') + '</div></li>';
  }).join('') || '<li class="is-empty">No report history is available.</li>';
  return '<div class="manager-report-panel" role="tabpanel"><ol class="manager-report-history">' + items + '</ol></div>';
}

function managerReportPanel(report, tab) {
  if (tab === 'findings') return managerReportFindingsPanel(report);
  if (tab === 'attachments') return managerReportAttachmentsPanel(report);
  if (tab === 'comments') return managerReportCommentsPanel(report);
  if (tab === 'history') return managerReportHistoryPanel(report);
  return managerReportSummaryPanel(report);
}

function managerReportDownloadMenu(report) {
  var label = report.reportType === 'Final Report' ? 'Final Report PDF' : 'Preliminary Report PDF';
  return '<details class="manager-report-download"><summary class="btn btn--sm">Download PDF</summary><div>' +
    '<button data-act="manager-report-download" data-id="' + esc(report.id) + '" data-variant="report">' + esc(label) + '</button>' +
    '<button data-act="manager-report-download" data-id="' + esc(report.id) + '" data-variant="executive">Executive Summary PDF</button>' +
  '</div></details>';
}

function managerReportDecisionPanel(report, ui) {
  if (report.status !== 'pending_manager') {
    return '<div class="manager-report-decision manager-report-decision--complete"><div><b>Manager stage completed</b><span>' + esc(managerReportStatusLabel(report.status)) + ' · Current owner: ' + esc(managerReportOwnerLabel(report.ownerRole)) + '</span></div></div>';
  }
  return '<div class="manager-report-decision"><label for="manager-report-comment">Manager Comments</label><textarea id="manager-report-comment" placeholder="Add a decision comment.">' + esc(report.managerComment || '') + '</textarea>' +
    '<div class="manager-report-validation" role="alert">' + esc(ui.validationMessage || '') + '</div>' +
    '<div class="manager-report-decision-actions">' +
      '<button class="btn" data-act="manager-report-decision" data-id="' + esc(report.id) + '" data-decision="revision">Request Revision</button>' +
      '<button class="btn btn--danger" data-act="manager-report-decision" data-id="' + esc(report.id) + '" data-decision="return">Return Report</button>' +
      '<button class="btn btn--primary" data-act="manager-report-decision" data-id="' + esc(report.id) + '" data-decision="approve">Approve Report</button>' +
    '</div></div>';
}

function managerReportDossier(report, ui) {
  return '<section class="manager-report-dossier"><div class="manager-report-dossier-head">' +
    '<div><span>Selected report artifact</span><h2>' + esc(report.id) + ' · ' + esc(report.organization) + '</h2><p>' + esc(report.reportType) + ' · Version ' + esc(report.version) + '</p></div>' +
    '<div class="manager-report-head-actions">' + managerReportStatusBadge(report.status) + managerReportDownloadMenu(report) + '<button class="btn btn--sm" data-act="manager-report-preview" data-id="' + esc(report.id) + '">Review Full Report</button></div>' +
    '<dl><div><dt>Audit ID</dt><dd>' + esc(report.auditId) + '</dd></div><div><dt>Lead Inspector</dt><dd>' + esc(report.leadInspector) + '</dd></div><div><dt>Submitted</dt><dd>' + esc(report.submittedAt) + '</dd></div><div><dt>Current Owner</dt><dd>' + esc(managerReportOwnerLabel(report.ownerRole)) + '</dd></div></dl>' +
  '</div>' + managerReportTabs(ui.tab) + managerReportPanel(report, ui.tab) + managerReportDecisionPanel(report, ui) + '</section>';
}

function viewManagerReportsApproval() {
  var ui = managerReportsUiState();
  var allReports = managerReportRows(state, { query: '', reportType: 'all', status: 'all' });
  var reports = managerReportRows(state, ui);
  var selected = reports.filter(function (report) { return report.id === ui.selectedReportId; })[0] || reports[0] || null;
  if (selected && selected.id !== ui.selectedReportId) ui.selectedReportId = selected.id;
  var left = '<section class="manager-report-list"><div class="manager-workbench-panel-head"><div><span>Department workspace</span><h2>Report Queue</h2></div><span class="manager-report-demo-label">Demo report artifacts</span></div>' + managerReportFilters(ui) + managerReportCounters(allReports) + managerReportQueue(reports, selected ? selected.id : '') + '</section>';
  var right = selected ? managerReportDossier(selected, ui) : '<section class="manager-report-dossier manager-report-dossier--empty"><div class="empty">No report dossier is available for the current filters.</div></section>';
  return pageHead('Reports Approval', 'Review separate Preliminary and Final Report artifacts and record the Department Manager decision.') + '<div class="manager-workbench manager-report-workbench">' + left + right + '</div>';
}

function modalManagerReportPreview(report) {
  var findings = managerFindingsForAudit(state, report.auditId);
  var findingRows = findings.map(function (finding) {
    return '<li><b>' + esc(finding.id) + '</b> · ' + esc(finding.title) + ' · ' + esc(severityLabel(finding.severity)) + '</li>';
  }).join('') || '<li>No findings are linked.</li>';
  var body = '<div class="manager-report-preview"><span>AviaSurveil360 frontend-only demo</span><h2>' + esc(report.reportType) + '</h2><p>' + esc(report.id + ' · ' + report.auditId + ' · Version ' + report.version) + '</p><dl><div><dt>Organization</dt><dd>' + esc(report.organization) + '</dd></div><div><dt>Lead Inspector</dt><dd>' + esc(report.leadInspector) + '</dd></div><div><dt>Status</dt><dd>' + esc(managerReportStatusLabel(report.status)) + '</dd></div></dl><h3>Executive Summary</h3><p>' + esc(report.summary) + '</p><h3>Findings</h3><ul>' + findingRows + '</ul><p class="small muted">Demo preview only. No production reporting, document storage, signature, or records-management service is used.</p></div>';
  return modalShell('Review Full Report', body, '<button class="btn" data-act="close-modal">Close</button>' + managerReportDownloadMenu(report), true);
}

/* =========================== Findings list (manager/inspector) =========================== */
var FILTER_LABELS = {
  all: 'All Findings', open: 'Open Findings', overdue: 'Overdue Findings', critical: 'Critical Findings',
  closed: 'Closed Findings', capreview: 'CAP / Provider Review', evreview: 'Evidence Waiting Review', duesoon: 'Findings Due Soon'
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
  if (state.role === 'inspector') return viewInspectorCapReviews();
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
  return pageHead('Findings', 'Follow findings, CAP responses, evidence, owner, due date, and next action in one workspace.', chips) +
    renderAttentionStrip([
      { label: FILTER_LABELS[filter], value: list.length + ' finding' + (list.length === 1 ? '' : 's'), tone: list.length ? 'info' : 'neutral' },
      { label: 'CAP review rows', value: String(list.filter(function (f) { return f.status === 'CAP_SUBMITTED'; }).length), tone: 'warn' },
      { label: 'Evidence review rows', value: String(list.filter(function (f) { return f.status === 'EVIDENCE_SUBMITTED'; }).length), tone: 'warn' }
    ]) +
    renderOpsTable(items, { includeChildren: filter === 'capreview' || filter === 'evreview', empty: 'No findings match this filter.' });
}

/* =========================== Reports list =========================== */
function serviceProviderUiState() {
  return typeof ensureServiceProviderUiState === 'function' ? ensureServiceProviderUiState() : state.serviceProviderUi;
}

function serviceProviderScopeNote() {
  return '<div class="scope-note">🔒 Organization scope: ' + esc(ROLES.auditee.orgName) + '. This portal shows only records explicitly released to your organization.</div>';
}

function serviceProviderWorkspaceMetrics(items) {
  return '<div class="service-workspace-metrics">' + items.map(function (item) {
    return '<article class="is-' + esc(item.tone || 'neutral') + '"><span>' + esc(item.label) + '</span><b>' + esc(String(item.value)) + '</b><small>' + esc(item.detail || '') + '</small></article>';
  }).join('') + '</div>';
}

function serviceProviderAuditOptions(selected, rows) {
  var ids = rows.map(function (row) { return row.auditId; }).filter(function (value, index, list) { return value && list.indexOf(value) === index; });
  return '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>All Audits / Inspections</option>' + ids.map(function (id) {
    return '<option value="' + esc(id) + '"' + (selected === id ? ' selected' : '') + '>' + esc(id) + '</option>';
  }).join('');
}

function serviceProviderCapGroupCounts(rows) {
  return {
    all: rows.length,
    open: rows.filter(function (row) { return row.statusKey !== 'CLOSED'; }).length,
    'in-progress': rows.filter(function (row) { return ['CAP_SUBMITTED', 'EVIDENCE_REQUIRED', 'CAP_MORE_INFO', 'EVIDENCE_MORE_INFO'].indexOf(row.statusKey) !== -1; }).length,
    'awaiting-review': rows.filter(function (row) { return ['CAP_SUBMITTED', 'EVIDENCE_SUBMITTED'].indexOf(row.statusKey) !== -1; }).length,
    closed: rows.filter(function (row) { return row.statusKey === 'CLOSED'; }).length
  };
}

function serviceProviderCapDossier(finding) {
  if (!finding) return '<aside class="service-dossier"><div class="empty">Select a Corrective Action record.</div></aside>';
  var status = FINDING_STATUS[finding.status] || FINDING_STATUS.WAITING_CAP;
  var progress = serviceProviderCapProgress(finding);
  var evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
  var comments = Array.isArray(finding.commentsToAuditee) ? finding.commentsToAuditee : [];
  var responseLabel = ['WAITING_CAP', 'CAP_MORE_INFO', 'EVIDENCE_REQUIRED', 'EVIDENCE_MORE_INFO'].indexOf(finding.status) !== -1 ? 'Respond' : 'View Status';
  return '<aside class="service-dossier"><div class="service-dossier__head"><div><span>Selected Finding</span><h2>' + esc(finding.id) + '</h2></div>' + demoBadge(status.label, finding.status === 'CLOSED' ? 'ok' : 'info') + '</div>' +
    '<h3>' + esc(finding.title) + '</h3><p>' + esc(finding.description) + '</p>' +
    '<dl><dt>Finding ID</dt><dd>' + esc(finding.id) + '</dd><dt>Level</dt><dd>' + esc(SEVERITY[finding.severity] ? SEVERITY[finding.severity].label : String(finding.severity)) + '</dd><dt>Audit / Inspection</dt><dd>' + esc(finding.auditId || 'Not configured') + '</dd><dt>Due Date</dt><dd>' + esc(finding.dueDate ? fmtDate(finding.dueDate) : 'Not configured') + '</dd><dt>Current owner</dt><dd>' + esc(roleName(status.ownerRole)) + '</dd><dt>Next action</dt><dd>' + esc(status.next) + '</dd></dl>' +
    '<div class="service-progress"><span><b>Lifecycle progress</b><em>' + esc(progress.label) + '</em></span><div><i style="width:' + esc(String(progress.percent)) + '%"></i></div></div>' +
    '<h3>CAP / Evidence timeline</h3><ol class="service-mini-timeline"><li class="is-done">Finding issued</li><li class="' + (finding.cap ? 'is-done' : 'is-current') + '">CAP submitted / reviewed</li><li class="' + (evidence.length ? 'is-done' : (finding.cap ? 'is-current' : '')) + '">Evidence submitted / reviewed</li><li class="' + (finding.status === 'CLOSED' ? 'is-done' : '') + '">Authorized closure</li></ol>' +
    '<h3>CAA-visible comments</h3>' + (comments.length ? '<div class="service-comment-list">' + comments.map(function (comment) { return '<p><b>' + esc(comment.author) + '</b><span>' + esc(comment.date) + '</span>' + esc(comment.text) + '</p>'; }).join('') + '</div>' : '<p class="muted small">No CAA-visible comments.</p>') +
    '<h3>Evidence versions</h3>' + (evidence.length ? '<div class="service-evidence-list">' + evidence.map(function (item) { return '<p><b>v' + esc(String(item.version)) + ' · ' + esc(item.fileName) + '</b><span>' + esc(item.status + ' · ' + item.uploadedDate) + '</span></p>'; }).join('') + '</div>' : '<p class="muted small">No evidence versions submitted.</p>') +
    '<button class="btn btn--primary btn--block" data-act="service-provider-cap-respond" data-id="' + esc(finding.id) + '">' + esc(responseLabel) + '</button>' +
    '<p class="small muted">CAP acceptance does not close this Finding. Required evidence must be accepted or an authorized closure must be recorded.</p></aside>';
}

function viewServiceProviderCapWorkspace() {
  var ui = serviceProviderUiState().cap;
  var organizationId = ROLES.auditee.org;
  var allRows = serviceProviderCapRows(state, organizationId, { group: 'all', auditId: 'all', level: 'all', status: 'all', query: '' });
  var counts = serviceProviderCapGroupCounts(allRows);
  var rows = serviceProviderCapRows(state, organizationId, ui);
  var selected = serviceProviderFindingById(state, organizationId, ui.selectedFindingId);
  if (!selected && rows.length) selected = serviceProviderFindingById(state, organizationId, rows[0].id);
  var groupLabels = { all: 'Total', open: 'Open', 'in-progress': 'In Progress', 'awaiting-review': 'Awaiting Review', closed: 'Closed' };
  var groups = ['all', 'open', 'in-progress', 'awaiting-review', 'closed'].map(function (key) {
    return '<button class="' + (ui.group === key ? 'is-active' : '') + '" data-act="service-provider-cap-group" data-group="' + key + '">' + esc(groupLabels[key]) + ' <b>' + esc(String(counts[key])) + '</b></button>';
  }).join('');
  var body = rows.length ? rows.map(function (row) {
    return '<tr class="' + (selected && selected.id === row.id ? 'is-selected' : '') + '"><td><button class="service-link" data-act="service-provider-cap-select" data-id="' + esc(row.id) + '">' + esc(row.id) + '</button></td><td>' + esc(row.auditId + ' · ' + row.audit) + '</td><td>' + esc(row.title) + '</td><td>' + esc(row.level) + '</td><td>' + esc(row.status) + '</td><td>' + esc(row.dueDate === 'Not configured' ? row.dueDate : fmtDate(row.dueDate)) + '</td><td><span class="service-table-progress"><i style="width:' + esc(String(row.progressPercent)) + '%"></i></span>' + esc(row.progress) + '</td><td><button class="btn btn--sm" data-act="service-provider-cap-respond" data-id="' + esc(row.id) + '">' + esc(row.statusKey === 'CLOSED' ? 'View' : 'Respond') + '</button></td></tr>';
  }).join('') : '<tr><td colspan="8"><div class="empty">No Corrective Actions match these filters.</div></td></tr>';
  return '<div class="service-workspace">' + pageHead('Corrective Actions (CAP)', 'Review exactly what the CAA needs from ' + ROLES.auditee.orgName + ', the configured Due Date, and the next lifecycle action.') + serviceProviderScopeNote() +
    serviceProviderWorkspaceMetrics([{ label: 'Total', value: counts.all }, { label: 'Open', value: counts.open, tone: 'warn' }, { label: 'In Progress', value: counts['in-progress'], tone: 'info' }, { label: 'Awaiting Review', value: counts['awaiting-review'], tone: 'info' }, { label: 'Closed', value: counts.closed, tone: 'ok' }]) +
    '<div class="service-workspace-tabs">' + groups + '</div><div class="service-filter-row"><label>Audit / Inspection<select data-field="service-provider-cap-audit">' + serviceProviderAuditOptions(ui.auditId, allRows) + '</select></label><label>Level<select data-field="service-provider-cap-level"><option value="all">All Levels</option><option value="1"' + (ui.level === '1' ? ' selected' : '') + '>Level 1 Critical</option><option value="2"' + (ui.level === '2' ? ' selected' : '') + '>Level 2 Major</option><option value="3"' + (ui.level === '3' ? ' selected' : '') + '>Level 3 Minor</option><option value="0"' + (ui.level === '0' ? ' selected' : '') + '>Observation</option></select></label><label>Status<select data-field="service-provider-cap-status"><option value="all">All Statuses</option>' + Object.keys(FINDING_STATUS).map(function (key) { return '<option value="' + esc(key) + '"' + (ui.status === key ? ' selected' : '') + '>' + esc(FINDING_STATUS[key].label) + '</option>'; }).join('') + '</select></label><label class="is-search">Search<input type="search" data-field="service-provider-cap-query" value="' + esc(ui.query) + '" placeholder="Finding, audit, status..."></label></div>' +
    '<div class="service-workspace-layout"><section class="service-table-card"><div class="responsive-table-shell"><table class="service-table"><thead><tr><th>Finding ID</th><th>Audit/Inspection</th><th>Finding Title</th><th>Level</th><th>Status</th><th>Due Date</th><th>Progress</th><th>Action</th></tr></thead><tbody>' + body + '</tbody></table></div></section>' + serviceProviderCapDossier(selected) + '</div></div>';
}

function serviceProviderReportStatus(report, findings) {
  if (report.status === 'closed' || (findings.length && findings.every(function (finding) { return finding.status === 'CLOSED'; }))) return 'closed';
  if (findings.some(function (finding) { return ['CAP_SUBMITTED', 'EVIDENCE_SUBMITTED'].indexOf(finding.status) !== -1; })) return 'under-review';
  return 'pending-response';
}

function serviceProviderPreliminaryDossier(report) {
  var safe = report ? serviceProviderSafeReportProjection(state, ROLES.auditee.org, report.id) : null;
  if (!safe) return '<aside class="service-dossier"><div class="empty">Select a shared Preliminary Report.</div></aside>';
  return '<aside class="service-dossier"><div class="service-dossier__head"><div><span>Selected Report</span><h2>' + esc(safe.id) + '</h2></div>' + demoBadge('Service Provider visible', 'ok') + '</div><h3>' + esc(safe.audit) + '</h3><p>' + esc(safe.summary) + '</p><dl><dt>Status</dt><dd>' + esc(serviceProviderReportStatus(report, serviceProviderReportFindings(state, ROLES.auditee.org, report))) + '</dd><dt>Date Shared</dt><dd>' + esc(safe.dateShared || 'Not recorded') + '</dd><dt>Shared By</dt><dd>' + esc(safe.sharedBy) + '</dd><dt>Total Findings</dt><dd>' + esc(String(safe.findingCount)) + '</dd><dt>Response Due Date</dt><dd>' + esc(safe.responseDueDate === 'Not configured' ? safe.responseDueDate : fmtDate(safe.responseDueDate)) + '</dd><dt>Classification</dt><dd>' + esc(safe.classification) + '</dd></dl><h3>Shared attachments</h3>' + (safe.attachments.length ? '<div class="service-document-list">' + safe.attachments.map(function (file) { return '<button data-act="service-provider-document" data-id="' + esc(safe.id) + '" data-file="' + esc(file) + '">' + esc(file) + '</button>'; }).join('') + '</div>' : '<p class="muted small">No attachments shared.</p>') + '<div class="service-dossier-actions"><button class="btn btn--primary" data-act="service-provider-report-view" data-id="' + esc(safe.id) + '">View Report</button><button class="btn" data-act="service-provider-message" data-id="' + esc(safe.id) + '">Send Message to Inspector</button></div></aside>';
}

function viewServiceProviderPreliminaryReports() {
  var ui = serviceProviderUiState().preliminaryReports;
  var organizationId = ROLES.auditee.org;
  var reports = serviceProviderVisibleReports(state, organizationId, 'Preliminary Report');
  var rows = reports.map(function (report) { var findings = serviceProviderReportFindings(state, organizationId, report); return { report: report, auditId: report.auditId, status: serviceProviderReportStatus(report, findings), findings: findings }; });
  var filtered = rows.filter(function (row) { if (ui.auditId !== 'all' && row.auditId !== ui.auditId) return false; if (ui.status !== 'all' && row.status !== ui.status) return false; var query = (ui.query || '').toLowerCase(); return !query || (row.report.id + ' ' + row.auditId + ' ' + row.report.organization).toLowerCase().indexOf(query) !== -1; });
  var selected = serviceProviderReportById(state, organizationId, ui.selectedReportId);
  if (!selected || normalizeReportType(selected.reportType) !== 'Preliminary Report') selected = filtered.length ? filtered[0].report : null;
  var body = filtered.length ? filtered.map(function (row) { return '<tr><td><button class="service-link" data-act="service-provider-report-select" data-id="' + esc(row.report.id) + '" data-report-type="preliminary">' + esc(row.report.id) + '</button></td><td>' + esc(row.auditId + ' · ' + (auditById(row.auditId) ? auditById(row.auditId).type : 'Inspection')) + '</td><td>' + esc(row.report.sharedAt || row.report.releasedAt || 'Not recorded') + '</td><td>' + esc(String(row.findings.length)) + '</td><td>' + esc(row.report.responseDueDate ? fmtDate(row.report.responseDueDate) : 'Not configured') + '</td><td><button class="btn btn--sm" data-act="service-provider-report-view" data-id="' + esc(row.report.id) + '">View Report</button></td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty">No shared Preliminary Reports match these filters.</div></td></tr>';
  return '<div class="service-workspace">' + pageHead('Preliminary Reports', 'Only report packages explicitly released to ' + ROLES.auditee.orgName + ' are visible.') + serviceProviderScopeNote() + serviceProviderWorkspaceMetrics([{ label: 'Total', value: rows.length }, { label: 'Pending Your Response', value: rows.filter(function (row) { return row.status === 'pending-response'; }).length, tone: 'warn' }, { label: 'Under Review by Authority', value: rows.filter(function (row) { return row.status === 'under-review'; }).length, tone: 'info' }, { label: 'Closed', value: rows.filter(function (row) { return row.status === 'closed'; }).length, tone: 'ok' }]) + '<div class="service-filter-row"><label>Audit / Inspection<select data-field="service-provider-preliminary-audit">' + serviceProviderAuditOptions(ui.auditId, rows) + '</select></label><label>Status<select data-field="service-provider-preliminary-status"><option value="all">All Statuses</option><option value="pending-response"' + (ui.status === 'pending-response' ? ' selected' : '') + '>Pending Your Response</option><option value="under-review"' + (ui.status === 'under-review' ? ' selected' : '') + '>Under Review by Authority</option><option value="closed"' + (ui.status === 'closed' ? ' selected' : '') + '>Closed</option></select></label><label class="is-search">Search<input type="search" data-field="service-provider-preliminary-query" value="' + esc(ui.query) + '" placeholder="Report ID or Audit ID"></label></div><div class="service-workspace-layout"><section class="service-table-card"><div class="responsive-table-shell"><table class="service-table"><thead><tr><th>Report ID</th><th>Audit/Inspection</th><th>Date Shared</th><th>Findings</th><th>Due Date</th><th>Action</th></tr></thead><tbody>' + body + '</tbody></table></div></section>' + serviceProviderPreliminaryDossier(selected) + '</div></div>';
}

function serviceProviderFinalDossier(report) {
  var safe = report ? serviceProviderSafeReportProjection(state, ROLES.auditee.org, report.id) : null;
  if (!safe) return '<aside class="service-dossier"><div class="empty">Select an issued Final Report.</div></aside>';
  return '<aside class="service-dossier"><div class="service-dossier__head"><div><span>Selected Final Report</span><h2>' + esc(safe.id) + '</h2></div>' + demoBadge('Issued / locked', 'ok') + '</div><h3>' + esc(safe.audit) + '</h3><p>' + esc(safe.summary) + '</p><dl><dt>Report ID</dt><dd>' + esc(safe.id) + '</dd><dt>Audit / Inspection</dt><dd>' + esc(safe.auditId + ' · ' + safe.inspectionType) + '</dd><dt>Date / Period</dt><dd>' + esc(safe.inspectionDate ? fmtDate(safe.inspectionDate) : 'Not configured') + '</dd><dt>Lead Inspector</dt><dd>' + esc(safe.leadInspector) + '</dd><dt>Version</dt><dd>' + esc(safe.version) + '</dd><dt>Findings</dt><dd>' + esc(String(safe.findingCount)) + '</dd><dt>Classification</dt><dd>' + esc(safe.classification) + '</dd></dl><h3>Objective & Scope</h3><p>Auditee-safe final record of the configured inspection scope, findings, corrective-action status, and authorized report result.</p><h3>Shared attachments</h3>' + (safe.attachments.length ? '<div class="service-document-list">' + safe.attachments.map(function (file) { return '<button data-act="service-provider-document" data-id="' + esc(safe.id) + '" data-file="' + esc(file) + '">' + esc(file) + '</button>'; }).join('') + '</div>' : '<p class="muted small">No attachments shared.</p>') + '<div class="service-dossier-actions"><button class="btn btn--primary" data-act="service-provider-report-view" data-id="' + esc(safe.id) + '">View Report</button><button class="btn" data-act="service-provider-download-all" data-id="' + esc(safe.id) + '">Download All</button></div></aside>';
}

function viewServiceProviderFinalReports() {
  var ui = serviceProviderUiState().finalReports;
  var organizationId = ROLES.auditee.org;
  var reports = serviceProviderVisibleReports(state, organizationId, 'Final Report');
  var rows = reports.map(function (report) { return { report: report, auditId: report.auditId, findings: serviceProviderReportFindings(state, organizationId, report), closed: serviceProviderFinalReportIsClosed(state, organizationId, report) }; });
  var filtered = rows.filter(function (row) { if (ui.auditId !== 'all' && row.auditId !== ui.auditId) return false; if (ui.year !== 'all' && String(row.report.issuedAt || '').indexOf(ui.year) !== 0) return false; if (ui.capRequirement === 'required' && !row.report.capRequired) return false; if (ui.capRequirement === 'not-required' && row.report.capRequired) return false; var query = (ui.query || '').toLowerCase(); return !query || (row.report.id + ' ' + row.auditId + ' ' + row.report.organization).toLowerCase().indexOf(query) !== -1; });
  var selected = serviceProviderReportById(state, organizationId, ui.selectedReportId);
  if (!selected || normalizeReportType(selected.reportType) !== 'Final Report') selected = filtered.length ? filtered[0].report : null;
  var body = filtered.length ? filtered.map(function (row) { return '<tr><td><button class="service-link" data-act="service-provider-report-select" data-id="' + esc(row.report.id) + '" data-report-type="final">' + esc(row.report.id) + '</button></td><td>' + esc(row.auditId + ' · ' + (auditById(row.auditId) ? auditById(row.auditId).type : 'Inspection')) + '</td><td>' + esc(row.report.issuedAt || row.report.releasedAt || 'Not recorded') + '</td><td>' + esc(String(row.findings.length)) + '</td><td><button class="btn btn--sm" data-act="service-provider-report-view" data-id="' + esc(row.report.id) + '">View Report</button></td></tr>'; }).join('') : '<tr><td colspan="5"><div class="empty">No issued Final Reports match these filters.</div></td></tr>';
  return '<div class="service-workspace">' + pageHead('Final Reports', 'Only Executive Director-issued and locked Final Reports for ' + ROLES.auditee.orgName + ' are visible.') + serviceProviderScopeNote() + serviceProviderWorkspaceMetrics([{ label: 'Total Final Reports', value: rows.length }, { label: 'Reports Requiring CAP', value: rows.filter(function (row) { return row.report.capRequired; }).length, tone: 'warn' }, { label: 'Closed Reports', value: rows.filter(function (row) { return row.closed; }).length, tone: 'ok' }, { label: 'This Year', value: rows.filter(function (row) { return String(row.report.issuedAt || '').indexOf('2026') === 0; }).length, tone: 'info' }]) + '<div class="service-filter-row"><label>Audit / Inspection<select data-field="service-provider-final-audit">' + serviceProviderAuditOptions(ui.auditId, rows) + '</select></label><label>Year<select data-field="service-provider-final-year"><option value="all">All Years</option><option value="2026"' + (ui.year === '2026' ? ' selected' : '') + '>2026</option><option value="2025"' + (ui.year === '2025' ? ' selected' : '') + '>2025</option></select></label><label>CAP<select data-field="service-provider-final-cap"><option value="all">All Reports</option><option value="required"' + (ui.capRequirement === 'required' ? ' selected' : '') + '>Requires CAP</option><option value="not-required"' + (ui.capRequirement === 'not-required' ? ' selected' : '') + '>No CAP Required</option></select></label><label class="is-search">Search<input type="search" data-field="service-provider-final-query" value="' + esc(ui.query) + '" placeholder="Report ID or Audit ID"></label></div><div class="service-workspace-layout"><section class="service-table-card"><div class="responsive-table-shell"><table class="service-table"><thead><tr><th>Report ID</th><th>Audit/Inspection</th><th>Date Released</th><th>Findings</th><th>Action</th></tr></thead><tbody>' + body + '</tbody></table></div></section>' + serviceProviderFinalDossier(selected) + '</div></div>';
}

function viewServiceProviderReportPreview() {
  var ui = serviceProviderUiState();
  var reportId = state.params && state.params.reportId ? state.params.reportId : ui.reportPreview.reportId;
  var safe = serviceProviderSafeReportProjection(state, ROLES.auditee.org, reportId);
  if (!safe) return pageHead('Report not available', 'This Report ID is not released to your organization.') + serviceProviderScopeNote();
  var backView = safe.reportType === 'Final Report' ? 'service-provider-final-reports' : 'service-provider-preliminary-reports';
  var findings = safe.findings.map(function (finding) { return '<tr><td>' + esc(finding.id) + '</td><td>' + esc(finding.level) + '</td><td>' + esc(finding.status) + '</td><td>' + esc(finding.dueDate === 'Not configured' ? finding.dueDate : fmtDate(finding.dueDate)) + '</td></tr>'; }).join('');
  return '<div class="service-report-preview"><button class="inspection-back" data-act="nav" data-view="' + backView + '">&larr; Back to ' + esc(safe.reportType === 'Final Report' ? 'Final Reports' : 'Preliminary Reports') + '</button>' + serviceProviderScopeNote() + '<article class="service-report-paper"><header><div>' + renderBrandMark('brand-mark--report') + '<span>AviaSurveil360</span></div><p>' + esc(safe.classification) + '</p></header><h1>' + esc(safe.reportType) + '</h1><h2>' + esc(safe.id + ' · ' + safe.organization) + '</h2><div class="service-report-paper__meta"><span><b>Audit ID</b>' + esc(safe.auditId) + '</span><span><b>Inspection</b>' + esc(safe.inspectionType) + '</span><span><b>Lead Inspector</b>' + esc(safe.leadInspector) + '</span><span><b>Version</b>' + esc(safe.version) + '</span><span><b>Released / Shared</b>' + esc(safe.dateShared || 'Not recorded') + '</span></div><h3>Authorized Service Provider Summary</h3><p>' + esc(safe.summary) + '</p><h3>Objective & Scope</h3><p>This auditee-safe copy summarizes the configured inspection, the Findings communicated to the Service Provider, and the required Corrective Action / Evidence lifecycle. It excludes all internal CAA working information.</p><h3>Findings</h3><table><thead><tr><th>Finding</th><th>Level</th><th>Status</th><th>Due Date</th></tr></thead><tbody>' + findings + '</tbody></table><h3>Shared attachments</h3><div class="service-document-list">' + safe.attachments.map(function (file) { return '<button data-act="service-provider-document" data-id="' + esc(safe.id) + '" data-file="' + esc(file) + '">' + esc(file) + '</button>'; }).join('') + '</div><footer>Demo-only browser-local report viewer. No real electronic signature, file storage, or reporting engine.</footer></article><div class="service-preview-actions"><button class="btn" data-act="service-provider-message" data-id="' + esc(safe.id) + '">Send Message to Inspector</button><button class="btn btn--primary" data-act="service-provider-download-all" data-id="' + esc(safe.id) + '">Download Shared Package</button></div></div>';
}

function viewServiceProviderDocuments() {
  var reports = serviceProviderVisibleReports(state, ROLES.auditee.org, 'Preliminary Report').concat(serviceProviderVisibleReports(state, ROLES.auditee.org, 'Final Report'));
  var rows = reports.reduce(function (items, report) { (report.attachments || []).forEach(function (file) { items.push({ reportId: report.id, file: file, type: normalizeReportType(report.reportType) }); }); return items; }, []);
  return pageHead('Documents', 'Filename-only documents explicitly shared with ' + ROLES.auditee.orgName + '.') + serviceProviderScopeNote() + '<div class="service-document-catalog">' + (rows.length ? rows.map(function (row) { return '<button data-act="service-provider-document" data-id="' + esc(row.reportId) + '" data-file="' + esc(row.file) + '"><span><b>' + esc(row.file) + '</b><small>' + esc(row.reportId + ' · ' + row.type) + '</small></span><em>Preview / Mock Download</em></button>'; }).join('') : '<div class="empty">No shared documents.</div>') + '</div>';
}

function serviceProviderReportUiState() {
  if (typeof ensureServiceProviderReportUi === 'function') return ensureServiceProviderReportUi();
  if (!state.serviceProviderReportUi) state.serviceProviderReportUi = { tab: 'cap', submittedCaps: {}, downloadedAt: '' };
  if (!state.serviceProviderReportUi.tab) state.serviceProviderReportUi.tab = 'cap';
  if (!state.serviceProviderReportUi.submittedCaps || typeof state.serviceProviderReportUi.submittedCaps !== 'object') state.serviceProviderReportUi.submittedCaps = {};
  if (!state.serviceProviderReportUi.downloadedAt) state.serviceProviderReportUi.downloadedAt = '';
  return state.serviceProviderReportUi;
}

function serviceProviderFinalReportMeta() {
  var organization = ROLES.auditee.orgName || 'Fly Namibia';
  return {
    reportId: 'FR-2026-014',
    inspectionId: 'INS-2026-014',
    inspection: 'AVSEC Inspection',
    organization: organization,
    dates: '12 - 14 Jun 2026',
    version: '1.0 (Final)',
    finalizedOn: '16 Jun 2026 10:15',
    issuedBy: 'Mehmet Kaya',
    issuedRole: 'Department Manager',
    status: 'Finalized - Action Required'
  };
}

function serviceProviderCapRequirements() {
  return [
    {
      id: 'F-014-01',
      title: 'Access control to restricted areas',
      checklist: 'Access Control',
      level: 'l1',
      levelLabel: 'Level 1 (Critical)',
      dueDateText: '30 Jun 2026',
      dueRule: '14 days',
      daysLeftText: '14 days',
      capRequired: true
    },
    {
      id: 'F-014-04',
      title: 'Screening procedure compliance',
      checklist: 'Screening',
      level: 'l1',
      levelLabel: 'Level 1 (Critical)',
      dueDateText: '30 Jun 2026',
      dueRule: '14 days',
      daysLeftText: '14 days',
      capRequired: true
    },
    {
      id: 'F-014-02',
      title: 'Staff training records',
      checklist: 'Training',
      level: 'l2',
      levelLabel: 'Level 2 (Major)',
      dueDateText: '14 Sep 2026',
      dueRule: '90 days',
      daysLeftText: '89 days',
      capRequired: true
    },
    {
      id: 'F-014-03',
      title: 'Vehicle security inspection',
      checklist: 'Ground Handling',
      level: 'l2',
      levelLabel: 'Level 2 (Major)',
      dueDateText: '14 Sep 2026',
      dueRule: '90 days',
      daysLeftText: '89 days',
      capRequired: true
    },
    {
      id: 'F-014-05',
      title: 'Signage and awareness',
      checklist: 'Security Awareness',
      level: 'l3',
      levelLabel: 'Level 3 (Observation)',
      dueDateText: 'Observation',
      dueRule: 'Observation',
      daysLeftText: '-',
      capRequired: false
    }
  ];
}

function serviceProviderCapRequirementById(id) {
  return serviceProviderCapRequirements().filter(function (row) { return row.id === id; })[0] || null;
}

function serviceProviderReportBadge(label, tone) {
  return '<span class="sp-report-badge is-' + esc(tone || 'ok') + '">' + esc(label) + '</span>';
}

function serviceProviderMetaItem(label, value) {
  return '<div><span>' + esc(label) + '</span><b>' + value + '</b></div>';
}

function serviceProviderSummaryCard(label, value, detail, tone) {
  return '<article class="sp-report-summary-card is-' + esc(tone || 'neutral') + '">' +
    '<span>' + esc(label) + '</span><strong>' + esc(String(value)) + '</strong>' +
    (detail ? '<em>' + esc(detail) + '</em>' : '') +
  '</article>';
}

function serviceProviderReportHeader(meta, ui) {
  return '<div class="sp-report-head">' +
    '<div class="sp-report-crumb"><button data-act="nav" data-view="reports" data-filter="received">Home</button><span>Reports</span><span>&gt;</span><span>Final Reports</span><span>&gt;</span><b>' + esc(meta.reportId) + '</b></div>' +
    '<div class="sp-report-title">' +
      '<div><h1>Final Report <span>- ' + esc(meta.inspection) + ' - ' + esc(meta.organization) + '</span></h1>' + serviceProviderReportBadge(meta.status, 'ok') + '</div>' +
      '<button class="btn btn--primary" data-act="service-report-download">View / Download Final Report (PDF)</button>' +
    '</div>' +
    '<div class="sp-report-meta">' +
      serviceProviderMetaItem('Report ID', '<a>' + esc(meta.reportId) + '</a>') +
      serviceProviderMetaItem('Inspection ID', '<a>' + esc(meta.inspectionId) + '</a>') +
      serviceProviderMetaItem('Inspection Dates', esc(meta.dates)) +
      serviceProviderMetaItem('Organization', esc(meta.organization)) +
      serviceProviderMetaItem('Report Version', esc(meta.version)) +
      serviceProviderMetaItem('Finalized On', esc(meta.finalizedOn)) +
      serviceProviderMetaItem('Issued By', esc(meta.issuedRole) + '<br><small>' + esc(meta.issuedBy) + '</small>') +
    '</div>' +
  '</div>';
}

function serviceProviderReportTabs(ui) {
  var rows = [
    ['overview', 'Report Overview'],
    ['findings', 'Findings Summary'],
    ['cap', 'CAP Requirements (5)'],
    ['communications', 'Communications (1)'],
    ['attachments', 'Attachments (7)'],
    ['history', 'History']
  ];
  return '<div class="sp-report-tabs">' + rows.map(function (tab) {
    return '<button class="' + (ui.tab === tab[0] ? 'is-active' : '') + '" data-act="service-report-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + '</button>';
  }).join('') + '</div>';
}

function serviceProviderCapStatus(row, ui) {
  if (!row.capRequired) return { label: 'Not Applicable', tone: 'neutral' };
  if (ui.submittedCaps[row.id]) return { label: 'CAP Evidence Submitted', tone: 'ok' };
  return { label: 'Evidence Required', tone: 'info' };
}

function serviceProviderCapRowsHtml(ui) {
  return serviceProviderCapRequirements().map(function (row) {
    var status = serviceProviderCapStatus(row, ui);
    var action = row.capRequired
      ? '<button class="btn btn--sm' + (ui.submittedCaps[row.id] ? '' : ' btn--primary') + '" data-act="service-report-submit-cap" data-id="' + esc(row.id) + '">' + esc(ui.submittedCaps[row.id] ? 'View Evidence' : 'Upload Evidence') + '</button>'
      : '<button class="btn btn--sm" data-act="service-report-view-finding" data-id="' + esc(row.id) + '">View Finding</button>';
    var due = row.capRequired
      ? '<b>' + esc(row.dueDateText) + '</b><small>(' + esc(row.dueRule) + ')</small>'
      : '<b>Observation</b>';
    return '<tr>' +
      '<td><button class="sp-report-expand" data-act="service-report-view-finding" data-id="' + esc(row.id) + '">&gt;</button><b>' + esc(row.id) + '</b></td>' +
      '<td>' + esc(row.title) + '<small>' + esc(row.checklist) + '</small></td>' +
      '<td><span class="sp-level is-' + esc(row.level) + '">' + esc(row.levelLabel) + '</span></td>' +
      '<td class="sp-report-due">' + due + '</td>' +
      '<td><span class="sp-days is-' + esc(row.level) + '">' + esc(row.daysLeftText) + '</span></td>' +
      '<td>' + serviceProviderReportBadge(status.label, status.tone) + '</td>' +
      '<td>' + action + '</td>' +
    '</tr>';
  }).join('');
}

function serviceProviderDueInfoPanel() {
  return '<section class="sp-report-side-card">' +
    '<h2>Due Date Information</h2>' +
    '<dl class="sp-report-due-list">' +
      '<dt class="is-l1">Level 1 (Critical)</dt><dd class="is-l1">14 days</dd>' +
      '<dt class="is-l2">Level 2 (Major)</dt><dd class="is-l2">90 days</dd>' +
      '<dt class="is-l3">Level 3 (Observation)</dt><dd class="is-l3">Observation</dd>' +
    '</dl>' +
    '<p>Due dates are calculated from the report finalized date:<br><b>16 Jun 2026</b></p>' +
  '</section>';
}

function serviceProviderReportInfoPanel() {
  return '<section class="sp-report-side-card">' +
    '<h2>Report Information</h2>' +
    '<dl><dt>Inspection Type</dt><dd>Routine (Announced)</dd><dt>Scope</dt><dd>AVSEC Compliance</dd><dt>Risk Category</dt><dd>High</dd><dt>Checklist Used</dt><dd>AVSEC Comprehensive Checklist v3.2</dd><dt>Lead Inspector</dt><dd>Aylin Sezer</dd><dt>Team Members</dt><dd>5 Inspectors</dd></dl>' +
  '</section>';
}

function serviceProviderIssuedPanel(meta) {
  return '<section class="sp-report-side-card sp-report-issued">' +
    '<h2>Report Issued By</h2>' +
    '<div><span>MK</span><p><b>' + esc(meta.issuedBy) + '</b><small>' + esc(meta.issuedRole) + '</small><small>Issued on ' + esc(meta.finalizedOn) + '</small></p><em>Signed</em></div>' +
  '</section>';
}

function serviceProviderDocumentsPanel() {
  var docs = [
    ['final', 'Final Report (FR-2026-014).pdf', '2.4 MB'],
    ['plan', 'Inspection Plan (INS-2026-014).pdf', '1.1 MB'],
    ['zip', 'Findings Evidence (ZIP)', '8.7 MB'],
    ['support', 'Supporting Documents', '(4 files)']
  ];
  return '<section class="sp-report-side-card">' +
    '<div class="sp-report-side-title"><h2>Key Documents (7)</h2><button data-act="service-report-tab" data-tab="attachments">View all</button></div>' +
    '<div class="sp-doc-list">' + docs.map(function (doc) {
      return '<button data-act="service-report-document" data-id="' + esc(doc[0]) + '"><span>' + esc(doc[1]) + '</span><em>' + esc(doc[2]) + '</em></button>';
    }).join('') + '</div>' +
  '</section>';
}

function serviceProviderSidePanel(meta) {
  return '<aside class="sp-report-side">' +
    serviceProviderDueInfoPanel() +
    serviceProviderReportInfoPanel() +
    serviceProviderIssuedPanel(meta) +
    serviceProviderDocumentsPanel() +
  '</aside>';
}

function serviceProviderTimeline() {
  var items = [
    ['done', 'Inspection Completed', '14 Jun 2026'],
    ['done', 'Report Finalized by Lead Inspector', '15 Jun 2026'],
    ['done', 'Reviewed & Approved by Department Manager', '16 Jun 2026 10:15'],
    ['current', 'Sent to Service Provider', '16 Jun 2026 10:15'],
    ['pending', 'CAP Submission', 'Your Action - Due: See above']
  ];
  return '<section class="sp-report-panel sp-report-timeline">' +
    '<h2>Report & Approval Timeline</h2>' +
    '<div class="sp-timeline">' + items.map(function (item) {
      return '<div class="is-' + esc(item[0]) + '"><span></span><b>' + esc(item[1]) + '</b><small>' + esc(item[2]) + '</small></div>';
    }).join('') + '</div>' +
  '</section>';
}

function serviceProviderCapTab(meta, ui) {
  var rows = serviceProviderCapRequirements();
  var capRequired = rows.filter(function (row) { return row.capRequired; });
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>CAP Requirements Summary</h2>' +
        '<p>The following findings require corrective action evidence. Upload the CAP closure document or implementation evidence within the due date for each checklist finding.</p>' +
        '<div class="sp-report-summary-grid">' +
          serviceProviderSummaryCard('Total Evidence Required', capRequired.length, '', 'total') +
          serviceProviderSummaryCard('Level 1 (Critical)', 2, '14 days', 'l1') +
          serviceProviderSummaryCard('Level 2 (Major)', 2, '90 days', 'l2') +
          serviceProviderSummaryCard('Level 3 (Observation)', 1, 'Observation', 'l3') +
          serviceProviderSummaryCard('Overdue', 0, '', 'overdue') +
        '</div>' +
        '<h2 class="mt-24">CAP Evidence Requirements (5)</h2>' +
        '<div class="sp-report-table-wrap"><table class="sp-report-table"><thead><tr><th>Finding ID</th><th>Finding Title</th><th>Level</th><th>Due Date</th><th>Days Left</th><th>Status</th><th>Action</th></tr></thead><tbody>' + serviceProviderCapRowsHtml(ui) + '</tbody></table></div>' +
        '<div class="sp-report-rules"><span>Due dates are calculated based on the finding level:</span><b class="is-l1">Level 1 = 14 days</b><b class="is-l2">Level 2 = 90 days</b><b class="is-l3">Level 3 = Observation</b></div>' +
      '</section>' +
      serviceProviderTimeline() +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderOverviewTab(meta) {
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>Report Overview</h2>' +
        '<p>The final report has been issued by the Department Manager and requires Service Provider action for CAP-required findings.</p>' +
        '<div class="sp-report-overview-grid">' +
          serviceProviderSummaryCard('Final Report', meta.reportId, meta.version, 'total') +
          serviceProviderSummaryCard('CAP Required', 4, 'Across Level 1 and Level 2 findings', 'l2') +
          serviceProviderSummaryCard('Observation', 1, 'No CAP required', 'l3') +
        '</div>' +
      '</section>' +
      serviceProviderTimeline() +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderFindingsTab(meta, ui) {
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>Findings Summary</h2>' +
        '<p>Findings are grouped by the checklist area used during the AVSEC inspection. Due dates are tracked per finding level.</p>' +
        '<div class="sp-report-table-wrap"><table class="sp-report-table"><thead><tr><th>Finding ID</th><th>Checklist</th><th>Finding</th><th>Level</th><th>Due Date</th><th>Status</th></tr></thead><tbody>' +
          serviceProviderCapRequirements().map(function (row) {
            var status = serviceProviderCapStatus(row, ui);
            return '<tr><td><b>' + esc(row.id) + '</b></td><td>' + esc(row.checklist) + '</td><td>' + esc(row.title) + '</td><td><span class="sp-level is-' + esc(row.level) + '">' + esc(row.levelLabel) + '</span></td><td>' + esc(row.dueDateText) + '</td><td>' + serviceProviderReportBadge(status.label, status.tone) + '</td></tr>';
          }).join('') +
        '</tbody></table></div>' +
      '</section>' +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderCommunicationsTab(meta) {
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>Communications</h2>' +
        '<div class="sp-message-row"><b>16 Jun 2026 10:15</b><p>Final report issued by Department Manager. Submit CAPs for each Level 1 and Level 2 finding by the listed due dates.</p><span>CAA to ' + esc(meta.organization) + '</span></div>' +
      '</section>' +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderAttachmentsTab(meta) {
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>Attachments (7)</h2>' +
        '<div class="sp-doc-table">' +
          '<button data-act="service-report-document" data-id="final"><b>Final Report (FR-2026-014).pdf</b><span>2.4 MB</span></button>' +
          '<button data-act="service-report-document" data-id="plan"><b>Inspection Plan (INS-2026-014).pdf</b><span>1.1 MB</span></button>' +
          '<button data-act="service-report-document" data-id="evidence"><b>Findings Evidence (ZIP)</b><span>8.7 MB</span></button>' +
          '<button data-act="service-report-document" data-id="supporting"><b>Supporting Documents</b><span>4 files</span></button>' +
        '</div>' +
      '</section>' +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderHistoryTab(meta) {
  return '<div class="sp-report-layout">' +
    '<main class="sp-report-main">' +
      '<section class="sp-report-panel">' +
        '<h2>History</h2>' +
        '<table class="sp-report-table"><thead><tr><th>Date</th><th>Activity</th><th>Owner</th></tr></thead><tbody>' +
          '<tr><td>16 Jun 2026 10:15</td><td>Final report sent to Service Provider.</td><td>Department Manager</td></tr>' +
          '<tr><td>16 Jun 2026 10:15</td><td>Department Manager reviewed and approved the report.</td><td>Mehmet Kaya</td></tr>' +
          '<tr><td>15 Jun 2026</td><td>Lead Inspector finalized the report package.</td><td>Aylin Sezer</td></tr>' +
          '<tr><td>14 Jun 2026</td><td>AVSEC inspection completed.</td><td>Inspection team</td></tr>' +
        '</tbody></table>' +
      '</section>' +
    '</main>' +
    serviceProviderSidePanel(meta) +
  '</div>';
}

function serviceProviderReportBody(meta, ui) {
  if (ui.tab === 'overview') return serviceProviderOverviewTab(meta, ui);
  if (ui.tab === 'findings') return serviceProviderFindingsTab(meta, ui);
  if (ui.tab === 'communications') return serviceProviderCommunicationsTab(meta, ui);
  if (ui.tab === 'attachments') return serviceProviderAttachmentsTab(meta, ui);
  if (ui.tab === 'history') return serviceProviderHistoryTab(meta, ui);
  return serviceProviderCapTab(meta, ui);
}

function viewServiceProviderFinalReport() {
  var ui = serviceProviderReportUiState();
  var meta = serviceProviderFinalReportMeta();
  return '<div class="sp-report-page">' +
    serviceProviderReportHeader(meta, ui) +
    serviceProviderReportTabs(ui) +
    serviceProviderReportBody(meta, ui) +
  '</div>';
}

function inspectorPastReportItemFromFinding(finding) {
  return {
    id: finding.id + '-closure-report',
    type: 'Report',
    title: finding.title,
    subtitle: finding.id + ' · ' + SEVERITY[finding.severity].label,
    organization: orgName(finding.orgId),
    priority: workItemPriority('Closed', 'ok', 80),
    lifecycle: 'Past closure report',
    owner: '—',
    nextAction: 'View only — historical report',
    dueText: finding.closedDate ? 'Closed ' + fmtDate(finding.closedDate) : 'Closed',
    statusHtml: demoBadge('Closed', 'ok'),
    primaryAction: { label: 'View report', action: 'nav', view: 'report', cls: 'btn' },
    route: { view: 'report', id: finding.id },
    children: []
  };
}

function viewAdminReportCatalog() {
  var catalog = [
    ['Closure Report', 'Finding closure package', 'Finding, CAP, accepted evidence, closure basis', 'Published template'],
    ['Audit Report Approval', 'Preliminary and final report package', 'Audit scope, findings, CAP summary, approval route', 'Governance package'],
    ['Oversight Health Summary', 'Management indicator report', 'Risk drivers, overdue work, workload signal', 'Management indicator only']
  ];
  var rows = catalog.map(function (item, idx) {
    return '<div class="configuration-list-item' + (idx === 0 ? ' is-selected' : '') + '">' +
      '<span><b>' + esc(item[0]) + '</b><small>' + esc(item[1]) + '</small></span>' +
      demoBadge(item[3], idx === 0 ? 'ok' : 'info') +
    '</div>';
  }).join('');
  return pageHead('Report Catalog', 'Configure which mock report packages are visible in the demo.') +
    guardrailStrip([
      { label: 'Mock report catalog' },
      { label: 'No real reporting engine', tone: 'warn' }
    ]) +
    '<div class="configuration-studio report-catalog-studio">' +
      '<aside class="configuration-studio__list">' +
        '<div class="configuration-search"><label>Search reports</label><input type="search" value="" placeholder="Closure, audit approval, health"></div>' +
        '<div class="configuration-list">' + rows + '</div>' +
      '</aside>' +
      '<main class="configuration-studio__preview">' +
        '<div class="selected-question-preview">' +
          '<div class="configuration-preview-head"><div><span>Selected Report Package</span><h2>Closure Report</h2></div>' + demoBadge('Published template', 'ok') + '</div>' +
          '<p>Preview-only report definition for a closed finding package. It references the finding, CAP, evidence versions, CAA review result, and closure basis.</p>' +
          '<div class="decision-bar decision-bar--configuration">' +
            commandMetric('Current owner', 'Admin Preview', 'info') +
            commandMetric('Next action', 'Review package fields', 'warn') +
            commandMetric('Demo boundary', 'No real PDF engine or storage', 'neutral') +
          '</div>' +
          '<div class="reg-trace reg-trace--compact configuration-trace">' +
            '<div class="reg-trace__head"><span class="reg-trace__mark">Package fields</span>' + demoBadge('Mock configuration', 'neutral') + '</div>' +
            '<div class="reg-trace__grid">' +
              '<div><span>Source record</span><b>Finding</b></div>' +
              '<div><span>Lifecycle</span><b>Finding -> CAP -> Evidence -> CAA Review -> Closure</b></div>' +
              '<div><span>Expected evidence preview</span><b>Accepted evidence versions and review result</b></div>' +
              '<div><span>Regulatory reference</span><b>Finding basis / configured rule reference</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</main>' +
    '</div>';
}

function viewReports() {
  if (state.role === 'auditee') {
    var reportFilter = state.params && state.params.filter ? state.params.filter : selectedFilter('reports', 'received');
    if (reportFilter === 'documents') return viewServiceProviderDocuments();
    return viewServiceProviderFinalReports();
  }
  if (state.role === 'admin') return viewAdminReportCatalog();
  var closed = visibleFindings().filter(function (f) { return f.status === 'CLOSED'; });
  if (state.role === 'inspector') {
    var pastReports = closed.map(inspectorPastReportItemFromFinding).sort(workItemSort);
    return pageHead('Reports', 'Past closure reports (view only).') +
      '<h2 class="section-heading">Past Reports</h2>' +
      renderOpsTable(pastReports, {
        includeChildren: false,
        empty: 'No past reports are available yet.'
      });
  }
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
      '<div class="report__head">' + renderBrandMark('brand-mark--report') +
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
  var serviceUi = state.role === 'auditee' ? serviceProviderUiState().reportPreview : null;
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
    (serviceUi && serviceUi.messageSentAt ? '<div class="card mb-16"><div class="card__head"><h3>Latest message to CAA Inspector</h3>' + demoBadge('Sent in UI', 'ok') + '</div><div class="card__body"><p>' + esc(serviceUi.messageText) + '</p><span class="small muted">' + esc(serviceUi.messageSentAt) + ' · browser-local demo thread</span></div></div>' : '') +
    (rows ? '<div class="ops-table-wrap"><table class="ops-table"><thead><tr><th>Message</th><th>Organization</th><th>Date</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty">No incoming messages.</div>');
}

/* =========================== Admin — Templates =========================== */
function viewTemplates() {
  var rows = state.templateLibrary.map(function (t) {
    var open = t.id === 'TPL-CABIN-2026';
    var badge = t.status === 'Published' ? 'ok' : 'neutral';
    var itemLabel = typeof t.items === 'number' ? String(t.items) + ' items' : String(t.items);
    return '<tr class="' + (open ? 'row-click' : '') + '"' + (open ? ' data-act="nav" data-view="template-preview" data-id="' + t.id + '"' : '') + '>' +
      '<td><b>' + esc(t.name) + '</b></td><td>' + esc(t.domain) + '</td><td>' + esc(t.version) + '</td>' +
      '<td>' + esc(itemLabel) + '</td>' +
      '<td><span class="badge badge--' + badge + '"><span class="dot"></span>' + esc(t.status) + '</span></td>' +
      '<td style="text-align:right">' + (open ? '<button class="btn btn--sm" data-act="nav" data-view="template-preview" data-id="' + t.id + '">Preview</button>' : '<span class="muted small">—</span>') + '</td></tr>';
  }).join('');
  return pageHead('Checklist Templates', 'Which template or rule must be configured? (Preview only.)') +
    '<div class="callout mb-16">Admin can configure templates and rules. In this demo only the <b>Cabin Inspection</b> template is openable for preview.</div>' +
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
    '</div></div></div>' +
    '<div class="callout mb-16">Source workbook profile: 126 Cabin Inspection rows across 6 sections. This demo runs a curated 6-question subset; the source workbook remains a mock/configured checklist reference, not a live import or legal source.</div>' +
    table;
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
        '<input type="text" id="cap-resp" placeholder="Name or role" value="Cabin Maintenance Lead"></div>' +
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
    'Expected: proof the PBE serviceability issue was corrected and the cabin defect record was closed or controlled.</div>' +
    '<div class="form-row"><label>Evidence file <span class="req">*</span></label>' +
      '<div class="filebox" data-act="mock-pick" data-target="ev-file"><div class="filebox__icon">📄</div>' +
      '<div>Click to select a file (mock)</div><div class="filebox__hint">Suggested: Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf</div></div>' +
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
  var nextId = 'CAB-2026-' + String(state.findingSeq).padStart(3, '0');
  var itemSeverity = item && item.severity !== undefined ? item.severity : 1;
  var isPbeHero = qId === 'cab-em-eq-pbe';
  var body =
    '<div class="modal__intro">A finding will be created from the Non-Compliant checklist item. Organization, audit and reference are prefilled.</div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>Finding ID</label><input type="text" id="fd-id" value="' + esc(nextId) + '" readonly></div>' +
      '<div class="form-row"><label>Organization</label><input type="text" value="' + esc(orgName(a.orgId)) + '" readonly></div>' +
    '</div>' +
    '<div class="form-row"><label>Title <span class="req">*</span></label>' +
      '<input type="text" id="fd-title" value="' + esc(isPbeHero ? 'PBE not serviceable or not accessible in cabin emergency equipment check' : 'Cabin inspection checklist non-compliance') + '"></div>' +
    '<div class="form-row"><label>Description <span class="req">*</span></label>' +
      '<textarea id="fd-desc">' + esc(isPbeHero ? 'The inspected PBE position could not be confirmed as serviceable and accessible during the cabin emergency equipment check.' : 'A cabin inspection checklist item was marked Non-Compliant during the audit.') + '</textarea></div>' +
    '<div class="form-2col">' +
      '<div class="form-row"><label>Severity</label><select id="fd-sev">' +
        '<option value="1"' + (itemSeverity === 1 ? ' selected' : '') + '>Level 1 Critical</option>' +
        '<option value="2"' + (itemSeverity === 2 ? ' selected' : '') + '>Level 2 Major</option>' +
        '<option value="3"' + (itemSeverity === 3 ? ' selected' : '') + '>Level 3 Minor</option>' +
        '<option value="0"' + (itemSeverity === 0 ? ' selected' : '') + '>Observation</option></select></div>' +
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
      '<div class="form-row"><label>Location <span class="req">*</span></label><input type="text" id="wz-loc" value="' + esc(w.location || '') + '" placeholder="e.g. Fly Namibia HQ"></div>';
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
      '</select><div class="help">Only the Cabin Inspection template is runnable in this demo.</div></div>' +
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
