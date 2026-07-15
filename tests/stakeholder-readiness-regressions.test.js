const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function buildContext() {
  const elements = new Map();
  function stubElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        value: '',
        checked: false,
        innerHTML: '',
        hidden: false,
        style: {},
        parentNode: null,
        classList: { toggle() {} },
        addEventListener() {},
        appendChild(child) { child.parentNode = this; },
        removeChild(child) { child.parentNode = null; },
        closest() { return null; },
        focus() {}
      });
    }
    return elements.get(id);
  }

  const context = {
    console,
    Blob: class BlobStub {
      constructor(parts, options) { this.parts = parts; this.type = options && options.type; }
    },
    URL: { createObjectURL() { return 'blob:stakeholder-regression'; }, revokeObjectURL() {} },
    window: { scrollTo() {}, print() {} },
    document: {
      activeElement: null,
      body: {
        classList: { toggle() {} },
        appendChild(child) { child.parentNode = this; },
        removeChild(child) { child.parentNode = null; }
      },
      addEventListener() {},
      createElement() {
        return {
          href: '', download: '', className: '', innerHTML: '', style: {}, parentNode: null,
          click() {}, focus() {}
        };
      },
      getElementById: stubElement,
      querySelectorAll() { return []; }
    },
    setTimeout,
    clearTimeout
  };
  vm.createContext(context);
  [
    'js/data.js',
    'js/helpers.js',
    'js/approval.js',
    'js/planning.js',
    'js/checklists.js',
    'js/inspection.js',
    'js/reports.js',
    'js/manager-workspaces.js',
    'js/work-items.js',
    'js/views.js',
    'js/app.js'
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  });
  context.__elements = elements;
  return context;
}

test('Preliminary and Final Report IDs resolve to distinct canonical artifacts', () => {
  const context = buildContext();
  const state = context.freshState();
  const preliminary = context.reportArtifactById('PR-2026-018', state);
  const finalReport = context.reportArtifactById('FR-2026-018', state);

  assert.ok(preliminary);
  assert.ok(finalReport);
  assert.equal(preliminary.id, 'PR-2026-018');
  assert.equal(preliminary.reportType, 'Preliminary Report');
  assert.equal(finalReport.id, 'FR-2026-018');
  assert.equal(finalReport.reportType, 'Final Report');
  assert.notEqual(finalReport, preliminary);
});

test('an ED Final Report decision mutates only the canonical Final artifact', () => {
  const context = buildContext();
  const state = context.freshState();
  const preliminary = context.reportArtifactById('PR-2026-018', state);
  const finalReport = context.reportArtifactById('FR-2026-018', state);
  preliminary.status = 'draft';
  const preliminaryBefore = JSON.stringify(preliminary);

  finalReport.status = 'submitted_to_executive';
  finalReport.ownerRole = 'executiveDirector';
  const result = context.applyExecutiveFinalReportDecision(state, finalReport.id, {
    decision: 'approve',
    actor: { role: 'executiveDirector', name: 'Ufuk Aslan' }
  });

  assert.equal(result.ok, true);
  assert.equal(context.reportArtifactById('FR-2026-018', state).status, 'issued');
  assert.equal(JSON.stringify(context.reportArtifactById('PR-2026-018', state)), preliminaryBefore);
});

test('GM cannot invoke ED authority and denied decisions are mutation-free', () => {
  const context = buildContext();
  const state = context.freshState();
  const report = state.managerReports.find((item) => item.id === 'FR-2026-018');
  report.status = 'submitted_to_executive';
  report.ownerRole = 'executiveDirector';
  const before = JSON.stringify(state);
  const denied = context.applyExecutiveFinalReportDecision(state, report.id, {
    decision: 'approve',
    actor: { role: 'gm', name: 'Okan Demir' }
  });

  assert.equal(denied.ok, false);
  assert.match(denied.message, /only the executive director/i);
  assert.equal(JSON.stringify(state), before);
  assert.match(context.ROLE_DESC.gm, /intermediate|review|forward/i);
  assert.doesNotMatch(context.ROLE_DESC.gm, /final report authorization/i);
});

test('GM decision primitive rejects non-GM actors without mutation', () => {
  const context = buildContext();
  const state = context.freshState();
  const report = state.managerReports.find((item) => item.id === 'FR-2026-018');
  report.status = 'submitted_to_gm';
  report.ownerRole = 'gm';
  const before = JSON.stringify(state);
  const denied = context.applyGeneralManagerReportDecision(
    state,
    report.id,
    'approve',
    'Attempted by the wrong role.',
    { role: 'manager', name: 'Mehmet Kaya' }
  );

  assert.equal(denied.ok, false);
  assert.match(denied.message, /only the general manager/i);
  assert.equal(JSON.stringify(state), before);
});

test('auditee notifications and Messages are organization-scoped, including unread counts', () => {
  const context = buildContext();
  const state = context.freshState();
  state.notifications.unshift({
    id: 'N-PRIVATE-SKY',
    role: 'auditee',
    organizationId: 'ORG-SKY',
    text: 'SkyCargo confidential CAP message',
    icon: 'CAP',
    time: 'Just now',
    unread: true
  });
  context.state = state;
  context.state.role = 'auditee';
  context.state.view = 'messages';

  assert.equal(typeof context.notificationVisibleToSession, 'function');
  assert.equal(context.notificationVisibleToSession(state.notifications[0], state), false);
  assert.doesNotMatch(context.renderContent(), /SkyCargo confidential CAP message|ORG-SKY/);
  assert.equal(
    context.unreadCount('auditee'),
    state.notifications.filter((item) => context.notificationVisibleToSession(item, state) && item.unread).length
  );
});

test('Service Provider Settings contains only auditee-safe preferences and demo boundaries', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'auditee';
  context.state.view = 'settings';
  const html = context.renderContent();

  assert.match(html, /Service Provider|Fly Namibia/);
  assert.doesNotMatch(html, /Inspector Workload Balance|Oversight Health Index weights|internal risk/i);
});

test('Lead Final Reports are canonical, selected-ID-backed, and have exact action IDs', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'leadInspector';
  context.state.view = 'audit-reports';
  context.state.params = { filter: 'final', reportId: 'FR-2026-018' };

  const rows = context.leadFinalReportRows();
  const html = context.viewLeadFinalReports();
  assert.ok(rows.some((row) => row.reportId === 'FR-2026-018'));
  assert.ok(rows.every((row) => context.reportArtifactById(row.reportId, context.state)));
  assert.match(html, /FR-2026-018/);
  assert.match(html, /data-act="final-report-list-open"[^>]*data-id="FR-2026-018"[^>]*>FR-2026-018<\/button>/);
  assert.doesNotMatch(html, /FR-2026-014|INS-2026-014/);
  assert.match(html, /data-act="final-report-ready-action"[^>]*data-id="FR-2026-018"/);
});

test('Lead assignment IDs are the exact Cabin execution question IDs', () => {
  const context = buildContext();
  const state = context.freshState();
  const executionPackage = context.inspectionExecutionPackageForAudit(state, 'AUD-2026-001');
  const executionIds = executionPackage.questions.map((question) => question.id);
  context.state = state;
  const assignmentIds = context.leadAssignmentQuestions().map((question) => question.id);

  assert.deepEqual(JSON.parse(JSON.stringify(assignmentIds)), JSON.parse(JSON.stringify(executionIds)));
  assert.equal(executionPackage.sections.length, 6);
});

test('Department Preliminary decisions propagate the exact selected Report ID', () => {
  const context = buildContext();
  context.state = context.freshState();
  const secondProjection = JSON.parse(JSON.stringify(
    context.state.managerReports.find((item) => item.id === 'PR-2026-018')
  ));
  secondProjection.id = 'PR-ISOLATION-CHECK';
  secondProjection.approvalPackageId = 'PR-ISOLATION-CHECK';
  context.state.managerReports.push(secondProjection);
  const secondArtifact = JSON.parse(JSON.stringify(
    context.reportArtifactById('PR-2026-018', context.state)
  ));
  secondArtifact.id = 'PR-ISOLATION-CHECK';
  context.state.auditReports.push(secondArtifact);
  context.state.departmentPreliminaryReviewUi.selectedReportId = 'PR-ISOLATION-CHECK';
  const originalPreliminaryBefore = JSON.stringify(context.reportArtifactById('PR-2026-018', context.state));

  context.handleDepartmentPreliminaryApprove('service_provider');

  assert.match(context.state.notifications[0].text, /PR-ISOLATION-CHECK/);
  assert.equal(context.state.auditLog[0].target, 'PR-ISOLATION-CHECK');
  assert.equal(JSON.stringify(context.reportArtifactById('PR-2026-018', context.state)), originalPreliminaryBefore);
  assert.equal(context.reportArtifactById('PR-ISOLATION-CHECK', context.state).status, 'released_to_service_provider');
});

test('mobile report preview CSS contains nested overflow and width guards', () => {
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  const tabletRules = css.slice(css.indexOf('@media screen and (max-width: 1100px)'));
  const mobileRules = css.slice(css.indexOf('@media screen and (max-width: 980px)'));

  assert.match(tabletRules, /\.final-report-view-page\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*overflow-x:\s*hidden/s);
  assert.match(tabletRules, /\.final-report-view-page\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(tabletRules, /\.final-report-view-head\s*\{[^}]*flex-direction:\s*column/s);
  assert.doesNotMatch(mobileRules, /\.state-final-report-doc\s*\{[^}]*width:\s*700px/s);
  assert.match(mobileRules, /\.executive-report-canvas\s*\{[^}]*min-width:\s*0[^}]*overflow-x:\s*hidden/s);
  assert.match(mobileRules, /\.executive-report-zoom-stage\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s);
  assert.match(mobileRules, /\.state-final-report-doc\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s);
});

test('My Assignments starts with operational KPIs and no Next inspection dossier', () => {
  const context = buildContext();
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  context.state = context.freshState();
  context.state.role = 'inspector';
  context.state.view = 'inspector-assignments';
  context.state.params = {};

  const html = context.viewInspectorAssignments();
  assert.match(html, /inspector-assignment-kpis/);
  assert.match(html, /inspector-assignment-table/);
  assert.doesNotMatch(html, /inspector-next-dossier|Next inspection|Open audit dossier/);
  assert.ok(html.indexOf('inspector-assignment-kpis') < html.indexOf('inspector-assignment-table'));
  assert.match(
    css,
    /@media \(max-width: 1100px\)[\s\S]*?\.inspector-assignment-table\s*\{[^}]*min-width:\s*0/s,
    'the assignment table must keep row actions visible at tablet width'
  );
});

test('Preliminary Inspection and Findings omits CAP lifecycle status', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'leadInspector';
  context.state.leadPreliminaryReportsUi.mode = 'workflow';
  context.state.leadPreliminaryReportsUi.selectedReportId = 'PR-2026-018';
  context.state.preliminaryReportDrafts['PR-2026-018'].step = 'inspection';

  const html = context.viewLeadPreliminaryWorkflow();
  assert.match(html, /Inspection &amp; Findings|Inspection & Findings/);
  assert.match(html, /Findings Review/);
  assert.match(html, /<th>Finding<\/th><th>Level<\/th><th>Due Date<\/th><th>Action<\/th>/);
  assert.doesNotMatch(html, /<th>Status<\/th>|CAP Submitted|CAP Accepted|Waiting for CAP/);
  assert.equal((html.match(/<h2>Inspection Overview<\/h2>/g) || []).length, 1);
});

test('Preliminary Findings side panel uses contained columns without a lifecycle badge slot', () => {
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  assert.match(css, /\.prelim-workflow-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s+minmax\(330px,\s*\.85fr\)/s);
  assert.match(css, /\.prelim-finding-item\s*\{[^}]*grid-template-columns:\s*28px\s+44px\s+minmax\(0,\s*1fr\)\s+minmax\(92px,\s*auto\)\s+58px/s);
  assert.match(css, /\.prelim-finding-copy,[\s\S]*?\.prelim-finding-item\s*>\s*em\s*\{[^}]*min-width:\s*0[^}]*overflow-wrap:\s*anywhere/s);
});

test('Preliminary inspection tables stay inside the workflow frame at mobile widths', () => {
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  const mobileRules = css.slice(css.indexOf('@media (max-width: 640px)'));
  assert.match(mobileRules, /\.prelim-workflow-card\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(mobileRules, /\.prelim-workflow-card\s+\.prelim-report-table-wrap\s*\{[^}]*max-width:\s*100%[^}]*overflow-x:\s*hidden/s);
  assert.match(mobileRules, /\.prelim-workflow-card\s+\.prelim-detail-table,[\s\S]*?\.prelim-workflow-card\s+\.prelim-area-table\s*\{[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s);
});

test('Preliminary attachments and Final Report metrics expose compact containment hooks', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'leadInspector';
  context.state.leadPreliminaryReportsUi.mode = 'workflow';
  context.state.leadPreliminaryReportsUi.selectedReportId = 'PR-2026-018';
  context.state.preliminaryReportDrafts['PR-2026-018'].step = 'attachments';
  const attachmentHtml = context.viewLeadPreliminaryWorkflow();
  assert.match(attachmentHtml, /prelim-attachment-table-wrap/);

  context.state.params = { filter: 'final', reportId: 'FR-2026-018', finalReportId: 'FR-2026-018' };
  context.state.capTrackingUi.finalReportPrepareStep = 'overview';
  const finalHtml = context.viewLeadFinalReportPrepare();
  assert.match(finalHtml, /FR-2026-018/);
  assert.match(finalHtml, /final-overview-org-summary is-compact/);
  assert.match(finalHtml, /final-overview-finding-grid is-compact/);
  assert.match(finalHtml, /final-ready-table final-overview-table final-overview-state-table/);

  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  assert.match(css, /\.prelim-attachment-table-wrap\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.prelim-attachment-table\s*\{[^}]*table-layout:\s*fixed/s);
  assert.match(css, /\.final-overview-org-summary\.is-compact/s);
  assert.match(css, /\.final-overview-finding-grid\.is-compact/s);
  assert.match(css, /\.final-overview-state-table\s*\{[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s);
});

test('fresh demo state contains distinct decision-ready GM and ED Final Reports', () => {
  const context = buildContext();
  const state = context.freshState();
  const gmReport = context.reportArtifactById('FR-2026-021', state);
  const edReport = context.reportArtifactById('FR-2026-022', state);

  assert.ok(gmReport);
  assert.equal(gmReport.reportType, 'Final Report');
  assert.equal(gmReport.status, 'submitted_to_gm');
  assert.equal(gmReport.ownerRole, 'gm');
  assert.equal(gmReport.locked, false);

  assert.ok(edReport);
  assert.equal(edReport.reportType, 'Final Report');
  assert.equal(edReport.status, 'submitted_to_executive');
  assert.equal(edReport.ownerRole, 'executiveDirector');
  assert.equal(edReport.locked, false);
  assert.notEqual(gmReport.id, edReport.id);

  assert.ok(context.generalManagerProjection(state).approvalRows.some((row) => row.id === gmReport.id));
  assert.ok(context.executiveFinalReportProjection(state, { status: 'pending' }).rows.some((row) => row.id === edReport.id));
});

test('GM and ED default workspaces show working report decisions', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'gm';
  let html = context.viewGeneralManagerReportApprovals();
  assert.match(html, /FR-2026-021/);
  assert.match(html, /Open Report/);
  assert.match(html, /Return Report/);
  assert.match(html, /Forward to Executive Director/);

  context.state.role = 'executiveDirector';
  html = context.viewExecutiveFinalReportsWorkspace();
  assert.match(html, /FR-2026-022/);
  assert.match(html, /Approve Report/);
  assert.match(html, /Return for Revision/);
  assert.match(html, /Reject Report/);
  assert.match(html, /Refer for Enforcement Review/);
});

test('GM and ED decisions mutate only their exact seeded Final Report', () => {
  const context = buildContext();
  const state = context.freshState();
  const edBefore = JSON.stringify(context.reportArtifactById('FR-2026-022', state));
  const gmResult = context.applyGeneralManagerReportDecision(
    state,
    'FR-2026-021',
    'approve',
    'Reviewed and forwarded.',
    { role: 'gm', name: context.ROLES.gm.user }
  );
  assert.equal(gmResult.ok, true);
  assert.equal(gmResult.report.ownerRole, 'executiveDirector');
  assert.equal(JSON.stringify(context.reportArtifactById('FR-2026-022', state)), edBefore);

  const gmAfter = JSON.stringify(context.reportArtifactById('FR-2026-021', state));
  const edResult = context.applyExecutiveFinalReportDecision(state, 'FR-2026-022', {
    decision: 'approve',
    actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user }
  });
  assert.equal(edResult.ok, true);
  assert.equal(edResult.report.status, 'issued');
  assert.equal(
    context.managerReportOwnerLabel(edResult.report.ownerRole, edResult.report.organization),
    'BlueWing Aviation Service Provider Portal',
    'an issued report must retain its own organization identity when ownership returns to the Service Provider portal'
  );
  assert.equal(JSON.stringify(context.reportArtifactById('FR-2026-021', state)), gmAfter);
});

test('pre-remediation state receives decision samples without discarding an unsaved ED form', () => {
  const context = buildContext();
  const saved = JSON.parse(JSON.stringify(context.freshState()));
  saved.demoStateVersion = 8;
  saved.auditReports = saved.auditReports.filter((report) => !['FR-2026-021', 'FR-2026-022'].includes(report.id));
  saved.managerReports = saved.managerReports.filter((report) => !['FR-2026-021', 'FR-2026-022'].includes(report.id));
  saved.executiveDirectorUi.selectedReportId = 'FR-2026-018';
  saved.executiveDirectorUi.reportDecision = '';
  saved.executiveDirectorUi.reportComment = '';

  const migrated = context.mergeDemoState(saved);
  assert.ok(context.reportArtifactById('FR-2026-021', migrated));
  assert.ok(context.reportArtifactById('FR-2026-022', migrated));
  assert.equal(migrated.executiveDirectorUi.selectedReportId, 'FR-2026-022');

  saved.executiveDirectorUi.reportDecision = 'return';
  saved.executiveDirectorUi.reportComment = 'Unsaved revision rationale.';
  const dirtyFormMigration = context.mergeDemoState(saved);
  assert.equal(dirtyFormMigration.executiveDirectorUi.selectedReportId, 'FR-2026-018');
  assert.equal(dirtyFormMigration.executiveDirectorUi.reportDecision, 'return');
  assert.equal(dirtyFormMigration.executiveDirectorUi.reportComment, 'Unsaved revision rationale.');
});

test('planning follows Department Manager, Finance, GM, ED and revision returns go to Department Manager', () => {
  const context = buildContext();
  const state = context.freshState();
  const plan = state.planningItems[0];

  assert.deepEqual(
    JSON.parse(JSON.stringify(plan.approval.chain.map((stage) => stage.role))),
    ['manager', 'finance', 'gm', 'executiveDirector']
  );
  assert.equal(context.approvalSummary(plan).ownerRole, 'finance');

  let result = context.applyFinancePlanningDecision(plan, {
    decision: 'return',
    actor: { role: 'finance', name: context.ROLES.finance.user },
    comment: 'Reconcile travel and accommodation.'
  });
  assert.equal(result.ok, true);
  assert.equal(context.approvalSummary(plan).ownerRole, 'manager');

  context.applyApprovalDecision(plan, {
    decision: 'forward',
    actor: { role: 'manager', name: context.ROLES.manager.user },
    comment: 'Budget revised and resubmitted.'
  });
  result = context.applyFinancePlanningDecision(plan, {
    decision: 'approve',
    actor: { role: 'finance', name: context.ROLES.finance.user },
    comment: 'Budget approved.'
  });
  assert.equal(result.ok, true);
  assert.equal(context.approvalSummary(plan).ownerRole, 'gm');

  context.applyApprovalDecision(plan, {
    decision: 'return',
    actor: { role: 'gm', name: context.ROLES.gm.user },
    comment: 'Clarify the department scope.'
  });
  assert.equal(context.approvalSummary(plan).ownerRole, 'manager');

  context.applyApprovalDecision(plan, {
    decision: 'forward',
    actor: { role: 'manager', name: context.ROLES.manager.user },
    comment: 'Scope clarified and resubmitted.'
  });
  context.applyFinancePlanningDecision(plan, {
    decision: 'approve',
    actor: { role: 'finance', name: context.ROLES.finance.user },
    comment: 'Budget re-approved.'
  });
  context.applyApprovalDecision(plan, {
    decision: 'forward',
    actor: { role: 'gm', name: context.ROLES.gm.user },
    comment: 'Forwarded to Executive Director.'
  });
  assert.equal(context.approvalSummary(plan).ownerRole, 'executiveDirector');
});

test('pre-v9 planning migration never skips an unreviewed Finance stage', () => {
  const context = buildContext();
  const oldChain = [
    { role: 'manager', label: 'Department Manager', returnToRole: null },
    { role: 'gm', label: 'GM Review', returnToRole: 'manager' },
    { role: 'finance', label: 'Finance Review', returnToRole: 'gm', notApprovedReturnToRole: 'gm' },
    { role: 'executiveDirector', label: 'Executive Director Approval', returnToRole: 'gm' }
  ];
  function legacyAt(index, financeReview, outcome) {
    const saved = JSON.parse(JSON.stringify(context.freshState()));
    saved.demoStateVersion = 8;
    const plan = saved.planningItems[0];
    plan.approval.chain = JSON.parse(JSON.stringify(oldChain));
    plan.approval.currentIndex = index;
    plan.approval.outcome = outcome || null;
    plan.approval.history.push({ actor: 'Legacy Reviewer', role: 'gm', action: 'legacy_note', date: '2026-07-01', comment: 'Preserve this history.' });
    plan.financeReview = financeReview || null;
    plan.budget.availableForPlan = 19750;
    plan.preparation.resources = 'Preserved preparation note';
    return saved;
  }

  let migrated = context.mergeDemoState(legacyAt(1, null, null));
  assert.equal(migrated.demoStateVersion, 9);
  assert.deepEqual(
    JSON.parse(JSON.stringify(migrated.planningItems[0].approval.chain.map((stage) => stage.role))),
    ['manager', 'finance', 'gm', 'executiveDirector']
  );
  assert.equal(context.approvalSummary(migrated.planningItems[0]).ownerRole, 'finance');
  assert.equal(migrated.planningItems[0].budget.availableForPlan, 19750);
  assert.equal(migrated.planningItems[0].preparation.resources, 'Preserved preparation note');
  assert.ok(migrated.planningItems[0].approval.history.some((entry) => entry.action === 'legacy_note'));

  migrated = context.mergeDemoState(legacyAt(2, null, null));
  assert.equal(context.approvalSummary(migrated.planningItems[0]).ownerRole, 'finance');

  migrated = context.mergeDemoState(legacyAt(3, { decision: 'approved', reviewer: 'Derya Acar' }, null));
  assert.equal(context.approvalSummary(migrated.planningItems[0]).ownerRole, 'executiveDirector');

  migrated = context.mergeDemoState(legacyAt(1, { decision: 'not_approved', reviewer: 'Derya Acar' }, null));
  assert.equal(context.approvalSummary(migrated.planningItems[0]).ownerRole, 'manager');

  migrated = context.mergeDemoState(legacyAt(3, { decision: 'approved', reviewer: 'Derya Acar' }, 'approved'));
  assert.equal(context.approvalSummary(migrated.planningItems[0]).outcome, 'approved');
});

test('role home planning summaries keep Finance before GM', () => {
  const context = buildContext();
  context.state = context.freshState();

  context.state.role = 'executiveDirector';
  let html = context.viewRoleHome();
  assert.match(html, /Planning: DM -&gt; Finance -&gt; GM -&gt; ED/);
  assert.doesNotMatch(html, /Planning: DM -&gt; GM -&gt; Finance -&gt; ED/);

  context.state.role = 'finance';
  html = context.viewRoleHome();
  assert.match(html, /Ready For GM/);
  assert.match(html, /Finance accepted for GM review/);
  assert.doesNotMatch(html, /Ready For ED|Finance accepted for ED review/);
});
