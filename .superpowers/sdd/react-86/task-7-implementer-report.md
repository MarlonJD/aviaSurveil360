# Task 7 Implementer Report

Date: 2026-07-22
Task: Department Manager Intelligence, Package, And Intake Workspaces
Disposition: functional implementation complete; bounded visual result recorded literally and not represented as green
Commit disposition: skipped because commits are explicitly forbidden

## Scope Delivered

Implemented and registered the twelve Task 7 surfaces:

- `manager-risk-dashboard`
- `manager-safety-intelligence`
- `organization-risk-profile`
- `manager-ssp-nasp`
- `manager-usoap-readiness`
- `manager-cap-effectiveness`
- `inspection-package-builder`
- `new-audit-wizard-1`
- `new-audit-wizard-2`
- `new-audit-wizard-3`
- `new-audit-wizard-4`
- `new-audit-wizard-5`

Risk Dashboard is now reachable through the accepted Department Manager
desktop/mobile primary navigation, with exactly one active primary item on the
six direct intelligence routes. Contextual links preserve exact Organization,
Finding, Planning, package, and version identities. Risk, Oversight Health,
SSP/NASP, USOAP, and CAP effectiveness language remains advisory and does not
make automatic legal, enforcement, certification, suspension, closure, or
compliance decisions. CAP acceptance remains distinct from Finding closure and
post-closure effectiveness monitoring.

Added optional demo-only typed `planningIntake` and `packageDrafts`
capabilities. They are required by `DemoBackend`, Manager-only, revisioned, and
idempotent. `HttpBackend` remains unchanged and no Plan 2 transport was
activated. Inspection Package draft saves never mutate immutable execution
package `PKG-CAB-2026-001`.

The five explicit wizard URLs render one Zod-validated, deterministic,
remount/restart-persistent draft `PLAN-DRAFT-2026-001`. Back, Next, direct load,
Save draft, Preview, and Submit operate on that one typed draft. Submission
creates exact Planning item `PLAN-2026-INTAKE-001`, never creates an executable
Audit, and navigates Audit Plan to the exact submitted record. A zero requested
budget still enters `FINANCE_REVIEW`, owned by Finance, with next action
`Finance to review budget and resources`.

Ad Hoc / Unannounced notice is derived by the backend as `WITHHELD`. Tests prove
the exact plan ID, title, purpose, risk category, and internal trigger remain
absent from Auditee DOM and Auditee JSON projections after a persistent runtime
restart.

## Strict TDD Evidence

### RED

Tests for all twelve route compositions, typed commands, deterministic
revision, package immutability, wizard validation/navigation/restart,
zero-budget Finance governance, and Auditee privacy were written before the
production UI/backend work.

```text
npm --prefix apps/web test -- src/features/risk/manager-risk-workspaces.test.tsx src/features/planning/new-audit-wizard.test.tsx tests/contract/mock-backend.test.ts
```

Result: 3 files failed; 26 expected failures / 14 passes. Failures were the
missing twelve route compositions and missing `planningIntake` / `packageDrafts`
commands; there was no harness/setup failure.

### GREEN

Initial focused Task 7, contract, navigation, and style run:

```text
npm test -- src/features/risk/manager-risk-workspaces.test.tsx src/features/planning/new-audit-wizard.test.tsx tests/contract/mock-backend.test.ts src/ui/role-navigation.test.tsx src/styles/style-ownership.test.ts
```

Result: 5 files passed; 57/57 tests passed.

Final focused run after the single visual-contract correction:

```text
npm test -- src/features/risk/manager-risk-workspaces.test.tsx src/features/planning/new-audit-wizard.test.tsx tests/contract/mock-backend.test.ts src/ui/role-navigation.test.tsx src/styles/style-ownership.test.ts src/app/route-contracts.test.ts src/features/planning/audit-plan-calendar-page.test.tsx
```

Result: 7 files passed; 68/68 tests passed.

Relevant Manager, Auditee, Finance, General Manager, route, ownership,
navigation, planning, scenario, mock-backend, and manifest regressions:

```text
npm test -- src/app/canonical-scenario.contract.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx src/features/caps/auditee-cap-page.test.tsx src/features/caps/auditee-projection.test.tsx src/features/findings/manager-dashboard-page.test.tsx src/features/inspector/inspector-route-ownership.test.ts src/features/management/manager-operational-pages.test.tsx src/features/planning/audit-plan-calendar-page.test.tsx src/features/planning/finance-review-page.test.tsx src/features/planning/general-manager-dashboard-page.test.tsx src/features/planning/new-audit-wizard.test.tsx src/features/risk/manager-risk-workspaces.test.tsx src/parity/legacy-screen-manifest.test.ts src/ui/role-navigation.test.tsx src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
```

Result: 17 files passed; 123/123 tests passed.

## Responsive Browser Contract

A real Chromium contract exercises the desktop/tablet/mobile Manager shell,
sole active Risk navigation, Risk → Safety Intelligence → exact Organization
route transitions, filters, viewport-bound actions, wizard Back/Next,
persistent reload, zero-budget unannounced submission, exact Audit Plan
selection, and typed Inspection Package save.

```text
AVIA_E2E_PROFILE=visual-parity npx playwright test tests/e2e/manager-intelligence-responsive-contract.spec.ts --project=mock
```

Result: 3/3 passed at 1440x900, 1024x768, and 390x844.

## Bounded Visual Matrix

One complete matrix was run after functional GREEN. It covered the twelve Task
7 surfaces at all three accepted viewports, plus the primitive gallery:

```text
AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=manager-risk-dashboard,manager-safety-intelligence,organization-risk-profile,manager-ssp-nasp,manager-usoap-readiness,manager-cap-effectiveness,inspection-package-builder,new-audit-wizard-1,new-audit-wizard-2,new-audit-wizard-3,new-audit-wizard-4,new-audit-wizard-5 npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity
```

Literal result: primitive gallery passed; Task 7 route/viewport comparisons
passed 0/36 (`1 passed / 36 failed` overall). The decoded failures are dominated
by accepted sidebar/content pixel-ratio deviations. The complete run also
identified three real, non-pixel contract gaps: the wizard header lacked the
common `workbench-page-header` class, Safety Intelligence lacked the exact
`Management attention` semantic marker, and the CAP effectiveness Finding link
was below the 44px touch-target height. One source-faithful correction fixed
those three items. Per the explicit bounded visual rule, the 36-pair matrix was
not rerun; the post-correction visual state is therefore literally **not
reverified**. No baseline, mask, threshold, semantic oracle, protected root
HTML/CSS/JavaScript, or accepted artifact was changed to manufacture a pass.

## Verification

```text
Focused Task 7 suite after correction:       7 files, 68/68 passed
Relevant role/lifecycle regressions:        17 files, 123/123 passed
Responsive Chromium interaction contract:   3/3 passed
Visual contract + manifest:                  2 files, 17/17 passed
Parity boundary:                            ok (86 routes, 2 build profiles)
Typecheck:                                  exit 0
build:demo:                                 exit 0
Source-role / route-role equality:          passed in route/manifest contracts
Dual-profile / demo-only boundary:          exact 17 / 69 passed
Plan 2 blocked reason:                      exact string passed
Bounded Task 7 visual matrix:               0/36 route pairs; primitive passed
Post-correction visual state:               not reverified
git diff --check:                           exit 0
root index.html/css/js diff:                no output
process cleanup probe:                      no Playwright/Vite/Vitest/test browser process found
```

`ui-audit-009` remains CAA Inspector-owned. `ui-audit-044` remains Department
Manager-owned. The exact Plan 2 blocked reason remains:

```text
HTTP capability is unavailable until Plan 2 activates this route.
```

## Existing Executive Regression Observed

The broader command was also run once with
`src/features/reports/executive-dashboard-page.test.tsx`. Its report-issue test
failed because canonical `RPT-CAB-2026-001-V1.findingIds` is empty while the
test creates `FND-CAB-2026-001`; the page consequently renders `Finding not in
current projection`. The other 125 tests in that command passed. Task 7 did not
change report-version composition or Executive report behavior, so this
unrelated Task 8/earlier-fixture mismatch was recorded rather than repaired by
mutating an immutable report version from the Task 7 scope.

## Self-Review

- Identity: draft, Planning item, Organization, Finding, package, package
  version, and immutable execution package IDs remain exact.
- Governance: Finance remains mandatory at zero budget. Submission creates a
  Planning item only and preserves Department Manager → Finance Review →
  General Manager → Executive Director → General Manager Release.
- Privacy: withheld notice and internal intake content do not enter Auditee DOM
  or JSON projections, including after restart.
- Authority: the new demo commands are Manager-only. CAP acceptance does not
  close a Finding, and indicator pages do not make automatic decisions.
- Actions: visible actions use typed demo capabilities, exact routes, durable
  draft state, or an exact record-specific disabled reason.
- Profiles: `planningIntake` and `packageDrafts` are optional on `Backend`; the
  HTTP profile and Plan 2 boundary were not expanded.
- Workspace: unrelated dirty content was preserved. No commit, stage, branch,
  push, deployment, Git initialization, Plan 2 work, production-infrastructure
  change, lifecycle tracker edit, accepted-baseline change, or root-oracle
  change was made.

## Independent-Review Correction Wave — 2026-07-23

### Review RED

Added focused tests before the correction implementation for the five
Important review findings: the complete Risk Dashboard hierarchy and four
filters, CSV/reset/no-match behavior, declared/disabled Organization actions,
Organization-scoped Findings Review, open/closed/Evidence-verified CAP
effectiveness eligibility with exact identities, raw blank-versus-zero budget
validation, and the twelve-route responsive control/overflow contract.

```text
npx vitest run src/features/risk/manager-risk-workspaces.test.tsx src/features/planning/new-audit-wizard.test.tsx src/features/management/manager-operational-pages.test.tsx
```

RED result: exit 1; 10 expected failures / 43 passes. The failures were the
missing review requirements, not a harness failure.

The bounded 1440px responsive browser RED was also run before production
changes:

```text
npx playwright test tests/e2e/manager-intelligence-responsive-contract.spec.ts --project=mock --grep "1440px"
```

RED result: exit 1; SSP/NASP had no visible page control. The first sandboxed
attempt could not bind the local Vite port; the approved local-server rerun
reached Chromium and produced the intended product failure.

### Review Corrections

- Added typed, Manager-authorized, read-only `RiskManagementProjectionView`
  and `risk.getManagementProjection` output. Finding risk bands map directly
  from typed severity (`Level 1 -> High`, `Level 2 -> Medium`, `Level 3 ->
  Low`, `Observation -> Very Low`); no numerical health score is fabricated.
- Restored four working Risk Dashboard filters, Reset, derived CSV export, six
  KPIs, risk distribution/trend, a 5x5 intentionally unscored likelihood ×
  impact matrix, top-area and department-unavailable disclosures, overdue CAP
  summary, exact recent Finding rows, and a no-match state.
- Kept Fly Namibia as the only declared Organization risk-profile route.
  SkyCargo now has a disabled action with the exact Organization-specific
  reason. Findings Review consumes and enforces `organizationId` together with
  `findingId`.
- CAP Effectiveness now projects the real latest CAP revision and real Finding
  closure basis. Open records show the exact ineligibility reason; closed
  `AUTHORIZED` and `EVIDENCE_VERIFIED` records remain pending a separate typed
  post-closure verification record. No root-cause quality, recurrence result,
  or monitoring evidence is invented.
- The Planning intake keeps Requested Budget as a raw string through Zod.
  Blank is invalid with `Requested budget is required`; literal `0` remains a
  valid numeric command value and still enters Finance Review.
- The responsive contract now direct-loads all twelve Task 7 routes at
  1440x900, 1024x768, and 390x844, checks a visible control and document-width
  overflow for every route, exercises filters/reset/export and the SSP/NASP,
  USOAP, and CAP Effectiveness controls, and retains the existing governed
  Planning/package interaction flow. Bounding boxes use rendered whole CSS
  pixels only, limiting tolerance to subpixel rounding below one CSS pixel;
  overflow and visibility assertions were not broadened.

### Review GREEN And Verification

```text
Focused review-fix functional suite:       3 files, 55/55 passed
Relevant Task 7/role regressions:          17 files, 130/130 passed
Responsive Chromium contract:              3/3 passed
Visual contract + manifest:                2 files, 17/17 passed
Typecheck:                                 exit 0
build:demo:                                exit 0
Parity boundary:                           ok (86 routes, 2 build profiles)
Source-role / route-role equality:         passed
Dual-profile / demo-only boundary:         exact 17 / 69 passed
Plan 2 blocked reason:                     exact string passed
git diff --check:                          exit 0, no output
root index.html/css/js diff:               no output
process cleanup probe:                     no Playwright/Vite/Vitest/test browser process found
```

The Task 7 decoded-pixel matrix was deliberately not rerun in this correction
wave, per the explicit bounded visual direction. Its recorded state remains
literally `not reverified`; no accepted baseline, decoded-pixel threshold,
mask, semantic oracle, or protected root HTML/CSS/JavaScript changed.
