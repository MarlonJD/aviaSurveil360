const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/inspection.js', 'js/work-items.js', 'js/views.js'].forEach((file) => {
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

const submittedWorkspace = context.state.inspectionWorkspaces['AUD-2026-001'];
submittedWorkspace.selectedSectionKey = 'galley';
submittedWorkspace.answersByQuestionId['cab-galley-oven'] = {
  status: 'compliant',
  comment: 'Recorded before submission.',
  file: 'galley-check.pdf'
};
submittedWorkspace.allSectionsCompletedAt = '2026-07-11T09:30:00.000Z';
submittedWorkspace.submittedAt = '2026-07-11T09:31:42.154Z';
submittedWorkspace.submittedByUserId = 'USR-AYLIN';
const answersBeforeReopen = JSON.stringify(submittedWorkspace.answersByQuestionId);
html = context.viewAuditDetail();
assert.match(html, /Submitted checklist — read-only/);
assert.match(html, /data-act="inspection-reopen-editing"/);
assert.match(html, /Reopen for Editing/);
assert.match(html, /inspection-status-readonly/);
assert.match(html, /Locked after submission/);
assert.match(html, /Recorded result/);
assert.doesNotMatch(html, /<select[^>]+data-field="inspection-status"/);

assert.equal(typeof context.reopenInspectionChecklistForEditing, 'function');
assert.equal(context.reopenInspectionChecklistForEditing(context.state, 'AUD-2026-001', {
  at: '2026-07-11T10:05:00.000Z',
  userId: 'USR-AYLIN'
}), true);
assert.equal(submittedWorkspace.submittedAt, '');
assert.equal(submittedWorkspace.submittedByUserId, '');
assert.equal(submittedWorkspace.allSectionsCompletedAt, '');
assert.equal(submittedWorkspace.lastSubmittedAt, '2026-07-11T09:31:42.154Z');
assert.equal(submittedWorkspace.lastSubmittedByUserId, 'USR-AYLIN');
assert.equal(submittedWorkspace.reopenedAt, '2026-07-11T10:05:00.000Z');
assert.equal(submittedWorkspace.reopenedByUserId, 'USR-AYLIN');
assert.equal(JSON.stringify(submittedWorkspace.answersByQuestionId), answersBeforeReopen);

html = context.viewAuditDetail();
assert.doesNotMatch(html, /Submitted checklist — read-only/);
assert.match(html, /Reopened for editing/);
assert.match(html, /<select[^>]+data-field="inspection-status"/);
assert.match(html, /<option value="compliant" selected>Compliant<\/option>/);
assert.match(html, /Submit to Lead Inspector/);

const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
assert.match(appSource, /case 'inspection-reopen-editing': handleInspectionReopenEditing\(id\); break;/);
assert.match(appSource, /reopenInspectionChecklistForEditing\(state, targetAuditId/);
assert.match(appSource, /case 'new-planning-inspection': startPlanningInspectionIntake\(\); break;/);
assert.match(appSource, /case 'new-audit': startPlanningInspectionIntake\(\); break;/);
assert.match(appSource, /wizard: 'New Inspection'/);
assert.match(appSource, /go\('planning', \{ planningId: item\.id, tab: 'overview' \}\)/);

context.state.inspectionWorkspaces['AUD-2026-001'].selectedSectionKey = 'em-eq';
html = context.viewAuditDetail();
assert.match(html, /Emergency Equipment/);
assert.match(html, /Is the PBE installed, serviceable, accessible/);
assert.doesNotMatch(html, /Are operational hazards formally identified\?/);

console.log('audit-work-queue-smoke: ok');
