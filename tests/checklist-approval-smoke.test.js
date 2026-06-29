const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function actor(role) {
  return { role, name: context.ROLES[role].user };
}

const state = context.freshState();
assert.ok(Array.isArray(state.managedChecklists), 'managed checklists are seeded');
const checklist = state.managedChecklists[0];
const version = clone(checklist.versions.find((item) => item.id === 'CL-FOPS-v2.4'));

assert.equal(version.approvalType, 'checklist');
assert.equal(context.approvalSummary(version).ownerRole, 'gm');
assert.equal(context.approvalSummary(version).statusLabel, 'Under Review');

assert.throws(
  () => context.applyApprovalDecision(version, { decision: 'return', actor: actor('gm'), reason: '' }),
  /reason required/i,
  'GM checklist return requires a reason'
);

context.applyApprovalDecision(version, { decision: 'return', actor: actor('gm'), reason: 'Clarify the new crew training evidence requirement.' });
assert.equal(context.approvalSummary(version).ownerRole, 'manager');
assert.equal(version.status, 'checklist_returned');

context.applyApprovalDecision(version, { decision: 'forward', actor: actor('manager'), comment: 'Evidence requirement clarified.' });
assert.equal(context.approvalSummary(version).ownerRole, 'gm');

assert.throws(
  () => context.applyApprovalDecision(version, { decision: 'reject', actor: actor('gm'), reason: '' }),
  /reason required/i,
  'GM checklist reject requires a reason'
);

context.applyApprovalDecision(version, { decision: 'approve', actor: actor('gm'), comment: 'Approved for checklist management shell.' });
assert.equal(context.approvalSummary(version).outcome, 'approved');
assert.equal(version.status, 'checklist_approved');
assert.ok(version.approval.history.length >= 4, 'checklist approval history is append-only');

console.log('checklist-approval-smoke: ok');
