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
const seedContracts = {
  'PLAN-2026-Q3-CABIN': ['TPL-CABIN-2026', '2026-09-10', 'Cabin emergency equipment serviceability oversight.'],
  'PLAN-2026-Q4-FOPS': ['TPL-FOPS-2026', '2026-10-12', 'Flight Operations crew training record surveillance.'],
  'PLAN-2026-Q4-AIRW': ['TPL-AWO-2026', '2026-11-16', 'Airworthiness maintenance release documentation review.']
};
Object.entries(seedContracts).forEach(([id, expected]) => {
  const seed = context.state.planningItems.find((candidate) => candidate.id === id);
  assert.ok(seed, `${id} is seeded`);
  assert.equal(seed.applicationType, 'Continued Surveillance');
  assert.equal(seed.inspectionCategory, 'Routine / Announced');
  assert.equal(seed.noticePolicy, 'advance');
  assert.equal(seed.templateId, expected[0]);
  assert.equal(seed.plannedDate, expected[1]);
  assert.equal(seed.mode, 'On-site');
  assert.equal(seed.location, 'Fly Namibia HQ');
  assert.equal(seed.scope, expected[2]);
  assert.equal(seed.auditId, '');
});

const saved = context.freshState();
const savedCabin = saved.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');
savedCabin.applicationType = '';
savedCabin.plannedDate = '2026-09-22';
savedCabin.scope = '';
savedCabin.preparation.history.push({ actor: 'Caner Yildiz', role: 'leadInspector', action: 'saved', date: '2026-07-20', comment: 'Preserve me.' });
const restored = context.mergeDemoState(JSON.parse(JSON.stringify(saved)));
const restoredCabin = restored.planningItems.find((candidate) => candidate.id === 'PLAN-2026-Q3-CABIN');
assert.equal(restoredCabin.applicationType, 'Continued Surveillance');
assert.equal(restoredCabin.plannedDate, '2026-09-22');
assert.equal(restoredCabin.scope, 'Cabin emergency equipment serviceability oversight.');
assert.match(restoredCabin.preparation.history.at(-1).comment, /Preserve me/);

const item = context.createPlanningInspection(context.state, {
  organizationId: 'ORG-XYZ',
  applicationType: 'Cabin Inspection',
  domain: 'Cabin Safety',
  inspectionCategory: 'Routine / Announced',
  purpose: 'Verify the governed release and preparation path.',
  triggerType: 'Routine surveillance',
  riskCategory: 'Cabin emergency equipment',
  plannedDate: '2026-09-10',
  mode: 'On-site',
  location: 'Fly Namibia HQ',
  templateId: 'TPL-CABIN-2026',
  scope: 'Cabin safety controls.',
  currency: 'USD',
  requestedBudget: 12500
}, {
  role: 'manager',
  name: context.ROLES.manager.user
});

context.applyApprovalDecision(item, { decision: 'approve', actor: { role: 'finance', name: context.ROLES.finance.user }, comment: 'Budget accepted.' });
context.applyApprovalDecision(item, { decision: 'forward', actor: { role: 'gm', name: context.ROLES.gm.user }, comment: 'Forward to Executive Director.' });
context.applyApprovalDecision(item, { decision: 'approve', actor: { role: 'executiveDirector', name: context.ROLES.executiveDirector.user }, comment: 'ED approved.' });
assert.equal(item.status, 'approved');
assert.equal(item.preparation.status, 'not_released');
assert.equal(context.planningWorkspaceNextAction(item).label, 'GM Release to Department');

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

const materialized = context.materializeReadyPlanningInspection(context.state, item);
assert.equal(item.auditId, materialized.audit.id);
assert.equal(materialized.audit.status, 'Scheduled');
assert.equal(context.state.inspectionTeams.filter((team) => team.auditId === materialized.audit.id).length, 1);
assert.equal(context.state.inspectionWorkspaces[materialized.audit.id] !== undefined, true);
assert.equal(context.state.inspectionCoordinations.filter((record) => record.auditId === materialized.audit.id).length, 1);
const replay = context.materializeReadyPlanningInspection(context.state, item);
assert.equal(replay.created, false);
assert.equal(context.state.audits.filter((audit) => audit.id === materialized.audit.id).length, 1);
assert.equal(context.state.inspectionTeams.filter((team) => team.auditId === materialized.audit.id).length, 1);
assert.equal(Object.keys(context.state.inspectionWorkspaces).filter((auditId) => auditId === materialized.audit.id).length, 1);
assert.equal(context.state.inspectionCoordinations.filter((record) => record.auditId === materialized.audit.id).length, 1);

console.log('planning-release-smoke: ok');
