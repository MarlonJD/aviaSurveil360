### Task 5: Migrate The Twelve Remaining Lead Inspector Surfaces

Execute only Task 5 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–4 are complete and must not be redone or regressed.

**Files**

- Create `apps/web/src/features/reports/lead-report-workspaces.tsx`
- Create `apps/web/src/features/reports/lead-report-workspaces.test.tsx`
- Create `apps/web/src/features/teams/audit-assignment-page.tsx`
- Create `apps/web/src/features/teams/question-assignment-page.tsx`
- Create `apps/web/src/features/teams/lead-assignment-pages.test.tsx`
- Reuse `message-center-page.tsx`, `role-calendar-page.tsx`, and `profile-page.tsx`
- Create `apps/web/src/features/reports/lead-analytics-page.tsx`
- Create `apps/web/src/styles/features/lead-secondary.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/styles/style-ownership.test.ts`

**Interfaces**

Covers audit IDs `014`–`021`, `023`–`026`. Report state remains versioned and
follows Lead preparation/readiness boundaries; assignment commands preserve
exact Audit/question IDs and cannot change approval authority.

- [ ] Write 12 failing direct-route and behavior tests, including returned
  Preliminary Report, readiness blockers, assignment workload, exact question
  scope, internal/auditee comment separation, and working document preview.
- [ ] Run focused tests and 36 visual pairs; confirm red for missing surfaces.
- [ ] Port source DOM/CSS and implement typed demo actions without changing the
  existing Assigned Audits and CAP Review surfaces.
- [ ] Run all 14 Lead routes, keyboard/visible-action checks, and 42 Lead visual
  comparisons; expect all green.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden in
  this execution.

**Strict execution constraints**

- Read `AGENTS.md`, applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict test-driven development: demonstrate relevant RED failures before
  production implementation, then make the smallest source-faithful GREEN
  change. Record exact RED/GREEN commands and results in
  `.superpowers/sdd/react-86/task-5-implementer-report.md`.
- This is the only writing agent for Task 5. Preserve all unrelated dirty-tree
  content and all Task 1–4 changes.
- Preserve exact source-role/route-role equality, the 17 dual-profile / 69
  demo-only boundary, and the exact Plan 2 blocked reason.
- Preserve Lead Inspector CAP/Evidence review authority on the accepted Lead
  routes. Do not route Lead navigation through Department Manager-owned
  `ui-audit-044`.
- Every visible action must work through typed mock capability, navigation,
  form/local state with a visible effect, or be visibly disabled with a
  record-specific reason. Preserve exact Audit, question, Finding, CAP,
  Evidence, and report identities.
- Keep `Comment to Auditee` and `Internal CAA Note` structurally distinct.
  Preserve immutable report versions and readiness/approval authority.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, root
  `index.html`/`css`/`js` oracle, or semantic truth to manufacture parity.
- Visual work is bounded: run the required matrix and make source-faithful
  corrections, but do not enter repeated low-value pixel loops. Report any
  residual truthful deviation literally for controller/reviewer disposition.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit plan/index/tracker
  lifecycle status.

**Required verification before handoff**

- Focused Task 5 route/behavior tests and relevant existing Lead regressions.
- Typecheck and `build:demo`.
- Visual contract and exact parity-boundary checks.
- All 14 Lead routes across desktop/tablet/mobile using the accepted baselines.
- Root-source diff and `git diff --check`.
- No leftover Playwright, Vite, browser, or test processes.
- Self-review for spec compliance, code quality, lifecycle truth, authority,
  record identity, responsive hierarchy, and visible-action behavior.

