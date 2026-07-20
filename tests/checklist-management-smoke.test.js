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
  'js/planning.js',
  'js/checklists.js',
  'js/inspection.js',
  'js/reports.js',
  'js/manager-workspaces.js',
  'js/work-items.js',
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

const state = context.freshState();
context.state = state;
const checklist = state.managedChecklists[0];

assert.ok(Array.isArray(state.questionBank), 'question bank is seeded');
assert.equal(context.canManageChecklistConfig('inspector'), false, 'Inspector cannot edit checklist configuration');
assert.equal(context.canManageChecklistConfig('manager'), true, 'Department Manager can edit checklist configuration');

assert.throws(
  () => context.createChecklistDraftVersion(checklist, { actorName: 'Selin Demir', reason: '' }),
  /reason for change required/i,
  'new checklist versions require a reason for change'
);

const draft = context.createChecklistDraftVersion(checklist, {
  actorName: 'Selin Demir',
  reason: 'Add explicit PBE serviceability evidence guidance for Q3 cabin inspection surveillance.'
});
assert.equal(draft.status, 'draft');
assert.equal(draft.version, '1.2');
assert.match(draft.changeReason, /PBE serviceability evidence/);

context.addQuestionToChecklistVersion(draft, 'cab-lav-waste-container');
assert.ok(draft.questionIds.includes('cab-lav-waste-container'), 'builder can add a question from the bank');

context.moveChecklistQuestion(draft, 'cab-lav-waste-container', 'up');
assert.equal(draft.questionIds[draft.questionIds.length - 2], 'cab-lav-waste-container', 'builder can reorder questions with controls');

assert.throws(
  () => context.publishChecklistVersion(checklist, draft, { actorName: 'Selin Demir' }),
  /approved version/i,
  'draft cannot publish before approval'
);

const reviewVersion = checklist.versions.find((item) => item.id === 'CL-CABIN-v1.1');
context.applyApprovalDecision(reviewVersion, {
  decision: 'approve',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Approved for publishing test.'
});
context.publishChecklistVersion(checklist, reviewVersion, { actorName: 'Selin Demir' });

const archived = checklist.versions.find((item) => item.id === 'CL-CABIN-v1.0');
assert.equal(reviewVersion.status, 'published_active');
assert.equal(archived.status, 'archived');
assert.equal(checklist.publishedVersion, '1.1');

context.state = context.freshState();
context.state.role = 'admin';

let html = context.viewQuestionBank();
assert.match(html, /<textarea id="qb-text"[^>]*rows="3"/);
assert.match(html, /data-act="qb-create"/);

context.createChecklistDraftVersion(context.state.managedChecklists[0], {
  actorName: 'Admin Preview',
  reason: 'Verify responsive checklist ordering controls.'
});
html = context.viewChecklistBuilder();
assert.match(html, /admin-checklist-mobile-list/);
assert.match(html, /admin-question-bank-mobile-list/);
assert.match(html, /Configured reference/);
assert.match(html, /Expected evidence/);
assert.match(html, /data-act="checklist-move-question"/);

console.log('checklist-management-smoke: ok');
