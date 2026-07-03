const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/work-items.js', 'js/views.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'inspector';
context.state.view = 'calendar';
context.state.params = {};

let html = context.viewCalendar();
assert.match(html, /Audit Work Queue/);
assert.match(html, /Assigned audits in a simple queue/);
assert.doesNotMatch(html, /January 2026/);
assert.match(html, /data-filter="active"/);
assert.match(html, /data-filter="completed"/);
assert.match(html, /Active audits/);
assert.match(html, /Completed/);
assert.doesNotMatch(html, /data-filter="mine"/);
assert.doesNotMatch(html, /data-filter="waiting"/);
assert.doesNotMatch(html, /data-filter="overdue"/);
assert.doesNotMatch(html, /data-filter="all"/);
assert.doesNotMatch(html, /\+ New Audit/);

const overdueIndex = html.indexOf('AUD-2026-005');
const todayIndex = html.indexOf('AUD-2026-001');
assert.ok(overdueIndex > -1 && todayIndex > -1, 'assigned active audit rows render');
assert.doesNotMatch(html, /AUD-2026-006/);
assert.doesNotMatch(html, /AUD-2026-007/);
assert.doesNotMatch(html, /AUD-2026-008/);
assert.ok(overdueIndex < todayIndex, 'overdue audit is sorted before today');
assert.match(html, /Continue checklist/);
assert.match(html, /Start checklist/);

context.state.params = { auditId: 'AUD-2026-001' };
html = context.viewAuditDetail();
assert.match(html, /SMS Oversight Audit/);
assert.match(html, /Back to Inspections/);
assert.match(html, /Checklist Sections/);
assert.match(html, /Safety Policy and Objectives/);
assert.match(html, /Download Checklist/);
assert.match(html, /Submit to Lead Inspector/);
assert.match(html, /45 \/ 60 \(75%\)/);
assert.match(html, /safety_policy\.pdf/);
assert.match(html, /data-field="inspection-status"/);
assert.doesNotMatch(html, /inspection-status-cycle/);
assert.doesNotMatch(html, /Next action:/);

context.state.inspectionWorkspaceSection = '2.';
html = context.viewAuditDetail();
assert.match(html, /2\. Safety Risk Management/);
assert.match(html, /2\.1/);
assert.match(html, /Are operational hazards formally identified\?/);
assert.doesNotMatch(html, /1\.1[\s\S]*Is there an established safety policy\?/);

console.log('audit-work-queue-smoke: ok');
