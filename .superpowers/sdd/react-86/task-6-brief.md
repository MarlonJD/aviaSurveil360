### Task 6: Migrate Department Manager Operational Workspaces

Execute only Task 6 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–5 are complete and must not be redone or regressed.

**Files**

- Create `apps/web/src/features/inspections/manager-audits-page.tsx`
- Create `apps/web/src/features/teams/inspection-team-page.tsx`
- Create `apps/web/src/features/findings/manager-findings-review-page.tsx`
- Create `apps/web/src/features/caps/manager-cap-monitoring-page.tsx`
- Create `apps/web/src/features/checklists/checklist-management-page.tsx`
- Create `apps/web/src/features/organizations/organization-detail-page.tsx`
- Create `apps/web/src/features/reports/manager-preliminary-review-page.tsx`
- Create `apps/web/src/features/caps/department-closure-review-page.tsx`
- Create `apps/web/src/features/management/manager-operational-pages.test.tsx`
- Modify `apps/web/src/features/evidence/evidence-review-page.tsx`
- Modify `apps/web/src/features/evidence/evidence-review-page.test.tsx`
- Create `apps/web/src/styles/features/manager-operations.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/styles/style-ownership.test.ts`

**Interfaces**

Covers `ui-audit-029`, `032`–`035`, `042`, `045`–`046`. Decisions must call
the existing authoritative demo lifecycle commands and record exact actor,
reason, revision, report/Evidence version, and audit event. This task also
corrects inherited `ui-audit-044`: Inspection Evidence is a Department Manager
route/projection, not a Lead Inspector substitute. Lead CAP and Evidence review
remains inside accepted Lead surfaces `013` and `022`.

- [ ] Write failing tests for all eight new routes plus a source-role regression
  for corrected `ui-audit-044` and denied/returned/direct-ID cases, including
  closure outcomes that keep partial/not-close Findings open.
- [ ] Run focused tests and confirm missing-route RED results.
- [ ] Port exact operational register/dossier/action compositions and connect
  the typed demo commands; use responsive cards where the accepted root does.
- [ ] Run the eight routes across desktop/tablet/mobile plus existing Manager
  routes and canonical lifecycle regression.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden.

**Strict execution constraints**

- Read `AGENTS.md`, applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict RED-before-GREEN TDD and record exact commands/results in
  `.superpowers/sdd/react-86/task-6-implementer-report.md`.
- This is the only Task 6 writing agent. Preserve all unrelated dirty-tree
  content and all Task 1–5 changes.
- Preserve exact source-role/route-role equality, especially CAA Inspector-owned
  `ui-audit-009` and Department Manager-owned `ui-audit-044`; preserve exactly
  17 dual-profile and 69 demo-only routes with the exact Plan 2 blocked reason.
- Department Manager operational decisions must use authoritative typed demo
  lifecycle commands. Preserve exact Audit, Finding, CAP, Evidence, report,
  revision, actor, reason, and audit-event identity.
- CAP acceptance never closes a Finding. Partial Close and Not Close must keep
  the Finding open; closure requires accepted Evidence plus verification or an
  explicit authorized closure path with an audit event.
- Keep Lead CAP/Evidence authority on Lead-owned surfaces; do not use a Lead
  backend/shell for Manager-owned `ui-audit-044` or expose Manager authority in
  Lead navigation.
- Every visible action must work with visible durable demo state/navigation or
  be disabled with a record-specific reason. Keep `Comment to Auditee` and
  `Internal CAA Note` structurally distinct; preserve immutable Evidence/report
  versions and Auditee organization scoping.
- Add desktop/tablet/mobile hierarchy, direct-route, drawer/navigation,
  filter/action, denial, and record-identity coverage.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, semantic
  truth, or root `index.html`/`css`/`js` oracle to manufacture parity.
- Visual work is bounded: one source-faithful correction pass and one complete
  matrix after functional GREEN. Do not enter a repeated pixel-only loop;
  report residual truthful/oracle deviations literally for review.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit lifecycle trackers.

**Required verification before handoff**

- Focused Task 6 tests and canonical CAP/Evidence/closure lifecycle regressions.
- Relevant existing Manager, Lead, Inspector, Auditee, route, navigation, and
  role-ownership regressions.
- Typecheck, `build:demo`, visual contract, exact parity boundary, root-source
  diff, `git diff --check`, and process cleanup.
- Complete bounded Manager operational visual matrix at all three viewports.
- Self-review for spec compliance, code quality, authority, lifecycle truth,
  exact identity/version/audit event, responsive hierarchy, and visible actions.

