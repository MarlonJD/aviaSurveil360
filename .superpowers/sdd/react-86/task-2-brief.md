### Task 2: Expand The Demo Backend Capability Contract

**Files**

- Modify `apps/web/src/backend/backend.ts`
- Modify `apps/web/src/backend/backend-contracts.ts`
- Modify `apps/web/src/mock/memory-mock-store.ts`
- Modify `apps/web/src/mock/mock-engine.ts`
- Modify `apps/web/src/mock/create-mock-backend.ts`
- Modify `apps/web/src/mock/seed-data.ts`
- Create `apps/web/src/mock/full-screen-scenario.test.ts`
- Modify `apps/web/tests/contract/mock-backend.test.ts`

**Interfaces**

Add composed capabilities named `communications`, `calendar`, `profiles`,
`teams`, `risk`, `documents`, `notifications`, `administration`, and
`assistantDrafts`. Each capability exposes typed query and command methods and
returns immutable projections. Commands accept `expectedRevision` and
`idempotencyKey` where they change canonical demo state.

- [ ] Write a failing contract test that loads all 86 screen projections from
  one seed and executes every declared visible command, including direct-ID,
  empty, denied, returned, overdue, and version-history states.
- [ ] Run
  `npm --prefix apps/web test -- src/mock/full-screen-scenario.test.ts tests/contract/mock-backend.test.ts`
  and confirm the new capability names are missing.
- [ ] Implement the capability interfaces, deterministic seed records,
  organization/role filters, revision checks, idempotent commands, notification
  records, document metadata, and advisory draft output. Do not duplicate
  existing Finding/CAP/Evidence state in new stores.
- [ ] Run focused tests and the existing canonical scenario contract; expect
  exact deterministic IDs and zero Auditee internal-field leakage.
- [ ] Commit exactly `feat(mock): cover full screen capability contract`.

