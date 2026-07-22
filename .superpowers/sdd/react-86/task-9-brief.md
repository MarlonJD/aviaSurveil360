### Task 9: Complete The Auditee Portal

Execute only Task 9 from
`docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`.
Tasks 1–8 are complete and must not be redone or regressed.

**Files**

- Create `apps/web/src/features/auditee/inspection-coordination-page.tsx`
- Create `apps/web/src/features/reports/auditee-report-pages.tsx`
- Reuse and extend `apps/web/src/features/communications/message-center-page.tsx`
- Reuse and extend `apps/web/src/features/profile/profile-page.tsx`
- Create `apps/web/src/features/documents/auditee-documents-page.tsx`
- Create `apps/web/src/features/auditee/auditee-secondary-pages.test.tsx`
- Create `apps/web/src/styles/features/auditee-secondary.css`
- Modify only the necessary route, registry, typed demo-backend, mock-state,
  visual-seed, navigation, test, and style-ownership files
- Modify `apps/web/src/styles/app.css`

**Interfaces**

Covers `ui-audit-067`–`073` and must preserve the already implemented
`ui-audit-066` Corrective Actions workspace. The eight-screen Auditee family is:

- `/auditee/service-provider-cap`
- `/auditee/inspection-coordination`
- `/auditee/preliminary-reports`
- `/auditee/final-reports`
- `/auditee/reports/RPT-CAB-2026-001`
- `/auditee/messages`
- `/auditee/documents`
- `/auditee/settings`

Every list, detail, direct-ID read, preview, message, document, download,
notification, count, and persisted mutation must be scoped to the authenticated
Auditee's exact organization. Auditee shapes and rendered DOM must structurally
exclude CAA-private notes, inspector workload, risk scoring, private dashboards,
other organizations, unreleased reports, advance-notice-withheld inspections,
and enforcement deliberations.

- [ ] Write seven failing route/projection tests plus focused raw serialized
  object scans for forbidden fields/values, direct-ID denial, released report
  versions, document versions/review results, message visibility, coordination
  truth, and settings persistence.
- [ ] Confirm the intended missing-route/privacy/behavior RED before production
  edits; do not spend a visual run merely to prove missing components.
- [ ] Port exact Service Provider Portal compositions and connect only typed,
  Auditee-safe demo capabilities.
- [ ] Run all eight Auditee screens, canonical isolation tests, visible actions,
  and a bounded 24-pair visual matrix after functional GREEN.
- [ ] Record commit disposition as skipped; commits are explicitly forbidden.

**Strict execution constraints**

- Read `AGENTS.md`, applicable repository instructions, the active plan,
  `.superpowers/sdd/react-86/progress.md`, and this brief before editing.
- Use strict RED-before-GREEN TDD and record exact commands/results in
  `.superpowers/sdd/react-86/task-9-implementer-report.md`.
- This is the only Task 9 writing agent. Preserve unrelated dirty content and
  all Task 1–8 changes.
- Preserve exact source-role/route-role equality, `ui-audit-009` Inspector and
  `ui-audit-044` Manager ownership, exactly 17 dual-profile / 69 demo-only
  routes, and the exact Plan 2 blocked reason.
- Keep the canonical typed organization and subject identities:
  `ORG-FLY-NAMIBIA` and `USR-AUDITEE-FLY`. Never alias or rewrite them to legacy
  `ORG-XYZ`, and never rewrite another organization's record into Fly Namibia.
- Inspection Coordination may show only own-organization Routine/Announced
  records after `caaReleasedToAuditee === true`. Build the UI on an explicit
  Auditee-safe coordination/calendar projection; do not expose the internal
  assignment or Inspection Package object to the Auditee component. Ad Hoc/Unannounced or
  `noticeWithheld` assignments must be absent from raw Auditee projections and
  DOM. The first hierarchy statement must say exactly what the CAA expects next.
- The proposed coordination date comes from the exact
  `AssignmentSummary.scheduledStartDate` (`2026-06-15` in the canonical
  scenario), never from the Due Date or the current Calendar projection's
  `scheduledDate` fallback. Emit an Auditee-facing next action; do not reuse the
  Inspector checklist next action.
- Implement Confirm Proposed Date and Propose Alternative Date through a typed,
  revision-checked, idempotent, demo-only coordination capability backed by the
  shared mock store, with exact Audit/organization identity and visible/remount
  persistence. An alternative remains pending until CAA acceptance. Do not add
  an HTTP capability or begin Plan 2. If a different truthful typed design is
  required, document it before implementation; do not fake success with toast-
  only local state.
- Preliminary and Final Reports are invisible until the exact version reaches
  the canonical terminal `LOCKED` state through Executive Director
  `ISSUE_AND_LOCK`. Tighten both Auditee report direct reads and Documents to
  that exact stage; do not treat an intermediate or legacy `ISSUED` value as a
  released Auditee artifact. Returned, Department, GM, and Executive-review stages must not
  appear to Auditee lists, counts, Documents, preview, or direct reads.
- The canonical contextual preview route uses exact
  `RPT-CAB-2026-001` / `RPT-CAB-2026-001-V1` identity. The accepted root visual
  oracle still expects legacy `FR-2025-009`; keep the typed canonical identity
  and report that visual contradiction rather than fabricating or aliasing it.
- Map every allowed report through a closed Auditee-safe whitelist before it
  enters component state or serialized privacy evidence. Do not retain/pass the
  full internal `ReportVersionView` (including `contentHash`) to Auditee UI.
  Preserve linked Finding IDs only when explicitly required and independently
  validated to the same organization.
- A Preliminary Report action must remain bound to its exact Preliminary
  version and an in-page/local preview. It must never navigate to the fixed
  Final Report contextual route merely because no separate Preliminary path is
  declared.
- Report approval or download must never close a Finding. Report pages separate
  the authorized result from the next required Auditee action. Preliminary rows
  show response Due Date and CAA-visible comment state. Mobile report preview
  exposes working section-jump links.
- The current typed report records do not declare a response Due Date or a CAA-
  visible comment. Render truthful `Not configured` and
  `No CAA-visible comment recorded` states until a typed public field exists;
  never copy legacy dates/comments into the canonical record.
- Fix the Auditee Documents backend boundary before rendering it: own-
  organization only, released/issued report versions only, and Evidence metadata
  with exact immutable version and public review result. Direct open of an
  unreleased, other-organization, or unknown document must be denied. Every
  visible row action targets the exact document or is disabled with its exact ID
  and a truthful record-specific reason.
- Browser-local report/document downloads must use the exact visible record and
  filename. They remain demo artifacts, not signed, official, stored, or
  production records.
- Auditee Messages must be permanently labelled as Auditee-visible
  communication only. The Auditee composer may send only to CAA for its own
  organization. Add typed sender metadata or an equivalent fail-closed design so
  the Auditee can rehydrate its own outgoing messages without ever receiving a
  CAA-private message addressed to the same organization. Do not render a CAA-
  private visibility option or private-message section in Auditee DOM.
- If sender/direction metadata is added, expose only a safe message direction
  or public sender label to the Auditee projection; do not reveal an internal
  CAA subject ID merely to support rehydration.
- Auditee Settings must group organization scope and notification preferences
  separately. Profile updates use the existing typed profile command, exact
  subject-scoped idempotency key, and hydrate after remount. Do not present fake
  editable notification preferences; keep undeclared controls visibly read-only
  or disabled with a clear reason.
- The existing Corrective Actions page remains organization-scoped and continues
  to prove CAP acceptance is not Finding closure, Evidence versions are
  immutable, and only CAA-visible comments reach Auditee.
- Add every Auditee primary route to desktop and mobile navigation with one
  accessible `aria-current`. The report preview is contextual under Final
  Reports. Add the Auditee-specific route-label mapping to the shared shell so
  generic labels such as Messages, Settings, and Report Preview cannot resolve
  to another role's surface. Drawer navigation must close after transitions.
- Every visible action must use a typed command, exact route, durable visible
  state, working filter, preview/download, or a record-specific disabled reason.
- Add real-browser desktop/tablet/mobile coverage at 1440×900, 1024×768, and
  390×844 for all eight routes, direct loads, drawer/navigation, filters,
  coordination mutations/remount, report stage visibility, preview section
  jumps/download, message send/remount, document exact identity/download,
  settings remount, zero forbidden DOM values, no critical overflow, and every
  visible enabled route-content control at least 44×44 CSS pixels.
- Do not modify accepted baselines, decoded-pixel thresholds, masks, semantic
  truth, or root `index.html`/`css`/`js` oracle to manufacture parity.
- The generated Auditee visual semantic fixtures currently have no privacy-
  absence assertions. Visual GREEN cannot substitute for focused raw-object and
  DOM privacy scans.
- Visual work is bounded: one source-faithful correction pass and one complete
  matrix after functional GREEN. Do not enter repeated pixel-only loops; report
  residual truthful/oracle deviations literally.
- Do not commit, stage, create/switch branches, push, deploy, initialize Git,
  begin Plan 2, modify production infrastructure, or edit lifecycle trackers.

**Required verification before handoff**

- Focused Task 9 route/projection/privacy tests with raw object scans and exact
  direct-ID denial.
- Coordination idempotency/revision/role/organization/notice-policy tests.
- Preliminary/Final report lifecycle visibility and exact version tests through
  Manager → GM → Executive issue/lock, including unreleased denial.
- Documents version/review-result/direct-open/download tests.
- Auditee-only communication send/read/remount tests and profile remount tests.
- Existing Auditee CAP lifecycle/privacy tests and relevant Manager/GM/Executive
  report regressions.
- Typecheck, `build:demo`, visual contract/manifest, exact parity boundary,
  source-role equality, exact 17/69 and Plan 2 reason, root-source diff,
  `git diff --check`, and process cleanup.
- One bounded real-browser desktop/tablet/mobile interaction contract and one
  complete bounded Task 9 matrix:

  `AVIA_E2E_PROFILE=visual-parity AVIA_VISUAL_SURFACES=auditee-home,auditee-inspection-coordination,auditee-preliminary-reports,auditee-final-reports,auditee-report-preview,auditee-messages,auditee-documents,auditee-settings npx playwright test tests/e2e/legacy-visual-parity.spec.ts --project=legacy-parity`

- Self-review for spec compliance, code quality, organization scope, immutable
  identity/version, stage/authority separation, privacy at raw-shape and DOM
  levels, responsive hierarchy, and every visible action.
