# Task 1 Report — Freeze The 86-Route React Contract

## Status

Completed without a commit, branch change, staging, push, deployment, or Plan 2 work.

## Implemented behavior

- Expanded the typed React route contract from 17 to 86 ordered, unique audit-owned surfaces.
- Added audit ID, component key, profile availability, and blocked-profile reason to every route contract.
- Preserved 17 dual-profile routes and marked the remaining 69 as demo-only with the consistent reason: `HTTP capability is unavailable until Plan 2 activates this route.`
- Re-homed `ui-audit-009` to CAA Inspector at `/inspector/findings/FND-CAB-2026-001` under `inspector-home`, and `ui-audit-044` to Department Manager at `/department-manager/evidence/FND-CAB-2026-001` under `manager-home`.
- Added the lazy screen-component registry. Existing component slices remain lazy-loaded; frozen future demo routes use their explicit deferred route component until their owning Tasks 4–10 implementation.
- Reworked the router to instantiate every declared contract. HTTP attempts for demo-only routes render the actual parent screen plus the explicit unavailable-capability alert and do not render the target demo component.
- Converted the 86-row legacy manifest and behavior ledger to full React-parity route coverage, while preserving the root Vanilla demo as the removal-blocking oracle.
- Corrected the two existing visual parity fixtures to source-role-correct routes and roles.

## RED verification

Command:

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: failed as expected, not because of syntax or setup. The first route-contract assertion reported:

```text
expected [ { id: 'role-select', …(8) }, …(16) ] to have a length of 86 but got 17
- Expected: 86
+ Received: 17
```

Reason: the pre-task candidate only had the original 17 route contracts and 17 React-parity manifest rows.

## GREEN verification

```text
npm --prefix apps/web run typecheck
```

Result: passed.

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: passed — 3 files, 16 tests.

```text
node --test tests/parity/react-legacy-parity.test.mjs
```

Result: passed — 4 tests; the ledger asserts 86 unique React parity IDs and 0 legacy-only rows.

## Files changed

- `apps/web/src/app/route-contracts.ts`
- `apps/web/src/app/route-contracts.test.ts`
- `apps/web/src/app/screen-component-registry.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/app/router.test.tsx`
- `apps/web/src/parity/legacy-screen-manifest.ts`
- `apps/web/src/parity/legacy-screen-manifest.test.ts`
- `apps/web/tests/e2e/support/legacy-parity-fixtures.ts`
- `tests/parity/behavior-ledger.json`
- `tests/parity/react-legacy-parity.test.mjs`

## Self-review

- The changed tracked files are within the Task 1 allowlist; the new registry is the sole requested new source file.
- The root Vanilla oracle, documentation plans, module architecture documents, stakeholder evidence, outputs, and unrelated existing working-tree changes were not changed by this task.
- The contract tests enforce 86 ordered audit IDs, unique IDs and paths, the 17/69 profile split, the identical Plan 2 reason, source-role/route-role equality, and both corrected inherited mappings.
- The router test verifies an HTTP direct load uses its real parent and explicit alert rather than a demo target or generic placeholder.
- `git diff --check` passed for the Task 1 tracked-file allowlist.

## Concerns

None for the Task 1 contract boundary. The 69 deferred demo route components are intentionally non-feature shells until Tasks 4–10 implement their source-faithful screens; their HTTP capability remains explicitly unavailable until Plan 2.

## Review Fixes

### Status

Completed the interrupted review-fix wave without a commit, branch change, staging, push, deployment, or changes outside the Task 1 allowlist and this report. This section supersedes the earlier statements about deferred demo components and registry counts.

### Corrections

- Removed the generic deferred demo component model. The registry now records 16 lazy implemented feature screens, one typed `router-owned` role selector, and 69 pending feature screens with no component.
- Pending demo routes render their nearest implemented parent plus a route-specific pending-implementation notice. HTTP-blocked routes render the parent plus the exact Plan 2 reason and never render the pending target.
- Froze the exact accepted primary-route set with `parentId: null`, kept detail routes contextual, re-homed `ui-audit-009` under `inspector-findings` and `ui-audit-044` under `manager-findings-review`, placed all five wizard steps under `audit-plan`, and placed template preview under `admin-template-list`.
- Split the 86 parity contracts into exactly 17 interaction-verified surfaces and 69 route-contract-only surfaces. `declared-route-and-workflow-actions` now names only the 17 interaction-verified surfaces; the Node parity test asserts the exact ordered partition.
- Kept `finding-detail-page.tsx`, `evidence-review-page.tsx`, and `role-navigation.tsx` untouched because their internal role UI corrections belong to Tasks 4 and 6.

### RED evidence

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: failed exactly at the registry ownership assertion — 1 failed and 17 passed across 3 files. The failure was `expected [ …(16) ] to have a length of 17 but got 16`, confirming that the router-owned role selector had been incorrectly counted as a lazy implemented feature component.

The first combined verification also exposed a TypeScript narrowing error in `router.tsx`: `Argument of type 'string' is not assignable` to `ReactSurfaceId`. Typing the role-home map as `Record<Role, ReactSurfaceId>` resolved it.

### GREEN evidence

```text
npm --prefix apps/web run typecheck
```

Result: passed with `tsc -b --pretty false` and zero errors.

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: passed — 3 files, 18 tests.

```text
node --test tests/parity/react-legacy-parity.test.mjs
```

Result: passed — 4 tests, 0 failures.

```text
git diff --check -- apps/web/src/app/route-contracts.ts apps/web/src/app/route-contracts.test.ts apps/web/src/app/screen-component-registry.tsx apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/parity/legacy-screen-manifest.ts apps/web/src/parity/legacy-screen-manifest.test.ts apps/web/tests/e2e/support/legacy-parity-fixtures.ts tests/parity/behavior-ledger.json tests/parity/react-legacy-parity.test.mjs .superpowers/sdd/react-86/task-1-report.md
```

Result: passed with no whitespace errors before this report append; rerun after the append is recorded below in the final handoff.

### Review-fix files

- `apps/web/src/app/route-contracts.ts`
- `apps/web/src/app/route-contracts.test.ts`
- `apps/web/src/app/screen-component-registry.tsx`
- `apps/web/src/app/router.tsx`
- `tests/parity/behavior-ledger.json`
- `tests/parity/react-legacy-parity.test.mjs`
- `.superpowers/sdd/react-86/task-1-report.md`

### Cross-task handoff

The route contracts and guards now assign `finding-detail` to CAA Inspector and `evidence-review` to Department Manager. Their existing page-internal role presentation and accepted navigation wiring remain unchanged here and must be corrected by Tasks 4 and 6, which own `finding-detail-page.tsx`, `evidence-review-page.tsx`, and `role-navigation.tsx`.

## Second Re-review Fixes

### Status

Completed the final Task 1 TDD review wave without a commit, staging, branch operations, push, deployment, or edits outside the Task 1 allowlist and this report. This section supersedes the prior `17 interaction-verified` evidence statement while preserving the separate 17 dual-profile route-contract fact.

### Contract corrections

- Added an exact map-based assertion for every contextual route and verified that every declared parent ID exists.
- Bound nested Inspector routes to their immediate accepted workspaces: Checklist Runner to Audit Detail, Closure Report Preview and Inspector Assistant to Finding Detail, Finding Detail to Inspector Findings, and Profile to Inspector Home.
- Bound Lead report details to their Preliminary or Final Reports lists and kept assignment/CAP details under Lead Home.
- Bound Department Manager risk, organization, CAP, reports, package, Evidence, closure, and wizard details to their accepted immediate workspaces.
- Made Executive Report Preview contextual under Executive Final Reports and kept Auditee Report Preview under Auditee Final Reports.
- Kept Admin Template Preview under Admin Template List, chose Admin Checklist Builder as the source-faithful immediate parent for Admin Inspection Package Builder, and placed Admin Organization Detail under Organization Master Data.

### Evidence corrections

- Preserved exactly 17 dual-profile route contracts.
- Classified exactly 15 surfaces as currently interaction-verified.
- Classified `finding-detail` and `evidence-review` separately as route/guard-correct but presentation-correction-pending for Tasks 4 and 6.
- Preserved exactly 69 route-contract-only surfaces.
- Asserted the three ordered evidence categories are exact, disjoint, and union to all 86 parity surfaces.
- Scoped `declared-route-and-workflow-actions` to the 15 interaction-verified surfaces and scoped shell reset/role-exit claims to the 14 verified non-root shell surfaces instead of wildcard claims.

### RED evidence

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: failed for the intended contract reasons — 2 failed and 17 passed across 3 files. The primary-route assertion exposed `ui-audit-063` as incorrectly primary. The exact contextual-parent assertion reported the stale role-home parents and missing Executive Report Preview contextual entry.

```text
node --test tests/parity/react-legacy-parity.test.mjs
```

First RED result: 1 failed and 3 passed; the evidence partition reported `17 !== 15`.

After applying the 15/2/69 categories but before changing shell claims, the same command failed again for the intended second-cycle reason: the actual shell scope was `["*"]`, while the test required the exact 14 verified non-root shell surfaces.

### GREEN evidence

```text
npm --prefix apps/web run typecheck
```

Result: passed with zero TypeScript errors.

```text
npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts
```

Result: passed — 3 files, 19 tests.

```text
node --test tests/parity/react-legacy-parity.test.mjs
```

Result: passed — 4 tests, 0 failures.

```text
git diff --check -- apps/web/src/app/route-contracts.ts apps/web/src/app/route-contracts.test.ts apps/web/src/app/screen-component-registry.tsx apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/parity/legacy-screen-manifest.ts apps/web/src/parity/legacy-screen-manifest.test.ts apps/web/tests/e2e/support/legacy-parity-fixtures.ts tests/parity/behavior-ledger.json tests/parity/react-legacy-parity.test.mjs .superpowers/sdd/react-86/task-1-report.md
```

Result before this append: passed with no whitespace errors. The final post-append rerun is included in the handoff.

### Final concern and cross-task handoff

`finding-detail` and `evidence-review` are correctly routed, guarded, and parented, but they are intentionally not claimed as interaction-verified until Tasks 4 and 6 correct their page-internal role presentation and accepted navigation wiring in `finding-detail-page.tsx`, `evidence-review-page.tsx`, and `role-navigation.tsx`.
