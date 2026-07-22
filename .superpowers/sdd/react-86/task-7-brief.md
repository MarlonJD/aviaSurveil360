### Task 7: Migrate Department Manager Intelligence, Package, And Intake Workspaces

Execute only Task 7 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–6 are complete and must not be redone or regressed.

**Files**

- Create `apps/web/src/features/risk/manager-risk-workspaces.tsx`
- Create `apps/web/src/features/risk/manager-risk-workspaces.test.tsx`
- Create `apps/web/src/features/inspections/inspection-package-builder-page.tsx`
- Create `apps/web/src/features/planning/new-audit-wizard.tsx`
- Create `apps/web/src/features/planning/new-audit-wizard.test.tsx`
- Create `apps/web/src/styles/features/manager-intelligence.css`
- Create `apps/web/src/styles/features/planning-intake.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/styles/style-ownership.test.ts`

**Interfaces**

Covers `ui-audit-031`, `036`–`040`, `043`, `047`–`051`. The five wizard
routes are one persisted draft with explicit step URLs. Submission creates a
Planning item, not an executable Audit; unannounced notice remains withheld.
Risk and Oversight Health values are indicators only.

- [ ] Write failing tests for six risk/intelligence routes, package builder,
  five wizard steps, draft restart, validation, Back/Next, submission, zero-
  budget Finance path, and unannounced privacy.
- [ ] Run focused tests and 36 visual pairs; confirm missing-composition/action RED.
- [ ] Port exact root compositions, create one Zod-validated wizard state, and
  call typed mock planning/package commands with deterministic revisions.
- [ ] Run all 12 routes, planning lifecycle regression, visible actions, and
  responsive visuals without automatic legal/enforcement claims.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden.

**Strict execution constraints**

- Read `AGENTS.md`, applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict RED-before-GREEN TDD and record exact commands/results in
  `.superpowers/sdd/react-86/task-7-implementer-report.md`.
- This is the only Task 7 writing agent. Preserve all unrelated dirty-tree
  content and all Task 1–6 changes.
- Preserve exact source-role/route-role equality, `ui-audit-009` Inspector and
  `ui-audit-044` Manager ownership, exactly 17 dual-profile / 69 demo-only
  routes, and the exact Plan 2 blocked reason.
- All five wizard routes must share one deterministic, remount/restart-persistent
  draft keyed to exact IDs. Back/Next/direct-step validation must not silently
  lose or fabricate values.
- Submission must use the typed planning/package command boundary and create a
  Planning item only. It must not create an executable Audit before the accepted
  governance release/confirmation stage.
- Preserve the Department Manager → Finance → General Manager → Executive
  Director → General Manager Release chain. The accepted root contract keeps
  Finance Review even when the proposed budget is zero; zero budget must not
  bypass Finance.
- Ad Hoc / Unannounced organization notice remains withheld until the accepted
  post-release/confirmation point. Auditee routes must not expose the draft or
  withheld inspection.
- Risk, SSP/NASP, USOAP readiness, CAP effectiveness, and Oversight Health are
  advisory indicators only. Never make automatic legal, enforcement,
  certification, suspension, closure, or compliance decisions.
- Every visible action must work through typed mock capability, exact-route
  navigation, or visible durable draft state, or be disabled with a record-
  specific reason. Preserve exact Organization/Planning/package/version IDs.
- Add desktop/tablet/mobile hierarchy, drawer/navigation, filters, validation,
  direct-route, restart, privacy, and overflow/control-bound coverage.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, semantic
  truth, or root `index.html`/`css`/`js` oracle to manufacture parity.
- Visual work is bounded: one source-faithful correction pass and one complete
  matrix after functional GREEN. Do not enter repeated pixel-only loops;
  report residual truthful/oracle deviations literally.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit lifecycle trackers.

**Required verification before handoff**

- Focused Task 7 tests and canonical planning/governance/privacy regressions.
- Relevant Manager, Auditee, Finance, General Manager, Executive, route,
  navigation, visible-action, and role-ownership regressions.
- Typecheck, `build:demo`, visual contract, exact parity boundary, root-source
  diff, `git diff --check`, and process cleanup.
- One bounded real-browser desktop/tablet/mobile interaction contract and one
  complete bounded Task 7 visual matrix.
- Self-review for spec compliance, code quality, exact draft/item/version
  identity, planning authority, no premature Audit creation, unannounced
  privacy, advisory-only risk language, responsive hierarchy, and actions.
