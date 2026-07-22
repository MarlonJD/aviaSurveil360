### Task 4: Migrate The Seven Remaining Inspector Surfaces

**Files**

- Create `apps/web/src/features/findings/inspector-findings-page.tsx`
- Create `apps/web/src/features/communications/message-center-page.tsx`
- Create `apps/web/src/features/calendar/role-calendar-page.tsx`
- Create `apps/web/src/features/reports/inspector-reports-page.tsx`
- Create `apps/web/src/features/reports/closure-report-page.tsx`
- Create `apps/web/src/features/assistant/inspector-assistant-page.tsx`
- Create `apps/web/src/features/profile/profile-page.tsx`
- Create `apps/web/src/features/inspector/inspector-secondary-pages.test.tsx`
- Modify `apps/web/src/features/findings/finding-detail-page.tsx`
- Modify `apps/web/src/features/findings/finding-detail-page.test.tsx`
- Create `apps/web/src/styles/features/inspector-secondary.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/styles/style-ownership.test.ts`

**Interfaces**

Covers new audit IDs `003`–`006`, `010`–`012` and corrects the inherited
`ui-audit-009` route so Finding Detail is owned, addressed, rendered, and
authorized as a CAA Inspector surface. Shared message/calendar/profile
components accept a role-safe projection; Inspector assistant consumes only
`assistantDrafts.createDraft` and always labels output as a draft.

- [ ] Write seven failing tests for the new routes and a failing source-role
  regression for corrected `ui-audit-009`, covering purpose, owner, next action,
  Due Date, role scope, working actions, direct load, and mobile hierarchy.
- [ ] Run the focused tests and the 21 new-route visual pairs; confirm expected red
  composition/action failures.
- [ ] Port the exact root hierarchy and bounded selectors, connect all actions
  to the demo capability contract, and preserve the existing Inspector shell.
- [ ] Run focused tests, all Inspector routes, visible-action inventory, and 11
  Inspector visual states × 3 viewports; expect all green.
- [ ] Commit exactly `feat(ui): migrate complete inspector workspace`.

