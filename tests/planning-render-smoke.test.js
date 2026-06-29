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

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/views.js'].forEach((file) => {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(code, context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'gm';
context.state.view = 'planning-approvals';

let html = context.viewPlanningApprovals();
assert.match(html, /Planning Approval — PLAN-2026-Q3-OPS/);
assert.match(html, /Send to Finance Review/);
assert.doesNotMatch(html, /Forward to ED/);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Scope and risk rationale accepted.'
});
context.state.role = 'finance';
html = context.viewPlanningApprovals();
assert.match(html, /Approve with Adjustment/);
assert.match(html, /Finance Not Approved/);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'finance_not_approved',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  reason: 'Travel amount needs narrower scope.'
});
context.state.role = 'gm';
html = context.viewPlanningApprovals();
assert.match(html, /Returned to GM Action/);
assert.match(html, /Travel amount needs narrower scope/);

console.log('planning-render-smoke: ok');
