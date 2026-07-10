const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
const stylesCss = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const downloadClicks = [];
let lastObjectUrlBlob = null;

function cssRuleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stylesCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  return match ? match[1] : '';
}

const inspectionFileRule = cssRuleBody('.inspection-file');
const inspectionFileNameRule = cssRuleBody('.inspection-file__name');
const inspectionTableRule = cssRuleBody('.inspection-table');
const responsiveInspectionTableRule = cssRuleBody('.responsive-table-shell .inspection-table');
assert.match(inspectionFileRule, /white-space:\s*normal/);
assert.doesNotMatch(inspectionFileRule, /white-space:\s*nowrap/);
assert.match(inspectionFileRule, /width:\s*100%/);
assert.match(inspectionFileNameRule, /overflow-wrap:\s*anywhere/);
assert.match(inspectionFileNameRule, /word-break:\s*break-word/);
assert.match(inspectionTableRule, /min-width:\s*1080px/);
assert.match(responsiveInspectionTableRule, /min-width:\s*1080px/);

function stubElement(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: '',
      innerHTML: '',
      hidden: false,
      style: {},
      parentNode: null,
      addEventListener() {},
      appendChild(child) { child.parentNode = this; this.child = child; },
      removeChild(child) { if (this.child === child) this.child = null; child.parentNode = null; },
      closest() { return null; }
    });
  }
  return elements.get(id);
}

function stubCreatedElement() {
  return {
    className: '',
    innerHTML: '',
    style: {},
    parentNode: null,
    href: '',
    download: '',
    click() {
      downloadClicks.push({
        href: this.href,
        download: this.download,
        text: lastObjectUrlBlob ? lastObjectUrlBlob.parts.join('') : ''
      });
    }
  };
}

function dataEl(attrs) {
  return {
    getAttribute(name) { return attrs[name] || ''; }
  };
}

const context = {
  console,
  window: { scrollTo() {} },
  document: {
    body: stubElement('body'),
    addEventListener() {},
    createElement: stubCreatedElement,
    getElementById: stubElement,
    querySelectorAll() { return []; }
  },
  Blob: function MockBlob(parts, options) {
    this.parts = parts;
    this.type = options && options.type;
  },
  URL: {
    createObjectURL(blob) {
      lastObjectUrlBlob = blob;
      return 'blob:mock-' + downloadClicks.length;
    },
    revokeObjectURL() {}
  },
  setTimeout,
  clearTimeout
};
vm.createContext(context);

[
  'js/data.js',
  'js/helpers.js',
  'js/approval.js',
  'js/checklists.js',
  'js/inspection.js',
  'js/planning.js',
  'js/reports.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

Object.assign(context.state, context.freshState());
context.state.role = 'inspector';
context.state.view = context.homeView('inspector');
context.state.params = {};
context.render();

const html = elements.get('app-root').innerHTML;
const inspectorNavLabels = context.NAV.inspector
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');
const initialOutput = inspectorNavLabels + ' ' + html;

assert.equal(context.homeView('inspector'), 'inspector-assignments');
assert(initialOutput.includes('Findings'), 'Inspector nav should show Findings.');
assert(!initialOutput.includes('CAP Verification'), 'Inspector nav should not show separate CAP Verification.');
assert.match(html, /My Assignments/);
assert.match(html, /View and manage all audits and tasks assigned to you\./);
assert.match(html, /Open Assignments/);
assert.match(html, /Total Assigned/);
assert.match(html, /Search audits/);
assert.match(html, /responsive-filter-row/);
assert.match(html, /All Status/);
assert.match(html, /All Types/);
assert.match(html, /All Organizations/);
assert.match(html, /Date Range/);
assert.match(html, /Audit \/ Inspection/);
assert.match(html, /Inspection Dates/);
assert.match(html, /Due Date/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /PR-2026-018/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Ramp Safety Inspection/);
assert.match(html, /SMS Audit/);
assert.match(html, /Dangerous Goods Inspection/);
assert.match(html, /Continue/);
assert.match(html, /Start/);
assert.match(html, /View Report/);
assert.match(inspectorNavLabels, /Dashboard/);
assert.match(inspectorNavLabels, /My Assignments/);
assert.match(inspectorNavLabels, /Findings/);
assert.doesNotMatch(inspectorNavLabels, /CAP Verification/);
assert.doesNotMatch(inspectorNavLabels, /Checklists/);
assert.doesNotMatch(inspectorNavLabels, /CAP Actions/);
assert.doesNotMatch(inspectorNavLabels, /Documents/);
assert.match(inspectorNavLabels, /Messages/);
assert.match(inspectorNavLabels, /Calendar/);
assert.match(html, /Reports/);
assert.doesNotMatch(html, /My Inspections/);
assert.doesNotMatch(html, /Assigned Inspections/);
assert.doesNotMatch(html, /Draft Reports/);
assert.doesNotMatch(inspectorNavLabels, /Evidence/);
assert.doesNotMatch(html, /Today’s Workbench/);
assert.doesNotMatch(html, /Audit Work Queue/);
assert.doesNotMatch(html, /Inspection Evidence/);
assert.doesNotMatch(html, /Operators \/ Providers/);
assert.doesNotMatch(html, /Offline Field/);
assert.doesNotMatch(html, /Inspection Packages/);
assert.doesNotMatch(html, /NAMCARS Library/);
assert.doesNotMatch(html, /Cross-Reference/);
assert.doesNotMatch(html, /Checklist Builder/);
assert.doesNotMatch(html, /Search regulation/);
assert.doesNotMatch(html, /Open cross-reference/);
assert.doesNotMatch(html, /Preparation pending packages/);
assert.doesNotMatch(html, /Open assigned audit package/);
assert.doesNotMatch(html, /data-view="package-builder"/);
assert.doesNotMatch(html, /data-view="regulatory-library"/);
assert.doesNotMatch(html, /data-view="checklist-builder"/);
assert.doesNotMatch(html, /data-view="templates"/);
assert.doesNotMatch(html, /Overdue Actions/);
assert.doesNotMatch(html, /Overdue CAPs \/ actions/);
assert.doesNotMatch(html, /Delayed CAP trend/);
assert.doesNotMatch(html, /Open overdue/);
assert.doesNotMatch(html, /data-filter="overdue"/);
assert.doesNotMatch(html, /Repeat Findings/);
assert.doesNotMatch(html, /Repeat findings/);
assert.doesNotMatch(html, /Review repeats/);
assert.doesNotMatch(html, /Repeated regulation references/);
assert.doesNotMatch(html, /repeat oversight signals/i);
assert.doesNotMatch(html, /data-view="cap-effectiveness"/);
assert.doesNotMatch(inspectorNavLabels, /Today’s Workbench/);
assert.doesNotMatch(inspectorNavLabels, /Audit Work Queue/);
assert.doesNotMatch(inspectorNavLabels, /Inspection Evidence/);
assert.doesNotMatch(inspectorNavLabels, /Operators \/ Providers/);
assert.doesNotMatch(inspectorNavLabels, /Inspection Packages/);
assert.doesNotMatch(inspectorNavLabels, /NAMCARS Library/);
assert.doesNotMatch(inspectorNavLabels, /Cross-Reference/);
assert.doesNotMatch(inspectorNavLabels, /Checklist Builder/);
assert.doesNotMatch(inspectorNavLabels, /Offline Field/);
assert.doesNotMatch(inspectorNavLabels, /Overdue Actions/);
assert.doesNotMatch(inspectorNavLabels, /Repeat Findings/);
assert.equal(context.NAV.inspector.some((item) => item.label === 'My Assignments' && item.view === 'inspector-assignments'), true);
assert.equal(context.NAV.inspector.some((item) => item.label === 'Findings' && item.view === 'findings'), true);
assert.equal(context.NAV.inspector.some((item) => item.label === 'Findings' && item.filter === 'open'), false);
assert.equal(context.NAV.inspector.some((item) => item.label === 'CAP Verification' && item.filter === 'capreview'), false);
assert.equal(context.NAV.inspector.some((item) => item.label === 'Findings Review'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'package-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'regulatory-library'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'checklist-builder'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'templates'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'cap-effectiveness'), false);
assert.equal(context.NAV.inspector.some((item) => item.view === 'offline-field'), false);
assert.equal(context.NAV.manager.some((item) => item.view === 'checklist-builder' && item.label === 'Checklist Builder'), false);
assert.equal(context.NAV.manager.some((item) => item.view === 'manager-checklists' && item.label === 'Checklist Management'), true);
assert.equal(context.NAV.admin.some((item) => item.view === 'regulatory-library' && item.label === 'NAMCARS Library'), true);
assert.equal(context.NAV.manager.some((item) => item.view === 'cap-effectiveness' && item.label === 'Repeat Findings'), false);
assert.equal(context.NAV.manager.some((item) => item.view === 'cap-monitoring' && item.label === 'CAP Monitoring'), true);

context.go('cap-verification');
const legacyCapRedirectHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'findings');
assert.equal(context.state.params.filter, 'open');
assert.equal(context.state.selectedFilters.findings, 'open');
assert.match(legacyCapRedirectHtml, /Findings/);
assert.match(legacyCapRedirectHtml, /All findings and CAPs from this inspection/);
assert.doesNotMatch(legacyCapRedirectHtml, /CAP Verification/);
context.go('inspector-assignments');

context.handleAction('inspector-assignment-filter', dataEl({ 'data-status': 'in-progress' }));
const inProgressAssignmentsHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'inspector-assignments');
assert.equal(context.state.inspectorAssignmentsUi.status, 'in-progress');
assert.match(inProgressAssignmentsHtml, /My Assignments \/ <span>In Progress<\/span>/);
assert.match(inProgressAssignmentsHtml, /Questions Assigned/);
assert.match(inProgressAssignmentsHtml, /426/);
assert.match(inProgressAssignmentsHtml, /Remaining/);
assert.match(inProgressAssignmentsHtml, /341/);
assert.match(inProgressAssignmentsHtml, /Avg\. Completion/);
assert.match(inProgressAssignmentsHtml, /20%/);
assert.match(inProgressAssignmentsHtml, /Sections Overview/);
assert.match(inProgressAssignmentsHtml, /Emergency Equipment \(22 Questions\)/);
assert.match(inProgressAssignmentsHtml, /Continue Working/);
assert.doesNotMatch(inProgressAssignmentsHtml, /Dangerous Goods Inspection/);

context.state.view = 'audit-detail';
context.state.params = { auditId: 'AUD-2026-001' };
context.state.inspectionWorkspaces['AUD-2026-001'].selectedSectionKey = 'cockpit-cabin-exits';
context.render();
let auditExecutionHtml = elements.get('app-root').innerHTML;
assert.match(auditExecutionHtml, /2026 Cabin Inspection - Fly Namibia/);
assert.match(auditExecutionHtml, /Cockpit, Cabin General Condition \+ Exits/);
assert.match(auditExecutionHtml, /All Sections Complete/);
assert.doesNotMatch(auditExecutionHtml, /SMS Oversight Audit|Safety Policy and Objectives/);
context.handleAction('inspection-complete-sections', dataEl({ 'data-id': 'AUD-2026-001' }));
auditExecutionHtml = elements.get('app-root').innerHTML;
assert.ok(context.state.inspectionWorkspaces['AUD-2026-001'].allSectionsCompletedAt);
assert.match(auditExecutionHtml, /Ready to Submit/);
assert.match(auditExecutionHtml, /Sections Complete/);
assert.match(auditExecutionHtml, /<th style="width:260px">Attached File<\/th>/);

context.handleAction('inspection-file-open', dataEl({ 'data-id': 'cab-exit-safety-strap' }));
assert.match(elements.get('modal-host').innerHTML, /Attach checklist evidence/);
assert.match(elements.get('modal-host').innerHTML, /Attach Mock File/);
context.handleAction('inspection-file-attach', dataEl({ 'data-id': 'cab-exit-safety-strap' }));
assert.equal(context.state.inspectionWorkspaces['AUD-2026-001'].answersByQuestionId['cab-exit-safety-strap'].file, 'inspection_6_1_evidence.pdf');
auditExecutionHtml = elements.get('app-root').innerHTML;
assert.match(auditExecutionHtml, /inspection_6_1_evidence\.pdf/);

const downloadCountBefore = downloadClicks.length;
context.handleAction('inspection-file-download', dataEl({ 'data-id': 'cab-exit-safety-strap' }));
assert.equal(downloadClicks.length, downloadCountBefore + 1);
assert.equal(downloadClicks[downloadClicks.length - 1].download, 'inspection_6_1_evidence_mock-download.txt');
assert.match(downloadClicks[downloadClicks.length - 1].text, /Audit: 2026 Cabin Inspection - Fly Namibia/);
assert.match(downloadClicks[downloadClicks.length - 1].text, /Organization: Fly Namibia/);
assert.doesNotMatch(downloadClicks[downloadClicks.length - 1].text, /SMS Oversight|SkyCargo Air/);
assert.ok(context.state.inspectionWorkspaces['AUD-2026-001'].downloadedAttachmentIds['cab-exit-safety-strap']);

context.handleAction('inspection-set-status', dataEl({ 'data-id': 'cab-exit-safety-strap', 'data-status': 'noncompliant' }));
assert.equal(context.state.inspectionWorkspaces['AUD-2026-001'].answersByQuestionId['cab-exit-safety-strap'].status, 'noncompliant');
assert.equal(context.state.potentialFindings.length, 0, 'required comment prevents premature Potential Finding creation');
context.setInspectionComment('cab-exit-safety-strap', 'Exit safety strap was not serviceable during the cabin inspection.');
assert.equal(context.state.potentialFindings.length, 1);
assert.equal(context.state.potentialFindings[0].auditId, 'AUD-2026-001');
assert.equal(context.state.potentialFindings[0].questionId, 'cab-exit-safety-strap');
assert.equal(context.state.findings.some((finding) => /^SMS-/.test(finding.id)), false);

context.handleAction('inspection-submit-lead', dataEl({ 'data-id': 'AUD-2026-001' }));
auditExecutionHtml = elements.get('app-root').innerHTML;
assert.ok(context.state.inspectionWorkspaces, 'audit-scoped Inspector execution state exists');
assert.ok(context.state.inspectionWorkspaces['AUD-2026-001'], 'opened audit execution state exists');
assert.ok(context.state.inspectionWorkspaces['AUD-2026-001'].submittedAt);
const submittedAt = context.state.inspectionWorkspaces['AUD-2026-001'].submittedAt;
assert.equal(context.state.role, 'inspector');
assert.equal(context.state.view, 'audit-detail');
assert.equal(context.state.params.auditId, 'AUD-2026-001');
assert.match(auditExecutionHtml, /Submitted to Lead Inspector/);
assert.match(auditExecutionHtml, />Submitted<\/button>/);
assert.doesNotMatch(auditExecutionHtml, /data-act="inspection-submit-lead"[^>]*disabled/);
assert.match(elements.get('modal-host').innerHTML, /Checklist Submitted Successfully/);
assert.match(elements.get('modal-host').innerHTML, /Waiting for Lead Inspector Review/);
assert.match(elements.get('modal-host').innerHTML, /Checklist Completed/);
assert.match(elements.get('modal-host').innerHTML, /Lead Inspector Review/);
assert.match(elements.get('modal-host').innerHTML, /Final Report Preparation/);
assert.match(elements.get('modal-host').innerHTML, /Department Approval/);
assert.match(elements.get('modal-host').innerHTML, /View Submitted Checklist/);
assert.match(elements.get('modal-host').innerHTML, /Return to My Assignments/);
assert.doesNotMatch(elements.get('modal-host').innerHTML, /Open Inspector Question Workspace|lead-assignment-questions/);

context.handleAction('inspection-submit-lead', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionWorkspaces['AUD-2026-001'].submittedAt, submittedAt);
assert.match(elements.get('modal-host').innerHTML, /Checklist Submitted Successfully/);

context.handleAction('nav', dataEl({ 'data-view': 'lead-assignment-questions', 'data-id': 'AUD-2026-001' }));
const inspectorQuestionWorkspaceHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.role, 'inspector');
assert.equal(context.state.view, 'inspector-assignments');
assert.match(inspectorQuestionWorkspaceHtml, /My Assignments/);
assert.doesNotMatch(inspectorQuestionWorkspaceHtml, /Inspector Question Workspace|Assign Checklist Questions/);

context.state.view = 'regulatory-library';
context.state.params = {};
context.render();
const restrictedRegulatoryHtml = elements.get('app-root').innerHTML;
assert.match(restrictedRegulatoryHtml, /My Assignments/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Regulatory Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /NAMCARS Library/);
assert.doesNotMatch(restrictedRegulatoryHtml, /Cross-Reference/);

context.state.view = 'checklist-builder';
context.state.params = {};
context.render();
const restrictedBuilderHtml = elements.get('app-root').innerHTML;
assert.match(restrictedBuilderHtml, /My Assignments/);
assert.doesNotMatch(restrictedBuilderHtml, /Checklist Builder/);

context.state.view = 'findings';
context.state.params = { filter: 'open' };
context.render();
const findingsHtml = elements.get('app-root').innerHTML;
assert.match(findingsHtml, /Findings/);
assert.match(findingsHtml, /All Findings/);
assert.match(findingsHtml, /Waiting for CAP/);
assert.match(findingsHtml, /CAP Submitted/);
assert.match(findingsHtml, /Perimeter Fence Security/);
assert.match(findingsHtml, /Access Control System/);
assert.doesNotMatch(findingsHtml, /Overdue Findings/);
assert.doesNotMatch(findingsHtml, /data-filter="overdue"/);

context.state.view = 'reports';
context.state.params = {};
context.render();
const inspectorReportsHtml = elements.get('app-root').innerHTML;
assert.match(inspectorReportsHtml, /Past closure reports \(view only\)\./);
assert.match(inspectorReportsHtml, /Past Reports/);
assert.match(inspectorReportsHtml, /Cabin crew manual revision not distributed/);
assert.match(inspectorReportsHtml, /Pre-flight documentation filing incomplete/);
assert.match(inspectorReportsHtml, /View report/);
assert.doesNotMatch(inspectorReportsHtml, /CAP state/);
assert.doesNotMatch(inspectorReportsHtml, /Corrective Action Plan/);
assert.doesNotMatch(inspectorReportsHtml, /Evidence v/);
assert.doesNotMatch(inspectorReportsHtml, /Open finding/);

context.state.view = 'findings';
context.state.params = { filter: 'capreview' };
context.state.capReviewUi = {
  expandedId: 'F-014-02',
  tab: 'cap',
  status: 'all',
  due: 'all',
  query: '',
  decision: '',
  comment: '',
  filtersOpen: true,
  findingDecisions: {}
};
context.render();
const capReviewHtml = elements.get('app-root').innerHTML;
const capReviewOutput = capReviewHtml.replace(/&amp;/g, '&');
assert.match(capReviewHtml, /Findings/);
assert.match(capReviewHtml, /responsive-workbench/);
assert.match(capReviewHtml, /responsive-filter-row/);
assert.match(capReviewHtml, /finding-board--dossier/);
assert.match(capReviewHtml, /finding-queue-panel/);
assert.match(capReviewHtml, /All findings and CAPs from this inspection/);
assert.match(capReviewHtml, /SkyCargo Air/);
assert.match(capReviewHtml, /Routine Inspection/);
assert.match(capReviewHtml, /All Findings/);
assert.match(capReviewHtml, /Returned/);
assert.match(capReviewHtml, /Closed/);
assert.match(capReviewHtml, /Perimeter Fence Security/);
assert.match(capReviewHtml, /CCTV Coverage Gaps/);
assert.match(capReviewHtml, /CAP &amp; Verification/);
assert(capReviewOutput.includes('CAP & Verification'), 'Unified Findings detail should include CAP & Verification.');
assert.match(capReviewHtml, /Finding Queue/);
assert.match(capReviewHtml, /Current Owner/);
assert.match(capReviewHtml, /Next Action/);
assert.match(capReviewHtml, /CAP Summary/);
assert.match(capReviewHtml, /Inspector Verification/);
assert.match(capReviewHtml, /Accept CAP/);
assert.match(capReviewHtml, /Return for Revision/);
assert.match(capReviewHtml, /Returned Flow/);
assert.match(capReviewHtml, /Service Provider View/);
assert.match(capReviewHtml, /Inspector View/);
assert.match(capReviewHtml, /data-act="cap-review-row"/);
assert.doesNotMatch(capReviewHtml, /cap-review-expanded-row/);
assert.doesNotMatch(capReviewHtml, /data-field="cap-review-decision"/);
assert.doesNotMatch(capReviewHtml, /Submit Decision/);
assert.doesNotMatch(capReviewHtml, /Every finding shows owner/);

context.handleAction('cap-review-tab', dataEl({ 'data-id': 'F-014-02', 'data-tab': 'details' }));
const capReviewDetailsHtml = elements.get('app-root').innerHTML;
assert.match(capReviewDetailsHtml, /Finding Description/);
assert.match(capReviewDetailsHtml, /CAP Timeline/);
assert.match(capReviewDetailsHtml, /finding-detail-split/);
assert.match(capReviewDetailsHtml, /finding-meta-card/);
assert.match(capReviewDetailsHtml, /Organization/);
assert.match(capReviewDetailsHtml, /Finding Type/);
assert.match(stylesCss, /\.finding-detail-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(136px,\s*1fr\)\)/s);
assert.match(stylesCss, /\.finding-detail-tabs button\s*\{[^}]*min-width:\s*0;/s);
assert.match(stylesCss, /\.finding-board\.finding-board--dossier\.responsive-workbench--with-rail\s*\{[^}]*grid-template-columns:\s*minmax\(300px,\s*360px\)\s+minmax\(0,\s*1fr\)/s);
assert.match(stylesCss, /\.finding-action-strip\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(140px,\s*1fr\)\)/s);
assert.match(stylesCss, /\.finding-meta-card div\s*\{[^}]*min-width:\s*0;/s);
assert.match(stylesCss, /\.finding-detail-panel \.finding-detail-split\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(260px,\s*\.48fr\)/s);
assert.match(stylesCss, /\.finding-detail-panel \.finding-meta-card\s*\{[^}]*minmax\(132px,\s*1fr\)/s);
context.handleAction('cap-review-tab', dataEl({ 'data-id': 'F-014-02', 'data-tab': 'cap' }));

context.handleCapReviewProvider('skyfuel');
const skyFuelHtml = elements.get('app-root').innerHTML;
assert.match(skyFuelHtml, /SkyFuel Services/);
assert.match(skyFuelHtml, /Fuel Storage Area Security/);
assert.match(skyFuelHtml, /Spill Response Equipment/);
assert.doesNotMatch(skyFuelHtml, /Perimeter Fence Security/);

context.state.role = 'inspector';
context.state.view = 'cap-review-detail';
context.state.params = { findingId: 'F-014-01' };
context.state.capTrackingUi = {
  tab: 'overview',
  detailTab: 'details',
  selectedFindingId: 'F-014-01',
  inspectorPackageEvaluation: 'acceptable',
  inspectorPackageComment: ''
};
context.render();
const inspectorSubmittedCapDetailHtml = elements.get('app-root').innerHTML;
assert.match(inspectorSubmittedCapDetailHtml, /CAP Review - Perimeter Fence Security \(F-014-01\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Level 1 \(Critical\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Pending Review/);
assert.match(inspectorSubmittedCapDetailHtml, /Finding Information/);
assert.match(inspectorSubmittedCapDetailHtml, /Service Provider Corrective Action Plan \(CAP\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Inspector Evaluation/);
assert.match(inspectorSubmittedCapDetailHtml, /Finding Snapshot/);
assert.match(inspectorSubmittedCapDetailHtml, /Attachments \(2\)/);
assert.match(inspectorSubmittedCapDetailHtml, /Review Timeline/);
assert.match(inspectorSubmittedCapDetailHtml, /Request Revision/);
assert.match(inspectorSubmittedCapDetailHtml, /Reject CAP/);
assert.match(inspectorSubmittedCapDetailHtml, /Accept CAP/);
assert.match(inspectorSubmittedCapDetailHtml, /data-act="inspector-cap-package-accept"/);

context.handleAction('inspector-cap-package-accept', dataEl({ 'data-id': 'F-014-01' }));
const leadFinalReadyHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.role, 'leadInspector');
assert.equal(context.state.view, 'audit-reports');
assert.equal(context.state.params.filter, 'final');
assert.equal(context.state.capTrackingUi.finalReportReadyAt, '30 Jun 2026 16:20');
assert.match(leadFinalReadyHtml, /Final Reports/);
assert.match(leadFinalReadyHtml, /View and manage all final reports you are leading/);
assert.match(leadFinalReadyHtml, /INS-2026-014/);
assert.match(leadFinalReadyHtml, /Ready for Preparation/);
assert.match(leadFinalReadyHtml, /Findings Summary/);
assert.match(leadFinalReadyHtml, /CAP Implementation/);
assert.match(leadFinalReadyHtml, /9 \/ 9 findings ready/);
assert.match(leadFinalReadyHtml, /All CAPs approved/);
assert.match(leadFinalReadyHtml, /Prepare Report/);

context.handleAction('final-report-ready-action', dataEl({ 'data-final-action': 'preview' }));
const leadFinalReportViewHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.view, 'final-report-view');
assert.match(leadFinalReportViewHtml, /Final Report/);
assert.match(leadFinalReportViewHtml, /FR-2026-018/);
assert.match(leadFinalReportViewHtml, /Fly Namibia/);
assert.match(leadFinalReportViewHtml, /Executive Summary/);
assert.match(leadFinalReportViewHtml, /Inspection Overview/);
assert.match(leadFinalReportViewHtml, /Findings Overview/);
assert.match(leadFinalReportViewHtml, /Next Steps/);
assert.match(leadFinalReportViewHtml, /CAP\/Evidence; acceptance does not by itself close a Finding/);
assert.match(leadFinalReportViewHtml, /Export PDF/);
assert.match(leadFinalReportViewHtml, /Print Report/);
assert.match(leadFinalReportViewHtml, /No approval mark is recorded/);
assert.doesNotMatch(leadFinalReportViewHtml, /SkyCargo Air|INS-2026-014|DEMO APPROVAL MARK/);
assert.equal(typeof context.buildFinalReportPdfDocument, 'function');
assert.match(context.buildFinalReportPdfDocument(), /^%PDF-1\.4/);
context.handleAction('final-report-export-pdf', dataEl({}));
assert.ok(context.state.capTrackingUi.finalReportPdfExportedAt);
context.state.view = 'audit-reports';
context.state.params = { filter: 'final' };
context.render();

context.handleAction('final-report-ready-action', dataEl({ 'data-final-action': 'prepare' }));
const leadFinalPrepareHtml = elements.get('app-root').innerHTML;
assert.ok(context.state.capTrackingUi.finalReportPreparedAt);
assert.equal(context.state.view, 'final-report-prepare');
assert.match(leadFinalPrepareHtml, /Report Content/);
assert.match(leadFinalPrepareHtml, /All CAPs Approved/);
assert.match(leadFinalPrepareHtml, /1\. Executive Summary/);
assert.match(leadFinalPrepareHtml, /Back to Final Report Submission/);
assert.match(leadFinalPrepareHtml, /Save & Continue to Review/);
assert.match(leadFinalPrepareHtml, /Provide a high-level overview/);
assert.match(leadFinalPrepareHtml, /data-field="final-report-content"/);
assert.match(leadFinalPrepareHtml, /Report Progress/);
assert.match(leadFinalPrepareHtml, /Report Summary/);
assert.match(leadFinalPrepareHtml, /CAPs Approved/);
assert.match(leadFinalPrepareHtml, /Attachments \(5\)/);
assert.match(leadFinalPrepareHtml, /Next Section/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareNextHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'overview');
assert.match(leadFinalPrepareNextHtml, /Inspection Overview/);
assert.match(leadFinalPrepareNextHtml, /Organizations & CAPs Overview/);
assert.match(leadFinalPrepareNextHtml, /Total CAPs Submitted/);
assert.match(leadFinalPrepareNextHtml, /Approval Workflow Status/);
assert.match(leadFinalPrepareNextHtml, /Next: Findings Summary/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareFindingsHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'findings');
assert.match(leadFinalPrepareFindingsHtml, /Findings Summary/);
assert.match(leadFinalPrepareFindingsHtml, /data-field="final-report-content"/);

context.handleAction('final-report-prepare-next', dataEl({}));
const leadFinalPrepareCapHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'cap');
assert.match(leadFinalPrepareCapHtml, /CAP Implementation Summary/);
assert.match(leadFinalPrepareCapHtml, /CAP implementation was reviewed/);

context.handleAction('final-report-prepare-review', dataEl({}));
const leadFinalPrepareReviewHtml = elements.get('app-root').innerHTML;
assert.equal(context.state.capTrackingUi.finalReportPrepareStep, 'review');
assert.ok(context.state.capTrackingUi.finalReportSavedAt);
assert.match(leadFinalPrepareReviewHtml, /Review &amp; Submit/);
assert.match(leadFinalPrepareReviewHtml, /Review Checklist/);
assert.match(leadFinalPrepareReviewHtml, /Submit for Approval/);
assert.match(leadFinalPrepareReviewHtml, /Attachments/);
assert.match(leadFinalPrepareReviewHtml, /Lead Inspector Comments/);
assert.match(leadFinalPrepareReviewHtml, /Submission Note/);
assert.doesNotMatch(leadFinalPrepareReviewHtml, /data-field="final-report-content"/);

context.handleAction('final-report-prepare-submit', dataEl({}));
const finalSubmitModalHtml = elements.get('modal-host').innerHTML;
assert.equal(elements.get('modal-host').hidden, false);
assert.match(finalSubmitModalHtml, /Submit Final Report for Approval/);
assert.match(finalSubmitModalHtml, /Confirm Submit/);
assert.match(finalSubmitModalHtml, /Next Approver/);
assert.equal(context.state.capTrackingUi.finalReportSubmittedAt, '');

context.handleAction('final-report-prepare-confirm-submit', dataEl({}));
assert.equal(elements.get('modal-host').hidden, true);
assert.ok(context.state.capTrackingUi.finalReportSubmittedAt);

context.state.role = 'inspector';
context.state.view = 'cap-review-detail';
context.state.params = { findingId: 'F-2026-002' };
context.state.capTrackingUi = {
  tab: 'overview',
  detailTab: 'details',
  reminderSentAt: '',
  exportedAt: '',
  selectedFindingId: 'F-2026-002',
  inspectorReviewSentAt: '',
  leadInspectorRecommendationAt: '',
  submittedToUnitManagerAt: ''
};
context.render();
const inspectorCapDetailHtml = elements.get('app-root').innerHTML;
assert.match(inspectorCapDetailHtml, /CAP Review \(Inspector\)/);
assert.match(inspectorCapDetailHtml, /Under Inspector Review/);
assert.match(inspectorCapDetailHtml, /CAP Review \(Inspector\) › CAP-2025-045-001/);
assert.match(inspectorCapDetailHtml, /Finding Information/);
assert.match(inspectorCapDetailHtml, /Inadequate Flight Duty Time Monitoring/);
assert.match(inspectorCapDetailHtml, /CAP Details/);
assert.match(inspectorCapDetailHtml, /Evidence/);
assert.match(inspectorCapDetailHtml, /Inspector Assessment/);
assert.match(inspectorCapDetailHtml, /Comments &amp; History/);
assert.match(inspectorCapDetailHtml, /Corrective Action Plan by Service Provider/);
assert.match(inspectorCapDetailHtml, /Evidence Submitted \(5\)/);
assert.match(inspectorCapDetailHtml, /Review Status/);
assert.match(inspectorCapDetailHtml, /CAP Submitted by Service Provider/);
assert.match(inspectorCapDetailHtml, /Pending Lead Inspector Review/);
assert.match(inspectorCapDetailHtml, /Root Cause Addressed/);
assert.match(inspectorCapDetailHtml, /Overall Assessment/);
assert.match(inspectorCapDetailHtml, /Mary Adams/);
assert.match(inspectorCapDetailHtml, /Request Revision/);
assert.match(inspectorCapDetailHtml, /Request More Evidence/);
assert.match(inspectorCapDetailHtml, /Submit to Lead Inspector/);
assert.match(inspectorCapDetailHtml, /data-field="cap-inspector-root-cause"/);
assert.doesNotMatch(inspectorCapDetailHtml, /Lead Inspector Decision/);

context.handleCapDetailPrepareSecondReport('F-2026-002');
assert.ok(context.state.capTrackingUi.inspectorReviewSentAt);
assert.equal(context.state.capTrackingUi.leadInspectorRecommendationAt, '');
assert.equal(context.state.capTrackingUi.submittedToUnitManagerAt, '');
assert.equal(context.state.notifications[0].role, 'leadInspector');
assert.match(context.state.notifications[0].text, /Inspector CAP review/);

context.state.capReviewUi.decision = 'accept';
context.state.capReviewUi.comment = 'CAP is acceptable; evidence remains required.';
context.handleCapReviewSubmitDecision('SEC-2026-002');
const acceptedCap = context.findingById('SEC-2026-002');
assert.equal(acceptedCap.cap.status, 'Accepted');
assert.equal(acceptedCap.status, 'EVIDENCE_REQUIRED');
assert.equal(acceptedCap.status === 'CLOSED', false);

context.state.role = 'inspector';
context.state.view = 'offline-field';
context.state.params = {};
context.render();
const evidenceHtml = elements.get('app-root').innerHTML;
const evidenceVisibleText = evidenceHtml.replace(/<[^>]+>/g, ' ');
assert.equal(context.state.view, 'inspector-assignments');
assert.match(evidenceHtml, /My Assignments/);
assert.doesNotMatch(evidenceHtml, /Inspection Evidence/);
assert.doesNotMatch(evidenceHtml, /Offline Field Inspection/);
assert.doesNotMatch(evidenceVisibleText, /Offline|offline|sync/i);
assert.doesNotMatch(evidenceHtml, /Field Evidence Package/);
assert.doesNotMatch(evidenceHtml, /Evidence Notes/);

console.log('inspector-nav-smoke: ok');
