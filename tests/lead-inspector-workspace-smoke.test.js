const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
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
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'leadInspector';
context.state.view = 'lead-review';
context.state.params = {};

let html = context.viewLeadReviewQueue();

assert.match(html, /Assigned Audits/);
assert.match(html, /View and manage all audits assigned to you/);
assert.match(html, /New Audit Assignment/);
assert.match(html, /Total Assigned/);
assert.match(html, /In Progress/);
assert.match(html, /Reports/);
assert.doesNotMatch(html, /Draft Reports/);
assert.match(html, /Pending Approval/);
assert.match(html, /Overdue/);
assert.match(html, /Search audits/);
assert.doesNotMatch(html, /All Statuses/);
assert.doesNotMatch(html, /data-field="lead-assigned-status"/);
assert.match(html, /All Departments/);
assert.match(html, /All Types/);
assert.match(html, /All Levels/);
assert.match(html, /More Filters/);
assert.match(html, /Apply Filters/);
assert.match(html, /Audit No\./);
assert.match(html, /Operator \/ Organisation/);
const assignedAuditHeader = html.match(/<thead><tr>(.*?)<\/tr><\/thead>/);
assert.ok(assignedAuditHeader, 'Assigned audit table header renders');
assert.equal((assignedAuditHeader[1].match(/<th/g) || []).length, 9);
assert.match(assignedAuditHeader[1], /<th>Progress <span>/);
assert.doesNotMatch(assignedAuditHeader[1], /Status/);
assert.doesNotMatch(assignedAuditHeader[1], /Next Due Date/);
assert.match(html, /AUD-2025-045/);
assert.match(html, /West Air \(Pty\) Ltd/);
assert.doesNotMatch(html, /28 May 2025/);
assert.doesNotMatch(html, /Findings Review/);
assert.doesNotMatch(html, /lead-status-pill/);
assert.match(html, /75%/);
assert.match(html, /style="width:75%"/);
assert.match(html, /aria-label="Open AUD-2025-045"/);
assert.match(html, /data-view="lead-assignment"/);
assert.doesNotMatch(html, /aria-label="Edit AUD-2025-045"/);
assert.doesNotMatch(html, /More actions for AUD-2025-045/);
assert.match(html, /Showing 1 to 8 of 18 audits/);
assert.match(html, /High Risk/);
assert.match(html, /Medium Risk/);
assert.match(html, /Low Risk/);
assert.doesNotMatch(html, /Final Report - Routine Inspection/);
assert.doesNotMatch(html, /Report Details/);
assert.doesNotMatch(html, /Report Sections/);

context.state.view = 'lead-assignment';
context.state.params = { auditId: 'AUD-2026-005' };
html = context.viewLeadAssignmentWorkspace();

assert.match(html, /AVSEC Inspection/);
assert.match(html, /Assignment Overview/);
assert.match(html, /Planning[\s\S]*Completed/);
assert.match(html, /Approval[\s\S]*Completed/);
assert.match(html, /Assignment[\s\S]*In Progress/);
assert.match(html, /Execution[\s\S]*Pending/);
assert.match(html, /AVSEC Operations Checklist/);
assert.match(html, /186 Questions/);
assert.match(html, /Checklist not yet assigned to inspectors/);
assert.match(html, /Assign Checklist Questions/);
assert.match(html, /Download Assignment Plan/);
assert.doesNotMatch(html, /Preliminary Report - Routine Inspection/);
assert.doesNotMatch(html, /Report Details/);
assert.doesNotMatch(html, /Report Sections/);

context.state.view = 'lead-assignment-questions';
context.state.params = { auditId: 'AUD-2026-005' };
html = context.viewLeadAssignmentQuestions();

assert.match(html, /Assign Checklist Questions/);
assert.match(html, /Checklist Items[\s\S]*186/);
assert.match(html, /Assigned[\s\S]*124/);
assert.match(html, /Unassigned[\s\S]*62/);
assert.match(html, /Inspectors[\s\S]*4/);
assert.match(html, /Ahmed Ali/);
assert.match(html, /Maria Silva/);
assert.match(html, /Are access control procedures implemented\?/);
assert.match(html, /Assign Selected \(4\)/);
assert.match(html, /Checklist Item/);
assert.doesNotMatch(html, /colspan="2"/);
assert.match(html, /data-field="lead-assignment-assignee"/);
assert.match(html, /data-field="lead-assignment-due"/);
assert.match(html, /data-field="lead-assignment-priority"/);
assert.match(html, /data-field="lead-assignment-note"/);
assert.match(html, /Assign Questions/);
assert.match(html, /Release to Inspectors/);

context.state.view = 'lead-review';
context.state.params = { auditId: 'AUD-2026-005' };
html = context.viewLeadReviewQueue();

assert.match(html, /Preliminary Report - Routine Inspection/);
assert.match(html, /SkyCargo Air/);
assert.match(html, /Report Type: Preliminary Report/);
assert.match(html, /Report Status: Draft/);
assert.match(html, /Preview Preliminary Report/);
assert.match(html, /Save Draft/);
assert.match(html, /Submit to Department Manager/);
assert.match(html, /Inspection ID/);
assert.match(html, /INS-2026-015/);
assert.match(html, /Lead Inspector/);
assert.match(html, /John Lead Inspector/);
assert.match(html, /Dates/);
assert.match(html, /Report Details/);
assert.match(html, /Findings/);
assert.match(html, /CAP Summary/);
assert.match(html, /Conclusion/);
assert.match(html, /Appendices/);
assert.match(html, /Report Sections/);
assert.match(html, /Executive Summary/);
assert.match(html, /Audit Scope/);
assert.match(html, /Enforcement &amp; CAP/);
assert.match(html, /Approval Workflow/);
assert.match(html, /Inspector/);
assert.match(html, /Preliminary Report/);
assert.match(html, /Lead Inspector Review/);
assert.match(html, /Revise -&gt; Inspector/);
assert.match(html, /Department Manager Review/);
assert.match(html, /Release if CAP required/);
assert.match(html, /Preliminary Report Released/);
assert.match(html, /Service Provider CAP Completion/);
assert.match(html, /CAP evidence \/ closure response due/);
assert.match(html, /Lead Inspector Finalizes Report/);
assert.match(html, /Prepare after CAP completion/);
assert.match(html, /Department Manager Final Approval/);
assert.match(html, /Executive Director \/ GM Approval/);
assert.match(html, /Final Report Issued/);
assert.match(html, /CAP Process Starts/);
assert.match(html, /Inspector verifies CAP/);
assert.match(html, /Lead Inspector recommends closure/);
assert.match(html, /Department Manager approves closure/);
assert.doesNotMatch(html, /Director\/GM Optional Approval/);
assert.doesNotMatch(html, /Submit to Unit Manager/);
assert.match(html, /Findings Overview \(8\)/);
assert.match(html, /Level 1/);
assert.match(html, /14 days/);
assert.match(html, /Level 2/);
assert.match(html, /90 days/);
assert.match(html, /Observation/);
assert.match(html, /No CAP/);
assert.doesNotMatch(html, /Report Summary/);
assert.doesNotMatch(html, /Compliance Rating/);
assert.doesNotMatch(html, /Acceptable with CAP/);
assert.doesNotMatch(html, /Risk Level/);
assert.doesNotMatch(html, /Overall Compliance Rating/);
assert.doesNotMatch(html, /Overall Risk Level/);
assert.doesNotMatch(html, /Positive Practices/);
assert.doesNotMatch(html, /Major Risks \/ Concerns/);
assert.match(html, /CAP Deadlines by Level/);
assert.match(html, /Preliminary Report goes to the Service Provider only if CAP is required/);
assert.doesNotMatch(html, /Lead Inspector Workspace/);
assert.doesNotMatch(html, /Report tracking/);
assert.doesNotMatch(html, /Audit report packages/);
assert.doesNotMatch(html, /No Potential Findings have been created yet/);
assert.doesNotMatch(html, /Review Potential Findings before they become real Findings/);

context.state.leadReviewUi.reportSection = 'enforcement-cap';
html = context.viewLeadReviewQueue();
assert.match(html, /7\. Enforcement &amp; CAP/);
assert.match(html, /Level 1 findings require corrective action closure within 14 days/);
assert.match(html, /Level 2 findings require corrective action closure within 90 days/);

context.state.leadReviewUi.reportSection = 'approval';
html = context.viewLeadReviewQueue();
assert.match(html, /Inspector prepares the preliminary report and uploads supporting evidence/);
assert.match(html, /Lead Inspector Review can return the preliminary report to the Inspector for revision/);
assert.match(html, /Department Manager Review can return the package to the Lead Inspector/);
assert.match(html, /Preliminary Report is released to the Service Provider if CAP-required findings exist/);
assert.match(html, /Service Provider CAP completion, evidence, and closure response are captured during the CAP window/);
assert.match(html, /After the Service Provider completes the CAP response within the due date/);
assert.match(html, /Executive Director \/ GM approval is required before Final Report Issued/);
assert.doesNotMatch(html, /Director\/GM approval is optional/);

context.state.leadReviewUi.tab = 'findings';
html = context.viewLeadReviewQueue();
assert.match(html, /Final report findings are grouped by criticality/);
assert.match(html, /Access control log gaps at cargo gate/);
assert.match(html, /Level 1 Critical/);

context.state.leadReviewUi.tab = 'cap';
html = context.viewLeadReviewQueue();
assert.match(html, /CAP requirements are summarized/);
assert.match(html, /CAP-2026-021/);

context.state.leadReviewUi.tab = 'appendices';
html = context.viewLeadReviewQueue();
assert.match(html, /Appendices/);
assert.match(html, /SMS_Audit_Draft_v1\.0\.pdf/);

context.state.params = { auditId: 'AUD-2026-005' };
html = context.viewAuditReportsApproval();

assert.match(html, /SkyCargo Air Security Audit Preliminary Report/);
assert.match(html, /Mock report chain: Preliminary Report -&gt; Department Manager review -&gt; Service Provider CAP completion if CAP is required -&gt; Final Report preparation/);
assert.match(html, /Report Type/);
assert.match(html, /Preliminary Report Notice/);
assert.match(html, /Mock CAP completion window/);
assert.match(html, /CAP required\?/);
assert.match(html, /CAP required findings/);
assert.match(html, /SkyCargo Air Security Manager/);
assert.match(html, /24 Jun 2026/);
assert.match(html, /Completion rule/);
assert.match(html, /Late \/ no completion rule/);
assert.match(html, /Audit team checklist summary/);
assert.match(html, /Inspectors assigned/);
assert.match(html, /Submitted findings and comments/);
assert.match(html, /Access control log gaps at cargo gate/);
assert.match(html, /Submit Preliminary Report/);
assert.match(html, /Report Approval Queue/);
assert.match(html, /Airline XYZ Cabin Inspection Preliminary Report/);
assert.match(html, /CAP due 24 Jun 2026/);

console.log('lead-inspector-workspace-smoke: ok');
