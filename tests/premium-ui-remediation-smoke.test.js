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
  'js/planning.js',
  'js/checklists.js',
  'js/inspection.js',
  'js/reports.js',
  'js/work-items.js',
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

context.state = context.freshState();
context.state.role = 'manager';
let html = context.viewSafetyIntelligenceDashboard();
assert.match(html, /safety-signal-grid/);
assert.match(html, /safety-signal-card/);
assert.match(html, /Risk drivers/);
assert.match(html, /Recommended action/);
assert.doesNotMatch(html, /Management Signal Table/);

context.state.role = 'leadInspector';
context.state.view = 'cap-review-detail';
context.state.params = { findingId: 'F-2026-002' };
html = context.viewLeadCapReviewDetail();
assert.match(html, /workbench-command workbench-command--lead-cap/);
assert.match(html, /Current owner/);
assert.match(html, /Decision needed/);
assert.match(html, /cap-track-head-actions/);
assert.match(styles, /\.workbench-command--lead-cap[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(220px,\s*auto\)/);
assert.match(styles, /\.shell--inspector\s+\.cap-detail-head[\s\S]*?padding-right:\s*0/);
assert.match(styles, /\.prelim-finding-item\s*\{[^}]*grid-template-columns:\s*28px\s+44px\s+minmax\(0,\s*1fr\)\s+minmax\(92px,\s*auto\)\s+58px/s);
assert.match(styles, /\.prelim-finding-item\s+em\s*\{[^}]*grid-column:\s*4/s);
assert.match(styles, /\.prelim-finding-item\s+\.btn\s*\{[^}]*grid-column:\s*5/s);
assert.match(styles, /\.inspection-status-readonly\s*\{[^}]*box-shadow:\s*inset 3px 0 0 currentColor/s);
assert.match(styles, /\.inspection-status-readonly\s*\{[^}]*cursor:\s*default/s);

context.state.role = 'inspector';
context.state.view = 'inspector-assignments';
context.state.params = {};
html = context.viewInspectorAssignments();
assert.doesNotMatch(html, /inspector-next-dossier|Next inspection/);
assert.match(html, /inspector-assignment-kpis/);
assert.match(html, /inspector-assignment-table/);

context.state.role = 'inspector';
context.state.params = { auditId: 'AUD-2026-001' };
html = context.viewChecklistRunner();
assert.match(html, /checklist-dossier-layout/);
assert.match(html, /question-dossier/);
assert.match(html, /Expected Evidence/);
assert.match(html, /Regulatory Trace/);

context.state.role = 'auditee';
context.state.view = 'my-findings';
context.state.params = {};
html = context.viewAuditeeMyFindings();
assert.match(html, /auditee-request-center/);
assert.match(html, /Required Now/);
assert.match(html, /Waiting CAA Review/);
assert.match(html, /Returned \/ More Information Requested/);
assert.match(html, /Closed \/ Archive/);
assert.doesNotMatch(html, /CAP required<\/span><b>0<\/b>/);

context.state.role = 'manager';
html = context.viewPlanningWorkspace();
assert.match(html, /approval-package/);
assert.match(html, /approval-package__decision/);
assert.match(html, /Blocking reason/);
assert.match(html, /planning-command-center/);
assert.match(html, /planning-queue-panel/);
assert.match(html, /planning-queue-row/);
assert.match(html, /Awaiting Finance Review/);
assert.match(html, /No Department Manager action required yet/);
assert.match(html, /View details/);
const planningQueueHtml = html.match(/<section class="approval-package__queue planning-queue-panel">([\s\S]*?)<\/section>/)[1];
assert.doesNotMatch(planningQueueHtml, /<table|Priority|Open planning|planning-queue-summary > div/);
assert.match(html, /Budget &amp; Resource Detail/);
assert.equal((html.match(/class="approval-rail"/g) || []).length, 1, 'Overview shows the approval path once in the command center');
assert.doesNotMatch(html, /governance-hero planning-workspace__hero/);

html = context.viewQuestionBank();
assert.match(html, /configuration-studio/);
assert.match(html, /Selected Question Preview/);
assert.match(html, /Expected evidence preview/);
assert.match(html, /Regulatory reference/);

console.log('premium-ui-remediation-smoke: ok');
