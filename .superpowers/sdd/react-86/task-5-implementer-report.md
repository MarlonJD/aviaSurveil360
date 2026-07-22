# Task 5 Implementer Report

Date: 2026-07-22

Status: `DONE_WITH_CONCERNS`. The twelve Task 5 Lead Inspector surfaces are
implemented and the functional, contract, typecheck, build, boundary, root
oracle, and hygiene gates are green. The required complete Lead visual matrix
was run once and is not green: 5/43 tests passed and 38/43 failed. Per the
explicit bounded-visual instruction and the user's direction not to enter a
pixel loop, no repeated visual tuning run was performed.

No commit, stage, branch, push, deploy, Plan 2, production-infrastructure, or
plan/progress lifecycle action was taken.

## Scope Implemented

- Added the Preliminary Report list and working-report flow, including returned
  version identity, filters, a working document preview, and structurally
  separate `Comment to Auditee` / `Internal CAA Note` regions.
- Added Final Report list, readiness, immutable preparation preview, and final
  document surfaces. They load the canonical backend report/version
  `RPT-CAB-2026-001` / `RPT-CAB-2026-001-V1` and preserve the current
  `EXECUTIVE_DIRECTOR_REVIEW` authority. Lead controls cannot approve, issue,
  sign, lock, or edit that immutable version.
- Added exact Audit assignment and checklist-question assignment flows for
  `AUD-2026-001` and `PKG-CAB-2026-001`. Question selection, filters, workload,
  local demo assignment effects, and visible status preserve exact question and
  Inspector subject IDs.
- Added Lead Analytics & Reports as an advisory-only workspace. It does not
  borrow Department Manager routes or authority and visibly disables undeclared
  record-specific risk-profile actions.
- Reused and role-projected Messages, Calendar, and Profile/Settings. Lead
  Calendar actions use declared Lead assignment routes, and undeclared records
  are disabled with an Audit-specific reason.
- Registered all twelve Task 5 components and added exact primary/contextual
  navigation labels and Task 5-owned styles.

## Strict TDD Evidence

### RED

Twelve direct-route/behavior tests were written before the new production
surfaces. The initial focused command was:

```text
npm --prefix apps/web test -- src/features/reports/lead-report-workspaces.test.tsx src/features/teams/lead-assignment-pages.test.tsx src/styles/style-ownership.test.ts
```

Result: 3 files failed, 17/17 tests failed. The twelve Task 5 routes/components
were missing and the new stylesheet ownership/import contract was absent.

The first wider regression run after implementation exposed two legitimate
contract regressions: the route registry still asserted the old implemented /
pending counts, and shared Profile copy no longer preserved the Inspector
workspace label. Result: 88/90 passed. Both were corrected without weakening
the route, role, or profile boundary.

After adding the visual contract header class, a focused run also exposed an
async assertion race: 42/43 passed and the immutable document test asserted its
backend-derived attribute before the backend view rendered. The test now waits
for the exact immutable version text before asserting the same attribute.

### GREEN

The final Task 5 plus relevant Lead/shared regression command was:

```text
npm --prefix apps/web test -- src/features/reports/lead-report-workspaces.test.tsx src/features/teams/lead-assignment-pages.test.tsx src/features/findings/lead-review-page.test.tsx src/features/caps/cap-review-page.test.tsx src/features/inspector/inspector-secondary-pages.test.tsx src/app/route-contracts.test.ts src/app/router.test.tsx src/ui/application-shell.test.tsx src/ui/role-navigation.test.tsx src/parity/legacy-screen-manifest.test.ts src/styles/style-ownership.test.ts tests/visual/visual-contract.test.ts
```

Result: 12 files passed, 86/86 tests passed.

## Verification

```text
Focused Task 5 + Lead/shared regressions: 12 files, 86/86 passed
Visual contract:                         13/13 passed
Typecheck:                               exit 0
build:demo:                              exit 0
Parity boundary:                        ok (86 routes, 2 build profiles)
Source-role / route-role equality:       passed in route/manifest contracts
Dual-profile / demo-only boundary:       exact 17 / 69 passed
Plan 2 blocked reason:                   exact string passed
git diff --check:                        exit 0
root index.html/css/js diff:              no output
process cleanup probe:                   no task-owned process found
```

The parity boundary and route-contract tests preserve the exact 17
`demo:http` routes, 69 demo-only routes, and exact blocked reason:

```text
HTTP capability is unavailable until Plan 2 activates this route.
```

`ui-audit-009` remains CAA Inspector-owned and `ui-audit-044` remains
Department Manager-owned. No Task 5 baseline, threshold, mask, semantic
fixture, or protected root-oracle source was changed.

## Complete Lead Visual Matrix

The required matrix was run from `apps/web` with the unchanged accepted
baselines and thresholds:

```text
AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=lead-home,lead-preliminary-reports,lead-preliminary-report-workflow,lead-final-reports,lead-final-report-readiness,lead-prepare-final-report,lead-final-report-document,lead-audit-assignment,lead-checklist-question-assignment,cap-review,lead-calendar,lead-messages,lead-analytics-reports,lead-settings npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity --reporter=dot
```

Literal result: 43 tests executed, 5 passed, 38 failed. Therefore the Task 5
visual gate is `not verified`, not 42/42 green.

The observed failure families were:

- decoded sidebar/content ratios above the accepted thresholds on multiple
  new Lead surfaces and viewports;
- the accepted Final Report semantic oracle still expects the legacy display
  identity `FR-2026-018`, while the route/backend contract requires the real
  immutable `RPT-CAB-2026-001` / `RPT-CAB-2026-001-V1` identity;
- the Calendar oracle expects the legacy short label
  `Fly Namibia · Cabin Inspection`, while the role-safe backend assignment
  projection exposes its canonical Audit title;
- after the first failures restarted the Playwright worker, many failure
  records also included the worker-local attachment-count assertion expecting
  all 42 pair attachments;
- the run identified 40px Task 5 action buttons. The production CSS was
  corrected once to a 44px minimum touch target and the focused/unit,
  typecheck, and build gates were rerun green. In accordance with the bounded
  visual instruction, the complete matrix was not run a second time.

No stale `FR-2026-018` label was added to a canonical `RPT-CAB-2026-001`
action, and no authority, backend identity, baseline, mask, or threshold was
weakened to manufacture a pass.

## Self-Review

- Lifecycle and authority: Lead preparation remains read-only at Executive
  Director Review; no Lead action calls report decision authority.
- Record identity: Audit, package, question, Inspector subject, Preliminary
  Report version, and Final Report version IDs are retained in navigation,
  rendered records, and visible local demo effects.
- Role separation: Lead routes use the Lead backend/shell. Calendar does not
  leak Inspector routes, Analytics does not route through Manager, and Messages
  keeps internal and Auditee-visible content structurally distinct.
- Responsive/visible actions: mobile hierarchy is represented in semantic DOM
  order, filters have visible effects, declared actions navigate or mutate
  visible demo state, and undeclared actions are disabled with record-specific
  reasons.
- Workspace hygiene: unrelated dirty-tree content was preserved; no protected
  root source or accepted visual artifact was edited in Task 5.

Commit disposition: skipped because commits are explicitly forbidden.

## Important Review Closure

The five Important review findings were addressed with a new strict-TDD cycle.

### Review RED

The focused review-correction command was:

```text
npm --prefix apps/web test -- src/ui/role-navigation.test.tsx src/ui/application-shell.test.tsx src/features/reports/lead-report-workspaces.test.tsx src/features/teams/lead-assignment-pages.test.tsx src/styles/style-ownership.test.ts
```

Initial result: 5 files failed, 9 failed / 29 passed (38 total). The failures
covered the missing exact Lead navigation targets, desktop/mobile shell
transitions, immutable Final Report journey, backend Finding identity and draft
remount, exact question-assignment persistence/filters, and the analytics
management hierarchy/responsive contracts.

### Review GREEN

After the production corrections, the same focused command passed 5 files,
38/38 tests. The broader relevant Lead/shared regression command passed 13
files, 101/101 tests. Typecheck, `build:demo`, `git diff --check`, and the
protected root-source diff all exited cleanly. The final process probe found no
task-owned Playwright, Vite, browser, or Vitest process.

The corrected behavior now preserves:

- exact desktop/mobile Lead navigation targets with one accessible active item;
- immutable Final Report list -> readiness -> preparation snapshot -> document
  access while Executive Director Review remains read-only;
- one real lifecycle Finding, `FND-CAB-2026-001`, across displayed workflow
  context and persisted Preliminary Report draft content/version;
- exact Audit, package, question, Inspector, Due Date, priority, and
  instructions across question-assignment save and React remount, with working
  department/risk/priority/status filters;
- a responsive Lead analytics management hierarchy exposing Current Owner,
  Next Action, Blocking Reason, management metrics, and advisory-only disabled
  drilldowns.

`CAB-2026-011` is not used by the corrected Task 5 workflow, and Lead report
preparation still does not invoke report decision authority.

### Bounded Visual Recheck

At the user's explicit direction not to enter a repeated pixel-adjustment loop,
the complete 43-pair Task 5 visual matrix was run once after the review fixes.
Literal result: 11 passed, 32 failed; the Task 5 visual gate remains
`not verified`.

The remaining failures include decoded-pixel deltas and unchanged accepted
semantic-oracle conflicts, including the legacy Final Report identity
`FR-2026-018` versus the truthful immutable backend identity
`RPT-CAB-2026-001`, and the Calendar legacy short label versus the canonical
Audit assignment title. No baseline, threshold, mask, semantic fixture, root
HTML/CSS/JavaScript oracle, authority boundary, or record identity was changed
to manufacture a pass.
