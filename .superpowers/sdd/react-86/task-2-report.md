# Task 2 Report — Demo Backend Capability Contract

## Scope

Implemented only the Task 2 mock/backend contract surface. No branch, commit,
push, deploy, production capability, or Plan 2 work was performed.

## Files changed

- `apps/web/src/backend/backend.ts`
- `apps/web/src/mock/create-mock-backend.ts`
- `apps/web/src/mock/mock-engine.ts`
- `apps/web/src/mock/seed-data.ts`
- `apps/web/src/mock/full-screen-scenario.test.ts`
- `apps/web/tests/contract/mock-backend.test.ts`

## RED evidence

Command:

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
```

Result: failed as intended before implementation. The new full-screen scenario
reported `Cannot read properties of undefined (reading 'getScreenProjection')`,
because `administration` and the other composed demo capabilities did not yet
exist. The existing canonical mock contract remained green (14 tests).

## GREEN evidence

Commands:

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
npm --prefix apps/web run typecheck
git diff --check -- apps/web/src/backend/backend.ts apps/web/src/mock/create-mock-backend.ts apps/web/src/mock/mock-engine.ts apps/web/src/mock/seed-data.ts apps/web/src/mock/full-screen-scenario.test.ts apps/web/tests/contract/mock-backend.test.ts
```

Results:

- Focused tests: `2 passed`, `17 passed`.
- TypeScript typecheck: passed.
- Diff whitespace check: passed.
- The existing canonical lifecycle suite is included in the focused mock
  contract file and remains green (`14` canonical tests).

## Contract delivered

- Added deterministic mock-only composed capabilities: `communications`,
  `calendar`, `profiles`, `teams`, `risk`, `documents`, `notifications`,
  `administration`, and `assistantDrafts`.
- Added a deterministic 86-screen projection seed derived from the frozen route
  contract, with exact direct-ID, empty, denied, returned, overdue, and
  version-history states.
- Canonical-state-changing composed commands require both `expectedRevision`
  and `idempotencyKey`; profiles, notifications, and communications verify
  revision/idempotency behavior.
- Queries return cloned immutable projections through `MemoryMockStore`.
- Auditee filters are organization-scoped; Auditee communications omit CAA-only
  messages and team access is denied. No new Finding, CAP, or Evidence store
  was introduced; documents and projections reference the existing canonical
  records.
- Assistant output is deterministic advisory text only; it cannot create a
  Finding, set severity, or close work.

## Residual concern

The shared `Backend` declares these capabilities as demo-boundary optional so
the existing HTTP implementation does not gain mock fallbacks or pretend that
Plan 2 has activated them. `DemoBackend` makes all nine capabilities required
for `createMockBackend`. This preserves the explicit demo-only/HTTP-disabled
boundary until Plan 2.

## Change control

No commit was created, per user instruction.

## Independent review corrections

### RED evidence

The focused command was rerun after adding review tests before the fixes:

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
```

It failed as intended because `visibleActions` and
`administration.invokeVisibleAction` were absent, and Auditee risk access still
resolved instead of being denied. These failures established the action matrix
and privacy fixes before implementation.

### GREEN evidence

Commands:

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
npm --prefix apps/web test -- tests/contract/mock-backend.test.ts
npm --prefix apps/web run typecheck
git diff --check -- apps/web/src/backend/backend.ts apps/web/src/mock/create-mock-backend.ts apps/web/src/mock/mock-engine.ts apps/web/src/mock/seed-data.ts apps/web/src/mock/full-screen-scenario.test.ts apps/web/tests/contract/mock-backend.test.ts
```

Results:

- Full focused suite: `2 passed`, `20 passed`.
- Canonical mock lifecycle contract: `1 passed`, `15 passed`.
- TypeScript typecheck: passed.
- Scoped diff whitespace check: passed.

### Corrections delivered

- Every one of the 86 route projections has a source-faithful typed visible
  action (for example `continue-checklist`, `review-cap`, `review-evidence`,
  `open-report`, `draft-advisory`, or the applicable workspace action). The
  test invokes every declared action through a role-safe administration command
  and expects a deterministic completed result.
- All nine capabilities now have typed query and command methods. Commands that
  mutate canonical demo state continue to require `expectedRevision` and
  `idempotencyKey`; navigation/view commands validate their route/action
  binding without creating fake lifecycle state.
- Projection returned/empty/overdue/version-history values now derive from
  canonical Finding, report, CAP, Evidence, and communication collections. The
  seed no longer carries duplicate lifecycle flags. Overdue counts use only
  canonical `dueState` values.
- Added real immutable CAP and Evidence version histories in their existing
  collections; no parallel Finding/CAP/Evidence state was introduced.
- Added `DEMO_CAPABILITY_PERMISSION_MATRIX`, denied Auditee internal risk,
  teams, assistant, and non-Auditee administration surfaces, and tested each
  role/capability matrix entry. The Auditee privacy test verifies actual
  communications, calendar, profile, documents, notifications, and route
  projections for organization scope and omission of CAA-only identities,
  other organizations, internal notes, and risk content.
- Added immutability checks across all nine capability outputs, including
  nested visible-action collections and real version collections.

## Current verification (supersedes prior GREEN counts in this report)

### Additional RED evidence

Before this second correction pass, the focused scenario lacked an exhaustive
action/effect assertion, an Assistant guidance query, central method-boundary
capability enforcement, a separate full-screen fixture, and the Auditee
calendar release filter. The new assertions were added first and were not
satisfied by the prior implementation: it exposed substring-derived actions,
returned an inert completion status, retained `FND-CAB-2026-001` in the
canonical seed, and allowed broader role capability reads.

### Current GREEN result

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
# 2 passed, 22 passed

npm --prefix apps/web test -- tests/contract/mock-backend.test.ts
# 1 passed, 15 passed

npm --prefix apps/web run typecheck
# passed

git diff --check -- <Task 2 allowlist>
# passed
```

The 22-test focused result above is the current Task 2 GREEN status; earlier
counts are superseded.

### Second-pass corrections delivered

- `SCREEN_VISIBLE_ACTIONS` is an explicit exhaustive `ReactSurfaceId` map for
  all 86 ordered route IDs. It covers the source-faithful finance
  approve/return decisions, report return/forward/issue decisions, wizard
  Back/Next/Save Draft/Preview/Submit actions, evidence/CAP review decisions,
  downloads, and configuration/modals.
- Every visible action includes a typed non-inert effect contract: navigation,
  modal, file preview/download, local projection, or capability dispatch. The
  86-route scenario invokes all declared actions and verifies an effect.
- The capability permission matrix now lives in `backend-contracts.ts` and
  `requireDemoCapability` is invoked on every composed-capability method
  boundary. Finance, GM, Executive, Auditee, and Admin are constrained to
  their source-appropriate demo capabilities.
- `createCanonicalSeedState()` no longer contains `FND-CAB-2026-001`; the
  separate `createFullScreenScenarioSeedState()` adds the direct Finding and
  its immutable CAP/Evidence/report histories only for screen-projection
  fixtures. Lead conversion has an identity-collision guard.
- Assistant Drafts now exposes typed `getGuidance()` in addition to
  `create()`. Auditee calendar projections now require own organization,
  Routine/Announced notice, CAA release, and no notice-withheld flag.

## Third-review correction result (current)

### RED evidence

The new fixture/calendar assertions failed before this pass:

- `CAL-AUD-2026-099` opened for the Auditee even though its notice was
  withheld.
- Canonical `RPT-CAB-2026-001-V1` referenced absent `FND-CAB-2026-001`.

### Current GREEN result

```text
npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts
# 2 passed, 23 passed

npm --prefix apps/web test -- tests/contract/mock-backend.test.ts
# 1 passed, 15 passed

npm --prefix apps/web run typecheck
# passed

git diff --check -- <Task 2 allowlist>
# passed
```

This 23-test focused result supersedes all earlier Task 2 counts.

### Delivered

- Canonical seed has no `FND-CAB-2026-001` and no report reference to it. The
  full-screen-only fixture supplies it with Fly Namibia/AUD-2026-001 CAP,
  Evidence, and report histories; fixture invariant tests verify identity
  alignment.
- The Auditee calendar predicate is shared by list and direct open paths.
- Role selection exposes all eight demo roles. Cross-role/self navigation was
  removed from manager actions.
- High-risk modal actions carry typed guarded confirm-command bindings for CAP,
  Evidence, authorized closure, planning, and report decisions.

## Independent action-matrix completion

The full-screen test now has a test-local explicit
`EXPECTED_ACTION_IDS: Record<ReactSurfaceId, readonly string[]>` containing
all 86 ordered route keys. It is independent of `SCREEN_VISIBLE_ACTIONS` and
asserts exact action IDs for every route, registered role-safe non-self
navigation targets (except role selection), capability-dispatch authorization,
and exact high-risk guarded command bindings. The current GREEN result remains
`2 passed, 23 passed` focused tests, `1 passed, 15 passed` canonical tests,
typecheck passed, and diff check passed.
