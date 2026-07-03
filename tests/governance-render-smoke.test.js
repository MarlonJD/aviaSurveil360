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

function resetPlanning(role) {
  context.state = context.freshState();
  context.state.role = role;
  context.state.view = 'planning';
  return context.state.planningItems[0];
}

let item = resetPlanning('gm');
let html = context.viewPlanningWorkspace();
assert.match(html, /Planning/);
assert.match(html, /Send to Finance Review/);
assert.doesNotMatch(html, /Planning Board|Planning Approvals/);

item = resetPlanning('finance');
context.applyApprovalDecision(item, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Send to Finance.'
});
html = context.viewPlanningWorkspace();
assert.match(html, /Planning/);
assert.match(html, /Approve Budget/);
assert.match(html, /Finance Review/);

item = resetPlanning('executiveDirector');
context.applyApprovalDecision(item, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Send to Finance.'
});
context.applyApprovalDecision(item, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget accepted.'
});
html = context.viewPlanningWorkspace();
assert.match(html, /Planning/);
assert.match(html, /Approve Plan/);
assert.match(html, /Executive Director Approval/);

item = resetPlanning('leadInspector');
context.applyApprovalDecision(item, {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Send to Finance.'
});
context.applyApprovalDecision(item, {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget accepted.'
});
context.applyApprovalDecision(item, {
  decision: 'approve',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: 'Approved.'
});
context.releasePlanningItem(item, { actorRole: 'gm', actorName: context.ROLES.gm.user });
context.acceptReleasedPlanningItem(item, { actorRole: 'manager', actorName: context.ROLES.manager.user });
context.assignLeadInspectorToPlanningItem(item, {
  actorRole: 'manager',
  actorName: context.ROLES.manager.user,
  leadInspector: context.ROLES.leadInspector.user
});
html = context.viewPlanningWorkspace('preparation');
assert.match(html, /Planning/);
assert.match(html, /Propose Team \/ Dates \/ Resources/);

const cases = [
  ['gm', 'Checklist Approval', () => context.viewChecklistApprovals()],
  ['manager', 'Question Bank', () => context.viewQuestionBank()],
  ['manager', 'Checklist Builder', () => context.viewChecklistBuilder()],
  ['manager', 'Version History', () => context.viewChecklistVersions()],
  ['leadInspector', 'Final Report - Routine Inspection', () => context.viewLeadReviewQueue()],
  ['leadInspector', 'Airline XYZ Operator Audit Report', () => context.viewAuditReportsApproval()]
];

cases.forEach(([role, expected, render]) => {
  context.state.role = role;
  const html = render();
  assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /undefined function|ReferenceError/);
});

console.log('governance-render-smoke: ok');
