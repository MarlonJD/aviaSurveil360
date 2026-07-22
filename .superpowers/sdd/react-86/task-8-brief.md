### Task 8: Complete General Manager And Executive Director Workspaces

Execute only Task 8 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–7 are complete and must not be redone or regressed.

**Files**

- Extend `apps/web/src/features/planning/planning-workspaces.tsx`
- Create `apps/web/src/features/management/department-comparison-page.tsx`
- Create `apps/web/src/features/risk/executive-risk-page.tsx`
- Create `apps/web/src/features/reports/executive-report-workspaces.tsx`
- Create `apps/web/src/features/notifications/executive-notifications-page.tsx`
- Reuse `profile-page.tsx` for settings projections
- Create `apps/web/src/features/management/executive-workspaces.test.tsx`
- Create `apps/web/src/styles/features/executive-secondary.css`
- Modify `apps/web/src/styles/app.css`

**Interfaces**

Covers `ui-audit-053`–`057` and `060`–`065`. Planning preserves Department
Manager → Finance → General Manager → Executive Director → General Manager
Release to Department. Preliminary and Final Reports preserve Lead Inspector →
Department Manager → General Manager → Executive Director and bind every
decision to the exact immutable report version. Finance never participates in
report approval.

- [ ] Write 11 failing tests for decision queues, denied authority, return
  reasons, departments, risk indicator boundary, notifications, settings, and
  report preview/version identity.
- [ ] Run focused tests and 33 visual pairs; confirm missing-route RED.
- [ ] Port role-specific root compositions and connect demo capability commands.
- [ ] Run all General Manager, Finance, and Executive routes, canonical approval
  regressions, visible actions, and bounded role visuals.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden.

**Strict execution constraints**

- Read `AGENTS.md`, applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict RED-before-GREEN TDD and record exact commands/results in
  `.superpowers/sdd/react-86/task-8-implementer-report.md`.
- This is the only Task 8 writing agent. Preserve unrelated dirty content and
  all Task 1–7 changes.
- Preserve exact source-role/route-role equality, `ui-audit-009` Inspector and
  `ui-audit-044` Manager ownership, exactly 17 dual-profile / 69 demo-only
  routes, and the exact Plan 2 blocked reason.
- Planning decisions must preserve exact Planning item/revision/actor/reason
  and the full Department Manager → Finance → General Manager → Executive
  Director → General Manager Release chain. Zero budget still requires Finance
  Review. No stage may be skipped or decided by the wrong role.
- Report decisions must preserve the exact immutable report/version/revision,
  actor, reason, and audit event across Lead → Department Manager → General
  Manager → Executive Director. Finance must never appear in report approval.
- Fix the existing Executive report-fixture mismatch within Task 8 through a
  truthful versioned report/Finding relationship or explicit unavailable state;
  do not mutate an immutable report version opportunistically or invent a
  Finding ID merely to satisfy a test.
- Return reasons must remain visible/version-bound. Issue/mock-sign/lock remains
  Executive-only and demo-only where declared. Approval never closes Findings.
- Department comparison, Executive risk/Oversight Health, and notifications are
  decision-support projections only. No automatic legal, enforcement,
  certificate, compliance, suspension, or closure determination.
- Every visible action must use a typed command, exact route, durable visible
  state, or a record-specific disabled reason. Preserve exact plan/report/
  version/department/notification IDs and one accessible active navigation item.
- Settings/profile updates must hydrate after remount and remain role-safe.
- Add desktop/tablet/mobile direct-route, drawer/navigation, queue/filter,
  denied-authority, version, reason, responsive hierarchy, control-bound, and
  overflow coverage.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, semantic
  truth, or root `index.html`/`css`/`js` oracle to manufacture parity.
- Visual work is bounded: one source-faithful correction pass and one complete
  matrix after functional GREEN. Do not enter repeated pixel-only loops; report
  residual truthful/oracle deviations literally.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit lifecycle trackers.

**Required verification before handoff**

- Focused Task 8 tests and canonical planning/report approval regressions,
  including denied roles, exact revisions/reasons/events, and the known
  Executive report-Finding fixture case.
- Relevant General Manager, Finance, Executive, Manager, Lead, route,
  navigation, profile, visible-action, and ownership regressions.
- Typecheck, `build:demo`, visual contract, exact parity boundary, root-source
  diff, `git diff --check`, and process cleanup.
- One bounded real-browser desktop/tablet/mobile interaction contract and one
  complete bounded Task 8 visual matrix.
- Self-review for spec compliance, code quality, exact identity/version,
  stage/authority separation, return-reason visibility, advisory-only risk,
  responsive hierarchy, and every visible action.

