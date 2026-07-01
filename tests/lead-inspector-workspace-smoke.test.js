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

assert.match(html, /Lead Inspector Workspace/);
assert.match(html, /Completed checklist reports/);
assert.match(html, /SkyCargo Air Security Audit/);
assert.match(html, /Inspectors assigned/);
assert.match(html, /Caner Yildiz/);
assert.match(html, /Aylin Sezer/);
assert.match(html, /Checklist assignments/);
assert.match(html, /Cargo gate access control logs/);
assert.match(html, /Completed/);
assert.match(html, /In Progress/);
assert.match(html, /Waiting/);
assert.match(html, /Submitted findings and comments/);
assert.match(html, /Access control log gaps at cargo gate/);
assert.match(html, /Level 1 Critical/);
assert.match(html, /Report tracking/);
assert.match(html, /one table for Lead Inspector follow-up/);
assert.match(html, /RPT-AUD-2026-005/);
assert.match(html, /Open report/);
assert.doesNotMatch(html, /Audit report packages/);
assert.match(html, /Preliminary Inspection Report/);
assert.match(html, /Submit to Department Manager/);
assert.match(html, /Service Provider/);
assert.match(html, /data-view="audit-reports" data-id="AUD-2026-005"/);
assert.doesNotMatch(html, /No Potential Findings have been created yet/);
assert.doesNotMatch(html, /Review Potential Findings before they become real Findings/);

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
