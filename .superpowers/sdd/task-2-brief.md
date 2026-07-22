### Task 2: Department Manager Findings Review

**Files:**

- Create: `tests/department-manager-findings-smoke.test.js`
- Modify: `js/manager-workspaces.js`
- Modify: `js/views.js` near `viewFindings()` and shared view helpers
- Modify: `js/app.js:6-35, 115-130, 446-495, 657-900`
- Modify: `css/styles.css`

**Interfaces:**

- Consumes: state and selectors from Task 1.
- Produces: `managerInspectionRows(targetState, filters) -> ManagerInspectionRow[]`.
- Produces: `managerFindingCounts(findings) -> { total, critical, major, minor, observations, open, inReview, closed }`.
- Produces: `viewManagerFindingsReview() -> string`.
- Produces actions: `manager-findings-select`, `manager-findings-filter`,
  `manager-findings-tab`, `manager-findings-open-finding`,
  `manager-findings-open-report`, and `manager-findings-export`.

- [ ] **Step 1: Write the failing Findings Review smoke test**

Load the full script order and assert:

```js
context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'findings-review';
context.render();
let html = elements.get('app-root').innerHTML;
assert.match(html, /Findings Review/);
assert.match(html, /AUD-2026-001/);
assert.match(html, /Fly Namibia/);
assert.match(html, /Findings Overview/);
assert.match(html, /Findings List/);
assert.match(html, /By Department/);
assert.match(html, /By Level/);
assert.match(html, /Current Owner/);
assert.match(html, /Next Action/);
assert.match(html, /Due Date/);

context.handleAction('manager-findings-tab', dataEl({ 'data-tab': 'list' }));
html = elements.get('app-root').innerHTML;
assert.match(html, /CAB-2026-011/);
assert.match(html, /Level 1 Critical/);
```

Also assert that selecting a different audit changes
`state.managerFindingsUi.selectedAuditId` and that a no-result query renders
`No inspections match these filters.`.

- [ ] **Step 2: Run the test and verify RED**

Run `node tests/department-manager-findings-smoke.test.js`.

Expected: FAIL because the route, renderer, and actions do not exist.

- [ ] **Step 3: Implement pure inspection aggregation**

Add selectors that derive rows from `state.audits` and `state.findings`:

```js
function managerFindingCounts(findings) {
  return findings.reduce(function (counts, finding) {
    counts.total += 1;
    if (finding.severity === 1) counts.critical += 1;
    else if (finding.severity === 2) counts.major += 1;
    else if (finding.severity === 3) counts.minor += 1;
    else counts.observations += 1;
    if (finding.status === 'CLOSED') counts.closed += 1;
    else if (finding.status === 'CAP_SUBMITTED' || finding.status === 'EVIDENCE_SUBMITTED') counts.inReview += 1;
    else counts.open += 1;
    return counts;
  }, { total: 0, critical: 0, major: 0, minor: 0, observations: 0, open: 0, inReview: 0, closed: 0 });
}
```

`managerInspectionRows` returns audit/organization/team-lead fields plus the
count object and filters by query/status/date range without mutating state.

- [ ] **Step 4: Add manager navigation and route dispatch**

In `NAV.manager`, expose `Findings Review` with view `findings-review`. Add
`findings-review` to `VIEW_TITLES` and `renderContent()`:

```js
case 'findings-review': return viewManagerFindingsReview();
```

Keep the generic `findings` route available for finding-detail navigation but
remove the redundant manager `Open Findings` navigation label.

- [ ] **Step 5: Render the master-detail workspace**

Implement `viewManagerFindingsReview()` with:

- search/status/date controls;
- five compact inspection KPIs;
- inspection rows with a selected-state rail;
- right-side header and the four required tabs;
- compact finding-level and finding-status summaries;
- department breakdown table;
- full finding list with Owner, Next Action, Due Date, Status, Severity, Audit,
  and Organization;
- buttons that switch to the list tab or navigate to `reports-approval` with the
  related report selected.

Use semantic buttons and existing escape/status helpers. If the current
selection is filtered out, select the first visible row without mutating audit
data. If no rows remain, render the exact empty state.

- [ ] **Step 6: Wire delegated actions and export**

Handlers update only manager UI state, persist when state changes, and render.
`manager-findings-open-finding` navigates to the existing `finding` route.
`manager-findings-export` creates a UTF-8 CSV Blob containing the visible list
and downloads `Fly_Namibia_Findings_Review.csv`; it must not be toast-only.

- [ ] **Step 7: Add focused styling and verify GREEN**

Add namespaced `.manager-findings-*` / shared `.manager-workbench-*` styles.
Run:

```bash
node --check js/manager-workspaces.js
node --check js/views.js
node --check js/app.js
node tests/department-manager-findings-smoke.test.js
node tests/table-first-workbench-smoke.test.js
```

Expected: all exit 0.

- [ ] **Step 8: Review checkpoint without committing**

Run `git diff --check`; inspect the diff for duplicated hard-coded audit/finding
datasets. Do not commit.

