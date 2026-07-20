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
  'js/manager-workspaces.js',
  'js/work-items.js',
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'manager';

const finding = context.findingById('SEC-2026-002');
const workItem = context.workItemFromFinding(finding, { allEvidenceVersions: true });
assert.equal(workItem.id, finding.id);
assert.equal(workItem.type, 'Finding');
assert.match(workItem.title, /Access control log gaps/);
assert.match(workItem.owner, /CAA Inspector/);
assert.match(workItem.nextAction, /Review CAP/);
assert.match(workItem.dueText, /Due Date/);
assert.equal(workItem.route.view, 'finding');
assert.equal(workItem.route.id, finding.id);
assert.equal(workItem.primaryAction.action, 'reviewcap');
assert.ok(workItem.children.some((child) => child.type === 'CAP'), 'CAP child row is projected');

context.state.role = 'inspector';
context.state.view = 'dashboard';
context.state.params = {};
let html = context.viewInspectorDashboard();
assert.match(html, /My Assignments/);
assert.match(html, /Open Assignments/);
assert.match(html, /Audit \/ Inspection/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Ramp Inspection/);
assert.match(html, /Report preview unavailable/);
assert.doesNotMatch(html, /My Inspections/);
assert.doesNotMatch(html, /Assigned Inspections/);
assert.doesNotMatch(html, /Draft Reports/);
assert.match(html, /class="inspector-assignment-table"/);
assert.doesNotMatch(html, /Frontend-only demo - saved in this browser/);
assert.doesNotMatch(html, /New inspection/);
assert.doesNotMatch(html, /Generate report/);
assert.doesNotMatch(html, /A\. Attention Needed/);
assert.doesNotMatch(html, /B\. My Upcoming Work/);

context.state.role = 'auditee';
context.state.view = 'my-findings';
context.state.params = {};
html = context.viewAuditeeMyFindings();
assert.match(html, /My CAA Requests/);
assert.match(html, /class="ops-table"/);
assert.doesNotMatch(html, /Internal CAA Note|SkyCargo Air|BlueWing Aviation|Inspector Workload/i);

context.state.role = 'manager';
context.state.view = 'dashboard';
context.state.params = {};
html = context.viewManagerDashboard();
assert.match(html, /Department Manager Dashboard/);
assert.match(html, /What needs attention\?/);
assert.match(html, /Recent High-Risk Findings/);
assert.match(html, /Upcoming Audits/);
assert.match(html, /Management indicators only:/);
assert.match(html, /class="manager-dashboard-table"/);

context.state.role = 'leadInspector';
context.state.view = 'lead-review';
context.state.params = {};
context.state.leadAssignedAuditsUi = {};
html = context.viewLeadAssignedAudits();
assert.match(html, /Assigned Audits/);
assert.doesNotMatch(html, /Next Due Date/);
assert.doesNotMatch(html, /All Statuses/);
assert.doesNotMatch(html, /data-field="lead-assigned-status"/);
assert.doesNotMatch(html, /lead-status-pill/);
assert.doesNotMatch(html, /28 May 2025/);
assert.match(html, /75%/);
assert.match(html, /style="width:75%"/);
assert.match(html, /aria-label="Open AUD-2025-045"/);
assert.doesNotMatch(html, /aria-label="Edit AUD-2025-045"/);
assert.doesNotMatch(html, /More actions for AUD-2025-045/);
assert.equal((html.match(/class="iconbtn iconbtn--small"/g) || []).length, 8);

context.state.role = 'inspector';
context.state.view = 'calendar';
context.state.params = {};
html = context.viewCalendar();
assert.match(html, /Audit Work Queue/);
assert.match(html, /data-act="nav" data-view="audit-detail" data-id="AUD-2026-001"/);
assert.match(html, /class="ops-table"/);

context.state.role = 'manager';
context.state.view = 'calendar';
html = context.viewCalendar();
assert.doesNotMatch(html, /\+ New Audit/);

context.state.wizard = {
  step: 2,
  orgId: 'ORG-SKY',
  type: 'Special Inspection',
  domain: 'Security',
  inspectionCategory: 'Ad Hoc / Unannounced',
  noticePolicy: 'withheld'
};
html = context.viewAuditWizard();
assert.match(html, /Ad Hoc \/ Unannounced/);
assert.match(html, /Service Provider will not be informed in advance/);
assert.doesNotMatch(html, /Lead inspector|Team members/);
assert.doesNotMatch(html, /Create &amp; schedule audit/);

console.log('table-first-workbench-smoke: ok');
