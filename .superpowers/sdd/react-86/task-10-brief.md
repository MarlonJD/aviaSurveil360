### Task 10: Complete Administration And Configuration Workspaces

Execute only Task 10 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–9 are complete and must not be redone or regressed.

**Files**

- Create the Task 10 Admin route components named in the active plan, including
  Regulatory Library, Template List, Question Bank, Checklist Builder, Version
  History, Inspection Package Builder, Reports, Users / Roles, Organisation
  Master Data, Organization Detail, and Audit Log.
- Extend `apps/web/src/features/admin/admin-configuration-page.tsx` without
  regressing the existing Template Preview.
- Create `apps/web/src/features/admin/admin-secondary-pages.test.tsx` and a
  focused real-browser Admin responsive contract.
- Create `apps/web/src/styles/features/admin-secondary.css` and import only the
  necessary Admin styles from `apps/web/src/styles/app.css`.
- Modify only the necessary route registry, navigation, topbar/shell mapping,
  typed demo-backend, mock state/migration, visual seeding, tests, and style
  ownership files.

**Interfaces**

Task 10 covers `ui-audit-074`–`075` and `ui-audit-077`–`086`, while preserving
the existing `ui-audit-076` Template Preview. The complete 13-route Admin family
is:

- `/admin/regulatory-library` (`admin-regulatory-library`)
- `/admin/template-library` (`admin-template-list`)
- `/admin/templates` (`admin-home`, contextual under Template List)
- `/admin/question-bank` (`admin-question-bank`)
- `/admin/checklist-builder` (`admin-checklist-builder`)
- `/admin/templates/TPL-CABIN-2026/history` (`admin-version-history`)
- `/admin/inspection-package-builder` (`admin-inspection-package-builder`,
  contextual under Checklist Builder)
- `/admin/reports` (`admin-reports`)
- `/admin/users-roles` (`admin-users-roles`)
- `/admin/configurations` (`admin-configurations`)
- `/admin/organization-master-data` (`admin-organization-master-data`)
- `/admin/organization-master-data/ORG-FLY-NAMIBIA`
  (`admin-organization-detail`, contextual under Organisation Master Data)
- `/admin/audit-log` (`admin-audit-log`)

- [ ] Write 12 failing direct-route/action/authority tests for all new surfaces,
  plus persistence and raw-state tests for multiline questions, exact identity,
  immutable draft/version behavior, Admin-only access, user scope,
  organization master data, audit-log filters, disabled production provisioning,
  and configured-reference language.
- [ ] Confirm the intended missing-route/capability/behavior RED before
  production edits; do not spend a visual run proving missing components.
- [ ] Port the accepted Administration compositions and implement only typed,
  deterministic, browser-local demo actions.
- [ ] Run all 13 Admin routes, accessible forms, exact visible actions,
  persistence/remount, and a single bounded 39-pair visual matrix after
  functional GREEN.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden.

**Strict execution constraints**

- Read `AGENTS.md`, all applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict RED-before-GREEN TDD and record exact commands/results in
  `.superpowers/sdd/react-86/task-10-implementer-report.md`.
- You are the only Task 10 writing agent. Preserve unrelated dirty content and
  every Task 1–9 change.
- Preserve exact source-role/route-role equality, `ui-audit-009` Inspector and
  `ui-audit-044` Manager ownership, exactly 17 dual-profile / 69 demo-only
  routes, and the exact Plan 2 blocked reason.
- Add a typed Admin-only demo capability for new Admin data and mutations, or an
  equally strict typed design. Do not build route content from the generic
  `administration.getScreenProjection` placeholder and do not activate new HTTP
  methods or begin Plan 2.
- If new required mock-state fields are introduced, explicitly migrate or
  version-reset older persisted envelopes. A pre-Task-10 schema must not crash
  any Admin route after remount, and user-created Task 1–9 state must not be
  silently lost merely to simplify the migration.
- Non-Admin direct loads must fail before any Admin capability fetch or mutation.
  Admin mutations must be revision-checked, idempotent, exact-ID operations and
  must append a truthful demo audit event where the action is auditable.

**Identity, authority, and immutable-version rules**

- Preserve `TPL-CABIN-2026` as the exact Admin catalog/history route identity and
  `CTV-CABIN-1` as the existing immutable published version. Model their
  relationship explicitly; never alias another template/version into either
  identity and never infer identity from labels or list position.
- Published template versions and their question arrays are immutable. Creating
  a working checklist version must append a new Draft version with a new exact
  ID/version/revision and copy question IDs; adding/reordering questions may
  change only that Draft. The existing published version must remain byte-for-
  byte unchanged across the mutation and remount.
- The accepted root authority permits Admin Preview to create/configure a Draft,
  but Department Manager owns publishing after the approval path. Do not invent
  Admin publish/approval authority. If the typed governance path is unavailable
  in Task 10, show Publish/Submit as unavailable with the exact version ID,
  current status/owner, and a truthful role-specific reason.
- Version History must show append-only versions, status, creator, change reason,
  current owner, and a concise exact diff. Never edit or replace a historical
  version in place.
- The Question Bank create action must use a multiline textarea, visible
  character count, non-empty/length validation, exact generated question ID,
  typed persisted mutation, and visible remount persistence. Configured
  regulatory reference and expected-Evidence fields remain references/demo
  metadata, not legal advice or invented binding aviation obligations.
- The Checklist Builder must make working order and exact question identity
  visible on desktop and mobile. Add/reorder buttons act on the exact Draft and
  exact question, respect first/last disabled states, and remain at least 44×44
  CSS pixels. Published/locked rows have record-specific disabled reasons.

**Per-surface behavior**

- Regulatory Library is read-only reference data with working search/status
  filters, exact document IDs/version/effective date/configured rules/change
  history, and persistent guardrails: `Mock regulatory library`, `Demo data`,
  `Not a legal decision`, and `No real regulatory ingestion`.
- Template List shows exact template master, immutable version, status, owner,
  and item count. Only a row backed by the declared Template Preview route may
  navigate there; every unsupported row action is disabled with its own exact
  template/version ID and reason.
- Template Preview remains source-faithful and read-only, uses
  `CTV-CABIN-1`, exposes working section-jump navigation on mobile, and returns
  to `/admin/template-library` rather than maintaining a hidden in-component
  substitute list.
- Inspection Package Builder is an Admin configuration preview of the exact
  canonical package `PKG-CAB-2026-001`, Audit `AUD-2026-001`, organization
  `ORG-FLY-NAMIBIA`, and its exact typed question/reference/evidence/risk-focus
  data. Do not reuse or mutate the Manager-only
  `PKG-AUD-2026-001-CABIN` package-draft command merely to make this page work.
  It must not rewrite `ORG-SKYCARGO`, infer legal/enforcement outcomes, or
  cross-navigate an Admin session into an Inspector-only checklist. Unsupported
  execution is visibly disabled with the package/Audit-specific reason.
- Admin Reports is a typed mock report-definition catalog, not a real report/PDF
  engine. Search/selection must work and preview exact package fields; any
  generate/download/publish action is either a truthful browser-local artifact
  or visibly disabled with the exact catalog record and reason.
- Users / Roles exposes only the typed demo access directory with exact subject,
  role, organization scope, and search/filter behavior. Email, MFA, invitation,
  and account status must say `Not configured in demo` unless the typed Admin
  projection explicitly owns those fields; never copy legacy identities or
  fabricate access metadata. User
  creation, invitation, role changes, MFA administration, and deactivation are
  production-only and must be visibly disabled with a record/action-specific
  reason that names Plan 3 Keycloak administration. Never mutate a real session
  role through the profile command.
- Configurations separates demo-only configured rules from production-required
  integrations. Severity, lifecycle, Due Date language, advisory-only Oversight
  Health Index, in-app reminder rules, and no-real-email/SMS boundaries are
  readable. Do not render fake editable/save controls for undeclared commands.
- Organisation Master Data uses exact typed IDs, including
  `ORG-FLY-NAMIBIA` and `ORG-SKYCARGO`, with organization type/status/scope
  filters. Only Fly Namibia may use the single declared contextual detail route;
  every other row is disabled with that exact organization ID and reason. Never
  rewrite a selected organization into Fly Namibia.
- Organization Detail loads exact `ORG-FLY-NAMIBIA`, preserves identity through
  direct load/remount, keeps contextual navigation under Organisation Master
  Data, and shows only typed master-data fields. Unavailable editable fields or
  unsupported actions are disabled with record-specific reasons rather than
  fabricated contact/certificate values.
- Audit Log reads the typed append-only audit trail, clearly says it is a demo
  trace and not a production audit trail, and provides working actor/action/
  entity/system/date-text filters. Rows preserve exact event/entity/actor IDs,
  before/after status, reason, revision, and timestamp without manufacturing a
  legal record or deleting history.

**Shell, responsive, and action requirements**

- Make every Admin primary route reachable from both desktop and mobile shell
  navigation. Add Audit Log and remove/disable any inert accepted-nav item.
  Contextual active mapping must be exactly: Template Preview → Template List,
  Inspection Package Builder → Checklist Builder, Organization Detail →
  Organisation Master Data. Exactly one accessible `aria-current` item is
  allowed, and the mobile drawer must close after every transition.
- NAMCARS Library and Regulatory Cross-Reference are two accepted labels for one
  Regulatory Library surface; Configurations and Notification Rules likewise
  share one configuration surface. Use one canonical route item plus an
  in-surface tab/section or visibly disabled alias with a truthful reason. Do
  not assign the same route ID to two simultaneously active navigation items.
- Topbar breadcrumbs and shared route labels must be route-specific. Do not show
  `Templates › Template Preview` on unrelated Admin routes.
- At 1440×900, 1024×768, and 390×844, verify all 13 direct loads, primary and
  contextual transitions, filters, exact row selection/disabled reasons,
  Question Bank validation/create/remount, Draft create/add/reorder/remount,
  organization identity, audit-log filters, no critical document overflow, and
  every visible enabled route-content control at least 44×44 CSS pixels.
- The Question Bank must use multiline readable composition. Checklist Builder
  and dense Reports/Users/Organizations/Audit Log registers must become complete
  mobile cards or an explicit accessible scroller; no clipped question,
  reference, actor, object, status, or action is acceptable.
- Every visible action must have a typed persisted mutation, exact navigation,
  working local selection/filter/preview, browser-local file result, or a
  visible record-specific disabled reason. Toast-only success is insufficient.
- Use careful language: `configured reference`, `expected Evidence`, `finding
  basis`, `review result`, and `reference only`. Do not invent legal,
  enforcement, certificate, medical, security, or operational obligations.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, semantic
  truth, or root `index.html`/`css`/`js` oracle to manufacture parity.
- Accepted visual fixtures still include legacy `ORG-XYZ` for Admin Organization
  Detail while the frozen React route is `ORG-FLY-NAMIBIA`. Preserve the exact
  typed route identity and report this stale-oracle contradiction rather than
  aliasing or rewriting records.
- Other accepted stale/oracle differences include `v1.1` history content,
  `PKG-AUD-2026-001-CABIN`, a Manager-owned risk CTA on Admin Organization
  Detail, and an Inspector checklist CTA on the Admin package page. Preserve
  typed identity and Admin authority, and report these deviations instead of
  manufacturing cross-role navigation.
- Visual work is bounded to one complete matrix after functional GREEN. Do not
  enter repeated pixel-only loops; report residual truthful/oracle deviations
  literally. The user's no-loop direction does not waive functional,
  authority, identity, privacy, responsive, or accessibility defects.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit lifecycle trackers.

**Required verification before handoff**

- Focused Task 10 direct-route/authority/action tests for all 13 Admin routes.
- Exact template master/version identity, immutable published snapshot, Draft
  create/add/reorder/idempotency/revision/remount, and version-history tests.
- Multiline Question create/validation/remount and configured-reference wording.
- Admin-only user directory plus production provisioning disabled reasons.
- Exact organization list/detail identity and unsupported-row disabled reasons.
- Audit Log append-only identity and working filter tests.
- Existing Template Preview and all Task 1–9 relevant regressions.
- Typecheck, `build:demo`, visual contract/manifest, exact parity boundary,
  source-role equality, exact 17/69 and Plan 2 reason, root-source diff,
  `git diff --check`, and process cleanup.
- One bounded real-browser Admin desktop/tablet/mobile interaction contract and
  one complete bounded Task 10 matrix:

  `AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=admin-regulatory-library,admin-template-list,admin-home,admin-question-bank,admin-checklist-builder,admin-version-history,admin-inspection-package-builder,admin-reports,admin-users-roles,admin-configurations,admin-organization-master-data,admin-organization-detail,admin-audit-log npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity`

- Self-review for spec compliance, code quality, exact identity/version,
  immutable history, authority, configured-reference language, responsive
  hierarchy, accessibility, and every visible action.
