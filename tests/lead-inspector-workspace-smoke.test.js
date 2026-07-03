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

assert.match(html, /Final Report - Routine Inspection/);
assert.match(html, /SkyCargo Air/);
assert.match(html, /Report Status: Draft/);
assert.match(html, /Preview Report/);
assert.match(html, /Save Draft/);
assert.match(html, /Submit to Unit Manager/);
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
assert.match(html, /Unit Manager/);
assert.match(html, /General Manager/);
assert.match(html, /Executive Director \(ED\)/);
assert.match(html, /Findings Overview \(8\)/);
assert.match(html, /Level 1/);
assert.match(html, /14 days/);
assert.match(html, /Level 2/);
assert.match(html, /90 days/);
assert.match(html, /Observation/);
assert.match(html, /No CAP/);
assert.match(html, /Report Summary/);
assert.match(html, /CAP Deadlines by Level/);
assert.match(html, /After ED approval, the final report is released to the service provider/);
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
assert.match(html, /Mock report approval chain: Lead Inspector -&gt; Department Manager/);
assert.match(html, /Audit team checklist summary/);
assert.match(html, /Inspectors assigned/);
assert.match(html, /Submitted findings and comments/);
assert.match(html, /Access control log gaps at cargo gate/);
assert.match(html, /Submit Preliminary Report/);
assert.match(html, /Report Approval Queue/);
assert.match(html, /Airline XYZ Operator Audit Report/);

console.log('lead-inspector-workspace-smoke: ok');
