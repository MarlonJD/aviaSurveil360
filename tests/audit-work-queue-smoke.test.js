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
assert.match(html, /2026 Cabin Inspection - Fly Namibia/);
assert.match(html, /Cabin Inspection/);
assert.match(html, /Back to Inspections/);
assert.match(html, /Checklist Sections/);
[
  'Galley',
  'Lavatories',
  'Passenger Seats',
  'Emergency Equipment',
  'Video + Crew Seat',
  'Cockpit, Cabin General Condition + Exits'
].forEach((section) => assert.match(html, new RegExp(section.replace(/[+]/g, '\\+'))));
assert.match(html, /EM EQ \/ PBE/);
assert.match(html, /Download Checklist/);
assert.match(html, /Submit to Lead Inspector/);
assert.doesNotMatch(html, /SMS Oversight Audit|Safety Policy and Objectives|Safety Risk Management/);
assert.match(html, /data-field="inspection-status"/);
assert.doesNotMatch(html, /inspection-status-cycle/);
assert.doesNotMatch(html, /Next action:/);

context.state.inspectionWorkspaces['AUD-2026-001'].selectedSectionKey = 'em-eq';
html = context.viewAuditDetail();
assert.match(html, /Emergency Equipment/);
assert.match(html, /Is the PBE installed, serviceable, accessible/);
assert.doesNotMatch(html, /Are operational hazards formally identified\?/);

console.log('audit-work-queue-smoke: ok');
