# Task 6 Implementer Report

Date: 2026-07-22
Task: Department Manager Operational Workspaces
Disposition: implementation and functional gates green; bounded visual result recorded literally
Commit disposition: skipped because commits are explicitly forbidden

## Scope Delivered

Implemented the eight Task 6 workspaces and registered their exact route
contracts:

- `manager-audits`
- `manager-inspection-team`
- `manager-findings-review`
- `manager-cap-monitoring`
- `manager-checklist-management`
- `organization-detail`
- `manager-preliminary-report-review`
- `manager-cap-closure-review`

Corrected `ui-audit-044` as a Department Manager-owned Inspection Evidence
projection. Its contextual parent is `manager-findings-review`, which is the
sole active primary navigation item on direct Inspection Evidence loads. The
temporary standalone Manager Evidence Review primary item was removed. Lead
CAP review remains Lead-owned and Manager `caps.review` remains denied.

The Manager operational pages load typed mock-backend records, preserve exact
Audit/Finding/CAP/Evidence/report identities and immutable histories, and
either execute declared commands or disable undeclared actions with an exact
record-specific reason. Checklist configuration is read-only through
`inspections.getPackage`; no Manager configuration mutation was invented.

The canonical mock now appends Go-aligned audit events for the three Task 6
decisions:

- `evidence.reviewed`, entity `finding`, with Finding before/after status and
  `Comment to Auditee` as the audit reason
- `finding.authorized_closure`, entity `finding`
- `report.decision_recorded`, entity `report_version`

Evidence review now rejects a second decision after the exact latest Evidence
version leaves `PENDING_CAA_REVIEW`. Partial Close and Not Close keep the
Finding open. The Department Manager report action operates only on the real
`PR-2026-018-V1` `DEPARTMENT_REVIEW` fixture; immutable returned V0 and its
recorded return reason remain visible.

## Strict TDD Evidence

### Initial RED

```text
npm --prefix apps/web test -- src/features/management/manager-operational-pages.test.tsx src/features/evidence/evidence-review-page.test.tsx src/styles/style-ownership.test.ts
```

Result: 3 files failed, 25 failed / 1 passed (26 total). The new routes were
still pending, the Manager Inspection Evidence test id was absent, and the
Task 6 stylesheet/import was absent.

### Final-adjudication RED

After aligning tests with Go audit vocabulary, exact
`EV-CAB-2026-001-V2`, and the sole Findings Review parent navigation:

```text
npm --prefix apps/web test -- src/features/management/manager-operational-pages.test.tsx src/features/evidence/evidence-review-page.test.tsx src/ui/role-navigation.test.tsx src/app/router.test.tsx -t "ui-audit-044|Manager Inspection Evidence|records Manager not-close|records exact partial-close"
```

Result: 4 files failed, 5 failed / 1 passed / 32 skipped. Failures proved the
missing parent navigation, missing page marker, and missing canonical audit
event before production changes.

### GREEN

Focused Task 6, route, navigation, and style suite:

```text
npm --prefix apps/web test -- src/features/management/manager-operational-pages.test.tsx src/features/evidence/evidence-review-page.test.tsx src/ui/role-navigation.test.tsx src/app/router.test.tsx src/styles/style-ownership.test.ts
```

Result: 5 files passed, 44/44 tests passed.

Relevant Manager, Lead, Inspector/Auditee lifecycle, route, registry, visual
fixture, and style regressions:

```text
npm --prefix apps/web test -- src/features/management/manager-operational-pages.test.tsx src/features/evidence/evidence-review-page.test.tsx src/features/findings/manager-dashboard-page.test.tsx src/features/reports/report-preview-page.test.tsx src/features/organizations/organization-registry-page.test.tsx src/features/caps/cap-review-page.test.tsx src/features/caps/auditee-cap-page.test.tsx src/app/canonical-scenario.contract.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx src/ui/role-navigation.test.tsx src/styles/style-ownership.test.ts src/mock/full-screen-scenario.test.ts
```

Result: 13 files passed, 74/74 tests passed.

## Responsive Browser Contract

A bounded real-Chromium contract exercises the Manager drawer/shell,
Findings Review parent navigation, Audits and Inspection Evidence route
transitions, visible filters, and unclipped record actions at the three exact
viewports.

```text
AVIA_E2E_PROFILE=visual-parity npx playwright test tests/e2e/manager-responsive-contract.spec.ts --project=mock
```

Result: 3/3 passed at 1440x900, 1024x768, and 390x844.

## Bounded Visual Matrix

One complete bounded matrix was run after functional GREEN, covering the eight
new workspaces, corrected Inspection Evidence, and the four existing Manager
surfaces at all three accepted viewports, plus the primitive gallery:

```text
AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=manager-home,audit-plan,manager-audits,report-preview,manager-inspection-team,manager-findings-review,manager-cap-monitoring,manager-checklist-management,organization-registry,organization-detail,evidence-review,manager-preliminary-report-review,manager-cap-closure-review npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity
```

Literal result: 10 passed / 30 failed (40 total). The primitive gallery and
all nine manager-home/audit-plan/organization-registry viewport pairs passed.
The remaining failures include accepted-oracle semantic identities that do not
match the canonical typed runtime (`CAB-2026-011`, `RAMP-2026-005`, and a
`PR-2026-018` marker on the separate final-report surface), as well as decoded
pixel differences. A single source-faithful non-pixel correction pass added the
common workbench header class and direct canonical visual seeding for
Findings/CAP/Evidence/Closure/Organization routes. Per the bounded no-pixel-loop
instruction, the matrix was not repeated. No baseline, mask, decoded-pixel
threshold, semantic fixture, root oracle, or accepted artifact was changed to
manufacture a pass.

## Verification

```text
Focused Task 6 suite:                    5 files, 44/44 passed
Relevant lifecycle/role regressions:    13 files, 74/74 passed
Responsive Chromium contract:           3/3 passed
Visual contract + manifest:              2 files, 17/17 passed
Parity boundary:                        4/4 passed
Typecheck:                               exit 0
build:demo:                              exit 0
Source-role / route-role equality:       passed in route/manifest contracts
Dual-profile / demo-only boundary:       exact 17 / 69 passed
Plan 2 blocked reason:                   exact string passed
Bounded Manager visual matrix:           10/40 passed; residual recorded above
git diff --check:                        exit 0
root index.html/css/js diff:             no output
process cleanup probe:                   no Playwright/Vite/Vitest/browser process found
```

`ui-audit-009` remains CAA Inspector-owned. `ui-audit-044` remains Department
Manager-owned. The exact Plan 2 blocked reason remains:

```text
HTTP capability is unavailable until Plan 2 activates this route.
```

## Authority And Documentation Note

`docs/product-specs/STATUS_PERMISSION_SECURITY.md` still contains an older
Manager Evidence-review `No` row. Current mock/Go authority and the explicit
Task 6 adjudication require Manager authority on Manager-owned `ui-audit-044`.
The product document was treated as drift and was not edited because Task 6
forbids product-document and Plan 2 expansion.

## Self-Review

- Authority: Manager never calls `caps.review`; Lead/Inspector review authority
  is retained, while `ui-audit-044` uses the Manager shell/backend and exact
  `evidence.review` command.
- Lifecycle: CAP acceptance does not close a Finding. Partial and Not Close
  remain open. Explicit Manager authorized closure is separate and audit-logged.
- Identity: actions preserve exact record/revision/version identity; no
  `EVD-CAB-2026-001-V2` alias was invented. The canonical lifecycle ID is
  `EV-CAB-2026-001-V2`.
- Privacy: `Comment to Auditee` and `Internal CAA Note` remain separate inputs;
  only the public comment is used as the canonical Evidence audit reason.
- Responsive behavior: real-browser drawer, route, control, and action bounds
  pass at desktop/tablet/mobile sizes.
- Workspace: unrelated dirty content was preserved; no commit, stage, branch,
  push, deploy, Git initialization, Plan 2 work, or production-infrastructure
  change was performed.

## Review-Correction Wave

The fresh Task 6 review returned five Important findings. They were addressed
in one strict TDD wave without changing route ownership, the 17/69 capability
boundary, the protected root oracle, accepted baselines, masks, or decoded
pixel thresholds.

### Review RED

The correction tests were written before the production changes and run with:

```text
npx vitest run src/features/findings/manager-dashboard-page.test.tsx src/features/organizations/organization-registry-page.test.tsx src/features/management/manager-operational-pages.test.tsx src/features/evidence/evidence-review-page.test.tsx
```

Literal result: 4 files failed; 10 failed / 19 passed (29 total). The failures
proved the stale Manager dashboard routes, missing exact Organization child
action, missing Audit query/typed owner, person-based Inspection Team page,
missing exact Finding query handoff, latest-only Evidence UI, and absent audit
actor/revision fields.

Two focused follow-up RED checks were added before their production changes:

- `report-preview-page.test.tsx`: 1 failed / 1 passed, proving the missing exact
  `PR-2026-018` link and record-specific disabled final-report review.
- `role-navigation.test.tsx -t "derives primary navigation"`: 1 failed / 8
  skipped, proving that the Manager Reports Approval shell link still targeted
  the final-report preview instead of `PR-2026-018`.

### Review Corrections Delivered

- All live Task 6 dashboard cards and the Manager Reports Approval navigation
  now reach exact registered routes. Reports Approval targets
  `/department-manager/preliminary-reports/PR-2026-018` while preserving the
  final-report route as a separate direct-load surface.
- The Organization register links `ORG-FLY-NAMIBIA` to its exact child route;
  unsupported `ORG-SKYCARGO` child navigation is disabled with its exact ID and
  reason. Organization Finding actions carry `findingId`, and Findings Review
  honors the requested exact Finding.
- Audit summaries now expose a typed scheduled start, current owner ID, role,
  and display name. Scheduled/in-progress fixtures remain Inspector-owned; the
  Manager page no longer hardcodes Manager ownership and honors exact
  `auditId` query selection.
- Inspection Team is now a Manager-scoped typed Audit-team register/dossier,
  including exact Audit and organization IDs, schedule, Lead Inspector,
  assigned Inspectors, question assignments, documents, and history. Exact
  Audit navigation is real; undeclared team mutation is disabled with an
  Audit-specific reason.
- Evidence review now has explicit immutable version selection. Historical
  versions are read-only, and only the exact latest `CLEAN` /
  `PENDING_CAA_REVIEW` version is eligible. Counters, owner, next action, and
  status derive from canonical records. Disabled reasons identify the exact
  version, and operation IDs include version ID, revision, and decision.
  Tests cover selecting V1, disabling after a decision, and recording the same
  decision independently on a later V3.
- `AuditEventView` now carries `actorSubjectId` and `entityRevision`.
  `evidence.reviewed`, `finding.authorized_closure`, and
  `report.decision_recorded` use the acting principal and post-command entity
  revision. Live Manager RETURN and FORWARD branches assert
  `USR-MANAGER-NORA` and revision `2`.

### Review GREEN And Gates

```text
Correction-focused suite:                 4 files, 29/29 passed
Reports Approval + navigation suite:      2 files, 11/11 passed
Relevant lifecycle/role regressions:     13 files, 78/78 passed
Responsive Chromium contract:             3/3 passed at 1440/1024/390
Typecheck:                                 exit 0
build:demo:                                exit 0
Visual contract + manifest:               2 files, 17/17 passed
Parity boundary:                          4/4 passed
git diff --check:                          exit 0
root index.html/css/js diff:               no output
process cleanup probe:                     no matching process
```

The first responsive run passed mobile and exposed two sub-pixel scroll-edge
overflows at desktop/tablet (`0.0625px` and `0.4375px`). Production CSS gained
a bounded action `scroll-margin-block`; no assertion, baseline, mask, or
threshold was weakened. The next complete responsive run passed 3/3.

Per the user's explicit no-pixel-loop direction, the bounded Manager decoded-
pixel matrix was not rerun. Its earlier literal `10/40` result remains the
recorded visual status and is not represented as green.
