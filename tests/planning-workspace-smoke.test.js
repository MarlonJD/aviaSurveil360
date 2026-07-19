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
  'js/work-items.js',
  'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();

assert.equal(typeof context.viewPlanningWorkspace, 'function', 'canonical Planning workspace renderer exists');

context.state.role = 'manager';
context.state.view = 'planning';
let html = context.viewPlanningWorkspace();
assert.match(html, /\+ New Inspection/);

const zeroBudgetItem = context.createPlanningInspection(context.state, {
  organizationId: 'ORG-SKY',
  applicationType: 'Special Inspection',
  domain: 'Security',
  inspectionCategory: 'Ad Hoc / Unannounced',
  purpose: 'Unannounced access-control compliance inspection.',
  triggerType: 'Risk based / targeted inspection',
  riskCategory: 'Cargo gate access control',
  plannedDate: '2026-07-24',
  mode: 'On-site',
  location: 'SkyCargo Terminal',
  templateId: 'TPL-SEC-2026',
  scope: 'Restricted cargo-area access controls and records.',
  currency: 'USD',
  requestedBudget: 0
}, {
  role: 'manager',
  name: context.ROLES.manager.user
});
context.state.financeUi.selectedPlanId = zeroBudgetItem.id;
context.state.role = 'finance';
html = context.viewFinanceReviewWorkspace();
assert.match(html, new RegExp(zeroBudgetItem.id));
assert.match(html, /USD 0/);
context.state.params = { tab: 'breakdown' };
html = context.viewFinanceReviewWorkspace();
assert.doesNotMatch(html, /NaN/);

context.state.view = 'planning';
html = context.viewPlanningWorkspace();
assert.match(html, /Planning/);
assert.match(html, /Department Manager[\s\S]*Finance Review[\s\S]*GM Review[\s\S]*Executive Director Approval/);
assert.match(html, /Approve Budget/);
assert.doesNotMatch(html, /Phase 0B|thin planning approval slice/i);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'approve',
  actor: { role: 'finance', name: context.ROLES.finance.user },
  comment: 'Budget accepted.'
});

context.state.role = 'gm';
html = context.viewPlanningWorkspace();
assert.match(html, /Forward to Executive Director/);
assert.match(html, /Return to Department Manager/);

context.applyApprovalDecision(context.state.planningItems[0], {
  decision: 'forward',
  actor: { role: 'gm', name: context.ROLES.gm.user },
  comment: 'Finance-reviewed plan forwarded to Executive Director.'
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
