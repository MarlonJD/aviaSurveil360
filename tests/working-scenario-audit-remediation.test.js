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
        files: [],
        innerHTML: '',
        textContent: '',
        hidden: false,
        style: {},
        parentNode: null,
        parentElement: null,
        selectionStart: 0,
        selectionEnd: 0,
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        appendChild(child) { child.parentNode = this; },
        removeChild(child) { child.parentNode = null; },
        closest() { return null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
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
    URL: { createObjectURL() { return 'blob:wsa-remediation'; }, revokeObjectURL() {} },
    window: { scrollTo() {}, print() {} },
    document: {
      activeElement: null,
      body: {
        classList: { add() {}, remove() {}, toggle() {} },
        appendChild(child) { child.parentNode = this; },
        removeChild(child) { child.parentNode = null; }
      },
      addEventListener() {},
      createElement() {
        return {
          href: '', download: '', className: '', innerHTML: '', style: {}, parentNode: null,
          click() {}, focus() {}, setAttribute() {}, removeAttribute() {}
        };
      },
      getElementById: stubElement,
      querySelector() { return null; },
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
  context.__stubElement = stubElement;
  return context;
}

function dataEl(attributes) {
  return {
    value: attributes.value || '',
    checked: !!attributes.checked,
    selectionStart: attributes.selectionStart || 0,
    selectionEnd: attributes.selectionEnd || 0,
    getAttribute(name) { return attributes[name] || ''; },
    focus() {},
    setSelectionRange() {}
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function progressRoutinePlan(context, state) {
  const item = state.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');
  context.applyApprovalDecision(item, {
    decision: 'approve', actor: { role: 'finance', name: 'Derya Acar' }, comment: 'Budget approved.'
  });
  context.applyApprovalDecision(item, {
    decision: 'forward', actor: { role: 'gm', name: 'Okan Demir' }, comment: 'Forward to ED.'
  });
  context.applyApprovalDecision(item, {
    decision: 'approve', actor: { role: 'executiveDirector', name: 'Ufuk Aslan' }, comment: 'Approved.'
  });
  context.releasePlanningItem(item, { actorRole: 'gm', actorName: 'Okan Demir' });
  context.acceptReleasedPlanningItem(item, { actorRole: 'manager', actorName: 'Mehmet Kaya' });
  context.assignLeadInspectorToPlanningItem(item, {
    actorRole: 'manager', actorName: 'Mehmet Kaya', leadInspector: 'Caner Yildiz', leadInspectorUserId: 'USR-CANER'
  });
  context.proposePlanningTeamAndSchedule(item, {
    actorRole: 'leadInspector', actorName: 'Caner Yildiz', actorUserId: 'USR-CANER',
    team: ['Caner Yildiz', 'Aylin Sezer'], startDate: '2026-09-10', endDate: '2026-09-12',
    resources: 'Two inspectors and the configured checklist package.'
  });
  context.confirmPlanningPreparation(item, { actorRole: 'manager', actorName: 'Mehmet Kaya' });
  return context.materializeReadyPlanningInspection(state, item);
}

test('WSA-001 Administration role action opens its authorized preview', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = null;
  context.state.view = 'login';

  assert.deepEqual(Object.keys(context.ADMIN_ALLOWED_VIEWS || {}).sort(), [
    'profile', 'settings', 'template-preview', 'templates', 'users'
  ]);
  assert.equal(context.roleCanOpenView('admin', 'dashboard'), false);

  context.handleAction('role', dataEl({ 'data-role': 'admin' }));

  assert.equal(context.state.role, 'admin');
  assert.equal(context.state.view, 'templates');
  assert.match(context.renderContent(), /Administration|Admin Preview|Checklist Templates/);
});

test('WSA-002 preparation presentation is derived jointly from approval and GM release', () => {
  const context = buildContext();
  const state = context.freshState();
  const item = state.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');

  assert.equal(typeof context.planningPreparationPresentation, 'function');
  assert.deepEqual(plain(context.planningPreparationPresentation(item)), {
    statusKey: 'awaiting_approval',
    statusLabel: 'Awaiting approval',
    ownerRole: 'finance',
    ownerLabel: 'Finance Review',
    tone: 'warn'
  });

  context.applyApprovalDecision(item, {
    decision: 'approve', actor: { role: 'finance', name: 'Derya Acar' }, comment: 'Budget approved.'
  });
  context.applyApprovalDecision(item, {
    decision: 'forward', actor: { role: 'gm', name: 'Okan Demir' }, comment: 'Forward.'
  });
  context.applyApprovalDecision(item, {
    decision: 'approve', actor: { role: 'executiveDirector', name: 'Ufuk Aslan' }, comment: 'Approved.'
  });
  assert.equal(context.planningPreparationPresentation(item).statusLabel, 'Approved — Awaiting GM Release');
});

test('WSA-003 mobile-only summaries stay hidden at desktop and do not duplicate primary actions', () => {
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  assert.match(
    css,
    /\.mobile-decision-summary(?:\:not\([^)]*\))?\.mobile-decision-summary--mobile-only\s*\{\s*display:\s*none;/,
    'the desktop hide rule must match or outrank the base summary selector'
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*640px\)[\s\S]*?\.inspection-submit-action\s*,\s*\.inspection-reopen-action\s*\{\s*display:\s*none;/,
    'mobile checklist must hide the duplicated header decision action when the mobile decision summary is visible'
  );

  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'finance';
  context.state.view = 'finance-review';
  const finance = context.viewFinanceReviewWorkspace();
  const desktopFinance = finance.replace(/<section class="[^"]*mobile-decision-summary--mobile-only[^"]*"[\s\S]*?<\/section>/g, '');
  assert.equal((desktopFinance.match(/>Approve Budget</g) || []).length, 1);

  context.state.role = 'auditee';
  context.state.view = 'service-provider-cap';
  context.state.serviceProviderUi.cap.selectedFindingId = 'CAB-2026-013';
  const auditee = context.viewServiceProviderCapWorkspace();
  const desktopAuditee = auditee.replace(/<section class="[^"]*mobile-decision-summary--mobile-only[^"]*"[\s\S]*?<\/section>/g, '');
  assert.equal((desktopAuditee.match(/>Respond</g) || []).length, 1);
});

test('WSA-004 session user, visible identity, assigned Lead, mutation actor, and log actor agree', () => {
  const context = buildContext();
  const state = context.freshState();
  assert.equal(typeof context.currentSessionActor, 'function');

  state.role = 'inspector';
  assert.deepEqual(plain(context.currentSessionActor(state)), {
    userId: 'USR-AYLIN', name: 'Aylin Sezer', role: 'inspector', organizationId: ''
  });
  state.role = 'leadInspector';
  assert.deepEqual(plain(context.currentSessionActor(state)), {
    userId: 'USR-CANER', name: 'Caner Yildiz', role: 'leadInspector', organizationId: ''
  });

  const item = state.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');
  item.preparation.status = 'accepted_by_department';
  context.assignLeadInspectorToPlanningItem(item, {
    actorRole: 'manager', actorName: 'Mehmet Kaya', leadInspector: 'Caner Yildiz', leadInspectorUserId: 'USR-CANER'
  });
  assert.equal(item.preparation.leadInspectorUserId, 'USR-CANER');
  assert.equal(item.preparation.leadInspector, 'Caner Yildiz');

  const legacy = plain(state);
  const legacyCanonicalAudit = legacy.audits.find((candidate) => candidate.id === 'AUD-2026-001');
  legacyCanonicalAudit.leadInspectorUserId = null;
  legacyCanonicalAudit.lead = 'Caner Yildiz';
  const ambiguousAudit = legacy.audits.find((candidate) => candidate.id === 'AUD-2026-002');
  ambiguousAudit.leadInspectorUserId = null;
  ambiguousAudit.lead = 'Legacy Display Only';
  const restored = context.mergeDemoState(legacy);
  assert.equal(restored.audits.find((candidate) => candidate.id === 'AUD-2026-001').leadInspectorUserId, 'USR-CANER');
  assert.equal(restored.audits.find((candidate) => candidate.id === 'AUD-2026-002').leadInspectorUserId, null);
  assert.ok(restored.identityMigrationWarnings.some((warning) => /AUD-2026-002/.test(warning)));
  assert.ok(restored.auditLog.some((entry) => entry.action === 'Legacy Lead Inspector identity mapping discarded'));
});

test('WSA-005 canonical and materialized Audits are reachable in Lead assignments and routine coordination', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  state.role = 'leadInspector';
  state.view = 'lead-review';

  let rows = context.leadAssignedAuditRows();
  assert.ok(rows.some((row) => row.id === 'AUD-2026-001' && row.detailAuditId === 'AUD-2026-001'));
  assert.equal(rows.some((row) => /^AUD-2025-/.test(row.id)), false);

  const materialized = progressRoutinePlan(context, state);
  rows = context.leadAssignedAuditRows();
  assert.ok(rows.some((row) => row.id === materialized.audit.id && row.detailAuditId === materialized.audit.id));

  state.view = 'lead-review';
  state.params = {};
  context.handleAction('nav', dataEl({ 'data-view': 'lead-assignment', 'data-id': materialized.audit.id }));
  assert.equal(state.view, 'lead-assignment');
  assert.equal(state.params.auditId, materialized.audit.id);
  assert.doesNotMatch(context.renderContent(), /Send Coordination Package/);
  state.view = 'lead-assignment-questions';
  const materializedQuestions = context.viewLeadAssignmentQuestions();
  assert.match(materializedQuestions, new RegExp('<p>' + materialized.audit.id + '<\\/p>'));
  assert.doesNotMatch(materializedQuestions, /<p>AUD-2026-001<\/p>/);
  state.view = 'lead-assignment';
  context.handleAction('lead-assignment-assign', dataEl({}));
  context.handleAction('lead-assignment-release', dataEl({}));
  assert.match(context.renderContent(), /Send Coordination Package/);
  context.handleAction('lead-assignment-notify-provider', dataEl({ 'data-id': materialized.audit.id }));
  assert.ok(context.serviceProviderInspectionCoordinationRows(state, materialized.audit.orgId)
    .some((row) => row.auditId === materialized.audit.id));
});

test('WSA-006 unauthorized Inspector mutations are byte-for-byte no-ops', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  state.role = 'inspector';
  state.view = 'audit-detail';
  state.params = { auditId: 'AUD-2026-001' };
  const auditId = 'AUD-2026-001';
  const questionId = 'cab-em-eq-pbe';
  state.audits.find((audit) => audit.id === auditId).team = ['Caner Yildiz', 'Mehmet Aydin'];
  state.leadAssignmentsByAudit[auditId].assignmentsByQuestionId[questionId] = { inspectorUserId: 'USR-MEHMET' };

  assert.equal(typeof context.inspectionMutationAuthority, 'function');
  const authority = context.inspectionMutationAuthority(state, auditId, questionId, {
    role: 'inspector', userId: 'USR-AYLIN', name: 'Aylin Sezer'
  });
  assert.equal(authority.allowed, false);
  assert.match(authority.reason, /not a member of this Audit team/i);

  const before = plain({
    workspace: state.inspectionWorkspaces[auditId],
    potentialFindings: state.potentialFindings,
    findings: state.findings,
    auditLog: state.auditLog
  });
  context.handleAction('inspection-set-status', dataEl({ 'data-id': questionId, 'data-status': 'noncompliant' }));
  context.handleAction('inspection-save-draft', dataEl({ 'data-id': auditId }));
  context.handleAction('inspection-complete-sections', dataEl({ 'data-id': auditId }));
  context.handleAction('inspection-submit-lead', dataEl({ 'data-id': auditId }));
  const after = plain({
    workspace: state.inspectionWorkspaces[auditId],
    potentialFindings: state.potentialFindings,
    findings: state.findings,
    auditLog: state.auditLog
  });
  assert.equal(JSON.stringify(after.workspace), JSON.stringify(before.workspace), 'workspace bytes must not change');
  assert.equal(JSON.stringify(after.potentialFindings), JSON.stringify(before.potentialFindings), 'Potential Finding bytes must not change');
  assert.equal(JSON.stringify(after.findings), JSON.stringify(before.findings), 'Finding bytes must not change');
  assert.equal(JSON.stringify(after.auditLog), JSON.stringify(before.auditLog), 'Audit Log bytes must not change');
});

test('WSA-007 result selection and explicit Potential Finding creation are separate and idempotent', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  state.role = 'inspector';
  state.view = 'audit-detail';
  state.params = { auditId: 'AUD-2026-001' };
  const questionId = 'cab-em-eq-pbe';
  const beforeCount = state.potentialFindings.length;

  context.setInspectionComment(questionId, 'PBE serviceability evidence was not available.');
  context.setInspectionStatus(questionId, 'noncompliant');
  assert.equal(state.potentialFindings.length, beforeCount, 'choosing a result must not create a Potential Finding');

  context.handleCreatePotentialFinding('AUD-2026-001', questionId);
  assert.equal(state.potentialFindings.length, beforeCount + 1);
  context.handleCreatePotentialFinding('AUD-2026-001', questionId);
  assert.equal(state.potentialFindings.length, beforeCount + 1, 'repeated creation reuses the exact Audit/question record');
});

test('WSA-008 Observation conversion renders canonical no-CAP/no-Evidence/no-Due-Date defaults', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  state.role = 'inspector';
  context.recordChecklistResult('AUD-2026-001', 'cab-em-eq-pbe', 'observation', 'Observation recorded for Lead review.', []);
  const potential = context.createPotentialFinding('AUD-2026-001', 'cab-em-eq-pbe', { actorName: 'Aylin Sezer' });
  state.role = 'leadInspector';

  const html = context.leadPotentialDecisionRowsHtml([potential]);
  assert.match(html, /<option value="4" selected>Observation<\/option>/);
  assert.doesNotMatch(html, new RegExp('id="pf-cap-required-' + potential.id + '"[^>]*checked'));
  assert.doesNotMatch(html, new RegExp('id="pf-evidence-required-' + potential.id + '"[^>]*checked'));
  assert.match(html, new RegExp('id="pf-due-date-' + potential.id + '"[^>]*value=""'));
});

test('WSA-009 accepted CAP has one canonical cross-role work-state tuple', () => {
  const context = buildContext();
  const state = context.freshState();
  const finding = state.findings.find((candidate) => candidate.id === 'CAB-2026-012');
  assert.equal(typeof context.findingWorkState, 'function');
  assert.deepEqual(plain(context.findingWorkState(finding)), {
    statusKey: 'EVIDENCE_REQUIRED',
    statusLabel: 'CAP Accepted — Evidence Required',
    ownerRole: 'auditee',
    ownerLabel: 'Auditee',
    nextAction: 'Upload evidence',
    dueDate: '2026-06-24',
    closureBasis: null
  });

  context.state = state;
  state.role = 'inspector';
  state.view = 'evidence-review';
  state.capReviewUi = {
    expandedId: finding.id,
    tab: 'cap',
    status: 'all',
    due: 'all',
    organization: 'all',
    level: 'all',
    query: '',
    selectedProviderId: 'fly-namibia',
    decision: '',
    comment: '',
    filtersOpen: true,
    findingTabChosen: true,
    findingDecisions: {}
  };
  const inspectorHtml = context.viewInspectorCapReviews();
  assert.match(inspectorHtml, /CAP Accepted — Evidence Required/);
  assert.match(inspectorHtml, /Current Owner<\/span><b>Auditee<\/b>/);
  assert.match(inspectorHtml, /Next Action<\/span><b>Upload evidence<\/b>/);
  assert.doesNotMatch(inspectorHtml, /Review CAP and evidence/);
});

test('WSA-009 submitted Evidence has one canonical cross-role work-state tuple', () => {
  const context = buildContext();
  const state = context.freshState();
  const finding = state.findings.find((candidate) => candidate.id === 'CAB-2026-011');
  finding.status = 'EVIDENCE_SUBMITTED';
  finding.cap.status = 'Accepted';
  finding.evidence = [{
    id: 'EV-CAB-2026-011-1',
    version: 1,
    fileName: 'Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf',
    uploadedDate: '2026-06-15',
    status: 'Uploaded'
  }];

  assert.deepEqual(plain(context.findingWorkState(finding)), {
    statusKey: 'EVIDENCE_SUBMITTED',
    statusLabel: 'Evidence Submitted — Pending Review',
    ownerRole: 'inspector',
    ownerLabel: 'CAA Inspector',
    nextAction: 'Review evidence',
    dueDate: '2026-06-19',
    closureBasis: null
  });

  context.state = state;
  state.role = 'auditee';
  const auditeeHtml = context.serviceProviderCapDossier(finding);
  assert.match(auditeeHtml, /Evidence Submitted — Pending Review/);
  assert.match(auditeeHtml, /Current owner<\/dt><dd>CAA Inspector<\/dd>/);
  assert.match(auditeeHtml, /Next action<\/dt><dd>Review evidence<\/dd>/);
  assert.doesNotMatch(auditeeHtml, /Selected Finding[\s\S]*CAP Accepted — Evidence Required[\s\S]*Evidence Submitted \/ CAA Review/);
});

test('WSA-009 partially accepted Evidence returns one canonical Auditee work-state tuple', () => {
  const context = buildContext();
  const state = context.freshState();
  const finding = state.findings.find((candidate) => candidate.id === 'CAB-2026-011');
  finding.status = 'EVIDENCE_MORE_INFO';
  finding.cap.status = 'Accepted';
  finding.evidence = [{
    id: 'EV-CAB-2026-011-1',
    version: 1,
    fileName: 'Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf',
    uploadedDate: '2026-06-15',
    status: 'Partially Accepted'
  }];

  assert.deepEqual(plain(context.findingWorkState(finding)), {
    statusKey: 'EVIDENCE_MORE_INFO',
    statusLabel: 'More Information Requested (Evidence)',
    ownerRole: 'auditee',
    ownerLabel: 'Auditee',
    nextAction: 'Provide more evidence',
    dueDate: '2026-06-19',
    closureBasis: null
  });

  context.state = state;
  state.role = 'auditee';
  const auditeeHtml = context.serviceProviderCapDossier(finding);
  assert.match(auditeeHtml, /More Information Requested \(Evidence\)/);
  assert.match(auditeeHtml, /Current owner<\/dt><dd>Auditee<\/dd>/);
  assert.match(auditeeHtml, /Next action<\/dt><dd>Provide more evidence<\/dd>/);
});

test('WSA-010 authorized closure projects its actual basis without fictional CAP or Evidence completion', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  const finding = state.findings.find((candidate) => candidate.id === 'CAB-2026-014');
  assert.equal(typeof context.findingLifecycleProjection, 'function');

  const projection = plain(context.findingLifecycleProjection(finding));
  assert.equal(projection.closureBasis, 'authorized');
  assert.equal(projection.closureLabel, 'Authorized closure (audit-logged)');
  assert.equal(projection.steps.find((step) => step.key === 'finding-issued').state, 'complete');
  assert.equal(projection.steps.find((step) => step.key === 'cap-submitted').state, 'not-required');
  assert.equal(projection.steps.find((step) => step.key === 'evidence-submitted').state, 'not-required');
  assert.equal(projection.steps.find((step) => step.key === 'closed').state, 'complete');

  const banner = context.nextActionBar(finding);
  assert.match(banner, /Authorized closure \(audit-logged\)/);
  assert.doesNotMatch(banner, /after evidence acceptance/i);
});

test('WSA-011 stakeholder labels are humanized and returned reports reconcile in counters', () => {
  const context = buildContext();
  const expected = {
    returned_to_lead: 'Returned to Lead Inspector',
    released_to_department: 'Released to Department',
    accepted_by_department: 'Accepted by Department',
    lead_inspector_assigned: 'Lead Inspector Assigned',
    team_schedule_proposed: 'Team and Schedule Proposed',
    ready_for_execution: 'Ready for Execution'
  };
  Object.entries(expected).forEach(([status, label]) => assert.equal(context.humanStatus(status), label));
  assert.equal(context.leadPreliminaryStatusMeta('returned_to_lead').label, 'Returned to Lead Inspector');
  assert.match(context.leadPreliminaryMetricsHtml([{ status: 'returned_to_lead' }]), /Returned[\s\S]*>1</);

  const state = context.freshState();
  const item = state.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');
  context.applyFinancePlanningDecision(item, {
    decision: 'return', actor: { role: 'finance', name: 'Derya Acar' }, comment: 'Revise allocation.'
  });
  context.applyApprovalDecision(item, {
    decision: 'forward', actor: { role: 'manager', name: 'Mehmet Kaya' }, comment: 'Revised and resubmitted.'
  });
  assert.deepEqual(plain(context.financeReviewStatus(item)), {
    key: 'pending', label: 'Pending Finance Review', tone: 'warn'
  });
});

test('WSA-013 Inspector assignment search rerenders immediately with query/result synchronization', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = 'inspector';
  context.state.view = 'inspector-assignments';
  let renderCount = 0;
  context.render = function renderSpy() { renderCount += 1; };

  context.handleInspectorAssignmentsFieldChange('inspector-assignment-query', dataEl({ value: 'ZZZ-NO-MATCH' }));
  assert.equal(context.state.inspectorAssignmentsUi.query, 'ZZZ-NO-MATCH');
  assert.equal(renderCount, 1);
  assert.match(context.viewInspectorAssignments(), /No assignments match these filters/);

  context.handleInspectorAssignmentsFieldChange('inspector-assignment-query', dataEl({ value: '' }));
  assert.equal(renderCount, 2);
  assert.doesNotMatch(context.viewInspectorAssignments(), /No assignments match these filters/);
});

test('WSA-014 new lifecycle timestamps use the deterministic 15 June demo clock', () => {
  const context = buildContext();
  const state = context.freshState();
  context.state = state;
  assert.equal(typeof context.demoNowIso, 'function');
  assert.match(context.demoNowIso(), /^2026-06-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  state.role = 'inspector';
  state.view = 'inspector-assignments';
  context.handleInspectorAssignmentApply();
  assert.match(state.inspectorAssignmentsUi.appliedAt, /^2026-06-15T/);

  state.view = 'audit-detail';
  state.params = { auditId: 'AUD-2026-001' };
  context.handleInspectionSaveDraft('AUD-2026-001');
  assert.match(state.inspectionWorkspaces['AUD-2026-001'].draftSavedAt, /^2026-06-15T/);
});
