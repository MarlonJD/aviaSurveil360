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
| `index.html` | Demo ribbon now states frontend-only browser persistence and the asset query token was bumped for the Cabin Inspection scenario update. |
| `css/styles.css` | V2 responsive UI for role-based workspaces, simplified Inspector My Inspections home, simplified Inspector chrome, SMS checklist workspace, regulatory trace ribbons, governance panels, offline outbox, AI draft controls, and 390px mobile behavior. |
| `js/data.js` | Backend-ready mock records, the workbook-derived Cabin Inspection seed checklist, status values, and isolated `localStorage` demo storage helpers. |
| `js/helpers.js` | Selectors, status helpers, Cabin/PBE regulatory trace lookups, outbox helpers, and demo badge helpers. |
| `js/work-items.js` | Shared table-first work-item shaping for audits, findings, CAP/evidence child rows, approvals, planning items, and admin queues. |
| `js/views.js` | Existing screens plus Cabin Inspection checklist runner copy, Lead Inspector potential finding decisions, Service Provider Portal framing, reusable Regulatory Trace display, and table-first work queues. |
| `js/app.js` | Role-based experience navigation, centralized persistence calls, Cabin Inspection finding/CAP/evidence transitions, simulated offline transitions, AI decision transitions, stable ID generation, and checklist row selection. |
| `docs/demo-evidence/BUILD_SUMMARY.md` | This English canonical build summary. |
| `docs/demo-evidence/BUILD_SUMMARY.turkce.md` | Turkish companion summary for stakeholder handoff. |
| `docs/exec-plans/index.md` | Updated only if the active plan status / next todo changes. |
| `tests/*.test.js` | Focused smoke coverage updated for the Cabin Inspection hero path, checklist management, lifecycle transitions, demo boundaries, and existing workbench/governance surfaces. |

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
3. **Auditee (FlyNamibia)** — Service Provider Portal for own findings, CAP
   submission, evidence filename submission, CAA-visible comments, and closure
   status.
4. **Admin Preview** — templates, users, settings, audit log, and regulatory
   preview.

The Inspector home screen is now a simplified **My Inspections** workspace.
It removes the guardrail pill row, attention strip, and quick-action button row
from the primary surface. The first viewport now focuses on four KPI cards and
three plain tables: Assigned Inspections, CAP Reviews, and Draft Reports.

From **My Inspections**, the **Open** action now leads to a simplified
Inspector-only **SMS Oversight Audit** workspace. It shows the audit title,
SkyCargo-style SMS checklist summary, checklist sections, compliance controls,
comment boxes, attached-file names, and demo-only actions for downloading the
checklist, saving a draft, and submitting to the Lead Inspector. These actions
remain frontend-only and record only demo state / in-UI messages.

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

1. CAA Manager sees the `2026 Cabin Inspection - FlyNamibia` plan.
2. CAA Inspector opens the FlyNamibia Cabin Inspection and runs the
   `Cabin Inspection` checklist.
3. Inspector marks the `EM EQ / PBE` checklist question `Non-Compliant`.
4. Lead Inspector converts `PF-2026-001` into `Finding CAB-2026-001`.
5. FlyNamibia submits root cause, corrective action, preventive action, target
   completion date, and mock evidence filenames.
6. Lead Inspector accepts the CAP; the finding remains
   `CAP Accepted - Evidence Required`.
7. FlyNamibia submits `FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf` as a mock
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
- audit calendar shows FlyNamibia `2026 Cabin Inspection - FlyNamibia` under `Cabin Safety`
- checklist runner opens the `EM EQ / PBE` question by default and shows the
  workbook section profile
- marking the PBE item `Non-Compliant` creates `PF-2026-001`
- Lead Inspector sees the pending potential finding and converts it to
  `CAB-2026-001` with `Level 1 Critical`, risk category
  `Emergency Preparedness`, and finding type `Equipment`
- FlyNamibia sees only its auditee portal data and submits CAP details
- accepting CAP does not close the finding; it moves to
  `CAP Accepted - Evidence Required`
- FlyNamibia submits mock evidence filename
  `FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf`
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
mockEvidenceFilename: FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf
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
- Lead Inspector -> Department Manager -> Executive Director / GM report
  approval chain through `Final Report Issued` and `Final Report Locked`.
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

The `Department Manager -> GM -> Finance Review -> Executive Director` planning
approval chain is preserved. After Executive Director approval, the Planning
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
- Auditee users see only FlyNamibia portal data and do not see internal CAA
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
