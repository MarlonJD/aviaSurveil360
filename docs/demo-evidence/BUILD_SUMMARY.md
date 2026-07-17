# AviaSurveil360 — Demo Build Summary

**Build type:** Frontend-only V2 clickable demo for stakeholder feedback.
**Stack:** HTML + CSS + Vanilla JavaScript. Mock data, client-side state, and
browser-only demo persistence through a small storage boundary.
**Not production-ready.** No backend, database, API, real authentication, real
file upload, real AI service, real regulatory ingestion, real notification
service, real document storage, mobile/offline app, e-signature, or framework
migration.

**Demo date context:** the app treats `15 June 2026` as "today" so Due Soon /
Overdue math is deterministic.

---

## How to run

Open `index.html` directly in a browser, or serve the folder with any static
server:

```bash
python3 -m http.server 4360
```

Use **Reset demo** in the top ribbon to clear this browser's saved demo state
and return to seed data.

---

## Changed files

| File | Purpose |
|---|---|
| `index.html` | Demo ribbon states frontend-only browser persistence and the asset query token covers the verified manager-workspace UI. |
| `css/styles.css` | V2 responsive UI for role-based workspaces, including the restricted Department/General Manager workbenches, split panes, sticky row actions, bounded menus/drawers, and 390px mobile behavior. |
| `js/data.js` | Backend-ready mock records, workbook-derived Cabin Inspection data, manager/GM demo records, explicit status values, and isolated `localStorage` demo storage helpers. |
| `js/helpers.js` | Selectors, status helpers, Cabin/PBE regulatory trace lookups, outbox helpers, and demo badge helpers. |
| `js/work-items.js` | Shared table-first work-item shaping for audits, findings, CAP/evidence child rows, approvals, planning items, and admin queues. |
| `js/manager-workspaces.js` | Pure Department/General Manager projections and mutations, separate report decisions, CAP/checklist/risk helpers, and dependency-free demo PDF generation. |
| `js/views.js` | Existing screens plus Cabin Inspection flow, restricted manager/GM dashboards, Findings Review, Inspection Team, Reports Approval, CAP Monitoring, Checklist Management, Risk Dashboards, and table-first work queues. |
| `js/app.js` | Role-based navigation, centralized persistence, manager/GM interaction dispatch, PDF/CSV downloads, Cabin Inspection lifecycle transitions, simulated offline transitions, and stable ID generation. |
| `docs/demo-evidence/BUILD_SUMMARY.md` | This English canonical build summary. |
| `docs/demo-evidence/BUILD_SUMMARY.turkce.md` | Turkish companion summary for stakeholder handoff. |
| `docs/exec-plans/index.md` | Updated only if the active plan status / next todo changes. |
| `tests/*.test.js` | Focused smoke coverage for the Cabin Inspection path, Department/General Manager workspaces, lifecycle and authorization boundaries, valid PDF construction, responsive contracts, and demo boundaries. |

No backend, database, API, framework migration, real file storage, real AI
service, real regulatory ingestion, or real notification service was added.

---

## Role-based experiences and screens

The demo now frames the front end around three main role-based experiences:

1. **Inspector Workspace** — simple daily operations surface for assigned
   inspections, CAP reviews, and draft reports.
2. **Supervisor / Manager Dashboard** — performance, risk, workload, SSP, CAP
   oversight, surveillance planning, and executive visibility.
3. **Service Provider Portal** — the auditee-facing experience for findings,
   CAP submission, CAA-visible responses, and mock document/filename sharing.

The Admin Preview remains a demo administration surface for configuration and
template preview.

Experience details:

1. **CAA Manager** — Supervisor / Manager Dashboard, management oversight,
   surveillance plan, findings, organizations, reports, SSP/NASP, and CAP
   effectiveness.
2. **CAA Inspector** — Inspector Workspace, My Inspections home, audit
   execution, checklist runner, findings, CAP/evidence review, and draft report
   follow-up.
3. **Auditee (Fly Namibia)** — Service Provider Portal for own findings, CAP
   submission, evidence filename submission, CAA-visible comments, and closure
   status.
4. **Admin Preview** — templates, users, settings, audit log, and regulatory
   preview.

The Inspector home screen is now a simplified **My Inspections** workspace.
It removes the guardrail pill row, attention strip, and quick-action button row
from the primary surface. The first viewport now focuses on four KPI cards and
three plain tables: Assigned Inspections, CAP Reviews, and Draft Reports.

From **My Inspections**, the **Open** action for the canonical scenario leads to
the Fly Namibia **Cabin Inspection** execution workspace. It shows the six
source-derived Cabin sections, exact assignment/execution Question IDs,
per-Inspector assignment scope, compliance controls, comment boxes, mock
attachment names, and browser-local actions for download, draft save, and
one-time submission to Lead Inspector review.

The Lead Inspector assignment overview is presentation-ready: **Preview
Checklist**, **View Details**, and **View Team** open distinct modals backed by
the selected Cabin Inspection package. The checklist modal lists all six
runnable questions and configured references; scope shows the six sections,
location, duration, and the `126 source rows / 6 runnable questions` boundary;
team shows the Lead Inspector plus current Inspector workload. The shared asset
version was refreshed so an ordinary reload receives this state instead of the
older one-section Flight Operations surface.

The table-first pattern is also used for the audit work queue, findings and
CAP/evidence review queues, auditee requests, manager attention lists,
planning, checklist approvals, report approvals, organization and admin queues,
and the checklist runner. Checklist execution now behaves like an inspector
table with one selected question and one active detail panel.

The left navigation now uses grouped information architecture for Dashboard,
Oversight, Organisations, Findings & CAPs, Regulations, USOAP / SSP, Evidence &
Documents, Analytics, Knowledge Hub, and Administration, shown only where
appropriate for each role.

Frontend V2 screens added:

1. Safety Intelligence Dashboard
2. Organization Risk Profile
3. Regulatory Library
4. Dynamic Inspection Package Builder
5. Offline Field Inspection
6. USOAP Readiness Workspace
7. CAP Effectiveness
8. AI Inspector Assistant Panel
9. SSP/NASP Management Dashboard

Existing V1 workflow screens remain reachable: role select, manager dashboard,
inspector dashboard, audit plan calendar, audit detail, checklist runner,
finding detail, auditee My Findings, CAP form, evidence form/review, closure
report preview, admin template preview, organizations, users, settings, reports,
messages, and audit log.

---

## Primary Cabin Inspection scenario

The primary first-run story is now workbook-derived Cabin Inspection demo data:

1. CAA Manager sees the `2026 Cabin Inspection - Fly Namibia` plan.
2. CAA Inspector opens the Fly Namibia Cabin Inspection and runs the
   `Cabin Inspection` checklist.
3. Inspector marks the `EM EQ / PBE` checklist question `Non-Compliant`.
4. Lead Inspector converts `PF-2026-001` into `Finding CAB-2026-001`.
5. Fly Namibia submits root cause, corrective action, preventive action, target
   completion date, and mock evidence filenames.
6. Lead Inspector accepts the CAP; the finding remains
   `CAP Accepted - Evidence Required`.
7. Fly Namibia submits `Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf` as a mock
   filename.
8. Lead Inspector accepts evidence and the finding closes.

The source workbook profile is represented as a mock/configured checklist
source: 126 Cabin Inspection rows across `GALLEY`, `LAV`, `PAX SEAT`, `EM EQ`,
`VID+CREW SEAT`, and `COCKPIT+CAB GEN COND+EXITS`. The runnable demo uses a
curated 6-question subset for demo speed. The workbook is not a live import,
legal source, regulatory ingestion source, or production checklist repository.

---

## Backend-ready demo persistence

The demo now persists these mock items in `localStorage` under
`aviasurveil360:v2-demo-state`:

- created findings
- CAP submissions and CAP revision-shaped records
- mock evidence filenames and evidence version-shaped records
- AI accept/edit/reject decisions
- selected filters
- simulated offline outbox items

`localStorage` access is isolated in `js/data.js` behind `loadDemoState`,
`saveDemoState`, `clearDemoState`, `persistAfterAction`, and `initializeState`.
Views and modals call centralized action functions instead of using storage
directly. Records use stable IDs and explicit status values so a later backend
can replace the demo storage boundary with API calls with less UI rework.

This is still browser-only demo persistence. It is not production persistence,
authorization, audit storage, evidence chain-of-custody, or legal recordkeeping.

---

## Simulated offline behavior

The **Offline Field Inspection** screen includes a **Simulate offline** control.
When offline simulation is on, the inspector can save a mock field evidence
action. The action is stored in the **Offline Outbox** with:

```text
Internet unavailable - saved locally. It will sync automatically when connection returns.
```

When simulated online state returns, waiting outbox items move to
`synced_to_demo_state`, and the audit log records `Offline item synced (demo)`.
The UI labels this as **Offline simulated** and **No production sync**.

No service worker, encrypted local store, real attachment queue, mobile app,
conflict engine, or production offline sync was created.

---

## Regulatory trace pattern

A reusable **Regulatory Trace** display appears on V2 screens and relevant
existing surfaces. It shows mock source document/version, clause or PQ reference,
effective date, applicability reason, linked checklist/evidence, approval state,
and guardrails such as **Mock regulatory library** and **Not a legal decision**.

This is demo data only. It does not ingest real regulatory material and does not
create legal, enforcement, certificate, USOAP, or closure decisions.

---

## Guardrails shown in the UI

Advanced capabilities are visibly labeled as:

- `Demo data`
- `Mock regulatory library`
- `Offline simulated`
- `AI-generated draft - requires authorized review`
- `Not a legal decision`
- `Frontend-only demo - saved in this browser`
- `No production sync`
- `No real AI service`
- `No real regulatory ingestion`

The original product rules remain preserved:

- CAP accepted is not finding closure.
- A finding closes only after evidence acceptance or authorized closure.
- Auditee views do not show internal CAA notes, inspector workload, other
  organizations, internal risk scoring, regulatory governance data, or AI
  governance data.
- `Comment to Auditee` and `Internal CAA Note` remain separate.
- Mock uploads store/display filenames only.

---

## Verification results

Status: **verified locally** for the frontend-only Cabin Inspection scenario.

Automated syntax checks passed:

```bash
node --check js/data.js
node --check js/helpers.js
node --check js/approval.js
node --check js/planning.js
node --check js/checklists.js
node --check js/inspection.js
node --check js/reports.js
node --check js/work-items.js
node --check js/views.js
node --check js/app.js
```

All direct Node smoke tests under `tests/*.test.js` passed locally.

Browser smoke verification used the in-app Browser against the local static
server at `http://127.0.0.1:4173/index.html`. Direct `file://` navigation was
blocked by browser policy, so the local HTTP server was used for the rendered
prototype check. Console warnings/errors were empty.

Verified:

- role-select copy names `Finding CAB-2026-001` and `Cabin Inspection`
- audit calendar shows Fly Namibia `2026 Cabin Inspection - Fly Namibia` under `Cabin Safety`
- checklist runner opens the `EM EQ / PBE` question by default and shows the
  workbook section profile
- marking the PBE item `Non-Compliant` creates `PF-2026-001`
- Lead Inspector sees the pending potential finding and converts it to
  `CAB-2026-001` with `Level 1 Critical`, risk category
  `Emergency Preparedness`, and finding type `Equipment`
- Fly Namibia sees only its auditee portal data and submits CAP details
- accepting CAP does not close the finding; it moves to
  `CAP Accepted - Evidence Required`
- Fly Namibia submits mock evidence filename
  `Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf`
- accepting evidence closes `CAB-2026-001`
- Manager Dashboard shows `CAB-2026-001` as a recent closed scenario update,
  including CAP and evidence child rows
- `Comment to Auditee` and `Internal CAA Note` remain separate on review modals
- no backend, database, API, real authentication, real upload/storage, real
  regulatory ingestion, real AI service, production audit log, framework
  migration, or deployment was added

Final Cabin Inspection browser evidence summary:

```text
potentialFinding: PF-2026-001
convertedFinding: CAB-2026-001
afterConvert: WAITING_CAP
afterSubmitCap: CAP_SUBMITTED
afterAcceptCap: EVIDENCE_REQUIRED
afterSubmitEvidence: EVIDENCE_SUBMITTED
afterAcceptEvidence: CLOSED
managerDashboard: CAB-2026-001 visible as Closed with CAP/evidence rows
mockEvidenceFilename: Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf
console errors/warnings: []
browser preview: http://127.0.0.1:4173/index.html
```

### CAA Governance browser QA - 2026-06-29

Status: **desktop and mobile browser QA verified locally** for the CAA
Governance frontend-only demo lane.

The AviaSurveil360 Agent Harness Runbook was applied to the active CAA
Governance workflow lane. Verification kept the frontend-only demo boundary:
no backend, database, API, real authentication, real upload, real AI service,
real regulatory ingestion, real notification service, or production audit-log
readiness was added or claimed.

Syntax and deterministic smoke checks passed:

```bash
node --check js/data.js
node --check js/helpers.js
node --check js/approval.js
node --check js/planning.js
node --check js/checklists.js
node --check js/inspection.js
node --check js/reports.js
node --check js/views.js
node --check js/app.js
node tests/approval-smoke.test.js
node tests/checklist-approval-smoke.test.js
node tests/checklist-management-smoke.test.js
node tests/governance-render-smoke.test.js
node tests/inspection-execution-smoke.test.js
node tests/planning-render-smoke.test.js
node tests/planning-release-smoke.test.js
node tests/report-approval-smoke.test.js
node tests/audit-work-queue-smoke.test.js
node tests/demo-boundary-smoke.test.js
```

Desktop browser click-through verified these governance paths locally:

- Department Manager, General Manager, Finance Review, and Executive Director
  planning approval chain through final `Approved` state.
- General Manager checklist approval for `CL-FOPS-v2.4`.
- Lead Inspector -> Department Manager -> General Manager intermediate review
  -> Executive Director final decision through `Final Report Issued` and
  `Final Report Locked`.
- Inspector `Audit Work Queue` and `Offline Field Inspection` demo boundary.
- Auditee portal isolation: no visible `Internal CAA Note` or `Inspector
  Workload`.
- Admin `Question Bank` with configured references and expected evidence.

Local screenshot evidence was captured under
`/private/tmp/aviasurveil360-governance-qa/`:

- `01-login-desktop.png`
- `02-planning-approved-desktop.png`
- `03-planning-ready-desktop.png`
- `04-checklist-approved-desktop.png`
- `05-final-report-locked-desktop.png`
- `06-inspector-work-queue-desktop.png`
- `07-offline-field-desktop.png`
- `08-auditee-portal-desktop.png`
- `09-admin-question-bank-desktop.png`
- `10-mobile-planning-approval-verified.png`

Mobile Planning Approval rerun:

- `10-mobile-planning-approval.png` is **not accepted** as Planning Approval
  visual evidence. It captured the Manager Dashboard while a weak assertion
  matched hidden navigation text.
- The approved rerun captured
  `/private/tmp/aviasurveil360-governance-qa/10-mobile-planning-approval-verified.png`
  through `http://127.0.0.1:4360/` at a 390px mobile viewport.
- The accepted evidence used visible content, not hidden navigation text:
  `Planning Approval — PLAN-2026-Q3-OPS` was visible in the viewport, the
  `Q3 Flight Operations Surveillance Plan` dossier was visible, console
  warnings/errors were empty, and mobile scrollWidth/clientWidth was `390/390`.
- The former blocker note is closed in
  `docs/exec-plans/completed/2026-06-29-governance-browser-qa-mobile-blocker.md`.

Visual QA polish follow-up completed: the report approval progress card now uses
the compact approval rail variant in the sidebar, so longer governance labels
such as `Department Manager` remain readable without changing the approval
workflow. Local headless Chrome QA with a temporary browser profile verified the
report approval page, compact rail class, `Department Manager` label at
`247px × 17px`, and no desktop horizontal overflow (`1280/1280`). Screenshot:
`/private/tmp/aviasurveil360-report-approval-compact.png`.

### Planning panel simplification - 2026-06-30

Status: **frontend-only Planning panel update verified locally**.

The demo now has a single `Planning` panel for Department Manager, General
Manager, Finance Review, Executive Director, and relevant Lead Inspector audit
preparation work. The prior split between Planning Board and Planning Approvals
is kept only as compatibility wrappers for existing links/tests; it is no
longer exposed as separate top-level user-facing navigation.

The current planning approval chain is `Department Manager -> Finance Review ->
GM Review -> Executive Director`. Finance and GM revision returns go to
Department Manager, and a corrected submission must pass Finance again. After
Executive Director approval, the Planning
panel visibly continues to `GM Release to Department`, Department Manager
acceptance, Lead Inspector assignment, team/date/resource proposal, Department
Manager confirmation, and `Ready for Execution`.

`Audit Work Queue` remains the inspector/audit execution queue. It is not a
separate planning governance module.

This remains mock/demo behavior only: no backend, real authentication, real
authorization service, real finance integration, real upload/storage, e-signature
service, or document-generation service was added.

Rendered browser smoke used a temporary local static server at
`http://127.0.0.1:8765/`; console warnings/errors were empty and desktop
scrollWidth/clientWidth stayed `1280/1280` on the Planning workspace and Audit
Work Queue evidence screens.

### Table-first surveillance workbench UX - 2026-07-01

Status: **verified locally** for the frontend-only table-first workbench
update.

The demo now prioritizes operational tables over card stacks on changed queue
surfaces. Rows preserve existing navigation to detail pages and carry the
current owner, next action, due date/target, status, severity/priority, related
audit/organization context where allowed, and row-level actions. CAP/evidence
child rows are shown without changing the underlying lifecycle rules.

Product guardrails verified:

- CAP accepted is still not closure; accepted CAP rows say evidence is still
  required before closure.
- Evidence version history remains visible as preserved versions, not
  overwritten records.
- Auditee users see only Fly Namibia portal data and do not see internal CAA
  notes, other organizations, inspector workload, or internal risk scoring.
- Oversight Health Index remains a management indicator only and does not
  trigger automatic enforcement, suspension, or closure.
- No backend, database, API, real authentication, real file upload/storage,
  real AI service, real regulatory ingestion, real notification service,
  framework migration, branch, commit, or push was added.

Additional local checks passed:

```bash
node tests/table-first-workbench-smoke.test.js
node tests/checklist-comment-render-smoke.test.js
node tests/inspector-nav-smoke.test.js
node tests/lead-inspector-nav-smoke.test.js
node tests/lead-inspector-workspace-smoke.test.js
```

Browser QA used the in-app Browser against a temporary static server at
`http://127.0.0.1:8765/`. Direct `file://` navigation was blocked by browser
policy, so the local HTTP server was used as the safer static preview path.
Verified row-click navigation from `Audit Work Queue` to `AUD-2026-001`,
checklist Q2 non-compliant -> `PF-2026-001`, auditee portal isolation,
manager OHI guardrail text, and no page-level horizontal overflow at desktop
or 390px mobile viewport. Current table-first screenshot evidence is under
`qa/screenshots/table-first-2026-07-01/` (ignored by git).

### Deeper table-first workbench simplification - 2026-07-02

Status: **verified locally** for the frontend-only deeper table-first pass.

This pass removed remaining card/dashboard duplication around the shared work
item row and fixed the two known layout defects from the 2026-07-02 screenshot
QA set. Changed files: `css/styles.css`, `js/views.js`, `js/work-items.js`.
No new tracked files were added, so `MANIFEST.md` did not change.

Screen changes:

- **Inspector My Inspections** — simplified the primary inspector surface to
  four KPI cards plus Assigned Inspections, CAP Reviews, and Draft Reports
  tables. The guardrail pills, attention strip, and quick-action row are hidden
  on this home screen.
- **Audit Work Queue** — removed the redundant attention strip; the
  Active/Completed filter chips now carry the row counts directly.
- **Checklist Runner** — replaced the progress card with a one-line progress
  band (demo-scenario hint kept as small text). On mobile the active question
  panel now renders above the question table.
- **Finding dossier** — the next-action band now shows the Due Date; the
  lifecycle stepper is an unboxed strip with the closure-rule note; removed a
  dead duplicate Internal CAA Notes render block (the gated panel remains the
  single render path).
- **Auditee My CAA Requests** — attention pills reduced to the four the
  auditee can act on (CAP required, Evidence required, Due Soon, Overdue); the
  page purpose now states "What the CAA needs from your organization, and by
  when."
- **Manager Dashboard** — the OHI guardrail callout box is now a one-line
  guardrail note with unchanged wording.
- **Organization Risk Profile** — restructured to a single risk header band
  (score, band, drivers, regulatory trace, operating-context facts) with
  full-width Findings and Audit History tables. This fixed the only desktop
  1920px horizontal overflow in the 2026-07-02 QA set.
- **Shared work item row** — removed the `Lifecycle` column, which duplicated
  the `Status` column on nearly every queue; risk-band values that were unique
  moved into row subtitles. Status badges and priority pills now wrap inside
  their cells instead of overflowing.

Mobile pattern: below 640px, shared work-queue tables render as stacked rows
that keep the table concept — priority rail, priority pill and status badge,
item title, bold next action, due text, and the row action button. Owner shows
only when present; organization and other secondary fields stay one tap away
in the row's detail page. Row click still opens the same detail routes.

Verification (verified locally):

- `node --check` passed for all `js/*.js` files.
- All 17 Node smoke tests under `tests/` passed, including
  `table-first-workbench-smoke`, `demo-boundary-smoke`, and
  `checklist-comment-render-smoke`.
- The old table-first lifecycle smoke path was superseded by the Cabin
  Inspection scenario documented above: `PF-2026-001` converts to
  `CAB-2026-001`, CAP acceptance leaves evidence required, and evidence
  acceptance closes the finding with preserved evidence versions.
- Auditee privacy re-verified: no `Internal CAA Note`, no other organizations,
  no inspector workload, no internal risk scoring in the portal render.
- Fresh Playwright screenshot set captured after the changes:
  `qa/screenshots/playwright-2026-07-02/` (ignored by git) — 70 routes x
  desktop 1920x1080 and mobile 390x844, 140 captures, 0 capture errors,
  0 console warnings/errors, 0 desktop overflow (previously 1), 0 mobile
  overflow.

Known remaining UX notes (not blockers): bespoke admin/config tables
(question bank, regulatory library, audit log, users) still use horizontal
scrolling on mobile rather than stacked rows; closed rows show a `Closed`
priority pill and a `Closed` status badge, which is intentional but slightly
repetitive.

### Department and General Manager workspaces - 2026-07-10

Status: **verified locally** for the frontend-only demo; production readiness
is not claimed.

The Department Manager now has exactly eight routes: Dashboard, Audits,
Reports Approval, Risk Dashboard, Inspection Team, Findings Review, CAP
Monitoring, and Checklist Management. The General Manager has exactly five:
Dashboard, Report Approvals, Departments, Risk Dashboard, and Settings.

Verified Department Manager behavior includes Fly Namibia Findings Review,
manager-scoped team/member/schedule/message actions, separate Preliminary and
Final Report decisions, browser-generated Final Report, Executive Summary, and
Team Assignment PDFs, CAP Monitoring with a five-tab ellipsis drawer,
browser-local checklist package/version/section/question management, and risk
filters/CSV export. CAP acceptance does not close a Finding. Department Manager
Final Report approval only forwards the report and does not issue or lock it.

Verified General Manager behavior includes the restricted Dashboard,
Departments and cross-department Risk views, required-comment return, and an
intermediate advance to Executive Director. The later remediation described
below supersedes the former GM-final-authority behavior: GM cannot issue, sign,
or lock a Final Report.

Fresh verification evidence:

- 11 focused manager smoke tests passed, including responsive and PDF tests.
- `node --test tests/*.test.js`: 31 tests passed, 0 failed.
- `node --check` passed for every top-level `js/*.js` file.
- `node tests/demo-boundary-smoke.test.js` and `git diff --check` passed.
- In-app Browser interaction passed at `1536x864` and `390x844`; changed paths
  had zero console warnings/errors and no measured page-level mobile overflow.
- Reference/current visual comparisons passed with no open P0/P1/P2 finding;
  the evidence ledger is `design-qa.md` with `final result: passed`.
- The three fresh downloads were PDF 1.4, one A4 page, unencrypted, and clean
  under `/usr/bin/file`, bundled `pdfinfo`, sequential render, and visual
  inspection.

These are mock, browser-local controls and artifacts. No backend, database,
API, real authentication/authorization enforcement, real file storage, real
notification delivery, production reporting engine, e-signature, framework
migration, or deployment was added.

### Inspector, report, Service Provider, and governance remediation - 2026-07-10

Evidence status: **demo-only** and **verified locally**. External production,
release, real-identity, legal-signature, enforcement-execution, and deployment
evidence: **not run**. **production-readiness not claimed**.

Implemented and locally verified:

- Lead Inspector can add active internal Inspectors, prevent duplicates, assign
  separate Cabin questions to different team members, preserve those mappings
  by Audit ID and Question ID, and release demo notifications to assignees.
- Inspector execution resolves the selected Fly Namibia Cabin Inspection and
  its six source-derived sections. First submission stores one timestamp,
  remains in the Inspector role, opens the success/status modal, preserves a
  read-only submitted checklist, and returns to My Assignments without a Lead
  Inspector redirect.
- Preliminary Reports open existing Report IDs into the same
  `Inspection & Findings` workflow, with Findings Review visible and selected
  identity stable through list, detail, and preview navigation.
- Service Provider navigation is limited to Corrective Actions (CAP),
  Preliminary Reports, Final Reports, Messages, Documents, and Settings.
  List/detail/preview/download selectors remain Fly-Namibia-scoped; Internal
  CAA Notes, enforcement deliberations, internal risk, workload, other
  organizations, and unreleased reports do not render.
- Finance lands on one Finance Review workspace with only Approve Budget and
  Return for Revision. Under the current corrected contract, approval advances
  to GM Review; return goes to Department Manager, and Finance cannot sign or
  release the plan.
- Executive Director has Dashboard, Planning, Final Reports, Notifications,
  and Settings. Plan approval uses `Approve & Sign (Demo)` and retains
  `GM / Release to Department` as the next action. ED is the only role that may
  apply the mock approval mark and issue/lock an eligible Final Report.
- Final Report review, template, preview, print, and browser-generated demo PDF
  resolve the selected report/audit/team/Finding state. Enforcement choices are
  recommendation/referral-only and have no sanction or closure side effect.
- CAP acceptance remains distinct from Finding closure; report approval does
  not bypass required CAP, Evidence, or verification work.

Verification evidence (**verified locally**):

- `node --check` passed for every `js/*.js` file.
- `node --test tests/*.test.js`: 34 tests passed, 0 failed.
- Focused Service Provider, Finance, Executive Director, assignment,
  Inspector submission, report identity/authority, PDF, responsive, and demo
  boundary tests passed.
- `git diff --check` passed.
- In-app Browser QA passed at `1536x864`, `1366x768`, `1024x768`, and
  `390x844`: no console warnings/errors, no measured page-level horizontal
  overflow, no clipped primary controls, correct mobile task order, stable
  selected IDs, and working state/navigation/modal/preview/download actions.
- Browser/test cleanup found no leftover temporary HTTP server or separately
  launched test Chrome process.

Evidence explicitly **not run**: a backend or database integration; real
authentication/authorization; real signature identity or legal validity;
immutable production audit logging; real file storage; notification delivery;
production report service; real enforcement execution; release, deployment,
penetration, accessibility-certification, or stakeholder-acceptance testing.
The open production signing/enforcement authority contract remains tracked in
`docs/exec-plans/tech-debt-tracker.md`.

### Stakeholder readiness final remediation checkpoint — 2026-07-10

Status at this checkpoint: **demo-only**. Canonical report identity, GM/ED authority, Service Provider organization privacy, state-backed Lead Final paths, exact Preliminary decisions, exact assignment/execution IDs, responsive static containment, modal focus containment, and changed visible-control behavior are **verified locally** by focused Node/static checks. The exact assignment package now uses all six Cabin execution Question IDs, and another Inspector's assigned question renders read-only. `PR-2026-018` and `FR-2026-018` are distinct canonical artifacts; report decisions mutate only the selected artifact.

Fresh final gates are **verified locally**: all top-level `js/*.js` files passed `node --check`; all 18 focused commands named by Tasks 1-8 passed individually; `node --test tests/*.test.js` passed 44/44 with 0 failed, cancelled, skipped, or todo; and `git diff --check` passed.

Fresh isolated rendered QA for this remediation checkpoint is **verified locally** at `1536x864`, `1366x768`, `1024x768`, and `390x844`. Page width matched each viewport, the remediated report containers had no measured nested horizontal overflow, primary actions were not clipped, and console warnings/errors were zero. The rendered flow exercised Department Manager -> GM -> Executive Director handoff, GM return validation and forward-only authority, ED preview/referral/reject/return validation and issue, open-Finding preservation, exact six-question multi-Inspector assignment/release, Inspector scoped execution/submission, and all six Service Provider routes. `FR-2026-018` remained selected through Lead list/readiness/preview and the browser PDF action reported `Fly_Namibia_Final_Report_FR-2026-018.pdf`. The generated PDF lines and canonical selected content are also covered by focused Node tests. Attachment-modal focus stayed trapped, Escape closed it, and focus returned to `Manage Attachments`. The isolated browser tabs and local QA server were closed after verification; the cleanup process search found no separately launched QA process residue.

External production, release, identity, legal-signature, enforcement, deployment, real-device, and external stakeholder-acceptance evidence remains **not run**. This is **demo-only**; **production-readiness not claimed**.

### Stakeholder feedback remediation checkpoint — 2026-07-15

Evidence status: **demo-only** and **verified locally**. This checkpoint does
not claim production readiness.

All nine stakeholder items are implemented in the frontend-only demo:

1. Inspector My Assignments now begins with operational KPIs, filters, and the
   assignment table; the redundant Next Inspection dossier is removed.
2. Lead Preliminary Inspection & Findings stays inside its workflow frame at
   desktop, tablet, and mobile widths.
3. Preliminary Finding content no longer shows CAP/lifecycle status, while the
   report-level Draft/Review status remains visible.
4. Preliminary attachment filenames and descriptions wrap without overlap.
5. Final Report organization/CAP and key-Finding metrics use a compact overview.
6. Reset state selects decision-ready GM report `FR-2026-021` for
   `AUD-2026-002` / SkyCargo Air; open, return validation, and forward work.
7. Reset state selects decision-ready ED report `FR-2026-022` for
   `AUD-2026-003` / BlueWing Aviation and exposes Approve, Return, Reject, and
   recommendation-only Enforcement Review referral.
8. Planning now follows `Department Manager -> Finance Review -> GM Review ->
   Executive Director`. Finance and GM revision returns go to Department
   Manager, and a corrected plan must pass Finance again.
9. Reset state shows `PLAN-2026-Q3-CABIN` with a reconciled USD 12,500 sample
   budget in Finance Review. Finance approval advances to GM, GM forwards to
   ED, and ED approval leaves `GM Release to Department` as the next action.

Identity and authority boundaries remained intact. GM forwarding does not
issue, mock-sign, or lock a Final Report. ED approval issued and locked only
the exact selected `FR-2026-022` artifact with a demo mock approval mark, kept
its one open Finding open, and returned ownership to `BlueWing Aviation Service
Provider Portal`. CAP acceptance remains separate from Finding closure;
report approval does not bypass CAP, Evidence, verification, or an authorized
closure path. Enforcement referral remains recommendation-only. Pre-v9
browser-local state migration inserts the Finance stage without overwriting
unrelated saved records or advancing an unreviewed budget past Finance.

Fresh automated evidence (**verified locally**):

- All 11 `js/*.js` files passed `node --check`.
- All 15 focused Task 7 commands passed individually. The direct stakeholder
  regression command passed 21/21.
- `node --test tests/*.test.js` passed 55/55 with 0 failed, cancelled, skipped,
  or todo tests.
- `git diff --check` passed.

Fresh isolated in-app Browser QA is **verified locally** at `1536x864`,
`1366x768`, `1024x768`, and `390x844`. The Inspector, Lead Preliminary and
Final, GM, ED, Finance, and Service Provider flows rendered meaningful content
with exact IDs stable through decisions and state changes. Page width matched
the viewport; relevant nested tables/cards had no horizontal overflow; primary
controls, status, filenames, descriptions, and decision panels were not
clipped or overlapping; no framework overlay appeared; and relevant console
warning/error count was zero. Finance return moved the plan to Department
Manager; Finance approval, GM forward, ED approval, and post-ED GM Release were
exercised. Service Provider DOM remained Fly Namibia-scoped and did not expose
SkyCargo Air, BlueWing Aviation, `FR-2026-021`, `FR-2026-022`, Internal CAA
Notes, Inspector workload, or internal risk. Browser tabs and the isolated
server were closed; cleanup found no task-owned test process residue.

External production, release, deployment, real-device, real identity/signature,
real authorization, backend/database, real upload/storage, real notification,
production reporting/audit-log, enforcement-execution, legal/regulatory, and
stakeholder sign-off evidence is **not run**. This remains **demo-only**;
**production-readiness not claimed**.

### Department planning command-center checkpoint — 2026-07-17

Evidence status: **demo-only** and **verified locally**. The Department Manager
now has Planning in both the sidebar and dashboard task workspace, bringing the
manager navigation to nine task-based routes. The shared Planning screen now
uses a compact Planning Command Center for General Manager and Department
Manager instead of repeating a shallow command card and a second oversized plan
hero. It exposes the plan basis, organization and department, risk driver,
budget and proposed inspectors, target and readiness, current owner, next
action, blocking reason, and the configured Department Manager -> Finance
Review -> GM Review -> Executive Director decision path in one hierarchy.

The generic eight-column Planning Workbench table is replaced by a compact
Planning Queue with white status rows, semantic left rails, inline queue totals,
clear decision context, month targets, and one role-aware action per request.
Reset state now seeds three distinct department requests: Cabin Safety waiting
for Finance, Flight Operations waiting for GM, and Airworthiness returned to
Department Manager for revision. Selecting any row updates the Command Center,
selected state, target plan and relevant Overview or Approval tab; legacy
single-row browser state is migrated into this three-department queue.

Overview continues to expose the seeded budget allocation, available plan
budget, remaining annual budget, resource lines, proposed team, and preparation
details without repeating the approval rail. Role-aware approval, release,
preparation, history, mock-only boundaries, and client-side persistence remain
unchanged.

Fresh automated evidence (**verified locally**):

- All 11 `js/*.js` files passed `node --check`.
- `node --test tests/*.test.js` passed 60/60 with 0 failed, cancelled, skipped,
  or todo tests.
- Focused manager navigation, Planning workspace, rendering, responsive, table,
  and General Manager smoke checks passed.
- `git diff --check` passed.

Fresh in-app Browser QA is **verified locally** for General Manager and
Department Manager Planning at the accepted concept's native `1495x1052` size
and at `390x844`. Page width matched the viewport, all three queue rows rendered
without measured horizontal overflow, responsive rows collapsed to one column,
and queue actions retained a 44 px minimum height. Department Manager Planning
was present in both sidebar and dashboard task navigation. Selecting Flight
Operations updated the Command Center; the GM `Review now` action and Department
Manager Airworthiness `Review & submit` action both opened the selected plan's
Approval tab. Browser console warning/error count was zero.

Backend/database integration, real authorization, production audit logging,
real document storage, notification delivery, deployment, real-device,
accessibility certification, and stakeholder sign-off remain **not run**.
This remains **demo-only**; **production-readiness not claimed**.

---

## Mocked items and limitations

- Role selection is not authentication.
- Browser persistence is not production storage.
- Mock evidence captures filenames only; no files are read or uploaded.
- Regulatory library content is mock/source-shaped only.
- USOAP readiness is not an official ICAO assessment and does not claim EI improvement.
- SSP/NASP supports monitoring only; it is not an automatic state safety determination.
- AI suggestions are drafts only and cannot publish official outputs.
- Offline outbox is simulated and is not a mobile/offline-ready implementation.
- Audit log is demo state, not immutable audit evidence.
- README/MANIFEST now describe the current planning pack plus frontend-only
  static clickable demo shape; production-readiness is still not claimed.
