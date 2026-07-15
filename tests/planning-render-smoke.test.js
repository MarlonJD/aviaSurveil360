const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = {
  console,
  window: undefined,
  document: undefined,
  setTimeout,
  clearTimeout
};
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/planning.js', 'js/work-items.js', 'js/views.js'].forEach((file) => {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(code, context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'finance';
context.state.view = 'planning-approvals';

let html = context.viewPlanningApprovals();
assert.match(html, /Planning/);
assert.match(html, /Single planning panel for approval, release, and audit preparation/);
assert.match(html, /Approve Budget/);
assert.doesNotMatch(html, /Forward to ED/);
assert.doesNotMatch(html, /Phase 0B|thin planning approval slice/i);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'finance_not_approved',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  reason: 'Travel amount needs narrower scope.'
});
context.state.role = 'manager';
html = context.viewPlanningApprovals();
assert.match(html, /Returned to Department Manager/);
assert.match(html, /Submit to Finance Review/);
assert.match(html, /Travel amount needs narrower scope/);

context.state.view = 'planning-board';
html = context.viewPlanningBoard();
assert.match(html, /Planning/);
assert.match(html, /Preparation/);
assert.match(html, /Next Preparation Action/);

console.log('planning-render-smoke: ok');
