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
assert.match(html, /My Inspections/);
assert.match(html, /Assigned Inspections/);
assert.match(html, /CAP Reviews/);
assert.match(html, /Draft Reports/);
assert.match(html, /Certificate Renewal/);
assert.match(html, /Initial Application/);
assert.match(html, /class="ops-table inspector-table"/);
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
assert.match(html, /Management Attention/);
assert.match(html, /Management indicator only\. It does not trigger automatic enforcement, suspension or closure\./);
assert.match(html, /class="ops-table"/);

context.state.role = 'inspector';
context.state.view = 'calendar';
context.state.params = {};
html = context.viewCalendar();
assert.match(html, /Audit Work Queue/);
assert.match(html, /data-act="nav" data-view="audit-detail" data-id="AUD-2026-001"/);
assert.match(html, /class="ops-table"/);

context.state.role = 'manager';
context.state.wizard = {
  step: 1,
  orgId: context.state.orgs[0].id,
  type: context.AUDIT_TYPES[0],
  domain: context.AUDIT_DOMAINS[0]
};
html = context.viewAuditWizard();
assert.match(html, /Initial Certification/);
assert.match(html, /Variation \/ Amendment/);
assert.match(html, /Remote Inspection/);

console.log('table-first-workbench-smoke: ok');
