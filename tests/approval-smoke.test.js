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

['js/data.js', 'js/helpers.js', 'js/approval.js'].forEach((file) => {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(code, context, { filename: file });
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actor(role) {
  return {
    role,
    name: context.ROLES[role].user
  };
}

assert.equal(typeof context.approvalSummary, 'function', 'approvalSummary function exists');
assert.equal(typeof context.applyApprovalDecision, 'function', 'applyApprovalDecision function exists');

const initialState = context.freshState();
assert.ok(Array.isArray(initialState.planningItems), 'planning items are seeded in demo state');
assert.equal(initialState.planningItems.length, 1, 'one thin-slice planning item is seeded');

const item = clone(initialState.planningItems[0]);
assert.equal(item.id, 'PLAN-2026-Q3-CABIN');
assert.equal(item.budgetRequired, true);
assert.deepEqual(
  clone(item.approval.chain.map((stage) => stage.role)),
  ['manager', 'finance', 'gm', 'executiveDirector']
);
assert.equal(context.approvalSummary(item).ownerRole, 'finance');
assert.match(context.approvalSummary(item).nextAction, /approve|return to Department Manager/i);

assert.throws(
  () => context.applyApprovalDecision(item, { decision: 'finance_not_approved', actor: actor('finance'), reason: '' }),
  /reason required/i,
  'Finance Not Approved requires a reason'
);

const originalHistoryFirstAction = item.approval.history[0].action;
context.applyApprovalDecision(item, { decision: 'finance_not_approved', actor: actor('finance'), reason: 'Travel amount needs narrower scope.' });
assert.equal(context.approvalSummary(item).ownerRole, 'manager');
assert.match(context.approvalSummary(item).statusLabel, /Department Manager/);

context.applyApprovalDecision(item, { decision: 'forward', actor: actor('manager'), comment: 'Scope narrowed for finance re-review.' });
assert.equal(context.approvalSummary(item).ownerRole, 'finance');
assert.equal(item.approval.history[0].action, originalHistoryFirstAction, 'approval history keeps prior entries unchanged');

context.applyApprovalDecision(item, { decision: 'approve_with_adjustment', actor: actor('finance'), comment: 'Approved with reduced travel allowance.' });
assert.equal(context.approvalSummary(item).ownerRole, 'gm');

assert.throws(
  () => context.applyApprovalDecision(item, { decision: 'return', actor: actor('gm'), reason: '' }),
  /reason required/i,
  'GM return requires a reason'
);

context.applyApprovalDecision(item, { decision: 'return', actor: actor('gm'), reason: 'Clarify department scope.' });
assert.equal(context.approvalSummary(item).ownerRole, 'manager', 'GM Return goes to Department Manager');

context.applyApprovalDecision(item, { decision: 'forward', actor: actor('manager'), comment: 'Department scope clarified.' });
context.applyApprovalDecision(item, { decision: 'approve', actor: actor('finance'), comment: 'Finance approval remains valid after resubmission.' });
assert.equal(context.approvalSummary(item).ownerRole, 'gm');
context.applyApprovalDecision(item, { decision: 'forward', actor: actor('gm'), comment: 'Finance-reviewed plan forwarded.' });
assert.equal(context.approvalSummary(item).ownerRole, 'executiveDirector');

assert.throws(
  () => context.applyApprovalDecision(item, { decision: 'return', actor: actor('executiveDirector'), reason: '' }),
  /reason required/i,
  'ED Return requires a reason'
);

context.applyApprovalDecision(item, { decision: 'return', actor: actor('executiveDirector'), reason: 'Clarify inspector-day allocation before final approval.' });
assert.equal(context.approvalSummary(item).ownerRole, 'gm', 'ED Return goes to GM');

context.applyApprovalDecision(item, { decision: 'forward', actor: actor('gm'), comment: 'Inspector-day allocation clarified.' });
context.applyApprovalDecision(item, { decision: 'approve', actor: actor('executiveDirector'), comment: 'Approved for the Q3 plan.' });

const approved = context.approvalSummary(item);
assert.equal(approved.outcome, 'approved');
assert.equal(approved.ownerRole, null);
assert.equal(approved.statusLabel, 'Approved');
assert.equal(item.status, 'approved');
assert.ok(item.approval.history.length >= 10, 'history is append-only across the full approval path');

console.log('approval-smoke: ok');
