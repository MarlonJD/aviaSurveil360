# AviaSurveil360 — Demo-Only Prototype Plan

- **Date:** 2026-06-14
- **Status:** active
- **Owner:** Prototype build (frontend demo)
- **Type:** Prototype execution plan (demo-first)
- **Authority:** `AGENTS.md` (root) is authoritative. This plan obeys the
  Demo-First Rule and Prototype Guidance.

## Objective

Build a frontend-only, clickable demo of AviaSurveil360 that lets stakeholders
walk the full oversight lifecycle in under five minutes:

`Audit Plan -> Checklist -> Finding -> CAP -> Evidence -> CAA Review -> Closure -> Dashboard update`

The demo must make the core differentiator obvious: it replaces ad-hoc email
follow-up with a traceable CAA–auditee workflow, and it must enforce the rule
that **CAP acceptance is not finding closure**.

## Scope

In scope (HTML + CSS + Vanilla JS, mock data, client-side state only):

- Four demo roles with a role switch / login demo screen:
  `CAA Manager`, `CAA Inspector`, `Auditee`, `Admin Preview`.
- Role-based, task-first navigation (no heavy enterprise menus).
- Required screens:
  1. Role Switch / Login Demo
  2. Manager Dashboard (KPIs + Oversight Health Index, indicator only)
  3. Inspector Dashboard
  4. Audit Plan Calendar (2026 surveillance plan)
  5. Audit Detail
  6. Checklist Runner
  7. Finding Detail with lifecycle stepper
  8. Auditee My Findings
  9. CAP Submission Form
  10. Evidence Upload / Review
  11. Closed Finding / Report Preview
  12. Admin Checklist Template Preview
- Live demo scenario producing `Finding OPS-2026-001` and closing it after
  evidence acceptance.
- Mock notifications (in-UI), mock uploads (file name only), mock report
  preview, and a client-side audit log for critical actions.
- KPI / dashboard values computed from client-side state so they update after
  closure.

## Assumptions

- Single-page app with client-side view switching; opened directly via
  `file://` or a simple static server. No build tooling, no frameworks.
- Plain `<script>` tags (no ES modules) so the demo runs from `file://`
  without CORS issues.
- One auditee organization (`Airline XYZ`) is the logged-in auditee; other
  organizations exist only to give the Manager realistic aggregate numbers and
  are never visible to the auditee.
- Severity vocabulary: `Level 1 Critical`, `Level 2 Major`, `Level 3 Minor`,
  `Observation`. Lifecycle language: `Due Date`, `Target`, `Due Soon`,
  `Overdue` (no heavy SLA module).
- Regulatory text is shown as `regulatory reference` / `expected evidence` /
  `finding basis`, not legal advice.
- "Today" for due-date math is the demo date 2026-06-14.

## Out Of Scope (explicit)

No backend, database, API, real authentication, real file upload, real
email/SMS/notification service, real document storage, production architecture,
advanced BI/report builder, offline mobile app, payment integration,
e-signature, QR cryptographic validation, full admin workflow engine, and no
framework migration. The Oversight Health Index is a management indicator only
and triggers no automatic enforcement, suspension, or closure.

## Stages / Phases

1. **Plan + index** (this file) and create `docs/exec-plans/index.md`.
2. **Shell + mock data**: `index.html`, `css/styles.css`, `js/data.js`
   (organizations, audits, checklist template, findings, CAP, evidence,
   notifications, audit log) and the client-side `state` + reset.
3. **Role switch, navigation, dashboards**: login/role switch, role-based
   sidebar, Manager / Inspector / Auditee dashboards with computed KPIs.
4. **Lifecycle screens**: Audit Plan Calendar, Audit Detail, Checklist Runner
   (Non-Compliant -> finding form -> issue `OPS-2026-001`), Finding Detail with
   six-step lifecycle stepper, CAP Submission Form, Evidence Upload, Evidence
   Review (Accept / Reject / Request More Information), Closed Finding / Report
   Preview, Admin Checklist Template Preview.
5. **Verify + document**: run locally, clear console errors, walk the full
   scenario, write `docs/DEMO_BUILD_SUMMARY.md`, update the plan index.

## Verification

- Open `index.html`; confirm no console errors on load and on each navigation.
- Manager Dashboard shows the 2026 plan and KPIs/OHI.
- Inspector opens the Airline XYZ Operator Audit, runs the Flight Operations
  checklist, marks `Are crew training records complete and up to date?` as
  `Non-Compliant`, and issues `Finding OPS-2026-001`.
- Auditee (Airline XYZ) sees only its own findings, submits CAP (root cause,
  corrective action, preventive action, target completion date, responsible
  person) and uploads mock evidence.
- Inspector accepts the CAP, then reviews and accepts the evidence; the finding
  closes only at evidence acceptance (CAP acceptance alone must not close it).
- Manager Dashboard KPIs update (open down, closed up, OHI recomputed).
- Confirm the auditee never sees `Internal CAA Note`, inspector workload, other
  organizations, or internal risk scoring.
- Confirm terminology consistency (`Finding`, `CAP`, `Evidence`, `Due Date`,
  `Target`, `Overdue`, `Auditee`, `CAA Inspector`, `CAA Manager`,
  `Internal CAA Note`, `Comment to Auditee`).

## Risks

- **Scope creep into real backend/integrations** — mitigation: hard guardrails
  above; everything is mock + client state.
- **Lifecycle shortcut** that closes a finding at CAP acceptance — mitigation:
  closure action is gated on accepted evidence (or an explicit, audit-logged
  authorized closure path).
- **Auditee data leakage** — mitigation: auditee views filter strictly to
  `Airline XYZ` and never render internal-only fields.
- **Single-file fragility** — mitigation: small, separated JS files; smoke test
  every screen and reset.

## Dependencies

- Source-of-truth docs already in `docs/` (scenario, screen specs,
  status/permission rules, KPIs, UX principles). No external services.

## Ownership Boundaries

- This plan owns only the demo prototype (`index.html`, `css/`, `js/`) and the
  two demo docs (`docs/DEMO_BUILD_SUMMARY.md`, this plan + index).
- It must not modify numbered source/reference docs under `docs/0X_*`.
- It must not initialize git, branch, commit, or push.

## Execution Prompt

```
Build ONLY the AviaSurveil360 frontend clickable demo using HTML, CSS and
Vanilla JavaScript with mock data and client-side state. No backend, database,
API, real auth, real upload, real email/notification, real storage, BI builder,
offline app, or framework. Read AGENTS.md first (authoritative).

Create a single-page demo (plain <script> tags, runnable from file://) with:
index.html, css/styles.css, js/data.js (mock orgs, audits, Flight Operations
checklist, findings, CAP, evidence, notifications, audit log + client state),
plus js helpers/views/app for rendering and routing.

Roles: CAA Manager, CAA Inspector, Auditee, Admin Preview, chosen on a role
switch / login demo screen, with role-based task-first navigation.

Screens: Role Switch, Manager Dashboard (KPIs + Oversight Health Index as an
indicator only), Inspector Dashboard, Audit Plan Calendar (2026 plan), Audit
Detail, Checklist Runner, Finding Detail with a six-step lifecycle stepper
(Finding issued -> CAP submitted -> CAP accepted -> Evidence submitted ->
Evidence verified -> Closed), Auditee My Findings, CAP Submission Form,
Evidence Upload, Evidence Review, Closed Finding / Report Preview, Admin
Checklist Template Preview.

Drive this scenario end to end: Manager sees the 2026 plan; Inspector opens the
Airline XYZ Operator Audit, runs the Flight Operations checklist, marks "Are
crew training records complete and up to date?" Non-Compliant, and issues
Finding OPS-2026-001; Auditee (Airline XYZ) submits root cause, corrective
action, preventive action, target completion date and uploads mock evidence;
Inspector accepts the CAP and then accepts the evidence; the finding closes only
on evidence acceptance; the Manager dashboard updates.

Enforce: CAP accepted != finding closed; every finding shows owner, due date,
status and next action; auditee never sees Internal CAA Note, inspector
workload, other organizations or internal risk scoring; separate "Comment to
Auditee" from "Internal CAA Note"; use Due Date / Target / Due Soon / Overdue
language (no heavy SLA); mock uploads show file name only; mock notifications
are in-UI; report generation is a preview screen; a client-side audit log
records critical actions.

Then run locally, fix console errors, and write docs/DEMO_BUILD_SUMMARY.md
(changed files, mocked items, screens implemented, known limitations,
stakeholder feedback questions). Do not claim production readiness.
```
