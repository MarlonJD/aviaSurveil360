const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/manager-workspaces.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

assert.equal(context.CANONICAL_SERVICE_PROVIDER_NAME, 'Fly Namibia');
assert.equal(context.ROLES.auditee.orgName, 'Fly Namibia');
assert.equal(context.SEED_ORGS[0].name, 'Fly Namibia');

const fresh = context.freshState();
assert.equal(fresh.managerFindingsUi.selectedAuditId, 'AUD-2026-001');
assert.equal(fresh.inspectionTeamUi.selectedAuditId, 'AUD-2026-001');
assert.equal(fresh.managerReportsUi.selectedReportId, 'PR-2026-018');
assert.ok(fresh.inspectionTeams.some((team) => team.auditId === 'AUD-2026-001'));
assert.ok(fresh.managerReports.some((report) => report.id === 'PR-2026-018'));
assert.ok(fresh.managerReports.some((report) => report.id === 'FR-2026-018'));
assert.equal(context.managerFindingsForAudit(fresh, 'AUD-2026-001').length, 4);
assert.ok(
  fresh.auditLog.some((entry) => entry.target === 'CAB-2026-014' && /authorized closure/i.test(entry.action)),
  'authorized closure for CAB-2026-014 is audit-logged'
);

const migrated = context.mergeDemoState({ demoStateVersion: 4, findings: [] });
assert.equal(migrated.demoStateVersion, 6);
assert.equal(migrated.managerFindingsUi.selectedAuditId, 'AUD-2026-001');
assert.ok(migrated.managerReports.length >= 2);

const legacySaved = {
  demoStateVersion: 4,
  orgs: [
    { id: 'ORG-XYZ', name: 'FlyNamibia (Pty) Ltd', contact: 'FlyNamibia Quality Manager' },
    { id: 'ORG-CUSTOM', name: 'Unrelated Aviation', contact: 'Unrelated Contact' }
  ],
  audits: [
    { id: 'AUD-CUSTOM-001', orgId: 'ORG-XYZ', ref: 'Annual review - FlyNamibia', location: 'FlyNamibia HQ' }
  ],
  auditReports: [
    {
      id: 'RPT-CUSTOM-001', auditId: 'AUD-CUSTOM-001',
      title: 'FlyNamibia Preliminary Report',
      executiveSummaryDraft: 'FlyNamibia review summary.',
      attachments: ['FlyNamibia_Preliminary_Report.pdf'],
      preliminaryNotice: { recipient: 'FlyNamibia Quality Manager' }
    }
  ],
  notifications: [
    { id: 'N-CUSTOM', text: 'FlyNamibia report is ready for review.' }
  ],
  auditLog: [
    {
      id: 'L-CUSTOM', time: '2026-06-12 09:15', actor: 'Aylin Sezer (CAA Inspector)',
      action: 'Saved browser-local audit action', target: 'USR-FINDING-001', system: false
    }
  ],
  findings: [
    {
      id: 'USR-FINDING-001', auditId: 'AUD-CUSTOM-001', orgId: 'ORG-XYZ',
      title: 'FlyNamibia user-created finding',
      description: 'FlyNamibia record retained from browser-local demo state.',
      responsiblePerson: 'FlyNamibia Quality Manager',
      evidence: [{ id: 'EV-CUSTOM', fileName: 'FlyNamibia_User_Evidence.pdf' }],
      commentsToAuditee: [{ text: 'FlyNamibia should review the expected evidence.' }],
      internalNotes: [{ text: 'Internal historical note retains FlyNamibia wording.' }]
    }
  ]
};
const migratedLegacy = context.mergeDemoState(legacySaved);
const migratedUserFinding = migratedLegacy.findings.find((finding) => finding.id === 'USR-FINDING-001');

assert.equal(migratedLegacy.orgs[0].id, 'ORG-XYZ');
assert.equal(migratedLegacy.orgs[0].name, 'Fly Namibia');
assert.equal(migratedLegacy.orgs[0].contact, 'Fly Namibia Quality Manager');
assert.equal(migratedLegacy.orgs[1].name, 'Unrelated Aviation');
assert.equal(migratedLegacy.audits[0].id, 'AUD-CUSTOM-001');
assert.equal(migratedLegacy.audits[0].ref, 'Annual review - Fly Namibia');
assert.equal(migratedLegacy.audits[0].location, 'Fly Namibia HQ');
assert.equal(migratedLegacy.auditReports[0].id, 'RPT-CUSTOM-001');
assert.equal(migratedLegacy.auditReports[0].title, 'Fly Namibia Preliminary Report');
assert.equal(migratedLegacy.auditReports[0].executiveSummaryDraft, 'Fly Namibia review summary.');
assert.equal(migratedLegacy.auditReports[0].attachments[0], 'Fly_Namibia_Preliminary_Report.pdf');
assert.equal(migratedLegacy.auditReports[0].preliminaryNotice.recipient, 'Fly Namibia Quality Manager');
assert.equal(migratedLegacy.notifications[0].id, 'N-CUSTOM');
assert.equal(migratedLegacy.notifications[0].text, 'Fly Namibia report is ready for review.');
assert.ok(
  migratedLegacy.auditLog.some((entry) => entry.id === 'L-CUSTOM' && entry.action === 'Saved browser-local audit action'),
  'saved audit log entry is preserved'
);
assert.ok(
  migratedLegacy.auditLog.some((entry) => (
    entry.id === 'L4' && entry.action === 'Finding closed (authorized closure - no CAP required)'
  )),
  'authorized closure seed audit log is merged into saved v4 audit logs'
);
assert.ok(migratedUserFinding, 'user-created finding is preserved');
assert.equal(migratedUserFinding.title, 'Fly Namibia user-created finding');
assert.equal(migratedUserFinding.description, 'Fly Namibia record retained from browser-local demo state.');
assert.equal(migratedUserFinding.responsiblePerson, 'Fly Namibia Quality Manager');
assert.equal(migratedUserFinding.evidence[0].fileName, 'Fly_Namibia_User_Evidence.pdf');
assert.equal(migratedUserFinding.commentsToAuditee[0].text, 'Fly Namibia should review the expected evidence.');
assert.equal(migratedUserFinding.internalNotes[0].text, 'Internal historical note retains FlyNamibia wording.');

console.log('department-manager-state-smoke: ok');
