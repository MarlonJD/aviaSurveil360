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
    { view: 'audit-reports', label: 'Audit Reports', icon: '📄', filter: 'all' },
    { view: 'audit-reports', label: 'Preliminary Reports', icon: '□', filter: 'preliminary', badge: '1' },
    { view: 'safety-intelligence', label: 'Team Dashboard', icon: '⌁' },
    { view: 'ssp-nasp', label: 'Executive Dashboard', icon: '▣' },
    { section: 'Oversight' },
    { view: 'calendar', label: 'Audit Work Queue', icon: '▤' },
    { section: 'Organisations' },
    { view: 'organizations', label: 'Operators / Providers', icon: '🏢' },
    { view: 'org-risk', label: 'Risk Profiles', icon: '◇', id: 'ORG-XYZ' },
    { section: 'Findings & CAPs' },
    { view: 'findings', label: 'Open Findings', icon: '⚑', filter: 'open' },
    { view: 'unit-manager-review', label: 'CAP Reviews', icon: '✓' },
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
    { view: 'dashboard', label: 'Dashboard', icon: '▦' },
    { view: 'inspector-assignments', label: 'My Assignments', icon: '▣', badge: '8' },
    { view: 'findings', label: 'Findings', icon: '✓', badge: '14' },
    { view: 'messages', label: 'Messages', icon: '✉', badge: '2' },
    { view: 'calendar', label: 'Calendar', icon: '▤' },
    { view: 'reports', label: 'Reports', icon: '□' }
  ],
  auditee: [
    { section: 'Service Provider Portal' },
    { view: 'reports', label: 'Received Reports', icon: '□', filter: 'received', badge: '1' },
    { view: 'my-findings', label: 'My CAPs', icon: '✓', badge: '5' },
    { view: 'messages', label: 'Communications', icon: '✉', badge: '1' },
    { section: 'Workspace' },
    { view: 'my-findings', label: 'CAP Management', icon: '▤' },
    { view: 'reports', label: 'Documents', icon: '□', filter: 'documents' },
    { view: 'settings', label: 'Settings', icon: '⚙' }
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
    { view: 'lead-review', label: 'Assigned Audits', icon: '▣' },
    { view: 'audit-reports', label: 'Preliminary Reports', icon: '□', filter: 'preliminary', badge: '6' },
    { view: 'audit-reports', label: 'Final Reports', icon: '□', filter: 'final', badge: '4' },
    { view: 'calendar', label: 'Calendar', icon: '▤' },
    { view: 'messages', label: 'Messages', icon: '✉' },
    { view: 'safety-intelligence', label: 'Analytics & Reports', icon: '⌁' },
    { view: 'settings', label: 'Settings', icon: '⚙' }
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
  'inspector-assignments': 'My Assignments',
  'checklist-approvals': 'Checklist Approvals', 'question-bank': 'Question Bank',
  'checklist-builder': 'Checklist Builder', 'checklist-versions': 'Version History',
  'lead-review': 'Lead Inspector Review', 'lead-assignment': 'Audit Assignment',
  'lead-assignment-questions': 'Assign Checklist Questions', 'planning-board': 'Planning',
  'audit-reports': 'Audit Reports', 'cap-review-detail': 'CAP Review', 'final-report-prepare': 'Prepare Final Report',
  'final-report-view': 'Final Report',
  'unit-manager-review': 'Department Manager Approval'
};

var ROLE_DESC = {
  inspector: 'Inspector Workspace — daily operations, findings review, CAP verification and field work.',
  leadInspector: 'Lead Inspector — assigned audits and preliminary/final reports.',
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
  if (role === 'auditee') return 'reports';
  if (role === 'admin') return 'templates';
  if (role === 'gm' || role === 'finance' || role === 'executiveDirector') return 'planning';
  if (role === 'leadInspector') return 'lead-review';
  if (role === 'inspector') return 'inspector-assignments';
  return 'dashboard';
}

var INSPECTOR_RESTRICTED_VIEWS = {
  'checklist-approvals': true,
  'checklist-builder': true,
  'checklist-versions': true,
  'package-builder': true,
  'question-bank': true,
  'regulatory-library': true,
  'offline-field': true,
  'template-preview': true,
  templates: true
};

var INSPECTOR_LEGACY_CAP_VIEWS = {
  'cap-verification': true,
  'cap-verification-review': true,
  'cap-verification-detail': true,
  'inspector-cap-verification': true,
  'inspector-cap-reviews': true
};

var LEAD_INSPECTOR_RESTRICTED_VIEWS = {
  planning: true,
  'planning-approvals': true,
  'planning-board': true,
  reports: true,
  users: true
};

function normalizeViewForRole() {
  if (state.role === 'inspector' && INSPECTOR_LEGACY_CAP_VIEWS[state.view]) {
    state.view = 'findings';
    state.params = { filter: 'open' };
    if (state.selectedFilters) state.selectedFilters.findings = 'open';
  }
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
function renderBrandMark(extraClass) {
  return '<div class="brand-mark' + (extraClass ? ' ' + extraClass : '') + '" aria-hidden="true">' +
    '<span class="brand-mark__wing brand-mark__wing--primary"></span>' +
    '<span class="brand-mark__wing brand-mark__wing--secondary"></span>' +
    '<span class="brand-mark__code">AS</span>' +
  '</div>';
}

function navIconName(item) {
  var label = ((item && item.label) || '').toLowerCase();
  var view = (item && item.view) || '';
  var filter = (item && item.filter) || '';

  if (view === 'logout') return 'log-out';
  if (label.indexOf('assignment') >= 0 || label.indexOf('assigned audit') >= 0 || label.indexOf('inspection') >= 0) return 'clipboard-list';
  if (label.indexOf('cap') >= 0 || filter === 'capreview' || view === 'unit-manager-review' || view === 'cap-effectiveness') return 'clipboard-check';
  if (label.indexOf('finding') >= 0 || view === 'findings' || view === 'my-findings') return 'finding-review';
  if (label.indexOf('report') >= 0 || label.indexOf('document') >= 0 || view === 'reports' || view === 'audit-reports') return 'file-text';
  if (label.indexOf('evidence') >= 0 || view === 'offline-field') return 'paperclip';
  if (label.indexOf('message') >= 0 || view === 'messages') return 'mail';
  if (label.indexOf('calendar') >= 0 || label.indexOf('planning') >= 0 || view === 'calendar' || view === 'planning') return 'calendar';
  if (label.indexOf('analytics') >= 0 || label.indexOf('risk trend') >= 0 || view === 'safety-intelligence') return 'chart';
  if (label.indexOf('setting') >= 0 || view === 'settings') return 'settings';
  if (label.indexOf('profile') >= 0) return 'user-circle';
  if (label.indexOf('user') >= 0) return 'users';
  if (label.indexOf('organisation') >= 0 || label.indexOf('operator') >= 0 || view === 'organizations') return 'building';
  if (label.indexOf('risk') >= 0 || view === 'org-risk') return 'shield-alert';
  if (label.indexOf('question') >= 0 || view === 'question-bank') return 'circle-help';
  if (label.indexOf('version') >= 0) return 'history';
  if (label.indexOf('template') >= 0 || label.indexOf('checklist') >= 0) return 'list-check';
  if (label.indexOf('protocol') >= 0 || label.indexOf('ssp') >= 0 || view === 'ssp-nasp' || view === 'usoap-readiness') return 'target';
  if (view === 'auditlog') return 'scroll';
  return 'layout-dashboard';
}

function navIconSvg(name) {
  switch (name) {
    case 'clipboard-list':
      return '<path d="M9 5h6"></path><path d="M9 3h6l1 2h3v16H5V5h3l1-2z"></path><path d="M9 11h6"></path><path d="M9 15h4"></path>';
    case 'clipboard-check':
      return '<path d="M9 5h6"></path><path d="M9 3h6l1 2h3v16H5V5h3l1-2z"></path><path d="m8.5 14.5 2 2 5-5"></path>';
    case 'flag':
      return '<path d="M6 21V4"></path><path d="M6 5h10l-1 4 1 4H6"></path>';
    case 'finding-review':
      return '<path d="M6 3h8l4 4v5"></path><path d="M14 3v5h5"></path><path d="M6 3v18h7"></path><path d="M9 11h4"></path><path d="M9 15h2"></path><path d="m17.5 19.5 3 3"></path><path d="M16 19a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>';
    case 'file-text':
      return '<path d="M14 3H7v18h10V8z"></path><path d="M14 3v5h5"></path><path d="M9 13h6"></path><path d="M9 17h4"></path>';
    case 'send':
      return '<path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4z"></path>';
    case 'paperclip':
      return '<path d="m21 11-9 9a6 6 0 0 1-8.5-8.5l9.5-9.5a4 4 0 0 1 5.7 5.7l-9.5 9.5a2 2 0 0 1-2.8-2.8l8.7-8.7"></path>';
    case 'mail':
      return '<path d="M4 6h16v12H4z"></path><path d="m4 7 8 6 8-6"></path>';
    case 'calendar':
      return '<path d="M7 3v4"></path><path d="M17 3v4"></path><path d="M4 8h16"></path><path d="M5 5h14v16H5z"></path>';
    case 'chart':
      return '<path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 16v-5"></path><path d="M12 16V8"></path><path d="M16 16v-8"></path>';
    case 'settings':
      return '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"></path><path d="M19.4 15a8 8 0 0 0 .1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.3-.8L15.5 6h-7l-.3 2.7a8 8 0 0 0-1.3.8l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4.6 15l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.3.8l.3 2.7h7l.3-2.7a8 8 0 0 0 1.3-.8l2.4 1 2-3.5z"></path>';
    case 'user-circle':
      return '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path><path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M6.8 18a6 6 0 0 1 10.4 0"></path>';
    case 'users':
      return '<path d="M16 11a3 3 0 1 0 0-6"></path><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M2 19a6 6 0 0 1 12 0"></path><path d="M14 15a5 5 0 0 1 8 4"></path>';
    case 'building':
      return '<path d="M5 21V3h10v18"></path><path d="M15 9h4v12"></path><path d="M8 7h3"></path><path d="M8 11h3"></path><path d="M8 15h3"></path><path d="M3 21h18"></path>';
    case 'shield-alert':
      return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v5"></path><path d="M12 17h.01"></path>';
    case 'circle-help':
      return '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.7 1.2-1.7 2.7"></path><path d="M12 17h.01"></path>';
    case 'history':
      return '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 5v6h6"></path><path d="M12 7v5l3 2"></path>';
    case 'list-check':
      return '<path d="m4 7 2 2 3-4"></path><path d="M11 7h9"></path><path d="m4 15 2 2 3-4"></path><path d="M11 15h9"></path>';
    case 'target':
      return '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"></path><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"></path><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>';
    case 'scroll':
      return '<path d="M8 21h10a3 3 0 0 1-3-3V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a3 3 0 0 0 3 3h1z"></path><path d="M8 21a3 3 0 0 1-3-3h10"></path><path d="M8 7h5"></path><path d="M8 11h5"></path>';
    case 'log-out':
      return '<path d="M10 17 5 12l5-5"></path><path d="M5 12h12"></path><path d="M14 4h5v16h-5"></path>';
    case 'layout-dashboard':
    default:
      return '<path d="M4 5h7v6H4z"></path><path d="M13 5h7v4h-7z"></path><path d="M13 11h7v8h-7z"></path><path d="M4 13h7v6H4z"></path>';
  }
}

function renderNavIcon(item) {
  var name = navIconName(item);
  return '<span class="nav-item__icon nav-item__icon--' + esc(name) + '" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" focusable="false">' + navIconSvg(name) + '</svg>' +
  '</span>';
}

function render() {
  var root = document.getElementById('app-root');
  var inspectorChrome = state.role === 'inspector' || state.role === 'leadInspector';
  if (document.body && document.body.classList) {
    document.body.classList.toggle('is-inspector-experience', inspectorChrome);
  }
  if (!state.role) { root.innerHTML = renderLogin(); return; }
  normalizeViewForRole();

  var nav = NAV[state.role] || [];
  var navHtml = nav.map(function (n) {
    if (n.section) return '<div class="nav-section">' + esc(n.section) + '</div>';
    var active = isNavActive(n) ? ' active' : '';
    var badge = navBadge(n);
    var navId = n.id ? ' data-id="' + esc(n.id) + '"' : '';
    var navFilter = n.filter ? ' data-filter="' + esc(n.filter) + '"' : '';
    return '<button class="nav-item' + active + '" data-act="nav" data-view="' + n.view + '"' + navId + navFilter + '>' +
      renderNavIcon(n) + '<span>' + esc(n.label) + '</span>' +
      (badge ? '<span class="nav-item__badge">' + badge + '</span>' : '') + '</button>';
  }).join('');

  var r = ROLES[state.role];
  var unread = unreadCount(state.role);
  var serviceProviderReportActive = state.role === 'auditee' && state.view === 'reports' &&
    ((state.params && state.params.filter) || selectedFilter('reports', 'received')) === 'received';
  var whoName = serviceProviderReportActive ? 'SkyCargo Air' : r.user;
  var whoInitials = serviceProviderReportActive ? 'SP' : r.initials;
  var whoRole = serviceProviderReportActive ? 'Service Provider' : (EXPERIENCE_LABEL[state.role] || r.name);
  var auditeeSuffix = state.role === 'auditee' ? ' · ' + (serviceProviderReportActive ? 'SkyCargo Air' : ROLES.auditee.orgName) : '';

  var roleOptions = ROLE_ORDER.map(function (k) {
    return '<option value="' + k + '"' + (k === state.role ? ' selected' : '') + '>' + esc(EXPERIENCE_LABEL[k] || ROLES[k].name) +
      (k === 'auditee' ? ' - Service Provider' : '') + '</option>';
  }).join('');

  var notifPanel = state.ui.notifOpen ? renderNotifPanel() : '';

  root.innerHTML =
    '<div class="shell' + (state.ui.menuOpen ? ' menu-open' : '') + (inspectorChrome ? ' shell--inspector' : '') + '">' +
      '<div class="sidebar-backdrop" data-act="toggle-menu"></div>' +
      '<aside class="sidebar">' +
        '<div class="sidebar__brand">' + renderBrandMark('brand-mark--sidebar') +
          '<div class="sidebar__brandtext"><b>AviaSurveil360</b><span>' + esc(inspectorChrome ? 'Aviation Audit System' : 'OVERSIGHT WORKBENCH') + '</span></div></div>' +
        '<nav class="sidebar__nav"><div class="experience-label">' + esc(EXPERIENCE_LABEL[state.role] || r.name) + '</div>' + navHtml + '</nav>' +
        '<div class="sidebar__foot"><button class="nav-item" data-act="logout">' +
          renderNavIcon({ view: 'logout', label: inspectorChrome ? 'Logout' : 'Role select' }) +
          '<span>' + (inspectorChrome ? 'Logout' : 'Role select') + '</span></button>' +
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
          '<div class="who"><div class="who__avatar" style="background:' + r.color + '">' + esc(whoInitials) + '</div>' +
            '<div><div class="who__name">' + esc(whoName) + '</div><div class="who__role">' + esc(whoRole) +
            esc(auditeeSuffix) + '</div></div></div>' +
        '</header>') +
        '<main class="content' + (inspectorChrome ? ' content--inspector' : '') + '">' + (inspectorChrome ? inspectorUserBar() : '') + renderContent() + '</main>' +
      '</div>' +
    '</div>';

  window.scrollTo(0, 0);
}

function isNavActive(navItem) {
  var view = typeof navItem === 'string' ? navItem : navItem.view;
  var navFilter = typeof navItem === 'string' ? null : navItem.filter;
  var activeFilter = state.params && state.params.filter ? state.params.filter : selectedFilter(view, null);
  if (view === state.view) {
    if (view === 'inspector-assignments') return navFilter ? activeFilter === navFilter : (!activeFilter || activeFilter === 'all');
    return navFilter ? activeFilter === navFilter : true;
  }
  if (view === 'planning' && (state.view === 'planning-approvals' || state.view === 'planning-board')) return true;
  if (view === 'lead-review' && (state.view === 'lead-assignment' || state.view === 'lead-assignment-questions')) return true;
  // keep parent nav highlighted on detail screens
  if (view === 'calendar' && (state.view === 'audit-detail' || state.view === 'checklist')) return true;
  if (view === 'findings' && state.view === 'finding' && state.role !== 'auditee') {
    return navFilter ? selectedFilter('findings', 'open') === navFilter : true;
  }
  if (view === 'my-findings' && state.view === 'finding' && state.role === 'auditee') return true;
  if (view === 'reports' && state.view === 'report') return true;
  if (view === 'templates' && state.view === 'template-preview') return true;
  if (view === 'organizations' && state.view === 'org-detail') return true;
  if (view === 'org-risk' && state.view === 'org-risk') return true;
  return false;
}

function navBadge(navItem) {
  var view = typeof navItem === 'string' ? navItem : navItem.view;
  var navFilter = typeof navItem === 'string' ? null : navItem.filter;
  if (navItem && navItem.badge !== undefined) return navItem.badge;
  var f = visibleFindings();
  if (view === 'calendar') {
    var queueAudits = typeof auditsForQueueScope === 'function' ? auditsForQueueScope() : state.audits;
    var a = queueAudits.filter(function (x) { return !isClosedAudit(x); }).length;
    return a || '';
  }
  if (state.role === 'manager' && view === 'findings') {
    if (navFilter === 'capreview') return f.filter(function (x) { return x.status === 'CAP_SUBMITTED'; }).length || '';
    if (navFilter === 'open') return f.filter(function (x) { return x.status !== 'CLOSED'; }).length || '';
    var n = f.filter(function (x) { return dueInfo(x).overdue; }).length;
    return n || '';
  }
  if (state.role === 'inspector' && view === 'findings') {
    if (navFilter === 'capreview') return f.filter(function (x) { return x.status === 'CAP_SUBMITTED'; }).length || '';
    if (navFilter === 'open') return f.filter(function (x) { return x.status !== 'CLOSED'; }).length || '';
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
    case 'dashboard': return state.role === 'manager' ? viewManagerDashboard() : viewInspectorAssignments();
    case 'inspector-assignments': return viewInspectorAssignments();
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
    case 'lead-assignment': return viewLeadAssignmentWorkspace();
    case 'lead-assignment-questions': return viewLeadAssignmentQuestions();
    case 'cap-review-detail': return viewLeadCapReviewDetail();
    case 'unit-manager-review': return viewUnitManagerCapReview();
    case 'planning-board': return viewPlanningBoard();
    case 'audit-reports': return viewAuditReportsApproval();
    case 'final-report-prepare': return viewLeadFinalReportPrepare();
    case 'final-report-view': return viewLeadFinalReportDocument();
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
    default: return state.role === 'manager' ? viewManagerDashboard() : viewInspectorAssignments();
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
    '<div class="login__head"><div class="login__brand">' + renderBrandMark('brand-mark--login') +
      '<div><div class="login__title">AviaSurveil360</div>' +
      '<div class="login__sub">Civil Aviation Authority surveillance &amp; oversight — clickable demo</div></div></div></div>' +
    '<div class="login__body"><div class="login__prompt">Choose a role to enter the demo. You can switch roles at any time from the top bar.</div>' +
      '<div class="role-grid">' + cards + '</div>' +
      '<div class="login__foot">Demo scenario: a CAA Inspector raises <b>Finding CAB-2026-001</b> for Airline XYZ from a Cabin Inspection emergency equipment checklist. ' +
      'The auditee submits a CAP and evidence; CAP acceptance does not close the finding, accepted evidence is required; the manager dashboard updates. ' +
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
  var r = ROLES[state.role] || ROLES.inspector;
  var unread = unreadCount(state.role);
  return '<div class="inspector-userbar">' +
    '<button class="topbar__menu inspector-userbar__menu" data-act="toggle-menu" aria-label="Open menu">☰</button>' +
    '<button class="inspector-userbar__icon" data-act="inspector-help" aria-label="Help">?</button>' +
    '<div style="position:relative">' +
      '<button class="inspector-userbar__icon" data-act="notif-toggle" aria-label="Notifications">&#128276;' +
        (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
      (state.ui.notifOpen ? renderNotifPanel() : '') +
    '</div>' +
    '<button class="inspector-user" data-act="nav" data-view="profile">' +
      '<span class="who__avatar" style="background:' + r.color + '">' + esc(r.initials) + '</span>' +
      '<span class="inspector-user__name">' + esc(r.user) + '</span>' +
      '<span class="inspector-user__chev">&#8964;</span>' +
    '</button>' +
  '</div>';
}

/* ----------------------------- Navigation ----------------------------- */
function go(view, opts) {
  opts = opts || {};
  if (state.role === 'inspector' && INSPECTOR_LEGACY_CAP_VIEWS[view]) {
    view = 'findings';
    opts = Object.assign({}, opts, { filter: 'open' });
  }
  state.view = view;
  if (view === 'inspector-assignments') {
    var assignmentUi = ensureInspectorAssignmentsUi();
    if (opts.filter === 'checklists') assignmentUi.status = 'in-progress';
    else if (!opts.filter) assignmentUi.status = 'all';
    if (!opts.filter && state.selectedFilters) delete state.selectedFilters[view];
  }
  if (view === 'lead-review' && !opts.auditId) delete state.params.auditId;
  if (view === 'audit-reports' && !opts.auditId) delete state.params.auditId;
  if (view === 'audit-reports' && !opts.finalReportId) delete state.params.finalReportId;
  if (opts.auditId !== undefined && opts.auditId !== null && opts.auditId !== '') state.params.auditId = opts.auditId;
  if (opts.finalReportId !== undefined && opts.finalReportId !== null && opts.finalReportId !== '') state.params.finalReportId = opts.finalReportId;
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
  if (view === 'audit-reports' && opts.filter === 'preliminary' && !opts.auditId) {
    ensureLeadPreliminaryReportsUi().mode = 'list';
  }
  if (view === 'findings' && opts.filter === 'capreview') {
    var capUi = ensureCapReviewUi();
    if (opts.findingId) {
      capUi.expandedId = opts.findingId;
      capUi.tab = 'details';
      capUi.decision = '';
      capUi.comment = '';
    }
  }
  var fallbackFilter = view === 'findings'
    ? (state.role === 'inspector' ? 'open' : selectedFilter('findings', 'all'))
    : (view === 'calendar' ? 'active' : null);
  state.params.filter = opts.filter || fallbackFilter || selectedFilter(view, null);
  if (view === 'inspector-assignments' && !opts.filter) delete state.params.filter;
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
  if (roleKey === 'leadInspector') {
    var leadUi = ensureLeadReviewUi();
    ensureLeadAssignedAuditsUi();
    leadUi.tab = 'report';
    leadUi.actionsOpen = false;
  }
  if (roleKey === 'inspector') {
    ensureInspectorAssignmentsUi().status = 'all';
  }
  if (roleKey === 'auditee') {
    ensureServiceProviderReportUi();
    state.selectedFilters.reports = 'received';
    state.params.filter = 'received';
  }
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
    'ev-file': { name: 'PBE_Serviceability_Record_CAB-2026-001.pdf', size: '1.6 MB' },
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
  var status = el.getAttribute('data-status');

  switch (act) {
    case 'role': setRole(el.getAttribute('data-role')); break;
    case 'logout': state.role = null; state.view = 'login'; state.ui.notifOpen = false; state.ui.menuOpen = false; closeModal(); persistAfterAction(); render(); break;
    case 'nav': go(view, { auditId: id, findingId: id, orgId: id, filter: filter, tab: tab }); break;
    case 'toggle-menu': state.ui.menuOpen = !state.ui.menuOpen; render(); break;
    case 'set-filter': setSelectedFilter(el.getAttribute('data-key'), el.getAttribute('data-val')); render(); break;
    case 'inspector-help':
      openModal(modalShell('Inspector workspace help',
        '<p class="modal__intro">Use My Assignments to open assigned audits, continue checklist work, review due dates and monitor your own progress. This is demo-only guidance; no real notification or backend service is used.</p>',
        '<button class="btn btn--primary" data-act="close-modal">Got it</button>',
        false));
      break;

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
    case 'inspection-complete-sections': handleInspectionCompleteSections(id); break;
    case 'inspection-file-open': handleInspectionFileOpen(id); break;
    case 'inspection-file-download': handleInspectionFileDownload(id); break;
    case 'inspection-file-attach': handleInspectionFileAttach(id); break;
    case 'inspection-row-menu': handleInspectionRowMenu(id); break;
    case 'inspection-set-status': handleInspectionSetStatus(id, status); break;
    case 'inspector-assignment-filter': handleInspectorAssignmentFilter(status); break;
    case 'inspector-assignment-apply': handleInspectorAssignmentApply(); break;
    case 'inspector-assignment-open': handleInspectorAssignmentOpen(id); break;
    case 'inspector-assignment-select': handleInspectorAssignmentSelect(id); break;
    case 'inspector-assignment-menu': handleInspectorAssignmentMenu(id); break;
    case 'inspector-assignment-download': handleInspectorAssignmentDownload(); break;
    case 'lead-review-tab': handleLeadReviewTab(tab); break;
    case 'lead-review-section': handleLeadReviewSection(id); break;
    case 'lead-review-download': handleLeadReviewDownload(id); break;
    case 'lead-review-finalize': handleLeadReviewFinalize(id); break;
    case 'lead-review-file': handleLeadReviewFile(id, el.getAttribute('data-file')); break;
    case 'lead-review-file-download': handleLeadReviewFileDownload(id, el.getAttribute('data-file')); break;
    case 'lead-report-generate': handleLeadReportGenerate(id); break;
    case 'lead-report-actions-toggle': handleLeadReportActionsToggle(); break;
    case 'lead-report-section': handleLeadReportSection(id); break;
    case 'lead-report-preview': handleLeadReportPreview(id); break;
    case 'lead-report-save-draft': handleLeadReportSaveDraft(id); break;
    case 'lead-report-send-unit-manager': handleLeadReportSendUnitManager(id); break;
    case 'lead-assigned-reset': handleLeadAssignedReset(); break;
    case 'lead-assigned-apply': handleLeadAssignedApply(); break;
    case 'lead-assigned-more-filters': handleLeadAssignedMoreFilters(); break;
    case 'lead-assigned-new': handleLeadAssignedNew(); break;
    case 'lead-assigned-row-menu': handleLeadAssignedRowMenu(id); break;
    case 'lead-assignment-preview-report': handleLeadAssignmentPreviewReport(); break;
    case 'lead-assignment-preview-checklist': handleLeadAssignmentPreviewChecklist(); break;
    case 'lead-assignment-view-details': handleLeadAssignmentViewDetails(); break;
    case 'lead-assignment-view-team': handleLeadAssignmentViewTeam(); break;
    case 'lead-assignment-guide': handleLeadAssignmentGuide(); break;
    case 'lead-assignment-download': handleLeadAssignmentDownload(); break;
    case 'lead-assignment-pick-inspector': handleLeadAssignmentPickInspector(id); break;
    case 'lead-assignment-clear-selection': handleLeadAssignmentClearSelection(); break;
    case 'lead-assignment-assign': handleLeadAssignmentAssign(); break;
    case 'lead-assignment-save': handleLeadAssignmentSave(); break;
    case 'lead-assignment-preview': handleLeadAssignmentPreview(); break;
    case 'lead-assignment-release': handleLeadAssignmentRelease(); break;
    case 'lead-assignment-bulk': handleLeadAssignmentBulk(el.getAttribute('data-mode')); break;
    case 'preliminary-report-new': handlePreliminaryReportNew(); break;
    case 'preliminary-report-open': handlePreliminaryReportOpen(id); break;
    case 'preliminary-report-actions': handlePreliminaryReportActions(id); break;
    case 'preliminary-report-step': handlePreliminaryReportStep(el.getAttribute('data-step')); break;
    case 'preliminary-report-next': handlePreliminaryReportNext(); break;
    case 'preliminary-report-back': handlePreliminaryReportBack(); break;
    case 'preliminary-report-save': handlePreliminaryReportSave(); break;
    case 'preliminary-report-submit': handlePreliminaryReportSubmit(); break;
    case 'preliminary-report-preview': handlePreliminaryReportPreview(); break;
    case 'preliminary-report-browse-file': handlePreliminaryReportBrowseFile(); break;
    case 'preliminary-report-new-folder': handlePreliminaryReportNewFolder(); break;
    case 'preliminary-report-attachment-action': handlePreliminaryReportAttachmentAction(id); break;
    case 'preliminary-report-view-finding': handlePreliminaryReportViewFinding(id); break;
    case 'department-prelim-tab': handleDepartmentPreliminaryTab(tab); break;
    case 'department-prelim-toggle-menu': handleDepartmentPreliminaryToggleMenu(); break;
    case 'department-prelim-approve': handleDepartmentPreliminaryApprove(el.getAttribute('data-path')); break;
    case 'department-prelim-request-changes': handleDepartmentPreliminaryRequestChanges(); break;
    case 'department-prelim-download': handleDepartmentPreliminaryDownload(); break;
    case 'department-prelim-back': go('audit-reports', { filter: 'all' }); break;
    case 'service-report-tab': handleServiceProviderReportTab(tab); break;
    case 'service-report-download': handleServiceProviderReportDownload(); break;
    case 'service-report-submit-cap': handleServiceProviderSubmitCap(id); break;
    case 'service-report-confirm-cap': handleServiceProviderConfirmCap(id); break;
    case 'service-report-view-finding': handleServiceProviderViewFinding(id); break;
    case 'service-report-document': handleServiceProviderDocument(id); break;
    case 'cap-review-provider': handleCapReviewProvider(id); break;
    case 'cap-review-row': handleCapReviewRow(id); break;
    case 'cap-review-tab': handleCapReviewTab(id, tab); break;
    case 'cap-review-filter': handleCapReviewQuickFilter(status); break;
    case 'cap-review-apply-filters': handleCapReviewApplyFilters(); break;
    case 'cap-review-clear': handleCapReviewClear(); break;
    case 'cap-review-submit-decision': handleCapReviewSubmitDecision(id); break;
    case 'cap-review-evidence': handleCapReviewEvidence(id, el.getAttribute('data-file')); break;
    case 'finding-new': handleInspectorFindingNew(); break;
    case 'finding-filter-toggle': handleInspectorFindingFilterToggle(); break;
    case 'finding-edit': handleInspectorFindingEdit(id); break;
    case 'finding-submit-revised': handleInspectorFindingSubmitRevised(id); break;
    case 'finding-accept-cap': handleInspectorFindingDecision(id, 'accept'); break;
    case 'finding-return-cap': handleInspectorFindingDecision(id, 'return'); break;
    case 'cap-track-tab': handleCapTrackingTab(tab); break;
    case 'cap-track-reminder': handleCapTrackingReminder(); break;
    case 'cap-track-view-report': handleCapTrackingViewReport(); break;
    case 'cap-track-export': handleCapTrackingExport(); break;
    case 'cap-track-row-action': handleCapTrackingRowAction(id, el.getAttribute('data-track-action')); break;
    case 'cap-track-quick-action': handleCapTrackingQuickAction(el.getAttribute('data-track-action')); break;
    case 'cap-detail-tab': handleCapDetailTab(tab); break;
    case 'cap-detail-download-finding': handleCapDetailDownloadFinding(id); break;
    case 'cap-detail-request-revision': handleCapDetailRequestRevision(id); break;
    case 'cap-detail-request-more-evidence': handleCapDetailRequestMoreEvidence(id); break;
    case 'cap-detail-prepare-second-report': handleCapDetailPrepareSecondReport(id); break;
    case 'inspector-cap-package-accept': handleInspectorCapPackageDecision(id, 'accept'); break;
    case 'inspector-cap-package-revision': handleInspectorCapPackageDecision(id, 'revision'); break;
    case 'inspector-cap-package-reject': handleInspectorCapPackageDecision(id, 'reject'); break;
    case 'final-report-list-open': handleFinalReportListOpen(id); break;
    case 'final-report-ready-action': handleFinalReportReadyAction(el.getAttribute('data-final-action')); break;
    case 'final-report-prepare-step': handleFinalReportPrepareStep(el.getAttribute('data-step')); break;
    case 'final-report-prepare-next': handleFinalReportPrepareNext(); break;
    case 'final-report-prepare-back': handleFinalReportPrepareBack(); break;
    case 'final-report-prepare-save': handleFinalReportPrepareSave(); break;
    case 'final-report-prepare-review': handleFinalReportPrepareReview(); break;
    case 'final-report-prepare-submit': handleFinalReportPrepareSubmit(); break;
    case 'final-report-prepare-confirm-submit': handleFinalReportPrepareConfirmSubmit(); break;
    case 'final-report-export-pdf': handleFinalReportExportPdf(); break;
    case 'final-report-print': handleFinalReportPrint(); break;
    case 'cap-detail-submit-general-manager': handleCapDetailSubmitGeneralManager(id); break;
    case 'cap-lead-save': handleCapLeadSave(id); break;
    case 'cap-lead-return': handleCapLeadReturn(id); break;
    case 'cap-lead-submit': handleCapLeadSubmit(id); break;
    case 'cap-detail-add-comment': handleCapDetailAddComment(id); break;
    case 'cap-unit-submit-general-manager': handleCapDetailSubmitGeneralManager(id); break;
    case 'cap-unit-choose-file': handleCapUnitChooseFile(id); break;
    case 'cap-unit-view-inspector-report': handleCapUnitViewInspectorReport(id); break;

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
  var rows = typeof inspectionExecutionAllItems === 'function' ? inspectionExecutionAllItems() : (typeof INSPECTOR_EXECUTION_ITEMS === 'undefined' ? [] : INSPECTOR_EXECUTION_ITEMS);
  return rows.filter(function (row) { return row.id === rowId; })[0] || null;
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

function setInspectionStatus(rowId, next) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row || !INSPECTOR_EXECUTION_STATUS_META[next]) return false;
  if (!state.inspectionWorkspaceAnswers) state.inspectionWorkspaceAnswers = {};
  if (!state.inspectionWorkspaceAnswers[rowId]) state.inspectionWorkspaceAnswers[rowId] = {};
  state.inspectionWorkspaceAnswers[rowId].status = next;
  if (next === 'noncompliant') ensureInspectionFindingForRow(row);
  persistAfterAction();
  return true;
}

function inspectionFindingId(row) {
  var safeNo = String(row && row.no ? row.no : row.id).replace(/[^0-9A-Za-z]+/g, '-').replace(/^-+|-+$/g, '');
  return 'SMS-2026-' + safeNo;
}

function inspectionFindingSeverity(row) {
  if (!row) return 2;
  if (/critical|access|owner|target/i.test(row.item || '')) return 2;
  return 3;
}

function ensureInspectionFindingForRow(row) {
  if (!row) return null;
  var id = inspectionFindingId(row);
  var existing = findingById(id);
  var answer = state.inspectionWorkspaceAnswers && state.inspectionWorkspaceAnswers[row.id] ? state.inspectionWorkspaceAnswers[row.id] : {};
  var comment = answer.comment !== undefined ? answer.comment : (row.comment || '');
  var file = answer.file !== undefined ? answer.file : (row.file || '');
  var title = (row.item || 'Checklist non-compliance').replace(/\?$/, '');
  if (existing) {
    existing.title = title;
    existing.description = comment || ('Checklist item ' + row.no + ' was marked Non-Compliant during SMS Oversight Audit.');
    existing.status = existing.status === 'CLOSED' ? 'WAITING_CAP' : existing.status;
    existing.internalNotes = existing.internalNotes || [];
    if (file && !existing.internalNotes.some(function (note) { return (note.text || '').indexOf(file) !== -1; })) {
      existing.internalNotes.push({ author: currentActorLabel(), date: DEMO_TODAY, text: 'Checklist attachment referenced: ' + file });
    }
    if (state.inspectionWorkspaceAnswers[row.id]) state.inspectionWorkspaceAnswers[row.id].findingId = id;
    return existing;
  }
  var finding = {
    id: id,
    title: title,
    description: comment || ('Checklist item ' + row.no + ' was marked Non-Compliant during SMS Oversight Audit.'),
    orgId: 'ORG-SKY',
    auditId: 'AUD-2026-005',
    severity: inspectionFindingSeverity(row),
    reference: 'SMS Oversight Audit checklist item ' + row.no,
    basis: 'Checklist item answered Non-Compliant',
    status: 'WAITING_CAP',
    capRequired: true,
    evidenceRequired: true,
    issuedDate: DEMO_TODAY,
    dueDate: '2026-07-15',
    closedDate: null,
    closureType: null,
    responsiblePerson: 'Service Provider CAP Owner',
    cap: null,
    capRevisions: [],
    evidence: [],
    commentsToAuditee: [],
    internalNotes: [
      {
        author: currentActorLabel(),
        date: DEMO_TODAY,
        text: 'Auto-created from Inspector checklist workspace' + (file ? '. Checklist attachment referenced: ' + file : '.')
      }
    ]
  };
  state.findings.push(finding);
  if (state.inspectionWorkspaceAnswers[row.id]) state.inspectionWorkspaceAnswers[row.id].findingId = id;
  addLog('Finding created from checklist non-compliance', id);
  pushNotification('auditee', 'CAP', 'New finding ' + id + ' requires CAP response from SkyCargo Air.');
  return finding;
}

function setInspectionComment(rowId, comment) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  if (!state.inspectionWorkspaceAnswers) state.inspectionWorkspaceAnswers = {};
  if (!state.inspectionWorkspaceAnswers[rowId]) state.inspectionWorkspaceAnswers[rowId] = {};
  state.inspectionWorkspaceAnswers[rowId].comment = comment || '';
  persistAfterAction();
}

function handleInspectionRowMenu(rowId) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  var statusKey = inspectionExecutionStatus(row);
  var meta = INSPECTOR_EXECUTION_STATUS_META[statusKey] || INSPECTOR_EXECUTION_STATUS_META.na;
  var comment = inspectionExecutionComment(row) || 'No comment yet.';
  var file = (typeof inspectionExecutionFileName === 'function' ? inspectionExecutionFileName(row) : row.file) || 'No file attached';
  var body = '<div class="modal__intro"><b>' + esc(row.no) + '</b> ' + esc(row.item) + '</div>' +
    '<div class="metaline">' +
      metaItem('Compliance', meta.label) +
      metaItem('Attached file', file) +
      metaItem('Comment', comment) +
    '</div>';
  var foot = '<button class="btn" data-act="close-modal">Close</button>' +
    '<button class="btn" data-act="inspection-set-status" data-id="' + esc(row.id) + '" data-status="observed">Mark Observed</button>' +
    '<button class="btn btn--danger" data-act="inspection-set-status" data-id="' + esc(row.id) + '" data-status="noncompliant">Mark Non-Compliant</button>';
  openModal(modalShell('Checklist row actions', body, foot));
}

function handleInspectionFileOpen(rowId) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  var file = (typeof inspectionExecutionFileName === 'function' ? inspectionExecutionFileName(row) : row.file) || '';
  var body = '<div class="modal__intro"><b>' + esc(row.no) + '</b> ' + esc(row.item) + '</div>' +
    '<div class="metaline">' +
      metaItem('Attached file', file || 'No file attached') +
      metaItem('Checklist section', (state.inspectionWorkspaceSection || '1.')) +
      metaItem('Demo storage', 'File name only') +
    '</div>' +
    '<p class="small muted mt-12">Demo only: this previews the attachment record. No real document is uploaded, stored, or downloaded.</p>';
  var foot = '<button class="btn" data-act="close-modal">Close</button>' +
    (file
      ? '<button class="btn" data-act="inspection-row-menu" data-id="' + esc(row.id) + '">View Row Details</button>' +
        '<button class="btn btn--primary" data-act="inspection-file-download" data-id="' + esc(row.id) + '">Download Mock File</button>'
      : '<button class="btn btn--primary" data-act="inspection-file-attach" data-id="' + esc(row.id) + '">Attach Mock File</button>');
  openModal(modalShell(file ? 'Attached file preview' : 'Attach checklist evidence', body, foot));
}

function mockAttachmentDownloadFileName(fileName) {
  var safe = String(fileName || 'attachment')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '')
    .replace(/_+$/g, '');
  if (!safe) safe = 'attachment';
  return safe.replace(/\.[^.]+$/, '') + '_mock-download.txt';
}

function downloadPlainTextFile(fileName, text) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !document.body) return false;
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  return true;
}

function inspectionAttachmentDownloadText(row, fileName) {
  var meta = INSPECTOR_EXECUTION_STATUS_META[inspectionExecutionStatus(row)] || INSPECTOR_EXECUTION_STATUS_META.na;
  var comment = inspectionExecutionComment(row) || 'No comment entered.';
  return [
    'AviaSurveil360 - Mock Attachment Download',
    '',
    'Original file name: ' + fileName,
    'Inspection: INS-2026-015',
    'Audit: SMS Oversight Audit',
    'Organization: SkyCargo Air',
    'Checklist item: ' + row.no + ' - ' + row.item,
    'Compliance: ' + meta.label,
    'Inspector comment: ' + comment,
    '',
    'Demo boundary',
    'This generated text file represents the mock attachment record in the frontend-only demo.',
    'The demo stores file names only; no real document content, upload service, or evidence repository is included.'
  ].join('\n');
}

function handleInspectionFileDownload(rowId) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  var file = (typeof inspectionExecutionFileName === 'function' ? inspectionExecutionFileName(row) : row.file) || '';
  if (!file) {
    handleInspectionFileOpen(rowId);
    return;
  }
  var downloaded = downloadPlainTextFile(mockAttachmentDownloadFileName(file), inspectionAttachmentDownloadText(row, file));
  if (!state.inspectionWorkspaceDownloadedAttachments) state.inspectionWorkspaceDownloadedAttachments = {};
  state.inspectionWorkspaceDownloadedAttachments[row.id] = new Date().toISOString();
  addLog('Checklist attachment download simulated', file);
  persistAfterAction();
  render();
  toast(downloaded ? 'Attachment downloaded' : 'Download unavailable',
    downloaded ? file + ' was generated as a mock download in this browser.' : 'This browser does not support client-side mock downloads.',
    downloaded ? 'ok' : 'warn');
}

function handleInspectionFileAttach(rowId) {
  var row = inspectionWorkspaceRow(rowId);
  if (!row) return;
  if (!state.inspectionWorkspaceAnswers) state.inspectionWorkspaceAnswers = {};
  if (!state.inspectionWorkspaceAnswers[row.id]) state.inspectionWorkspaceAnswers[row.id] = {};
  var safeNo = String(row.no || row.id).replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '');
  state.inspectionWorkspaceAnswers[row.id].file = 'inspection_' + safeNo + '_evidence.pdf';
  addLog('Mock checklist attachment selected', row.id);
  persistAfterAction();
  closeModal();
  render();
  toast('Attachment selected', 'Mock evidence filename added to ' + row.no + '. No real file was uploaded.', 'ok');
}

function handleInspectionSubmittedPackage(auditId) {
  openModal(modalShell('Submitted checklist package',
    '<div class="modal__intro"><b>SMS Oversight Audit</b> has already been submitted to the Lead Inspector.</div>' +
      '<div class="metaline">' +
        metaItem('Inspection ID', 'INS-2026-015') +
        metaItem('Submitted on', state.inspectionWorkspaceSubmittedAt ? logTimestamp() : 'Submitted') +
        metaItem('Package status', 'Available to Inspector workspace') +
      '</div>' +
      '<p class="small muted mt-12">The submitted checklist package stays active in the demo so the Inspector can open the question workspace or review attached evidence without waiting for Lead Inspector to inspect every row one by one.</p>',
    '<button class="btn" data-act="close-modal">Close</button>' +
      '<button class="btn btn--primary" data-act="nav" data-view="lead-assignment-questions" data-id="' + esc(auditId || 'AUD-2026-005') + '">Open Inspector Question Workspace</button>',
    false));
}

function handleInspectionSetStatus(rowId, next) {
  if (!setInspectionStatus(rowId, next)) return;
  if (state.ui) state.ui.inspectionStatusMenu = null;
  persistAfterAction();
  closeModal();
  render();
  if (next === 'noncompliant') {
    toast('Finding added', inspectionFindingId(inspectionWorkspaceRow(rowId)) + ' is now visible in Findings.', 'warn');
  }
}

function handleInspectionDownload(auditId) {
  state.inspectionWorkspaceDownloadedAt = new Date().toISOString();
  addLog('Checklist download simulated', auditId || 'SMS Oversight Audit');
  persistAfterAction();
  downloadInspectionChecklist(auditId || 'AUD-2026-005');
  render();
  toast('Checklist downloaded', 'Checklist file generated in this browser.', 'ok');
}

function handleInspectionSaveDraft(auditId) {
  state.inspectionWorkspaceDraftSavedAt = new Date().toISOString();
  addLog('Inspection draft saved', auditId || 'SMS Oversight Audit');
  persistAfterAction();
  render();
  toast('Draft saved', 'Checklist answers and comments are saved in this browser.', 'ok');
}

function handleInspectionSubmitLead(auditId) {
  if (state.inspectionWorkspaceSubmittedAt) {
    handleInspectionSubmittedPackage(auditId);
    return;
  }
  state.inspectionWorkspaceSubmittedAt = new Date().toISOString();
  addLog('Inspection submitted to Lead Inspector', auditId || 'SMS Oversight Audit');
  pushNotification('leadInspector', '▦', 'SMS Oversight Audit submitted by John Inspector for lead review.');
  persistAfterAction();
  render();
  toast('Submitted', 'SMS Oversight Audit is marked submitted to the Lead Inspector.', 'ok');
}

function handleInspectionCompleteSections(auditId) {
  state.inspectionWorkspaceAllSectionsCompletedAt = new Date().toISOString();
  addLog('Inspector marked all checklist sections complete', auditId || 'SMS Oversight Audit');
  persistAfterAction();
  render();
  toast('All sections complete', 'The checklist sections are marked complete. Submit to Lead Inspector when ready.', 'ok');
}

function handleInspectionSectionPreview(sectionId) {
  var section = typeof inspectionExecutionResolveSection === 'function' ? inspectionExecutionResolveSection(sectionId) : null;
  if (!section) return;
  state.inspectionWorkspaceSection = section.no;
  if (state.ui) state.ui.inspectionStatusMenu = null;
  persistAfterAction();
  render();
}

function inspectionChecklistDownloadText(auditId) {
  var lines = [
    'AviaSurveil360 - SMS Oversight Audit Checklist',
    'Inspection: ' + auditId,
    'Organization: SkyCargo Air',
    'Type: Routine Inspection',
    ''
  ];
  var sections = typeof INSPECTOR_EXECUTION_SECTIONS !== 'undefined' ? INSPECTOR_EXECUTION_SECTIONS : [];
  sections.forEach(function (section) {
    lines.push(section.no + ' ' + section.title + ' (' + section.done + ' / ' + section.total + ' completed)');
    var rows = typeof inspectionExecutionItemsForSection === 'function' ? inspectionExecutionItemsForSection(section.no) : [];
    rows.forEach(function (row) {
      var meta = INSPECTOR_EXECUTION_STATUS_META[inspectionExecutionStatus(row)] || INSPECTOR_EXECUTION_STATUS_META.na;
      lines.push('  ' + row.no + ' [' + meta.label + '] ' + row.item);
      var comment = inspectionExecutionComment(row);
      if (comment) lines.push('      Comment: ' + comment);
      if (row.file) lines.push('      File: ' + row.file);
    });
    lines.push('');
  });
  return lines.join('\n');
}

function downloadInspectionChecklist(auditId) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
  var text = inspectionChecklistDownloadText(auditId);
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'SMS_Oversight_Audit_Checklist.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 0);
}

function ensureLeadReviewUi() {
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
  if (!state.leadReviewUi.section) state.leadReviewUi.section = '1.';
  if (!state.leadReviewUi.rowReviews || typeof state.leadReviewUi.rowReviews !== 'object') state.leadReviewUi.rowReviews = {};
  if (state.leadReviewUi.overallComment === undefined || state.leadReviewUi.overallComment === null) state.leadReviewUi.overallComment = '';
  if (!state.leadReviewUi.downloadedAt) state.leadReviewUi.downloadedAt = '';
  if (!state.leadReviewUi.finalizedAt) state.leadReviewUi.finalizedAt = '';
  if (!state.leadReviewUi.reportGeneratedAt) state.leadReviewUi.reportGeneratedAt = '';
  if (!state.leadReviewUi.reportDraftSavedAt) state.leadReviewUi.reportDraftSavedAt = '';
  if (!state.leadReviewUi.reportSection) state.leadReviewUi.reportSection = 'executive';
  if (!state.leadReviewUi.reportRating) state.leadReviewUi.reportRating = 'Acceptable with CAP';
  if (!state.leadReviewUi.reportRisk) state.leadReviewUi.reportRisk = 'Medium';
  if (!state.leadReviewUi.sentToUnitManagerAt) state.leadReviewUi.sentToUnitManagerAt = '';
  if (state.leadReviewUi.workflowComment === undefined || state.leadReviewUi.workflowComment === null) state.leadReviewUi.workflowComment = '';
  if (state.leadReviewUi.actionsOpen === undefined || state.leadReviewUi.actionsOpen === null) state.leadReviewUi.actionsOpen = false;
  return state.leadReviewUi;
}

function ensureLeadAssignedAuditsUi() {
  if (typeof leadAssignedAuditsUiState === 'function') return leadAssignedAuditsUiState();
  if (!state.leadAssignedAuditsUi) state.leadAssignedAuditsUi = {};
  state.leadAssignedAuditsUi = Object.assign({
    query: '',
    status: 'all',
    department: 'all',
    auditType: 'all',
    risk: 'all',
    due: 'all',
    stage: 'all',
    advanced: false,
    appliedAt: ''
  }, state.leadAssignedAuditsUi || {});
  return state.leadAssignedAuditsUi;
}

function ensureLeadPreliminaryReportsUi() {
  if (!state.leadPreliminaryReportsUi) state.leadPreliminaryReportsUi = {};
  state.leadPreliminaryReportsUi = Object.assign({
    query: '',
    status: 'all',
    organization: 'all',
    period: 'all',
    mode: 'list',
    selectedReportId: 'PR-2026-018',
    step: 'inspection',
    draftSavedAt: '',
    submittedAt: '',
    mockUploadName: '',
    includedFindings: {},
    findingLevel: 'all',
    findingQuery: '',
    declarations: {
      accurate: true,
      evidenceBased: true,
      readyForReview: true
    },
    reportContent: ''
  }, state.leadPreliminaryReportsUi || {});
  state.leadPreliminaryReportsUi.declarations = Object.assign({
    accurate: true,
    evidenceBased: true,
    readyForReview: true
  }, state.leadPreliminaryReportsUi.declarations || {});
  if (!state.leadPreliminaryReportsUi.includedFindings || typeof state.leadPreliminaryReportsUi.includedFindings !== 'object') state.leadPreliminaryReportsUi.includedFindings = {};
  if (!state.leadPreliminaryReportsUi.query) state.leadPreliminaryReportsUi.query = '';
  if (!state.leadPreliminaryReportsUi.status) state.leadPreliminaryReportsUi.status = 'all';
  if (!state.leadPreliminaryReportsUi.organization) state.leadPreliminaryReportsUi.organization = 'all';
  if (!state.leadPreliminaryReportsUi.period) state.leadPreliminaryReportsUi.period = 'all';
  if (!state.leadPreliminaryReportsUi.mode) state.leadPreliminaryReportsUi.mode = 'list';
  if (!state.leadPreliminaryReportsUi.selectedReportId) state.leadPreliminaryReportsUi.selectedReportId = 'PR-2026-018';
  if (!state.leadPreliminaryReportsUi.step) state.leadPreliminaryReportsUi.step = 'inspection';
  if (!state.leadPreliminaryReportsUi.draftSavedAt) state.leadPreliminaryReportsUi.draftSavedAt = '';
  if (!state.leadPreliminaryReportsUi.submittedAt) state.leadPreliminaryReportsUi.submittedAt = '';
  if (!state.leadPreliminaryReportsUi.mockUploadName) state.leadPreliminaryReportsUi.mockUploadName = '';
  if (!state.leadPreliminaryReportsUi.findingLevel) state.leadPreliminaryReportsUi.findingLevel = 'all';
  if (!state.leadPreliminaryReportsUi.findingQuery) state.leadPreliminaryReportsUi.findingQuery = '';
  if (!state.leadPreliminaryReportsUi.reportContent) state.leadPreliminaryReportsUi.reportContent = '';
  return state.leadPreliminaryReportsUi;
}

function ensureDepartmentPreliminaryReviewUi() {
  if (!state.departmentPreliminaryReviewUi) state.departmentPreliminaryReviewUi = {};
  state.departmentPreliminaryReviewUi = Object.assign({
    tab: 'summary',
    selectedReportId: 'PR-2026-018',
    capRequired: true,
    approveMenuOpen: true,
    approvedAt: '',
    approvedPath: '',
    returnedAt: ''
  }, state.departmentPreliminaryReviewUi || {});
  if (!state.departmentPreliminaryReviewUi.tab) state.departmentPreliminaryReviewUi.tab = 'summary';
  if (!state.departmentPreliminaryReviewUi.selectedReportId) state.departmentPreliminaryReviewUi.selectedReportId = 'PR-2026-018';
  state.departmentPreliminaryReviewUi.capRequired = state.departmentPreliminaryReviewUi.capRequired !== false;
  state.departmentPreliminaryReviewUi.approveMenuOpen = state.departmentPreliminaryReviewUi.approveMenuOpen !== false;
  if (!state.departmentPreliminaryReviewUi.approvedAt) state.departmentPreliminaryReviewUi.approvedAt = '';
  if (!state.departmentPreliminaryReviewUi.approvedPath) state.departmentPreliminaryReviewUi.approvedPath = '';
  if (!state.departmentPreliminaryReviewUi.returnedAt) state.departmentPreliminaryReviewUi.returnedAt = '';
  return state.departmentPreliminaryReviewUi;
}

function ensureServiceProviderReportUi() {
  if (!state.serviceProviderReportUi) state.serviceProviderReportUi = {};
  state.serviceProviderReportUi = Object.assign({
    tab: 'cap',
    submittedCaps: {},
    downloadedAt: ''
  }, state.serviceProviderReportUi || {});
  if (!state.serviceProviderReportUi.tab) state.serviceProviderReportUi.tab = 'cap';
  if (!state.serviceProviderReportUi.submittedCaps || typeof state.serviceProviderReportUi.submittedCaps !== 'object') {
    state.serviceProviderReportUi.submittedCaps = {};
  }
  if (!state.serviceProviderReportUi.downloadedAt) state.serviceProviderReportUi.downloadedAt = '';
  return state.serviceProviderReportUi;
}

function leadReviewSectionIndex(sectionNo) {
  var sections = typeof INSPECTOR_EXECUTION_SECTIONS !== 'undefined' ? INSPECTOR_EXECUTION_SECTIONS : [];
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].no === sectionNo) return i;
  }
  return 0;
}

function leadReviewResolveSection(sectionId) {
  var sections = typeof INSPECTOR_EXECUTION_SECTIONS !== 'undefined' ? INSPECTOR_EXECUTION_SECTIONS : [];
  if (!sections.length) return null;
  var ui = ensureLeadReviewUi();
  var index = leadReviewSectionIndex(ui.section || sections[0].no);
  if (sectionId === 'previous') return sections[Math.max(index - 1, 0)];
  if (sectionId === 'next') return sections[Math.min(index + 1, sections.length - 1)];
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].no === sectionId) return sections[i];
  }
  return sections[0];
}

function leadReviewRowDecision(row) {
  var ui = ensureLeadReviewUi();
  var saved = ui.rowReviews[row.id] || {};
  if (saved.decision) return saved.decision;
  if (typeof leadReviewDefaultDecisionForRow === 'function') return leadReviewDefaultDecisionForRow(row);
  return row.status === 'noncompliant' ? 'return' : 'accept';
}

function leadReviewRowComment(row) {
  var ui = ensureLeadReviewUi();
  var saved = ui.rowReviews[row.id] || {};
  if (saved.comment !== undefined) return saved.comment;
  if (typeof leadReviewDefaultCommentForRow === 'function') return leadReviewDefaultCommentForRow(row);
  return '';
}

function handleLeadReviewTab(tab) {
  var ui = ensureLeadReviewUi();
  ui.tab = tab || 'report';
  ui.actionsOpen = false;
  persistAfterAction();
  render();
}

function handleLeadReportSection(sectionId) {
  var ui = ensureLeadReviewUi();
  ui.reportSection = sectionId || 'executive';
  ui.tab = 'report';
  ui.actionsOpen = false;
  persistAfterAction();
  render();
}

function handleLeadReviewSection(sectionId) {
  var section = leadReviewResolveSection(sectionId);
  if (!section) return;
  var ui = ensureLeadReviewUi();
  ui.section = section.no;
  ui.tab = 'checklist';
  persistAfterAction();
  render();
}

function handleLeadReviewDecision(rowId, decision) {
  var row = typeof leadReviewRowById === 'function' ? leadReviewRowById(rowId) : null;
  if (!row || ['accept', 'return', 'na'].indexOf(decision) === -1) return;
  var ui = ensureLeadReviewUi();
  if (!ui.rowReviews[rowId]) ui.rowReviews[rowId] = {};
  ui.rowReviews[rowId].decision = decision;
  if (decision === 'return' && !ui.rowReviews[rowId].comment) {
    ui.rowReviews[rowId].comment = leadReviewRowComment(row);
  }
  persistAfterAction();
  render();
}

function handleLeadReviewCommentInput(target) {
  var rowId = target.getAttribute('data-id');
  var row = typeof leadReviewRowById === 'function' ? leadReviewRowById(rowId) : null;
  if (!row) return;
  var ui = ensureLeadReviewUi();
  if (!ui.rowReviews[rowId]) ui.rowReviews[rowId] = {};
  ui.rowReviews[rowId].comment = target.value || '';
  persistAfterAction();
  var counter = target.parentElement && target.parentElement.querySelector ? target.parentElement.querySelector('.lead-review-count') : null;
  if (counter) counter.textContent = String((target.value || '').length) + ' / 1000';
}

function handleLeadReviewOverallComment(target) {
  var ui = ensureLeadReviewUi();
  ui.overallComment = target.value || '';
  persistAfterAction();
  var counter = target.parentElement && target.parentElement.querySelector ? target.parentElement.querySelector('.lead-review-count') : null;
  if (counter) counter.textContent = String(ui.overallComment.length) + ' / 1000';
}

function handleLeadWorkflowComment(target) {
  var ui = ensureLeadReviewUi();
  ui.workflowComment = target.value || '';
  persistAfterAction();
  var counter = target.parentElement && target.parentElement.querySelector ? target.parentElement.querySelector('.lead-review-count') : null;
  if (counter) counter.textContent = String(ui.workflowComment.length) + ' / 1000';
}

function handleLeadReportFieldChange(field, target) {
  var ui = ensureLeadReviewUi();
  if (field === 'lead-report-rating') ui.reportRating = target.value || 'Acceptable with CAP';
  if (field === 'lead-report-risk') ui.reportRisk = target.value || 'Medium';
  persistAfterAction();
}

function ensureInspectorAssignmentsUi() {
  if (typeof inspectorAssignmentsUiState === 'function') return inspectorAssignmentsUiState();
  if (!state.inspectorAssignmentsUi) state.inspectorAssignmentsUi = {};
  state.inspectorAssignmentsUi = Object.assign({
    query: '',
    status: 'all',
    type: 'all',
    organization: 'all',
    dateRange: 'all',
    selectedAssignmentId: 'PR-2026-018',
    appliedAt: '',
    downloadedAt: ''
  }, state.inspectorAssignmentsUi || {});
  return state.inspectorAssignmentsUi;
}

function handleInspectorAssignmentsFieldChange(field, target) {
  var ui = ensureInspectorAssignmentsUi();
  var value = target && target.value !== undefined ? target.value : '';
  if (field === 'inspector-assignment-query') ui.query = value;
  if (field === 'inspector-assignment-status') ui.status = value || 'all';
  if (field === 'inspector-assignment-type') ui.type = value || 'all';
  if (field === 'inspector-assignment-organization') ui.organization = value || 'all';
  if (field === 'inspector-assignment-date') ui.dateRange = value || 'all';
  persistAfterAction();
  if (field !== 'inspector-assignment-query') render();
}

function handleInspectorAssignmentFilter(status) {
  var ui = ensureInspectorAssignmentsUi();
  ui.status = status || 'all';
  state.view = 'inspector-assignments';
  state.params = {};
  persistAfterAction();
  render();
}

function handleInspectorAssignmentApply() {
  var ui = ensureInspectorAssignmentsUi();
  ui.appliedAt = new Date().toISOString();
  persistAfterAction();
  render();
  toast('Filters applied', 'My Assignments list updated.', 'ok');
}

function handleInspectorAssignmentOpen(assignmentId) {
  var row = typeof inspectorAssignmentById === 'function' ? inspectorAssignmentById(assignmentId) : null;
  if (!row) return;
  var ui = ensureInspectorAssignmentsUi();
  ui.selectedAssignmentId = row.id;
  persistAfterAction();
  if (row.status === 'completed') {
    go('reports');
    return;
  }
  go('audit-detail', { auditId: row.auditId || 'AUD-2026-005' });
}

function handleInspectorAssignmentSelect(assignmentId) {
  var row = typeof inspectorAssignmentById === 'function' ? inspectorAssignmentById(assignmentId) : null;
  if (!row) return;
  var ui = ensureInspectorAssignmentsUi();
  ui.selectedAssignmentId = row.id;
  persistAfterAction();
  render();
}

function handleInspectorAssignmentMenu(assignmentId) {
  var row = typeof inspectorAssignmentById === 'function' ? inspectorAssignmentById(assignmentId) : null;
  if (!row) return;
  openModal(modalShell('Assignment actions',
    '<div class="lead-assigned-modal">' +
      '<p><b>' + esc(row.title) + '</b> · ' + esc(row.code) + '</p>' +
      '<div class="metaline">' +
        metaItem('Organization', row.organization) +
        metaItem('Due Date', row.dueDate) +
        metaItem('Progress', row.progress + '%') +
        metaItem('Questions', row.questionsDone + ' / ' + row.questionsTotal) +
      '</div>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="inspector-assignment-open" data-id="' + esc(row.id) + '">' + esc(row.status === 'completed' ? 'View Report' : (row.status === 'open' ? 'Start' : 'Continue')) + '</button>',
    false));
}

function handleInspectorAssignmentDownload() {
  var ui = ensureInspectorAssignmentsUi();
  ui.downloadedAt = nowIsoDemo();
  persistAfterAction();
  render();
  toast('Assignment downloaded', 'Mock assignment summary prepared for this demo.', 'ok');
}

function handleLeadAssignedFieldChange(field, target) {
  var ui = ensureLeadAssignedAuditsUi();
  var value = target && target.value !== undefined ? target.value : '';
  if (field === 'lead-assigned-query') ui.query = value;
  if (field === 'lead-assigned-status') ui.status = value || 'all';
  if (field === 'lead-assigned-department') ui.department = value || 'all';
  if (field === 'lead-assigned-audit-type') ui.auditType = value || 'all';
  if (field === 'lead-assigned-risk') ui.risk = value || 'all';
  if (field === 'lead-assigned-due') ui.due = value || 'all';
  if (field === 'lead-assigned-stage') ui.stage = value || 'all';
  persistAfterAction();
}

function handleLeadAssignedReset() {
  state.leadAssignedAuditsUi = {
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
  persistAfterAction();
  render();
}

function handleLeadAssignedApply() {
  var ui = ensureLeadAssignedAuditsUi();
  ui.appliedAt = new Date().toISOString();
  persistAfterAction();
  render();
  toast('Filters applied', 'Assigned audits list updated.', 'ok');
}

function handleLeadAssignedMoreFilters() {
  var ui = ensureLeadAssignedAuditsUi();
  ui.advanced = !ui.advanced;
  persistAfterAction();
  render();
}

function handleLeadAssignedNew() {
  openModal(modalShell('New audit assignment',
    '<div class="lead-assigned-modal">' +
      '<p><b>Draft assignment package</b></p>' +
      '<div class="metaline">' +
        metaItem('Operator', 'West Air (Pty) Ltd') +
        metaItem('Department', 'OPS') +
        metaItem('Audit type', 'Regular Surveillance') +
        metaItem('Lead Inspector', ROLES.leadInspector.user) +
      '</div>' +
      '<p class="small muted mt-12">Demo only: this prepares a mock assignment record. No real notification, file storage, or backend workflow is created.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="nav" data-view="calendar">Open Calendar</button>',
    false));
}

function handleLeadAssignedRowMenu(auditId) {
  var rows = typeof leadAssignedAuditRows === 'function' ? leadAssignedAuditRows() : [];
  var row = rows.filter(function (item) { return item.id === auditId || item.detailAuditId === auditId; })[0];
  if (!row) return;
  openModal(modalShell('Audit actions',
    '<div class="lead-assigned-modal">' +
      '<p><b>' + esc(row.id) + '</b> · ' + esc(row.operator) + '</p>' +
      '<div class="metaline">' +
        metaItem('Status', row.status) +
        metaItem('Risk', row.risk) +
        metaItem('Next due', row.dueDate + ' - ' + row.dueStage) +
      '</div>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="nav" data-view="lead-assignment" data-id="' + esc(row.detailAuditId) + '">Open Assignment Workspace</button>',
    false));
}

function ensureLeadAssignmentUi() {
  if (typeof leadAssignmentUiState === 'function') return leadAssignmentUiState();
  if (!state.leadAssignmentUi) state.leadAssignmentUi = {};
  return state.leadAssignmentUi;
}

function handleLeadAssignmentFieldChange(field, target) {
  var ui = ensureLeadAssignmentUi();
  var value = target && target.value !== undefined ? target.value : '';
  if (field === 'lead-assignment-question') {
    var questionId = target && target.getAttribute ? target.getAttribute('data-id') : '';
    if (questionId) ui.selectedQuestions[questionId] = !!target.checked;
    persistAfterAction();
    render();
    return;
  }
  if (field === 'lead-assignment-select-visible') {
    var selected = !!(target && target.checked);
    if (typeof leadAssignmentFilteredQuestions === 'function') {
      leadAssignmentFilteredQuestions(ui).forEach(function (row) { ui.selectedQuestions[row.id] = selected; });
    }
    persistAfterAction();
    render();
    return;
  }
  if (field === 'lead-assignment-assignee') ui.assignee = value || 'Ahmed Ali';
  if (field === 'lead-assignment-due') ui.dueDate = value || '2026-06-13';
  if (field === 'lead-assignment-priority') ui.priority = value || 'Normal';
  if (field === 'lead-assignment-note') ui.note = value || '';
  if (field === 'lead-assignment-department') ui.department = value || 'AVSEC Operations';
  if (field === 'lead-assignment-section') ui.section = value || 'access-control';
  if (field === 'lead-assignment-risk') ui.risk = value || 'all';
  if (field === 'lead-assignment-status') ui.status = value || 'all';
  if (field === 'lead-assignment-query') ui.query = value || '';
  persistAfterAction();
  if (field === 'lead-assignment-note') {
    var counter = target.parentElement && target.parentElement.parentElement && target.parentElement.parentElement.querySelector ? target.parentElement.parentElement.querySelector('.lead-assignment-note-count') : null;
    if (counter) counter.textContent = String(ui.note.length);
  } else {
    render();
  }
}

function handleLeadAssignmentPickInspector(name) {
  if (!name) return;
  var ui = ensureLeadAssignmentUi();
  ui.assignee = name;
  persistAfterAction();
  render();
}

function handleLeadAssignmentClearSelection() {
  var ui = ensureLeadAssignmentUi();
  ui.selectedQuestions = {};
  persistAfterAction();
  render();
}

function handleLeadAssignmentAssign() {
  var ui = ensureLeadAssignmentUi();
  var selected = typeof leadAssignmentSelectedQuestionIds === 'function' ? leadAssignmentSelectedQuestionIds(ui) : Object.keys(ui.selectedQuestions || {});
  if (!selected.length) {
    toast('No checklist questions selected', 'Select at least one question before assigning.', 'warn');
    return;
  }
  ui.assignedAt = nowIsoDemo();
  persistAfterAction();
  render();
  if (state.role === 'inspector') {
    toast('Questions marked', selected.length + ' questions marked for inspector review in this demo.', 'ok');
    return;
  }
  toast('Checklist questions assigned', selected.length + ' questions assigned to ' + ui.assignee + ' with ' + ui.priority + ' priority.', 'ok');
}

function handleLeadAssignmentSave() {
  var ui = ensureLeadAssignmentUi();
  ui.draftSavedAt = nowIsoDemo();
  persistAfterAction();
  render();
  toast('Assignment draft saved', 'Due date, priority and instructions are saved in this demo browser.', 'ok');
}

function handleLeadAssignmentRelease() {
  var ui = ensureLeadAssignmentUi();
  ui.releasedAt = nowIsoDemo();
  if (!ui.assignedAt) ui.assignedAt = ui.releasedAt;
  if (state.role === 'inspector') {
    persistAfterAction();
    render();
    toast('Inspector review confirmed', 'Submitted checklist package remains available in the Inspector workspace.', 'ok');
    return;
  }
  state.notifications.unshift({
    id: 'n-lead-assignment-' + state.notifSeq++,
    role: 'leadInspector',
    icon: '▣',
    text: 'AVSEC checklist assignments released to inspectors.',
    time: 'Now',
    unread: false
  });
  persistAfterAction();
  render();
  toast('Released to inspectors', 'Inspectors can now work on their assigned checklist questions.', 'ok');
}

function handleLeadAssignmentDownload() {
  var ui = ensureLeadAssignmentUi();
  ui.downloadedAt = nowIsoDemo();
  persistAfterAction();
  render();
  toast('Assignment plan prepared', 'Mock assignment plan is ready for the demo. No real file was generated.', 'ok');
}

function handleLeadAssignmentPreview() {
  var ui = ensureLeadAssignmentUi();
  var selected = typeof leadAssignmentSelectedQuestionIds === 'function' ? leadAssignmentSelectedQuestionIds(ui).length : 0;
  openModal(modalShell('Assignment preview',
    '<div class="lead-assigned-modal">' +
      '<p><b>AVSEC Inspection</b> checklist assignment draft</p>' +
      '<div class="metaline">' +
        metaItem('Assignee', ui.assignee) +
        metaItem('Selected questions', String(selected)) +
        metaItem('Due date', ui.dueDate) +
        metaItem('Priority', ui.priority) +
      '</div>' +
      '<p class="small muted mt-12">' + esc(ui.note || 'No special inspector instructions added.') + '</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="lead-assignment-release">Release to Inspectors</button>',
    false));
}

function handleLeadAssignmentPreviewReport() {
  go('lead-review', { auditId: (state.params && state.params.auditId) || 'AUD-2026-005' });
}

function handleLeadAssignmentPreviewChecklist() {
  openModal(modalShell('AVSEC Operations Checklist',
    '<div class="lead-assigned-modal">' +
      '<p><b>186 questions</b> across Operations, Cargo Security and Access Control.</p>' +
      '<div class="list-mini"><span>Access control procedures</span><span>CCTV monitoring</span><span>Staff screening</span><span>Visitor pass control</span></div>' +
      '<p class="small muted mt-12">Demo only: checklist preview uses mock content and does not open a production checklist engine.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="nav" data-view="lead-assignment-questions" data-id="' + esc((state.params && state.params.auditId) || 'AUD-2026-005') + '">Assign Questions</button>',
    false));
}

function handleLeadAssignmentViewDetails() {
  openModal(modalShell('Departments in scope',
    '<div class="lead-assigned-modal">' +
      '<div class="metaline">' +
        metaItem('Operations', '62 questions') +
        metaItem('Cargo Security', '64 questions') +
        metaItem('Access Control', '60 questions') +
      '</div>' +
      '<p class="small muted mt-12">Scope is fixed for this frontend demo and can be reviewed before assignment release.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button>',
    false));
}

function handleLeadAssignmentViewTeam() {
  var rows = typeof leadAssignmentInspectors === 'function' ? leadAssignmentInspectors() : [];
  openModal(modalShell('Inspection team',
    '<div class="lead-assigned-modal">' + rows.map(function (row) {
      return '<div class="metaline">' + metaItem(row.name, row.unit + ' - ' + row.assigned + ' questions') + '</div>';
    }).join('') + '<p class="small muted mt-12">Team workload is balanced before release to inspectors.</p></div>',
    '<button class="btn" data-act="close-modal">Close</button>',
    false));
}

function handleLeadAssignmentGuide() {
  openModal(modalShell('Assignment guide',
    '<div class="lead-assigned-modal">' +
      '<p><b>Recommended order</b></p>' +
      '<div class="list-mini"><span>1. Select checklist questions</span><span>2. Choose inspector, due date and priority</span><span>3. Add assignment instructions</span><span>4. Save draft or release to inspectors</span></div>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button>',
    false));
}

function handleLeadAssignmentBulk(mode) {
  var ui = ensureLeadAssignmentUi();
  if (mode === 'assign-section' && typeof leadAssignmentFilteredQuestions === 'function') {
    leadAssignmentFilteredQuestions(ui).forEach(function (row) { ui.selectedQuestions[row.id] = true; });
    persistAfterAction();
    render();
    toast('Section selected', 'Visible checklist questions are ready for assignment.', 'ok');
    return;
  }
  if (mode === 'reassign') {
    ui.assignee = 'Maria Silva';
    ui.assignedAt = nowIsoDemo();
    persistAfterAction();
    render();
    toast('Questions reassigned', 'Selected questions are reassigned to Maria Silva in the demo.', 'ok');
    return;
  }
  if (mode === 'remove') {
    ui.selectedQuestions = {};
    ui.assignedAt = '';
    persistAfterAction();
    render();
    toast('Selection cleared', 'Selected assignment rows were cleared from the working draft.', 'warn');
    return;
  }
  if (mode === 'export') {
    handleLeadAssignmentDownload();
  }
}

function handleLeadPreliminaryReportFieldChange(field, target) {
  var ui = ensureLeadPreliminaryReportsUi();
  var value = target && target.value !== undefined ? target.value : '';
  if (field === 'preliminary-report-query') ui.query = value;
  if (field === 'preliminary-report-status') ui.status = value || 'all';
  if (field === 'preliminary-report-organization') ui.organization = value || 'all';
  if (field === 'preliminary-report-period') ui.period = value || 'all';
  if (field === 'preliminary-report-content') ui.reportContent = value;
  if (field === 'preliminary-report-finding-level') ui.findingLevel = value || 'all';
  if (field === 'preliminary-report-finding-query') ui.findingQuery = value || '';
  if (field === 'preliminary-report-finding') {
    var findingId = target && target.getAttribute ? target.getAttribute('data-id') : '';
    if (findingId) ui.includedFindings[findingId] = !!target.checked;
  }
  if (field === 'preliminary-report-declaration') {
    var declaration = target && target.getAttribute ? target.getAttribute('data-id') : '';
    if (declaration) ui.declarations[declaration] = !!target.checked;
  }
  persistAfterAction();
  if (field !== 'preliminary-report-content') render();
}

function handlePreliminaryReportNew() {
  openModal(modalShell('New preliminary report',
    '<div class="lead-assigned-modal">' +
      '<p><b>Draft preliminary report package</b></p>' +
      '<div class="metaline">' +
        metaItem('Inspection', 'AVSEC Inspection') +
        metaItem('Organization', 'SkyCargo Air') +
        metaItem('Lead Inspector', ROLES.leadInspector.user) +
        metaItem('Status', 'Draft') +
      '</div>' +
      '<p class="small muted mt-12">Demo only: this creates a mock report shell in the browser. No backend, real report engine, storage, or notification is used.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="preliminary-report-open" data-id="PR-2026-018">Open Existing Report</button>',
    false));
}

function handlePreliminaryReportOpen(reportId) {
  var row = typeof leadPreliminaryReportById === 'function' ? leadPreliminaryReportById(reportId) : null;
  if (!row || !row.auditId) {
    toast('Report unavailable', 'This mock report does not have a detail package in the demo.', 'warn');
    return;
  }
  closeModal();
  go('audit-reports', { auditId: row.auditId, filter: 'preliminary' });
}

function handlePreliminaryReportActions(reportId) {
  var row = typeof leadPreliminaryReportById === 'function' ? leadPreliminaryReportById(reportId) : null;
  if (!row) return;
  var ui = ensureLeadPreliminaryReportsUi();
  ui.mode = 'workflow';
  ui.selectedReportId = row.id;
  ui.step = 'inspection';
  state.view = 'audit-reports';
  state.params = { filter: 'preliminary' };
  if (state.selectedFilters) state.selectedFilters['audit-reports'] = 'preliminary';
  closeModal();
  persistAfterAction();
  render();
}

function preliminaryReportStepOrder() {
  return ['inspection', 'content', 'attachments', 'review'];
}

function handlePreliminaryReportStep(step) {
  var order = preliminaryReportStepOrder();
  if (order.indexOf(step) === -1) return;
  var ui = ensureLeadPreliminaryReportsUi();
  ui.mode = 'workflow';
  ui.step = step;
  persistAfterAction();
  render();
}

function handlePreliminaryReportNext() {
  var ui = ensureLeadPreliminaryReportsUi();
  var order = preliminaryReportStepOrder();
  var index = order.indexOf(ui.step || 'inspection');
  ui.mode = 'workflow';
  ui.step = order[Math.min(order.length - 1, index + 1)] || 'inspection';
  persistAfterAction();
  render();
}

function handlePreliminaryReportBack() {
  var ui = ensureLeadPreliminaryReportsUi();
  var order = preliminaryReportStepOrder();
  var index = order.indexOf(ui.step || 'inspection');
  if (index <= 0) {
    ui.mode = 'list';
    ui.step = 'inspection';
  } else {
    ui.mode = 'workflow';
    ui.step = order[index - 1];
  }
  persistAfterAction();
  render();
}

function handlePreliminaryReportSave() {
  var ui = ensureLeadPreliminaryReportsUi();
  ui.draftSavedAt = logTimestamp();
  persistAfterAction();
  render();
  toast('Draft saved', 'Preliminary report draft was saved in this browser.', 'ok');
}

function handlePreliminaryReportSubmit() {
  var ui = ensureLeadPreliminaryReportsUi();
  ui.submittedAt = logTimestamp();
  ui.step = 'review';
  pushNotification('manager', 'RPT', 'Preliminary report ' + (ui.selectedReportId || 'PR-2026-018') + ' is ready for Department Manager review.');
  addLog('Preliminary report submitted to Department Manager', ui.selectedReportId || 'PR-2026-018');
  persistAfterAction();
  render();
  toast('Submitted to Department Manager', 'The Department Manager will release it to the Service Provider only if CAP is required.', 'ok');
}

function handlePreliminaryReportPreview() {
  var ui = ensureLeadPreliminaryReportsUi();
  var row = typeof leadPreliminaryReportById === 'function' ? leadPreliminaryReportById(ui.selectedReportId) : null;
  openModal(modalShell('Preview PDF',
    '<div class="lead-assigned-modal">' +
      '<p><b>' + esc(row ? row.id : 'PR-2026-018') + '</b> preview is generated from selected findings, report content, and attachments.</p>' +
      '<p class="small muted mt-12">Demo only: no real PDF engine, document storage, or e-signature is used.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handlePreliminaryReportBrowseFile() {
  var ui = ensureLeadPreliminaryReportsUi();
  ui.mockUploadName = 'Additional_CAP_Evidence_Summary.pdf';
  persistAfterAction();
  render();
  toast('File selected', 'Additional_CAP_Evidence_Summary.pdf was added as a mock attachment name.', 'ok');
}

function handlePreliminaryReportNewFolder() {
  openModal(modalShell('New folder',
    '<div class="lead-assigned-modal">' +
      '<p><b>Evidence Folder</b></p>' +
      '<p class="small muted">Demo only: this shows where Lead Inspector could organize supporting files. No real folder is created.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handlePreliminaryReportAttachmentAction(fileId) {
  toast('Attachment action', (fileId || 'Attachment') + ' action is simulated in this frontend demo.', 'info');
}

function handlePreliminaryReportViewFinding(findingId) {
  openModal(modalShell('Finding included in report',
    '<div class="lead-assigned-modal">' +
      '<p><b>' + esc(findingId || 'SEC-2026-002') + '</b></p>' +
      '<p class="small muted">This finding remains selected for the preliminary report package.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handleDepartmentPreliminaryTab(tab) {
  var allowed = ['summary', 'findings', 'content', 'attachments', 'audit'];
  if (allowed.indexOf(tab) === -1) return;
  var ui = ensureDepartmentPreliminaryReviewUi();
  ui.tab = tab;
  persistAfterAction();
  render();
}

function handleDepartmentPreliminaryToggleMenu() {
  var ui = ensureDepartmentPreliminaryReviewUi();
  ui.approveMenuOpen = !ui.approveMenuOpen;
  persistAfterAction();
  render();
}

function departmentPreliminaryReportRecord() {
  var row = typeof leadPreliminaryReportById === 'function'
    ? leadPreliminaryReportById(ensureDepartmentPreliminaryReviewUi().selectedReportId)
    : null;
  return row && row.auditId && typeof reportForAudit === 'function' ? reportForAudit(row.auditId) : null;
}

function handleDepartmentPreliminaryApprove(path) {
  var ui = ensureDepartmentPreliminaryReviewUi();
  var approvalPath = path === 'gm' ? 'gm' : (path === 'service_provider' ? 'service_provider' : (ui.capRequired ? 'service_provider' : 'gm'));
  ui.capRequired = approvalPath === 'service_provider';
  ui.approvedPath = approvalPath;
  ui.approvedAt = logTimestamp();
  ui.returnedAt = '';
  ui.approveMenuOpen = false;

  var report = departmentPreliminaryReportRecord();
  if (report) {
    if (!report.preliminaryNotice) report.preliminaryNotice = {};
    report.preliminaryNotice.capRequired = approvalPath === 'service_provider';
    report.status = approvalPath === 'service_provider' ? 'released_to_service_provider' : 'submitted_to_gm';
    if (report.approval && Array.isArray(report.approval.history)) {
      report.approval.history.push({
        actor: ROLES.manager.user,
        role: 'manager',
        action: approvalPath === 'service_provider' ? 'sent_to_service_provider' : 'sent_to_general_manager',
        date: ui.approvedAt,
        comment: approvalPath === 'service_provider'
          ? 'Department Manager approved the preliminary report and sent it to the Service Provider because CAP is required.'
          : 'Department Manager approved the preliminary report and sent it to the General Manager for approval because no CAP is required.'
      });
    }
  }

  if (approvalPath === 'service_provider') {
    pushNotification('auditee', 'RPT', 'Preliminary report PR-2026-018 was released to your Service Provider portal for CAP response.');
    addLog('Department Manager sent preliminary report to Service Provider', 'PR-2026-018');
    toast('Sent to Service Provider', 'CAP is required, so the Department Manager sent the preliminary report to the Service Provider.', 'ok');
  } else {
    pushNotification('gm', 'RPT', 'Preliminary report PR-2026-018 is ready for General Manager approval.');
    addLog('Department Manager sent preliminary report to General Manager', 'PR-2026-018');
    toast('Sent to General Manager', 'No CAP is required, so the report moved to General Manager approval.', 'ok');
  }
  persistAfterAction();
  render();
}

function handleDepartmentPreliminaryRequestChanges() {
  var ui = ensureDepartmentPreliminaryReviewUi();
  ui.returnedAt = logTimestamp();
  ui.approvedAt = '';
  ui.approvedPath = '';
  ui.approveMenuOpen = true;
  var report = departmentPreliminaryReportRecord();
  if (report) {
    report.status = 'returned_to_lead';
    if (report.approval && Array.isArray(report.approval.history)) {
      report.approval.history.push({
        actor: ROLES.manager.user,
        role: 'manager',
        action: 'returned',
        date: ui.returnedAt,
        comment: 'Department Manager requested changes before approving the preliminary report.'
      });
    }
  }
  pushNotification('leadInspector', 'RPT', 'Department Manager requested changes for preliminary report PR-2026-018.');
  addLog('Department Manager requested changes on preliminary report', 'PR-2026-018');
  persistAfterAction();
  render();
  toast('Changes requested', 'The preliminary report was returned to the Lead Inspector in this demo.', 'warn');
}

function handleDepartmentPreliminaryDownload() {
  openModal(modalShell('Download PDF',
    '<div class="lead-assigned-modal">' +
      '<p><b>PR-2026-018 Department Manager review PDF</b></p>' +
      '<p class="small muted mt-12">Demo only: the PDF download is represented as a preview action. No real reporting engine or document storage is used.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handleServiceProviderReportTab(tab) {
  var allowed = ['overview', 'findings', 'cap', 'communications', 'attachments', 'history'];
  if (allowed.indexOf(tab) === -1) tab = 'cap';
  var ui = ensureServiceProviderReportUi();
  ui.tab = tab;
  persistAfterAction();
  render();
}

function handleServiceProviderReportDownload() {
  var ui = ensureServiceProviderReportUi();
  ui.downloadedAt = logTimestamp();
  persistAfterAction();
  openModal(modalShell('Final Report PDF',
    '<div class="lead-assigned-modal">' +
      '<p><b>FR-2026-014 Final Report</b></p>' +
      '<p class="small muted mt-12">Demo only: this represents viewing or downloading the final report PDF. No real file is generated, stored, or downloaded.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handleServiceProviderSubmitCap(findingId) {
  var row = typeof serviceProviderCapRequirementById === 'function' ? serviceProviderCapRequirementById(findingId) : null;
  if (!row || !row.capRequired) return;
  var ui = ensureServiceProviderReportUi();
  var alreadySubmitted = !!ui.submittedCaps[row.id];
  openModal(modalShell((alreadySubmitted ? 'CAP evidence submitted - ' : 'Upload CAP evidence - ') + row.id,
    '<div class="sp-report-cap-modal">' +
      '<p><b>' + esc(row.title) + '</b></p>' +
      '<div class="metaline">' +
        metaItem('Checklist item', row.checklist) +
        metaItem('Level', row.levelLabel) +
        metaItem('Due Date', row.dueDateText) +
        metaItem('Status', alreadySubmitted ? 'CAP Evidence Submitted' : 'Evidence Required') +
      '</div>' +
      '<label>Implementation note<textarea placeholder="Describe what was completed" rows="3"' + (alreadySubmitted ? ' readonly' : '') + '>' + (alreadySubmitted ? 'Corrective action completed. Evidence package is waiting for inspector verification.' : '') + '</textarea></label>' +
      '<label>CAP closure evidence<div class="filebox filebox--small"><div>' + esc(alreadySubmitted ? 'CAP_Closure_Evidence_' + row.id + '.pdf' : 'Click to attach a document (mock)') + '</div><div class="filebox__hint">Demo only: file name is shown; no real document is uploaded or stored.</div></div></label>' +
      '<p class="small muted mt-12">The Service Provider uploads evidence to support CAP closure. The Inspector verifies the package before any finding can close.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button>' +
      (alreadySubmitted ? '' : '<button class="btn btn--primary" data-act="service-report-confirm-cap" data-id="' + esc(row.id) + '">Submit Mock Evidence</button>'),
    false));
}

function handleServiceProviderConfirmCap(findingId) {
  var row = typeof serviceProviderCapRequirementById === 'function' ? serviceProviderCapRequirementById(findingId) : null;
  if (!row || !row.capRequired) return;
  var ui = ensureServiceProviderReportUi();
  ui.submittedCaps[row.id] = logTimestamp();
  ui.tab = 'cap';
  pushNotification('inspector', 'CAP', 'SkyCargo Air uploaded CAP closure evidence for ' + row.id + ' from final report FR-2026-014.');
  addLog('Service Provider uploaded CAP evidence', row.id);
  closeModal();
  persistAfterAction();
  render();
  toast('CAP evidence submitted', row.id + ' was sent to the inspector verification queue in this demo.', 'ok');
}

function handleServiceProviderViewFinding(findingId) {
  var row = typeof serviceProviderCapRequirementById === 'function' ? serviceProviderCapRequirementById(findingId) : null;
  if (!row) return;
  openModal(modalShell('Finding detail - ' + row.id,
    '<div class="lead-assigned-modal">' +
      '<p><b>' + esc(row.title) + '</b></p>' +
      '<div class="metaline">' +
        metaItem('Checklist item', row.checklist) +
        metaItem('Finding level', row.levelLabel) +
        metaItem('CAP requirement', row.capRequired ? 'Required' : 'Not applicable') +
        metaItem('Due Date', row.dueDateText) +
      '</div>' +
      '<p class="small muted mt-12">Only Service Provider-visible finding information is shown here. Internal CAA notes are not part of this portal view.</p>' +
    '</div>',
    '<button class="btn btn--primary" data-act="close-modal">Close</button>',
    false));
}

function handleServiceProviderDocument(documentId) {
  toast('Document action', (documentId || 'Document') + ' is available as a mock item in this frontend demo. No real file was downloaded.', 'info');
}

function leadReviewChecklistDownloadText(auditId) {
  var rows = typeof leadReviewAllRows === 'function' ? leadReviewAllRows() : [];
  var lines = [
    'AviaSurveil360 - Lead Inspector Checklist Review',
    'Inspection: ' + (auditId || 'INS-2026-015'),
    'Audit: SMS Oversight Audit',
    'Organization: SkyCargo Air',
    'Inspector: John Inspector',
    ''
  ];
  rows.forEach(function (row) {
    var meta = INSPECTOR_EXECUTION_STATUS_META[row.status] || INSPECTOR_EXECUTION_STATUS_META.na;
    lines.push(row.no + ' [' + meta.label + '] ' + row.item);
    lines.push('  Lead review: ' + leadReviewRowDecision(row));
    var comment = leadReviewRowComment(row);
    if (comment) lines.push('  Lead comment: ' + comment);
    if (row.files && row.files.length) lines.push('  Files: ' + row.files.join(', '));
  });
  return lines.join('\n');
}

function leadReportDownloadText(auditId) {
  var ui = ensureLeadReviewUi();
  return [
    'AviaSurveil360 - SMS Oversight Audit Report (Draft)',
    'Inspection: ' + (auditId || 'INS-2026-015'),
    'Organization: SkyCargo Air',
    'Inspection Type: Routine Inspection',
    'Lead Inspector: John Lead Inspector',
    'Report Version: 1.0 (Draft)',
    'Checklist Progress: 60 / 60 (100%)',
    'Approval Chain: Inspector -> Preliminary Report -> Lead Inspector Review -> Department Manager Review -> Preliminary Report Released to Service Provider if CAP required -> Service Provider CAP Completion -> Lead Inspector Finalizes Report -> Department Manager Final Approval -> Executive Director / GM Approval -> Final Report Issued -> CAP Process Starts -> Inspector verifies CAP -> Lead Inspector recommends closure -> Department Manager approves closure',
    '',
    'Executive Summary',
    'The inspection was conducted between 15 - 18 Jun 2026 at SkyCargo Air facilities as part of the scheduled routine inspection.',
    'Overall, the organization demonstrates a satisfactory level of compliance, with corrective actions required for identified findings.',
    '',
    'Findings Summary',
    'Total Findings: 8 (2 Level 1, 3 Level 2, 3 Observations)',
    'CAPs Raised: 5',
    'Level 1 findings: CAP closure due in 14 days.',
    'Level 2 findings: CAP closure due in 90 days.',
    'Observations: No CAP required.',
    '',
    'Service Provider Release',
    'After Executive Director / GM approval, the final report is issued to the service provider and the CAP Process Starts with the above CAP closure deadlines.',
    '',
    'Workflow Comment',
    ui.workflowComment || 'No workflow comment entered.'
  ].join('\n');
}

function downloadLeadReportDraft(auditId) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
  var blob = new Blob([leadReportDownloadText(auditId)], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'SMS_Oversight_Audit_Report_Draft.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 0);
}

function downloadLeadReviewChecklist(auditId) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return;
  var text = leadReviewChecklistDownloadText(auditId);
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'SMS_Oversight_Audit_Lead_Review.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 0);
}

function handleLeadReviewDownload(auditId) {
  var ui = ensureLeadReviewUi();
  ui.downloadedAt = new Date().toISOString();
  addLog('Lead report draft download simulated', auditId || 'INS-2026-015');
  persistAfterAction();
  downloadLeadReportDraft(auditId || 'INS-2026-015');
  render();
  toast('Report draft ready', 'Draft report was prepared for download in this browser.', 'ok');
}

function handleLeadReportGenerate(auditId) {
  var ui = ensureLeadReviewUi();
  ui.reportGeneratedAt = new Date().toISOString();
  ui.reportDraftSavedAt = ui.reportDraftSavedAt || ui.reportGeneratedAt;
  ui.tab = 'report';
  ui.actionsOpen = false;
  addLog('Lead preliminary report draft generated', auditId || 'INS-2026-015');
  persistAfterAction();
  render();
  toast('Preliminary report draft generated', 'System generated the preliminary report draft for Lead Inspector review.', 'ok');
}

function handleLeadReportPreview(auditId) {
  var ui = ensureLeadReviewUi();
  ui.actionsOpen = false;
  persistAfterAction();
  openModal(modalShell('Preliminary report preview',
    '<div class="lead-preview-modal">' +
      '<h3>Preliminary Report - Routine Inspection</h3>' +
      '<p class="muted">SkyCargo Air · INS-2026-015 · Draft v1.0</p>' +
      '<p>The report consolidates 8 findings, CAP requirements, evidence references, and Lead Inspector conclusions before Department Manager review and any required Service Provider CAP completion.</p>' +
      '<div class="lead-preview-deadlines"><span>Level 1: 14 days</span><span>Level 2: 90 days</span><span>Observation: No CAP</span></div>' +
      '<p class="small muted">After Department Manager review, the Service Provider receives the Preliminary Report only if CAP is required. After CAP completion within the window, the Lead Inspector prepares the Final Report.</p>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button><button class="btn btn--primary" data-act="lead-report-send-unit-manager" data-id="' + esc(auditId || 'INS-2026-015') + '">Submit to Department Manager</button>',
    false));
}

function handleLeadReportSaveDraft(auditId) {
  var ui = ensureLeadReviewUi();
  ui.reportDraftSavedAt = new Date().toISOString();
  ui.reportGeneratedAt = ui.reportGeneratedAt || ui.reportDraftSavedAt;
  ui.tab = 'report';
  ui.actionsOpen = false;
  addLog('Lead preliminary report draft saved', auditId || 'INS-2026-015');
  persistAfterAction();
  render();
  toast('Draft saved', 'Preliminary report draft was saved in this browser for the demo.', 'ok');
}

function handleLeadReportActionsToggle() {
  var ui = ensureLeadReviewUi();
  ui.actionsOpen = !ui.actionsOpen;
  persistAfterAction();
  render();
}

function handleLeadReportSendUnitManager(auditId) {
  var ui = ensureLeadReviewUi();
  var report = reportForAudit('AUD-2026-005') || (state.auditReports && state.auditReports[0]);
  if (report && report.approval && approvalSummary(report).ownerRole !== 'leadInspector') {
    if (ui.sentToUnitManagerAt) {
      ui.tab = 'report';
      ui.actionsOpen = false;
      persistAfterAction();
      closeModal();
      render();
      toast('Already sent', 'This report is already in the Department Manager review queue.', 'info');
      return;
    }
    report.approval.currentIndex = 0;
    report.approval.outcome = null;
    report.status = 'draft';
  }
  try {
    if (report) {
      applyReportApprovalDecision(report, {
        decision: 'forward',
        actor: { role: 'leadInspector', name: ROLES.leadInspector.user },
        comment: ui.workflowComment || 'Preliminary report draft prepared and sent to Department Manager review before any required Service Provider CAP completion.'
      });
    }
    ui.sentToUnitManagerAt = new Date().toISOString();
    ui.reportGeneratedAt = ui.reportGeneratedAt || ui.sentToUnitManagerAt;
    ui.reportDraftSavedAt = ui.reportDraftSavedAt || ui.sentToUnitManagerAt;
    ui.tab = 'report';
    ui.actionsOpen = false;
    addLog('Preliminary report sent to Department Manager', auditId || 'INS-2026-015');
    pushNotification('manager', 'RPT', 'SMS Oversight Audit preliminary report draft is waiting for Department Manager review.');
    persistAfterAction();
    closeModal();
    render();
    toast('Sent to Department Manager', 'Preliminary report draft moved to Department Manager review.', 'ok');
  } catch (err) {
    toast('Send unavailable', err && err.message ? err.message : 'Report could not be sent to Department Manager.', 'warn');
  }
}

function handleLeadReviewFinalize(auditId) {
  var ui = ensureLeadReviewUi();
  var rows = typeof leadReviewAllRows === 'function' ? leadReviewAllRows() : [];
  var returnedRows = rows.filter(function (row) { return leadReviewRowDecision(row) === 'return'; });
  var emptyReturn = returnedRows.filter(function (row) { return !leadReviewRowComment(row).trim(); });
  if (emptyReturn.length) {
    toast('Comment required', 'Add a return comment before sending checklist items back.', 'warn');
    return;
  }
  ui.finalizedAt = new Date().toISOString();
  addLog(returnedRows.length ? 'Lead review sent back' : 'Lead review finalized', auditId || 'INS-2026-015');
  if (returnedRows.length) {
    pushNotification('inspector', 'REV', 'Lead Inspector returned ' + returnedRows.length + ' checklist item(s) for revision.');
    toast('Review sent back', returnedRows.length + ' checklist item(s) were returned to the inspector.', 'warn');
  } else {
    pushNotification('manager', 'OK', 'Lead Inspector finalized SMS Oversight Audit review.');
    toast('Review finalized', 'All checklist items were accepted for the next review step.', 'ok');
  }
  persistAfterAction();
  render();
}

function handleLeadReviewFile(rowId, fileName) {
  var row = typeof leadReviewRowById === 'function' ? leadReviewRowById(rowId) : null;
  if (!row) return;
  openModal(modalShell('Attached file', '<p><b>' + esc(fileName || 'Attached file') + '</b></p>' +
    '<p class="muted">This demo previews the attachment record only. No real file is downloaded or stored.</p>' +
    '<p class="small muted mt-12">' + esc(row.no + ' · ' + row.item) + '</p>',
    '<button class="btn" data-act="close-modal">Close</button>' +
      '<button class="btn btn--primary" data-act="lead-review-file-download" data-id="' + esc(row.id) + '" data-file="' + esc(fileName || '') + '">Download Mock File</button>',
    false));
}

function leadReviewAttachmentDownloadText(row, fileName) {
  var meta = INSPECTOR_EXECUTION_STATUS_META[row.status] || INSPECTOR_EXECUTION_STATUS_META.na;
  return [
    'AviaSurveil360 - Mock Attachment Download',
    '',
    'Original file name: ' + fileName,
    'Inspection: INS-2026-015',
    'Audit: SMS Oversight Audit',
    'Organization: SkyCargo Air',
    'Checklist item: ' + row.no + ' - ' + row.item,
    'Compliance: ' + meta.label,
    'Lead review decision: ' + leadReviewRowDecision(row),
    'Lead review comment: ' + (leadReviewRowComment(row) || 'No comment entered.'),
    '',
    'Demo boundary',
    'This generated text file represents the mock attachment record in the frontend-only demo.',
    'The demo stores file names only; no real document content, upload service, or evidence repository is included.'
  ].join('\n');
}

function handleLeadReviewFileDownload(rowId, fileName) {
  var row = typeof leadReviewRowById === 'function' ? leadReviewRowById(rowId) : null;
  if (!row) return;
  var file = fileName || (row.files && row.files.length ? row.files[0] : '');
  if (!file) {
    toast('No attachment', 'This checklist row has no mock attachment to download.', 'warn');
    return;
  }
  var downloaded = downloadPlainTextFile(mockAttachmentDownloadFileName(file), leadReviewAttachmentDownloadText(row, file));
  addLog('Lead review attachment download simulated', file);
  toast(downloaded ? 'Attachment downloaded' : 'Download unavailable',
    downloaded ? file + ' was generated as a mock download in this browser.' : 'This browser does not support client-side mock downloads.',
    downloaded ? 'ok' : 'warn');
}

function handleMockChecklistEvidence(q) {
  if (!state.checklistAnswers[q]) state.checklistAnswers[q] = {};
  state.checklistAnswers[q].evidenceFiles = ['PBE_Cabin_Position_Photo.jpg'];
  toast('Mock evidence selected', 'PBE_Cabin_Position_Photo.jpg attached as a file name only. No upload or storage occurs.', 'ok');
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
      title: val('pf-title-' + id) || 'PBE not serviceable or not accessible in cabin emergency equipment check'
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
  var id = 'CAB-2026-' + String(state.findingSeq).padStart(3, '0');

  var internalNote = val('fd-internal');
  var trace = regulatoryTraceForQuestion(q);
  var finding = {
    id: id,
    title: val('fd-title') || 'Checklist non-compliance',
    description: val('fd-desc') || '',
    orgId: a.orgId,
    auditId: a.id,
    severity: parseInt(val('fd-sev') || '2', 10),
    riskCategory: item && item.riskCategory ? item.riskCategory : '',
    findingType: item && item.findingType ? item.findingType : '',
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

function ensureCapReviewUi() {
  if (!state.capReviewUi) {
    state.capReviewUi = {
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
      findingDecisions: {}
    };
  }
  if (!state.capReviewUi.expandedId) state.capReviewUi.expandedId = 'F-014-02';
  if (!state.capReviewUi.tab) state.capReviewUi.tab = 'cap';
  if (!state.capReviewUi.status) state.capReviewUi.status = 'all';
  if (!state.capReviewUi.due) state.capReviewUi.due = 'all';
  if (!state.capReviewUi.organization) state.capReviewUi.organization = 'all';
  if (!state.capReviewUi.level) state.capReviewUi.level = 'all';
  if (state.capReviewUi.query === undefined || state.capReviewUi.query === null) state.capReviewUi.query = '';
  if (!state.capReviewUi.selectedProviderId) state.capReviewUi.selectedProviderId = 'skycargo-air';
  if (state.capReviewUi.decision === undefined || state.capReviewUi.decision === null) state.capReviewUi.decision = '';
  if (state.capReviewUi.comment === undefined || state.capReviewUi.comment === null) state.capReviewUi.comment = '';
  if (!state.capReviewUi.findingDecisions || typeof state.capReviewUi.findingDecisions !== 'object') state.capReviewUi.findingDecisions = {};
  return state.capReviewUi;
}

function handleCapReviewProvider(id) {
  var ui = ensureCapReviewUi();
  ui.selectedProviderId = id || 'skycargo-air';
  ui.organization = id || 'all';
  ui.status = 'all';
  ui.due = 'all';
  ui.level = 'all';
  ui.query = '';
  ui.expandedId = '';
  ui.tab = 'cap';
  persistAfterAction();
  render();
}

function handleCapReviewRow(id) {
  var ui = ensureCapReviewUi();
  var changed = ui.expandedId !== id;
  ui.expandedId = id || ui.expandedId || 'F-014-02';
  if (changed || !ui.tab) ui.tab = 'cap';
  ui.decision = '';
  ui.comment = '';
  persistAfterAction();
  render();
}

function handleCapReviewTab(id, tab) {
  var ui = ensureCapReviewUi();
  ui.expandedId = id || ui.expandedId;
  ui.tab = tab || 'details';
  ui.findingTabChosen = true;
  persistAfterAction();
  render();
}

function handleInspectorFindingNew() {
  openModal(modalShell('New finding',
    '<p class="modal__intro">New findings are created from the inspection checklist when an item is marked Non-Compliant.</p>' +
      '<p class="muted">Demo shortcut: use the SMS Oversight Audit checklist, set a row to Non-Compliant, and it will appear here with CAP required.</p>',
    '<button class="btn" data-act="close-modal">Close</button>' +
      '<button class="btn btn--primary" data-act="nav" data-view="audit-detail" data-id="AUD-2026-005">Open Checklist</button>', false));
}

function handleInspectorFindingFilterToggle() {
  var ui = ensureCapReviewUi();
  ui.filtersOpen = ui.filtersOpen === false;
  persistAfterAction();
  render();
}

function handleInspectorFindingEdit(id) {
  var ui = ensureCapReviewUi();
  var findingId = id || ui.expandedId || 'F-014-02';
  openModal(modalShell('Edit finding',
    '<p class="modal__intro"><b>' + esc(findingId) + '</b> is edited from the checklist finding record in this demo.</p>' +
      '<p class="muted">The Inspector can update the finding details before reminding the service provider, while CAP evidence remains versioned in the finding workspace.</p>',
    '<button class="btn" data-act="close-modal">Close</button>' +
      '<button class="btn btn--primary" data-act="cap-review-tab" data-id="' + esc(findingId) + '" data-tab="details">Open Details</button>', false));
}

function handleInspectorFindingSubmitRevised(id) {
  var ui = ensureCapReviewUi();
  var findingId = id || ui.expandedId || 'F-014-03';
  ui.expandedId = findingId;
  ui.tab = 'cap';
  ui.findingDecisions[findingId] = {
    decision: 'resubmitted',
    at: logTimestamp()
  };
  addLog('Service provider resubmitted CAP package in Findings workspace', findingId);
  persistAfterAction();
  render();
  toast('Revised CAP submitted', findingId + ' is ready for inspector verification.', 'ok');
}

function handleInspectorFindingDecision(id, decision) {
  var ui = ensureCapReviewUi();
  var findingId = id || ui.expandedId || 'F-014-02';
  if (!ui.findingDecisions || typeof ui.findingDecisions !== 'object') ui.findingDecisions = {};
  ui.findingDecisions[findingId] = {
    decision: decision,
    at: logTimestamp()
  };
  ui.expandedId = findingId;
  ui.tab = 'cap';
  addLog(decision === 'accept' ? 'Inspector accepted CAP from Findings workspace' : 'Inspector returned CAP from Findings workspace', findingId);
  if (decision === 'accept') {
    pushNotification('auditee', 'OK', 'Inspector accepted the CAP for ' + findingId + '.');
    persistAfterAction();
    render();
    toast('CAP accepted', findingId + ' is marked accepted in this demo workspace.', 'ok');
  } else {
    pushNotification('auditee', 'REV', 'Inspector returned the CAP for ' + findingId + ' with revision comments.');
    persistAfterAction();
    render();
    toast('Returned for revision', findingId + ' is back with the service provider for revision.', 'warn');
  }
}

function handleCapReviewQuickFilter(status) {
  var ui = ensureCapReviewUi();
  ui.status = status || 'all';
  ui.query = val('cap-review-search') || ui.query || '';
  persistAfterAction();
  render();
}

function handleCapReviewApplyFilters() {
  var ui = ensureCapReviewUi();
  ui.query = val('cap-review-search');
  persistAfterAction();
  render();
}

function handleCapReviewClear() {
  var ui = ensureCapReviewUi();
  ui.status = 'all';
  ui.due = 'all';
  ui.organization = 'all';
  ui.level = 'all';
  ui.query = '';
  ui.tab = 'cap';
  ui.findingTabChosen = false;
  ui.decision = '';
  ui.comment = '';
  persistAfterAction();
  render();
}

function updateCapReviewSubmitState(id) {
  if (!document.querySelectorAll) return;
  var ui = ensureCapReviewUi();
  var disabled = !ui.decision || (ui.decision === 'return' && !ui.comment.trim());
  var buttons = document.querySelectorAll('[data-act="cap-review-submit-decision"]');
  Array.prototype.forEach.call(buttons, function (button) {
    if (button.getAttribute('data-id') === id) button.disabled = disabled;
  });
  var counters = document.querySelectorAll('.cap-review-count');
  Array.prototype.forEach.call(counters, function (counter) {
    if (counter.closest && counter.closest('.cap-review-decision')) {
      counter.textContent = ui.comment.length + ' / 1000';
    }
  });
}

function handleCapReviewFieldChange(field, target) {
  var ui = ensureCapReviewUi();
  if (field === 'cap-review-status') {
    ui.status = target.value || 'all';
    persistAfterAction();
    render();
    return;
  }
  if (field === 'cap-review-organization') {
    ui.organization = target.value || 'all';
    ui.selectedProviderId = ui.organization === 'all' ? 'skycargo-air' : ui.organization;
    persistAfterAction();
    render();
    return;
  }
  if (field === 'cap-review-level') {
    ui.level = target.value || 'all';
    persistAfterAction();
    render();
    return;
  }
  if (field === 'cap-review-due') {
    ui.due = target.value || 'all';
    persistAfterAction();
    render();
    return;
  }
  if (field === 'cap-review-search') {
    ui.query = target.value || '';
    persistAfterAction();
    render();
    return;
  }
  if (field === 'cap-review-decision') {
    ui.expandedId = target.getAttribute('data-id') || ui.expandedId;
    ui.decision = target.value || '';
    persistAfterAction();
    render();
  }
}

function handleCapReviewCommentInput(target) {
  var ui = ensureCapReviewUi();
  ui.expandedId = target.getAttribute('data-id') || ui.expandedId;
  ui.comment = target.value || '';
  persistAfterAction();
  updateCapReviewSubmitState(ui.expandedId);
}

function handleCapReviewSubmitDecision(id) {
  var f = findingById(id);
  if (!f || !f.cap) return;
  var ui = ensureCapReviewUi();
  var decision = ui.decision;
  var comment = (ui.comment || '').trim();
  if (!decision) {
    toast('Decision required', 'Choose Accept CAP or Return for Revision before submitting.', 'warn');
    return;
  }
  if (decision === 'return' && !comment) {
    toast('Comment required', 'Add a reason before returning the CAP for revision.', 'warn');
    return;
  }
  if (comment) {
    f.commentsToAuditee.push({ author: currentActorLabel(), date: DEMO_TODAY, text: comment });
  }
  if (decision === 'accept') {
    f.cap.status = 'Accepted';
    if (f.capRevisions && f.capRevisions.length) f.capRevisions[f.capRevisions.length - 1].status = V2_STATUS.accepted;
    f.status = 'EVIDENCE_REQUIRED';
    addLog('CAP accepted', id);
    pushNotification('auditee', 'OK', 'Your CAP for ' + id + ' was accepted. Please upload evidence that the action is complete.');
    toast('CAP accepted', 'Finding stays open until required evidence is accepted.', 'ok');
  } else {
    f.cap.status = 'More Information Requested';
    if (f.capRevisions && f.capRevisions.length) f.capRevisions[f.capRevisions.length - 1].status = 'more_information_requested';
    f.status = 'CAP_MORE_INFO';
    addLog('CAP returned for revision', id);
    pushNotification('auditee', 'REV', 'The CAA requested a CAP revision for ' + id + '.');
    toast('Returned for revision', 'The CAP was sent back with your comment.', 'warn');
  }
  ui.decision = '';
  ui.comment = '';
  ui.tab = 'details';
  persistAfterAction();
  render();
}

function handleCapReviewEvidence(id, fileName) {
  var f = findingById(id);
  var title = (f && f.title) || id || 'Finding';
  openModal(modalShell('Evidence file', '<p><b>' + esc(fileName || 'Evidence file') + '</b></p>' +
    '<p class="muted">Linked finding: ' + esc(title) + '. This demo opens the evidence record only. No real file is downloaded or stored.</p>',
    '<button class="btn" data-act="close-modal">Close</button>', false));
}

function ensureCapTrackingUi() {
  if (!state.capTrackingUi) {
    state.capTrackingUi = {
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
      leadDecision: 'recommend_closure',
      leadComments: 'The corrective and preventive actions adequately address the root cause. Evidence provided is satisfactory. Recommend closure.',
      unitEffectiveness: 'partially_effective',
      unitRecommendationType: 'administrative_penalty',
      unitRecommendationLevel: 'administrative_penalty',
      unitComplianceDueDate: '2026-09-20',
      unitJustification: 'The CAP has initiated corrective actions; however, updated training records are still incomplete for multiple staff members. Therefore, an administrative penalty is recommended to ensure timely compliance.',
      unitAttachmentName: '',
      unitManagerRecommendationAt: '',
      departmentManagerApprovedAt: '',
      findingClosedAt: '',
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
  }
  if (['overview', 'timeline', 'communications', 'documents'].indexOf(state.capTrackingUi.tab) === -1) {
    state.capTrackingUi.tab = 'overview';
  }
  if (['details', 'cap', 'evaluation', 'attachments', 'evidence', 'assessment', 'history', 'communications', 'documents', 'enforcement'].indexOf(state.capTrackingUi.detailTab) === -1) {
    state.capTrackingUi.detailTab = 'details';
  }
  if (state.capTrackingUi.reminderSentAt === undefined || state.capTrackingUi.reminderSentAt === null) state.capTrackingUi.reminderSentAt = '';
  if (state.capTrackingUi.exportedAt === undefined || state.capTrackingUi.exportedAt === null) state.capTrackingUi.exportedAt = '';
  if (state.capTrackingUi.selectedFindingId === undefined || state.capTrackingUi.selectedFindingId === null) state.capTrackingUi.selectedFindingId = '';
  if (!state.capTrackingUi.reviewStatus) state.capTrackingUi.reviewStatus = 'not_effective';
  if (state.capTrackingUi.reviewComments === undefined || state.capTrackingUi.reviewComments === null) state.capTrackingUi.reviewComments = '';
  if (!state.capTrackingUi.reviewOutcome) state.capTrackingUi.reviewOutcome = 'needs_action';
  if (!state.capTrackingUi.enforcementLevel || state.capTrackingUi.enforcementLevel === 'level2') state.capTrackingUi.enforcementLevel = 'administrative_penalty';
  if (state.capTrackingUi.enforcementJustification === undefined || state.capTrackingUi.enforcementJustification === null) state.capTrackingUi.enforcementJustification = '';
  if (state.capTrackingUi.internalComment === undefined || state.capTrackingUi.internalComment === null) state.capTrackingUi.internalComment = '';
  if (state.capTrackingUi.inspectorReviewSentAt === undefined || state.capTrackingUi.inspectorReviewSentAt === null) state.capTrackingUi.inspectorReviewSentAt = '';
  if (!state.capTrackingUi.inspectorRootCause) state.capTrackingUi.inspectorRootCause = 'yes';
  if (!state.capTrackingUi.inspectorActions) state.capTrackingUi.inspectorActions = 'yes';
  if (!state.capTrackingUi.inspectorEvidence) state.capTrackingUi.inspectorEvidence = 'yes';
  if (!state.capTrackingUi.inspectorImplementation) state.capTrackingUi.inspectorImplementation = 'yes';
  if (!state.capTrackingUi.inspectorOnsite) state.capTrackingUi.inspectorOnsite = 'no';
  if (!state.capTrackingUi.inspectorAssessment) state.capTrackingUi.inspectorAssessment = 'acceptable';
  if (state.capTrackingUi.inspectorComments === undefined || state.capTrackingUi.inspectorComments === null) state.capTrackingUi.inspectorComments = 'The CAP adequately addresses the root cause. Evidence provided is sufficient and implementation has been verified through records. No on-site verification is required.';
  if (!state.capTrackingUi.inspectorReviewDate) state.capTrackingUi.inspectorReviewDate = '2025-05-19';
  if (state.capTrackingUi.leadInspectorRecommendationAt === undefined || state.capTrackingUi.leadInspectorRecommendationAt === null) state.capTrackingUi.leadInspectorRecommendationAt = '';
  if (!state.capTrackingUi.leadDecision) state.capTrackingUi.leadDecision = 'recommend_closure';
  if (state.capTrackingUi.leadComments === undefined || state.capTrackingUi.leadComments === null) state.capTrackingUi.leadComments = 'The corrective and preventive actions adequately address the root cause. Evidence provided is satisfactory. Recommend closure.';
  if (!state.capTrackingUi.unitEffectiveness) state.capTrackingUi.unitEffectiveness = 'partially_effective';
  if (!state.capTrackingUi.unitRecommendationType) state.capTrackingUi.unitRecommendationType = 'administrative_penalty';
  if (!state.capTrackingUi.unitRecommendationLevel || state.capTrackingUi.unitRecommendationLevel === 'level2') state.capTrackingUi.unitRecommendationLevel = 'administrative_penalty';
  if (!state.capTrackingUi.unitComplianceDueDate) state.capTrackingUi.unitComplianceDueDate = '2026-09-20';
  if (state.capTrackingUi.unitJustification === undefined || state.capTrackingUi.unitJustification === null) state.capTrackingUi.unitJustification = '';
  if (state.capTrackingUi.unitAttachmentName === undefined || state.capTrackingUi.unitAttachmentName === null) state.capTrackingUi.unitAttachmentName = '';
  if (state.capTrackingUi.unitManagerRecommendationAt === undefined || state.capTrackingUi.unitManagerRecommendationAt === null) state.capTrackingUi.unitManagerRecommendationAt = '';
  if (state.capTrackingUi.departmentManagerApprovedAt === undefined || state.capTrackingUi.departmentManagerApprovedAt === null) state.capTrackingUi.departmentManagerApprovedAt = '';
  if (state.capTrackingUi.findingClosedAt === undefined || state.capTrackingUi.findingClosedAt === null) state.capTrackingUi.findingClosedAt = '';
  if (state.capTrackingUi.inspectorPackageDecision === undefined || state.capTrackingUi.inspectorPackageDecision === null) state.capTrackingUi.inspectorPackageDecision = '';
  if (!state.capTrackingUi.inspectorPackageEvaluation) state.capTrackingUi.inspectorPackageEvaluation = 'acceptable';
  if (state.capTrackingUi.inspectorPackageComment === undefined || state.capTrackingUi.inspectorPackageComment === null) state.capTrackingUi.inspectorPackageComment = '';
  if (state.capTrackingUi.inspectorPackageAcceptedAt === undefined || state.capTrackingUi.inspectorPackageAcceptedAt === null) state.capTrackingUi.inspectorPackageAcceptedAt = '';
  if (state.capTrackingUi.allCapsApprovedAt === undefined || state.capTrackingUi.allCapsApprovedAt === null) state.capTrackingUi.allCapsApprovedAt = '';
  if (state.capTrackingUi.finalReportReadyAt === undefined || state.capTrackingUi.finalReportReadyAt === null) state.capTrackingUi.finalReportReadyAt = '';
  if (state.capTrackingUi.finalReportPreparedAt === undefined || state.capTrackingUi.finalReportPreparedAt === null) state.capTrackingUi.finalReportPreparedAt = '';
  if (!state.capTrackingUi.finalReportPrepareStep) state.capTrackingUi.finalReportPrepareStep = 'executive';
  if (state.capTrackingUi.finalReportContent === undefined || state.capTrackingUi.finalReportContent === null) state.capTrackingUi.finalReportContent = '';
  if (state.capTrackingUi.finalReportSavedAt === undefined || state.capTrackingUi.finalReportSavedAt === null) state.capTrackingUi.finalReportSavedAt = '';
  if (state.capTrackingUi.finalReportSubmittedAt === undefined || state.capTrackingUi.finalReportSubmittedAt === null) state.capTrackingUi.finalReportSubmittedAt = '';
  if (state.capTrackingUi.secondReportPreparedAt === undefined || state.capTrackingUi.secondReportPreparedAt === null) state.capTrackingUi.secondReportPreparedAt = '';
  if (state.capTrackingUi.submittedToUnitManagerAt === undefined || state.capTrackingUi.submittedToUnitManagerAt === null) state.capTrackingUi.submittedToUnitManagerAt = '';
  if (state.capTrackingUi.submittedToGeneralManagerAt === undefined || state.capTrackingUi.submittedToGeneralManagerAt === null) state.capTrackingUi.submittedToGeneralManagerAt = '';
  return state.capTrackingUi;
}

function handleCapTrackingTab(tab) {
  var ui = ensureCapTrackingUi();
  ui.tab = tab || 'overview';
  persistAfterAction();
  render();
}

function handleCapTrackingReminder() {
  var ui = ensureCapTrackingUi();
  ui.reminderSentAt = logTimestamp();
  pushNotification('auditee', 'CAP', 'SkyCargo Air received a CAP reminder for the issued final report package.');
  addLog('CAP reminder sent to service provider', 'INS-2026-015');
  persistAfterAction();
  render();
  toast('Reminder sent', 'SkyCargo Air was reminded to submit CAPs within the Level 1 and Level 2 deadlines.', 'ok');
}

function handleCapTrackingViewReport() {
  openModal(modalShell('Final report distribution', '' +
    '<div class="lead-preview-modal">' +
      '<p><b>SMS Oversight Audit Final Report</b> was issued after Executive Director / GM approval on <b>22 Jun 2026</b>.</p>' +
      '<p>The system automatically sent the issued final report and CAP request package to <b>SkyCargo Air</b>. Inspectors now track every required corrective action from this CAP Tracking screen.</p>' +
      '<div class="lead-preview-deadlines"><span>Level 1: 14 days</span><span>Level 2: 90 days</span><span>Observation: No CAP</span></div>' +
    '</div>',
    '<button class="btn" data-act="close-modal">Close</button>' +
    '<button class="btn btn--primary" data-act="cap-track-quick-action" data-track-action="documents">Open Documents</button>', true));
}

function handleCapTrackingExport() {
  var ui = ensureCapTrackingUi();
  ui.exportedAt = logTimestamp();
  persistAfterAction();
  render();
  toast('CAP status report ready', 'A demo CAP tracking export was prepared in this browser. No real file was generated.', 'ok');
}

function handleCapTrackingRowAction(id, action) {
  var ui = ensureCapTrackingUi();
  ui.selectedFindingId = id || '';
  persistAfterAction();
  var labels = {
    review: 'Review CAP',
    view: 'View CAP',
    finding: 'View Finding',
    escalate: 'Escalate overdue CAP',
    pending: 'CAP not submitted',
    menu: 'Finding actions'
  };
  var title = labels[action] || 'CAP tracking action';
  if (action === 'pending') {
    toast('Not submitted yet', id + ' is still waiting for the service provider CAP submission.', 'info');
    return;
  }
  if (action === 'review' || action === 'view' || action === 'finding') {
    ui.detailTab = 'details';
    persistAfterAction();
    go('cap-review-detail', { findingId: id });
    return;
  }
  if (action === 'escalate') {
    openModal(modalShell(title, '' +
      '<p><b>' + esc(id) + '</b> is overdue against the Level 1 CAP deadline.</p>' +
      '<p class="muted">Escalation is staged for the demo. Real enforcement or legal action would require the configured approval route.</p>',
      '<button class="btn" data-act="close-modal">Close</button>' +
      '<button class="btn btn--primary" data-act="cap-track-reminder">Send Reminder First</button>', false));
    return;
  }
  openModal(modalShell(title, '' +
    '<p><b>' + esc(id || 'Finding') + '</b> is tracked under the issued final report sent to SkyCargo Air after Executive Director / GM approval.</p>' +
    '<p class="muted">This demo opens a review summary only. CAP decisions and evidence closure remain in the inspector review workflow.</p>',
    '<button class="btn" data-act="close-modal">Close</button>', false));
}

function handleCapDetailTab(tab) {
  var ui = ensureCapTrackingUi();
  ui.detailTab = tab || 'details';
  persistAfterAction();
  render();
}

function handleCapDetailFieldChange(field, target) {
  var ui = ensureCapTrackingUi();
  var value = target && target.value !== undefined ? target.value : '';
  if (field === 'cap-detail-review-status') ui.reviewStatus = value || 'not_effective';
  if (field === 'cap-detail-review-comments') ui.reviewComments = value;
  if (field === 'cap-detail-review-outcome') ui.reviewOutcome = value || 'needs_action';
  if (field === 'cap-detail-enforcement-level') ui.enforcementLevel = value || 'administrative_penalty';
  if (field === 'cap-detail-enforcement-justification') ui.enforcementJustification = value;
  if (field === 'cap-detail-internal-comment') ui.internalComment = value;
  if (field === 'cap-unit-effectiveness') ui.unitEffectiveness = value || 'partially_effective';
  if (field === 'cap-unit-recommendation-type') ui.unitRecommendationType = value || 'administrative_penalty';
  if (field === 'cap-unit-recommendation-level') ui.unitRecommendationLevel = value || 'administrative_penalty';
  if (field === 'cap-unit-compliance-due-date') ui.unitComplianceDueDate = value || '2026-09-20';
  if (field === 'cap-unit-justification') ui.unitJustification = value;
  if (field === 'cap-inspector-root-cause') ui.inspectorRootCause = value || 'yes';
  if (field === 'cap-inspector-actions') ui.inspectorActions = value || 'yes';
  if (field === 'cap-inspector-evidence') ui.inspectorEvidence = value || 'yes';
  if (field === 'cap-inspector-implementation') ui.inspectorImplementation = value || 'yes';
  if (field === 'cap-inspector-onsite') ui.inspectorOnsite = value || 'no';
  if (field === 'cap-inspector-assessment') ui.inspectorAssessment = value || 'acceptable';
  if (field === 'cap-inspector-comments') ui.inspectorComments = value;
  if (field === 'cap-inspector-review-date') ui.inspectorReviewDate = value || '2025-05-19';
  if (field === 'cap-lead-decision') ui.leadDecision = value || 'recommend_closure';
  if (field === 'cap-lead-comments') ui.leadComments = value;
  persistAfterAction();
  if (target && (target.tagName === 'SELECT' || target.type === 'radio')) render();
}

function handleCapDetailDownloadFinding(id) {
  ensureCapTrackingUi().selectedFindingId = id || ensureCapTrackingUi().selectedFindingId || 'F-2026-002';
  persistAfterAction();
  toast('Finding package ready', 'A demo finding packet would be downloaded for ' + (id || 'the selected finding') + '. No real file was generated.', 'ok');
}

function handleCapDetailPrepareSecondReport(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  ui.inspectorReviewSentAt = logTimestamp();
  ui.leadInspectorRecommendationAt = '';
  ui.submittedToUnitManagerAt = '';
  pushNotification('leadInspector', 'CAP', 'Inspector CAP review for ' + findingId + ' is ready for Lead Inspector recommendation.');
  addLog('Inspector CAP review sent to Lead Inspector', findingId);
  persistAfterAction();
  render();
  toast('Sent to Lead Inspector', findingId + ' was sent to the Lead Inspector recommendation stage in this demo.', 'ok');
}

function handleCapDetailRequestRevision(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  ui.inspectorAssessment = 'request_revision';
  ui.reviewOutcome = 'needs_action';
  ui.reviewStatus = 'not_effective';
  pushNotification('auditee', 'CAP', 'Inspector requested a CAP revision for ' + findingId + '.');
  addLog('Inspector requested CAP revision', findingId);
  persistAfterAction();
  render();
  toast('Revision requested', 'The service provider would receive a CAP revision request in this demo.', 'warn');
}

function handleCapDetailRequestMoreEvidence(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  ui.inspectorAssessment = 'request_more_evidence';
  ui.reviewOutcome = 'needs_action';
  pushNotification('auditee', 'CAP', 'Inspector requested more CAP evidence for ' + findingId + '.');
  addLog('Inspector requested more CAP evidence', findingId);
  persistAfterAction();
  render();
  toast('More evidence requested', 'The service provider would receive an evidence request in this demo.', 'warn');
}

function handleInspectorCapPackageDecision(id, decision) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-014-01';
  var comment = val('inspector-cap-package-comment');
  var evaluation = val('inspector-cap-package-evaluation') || 'acceptable';
  ui.selectedFindingId = findingId;
  ui.inspectorPackageDecision = decision;
  ui.inspectorPackageEvaluation = evaluation;
  ui.inspectorPackageComment = comment;
  ui.inspectorReviewSentAt = logTimestamp();
  if (decision === 'accept') {
    ui.inspectorPackageAcceptedAt = '30 Jun 2026 10:15';
    ui.leadInspectorRecommendationAt = '30 Jun 2026 11:40';
    ui.submittedToUnitManagerAt = '30 Jun 2026 11:40';
    ui.departmentManagerApprovedAt = '30 Jun 2026 13:05';
    ui.submittedToGeneralManagerAt = '30 Jun 2026 14:30';
    ui.finalReportReadyAt = '30 Jun 2026 16:20';
    ui.allCapsApprovedAt = '30 Jun 2026 16:20';
    ui.finalReportPreparedAt = '';
    pushNotification('leadInspector', 'OK', 'All CAPs for INS-2026-014 are approved. Final Report is ready for preparation.');
    addLog('Inspector accepted CAP and final report became ready', findingId);
    state.role = 'leadInspector';
    persistAfterAction();
    go('audit-reports', { filter: 'final', auditId: '' });
    toast('CAP accepted', 'Lead Inspector Final Reports now shows the package ready for preparation.', 'ok');
    return;
  }
  ui.finalReportReadyAt = '';
  ui.allCapsApprovedAt = '';
  if (decision === 'revision') {
    ui.inspectorAssessment = 'request_revision';
    pushNotification('auditee', 'CAP', 'Inspector requested a CAP revision for ' + findingId + '.');
    addLog('Inspector requested CAP package revision', findingId);
    persistAfterAction();
    render();
    toast('Revision requested', 'The service provider would receive a CAP revision request in this demo.', 'warn');
    return;
  }
  ui.inspectorAssessment = 'request_more_evidence';
  pushNotification('leadInspector', 'CAP', 'Inspector rejected CAP ' + findingId + ' and marked it for follow-up.');
  addLog('Inspector rejected CAP package', findingId);
  persistAfterAction();
  render();
  toast('CAP rejected', 'The CAP was marked rejected for follow-up in this demo.', 'warn');
}

function handleCapDetailSubmitGeneralManager(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  var approvedAt = logTimestamp();
  ui.unitManagerRecommendationAt = approvedAt;
  ui.departmentManagerApprovedAt = approvedAt;
  ui.findingClosedAt = approvedAt;
  ui.submittedToGeneralManagerAt = '';
  pushNotification('leadInspector', 'CAP', 'Department Manager approved the closure decision for ' + findingId + '.');
  addLog('Department Manager approved CAP closure decision', findingId);
  persistAfterAction();
  render();
  toast('Finding closure approved', 'The Department Manager closure approval moved this CAP to Finding Closed in the demo.', 'ok');
}

function handleFinalReportReadyAction(action) {
  var ui = ensureCapTrackingUi();
  if (action === 'prepare') {
    ui.finalReportPreparedAt = logTimestamp();
    ui.finalReportPrepareStep = ui.finalReportPrepareStep || 'executive';
    pushNotification('manager', 'RPT', 'Lead Inspector prepared the final report for INS-2026-014.');
    addLog('Lead Inspector prepared final report', 'INS-2026-014');
    persistAfterAction();
    go('final-report-prepare', { filter: 'final' });
    toast('Final report opened', 'Lead Inspector can now write the Final Report sections.', 'ok');
    return;
  }
  if (action === 'preview') {
    go('final-report-view', { filter: 'final' });
    return;
  }
  if (action === 'record') {
    toast('Inspection record opened', 'The inspection record is represented by this final report readiness page in the demo.', 'info');
    return;
  }
  if (action === 'attachments') {
    toast('Attachments opened', 'Final report attachments are staged in this demo. No real files are stored.', 'info');
  }
}

function handleFinalReportListOpen(reportId) {
  state.view = 'audit-reports';
  state.params = { filter: 'final', finalReportId: reportId || 'FR-2026-014' };
  if (state.selectedFilters) state.selectedFilters['audit-reports'] = 'final';
  persistAfterAction();
  render();
}

function finalReportPrepareSteps() {
  return ['executive', 'overview', 'findings', 'cap', 'conclusions', 'recommendations', 'appendices', 'review'];
}

function handleFinalReportPrepareStep(step) {
  var steps = finalReportPrepareSteps();
  var ui = ensureCapTrackingUi();
  ui.finalReportPrepareStep = steps.indexOf(step) > -1 ? step : 'executive';
  persistAfterAction();
  render();
}

function handleFinalReportPrepareNext() {
  var steps = finalReportPrepareSteps();
  var ui = ensureCapTrackingUi();
  var current = steps.indexOf(ui.finalReportPrepareStep || 'executive');
  if (current < 0) current = 0;
  ui.finalReportPrepareStep = steps[Math.min(current + 1, steps.length - 1)];
  ui.finalReportSavedAt = logTimestamp();
  persistAfterAction();
  render();
}

function handleFinalReportPrepareBack() {
  var ui = ensureCapTrackingUi();
  ui.finalReportPreparedAt = ui.finalReportPreparedAt || logTimestamp();
  persistAfterAction();
  go('audit-reports', { filter: 'final' });
}

function handleFinalReportPrepareSave() {
  var ui = ensureCapTrackingUi();
  ui.finalReportSavedAt = logTimestamp();
  addLog('Lead Inspector final report draft saved', 'INS-2026-014');
  persistAfterAction();
  render();
  toast('Draft saved', 'Final Report draft was saved in this browser for the demo.', 'ok');
}

function handleFinalReportPrepareReview() {
  var ui = ensureCapTrackingUi();
  ui.finalReportSavedAt = logTimestamp();
  ui.finalReportPrepareStep = 'review';
  addLog('Lead Inspector continued Final Report to review', 'INS-2026-014');
  persistAfterAction();
  render();
  toast('Ready for review', 'Final Report content was saved and moved to the review step in this demo.', 'ok');
}

function handleFinalReportPrepareSubmit() {
  openModal(modalFinalReportSubmitApproval());
}

function handleFinalReportPrepareConfirmSubmit() {
  var ui = ensureCapTrackingUi();
  ui.finalReportSavedAt = logTimestamp();
  ui.finalReportSubmittedAt = ui.finalReportSavedAt;
  pushNotification('manager', 'RPT', 'Final Report INS-2026-014 was submitted for Department Manager approval.');
  addLog('Lead Inspector submitted Final Report for Department Manager approval', 'INS-2026-014');
  persistAfterAction();
  closeModal();
  render();
  toast('Submitted', 'Final Report was submitted to Department Manager approval in this demo.', 'ok');
}

function handleFinalReportExportPdf() {
  var ui = ensureCapTrackingUi();
  ui.finalReportPdfExportedAt = logTimestamp();
  addLog('Lead Inspector exported Final Report PDF', 'INS-2026-014');
  persistAfterAction();
  var downloaded = downloadFinalReportPdf();
  toast(downloaded ? 'PDF downloaded' : 'PDF export unavailable',
    downloaded ? 'INS-2026-014 Final Report PDF was downloaded from this browser.' : 'This browser does not support client-side PDF download.',
    downloaded ? 'ok' : 'warn');
}

function handleFinalReportPrint() {
  if (typeof window !== 'undefined' && window.print) {
    window.print();
    toast('Print opened', 'Use the browser print dialog to save or print the Final Report.', 'info');
    return;
  }
  toast('Print unavailable', 'This browser does not expose a print dialog in the demo environment.', 'warn');
}

function finalReportPdfSafeText(text) {
  return String(text || '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function finalReportPdfEscape(text) {
  return finalReportPdfSafeText(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function finalReportPdfWrap(text, maxChars) {
  var clean = finalReportPdfSafeText(text);
  if (!clean) return [''];
  var words = clean.split(' ');
  var lines = [];
  var current = '';
  words.forEach(function (word) {
    var test = current ? current + ' ' + word : word;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function buildFinalReportPdfDocument() {
  var sourceLines = typeof finalReportPdfLines === 'function' ? finalReportPdfLines() : ['AviaSurveil360 Final Report'];
  var printableLines = [];
  sourceLines.forEach(function (line) {
    finalReportPdfWrap(line, 96).forEach(function (wrapped) { printableLines.push(wrapped); });
  });

  var pages = [];
  var current = [];
  printableLines.forEach(function (line) {
    if (current.length >= 43) {
      pages.push(current);
      current = [];
    }
    current.push(line);
  });
  if (current.length) pages.push(current);

  var objects = [];
  function addObject(body) {
    objects.push(body);
    return objects.length;
  }

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('');
  var fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  var pageRefs = [];

  pages.forEach(function (pageLines) {
    var content = '';
    var y = 792;
    pageLines.forEach(function (line, index) {
      var isTitle = index === 0 && pageRefs.length === 0;
      var isHeading = /^\d+\./.test(line) || line === 'Final Report' || line === 'Report Signatures';
      var size = isTitle ? 18 : (isHeading ? 13 : 9.5);
      var leading = isTitle ? 24 : (isHeading ? 20 : 14);
      if (!line) {
        y -= 8;
        return;
      }
      content += 'BT /F1 ' + size + ' Tf 54 ' + y + ' Td (' + finalReportPdfEscape(line) + ') Tj ET\n';
      y -= leading;
    });
    var contentObj = addObject('<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream');
    var pageObj = addObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ' + fontObj + ' 0 R >> >> /Contents ' + contentObj + ' 0 R >>');
    pageRefs.push(pageObj + ' 0 R');
  });

  objects[1] = '<< /Type /Pages /Kids [' + pageRefs.join(' ') + '] /Count ' + pageRefs.length + ' >>';

  var pdf = '%PDF-1.4\n';
  var offsets = [0];
  objects.forEach(function (body, index) {
    offsets[index + 1] = pdf.length;
    pdf += (index + 1) + ' 0 obj\n' + body + '\nendobj\n';
  });
  var xref = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (var i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
  return pdf;
}

function downloadFinalReportPdf() {
  if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
  var pdf = buildFinalReportPdfDocument();
  var blob = new Blob([pdf], { type: 'application/pdf' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'INS-2026-014_Final_Report_SkyCargo_Air.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  return true;
}

function handleFinalReportPrepareFieldChange(field, target) {
  var ui = ensureCapTrackingUi();
  if (field === 'final-report-list-query') ui.finalReportQuery = target && target.value !== undefined ? target.value : '';
  if (field === 'final-report-list-status') ui.finalReportStatus = target && target.value ? target.value : 'all';
  if (field === 'final-report-list-department') ui.finalReportDepartment = target && target.value ? target.value : 'all';
  if (field === 'final-report-list-period') ui.finalReportPeriod = target && target.value ? target.value : 'all';
  if (field !== 'final-report-content') {
    persistAfterAction();
    render();
    return;
  }
  ui.finalReportContent = target && target.value !== undefined ? target.value : '';
  persistAfterAction();
  var counter = target && target.parentElement && target.parentElement.querySelector ? target.parentElement.querySelector('.final-prepare-char-count') : null;
  if (!counter && typeof document !== 'undefined') counter = document.querySelector('.final-prepare-char-count');
  if (counter) counter.textContent = 'Characters: ' + String(ui.finalReportContent.length);
}

function handleCapLeadSave(id) {
  var ui = ensureCapTrackingUi();
  ui.selectedFindingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  persistAfterAction();
  render();
  toast('Draft saved', 'Lead Inspector CAP recommendation draft was saved in this browser.', 'ok');
}

function handleCapLeadReturn(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  ui.leadInspectorRecommendationAt = '';
  ui.submittedToUnitManagerAt = '';
  ui.inspectorReviewSentAt = '';
  pushNotification('inspector', 'CAP', 'Lead Inspector returned ' + findingId + ' for inspector re-assessment.');
  addLog('Lead Inspector returned CAP review to Inspector', findingId);
  persistAfterAction();
  render();
  toast('Returned to Inspector', findingId + ' was returned for inspector re-assessment in this demo.', 'warn');
}

function handleCapLeadSubmit(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.selectedFindingId = findingId;
  ui.leadInspectorRecommendationAt = logTimestamp();
  ui.submittedToUnitManagerAt = ui.leadInspectorRecommendationAt;
  pushNotification('manager', 'CAP', 'Lead Inspector recommendation for ' + findingId + ' is ready for Department Manager closure approval.');
  addLog('Lead Inspector CAP recommendation submitted', findingId);
  persistAfterAction();
  render();
  toast('Recommendation sent', 'Lead Inspector recommendation was sent to Department Manager approval.', 'ok');
}

function handleCapDetailAddComment(id) {
  var ui = ensureCapTrackingUi();
  var findingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  if (!ui.internalComment.trim()) {
    toast('No comment added', 'Write an internal comment before adding it to the CAP review history.', 'warn');
    return;
  }
  addLog('Internal CAP review comment added', findingId);
  ui.internalComment = '';
  persistAfterAction();
  render();
  toast('Comment added', 'Internal CAA note was added to the demo action history.', 'ok');
}

function handleCapUnitChooseFile(id) {
  var ui = ensureCapTrackingUi();
  ui.selectedFindingId = id || ui.selectedFindingId || state.params.findingId || 'F-2026-002';
  ui.unitAttachmentName = 'department_manager_closure_note.pdf';
  persistAfterAction();
  render();
  toast('Attachment staged', 'Mock attachment filename added. No real file was uploaded.', 'ok');
}

function handleCapUnitViewInspectorReport(id) {
  var findingId = id || ensureCapTrackingUi().selectedFindingId || 'F-2026-002';
  openModal(modalShell('Inspector review summary', '' +
    '<p><b>' + esc(findingId) + '</b> was reviewed by the Inspector and prepared for Lead Inspector recommendation.</p>' +
    '<p class="muted">The Inspector concluded that the CAP needs further verification because training records remain incomplete. This demo opens a report summary only.</p>',
    '<button class="btn" data-act="close-modal">Close</button>' +
    '<button class="btn btn--primary" data-act="nav" data-view="cap-review-detail" data-id="' + esc(findingId) + '">Open Inspector Review</button>', true));
}

function handleCapTrackingQuickAction(action) {
  if (action === 'report') {
    handleCapTrackingViewReport();
    return;
  }
  if (action === 'reminder') {
    handleCapTrackingReminder();
    return;
  }
  if (action === 'export') {
    handleCapTrackingExport();
    return;
  }
  if (action === 'documents') {
    var ui = ensureCapTrackingUi();
    ui.tab = 'documents';
    persistAfterAction();
    closeModal();
    render();
    return;
  }
  if (action === 'enforcement') {
    openModal(modalShell('Enforcement matrix', '' +
      '<p>CAP deadlines are tracked from the Final Report Issued date after Executive Director / GM approval.</p>' +
      '<div class="lead-preview-deadlines"><span>Level 1: 14 days</span><span>Level 2: 90 days</span><span>Observation: No CAP</span></div>' +
      '<p class="muted">Enforcement decisions follow the configured governance route and are not automatic.</p>',
      '<button class="btn" data-act="close-modal">Close</button>', false));
    return;
  }
  toast('Action staged', 'This CAP tracking action is available as a demo preview.', 'info');
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
    findingId: 'CAB-2026-001',
    fileName: 'PBE_Cabin_Position_Photo.jpg',
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
      addLog('Audit closed after Executive Director / GM report approval', report.auditId);
      toast('Final report issued', 'Mock final report issued and audit closed after Executive Director / GM approval.', 'ok');
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
    templateId: 'TPL-CABIN-2026',
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
  var field = e.target && e.target.getAttribute ? e.target.getAttribute('data-field') : '';
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'checklist-comment') {
    setChecklistComment(e.target.getAttribute('data-q'), e.target.value);
  }
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'inspection-comment') {
    setInspectionComment(e.target.getAttribute('data-id'), e.target.value);
  }
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'inspection-status') {
    handleInspectionSetStatus(e.target.getAttribute('data-id'), e.target.value);
  }
  if (field === 'lead-review-decision') {
    handleLeadReviewDecision(e.target.getAttribute('data-id'), e.target.value);
  }
  if (field === 'lead-report-rating' || field === 'lead-report-risk') {
    handleLeadReportFieldChange(field, e.target);
  }
  if (field && field.indexOf('inspector-assignment-') === 0) {
    handleInspectorAssignmentsFieldChange(field, e.target);
  }
  if (field && field.indexOf('lead-assigned-') === 0) {
    handleLeadAssignedFieldChange(field, e.target);
  }
  if (field && field.indexOf('lead-assignment-') === 0) {
    handleLeadAssignmentFieldChange(field, e.target);
  }
  if (field && field.indexOf('preliminary-report-') === 0) {
    handleLeadPreliminaryReportFieldChange(field, e.target);
  }
  if (field && field.indexOf('final-report-') === 0) {
    handleFinalReportPrepareFieldChange(field, e.target);
  }
  if (field && field.indexOf('cap-review-') === 0) {
    handleCapReviewFieldChange(field, e.target);
  }
  if (field && (field.indexOf('cap-detail-') === 0 || field.indexOf('cap-unit-') === 0 || field.indexOf('cap-lead-') === 0 || field.indexOf('cap-inspector-') === 0)) {
    handleCapDetailFieldChange(field, e.target);
  }
});

document.addEventListener('input', function (e) {
  var field = e.target && e.target.getAttribute ? e.target.getAttribute('data-field') : '';
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'checklist-comment') {
    setChecklistComment(e.target.getAttribute('data-q'), e.target.value);
  }
  if (e.target && e.target.getAttribute && e.target.getAttribute('data-field') === 'inspection-comment') {
    setInspectionComment(e.target.getAttribute('data-id'), e.target.value);
  }
  if (field === 'lead-review-comment') {
    handleLeadReviewCommentInput(e.target);
  }
  if (field === 'lead-review-overall-comment') {
    handleLeadReviewOverallComment(e.target);
  }
  if (field === 'lead-workflow-comment') {
    handleLeadWorkflowComment(e.target);
  }
  if (field === 'inspector-assignment-query') {
    handleInspectorAssignmentsFieldChange(field, e.target);
  }
  if (field === 'lead-assigned-query') {
    handleLeadAssignedFieldChange(field, e.target);
  }
  if (field === 'lead-assignment-query' || field === 'lead-assignment-note') {
    handleLeadAssignmentFieldChange(field, e.target);
  }
  if (field === 'preliminary-report-query' || field === 'preliminary-report-finding-query') {
    handleLeadPreliminaryReportFieldChange(field, e.target);
  }
  if (field === 'preliminary-report-content') {
    handleLeadPreliminaryReportFieldChange(field, e.target);
  }
  if (field === 'final-report-content') {
    handleFinalReportPrepareFieldChange(field, e.target);
  }
  if (field === 'final-report-list-query') {
    handleFinalReportPrepareFieldChange(field, e.target);
  }
  if (field === 'cap-review-search') {
    ensureCapReviewUi().query = e.target.value || '';
  }
  if (field === 'cap-review-comment') {
    handleCapReviewCommentInput(e.target);
  }
  if (field === 'cap-detail-review-comments' || field === 'cap-detail-enforcement-justification' || field === 'cap-detail-internal-comment' || field === 'cap-unit-justification' || field === 'cap-lead-comments' || field === 'cap-inspector-comments') {
    handleCapDetailFieldChange(field, e.target);
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
