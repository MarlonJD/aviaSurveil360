### Task 1: Freeze The 86-Route React Contract

**Files**

- Modify `apps/web/src/app/route-contracts.ts`
- Modify `apps/web/src/app/route-contracts.test.ts`
- Create `apps/web/src/app/screen-component-registry.tsx`
- Modify `apps/web/src/app/router.tsx`
- Modify `apps/web/src/app/router.test.tsx`
- Modify `apps/web/src/parity/legacy-screen-manifest.ts`
- Modify `apps/web/src/parity/legacy-screen-manifest.test.ts`
- Modify `apps/web/tests/e2e/support/legacy-parity-fixtures.ts`
- Modify `tests/parity/behavior-ledger.json`
- Modify `tests/parity/react-legacy-parity.test.mjs`

**Interfaces**

- Produces exactly 86 unique `ReactSurfaceId` values and route contracts.
- Every route declares role, parent, placement, data boundary, profile
  availability, audit ID, and component key.
- Normalized audit-source role must equal `requiredRole` for all role-owned
  rows. Task 1 explicitly re-homes `ui-audit-009` from Lead to CAA Inspector and
  `ui-audit-044` from Lead to Department Manager, including paths, parents,
  fixtures, and direct-load guards.
- The 69 new routes use `availableProfiles: ["demo"]` and an exact Plan 2 HTTP
  activation reason. The 17 existing routes retain `["demo", "http"]`.

- [ ] Write failing tests that require 86 ordered source rows, 86 unique route
  IDs/paths, 0 legacy-only rows, exact 17 dual-profile routes, exact 69
  demo-only-until-Plan-2 routes, exact audit-role/route-role agreement, the two
  corrected inherited mappings, and no wildcard placeholder render.
- [ ] Run
  `npm --prefix apps/web test -- src/app/route-contracts.test.ts src/app/router.test.tsx src/parity/legacy-screen-manifest.test.ts`
  and confirm failure reports `expected 86`, not a syntax/setup failure.
- [ ] Implement the expanded unions, contracts, profile guard, and lazy screen
  component registry. A blocked HTTP direct load must render the real parent
  route plus an explicit unavailable-capability notice; it must not render the
  demo component or a generic placeholder.
- [ ] Run the focused tests, then
  `node --test tests/parity/react-legacy-parity.test.mjs`; expect all route and
  parity assertions green at `86/86`.
- [ ] Commit exactly `feat(ui): freeze full 86-screen route contract` after
  checking the task allowlist and cached diff.

