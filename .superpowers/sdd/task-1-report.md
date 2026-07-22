# Task 1 Report: Canonical Naming And Manager State Foundation

## Status

`DONE`

Commits: none (prohibited by task and repository policy).

## Implemented Behavior

- Added `CANONICAL_SERVICE_PROVIDER_NAME === 'Fly Namibia'` and advanced browser-local demo state to version 5.
- Canonicalized the active Task 1 JavaScript/view/test copy, generated mock evidence filename, canonical current scenario, and bilingual build summaries to `Fly Namibia` / `Fly_Namibia_...` filename forms.
- Enriched the user seed with stable IDs, role keys, departments, emails, reporting-line roles, and the `USR-SELIN` Cabin Safety inspector.
- Added the required `AUD-2026-001` inspection-team seed and separate `PR-2026-018` / `FR-2026-018` manager report artifacts.
- Added four non-hero manager findings for `AUD-2026-001`, with severities 1, 2, 3, and 0 and real demo lifecycle fields. `CAB-2026-001` remains unseeded for the live checklist scenario.
- Added the exact manager UI defaults to fresh state.
- Added version-5 saved-state migration that repairs the new arrays, merges each UI object over its fresh default, and restores the four required manager findings by ID without deleting or replacing saved/user-created findings.
- Added the focused `js/manager-workspaces.js` boundary with defensive collection normalization plus audit-finding and report lookup selectors.
- Registered the helper after `js/reports.js` and before `js/work-items.js`, bumped the shared asset token, and registered the module/test in `MANIFEST.md`.

## Files Changed

Task-owned implementation and test files:

- `js/data.js`
- `js/manager-workspaces.js` (new)
- `js/app.js`
- `js/views.js`
- `index.html`
- `MANIFEST.md`
- `tests/department-manager-state-smoke.test.js` (new)
- `tests/demo-boundary-smoke.test.js`
- `tests/governance-render-smoke.test.js`
- `tests/inspector-nav-smoke.test.js`
- `tests/lead-inspector-nav-smoke.test.js`
- `tests/lead-inspector-workspace-smoke.test.js`
- `tests/service-provider-final-report-smoke.test.js`
- `tests/table-first-workbench-smoke.test.js`

Task-owned canonical current documentation surfaces:

- `docs/demo-evidence/BUILD_SUMMARY.md`
- `docs/demo-evidence/BUILD_SUMMARY.turkce.md`
- `docs/product-specs/scenarios/DEMO_SCENARIO_OPERATOR_AUDIT.md`
- `docs/product-specs/scenarios/DEMO_SCENARIO_OPERATOR_AUDIT.turkce.md`

Evidence:

- `.superpowers/sdd/task-1-report.md` (this report)

The unrelated untracked `docs/exec-plans/active/2026-07-08-modern-aviation-saas-rollout-plan.md` was preserved untouched. Pre-existing plan/spec/index changes outside the Task 1 file set were not modified.

## TDD RED Evidence

The smoke test was created before any production changes and run with:

```bash
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `1`.

```text
node:fs:441
    return binding.readFileUtf8(path, stringToFlags(options.flag));
                   ^

Error: ENOENT: no such file or directory, open '/Users/marlonjd/Developer/web/aviaSurveil360/js/manager-workspaces.js'
    at Object.readFileSync (node:fs:441:20)
    at /Users/marlonjd/Developer/web/aviaSurveil360/tests/department-manager-state-smoke.test.js:11:22
    at Array.forEach (<anonymous>)
    at Object.<anonymous> (/Users/marlonjd/Developer/web/aviaSurveil360/tests/department-manager-state-smoke.test.js:10:44)
    at Module._compile (node:internal/modules/cjs/loader:1854:14)
    at Object..js (node:internal/modules/cjs/loader:1985:10)
    at Module.load (node:internal/modules/cjs/loader:1423:32)
    at Function._load (node:internal/modules/cjs/loader:1246:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/marlonjd/Developer/web/aviaSurveil360/js/manager-workspaces.js'
}

Node.js v24.16.0
```

Reason: expected RED failure because the test deliberately loaded the required but not-yet-created helper module. This proved the new foundation was absent before production implementation.

## GREEN Evidence

Prescribed GREEN commands:

```bash
node --check js/data.js
node --check js/manager-workspaces.js
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `0`; syntax checks were silent and the smoke output was:

```text
department-manager-state-smoke: ok
```

Focused syntax/regression commands:

```bash
node --check js/app.js
node --check js/views.js
node tests/demo-boundary-smoke.test.js
node tests/governance-render-smoke.test.js
node tests/lead-inspector-nav-smoke.test.js
node tests/lead-inspector-workspace-smoke.test.js
node tests/inspector-nav-smoke.test.js
node tests/service-provider-final-report-smoke.test.js
node tests/table-first-workbench-smoke.test.js
```

Exact result: exit code `0`.

```text
demo-boundary-smoke: ok
governance-render-smoke: ok
lead-inspector-nav-smoke: ok
lead-inspector-workspace-smoke: ok
inspector-nav-smoke: ok
service-provider-final-report-smoke: ok
table-first-workbench-smoke: ok
```

Fresh full regression command:

```bash
node --test tests/*.test.js
```

Exact result: exit code `0`; `21` tests passed, `0` failed, `0` skipped, `0` cancelled.

Review commands:

```bash
git diff --check
git status --short
```

Exact result: combined command exited `0`; `git diff --check` emitted no whitespace errors. Status retained the unrelated untracked modern rollout plan and showed no commit/stage operation.

## Self-Review

- Verified the new state smoke matches the brief's exact public assertions and selector boundary.
- Verified `managerFindingsForAudit(freshState(), 'AUD-2026-001')` returns exactly four records.
- Verified the four seeded manager records have severity values `1`, `2`, `3`, and `0`; none uses `CAB-2026-001`.
- Verified version-4 migration advances to version 5, restores manager state defaults/reports, and adds only missing required manager findings by ID.
- Verified saved records with matching finding IDs are preserved rather than overwritten; unrelated saved findings are not deleted.
- Verified the helper script order is `reports` -> `manager-workspaces` -> `work-items`.
- Verified no `FlyNamibia`, `FlyNamibia (Pty) Ltd`, or `Air Namibia` occurrence remains in the active Task 1 JS, tests, canonical scenario, or bilingual build-summary surfaces.
- Verified the implementation remains frontend-only/browser-local and adds no backend, database, API, real authentication, upload/storage, notification delivery, or framework dependency.
- Inspected the task-owned diff; no Task 2-6 routes, renderers, mutations, approval transitions, PDF builder, or styling were implemented.

## Concerns

None blocking within Task 1. Browser/visual workspace QA was not run because this task establishes data/state/selectors and the prescribed verification is Node-based; rendered workspace and responsive QA remain explicitly assigned to later tasks in the approved plan.

## Review Fixes — Saved-State Naming And Authorized Closure Audit Log

### Fix Details

- Added a representative saved-version-4 migration fixture covering organizations, audits, audit reports, notifications, and a user-created finding.
- Added a schema-scoped recursive migration helper. It normalizes only explicitly listed provider display/content fields, `Comment to Auditee` text, and attachment/evidence filenames:
  - `FlyNamibia` and `FlyNamibia (Pty) Ltd` become `Fly Namibia` in known display fields;
  - `FlyNamibia_` becomes `Fly_Namibia_` in known filename fields.
- The migration preserves record IDs, unrelated organizations, the saved user-created finding, and the saved internal-note wording. `internalNotes` is deliberately excluded from the migration schema.
- Added a targeted `SEED_AUDIT_LOG` record for the `CAB-2026-014` authorized no-CAP closure. Finding lifecycle and CAP acceptance/closure rules were not changed.

### Additional Files Changed

- `tests/department-manager-state-smoke.test.js`
- `js/data.js`
- `.superpowers/sdd/task-1-report.md`

### Review Fix 1 RED — Saved v4 Naming

Command:

```bash
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `1`.

```text
node:assert:152
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'FlyNamibia (Pty) Ltd'
- 'Fly Namibia'
      ^

    at Object.<anonymous> (/Users/marlonjd/Developer/web/aviaSurveil360/tests/department-manager-state-smoke.test.js:69:8)
    at Module._compile (node:internal/modules/cjs/loader:1854:14)
    at Object..js (node:internal/modules/cjs/loader:1985:10)
    at Module.load (node:internal/modules/cjs/loader:1577:32)
    at Module._load (node:internal/modules/cjs/loader:1379:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: 'FlyNamibia (Pty) Ltd',
  expected: 'Fly Namibia',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v24.16.0
```

Reason: saved v4 `orgs` replaced the canonical fresh collection, so the legacy provider display name survived migration.

The first implementation run correctly advanced past the organization/display assertions and exposed one array-walker defect in filename handling:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ 'FlyNamibia_Preliminary_Report.pdf'
- 'Fly_Namibia_Preliminary_Report.pdf'
      ^
```

The schema walker was corrected to traverse arrays before applying scalar display/filename modes. The test expectation was not changed.

Review Fix 1 GREEN command:

```bash
node --check js/data.js
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `0`; syntax output was silent and the smoke output was:

```text
department-manager-state-smoke: ok
```

### Review Fix 2 RED — Authorized Closure Audit Log

After Review Fix 1 was GREEN, the audit-log assertion was added and run with:

```bash
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `1`.

```text
node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: authorized closure for CAB-2026-014 is audit-logged
    at Object.<anonymous> (/Users/marlonjd/Developer/web/aviaSurveil360/tests/department-manager-state-smoke.test.js:26:8)
    at Module._compile (node:internal/modules/cjs/loader:1854:14)
    at Object..js (node:internal/modules/cjs/loader:1985:10)
    at Module.load (node:internal/modules/cjs/loader:1577:32)
    at Module._load (node:internal/modules/cjs/loader:1379:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v24.16.0
```

Reason: `CAB-2026-014` had the seeded `authorized-no-cap` closure type but no matching authorized-closure seed audit-log entry.

Review Fix 2 GREEN command:

```bash
node --check js/data.js
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `0`; syntax output was silent and the smoke output was:

```text
department-manager-state-smoke: ok
```

### Final Review-Fix Verification

Commands:

```bash
node --check js/data.js
node --check js/manager-workspaces.js
node --check tests/department-manager-state-smoke.test.js
node tests/department-manager-state-smoke.test.js
node tests/demo-boundary-smoke.test.js
node --test tests/*.test.js
```

Exact result: exit code `0`.

```text
department-manager-state-smoke: ok
demo-boundary-smoke: ok
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4760.136667
```

### Review-Fix Self-Review

- The migration uses per-collection schemas rather than a global string walk; unknown properties and `internalNotes` are not rewritten.
- Both legacy provider variants and provider-prefixed filenames are covered.
- Saved and unrelated record IDs are unchanged, and the user-created finding remains present alongside ID-repaired manager seed findings.
- The migration is idempotent for already-canonical values and also repairs stale version-5 browser state created before this review fix.
- The new log is scoped to `CAB-2026-014`, records the Department Manager actor and authorized no-CAP closure action, and does not alter CAP acceptance or evidence-based closure behavior.
- No branch, stage, commit, push, PR, backend, database, API, storage, or framework action was performed.

Review-fix concerns: none.

## Review Fix — Saved v4 Audit-Log Seed Repair

### Fix Details

- Extended the representative saved-version-4 fixture with an unrelated browser-local audit-log entry, `L-CUSTOM`.
- Added regression assertions that migration preserves `L-CUSTOM` and restores the exact `L4` authorized-closure seed action.
- Added a targeted ID-based repair in `mergeDemoState`: saved audit-log entries remain in place, and the seeded `L4` record is appended only when no saved entry already has ID `L4`.
- No other finding, CAP, evidence, or closure lifecycle behavior changed.

### RED Evidence

Command:

```bash
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `1`.

```text
node:internal/assert/utils:77
    throw err;
    ^

AssertionError [ERR_ASSERTION]: authorized closure seed audit log is merged into saved v4 audit logs
    at Object.<anonymous> (/Users/marlonjd/Developer/web/aviaSurveil360/tests/department-manager-state-smoke.test.js:96:8)
    at Module._compile (node:internal/modules/cjs/loader:1854:14)
    at Object..js (node:internal/modules/cjs/loader:1985:10)
    at Module.load (node:internal/modules/cjs/loader:1577:32)
    at Module._load (node:internal/modules/cjs/loader:1379:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: false,
  expected: true,
  operator: '==',
  diff: 'simple'
}

Node.js v24.16.0
```

Reason: `mergeDemoState` replaced the fresh audit-log seed array with the realistic saved array. The preceding preservation assertion passed for `L-CUSTOM`, but the saved array had no `L4` repair and therefore lost the required authorized-closure audit record.

### GREEN Evidence

Command:

```bash
node tests/department-manager-state-smoke.test.js
```

Exact result: exit code `0`.

```text
department-manager-state-smoke: ok
```

### Final Verification

Commands:

```bash
node --check js/data.js
node --check tests/department-manager-state-smoke.test.js
node tests/department-manager-state-smoke.test.js
node tests/demo-boundary-smoke.test.js
node --test tests/*.test.js
```

Exact result: every command exited `0`; syntax checks were silent.

```text
department-manager-state-smoke: ok
demo-boundary-smoke: ok
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4910.56125
```

### Self-Review

- The fixture now models the production-shaped failure condition: version-4 browser state with its own non-empty `auditLog` array.
- The regression proves the unrelated saved `L-CUSTOM` entry survives and the required `L4` action is restored by exact ID and action text.
- Repair matching is ID-based. An existing saved `L4` is neither replaced nor duplicated; only a missing `L4` is deep-cloned from `SEED_AUDIT_LOG`.
- The implementation does not merge unrelated seed logs or mutate existing saved log records.
- The change stays inside the frontend-only browser-state migration boundary and does not claim production audit-log behavior.
- No branch, stage, commit, push, PR, backend, database, API, storage, framework, or lifecycle expansion was performed.

Review-fix concerns: none.
