const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/planning.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
const item = context.state.planningItems[0];

context.applyApprovalDecision(item, { decision: 'approve', actor: { role: 'finance', name: context.ROLES.finance.user }, comment: 'Budget accepted.' });
context.applyApprovalDecision(item, { decision: 'forward', actor: { role: 'gm', name: context.ROLES.gm.user }, comment: 'Forward to Executive Director.' });
context.applyApprovalDecision(item, { decision: 'approve', actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user }, comment: 'ED approved.' });
assert.equal(item.status, 'approved');

assert.throws(
  () => context.releasePlanningItem(item, { actorRole: 'manager', actorName: 'Selin Demir' }),
  /GM release required/i,
  'only GM can release approved planning item'
);

context.releasePlanningItem(item, { actorRole: 'gm', actorName: 'Okan Demir' });
assert.equal(item.preparation.status, 'released_to_department');

context.acceptReleasedPlanningItem(item, { actorRole: 'manager', actorName: 'Selin Demir' });
assert.equal(item.preparation.status, 'accepted_by_department');

context.assignLeadInspectorToPlanningItem(item, {
  actorRole: 'manager',
  actorName: 'Selin Demir',
  leadInspector: 'Caner Yildiz'
});
assert.equal(item.preparation.leadInspector, 'Caner Yildiz');
assert.equal(item.preparation.status, 'lead_inspector_assigned');

context.proposePlanningTeamAndSchedule(item, {
  actorRole: 'leadInspector',
  actorName: 'Caner Yildiz',
  team: ['Caner Yildiz', 'Aylin Sezer'],
  startDate: '2026-09-10',
  endDate: '2026-09-12',
  resources: '2 inspectors, document review package'
});
assert.equal(item.preparation.status, 'team_schedule_proposed');

context.confirmPlanningPreparation(item, { actorRole: 'manager', actorName: 'Selin Demir' });
assert.equal(item.preparation.status, 'ready_for_execution');
assert.equal(item.preparation.assignmentPackage.status, 'generated_demo');
assert.match(item.preparation.assignmentPackage.title, /Audit Assignment Package/);

console.log('planning-release-smoke: ok');
