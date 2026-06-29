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
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();

const cases = [
  ['gm', 'Planning Approval', () => context.viewPlanningApprovals()],
  ['gm', 'Checklist Approval', () => context.viewChecklistApprovals()],
  ['manager', 'Question Bank', () => context.viewQuestionBank()],
  ['manager', 'Checklist Builder', () => context.viewChecklistBuilder()],
  ['manager', 'Version History', () => context.viewChecklistVersions()],
  ['leadInspector', 'Lead Review Queue', () => context.viewLeadReviewQueue()],
  ['manager', 'Planning Board', () => context.viewPlanningBoard()],
  ['leadInspector', 'Preliminary / Final Report', () => context.viewAuditReportsApproval()]
];

cases.forEach(([role, expected, render]) => {
  context.state.role = role;
  const html = render();
  assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /undefined function|ReferenceError/);
});

console.log('governance-render-smoke: ok');
