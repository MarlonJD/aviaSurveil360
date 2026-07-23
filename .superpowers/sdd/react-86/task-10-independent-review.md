# Task 10 Independent Review

Date: 2026-07-23

Git range: `a598571..8f8a252`

## Strengths

- Admin queries and mutations enforce Admin authority at the backend boundary.
- Draft creation and question reordering preserve the immutable published
  template and append audit events.
- Regulatory content is consistently labelled as configured reference/demo
  data, not legal advice.
- Keycloak-dependent provisioning and production-only actions are disabled
  with specific visible reasons.
- Focused tests cover persistence, idempotency, revision conflicts, multiline
  questions, exact identities, filters, navigation, and responsive controls.

## Issues

### Critical

None.

### Important

1. HTTP-blocked contextual Admin routes can render a demo-only parent and fail
   instead of showing the required unavailable-capability boundary.

   `apps/web/src/app/router.tsx:47-68` resolves the nearest implemented parent
   without checking that parent's `availableProfiles`. The Task 10 routes
   `/admin/inspection-package-builder` and
   `/admin/organization-master-data/ORG-FLY-NAMIBIA` have demo-only parents in
   `apps/web/src/app/route-contracts.ts:130` and
   `apps/web/src/app/route-contracts.ts:135`. In the HTTP profile this can mount
   a component that requires `adminWorkspace`, which the real `HttpBackend`
   intentionally does not expose, instead of rendering the nearest
   HTTP-capable Admin ancestor plus the exact Plan 2 notice. The existing HTTP
   router test uses a mock runtime that still supplies `adminWorkspace`, masking
   the defect.

   Fix direction: make parent resolution profile-aware and climb to the nearest
   implemented, profile-available ancestor, ultimately `admin-home` for these
   routes, or render the parent through the same profile guard. Add direct-load
   tests for both contextual paths using an HTTP backend/runtime with no
   `adminWorkspace`.

### Minor

None.

## Correction Status

The Important finding was corrected locally on 2026-07-23 through RED → GREEN
TDD. Two real-`HttpBackend` contextual Admin direct-load regressions first
failed with the reproduced `adminWorkspace` exceptions, then passed after
parent resolution was made build-profile-aware. The correction passed the
focused Task 10 suite 103/103, full React suite 517/517, typecheck, demo and
HTTP builds, HTTP artifact scan, 86-route/two-profile boundary, root-oracle
diff, and diff-check.

The fresh root/parity matrix passed 107/107. The correction's clean independent
re-review is `not run`.

## Verification Performed

- Read the repository instructions, complete active migration plan,
  architecture, and relevant Admin/configuration, versioning, authority, and
  parity specifications.
- Inspected `git diff a598571..8f8a252` and
  `git show --stat --oneline 8f8a252`.
- Focused Vitest: 6 files, 53/53 passed.
- TypeScript typecheck passed.
- `git diff --check a598571..8f8a252` passed.
- Inspected HTTP/backend capability separation and contextual route resolution
  statically.
- Browser and visual matrices were not rerun. The recorded 1/40 visual result
  and standalone-baseline limitation remain accepted evidence limitations, not
  additional review findings.

## Assessment

**Ready to proceed to Task 11:** With fixes.

Task 10's demo behavior and immutable Admin semantics are well covered, but the
two contextual Admin routes do not currently satisfy the required fail-closed
HTTP direct-load behavior. Correct the Important finding and obtain a clean
independent re-review before starting Task 11.

The implementation correction is now `verified locally`; this original
assessment remains unchanged until an independent re-review approves the
correction.
