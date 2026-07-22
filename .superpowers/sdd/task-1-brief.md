### Task 1: Canonical Naming And Manager State Foundation

**Files:**

- Create: `tests/department-manager-state-smoke.test.js`
- Create: `js/manager-workspaces.js`
- Modify: `js/data.js:7-12, 40-60, 102-110, 245-420, 900-960, 922-990, 1115-1382`
- Modify: `index.html` script list and asset tokens
- Modify: `MANIFEST.md` static prototype and smoke-test lists

**Interfaces:**

- Produces: `CANONICAL_SERVICE_PROVIDER_NAME === 'Fly Namibia'`.
- Produces: `state.users`, `state.inspectionTeams`, `state.managerReports`,
  `state.managerFindingsUi`, `state.inspectionTeamUi`, and
  `state.managerReportsUi`.
- Produces: `ensureManagerWorkspaceState(targetState) -> object`.
- Produces: `managerFindingsForAudit(targetState, auditId) -> Finding[]`.
- Produces: `managerReportById(targetState, reportId) -> ManagerReport|null`.
- Consumes: existing `deepClone`, audits, findings, and state merge boundary.

- [ ] **Step 1: Write the failing state smoke test**

Create a VM test that loads `js/data.js` and the not-yet-created helper module,
then asserts the exact foundation:

```js
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

const migrated = context.mergeDemoState({ demoStateVersion: 4, findings: [] });
assert.equal(migrated.demoStateVersion, 5);
assert.equal(migrated.managerFindingsUi.selectedAuditId, 'AUD-2026-001');
assert.ok(migrated.managerReports.length >= 2);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node tests/department-manager-state-smoke.test.js
```

Expected: FAIL because `js/manager-workspaces.js`, the canonical constant, and
the new state collections do not exist.

- [ ] **Step 3: Add canonical seeds and state defaults**

Add these exact public shapes in `js/data.js`:

```js
var CANONICAL_SERVICE_PROVIDER_NAME = 'Fly Namibia';
var DEMO_STATE_VERSION = 5;

var SEED_INSPECTION_TEAMS = [
  {
    id: 'TEAM-AUD-2026-001',
    auditId: 'AUD-2026-001',
    department: 'Cabin Safety',
    status: 'In Progress',
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    leadUserId: 'USR-CANER',
    memberIds: ['USR-CANER', 'USR-AYLIN', 'USR-MEHMET', 'USR-SELIN'],
    notes: 'Preliminary Report review target: 21 Jun 2026. Final Report submission target: 27 Jun 2026.',
    attachments: [],
    messages: [],
    history: [{ at: '2026-06-10 09:00', actor: 'Mehmet Kaya', action: 'Inspection team confirmed' }]
  }
];

var SEED_MANAGER_REPORTS = [
  {
    id: 'PR-2026-018', auditId: 'AUD-2026-001', organization: CANONICAL_SERVICE_PROVIDER_NAME,
    reportType: 'Preliminary Report', version: '1.0', leadInspector: 'Caner Yildiz',
    submittedAt: '2026-07-09 10:30', status: 'pending_manager', ownerRole: 'manager',
    capRequired: true, managerComment: '', attachments: ['Cabin_Checklist_Response_Summary.pdf'],
    summary: 'Preliminary Cabin Inspection report for authorized review.',
    history: [{ at: '2026-07-09 10:30', actor: 'Caner Yildiz', action: 'Submitted to Department Manager' }]
  },
  {
    id: 'FR-2026-018', auditId: 'AUD-2026-001', organization: CANONICAL_SERVICE_PROVIDER_NAME,
    reportType: 'Final Report', version: '2.0', leadInspector: 'Caner Yildiz',
    submittedAt: '2026-07-10 14:20', status: 'pending_manager', ownerRole: 'manager',
    capRequired: true, managerComment: '', attachments: ['CAP_Evidence_Summary.pdf'],
    summary: 'Final Cabin Inspection report prepared after the configured CAP/evidence stage.',
    history: [{ at: '2026-07-10 14:20', actor: 'Caner Yildiz', action: 'Final Report submitted to Department Manager' }]
  }
];
```

Enrich internal users with stable `id`, `roleKey`, `department`, `email`, and
`reportsToRole`; add `USR-SELIN` as a Cabin Safety inspector. Add four
non-hero findings under `AUD-2026-001`, one each for severities 1, 2, 3, and 0,
with real lifecycle fields and configured/demo references. Do not seed
`CAB-2026-001`.

Add these exact state defaults:

```js
users: deepClone(SEED_USERS),
inspectionTeams: deepClone(SEED_INSPECTION_TEAMS),
managerReports: deepClone(SEED_MANAGER_REPORTS),
managerFindingsUi: { query: '', status: 'all', dateRange: 'all', selectedAuditId: 'AUD-2026-001', tab: 'overview' },
inspectionTeamUi: { query: '', department: 'all', status: 'all', dateRange: 'all', selectedAuditId: 'AUD-2026-001', tab: 'overview', openMenuAuditId: '' },
managerReportsUi: { query: '', reportType: 'all', status: 'all', selectedReportId: 'PR-2026-018', tab: 'summary', validationMessage: '' },
```

In `mergeDemoState`, merge each UI object with its fresh default and repair
missing arrays from the new seeds. Merge the four required manager findings by
ID so an older saved `findings` array still exposes the first-load manager
review scenario without deleting user-created findings.

- [ ] **Step 4: Add the helper module boundary and script registration**

Create `js/manager-workspaces.js` with defensive state normalization and pure
lookup selectors:

```js
function ensureManagerWorkspaceState(target) {
  var s = target || state;
  if (!Array.isArray(s.users)) s.users = deepClone(SEED_USERS);
  if (!Array.isArray(s.inspectionTeams)) s.inspectionTeams = deepClone(SEED_INSPECTION_TEAMS);
  if (!Array.isArray(s.managerReports)) s.managerReports = deepClone(SEED_MANAGER_REPORTS);
  return s;
}

function managerFindingsForAudit(target, auditId) {
  var s = ensureManagerWorkspaceState(target);
  return s.findings.filter(function (finding) { return finding.auditId === auditId; });
}

function managerReportById(target, reportId) {
  var s = ensureManagerWorkspaceState(target);
  return s.managerReports.filter(function (report) { return report.id === reportId; })[0] || null;
}
```

Load the new script after `js/reports.js` and before `js/work-items.js` in
`index.html`. Add it to `MANIFEST.md`.

- [ ] **Step 5: Normalize active user-facing Fly Namibia strings**

Replace visible `FlyNamibia` and `FlyNamibia (Pty) Ltd` forms with
`Fly Namibia` in active JS data/view copy, tests, the canonical current scenario,
and bilingual build summaries. Use underscores in generated filenames, for
example `Fly_Namibia_Preliminary_Report_PR-2026-018.pdf`.

Do not rewrite historical completed-plan evidence. Negative examples in the
approved design's naming contract may remain because they explain forbidden
variants.

- [ ] **Step 6: Run GREEN checks**

Run:

```bash
node --check js/data.js
node --check js/manager-workspaces.js
node tests/department-manager-state-smoke.test.js
```

Expected: syntax exits 0 and the state smoke prints its `ok` marker.

- [ ] **Step 7: Review checkpoint without committing**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the unrelated untracked rollout plan remains
untouched. Do not commit.

