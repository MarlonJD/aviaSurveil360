# Task 9 Implementer Report

## Status

Task 9 implementation is functionally GREEN and ready for independent review.
All eight Auditee routes pass the focused privacy/identity/action contracts and
the real-browser desktop, tablet, and mobile contract.

The one permitted bounded decoded-pixel matrix was run. Its primitive gallery
passed, but the matrix was not all green. The final reporter count is not
recoverable: the execution output stream ended after the test cases had been
listed, and the shared `test-results/.last-run.json` was subsequently replaced
by a separate marker-preflight run. The observed failures included accepted
stale-oracle semantic conflicts and bounded pixel residuals, recorded below.
The matrix was not rerun and no pixel-only correction loop was entered, in
accordance with the user's explicit direction.

No commit, staging, branch operation, push, deployment, production
infrastructure change, Plan 2 work, baseline replacement, or lifecycle-tracker
edit was performed.

## Implemented Scope

Implemented and registered the seven new Task 9 surfaces while preserving the
existing Auditee CAP workspace:

- `/auditee/service-provider-cap`
- `/auditee/inspection-coordination`
- `/auditee/preliminary-reports`
- `/auditee/final-reports`
- `/auditee/reports/RPT-CAB-2026-001`
- `/auditee/messages`
- `/auditee/documents`
- `/auditee/settings`

The implementation also:

- makes all eight routes reachable through Auditee-correct desktop and mobile
  navigation with exactly one accessible active primary item;
- adds typed `auditeeCoordination` and `auditeeReports` demo-only capabilities
  and adds them to the explicit capability permission matrix;
- scopes every Auditee projection and mutation to exact organization
  `ORG-FLY-NAMIBIA` and subject `USR-AUDITEE-FLY`;
- exposes Inspection Coordination only for the own-organization released
  Routine/Announced assignment and derives the proposed date from exact
  `AssignmentSummary.scheduledStartDate` (`2026-06-15`);
- persists revision-checked, idempotent Confirm Proposed Date and Propose
  Alternative Date mutations in the shared mock store; an alternative remains
  pending CAA acceptance;
- exposes Preliminary and Final reports only after exact `LOCKED` release
  through the Manager → General Manager → Executive Director chain;
- maps report data through an Auditee-safe whitelist that omits `contentHash`
  and other internal fields;
- keeps the exact Preliminary version in its local in-page preview and keeps the
  Final contextual route bound to exact `RPT-CAB-2026-001-V1`;
- displays `Not configured` and `No CAA-visible comment recorded` from typed
  public report fields rather than copying legacy values;
- renders the Final Report's empty `findingIds` as an explicit unavailable
  relationship and never infers a Finding from the Audit;
- limits Documents to own-organization released report versions and exact
  Evidence version/public-review metadata, with direct unsafe reads denied;
- keeps every download bound to the visible immutable record and browser-local
  demo filename;
- exposes only Auditee-visible inbound communications and the Auditee's own
  safe outbound direction, without internal sender subject IDs or CAA-private
  visibility controls;
- persists subject-scoped profile changes across remount and keeps undeclared
  notification preferences visibly read-only; and
- preserves the existing CAP authority and privacy behavior, including CAP
  acceptance not being Finding closure and immutable Evidence versions.

## RED Evidence

The focused Task 9 suite was written and run before production changes:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx
```

Result: 1 file failed; 7/7 tests failed for the intended missing routes,
missing typed capabilities, unsafe document/message projections, report stage
visibility, coordination behavior, and settings persistence. There was no
harness or syntax failure.

The first real-browser responsive run established an additional production RED:
Auditee CAP filters were only 40px high at the accepted viewports. After the
44px correction, deterministic visual seeding exposed persisted operation-ID
payload drift; the visual seed was made presence-aware instead of replaying a
different payload under an existing idempotency key.

## GREEN Evidence

Focused Task 9 tests:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx
```

Result: 1 file passed; 7/7 tests passed.

Final focused mock capability/privacy regression:

```text
npm test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
```

Result: 2 files passed; 23/23 tests passed.

Final relevant Auditee, CAP, Manager/GM/Executive report, canonical scenario,
route, navigation, mock-backend, style ownership, visual-contract, and manifest
regression suite:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx src/features/caps/auditee-cap-page.test.tsx src/features/caps/auditee-projection.test.tsx src/app/canonical-scenario.contract.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx src/features/inspector/inspector-route-ownership.test.ts src/features/management/executive-workspaces.test.tsx src/features/reports/executive-dashboard-page.test.tsx src/features/reports/lead-report-workspaces.test.tsx src/features/reports/report-preview-page.test.tsx src/features/planning/audit-plan-calendar-page.test.tsx src/features/planning/finance-review-page.test.tsx src/features/planning/general-manager-dashboard-page.test.tsx src/features/planning/new-audit-wizard.test.tsx src/features/risk/manager-risk-workspaces.test.tsx src/mock/full-screen-scenario.test.ts src/parity/legacy-screen-manifest.test.ts src/styles/style-ownership.test.ts src/ui/application-shell.test.tsx src/ui/role-navigation.test.tsx tests/contract/mock-backend.test.ts tests/visual/visual-contract.test.ts
```

Result: 23 files passed; 165/165 tests passed.

## Responsive Browser Contract

The Chromium contract direct-loads all eight Auditee routes at desktop, tablet,
and mobile widths; verifies exactly one active navigation item, mobile drawer
transitions, filters, 44px visible enabled controls, no critical overflow,
coordination mutation/remount, report release and exact identity, Preliminary
local preview, Final section jumps/download, message send/remount, document
identity/download, settings remount, and forbidden DOM absence.

```text
AVIA_E2E_PROFILE=visual-parity npx playwright test tests/e2e/auditee-responsive-contract.spec.ts --project=mock
```

Final literal result: `3 passed (35.3s)` at 1440×900, 1024×768, and 390×844.

## Bounded Visual Matrix

The single permitted complete Task 9 matrix was launched after functional
GREEN, covering eight Auditee surfaces at three viewports plus the primitive
gallery:

```text
AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=auditee-home,auditee-inspection-coordination,auditee-preliminary-reports,auditee-final-reports,auditee-report-preview,auditee-messages,auditee-documents,auditee-settings npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity
```

The literal final route-pair count is unavailable for the reason stated in
Status. The observed evidence before reporter detachment was:

- primitive gallery passed;
- desktop Inspection Coordination, Preliminary Reports, Final Reports, and
  Messages passed;
- Auditee Home failed the stale legacy semantic marker `CAB-2026-011` while the
  typed canonical record truthfully renders `CAB-2026-001`;
- Final Report preview failed a bounded sidebar pixel residual and the stale
  legacy semantic identity `FR-2025-009` while Task 9 requires exact
  `RPT-CAB-2026-001`;
- Documents failed a bounded desktop content residual; and
- Settings failed a stale legacy `Privacy boundary` semantic expectation.

No accepted baseline, decoded-pixel threshold, mask, semantic oracle, or root
HTML/CSS/JavaScript artifact was changed to manufacture parity. The matrix was
not rerun; its final decoded-pixel status is therefore literally **failed with
exact final count unavailable**, not verified green.

## Final Verification

```text
Focused Task 9 suite:                       7/7 passed
Focused mock capability/privacy suite:      23/23 passed
Relevant regression suite:                  23 files, 165/165 passed
Responsive Chromium interaction contract:   3/3 passed
Visual contract + manifest:                  passed within the 165-test suite
Typecheck:                                   exit 0
build:demo:                                  exit 0
Parity boundary:                            ok (86 routes, 2 build profiles)
Source-role / route-role equality:           passed
Dual-profile / demo-only boundary:           exact 17 / 69 passed
Plan 2 blocked reason:                       exact string passed
Bounded Task 9 visual matrix:                failed; exact final count unavailable
Primitive gallery:                          passed
git diff --check:                            exit 0, no output
Root index.html/css/js diff:                 exit 0, no output
Process cleanup probe:                       no Playwright, Vite, Vitest, or test browser process found
```

`ui-audit-009` remains CAA Inspector-owned and `ui-audit-044` remains
Department Manager-owned. Exact source-role/route-role equality, the 17
dual-profile / 69 demo-only boundary, and the Plan 2 blocked reason remain
unchanged.

## Independent Review Correction Wave

A fresh Task 9 review returned four Important findings. They were corrected in
a new strict RED/GREEN cycle without rerunning the decoded-pixel matrix or
changing accepted baselines, thresholds, masks, the semantic oracle, or root
prototype assets.

Correction RED, before production edits:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx
```

Result: 1 file failed; 5 failed / 7 passed. The five intended failing tests
produced six assertion failures and demonstrated:

- legacy `assignments.list` and `reports.getVersion` fulfilled for Auditee while
  `planning.list` correctly denied;
- the Auditee Calendar serialized the CAA-only `Continue Cabin Inspection
  checklist` next action;
- Documents admitted three invalid same-organization `LOCKED` candidates:
  missing public metadata, missing `issuedAt`, and a foreign-organization linked
  Finding;
- an older schema-v1 persisted envelope missing Task 9 fields crashed
  Coordination hydration;
- malformed direction/audience communication pairs were readable; and
- noncanonical Final Report identities, including canonical report ID with V2,
  linked to the hardcoded V1 contextual route.

Implemented corrections:

- Auditee is now denied the legacy assignment and full report-version APIs;
  Planning remains fail-closed under its existing role guard.
- Auditee Calendar list/direct reads use the explicit Auditee coordination next
  action and exact scheduled start date instead of internal assignment fields.
- Auditee Reports and Documents now share one release predicate: exact
  organization, `LOCKED`, non-null `issuedAt`, typed public metadata, and every
  explicitly linked Finding independently in organization scope. Invalid list
  candidates are omitted without crashing; direct reads return a generic denial.
- Persisted mock envelopes now migrate schema v1 to schema v2 by hydrating
  canonical defaults for newly required fields while preserving user state.
  Legacy operation-response caches are dropped during migration, and the
  migrated envelope is immediately rewritten as schema v2.
- Auditee communication reads require consistent public pairs:
  `CAA_TO_AUDITEE` with audience `AUDITEE`, or own-subject
  `AUDITEE_TO_CAA` with audience `CAA`. Internal and malformed same-organization
  records remain absent from the safe projection.
- The Final Report contextual link requires both exact
  `RPT-CAB-2026-001` and `RPT-CAB-2026-001-V1`. Every other released Final row
  is visibly disabled on desktop and mobile with its exact version ID and a
  record-specific reason.
- The alternative coordination date is visibly rendered, and the browser
  contract now proposes `2026-06-22`, reloads, and verifies
  `ALTERNATIVE_PROPOSED` persistence at all three widths.

Correction focused GREEN:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx
```

Result: 1 file passed; 12/12 tests passed.

Correction relevant regression GREEN:

```text
npm test -- src/features/auditee/auditee-secondary-pages.test.tsx src/features/caps/auditee-cap-page.test.tsx src/features/caps/auditee-projection.test.tsx src/app/canonical-scenario.contract.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx src/features/inspector/inspector-route-ownership.test.ts src/features/management/executive-workspaces.test.tsx src/features/reports/executive-dashboard-page.test.tsx src/features/reports/lead-report-workspaces.test.tsx src/features/reports/report-preview-page.test.tsx src/features/planning/audit-plan-calendar-page.test.tsx src/features/planning/finance-review-page.test.tsx src/features/planning/general-manager-dashboard-page.test.tsx src/features/planning/new-audit-wizard.test.tsx src/features/risk/manager-risk-workspaces.test.tsx src/mock/full-screen-scenario.test.ts src/parity/legacy-screen-manifest.test.ts src/styles/style-ownership.test.ts src/ui/application-shell.test.tsx src/ui/role-navigation.test.tsx tests/contract/mock-backend.test.ts tests/visual/visual-contract.test.ts
```

Result: 23 files passed; 170/170 tests passed.

Correction browser and final gates:

```text
Responsive Chromium interaction contract: 3 passed (37.7s)
Typecheck:                               exit 0
build:demo:                              exit 0
Parity boundary:                        ok (86 routes, 2 build profiles)
Source-role / route-role equality:       passed
Dual-profile / demo-only boundary:       exact 17 / 69 passed
Plan 2 blocked reason:                   exact string passed
Root index.html/css/js diff:             exit 0, no output
git diff --check:                        exit 0, no output
Process cleanup probe:                   no Playwright, Vite, Vitest, or test browser process found
```

The decoded-pixel matrix was not rerun during this correction wave.

## Commit Disposition

Skipped. Commits and staging are explicitly forbidden for this migration run.
