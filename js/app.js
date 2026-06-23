/* ==========================================================================
   AviaSurveil360 — App controller (routing, role switch, actions)
   ========================================================================== */

/* Navigation per role: task-first, no heavy enterprise menus. */
var NAV = {
  manager: [
    { view: 'dashboard', label: 'Dashboard', icon: '📊' },
    { view: 'safety-intelligence', label: 'Safety Intelligence', icon: '⌁' },
    { view: 'org-risk', label: 'Org Risk Profile', icon: '◇', id: 'ORG-XYZ' },
    { view: 'usoap-readiness', label: 'USOAP Readiness', icon: '◎' },
    { view: 'cap-effectiveness', label: 'CAP Effectiveness', icon: '✓' },
    { view: 'ssp-nasp', label: 'SSP/NASP', icon: '▣' },
    { view: 'calendar',  label: 'Surveillance Plan', icon: '🗓️' },
    { view: 'findings',  label: 'Findings', icon: '⚑' },
    { view: 'organizations', label: 'Organizations', icon: '🏢' },
    { view: 'reports',   label: 'Reports', icon: '📄' }
  ],
  inspector: [
    { view: 'dashboard', label: 'Dashboard', icon: '📊' },
    { view: 'package-builder', label: 'Package Builder', icon: '▤' },
    { view: 'offline-field', label: 'Offline Field', icon: '⇄' },
    { view: 'ai-assistant', label: 'AI Assistant', icon: '✦' },
    { view: 'cap-effectiveness', label: 'CAP Effectiveness', icon: '✓' },
    { view: 'calendar',  label: 'Audit Plan', icon: '🗓️' },
    { view: 'findings',  label: 'Findings', icon: '⚑' },
    { view: 'organizations', label: 'Organizations', icon: '🏢' },
    { view: 'reports',   label: 'Reports', icon: '📄' }
  ],
  auditee: [
    { view: 'my-findings', label: 'My Findings', icon: '⚑' },
    { view: 'messages',    label: 'Messages', icon: '📨' },
    { view: 'reports',     label: 'Reports', icon: '📄' }
  ],
  admin: [
    { view: 'regulatory-library', label: 'Regulatory Library', icon: '§' },
    { view: 'templates', label: 'Templates', icon: '🗂️' },
    { view: 'package-builder', label: 'Package Builder', icon: '▤' },
    { view: 'users',     label: 'Users', icon: '👥' },
    { view: 'settings',  label: 'Settings', icon: '⚙️' },
    { view: 'auditlog',  label: 'Audit Log', icon: '📜' }
  ]
};

var VIEW_TITLES = {
  dashboard: 'Dashboard', calendar: 'Audit Plan', findings: 'Findings', 'my-findings': 'My Findings',
  reports: 'Reports', report: 'Report', messages: 'Messages', templates: 'Templates',
  'template-preview': 'Template Preview', auditlog: 'Audit Log', 'audit-detail': 'Audit Detail',
  checklist: 'Checklist Runner', finding: 'Finding Detail', wizard: 'New Audit Wizard',
  organizations: 'Organizations', 'org-detail': 'Organization', users: 'Users', settings: 'Settings',
  'safety-intelligence': 'Safety Intelligence', 'org-risk': 'Organization Risk Profile',
  'regulatory-library': 'Regulatory Library', 'package-builder': 'Inspection Package Builder',
  'offline-field': 'Offline Field Inspection', 'usoap-readiness': 'USOAP Readiness',
  'cap-effectiveness': 'CAP Effectiveness', 'ai-assistant': 'AI Inspector Assistant',
  'ssp-nasp': 'SSP/NASP Management'
};

var ROLE_DESC = {
  manager: 'Oversight, risk and the 2026 surveillance plan.',
  inspector: 'Run audits, complete checklists, review CAP and evidence.',
  auditee: 'Airline XYZ portal — respond to what the CAA needs.',
  admin: 'Preview checklist templates and the audit log.'
};
var ROLE_ICON = { manager: '📊', inspector: '✈️', auditee: '🏢', admin: '⚙️' };

/* Temporary "picked file" names for mock uploads. */
var pickedFiles = {};

function homeView(role) {
  if (role === 'auditee') return 'my-findings';
  if (role === 'admin') return 'templates';
  return 'dashboard';
}

/* ----------------------------- Render ----------------------------- */
function render() {
  var root = document.getElementById('app-root');
  if (!state.role) { root.innerHTML = renderLogin(); return; }

  var nav = NAV[state.role] || [];
  var navHtml = nav.map(function (n) {
    var active = isNavActive(n.view) ? ' active' : '';
    var badge = navBadge(n.view);
    var navId = n.id ? ' data-id="' + esc(n.id) + '"' : '';
    return '<button class="nav-item' + active + '" data-act="nav" data-view="' + n.view + '"' + navId + '>' +
      '<span class="nav-item__icon">' + n.icon + '</span><span>' + esc(n.label) + '</span>' +
      (badge ? '<span class="nav-item__badge">' + badge + '</span>' : '') + '</button>';
  }).join('');

  var r = ROLES[state.role];
  var unread = unreadCount(state.role);

  var roleOptions = ['manager', 'inspector', 'auditee', 'admin'].map(function (k) {
    return '<option value="' + k + '"' + (k === state.role ? ' selected' : '') + '>' + esc(ROLES[k].name) +
      (k === 'auditee' ? ' — Airline XYZ' : '') + '</option>';
  }).join('');

  var notifPanel = state.ui.notifOpen ? renderNotifPanel() : '';

  root.innerHTML =
    '<div class="shell' + (state.ui.menuOpen ? ' menu-open' : '') + '">' +
      '<div class="sidebar-backdrop" data-act="toggle-menu"></div>' +
      '<aside class="sidebar">' +
        '<div class="sidebar__brand"><div class="sidebar__logo">A360</div>' +
          '<div class="sidebar__brandtext"><b>AviaSurveil360</b><span>OVERSIGHT WORKBENCH</span></div></div>' +
        '<nav class="sidebar__nav"><div class="nav-section">' + esc(r.name) + '</div>' + navHtml + '</nav>' +
        '<div class="sidebar__foot"><button class="nav-item" data-act="logout">' +
          '<span class="nav-item__icon">⤺</span><span>Role select</span></button>' +
          '<div style="padding:8px 11px">Demo data · frontend-only · saved in this browser</div></div>' +
      '</aside>' +
      '<div class="main">' +
        '<header class="topbar">' +
          '<button class="topbar__menu" data-act="toggle-menu" aria-label="Open menu">☰</button>' +
          '<div class="topbar__crumbs">' + crumbs() + '</div>' +
          '<div class="topbar__spacer"></div>' +
          '<div class="role-switch"><span class="role-switch__label">View as</span>' +
            '<select id="role-select">' + roleOptions + '</select></div>' +
          '<div style="position:relative">' +
            '<button class="iconbtn" data-act="notif-toggle" aria-label="Notifications">🔔' +
              (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
            notifPanel +
          '</div>' +
          '<div class="who"><div class="who__avatar" style="background:' + r.color + '">' + esc(r.initials) + '</div>' +
            '<div><div class="who__name">' + esc(r.user) + '</div><div class="who__role">' + esc(r.name) +
            (state.role === 'auditee' ? ' · Airline XYZ' : '') + '</div></div></div>' +
        '</header>' +
        '<main class="content">' + renderContent() + '</main>' +
      '</div>' +
    '</div>';

  window.scrollTo(0, 0);
}

function isNavActive(view) {
  if (view === state.view) return true;
  // keep parent nav highlighted on detail screens
  if (view === 'calendar' && (state.view === 'audit-detail' || state.view === 'checklist')) return true;
  if (view === 'findings' && state.view === 'finding' && state.role !== 'auditee') return true;
  if (view === 'my-findings' && state.view === 'finding' && state.role === 'auditee') return true;
  if (view === 'reports' && state.view === 'report') return true;
  if (view === 'templates' && state.view === 'template-preview') return true;
  if (view === 'organizations' && state.view === 'org-detail') return true;
  if (view === 'org-risk' && state.view === 'org-risk') return true;
  return false;
}

function navBadge(view) {
  var f = visibleFindings();
  if (state.role === 'manager' && view === 'findings') {
    var n = f.filter(function (x) { return dueInfo(x).overdue; }).length;
    return n || '';
  }
  if (state.role === 'inspector' && view === 'findings') {
    var n2 = f.filter(function (x) { return x.status === 'CAP_SUBMITTED' || x.status === 'EVIDENCE_SUBMITTED'; }).length;
    return n2 || '';
  }
  if (state.role === 'auditee' && view === 'my-findings') {
    var n3 = f.filter(function (x) {
      return x.status === 'WAITING_CAP' || x.status === 'CAP_MORE_INFO' ||
             x.status === 'EVIDENCE_REQUIRED' || x.status === 'EVIDENCE_MORE_INFO';
    }).length;
    return n3 || '';
  }
  return '';
}

function crumbs() {
  var homeLabel = VIEW_TITLES[homeView(state.role)] || 'Home';
  var cur = VIEW_TITLES[state.view] || '';
  var extra = '';
  if (state.view === 'audit-detail' || state.view === 'checklist') {
    var a = auditById(state.params.auditId); if (a) extra = ' · ' + a.id;
  }
  if (state.view === 'finding' || state.view === 'report') {
    if (state.params.findingId) extra = ' · ' + state.params.findingId;
  }
  if (state.view === homeView(state.role)) return '<b>' + esc(homeLabel) + '</b>';
  return esc(homeLabel) + ' › <b>' + esc(cur) + esc(extra) + '</b>';
}

function renderContent() {
  switch (state.view) {
    case 'dashboard': return state.role === 'manager' ? viewManagerDashboard() : viewInspectorDashboard();
    case 'safety-intelligence': return viewSafetyIntelligenceDashboard();
    case 'org-risk': return viewOrganizationRiskProfile();
    case 'regulatory-library': return viewRegulatoryLibrary();
    case 'package-builder': return viewInspectionPackageBuilder();
    case 'offline-field': return viewOfflineFieldInspection();
    case 'usoap-readiness': return viewUsoapReadiness();
    case 'cap-effectiveness': return viewCapEffectiveness();
    case 'ai-assistant': return viewAiAssistant();
    case 'ssp-nasp': return viewSspNaspDashboard();
    case 'calendar': return viewCalendar();
    case 'audit-detail': return viewAuditDetail();
    case 'checklist': return viewChecklistRunner();
    case 'finding': return viewFinding();
    case 'findings': return viewFindings();
    case 'my-findings': return viewAuditeeMyFindings();
    case 'reports': return viewReports();
    case 'report': return viewReport();
    case 'messages': return viewMessages();
    case 'templates': return viewTemplates();
    case 'template-preview': return viewTemplatePreview();
    case 'auditlog': return viewAuditLog();
    case 'wizard': return viewAuditWizard();
    case 'organizations': return viewOrganizations();
    case 'org-detail': return viewOrgDetail();
    case 'users': return viewUsers();
    case 'settings': return viewSettings();
    default: return state.role === 'manager' ? viewManagerDashboard() : viewInspectorDashboard();
  }
}

function renderLogin() {
  var cards = ['manager', 'inspector', 'auditee', 'admin'].map(function (k) {
    var r = ROLES[k];
    return '<button class="role-card" data-act="role" data-role="' + k + '">' +
      '<div class="role-card__icon" style="background:' + r.color + '">' + ROLE_ICON[k] + '</div>' +
      '<div><div class="role-card__name">' + esc(r.name) + (k === 'auditee' ? ' — Airline XYZ' : '') + '</div>' +
      '<div class="role-card__desc">' + esc(ROLE_DESC[k]) + '</div>' +
      '<div class="role-card__q">“' + esc(r.question) + '”</div></div></button>';
  }).join('');
  return '<div class="login"><div class="login__card">' +
    '<div class="login__head"><div class="login__brand"><div class="login__logo">A360</div>' +
      '<div><div class="login__title">AviaSurveil360</div>' +
      '<div class="login__sub">Civil Aviation Authority surveillance &amp; oversight — clickable demo</div></div></div></div>' +
    '<div class="login__body"><div class="login__prompt">Choose a role to enter the demo. You can switch roles at any time from the top bar.</div>' +
      '<div class="role-grid">' + cards + '</div>' +
      '<div class="login__foot">Demo scenario: a CAA Inspector raises <b>Finding OPS-2026-001</b> for Airline XYZ from a Flight Operations checklist. ' +
      'The auditee submits a CAP and evidence; the inspector reviews and closes the finding; the manager dashboard updates. ' +
      'This is a mock prototype — no real authentication, backend, database or integrations. V2 demo actions are saved only in this browser.</div>' +
    '</div></div></div>';
}

function renderNotifPanel() {
  var list = state.notifications.filter(function (n) { return n.role === state.role; });
  var rows = list.length ? list.map(function (n) {
    return '<div class="notif-item ' + (n.unread ? 'unread' : '') + '"><div class="notif-item__icon">' + n.icon + '</div>' +
      '<div><div class="notif-item__txt">' + esc(n.text) + '</div><div class="notif-item__time">' + esc(n.time) + '</div></div></div>';
  }).join('') : '<div class="empty">No notifications.</div>';
  return '<div class="notif-panel"><div class="notif-panel__head">Notifications</div>' + rows + '</div>';
}

/* ----------------------------- Navigation ----------------------------- */
function go(view, opts) {
  opts = opts || {};
  state.view = view;
  if (opts.auditId !== undefined && opts.auditId !== null && opts.auditId !== '') state.params.auditId = opts.auditId;
  if (opts.findingId !== undefined && opts.findingId !== null && opts.findingId !== '') state.params.findingId = opts.findingId;
  if (opts.orgId !== undefined && opts.orgId !== null && opts.orgId !== '') state.params.orgId = opts.orgId;
  if (view === 'org-risk' && !state.params.orgId) state.params.orgId = 'ORG-XYZ';
  if (opts.filter) {
    if (!state.selectedFilters) state.selectedFilters = {};
    state.selectedFilters[view] = opts.filter;
    if (view === 'findings') state.selectedFilters.findings = opts.filter;
  }
  state.params.filter = opts.filter || selectedFilter(view, view === 'findings' ? selectedFilter('findings', 'all') : null);
  state.ui.notifOpen = false;
  state.ui.menuOpen = false;
  closeModal();
  persistAfterAction();
  render();
}

function setRole(roleKey) {
  if (!ROLES[roleKey]) return;
  state.role = roleKey;
  state.params = {};
  state.ui.notifOpen = false;
  state.ui.menuOpen = false;
  state.view = homeView(roleKey);
  closeModal();
  persistAfterAction();
  render();
}

/* ----------------------------- Modals ----------------------------- */
function openModal(html) {
  var host = document.getElementById('modal-host');
  host.innerHTML = html;
  host.hidden = false;
}
function closeModal() {
  var host = document.getElementById('modal-host');
  host.hidden = true;
  host.innerHTML = '';
}

/* ----------------------------- Mock file pick ----------------------------- */
function mockPick(targetId) {
  var defaults = {
    'ev-file': { name: 'Training_Record_Updated.pdf', size: '1.6 MB' },
    'cap-file': { name: 'CAP_Supporting_Notes.pdf', size: '0.9 MB' }
  };
  var d = defaults[targetId] || { name: 'Document.pdf', size: '1.0 MB' };
  pickedFiles[targetId] = d;
  var box = document.getElementById(targetId);
  if (box) {
    box.innerHTML = '<div class="filechip"><div class="filechip__icon">PDF</div>' +
      '<div style="flex:1"><div class="filechip__name">' + esc(d.name) + '</div>' +
      '<div class="filechip__meta">' + esc(d.size) + ' · selected (mock — not uploaded)</div></div>' +
      '<span class="badge badge--info"><span class="dot"></span>Ready</span></div>';
  }
}

function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

/* ----------------------------- Action dispatch ----------------------------- */
function handleAction(act, el) {
  var id = el.getAttribute('data-id');
  var view = el.getAttribute('data-view');
  var filter = el.getAttribute('data-filter');
  var q = el.getAttribute('data-q');

  switch (act) {
    case 'role': setRole(el.getAttribute('data-role')); break;
    case 'logout': state.role = null; state.view = 'login'; state.ui.notifOpen = false; state.ui.menuOpen = false; closeModal(); persistAfterAction(); render(); break;
    case 'nav': go(view, { auditId: id, findingId: id, orgId: id, filter: filter }); break;
    case 'toggle-menu': state.ui.menuOpen = !state.ui.menuOpen; render(); break;
    case 'set-filter': setSelectedFilter(el.getAttribute('data-key'), el.getAttribute('data-val')); render(); break;

    case 'notif-toggle':
      state.ui.notifOpen = !state.ui.notifOpen;
      if (state.ui.notifOpen) {
        state.notifications.forEach(function (n) { if (n.role === state.role) n.unread = false; });
      }
      persistAfterAction();
      render();
      break;

    case 'start-checklist': startChecklist(id); break;
    case 'answer': answerItem(q, el.getAttribute('data-val')); break;
    case 'create-finding': openModal(modalFindingForm(id, q)); break;
    case 'issue-finding': issueFinding(id, q); break;

    case 'open': go('finding', { findingId: id }); break;
    case 'report': go('report', { findingId: id }); break;

    case 'cap': openModal(modalCapForm(findingById(id))); break;
    case 'submit-cap': submitCap(id); break;
    case 'evidence': openModal(modalEvidence(findingById(id))); break;
    case 'submit-evidence': submitEvidence(id); break;

    case 'reviewcap': openModal(modalReviewCap(findingById(id))); break;
    case 'cap-decision': capDecision(id, el.getAttribute('data-decision')); break;
    case 'reviewev': openModal(modalReviewEvidence(findingById(id))); break;
    case 'ev-decision': evDecision(id, el.getAttribute('data-decision')); break;

    case 'authclose': openModal(modalAuthorizedClosure(findingById(id))); break;
    case 'do-authclose': doAuthorizedClosure(id); break;
    case 'send-reminder': sendReminder(id); break;

    case 'new-audit': startWizard(); break;
    case 'wizard-next': wizardNext(); break;
    case 'wizard-back': wizardBack(); break;
    case 'wizard-create': wizardCreate(); break;

    case 'toggle-offline': toggleSimulatedOffline(); break;
    case 'offline-field-action': createOfflineFieldAction(); break;
    case 'sync-outbox': syncOfflineOutbox(true); render(); break;
    case 'ai-decision': recordAiDecision(id, el.getAttribute('data-decision')); break;

    case 'mock-pick': mockPick(el.getAttribute('data-target')); break;
    case 'mock-export': toast('Export simulated', 'A PDF would be generated here. This demo only previews the report.', 'ok'); break;
    case 'close-modal': closeModal(); break;
    default: break;
  }
}

/* ----------------------------- Mutations ----------------------------- */
function startChecklist(auditId) {
  var a = auditById(auditId);
  if (!a) return;
  a.checklistStarted = true;
  if (a.status === 'Scheduled' || a.status === 'Planned') a.status = 'In Progress';
  addLog('Checklist started', a.id);
  persistAfterAction();
  go('checklist', { auditId: auditId });
}

function answerItem(q, valx) {
  if (!state.checklistAnswers[q]) state.checklistAnswers[q] = {};
  state.checklistAnswers[q].answer = valx;
  persistAfterAction();
  render();
}

function issueFinding(auditId, q) {
  var a = auditById(auditId);
  var item = null;
  for (var i = 0; i < state.checklist.items.length; i++) if (state.checklist.items[i].id === q) item = state.checklist.items[i];
  var id = 'OPS-2026-' + String(state.findingSeq).padStart(3, '0');

  var internalNote = val('fd-internal');
  var trace = regulatoryTraceForQuestion(q);
  var finding = {
    id: id,
    title: val('fd-title') || 'Checklist non-compliance',
    description: val('fd-desc') || '',
    orgId: a.orgId,
    auditId: a.id,
    severity: parseInt(val('fd-sev') || '2', 10),
    reference: (item ? item.ref : 'Configured rule (regulatory reference)'),
    traceId: trace ? trace.id : null,
    basis: 'Checklist item answered Non-Compliant',
    status: 'WAITING_CAP',
    capRequired: true,
    evidenceRequired: true,
    issuedDate: DEMO_TODAY,
    dueDate: val('fd-due') || '2026-07-15',
    closedDate: null,
    closureType: null,
    responsiblePerson: '',
    cap: null,
    capRevisions: [],
    evidence: [],
    commentsToAuditee: [],
    internalNotes: internalNote ? [{ author: currentActorLabel(), date: DEMO_TODAY, text: internalNote }] : []
  };
  state.findings.push(finding);
  state.findingSeq++;
  if (!state.checklistAnswers[q]) state.checklistAnswers[q] = { answer: 'noncompliant' };
  state.checklistAnswers[q].findingId = id;

  if (a.status === 'Scheduled' || a.status === 'Planned') a.status = 'In Progress';

  addLog('Finding issued', id);
  pushNotification('auditee', '⚑', 'New finding ' + id + ' was issued to ' + orgName(a.orgId) + '. A CAP is required.');
  pushNotification('manager', '⚑', 'Finding ' + id + ' (' + SEVERITY[finding.severity].label + ') issued for ' + orgName(a.orgId) + '.');
  closeModal();
  toast('Finding issued', id + ' created and sent to the auditee.', 'ok');
  persistAfterAction();
  go('finding', { findingId: id });
}

function submitCap(id) {
  var f = findingById(id);
  if (!f) return;
  var root = val('cap-root'), corr = val('cap-corr'), prev = val('cap-prev'), resp = val('cap-resp'), date = val('cap-date');
  if (!root || !corr || !prev || !resp || !date) {
    toast('Missing information', 'Please complete root cause, corrective action, preventive action, responsible person and target date.', 'warn');
    return;
  }
  var revId = 'CAPREV-' + id + '-' + String((f.capRevisions ? f.capRevisions.length : 0) + 1);
  var capRecord = {
    id: revId,
    rootCause: root, correctiveAction: corr, preventiveAction: prev,
    responsible: resp, targetDate: date, submittedDate: DEMO_TODAY, status: 'Submitted'
  };
  f.cap = capRecord;
  if (!f.capRevisions) f.capRevisions = [];
  f.capRevisions.push({
    id: revId,
    findingId: id,
    status: V2_STATUS.pendingReview,
    submittedDate: DEMO_TODAY,
    targetDate: date,
    payloadSummary: 'Root cause, corrective action, preventive action and target date submitted.'
  });
  f.responsiblePerson = resp;
  f.status = 'CAP_SUBMITTED';
  pickedFiles['cap-file'] = null;
  addLog('CAP submitted', id);
  pushNotification('inspector', '📝', 'CAP submitted on ' + id + ' by ' + orgName(f.orgId) + ' — waiting for your review.');
  closeModal();
  toast('CAP submitted', 'Your corrective action plan was sent to the CAA for review.', 'ok');
  persistAfterAction();
  render();
}

function capDecision(id, decision) {
  var f = findingById(id);
  if (!f || !f.cap) return;
  var comment = val('cap-comment'), internal = val('cap-internal');
  if (comment) f.commentsToAuditee.push({ author: currentActorLabel(), date: DEMO_TODAY, text: comment });
  if (internal) f.internalNotes.push({ author: currentActorLabel(), date: DEMO_TODAY, text: internal });

  if (decision === 'accept') {
    f.cap.status = 'Accepted';
    if (f.capRevisions && f.capRevisions.length) f.capRevisions[f.capRevisions.length - 1].status = V2_STATUS.accepted;
    f.status = 'EVIDENCE_REQUIRED';
    addLog('CAP accepted', id);
    pushNotification('auditee', '✅', 'Your CAP for ' + id + ' was accepted. Please upload evidence that the action is complete.');
    closeModal();
    toast('CAP accepted', 'CAP accepted — but the finding stays open until evidence is accepted.', 'ok');
  } else {
    f.cap.status = 'More Information Requested';
    if (f.capRevisions && f.capRevisions.length) f.capRevisions[f.capRevisions.length - 1].status = 'more_information_requested';
    f.status = 'CAP_MORE_INFO';
    addLog('CAP — more information requested', id);
    pushNotification('auditee', '↩️', 'The CAA requested more information on your CAP for ' + id + '.');
    closeModal();
    toast('More information requested', 'The auditee has been asked to revise the CAP.', 'warn');
  }
  persistAfterAction();
  render();
}

function submitEvidence(id) {
  var f = findingById(id);
  if (!f) return;
  var file = pickedFiles['ev-file'];
  if (!file) { toast('No file selected', 'Please attach an evidence file (mock) before uploading.', 'warn'); return; }
  var maxV = 0;
  f.evidence.forEach(function (e) { if (e.version > maxV) maxV = e.version; });
  var note = val('ev-note');
  var nextVersion = maxV + 1;
  f.evidence.push({
    id: 'EV-' + id + '-' + nextVersion, fileName: file.name, size: file.size, type: 'mock-file-name-only',
    uploadedDate: DEMO_TODAY, version: nextVersion, status: 'Uploaded', note: note
  });
  f.status = 'EVIDENCE_SUBMITTED';
  pickedFiles['ev-file'] = null;
  addLog('Evidence submitted', id);
  pushNotification('inspector', '📎', 'Evidence submitted on ' + id + ' by ' + orgName(f.orgId) + ' — waiting for your review.');
  closeModal();
  toast('Evidence uploaded', 'Your evidence was sent to the CAA for review (mock — file name only).', 'ok');
  persistAfterAction();
  render();
}

function evDecision(id, decision) {
  var f = findingById(id);
  if (!f) return;
  var comment = val('ev-comment'), internal = val('ev-internal');
  var latest = f.evidence.length ? f.evidence[f.evidence.length - 1] : null;
  if (comment) f.commentsToAuditee.push({ author: currentActorLabel(), date: DEMO_TODAY, text: comment });
  if (internal) f.internalNotes.push({ author: currentActorLabel(), date: DEMO_TODAY, text: internal });

  if (decision === 'accept') {
    if (latest) latest.status = 'Accepted';
    f.status = 'CLOSED';
    f.closedDate = DEMO_TODAY;
    f.closureType = 'evidence-accepted';
    addLog('Evidence accepted', id);
    addLog('Finding closed (evidence accepted)', id);
    pushNotification('auditee', '✅', 'Evidence accepted — finding ' + id + ' is now closed. Thank you.');
    pushNotification('manager', '✅', 'Finding ' + id + ' closed for ' + orgName(f.orgId) + '. Dashboard updated.');
    closeModal();
    toast('Finding closed', id + ' closed after evidence acceptance. Manager dashboard updated.', 'ok');
  } else {
    if (latest) latest.status = 'More Information Requested';
    f.status = 'EVIDENCE_MORE_INFO';
    addLog('Evidence — more information requested', id);
    pushNotification('auditee', '↩️', 'The CAA requested more evidence for ' + id + '.');
    closeModal();
    toast('More information requested', 'The auditee has been asked for additional evidence.', 'warn');
  }
  persistAfterAction();
  render();
}

function doAuthorizedClosure(id) {
  var f = findingById(id);
  if (!f) return;
  var reason = val('ac-reason');
  if (!reason) { toast('Reason required', 'Please enter a reason for the authorized closure.', 'warn'); return; }
  var comment = val('ac-comment'), internal = val('ac-internal');
  f.status = 'CLOSED';
  f.closedDate = DEMO_TODAY;
  f.closureType = 'authorized';
  if (comment) f.commentsToAuditee.push({ author: currentActorLabel(), date: DEMO_TODAY, text: comment });
  f.internalNotes.push({ author: currentActorLabel(), date: DEMO_TODAY, text: 'Authorized closure reason: ' + reason + (internal ? ' — ' + internal : '') });
  addLog('Finding closed (authorized closure)', id);
  pushNotification('auditee', '✅', 'Finding ' + id + ' has been closed by the CAA under an authorized closure decision.');
  pushNotification('manager', '⚖️', 'Finding ' + id + ' closed via authorized closure (recorded in the audit trail).');
  closeModal();
  toast('Finding closed', id + ' closed under an authorized closure decision (audit-logged).', 'ok');
  persistAfterAction();
  render();
}

function sendReminder(id) {
  var f = findingById(id);
  if (!f) return;
  var d = dueInfo(f);
  var when = d.overdue ? 'is overdue' : (d.label && d.label !== '—' ? d.label.toLowerCase() : 'is awaiting your response');
  pushNotification('auditee', '⏰', 'Reminder from the CAA: ' + id + ' — ' + nextActionLabel(f) + '. This finding ' + when + '.');
  addLog('Reminder sent to auditee', id);
  toast('Reminder sent', 'A traceable reminder was sent to ' + orgName(f.orgId) + ' (in-app — no email).', 'ok');
  persistAfterAction();
  render();
}

function queueOfflineAction(type, entityType, entityId, payload) {
  var outboxId = 'OUTBOX-' + String(state.outboxSeq++).padStart(3, '0');
  var item = {
    id: outboxId,
    type: type,
    entityType: entityType,
    entityId: entityId,
    payloadSummary: payload.payloadSummary,
    payload: payload,
    status: V2_STATUS.waitingForConnection,
    message: 'Internet unavailable - saved locally. It will sync automatically when connection returns.',
    createdAt: nowIsoDemo(),
    lastSyncAttempt: null,
    syncedAt: null
  };
  state.offlineOutbox.push(item);
  state.offline.lastMessage = item.message;
  addLog('Offline item saved locally (demo)', entityId || outboxId);
  persistAfterAction();
  return item;
}

function toggleSimulatedOffline() {
  if (!state.offline) state.offline = { simulated: false, lastMessage: null };
  state.offline.simulated = !state.offline.simulated;
  if (state.offline.simulated) {
    state.offline.lastMessage = 'Internet unavailable - saved locally. It will sync automatically when connection returns.';
    toast('Offline simulated', state.offline.lastMessage, 'warn');
    persistAfterAction();
    render();
    return;
  }
  state.offline.lastMessage = 'Simulated connection restored - waiting outbox items are marked synced to demo state.';
  syncOfflineOutbox(false);
  toast('Simulated online', 'Offline outbox items marked synced to demo state. This is not production sync.', 'ok');
  render();
}

function createOfflineFieldAction() {
  if (!state.offline || !state.offline.simulated) {
    toast('Turn on Simulate offline', 'Use the Simulate offline control first, then save the mock field action.', 'warn');
    return;
  }
  var auditId = state.fieldPackage.auditId;
  var payload = {
    auditId: auditId,
    findingId: 'OPS-2026-001',
    fileName: 'Training_Record_Field_Photo.jpg',
    note: 'Mock field note captured while offline. File name only; no file storage.',
    payloadSummary: 'Mock evidence filename and field note captured for ' + auditId + '.'
  };
  queueOfflineAction('field_evidence_note', 'audit', auditId, payload);
  toast('Saved locally', 'Internet unavailable - saved locally. It will sync automatically when connection returns.', 'warn');
  render();
}

function syncOfflineOutbox(showToast) {
  var changed = 0;
  (state.offlineOutbox || []).forEach(function (item) {
    if (item.status === V2_STATUS.waitingForConnection) {
      item.status = V2_STATUS.syncedToDemoState;
      item.lastSyncAttempt = nowIsoDemo();
      item.syncedAt = nowIsoDemo();
      changed++;
      addLog('Offline item synced (demo)', item.entityId || item.id, 'System (demo sync)');
    }
  });
  if (changed === 0 && showToast) {
    toast('Outbox already synced', 'No waiting simulated offline items were found.', 'info');
  }
  persistAfterAction();
  if (showToast && changed > 0) toast('Outbox synced', changed + ' item(s) marked synced to demo state.', 'ok');
}

function recordAiDecision(id, decision) {
  var s = aiSuggestionById(id);
  if (!s) return;
  var finalText = val('ai-edit-' + id) || s.draft;
  if (decision === V2_STATUS.edited && !finalText) {
    toast('Draft text required', 'Please keep or enter the edited AI draft before recording the decision.', 'warn');
    return;
  }
  s.status = decision;
  s.decision = {
    id: 'AIDEC-' + String(state.aiDecisionSeq++).padStart(3, '0'),
    suggestionId: id,
    status: decision,
    reviewer: currentActorLabel(),
    decidedAt: nowIsoDemo(),
    finalText: decision === V2_STATUS.rejected ? '' : finalText
  };
  addLog('AI suggestion ' + humanStatus(decision).toLowerCase() + ' (demo)', id);
  toast('AI decision recorded', 'Decision saved in this browser for demo only. Authorized review is still required.', 'ok');
  persistAfterAction();
  render();
}

/* ----------------------------- New Audit Wizard ----------------------------- */
function startWizard() {
  state.wizard = {
    step: 1,
    orgId: state.orgs[0].id,
    type: AUDIT_TYPES[0],
    domain: AUDIT_DOMAINS[0],
    date: '2026-12-10',
    mode: 'On-site',
    location: '',
    lead: INSPECTORS[0],
    team: [],
    templateId: 'TPL-FOPS-2026',
    scope: ''
  };
  go('wizard');
}

/* Read the inputs present for the current step into state.wizard. */
function wizardCapture() {
  var w = state.wizard; if (!w) return;
  if (document.getElementById('wz-org')) w.orgId = val('wz-org');
  if (document.getElementById('wz-type')) w.type = val('wz-type');
  if (document.getElementById('wz-domain')) w.domain = val('wz-domain');
  if (document.getElementById('wz-date')) w.date = val('wz-date');
  if (document.getElementById('wz-mode')) w.mode = val('wz-mode');
  if (document.getElementById('wz-loc')) w.location = val('wz-loc');
  if (document.getElementById('wz-lead')) w.lead = val('wz-lead');
  if (document.getElementById('wz-tpl')) w.templateId = val('wz-tpl');
  if (document.getElementById('wz-scope')) w.scope = val('wz-scope');
  var team = document.querySelectorAll('.wz-team');
  if (team.length) {
    w.team = [];
    team.forEach(function (c) { if (c.checked) w.team.push(c.value); });
  }
}

function wizardNext() {
  wizardCapture();
  var w = state.wizard;
  if (w.step === 2 && !w.location) { toast('Location required', 'Please enter a location for the audit.', 'warn'); return; }
  w.step = Math.min(5, w.step + 1);
  render();
}

function wizardBack() {
  wizardCapture();
  state.wizard.step = Math.max(1, state.wizard.step - 1);
  render();
}

function wizardCreate() {
  wizardCapture();
  var w = state.wizard;
  var id = 'AUD-2026-' + String(state.auditSeq).padStart(3, '0');
  var team = (w.team && w.team.length) ? w.team.slice() : [];
  if (team.indexOf(w.lead) === -1) team.unshift(w.lead);
  var audit = {
    id: id, ref: w.type, orgId: w.orgId, type: w.type, domain: w.domain,
    templateId: w.templateId, date: w.date, mode: w.mode, location: w.location || '—',
    lead: w.lead, team: team, status: 'Scheduled', checklistStarted: false
  };
  state.audits.push(audit);
  state.auditSeq++;
  state.wizard = null;
  addLog('Audit scheduled', id);
  pushNotification('manager', '🗓️', 'New audit ' + id + ' (' + audit.type + ' — ' + orgName(audit.orgId) + ') scheduled for ' + (function () { return fmtDate(audit.date); })() + '.');
  toast('Audit scheduled', id + ' added to the 2026 plan.', 'ok');
  persistAfterAction();
  go('audit-detail', { auditId: id });
}

/* ----------------------------- Global listeners ----------------------------- */
document.addEventListener('click', function (e) {
  // Close modal when clicking the dark backdrop
  if (e.target && e.target.id === 'modal-host') { closeModal(); return; }
  var el = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) {
    // clicking elsewhere closes an open notifications panel
    if (state && state.role && state.ui.notifOpen) { state.ui.notifOpen = false; render(); }
    return;
  }
  var act = el.getAttribute('data-act');
  e.preventDefault();
  handleAction(act, el);
});

document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'role-select') setRole(e.target.value);
});

document.getElementById('reset-demo').addEventListener('click', function () {
  clearDemoState();
  seedState();
  pickedFiles = {};
  render();
  toast('Demo reset', 'All browser-saved demo state was cleared and reset to the starting point.', 'ok');
});

/* ----------------------------- Boot ----------------------------- */
initializeState();
render();
