/* ==========================================================================
   AviaSurveil360 — App controller (routing, role switch, actions)
   ========================================================================== */

/* Navigation per role: three primary experiences with grouped IA. */
var NAV = {
  manager: [
    { section: 'Dashboard' },
    { view: 'dashboard', label: 'My Dashboard', icon: '▦' },
    { view: 'planning', label: 'Planning', icon: '▤' },
    { view: 'checklist-approvals', label: 'Checklist Approvals', icon: '▧' },
    { view: 'question-bank', label: 'Question Bank', icon: '□' },
    { view: 'checklist-builder', label: 'Checklist Builder', icon: '▧' },
    { view: 'checklist-versions', label: 'Version History', icon: '◷' },
    { view: 'audit-reports', label: 'Audit Reports', icon: '📄' },
    { view: 'safety-intelligence', label: 'Team Dashboard', icon: '⌁' },
    { view: 'ssp-nasp', label: 'Executive Dashboard', icon: '▣' },
    { section: 'Oversight' },
    { view: 'calendar', label: 'Audit Work Queue', icon: '▤' },
    { section: 'Organisations' },
    { view: 'organizations', label: 'Operators / Providers', icon: '🏢' },
    { view: 'org-risk', label: 'Risk Profiles', icon: '◇', id: 'ORG-XYZ' },
    { section: 'Findings & CAPs' },
    { view: 'findings', label: 'Open Findings', icon: '⚑', filter: 'open' },
    { view: 'findings', label: 'CAP Review Queue', icon: '✓', filter: 'capreview' },
    { view: 'cap-effectiveness', label: 'Repeat Findings', icon: '↻' },
    { section: 'USOAP / SSP' },
    { view: 'usoap-readiness', label: 'Protocol Questions', icon: '◎' },
    { view: 'ssp-nasp', label: 'SSP Indicators', icon: '▣' },
    { section: 'Analytics' },
    { view: 'safety-intelligence', label: 'Risk Trends', icon: '⌁' },
    { view: 'cap-effectiveness', label: 'CAP Effectiveness', icon: '✓' },
    { view: 'dashboard', label: 'Inspector Workload', icon: '▥' }
  ],
  inspector: [
    { view: 'dashboard', label: 'My Inspections', icon: '▣' },
    { view: 'findings', label: 'CAP Reviews', icon: '✓', filter: 'capreview' },
    { view: 'reports', label: 'Draft Reports', icon: '□' },
    { view: 'profile', label: 'Profile', icon: '○' }
  ],
  auditee: [
    { section: 'Service Provider Portal' },
    { view: 'my-findings', label: 'Findings & CAPs', icon: '⚑' },
    { view: 'my-findings', label: 'CAP Uploads', icon: '⇧' },
    { view: 'messages', label: 'CAA Responses', icon: '📨' },
    { view: 'reports', label: 'Documents Shared', icon: '📄' }
  ],
  admin: [
    { section: 'Regulations' },
    { view: 'regulatory-library', label: 'NAMCARS Library', icon: '§' },
    { view: 'regulatory-library', label: 'Regulatory Cross-Reference', icon: '⌘' },
    { view: 'templates', label: 'Checklist Builder', icon: '▧' },
    { view: 'question-bank', label: 'Question Bank', icon: '□' },
    { view: 'checklist-versions', label: 'Version History', icon: '◷' },
    { section: 'Evidence & Documents' },
    { view: 'templates', label: 'Templates', icon: '🗂️' },
    { view: 'reports', label: 'Reports', icon: '📄' },
    { section: 'Administration' },
    { view: 'users', label: 'Users / Roles', icon: '👥' },
    { view: 'settings', label: 'Configurations', icon: '⚙️' },
    { view: 'settings', label: 'Notification Rules', icon: '◌' },
    { view: 'organizations', label: 'Organisation Master Data', icon: '🏢' },
    { view: 'auditlog', label: 'Audit Log', icon: '📜' }
  ],
  /* Governance-expansion roles. Foundation nav points to existing demo screens;
     dedicated workspaces/approval queues arrive in later phases of
     docs/plans/2026-06-28-caa-governance-workflow-and-roles-plan.md. */
  leadInspector: [
    { section: 'Workspace' },
    { view: 'lead-review', label: 'Inspection Reports', icon: '▦' },
    { view: 'audit-reports', label: 'Audit Reports', icon: '📄' }
  ],
  gm: [
    { section: 'Approvals' },
    { view: 'planning', label: 'Planning', icon: '▤' },
    { view: 'checklist-approvals', label: 'Checklist Approvals', icon: '▧' },
    { view: 'audit-reports', label: 'Audit Reports', icon: '📄' },
    { section: 'Reports' },
    { view: 'reports', label: 'Reports', icon: '📄' }
  ],
  finance: [
    { section: 'Review' },
    { view: 'planning', label: 'Planning', icon: '▤' }
  ],
  executiveDirector: [
    { section: 'Workspace' },
    { view: 'planning', label: 'Planning', icon: '▤' },
    { view: 'audit-reports', label: 'Audit Reports', icon: '📄' },
    { view: 'reports', label: 'Reports', icon: '📄' }
  ]
};

var VIEW_TITLES = {
  dashboard: 'Dashboard', calendar: 'Audit Work Queue', findings: 'Findings', 'my-findings': 'My Findings',
  reports: 'Reports', report: 'Report', messages: 'Messages', templates: 'Templates',
  'template-preview': 'Template Preview', auditlog: 'Audit Log', 'audit-detail': 'Audit Detail',
  checklist: 'Checklist Runner', finding: 'Finding Detail', wizard: 'New Audit Wizard',
  organizations: 'Organizations', 'org-detail': 'Organization', users: 'Users', settings: 'Settings',
  'safety-intelligence': 'Safety Intelligence', 'org-risk': 'Organization Risk Profile',
  'regulatory-library': 'Regulatory Library', 'package-builder': 'Inspection Package Builder',
  'offline-field': 'Inspection Evidence', 'usoap-readiness': 'USOAP Readiness',
  'cap-effectiveness': 'CAP Effectiveness', 'ai-assistant': 'AI Inspector Assistant',
  'ssp-nasp': 'SSP/NASP Management', 'role-home': 'Home', planning: 'Planning', 'planning-approvals': 'Planning',
  'checklist-approvals': 'Checklist Approvals', 'question-bank': 'Question Bank',
  'checklist-builder': 'Checklist Builder', 'checklist-versions': 'Version History',
  'lead-review': 'Inspection Reports', 'planning-board': 'Planning',
  'audit-reports': 'Audit Reports'
};

var ROLE_DESC = {
  inspector: 'Inspector Workspace — daily operations, assigned packages, CAP review and field work.',
  leadInspector: 'Lead Inspector — checklist assignment, review, convert-to-finding and report sign-off.',
  manager: 'Department Manager — planning items, approvals, scheduling and department oversight.',
  gm: 'General Manager — planning and report approvals, budget routing and audit release.',
  finance: 'Finance Review — budget and resource review for planned audits.',
  executiveDirector: 'Executive Director — final approval of plans and audit reports.',
  auditee: 'Service Provider Portal — findings, CAP uploads, responses and shared documents.',
  admin: 'Administration — regulatory library, templates, users, configuration and audit log.'
};
var ROLE_ICON = {
  inspector: '✈️', leadInspector: '🧭', manager: '📊', gm: '🏛️',
  finance: '💷', executiveDirector: '🎖️', auditee: '🏢', admin: '⚙️'
};

var EXPERIENCE_LABEL = {
  inspector: 'Inspector Workspace',
  leadInspector: 'Lead Inspector',
  manager: 'Department Manager',
  gm: 'General Manager',
  finance: 'Finance Review',
  executiveDirector: 'Executive Director',
  auditee: 'Service Provider Portal',
  admin: 'Administration'
};

/* Display order for the role-select dropdown and the login role cards. */
var ROLE_ORDER = ['inspector', 'leadInspector', 'manager', 'gm', 'finance', 'executiveDirector', 'auditee', 'admin'];

/* Temporary "picked file" names for mock uploads. */
var pickedFiles = {};

function homeView(role) {
  if (role === 'auditee') return 'my-findings';
  if (role === 'admin') return 'templates';
  if (role === 'gm' || role === 'finance' || role === 'executiveDirector') return 'planning';
  if (role === 'leadInspector') return 'lead-review';
  return 'dashboard';
}

var INSPECTOR_RESTRICTED_VIEWS = {
  'checklist-approvals': true,
  'checklist-builder': true,
  'checklist-versions': true,
  'package-builder': true,
  'question-bank': true,
  'regulatory-library': true,
  'template-preview': true,
  templates: true
};

var LEAD_INSPECTOR_RESTRICTED_VIEWS = {
  calendar: true,
  planning: true,
  'planning-approvals': true,
  'planning-board': true,
  reports: true
};

function normalizeViewForRole() {
  if (state.role === 'inspector' && INSPECTOR_RESTRICTED_VIEWS[state.view]) {
    state.view = homeView(state.role);
    state.params = {};
  }
  if (state.role === 'leadInspector' && LEAD_INSPECTOR_RESTRICTED_VIEWS[state.view]) {
    state.view = homeView(state.role);
    state.params = {};
  }
}

/* ----------------------------- Render ----------------------------- */
function render() {
  var root = document.getElementById('app-root');
  if (document.body && document.body.classList) {
    document.body.classList.toggle('is-inspector-experience', state.role === 'inspector');
  }
  if (!state.role) { root.innerHTML = renderLogin(); return; }
  normalizeViewForRole();

  var nav = NAV[state.role] || [];
  var navHtml = nav.map(function (n) {
    if (n.section) return '<div class="nav-section">' + esc(n.section) + '</div>';
    var active = isNavActive(n.view) ? ' active' : '';
    var badge = navBadge(n.view);
    var navId = n.id ? ' data-id="' + esc(n.id) + '"' : '';
    var navFilter = n.filter ? ' data-filter="' + esc(n.filter) + '"' : '';
    return '<button class="nav-item' + active + '" data-act="nav" data-view="' + n.view + '"' + navId + navFilter + '>' +
      '<span class="nav-item__icon">' + n.icon + '</span><span>' + esc(n.label) + '</span>' +
      (badge ? '<span class="nav-item__badge">' + badge + '</span>' : '') + '</button>';
  }).join('');

  var r = ROLES[state.role];
  var unread = unreadCount(state.role);
  var inspectorChrome = state.role === 'inspector';

  var roleOptions = ROLE_ORDER.map(function (k) {
    return '<option value="' + k + '"' + (k === state.role ? ' selected' : '') + '>' + esc(EXPERIENCE_LABEL[k] || ROLES[k].name) +
      (k === 'auditee' ? ' — Airline XYZ' : '') + '</option>';
  }).join('');

  var notifPanel = state.ui.notifOpen ? renderNotifPanel() : '';

  root.innerHTML =
    '<div class="shell' + (state.ui.menuOpen ? ' menu-open' : '') + (inspectorChrome ? ' shell--inspector' : '') + '">' +
      '<div class="sidebar-backdrop" data-act="toggle-menu"></div>' +
      '<aside class="sidebar">' +
        (inspectorChrome ? '' : '<div class="sidebar__brand"><div class="sidebar__logo">A360</div>' +
          '<div class="sidebar__brandtext"><b>AviaSurveil360</b><span>OVERSIGHT WORKBENCH</span></div></div>') +
        '<nav class="sidebar__nav"><div class="experience-label">' + esc(EXPERIENCE_LABEL[state.role] || r.name) + '</div>' + navHtml + '</nav>' +
        '<div class="sidebar__foot"><button class="nav-item" data-act="logout">' +
          '<span class="nav-item__icon">⤺</span><span>' + (inspectorChrome ? 'Logout' : 'Role select') + '</span></button>' +
          (inspectorChrome ? '' : '<div style="padding:8px 11px">Demo data · frontend-only · saved in this browser</div>') + '</div>' +
      '</aside>' +
      '<div class="main">' +
        (inspectorChrome ? '' : '<header class="topbar">' +
          '<button class="topbar__menu" data-act="toggle-menu" aria-label="Open menu">☰</button>' +
          '<div class="topbar__crumbs">' + crumbs() + '</div>' +
          '<div class="topbar__spacer"></div>' +
          '<div class="role-switch"><span class="role-switch__label">Experience</span>' +
            '<select id="role-select">' + roleOptions + '</select></div>' +
          '<div style="position:relative">' +
            '<button class="iconbtn" data-act="notif-toggle" aria-label="Notifications">🔔' +
              (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
            notifPanel +
          '</div>' +
          '<div class="who"><div class="who__avatar" style="background:' + r.color + '">' + esc(r.initials) + '</div>' +
            '<div><div class="who__name">' + esc(r.user) + '</div><div class="who__role">' + esc(EXPERIENCE_LABEL[state.role] || r.name) +
            (state.role === 'auditee' ? ' · Airline XYZ' : '') + '</div></div></div>' +
        '</header>') +
        '<main class="content' + (inspectorChrome ? ' content--inspector' : '') + '">' + (inspectorChrome ? inspectorUserBar() : '') + renderContent() + '</main>' +
      '</div>' +
    '</div>';

  window.scrollTo(0, 0);
}

function isNavActive(view) {
  if (view === state.view) return true;
  if (view === 'planning' && (state.view === 'planning-approvals' || state.view === 'planning-board')) return true;
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
  if (view === 'calendar') {
    var queueAudits = typeof auditsForQueueScope === 'function' ? auditsForQueueScope() : state.audits;
    var a = queueAudits.filter(function (x) { return !isClosedAudit(x); }).length;
    return a || '';
  }
  if (state.role === 'manager' && view === 'findings') {
    var n = f.filter(function (x) { return dueInfo(x).overdue; }).length;
    return n || '';
  }
  if (state.role === 'inspector' && view === 'findings') {
    var n2 = f.filter(function (x) {
      return !dueInfo(x).overdue && (x.status === 'CAP_SUBMITTED' || x.status === 'EVIDENCE_SUBMITTED');
    }).length;
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
  if (state.role === 'inspector' && homeView(state.role) === 'dashboard') homeLabel = 'My Inspections';
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
    case 'planning': return viewPlanningWorkspace();
    case 'planning-approvals': return viewPlanningApprovals();
    case 'checklist-approvals': return viewChecklistApprovals();
    case 'question-bank': return viewQuestionBank();
    case 'checklist-builder': return viewChecklistBuilder();
    case 'checklist-versions': return viewChecklistVersions();
    case 'lead-review': return viewLeadReviewQueue();
    case 'planning-board': return viewPlanningBoard();
    case 'audit-reports': return viewAuditReportsApproval();
    case 'calendar': return viewCalendar();
    case 'audit-detail': return viewAuditDetail();
    case 'checklist': return viewChecklistRunner();
    case 'finding': return viewFinding();
    case 'findings': return viewFindings();
    case 'my-findings': return viewAuditeeMyFindings();
    case 'reports': return viewReports();
    case 'profile': return viewProfile();
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
    case 'role-home': return viewRoleHome();
    default: return state.role === 'manager' ? viewManagerDashboard() : viewInspectorDashboard();
  }
}

function renderLogin() {
  var cards = ROLE_ORDER.map(function (k) {
    var r = ROLES[k];
    return '<button class="role-card" data-act="role" data-role="' + k + '">' +
      '<div class="role-card__icon" style="background:' + r.color + '">' + ROLE_ICON[k] + '</div>' +
      '<div><div class="role-card__name">' + esc(EXPERIENCE_LABEL[k] || r.name) + (k === 'auditee' ? ' — Airline XYZ' : '') + '</div>' +
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

function inspectorUserBar() {
  var r = ROLES.inspector;
  return '<div class="inspector-userbar">' +
    '<button class="topbar__menu inspector-userbar__menu" data-act="toggle-menu" aria-label="Open menu">☰</button>' +
    '<button class="inspector-user" data-act="inspector-user-menu">' +
      '<span class="who__avatar" style="background:' + r.color + '">' + esc(r.initials) + '</span>' +
      '<span class="inspector-user__name">' + esc(r.user) + '</span>' +
      '<span class="inspector-user__chev">&#8964;</span>' +
    '</button>' +
  '</div>';
}

/* ----------------------------- Navigation ----------------------------- */
function go(view, opts) {
  opts = opts || {};
  state.view = view;
  if (opts.auditId !== undefined && opts.auditId !== null && opts.auditId !== '') state.params.auditId = opts.auditId;
  if (opts.findingId !== undefined && opts.findingId !== null && opts.findingId !== '') state.params.findingId = opts.findingId;
  if (opts.orgId !== undefined && opts.orgId !== null && opts.orgId !== '') state.params.orgId = opts.orgId;
  if (view === 'org-risk' && !state.params.orgId) state.params.orgId = 'ORG-XYZ';
  if (opts.tab) state.params.tab = opts.tab;
  else if (view !== 'planning' && view !== 'planning-approvals' && view !== 'planning-board') delete state.params.tab;
  if (opts.filter) {
    if (!state.selectedFilters) state.selectedFilters = {};
    state.selectedFilters[view] = opts.filter;
    if (view === 'findings') state.selectedFilters.findings = opts.filter;
  }
  var fallbackFilter = view === 'findings' ? selectedFilter('findings', 'all') : (view === 'calendar' ? 'active' : null);
  state.params.filter = opts.filter || fallbackFilter || selectedFilter(view, null);
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
  var tab = el.getAttribute('data-tab');
  var q = el.getAttribute('data-q');

  switch (act) {
    case 'role': setRole(el.getAttribute('data-role')); break;
    case 'logout': state.role = null; state.view = 'login'; state.ui.notifOpen = false; state.ui.menuOpen = false; closeModal(); persistAfterAction(); render(); break;
    case 'nav': go(view, { auditId: id, findingId: id, orgId: id, filter: filter, tab: tab }); break;
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
    case 'select-checklist-question': state.params.questionId = q; render(); break;
    case 'answer': answerItem(q, el.getAttribute('data-val')); break;
    case 'mock-checklist-evidence': handleMockChecklistEvidence(q); break;
    case 'create-potential': handleCreatePotentialFinding(id, q); break;
    case 'convert-potential': handleConvertPotentialFinding(id); break;
    case 'return-potential': handleReturnPotentialFinding(id); break;
    case 'dismiss-potential': handleDismissPotentialFinding(id); break;
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
    case 'approval-action': handleApprovalAction(id, el.getAttribute('data-decision')); break;
    case 'qb-create': handleCreateQuestionBankItem(); break;
    case 'checklist-draft': handleCreateChecklistDraft(); break;
    case 'checklist-add-question': handleAddQuestionToVersion(id, el.getAttribute('data-question')); break;
    case 'checklist-move-question': handleMoveChecklistQuestion(id, el.getAttribute('data-question'), el.getAttribute('data-direction')); break;
    case 'checklist-submit-version': handleSubmitChecklistVersion(id); break;
    case 'checklist-publish-version': handlePublishChecklistVersion(id); break;
    case 'planning-release': handlePlanningRelease(id); break;
    case 'planning-accept': handlePlanningAccept(id); break;
    case 'planning-assign-lead': handlePlanningAssignLead(id); break;
    case 'planning-propose-team': handlePlanningProposeTeam(id); break;
    case 'planning-confirm-prep': handlePlanningConfirmPrep(id); break;
    case 'report-approval': handleReportApproval(id, el.getAttribute('data-decision')); break;
    case 'inspection-status-cycle': handleInspectionStatusCycle(id); break;
    case 'inspection-download-checklist': handleInspectionDownload(id); break;
    case 'inspection-save-draft': handleInspectionSaveDraft(id); break;
    case 'inspection-submit-lead': handleInspectionSubmitLead(id); break;
    case 'inspection-section-preview': handleInspectionSectionPreview(id); break;
    case 'inspection-row-menu': toast('Row actions', 'Mock row actions would open attachment, comment, and finding options here.', 'info'); break;
    case 'inspector-user-menu': toast('Inspector profile', 'Profile menu is intentionally minimal in this demo workspace.', 'info'); break;

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

function setChecklistComment(q, comment) {
  if (!state.checklistAnswers[q]) state.checklistAnswers[q] = {};
  state.checklistAnswers[q].comment = comment || '';
  persistAfterAction();
}

function inspectionWorkspaceRow(rowId) {
  if (typeof INSPECTOR_EXECUTION_ITEMS === 'undefined') return null;
  return INSPECTOR_EXECUTION_ITEMS.filter(function (row) { return row.id === rowId; })[0] || null;
}

function handleInspectionStatusCycle(rowId) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  if (!state.inspectionWorkspaceAnswers) state.inspectionWorkspaceAnswers = {};
  var current = (state.inspectionWorkspaceAnswers[rowId] && state.inspectionWorkspaceAnswers[rowId].status) || row.status;
  var idx = INSPECTOR_EXECUTION_STATUS_FLOW.indexOf(current);
  var next = INSPECTOR_EXECUTION_STATUS_FLOW[(idx + 1) % INSPECTOR_EXECUTION_STATUS_FLOW.length];
  if (!state.inspectionWorkspaceAnswers[rowId]) state.inspectionWorkspaceAnswers[rowId] = {};
  state.inspectionWorkspaceAnswers[rowId].status = next;
  persistAfterAction();
  render();
}

function setInspectionComment(rowId, comment) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  if (!state.inspectionWorkspaceAnswers) state.inspectionWorkspaceAnswers = {};
  if (!state.inspectionWorkspaceAnswers[rowId]) state.inspectionWorkspaceAnswers[rowId] = {};
  state.inspectionWorkspaceAnswers[rowId].comment = comment || '';
  persistAfterAction();
}

function handleInspectionDownload(auditId) {
  addLog('Checklist download simulated', auditId || 'SMS Oversight Audit');
  persistAfterAction();
  toast('Checklist ready', 'A checklist PDF download would start here. Demo only - no file is generated.', 'ok');
}

function handleInspectionSaveDraft(auditId) {
  addLog('Inspection draft saved', auditId || 'SMS Oversight Audit');
  persistAfterAction();
  toast('Draft saved', 'Checklist answers and comments were saved in this browser for the demo.', 'ok');
}

function handleInspectionSubmitLead(auditId) {
  addLog('Inspection submitted to Lead Inspector', auditId || 'SMS Oversight Audit');
  pushNotification('leadInspector', '▦', 'SMS Oversight Audit submitted by John Inspector for lead review.');
  persistAfterAction();
  toast('Submitted', 'SMS Oversight Audit was sent to the Lead Inspector review queue (demo).', 'ok');
}

function handleInspectionSectionPreview(sectionId) {
  var label = sectionId === 'next' ? 'Safety Risk Management' : (sectionId === 'previous' ? 'Previous section' : 'Checklist section');
  toast('Section preview', label + ' navigation is staged for this demo screen.', 'info');
}

function handleMockChecklistEvidence(q) {
  if (!state.checklistAnswers[q]) state.checklistAnswers[q] = {};
  state.checklistAnswers[q].evidenceFiles = ['Training_Record_Sample.pdf'];
  toast('Mock evidence selected', 'Training_Record_Sample.pdf attached as a file name only. No upload or storage occurs.', 'ok');
  persistAfterAction();
  render();
}

function handleCreatePotentialFinding(auditId, q) {
  var ans = state.checklistAnswers[q] || {};
  try {
    recordChecklistResult(auditId, q, ans.answer, ans.comment, ans.evidenceFiles || []);
    var potential = createPotentialFinding(auditId, q, { actorName: ROLES[state.role].user });
    addLog('Potential Finding created', potential.id);
    pushNotification('leadInspector', '⚑', potential.id + ' is waiting for Lead Inspector review.');
    toast('Potential Finding created', potential.id + ' sent to Lead Inspector review.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Potential Finding not created', err && err.message ? err.message : 'Complete the checklist result first.', 'warn');
  }
}

function handleConvertPotentialFinding(id) {
  try {
    var severity = val('pf-severity-' + id);
    var finding = convertPotentialFindingToFinding(id, {
      actorName: ROLES[state.role].user,
      severity: severity,
      title: val('pf-title-' + id) || 'Crew training records incomplete'
    });
    addLog('Potential Finding converted to Finding', finding.id);
    pushNotification('auditee', '⚑', 'New finding ' + finding.id + ' was issued to ' + orgName(finding.orgId) + '. A CAP is required.');
    pushNotification('manager', '⚑', 'Lead Inspector converted ' + id + ' to finding ' + finding.id + '.');
    toast('Finding created', finding.id + ' entered the existing CAP/Evidence/Closure flow.', 'ok');
    persistAfterAction();
    go('finding', { findingId: finding.id });
  } catch (err) {
    toast('Conversion not recorded', err && err.message ? err.message : 'Severity is required before conversion.', 'warn');
  }
}

function handleReturnPotentialFinding(id) {
  try {
    returnPotentialFinding(id, val('pf-reason-' + id), ROLES[state.role].user);
    addLog('Potential Finding returned to Inspector', id);
    pushNotification('inspector', '↩️', id + ' was returned by the Lead Inspector for revision.');
    toast('Returned', id + ' returned to Inspector with a required reason.', 'warn');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Return not recorded', err && err.message ? err.message : 'Reason is required.', 'warn');
  }
}

function handleDismissPotentialFinding(id) {
  try {
    dismissPotentialFinding(id, val('pf-reason-' + id), ROLES[state.role].user);
    addLog('Potential Finding dismissed', id);
    toast('Dismissed', id + ' dismissed with a required reason.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Dismissal not recorded', err && err.message ? err.message : 'Reason is required.', 'warn');
  }
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

function approvalActor() {
  var r = ROLES[state.role] || {};
  return { role: state.role, name: r.user || 'Unknown actor' };
}

function approvalDecisionLogLabel(decision) {
  var labels = {
    forward: 'Planning approval forwarded',
    forward_ed: 'Planning approval forwarded to ED',
    approve: 'Planning approval approved',
    approve_with_adjustment: 'Planning budget approved with adjustment',
    finance_not_approved: 'Planning finance not approved',
    return: 'Planning approval returned for revision',
    reject: 'Planning approval rejected'
  };
  return labels[decision] || 'Planning approval decision';
}

function handleApprovalAction(id, decision) {
  var item = planningItemById(id) || checklistVersionById(id);
  if (!item) {
    toast('Approval item not found', 'The selected approval item could not be found in demo state.', 'warn');
    return;
  }
  var note = val('approval-note-' + id);
  try {
    applyApprovalDecision(item, {
      decision: decision,
      actor: approvalActor(),
      comment: note,
      reason: note
    });
  } catch (err) {
    toast('Decision not recorded', err && err.message ? err.message : 'This approval action is not available.', 'warn');
    return;
  }

  var summary = approvalSummary(item);
  var targetLabel = item.id || id;
  addLog(approvalDecisionLogLabel(decision), targetLabel);
  if (summary.ownerRole) {
    pushNotification(summary.ownerRole, '🧾', targetLabel + ' is now waiting for ' + summary.ownerLabel + '.');
  } else if (summary.outcome === 'approved') {
    pushNotification('manager', '✅', targetLabel + ' approved by the governance chain.');
  }
  toast('Decision recorded', targetLabel + ' — ' + summary.statusLabel + '.', summary.statusTone === 'danger' ? 'warn' : 'ok');
  persistAfterAction();
  render();
}

function handleCreateQuestionBankItem() {
  if (!canManageChecklistConfig(state.role)) {
    toast('Read-only', 'Inspectors cannot edit checklist configuration in this demo.', 'warn');
    return;
  }
  var item = createQuestionBankItem({
    title: val('qb-title') || 'Training evidence reconciliation',
    text: val('qb-text') || 'Does the training matrix reconcile to sampled crew certificate evidence?',
    commentRequired: true,
    evidenceRequired: true
  });
  addLog('Question bank item created (demo)', item.id);
  toast('Question created', item.id + ' added to the mock Question Bank.', 'ok');
  persistAfterAction();
  render();
}

function handleCreateChecklistDraft() {
  var checklist = activeManagedChecklist();
  if (!checklist || !canManageChecklistConfig(state.role)) {
    toast('Read-only', 'Checklist configuration editing is limited to configuration roles in this demo.', 'warn');
    return;
  }
  try {
    var draft = createChecklistDraftVersion(checklist, {
      actorName: ROLES[state.role].user,
      actorRole: state.role,
      reason: val('cl-change-reason')
    });
    addLog('Checklist draft version created', draft.id);
    toast('Draft created', 'Version ' + draft.version + ' created with a required reason for change.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Draft not created', err && err.message ? err.message : 'Reason for Change is required.', 'warn');
  }
}

function handleAddQuestionToVersion(versionId, questionId) {
  if (!canManageChecklistConfig(state.role)) {
    toast('Read-only', 'Inspectors cannot edit checklist configuration in this demo.', 'warn');
    return;
  }
  var version = checklistVersionById(versionId);
  if (!version || (version.status !== 'draft' && version.status !== 'checklist_returned')) {
    toast('Version locked', 'Only Draft or Returned checklist versions can be edited.', 'warn');
    return;
  }
  addQuestionToChecklistVersion(version, questionId);
  addLog('Question added to checklist version', version.id);
  toast('Question added', questionId + ' added to version ' + version.version + '.', 'ok');
  persistAfterAction();
  render();
}

function handleMoveChecklistQuestion(versionId, questionId, direction) {
  if (!canManageChecklistConfig(state.role)) {
    toast('Read-only', 'Inspectors cannot edit checklist configuration in this demo.', 'warn');
    return;
  }
  var version = checklistVersionById(versionId);
  if (!version || (version.status !== 'draft' && version.status !== 'checklist_returned')) return;
  moveChecklistQuestion(version, questionId, direction);
  persistAfterAction();
  render();
}

function handleSubmitChecklistVersion(versionId) {
  var version = checklistVersionById(versionId);
  if (!version || state.role !== 'manager') {
    toast('Submit unavailable', 'Only the Department Manager can submit checklist versions for GM approval in this demo.', 'warn');
    return;
  }
  try {
    applyApprovalDecision(version, {
      decision: 'forward',
      actor: approvalActor(),
      comment: 'Submitted checklist version for GM approval.'
    });
    addLog('Checklist version submitted for GM approval', version.id);
    pushNotification('gm', '▧', version.id + ' is waiting for GM checklist approval.');
    toast('Submitted', version.id + ' sent to GM approval.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Submit unavailable', err && err.message ? err.message : 'Version could not be submitted.', 'warn');
  }
}

function handlePublishChecklistVersion(versionId) {
  var checklist = activeManagedChecklist();
  var version = checklistVersionById(versionId);
  if (!checklist || !version || state.role !== 'manager') {
    toast('Publish unavailable', 'Only the Department Manager can publish an approved checklist version in this demo.', 'warn');
    return;
  }
  try {
    publishChecklistVersion(checklist, version, { actorName: ROLES[state.role].user, actorRole: state.role });
    addLog('Checklist version published active (demo)', version.id);
    toast('Published Active', 'Version ' + version.version + ' is now active; prior active version archived.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Publish unavailable', err && err.message ? err.message : 'Only an approved version can be published.', 'warn');
  }
}

function planningActor() {
  return { actorRole: state.role, actorName: ROLES[state.role].user };
}

function planningItemForAction(id) {
  return planningItemById(id) || (state.planningItems && state.planningItems[0]);
}

function handlePlanningRelease(id) {
  var item = planningItemForAction(id);
  try {
    releasePlanningItem(item, planningActor());
    addLog('Planning item released to department', item.id);
    pushNotification('manager', '▤', item.id + ' released by GM and waiting for Department Manager acceptance.');
    toast('Released', item.id + ' released to Department Manager.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Release unavailable', err && err.message ? err.message : 'Planning item could not be released.', 'warn');
  }
}

function handlePlanningAccept(id) {
  var item = planningItemForAction(id);
  try {
    acceptReleasedPlanningItem(item, planningActor());
    addLog('Released audit accepted by department', item.id);
    toast('Accepted', item.id + ' accepted by Department Manager.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Acceptance unavailable', err && err.message ? err.message : 'Planning item could not be accepted.', 'warn');
  }
}

function handlePlanningAssignLead(id) {
  var item = planningItemForAction(id);
  try {
    assignLeadInspectorToPlanningItem(item, {
      actorRole: state.role,
      actorName: ROLES[state.role].user,
      leadInspector: val('prep-lead') || 'Caner Yildiz'
    });
    addLog('Lead Inspector assigned', item.id);
    pushNotification('leadInspector', '▤', item.id + ' is waiting for team/date/resource proposal.');
    toast('Lead assigned', item.preparation.leadInspector + ' assigned as Lead Inspector.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Lead assignment unavailable', err && err.message ? err.message : 'Lead Inspector could not be assigned.', 'warn');
  }
}

function handlePlanningProposeTeam(id) {
  var item = planningItemForAction(id);
  try {
    proposePlanningTeamAndSchedule(item, {
      actorRole: state.role,
      actorName: ROLES[state.role].user,
      team: ['Caner Yildiz', 'Aylin Sezer'],
      startDate: val('prep-start') || '2026-09-10',
      endDate: val('prep-end') || '2026-09-12',
      resources: val('prep-resources') || '2 inspectors, document review package'
    });
    addLog('Lead team and schedule proposed', item.id);
    pushNotification('manager', '▤', item.id + ' team and schedule proposal is ready for Department Manager confirmation.');
    toast('Proposal saved', 'Team, dates, and resources proposed for Department Manager confirmation.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Proposal unavailable', err && err.message ? err.message : 'Lead proposal could not be recorded.', 'warn');
  }
}

function handlePlanningConfirmPrep(id) {
  var item = planningItemForAction(id);
  try {
    confirmPlanningPreparation(item, planningActor());
    addLog('Audit assignment package generated (demo)', item.id);
    toast('Ready for Execution', 'Mock Audit Assignment Package generated. No real document service was used.', 'ok');
    persistAfterAction();
    render();
  } catch (err) {
    toast('Confirmation unavailable', err && err.message ? err.message : 'Preparation could not be confirmed.', 'warn');
  }
}

function handleReportApproval(id, decision) {
  var report = auditReportById(id) || (state.auditReports && state.auditReports[0]);
  if (!report) {
    toast('Report not found', 'The selected audit report could not be found in demo state.', 'warn');
    return;
  }
  var recommendation = null;
  if (state.role === 'manager') {
    var recType = val('report-enforcement-type-' + report.id);
    var recReason = val('report-enforcement-reason-' + report.id);
    if (recType || recReason) {
      recommendation = {
        type: recType || 'Warning',
        reason: recReason || 'Recommendation only; requires separate authorized human decision.'
      };
    }
  }
  try {
    applyReportApprovalDecision(report, {
      decision: decision,
      actor: { role: state.role, name: ROLES[state.role].user },
      comment: val('report-note-' + report.id),
      reason: val('report-note-' + report.id),
      enforcementRecommendation: recommendation
    });
    addLog('Report approval decision recorded', report.id);
    if (report.finalLocked) {
      addLog('Audit closed after ED report approval', report.auditId);
      toast('Final report locked', 'Mock final report generated and audit closed after ED approval.', 'ok');
    } else {
      toast('Report decision recorded', report.id + ' — ' + approvalSummary(report).statusLabel + '.', 'ok');
    }
    persistAfterAction();
    render();
  } catch (err) {
    toast('Report decision not recorded', err && err.message ? err.message : 'Decision could not be recorded.', 'warn');
  }
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
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'checklist-comment') {
    setChecklistComment(e.target.getAttribute('data-q'), e.target.value);
  }
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'inspection-comment') {
    setInspectionComment(e.target.getAttribute('data-id'), e.target.value);
  }
});

document.addEventListener('input', function (e) {
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'checklist-comment') {
    setChecklistComment(e.target.getAttribute('data-q'), e.target.value);
  }
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'inspection-comment') {
    setInspectionComment(e.target.getAttribute('data-id'), e.target.value);
  }
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
