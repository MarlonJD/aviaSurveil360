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
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();

assert.equal(typeof context.viewPlanningWorkspace, 'function', 'canonical Planning workspace renderer exists');

context.state.role = 'gm';
context.state.view = 'planning';
let html = context.viewPlanningWorkspace();
assert.match(html, /Planning/);
assert.match(html, /Department Manager[\s\S]*GM Review[\s\S]*Finance Review[\s\S]*Executive Director Approval/);
assert.match(html, /Send to Finance Review/);
assert.doesNotMatch(html, /Phase 0B|thin planning approval slice/i);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Scope accepted for finance review.'
});

context.state.role = 'finance';
html = context.viewPlanningWorkspace();
assert.match(html, /Approve Budget/);
assert.match(html, /Finance Review/);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget accepted.'
});

context.state.role = 'executiveDirector';
html = context.viewPlanningWorkspace();
assert.match(html, /Approve Plan/);
assert.match(html, /Executive Director Approval/);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'approve',
  actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user },
  comment: 'Approved for release.'
});

context.state.role = 'gm';
html = context.viewPlanningWorkspace();
assert.match(html, /GM Release to Department|Release to Department/);
assert.match(html, /Approved/);

console.log('planning-workspace-smoke: ok');
