const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/views.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'inspector';
context.state.view = 'calendar';
context.state.params = {};

let html = context.viewCalendar();
assert.match(html, /Audit Work Queue/);
assert.match(html, /Audits and inspections in one due-date queue/);
assert.doesNotMatch(html, /January 2026/);
assert.match(html, /Your turn/);
assert.match(html, /Waiting on Department Manager/);

const overdueIndex = html.indexOf('AUD-2026-005');
const todayIndex = html.indexOf('AUD-2026-001');
const futureIndex = html.indexOf('AUD-2026-006');
assert.ok(overdueIndex > -1 && todayIndex > -1 && futureIndex > -1, 'active audit rows render');
assert.ok(overdueIndex < todayIndex, 'overdue audit is sorted before today');
assert.ok(todayIndex < futureIndex, 'today audit is sorted before future audits');

context.state.params = { auditId: 'AUD-2026-001' };
html = context.viewAuditDetail();
assert.match(html, /Your turn:/);
assert.match(html, /Start checklist/);
assert.match(html, /Current owner/);

console.log('audit-work-queue-smoke: ok');
