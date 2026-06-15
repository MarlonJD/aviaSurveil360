# AviaSurveil360 — Demo Build Summary

**Build type:** Frontend-only clickable demo for stakeholder feedback.
**Stack:** HTML + CSS + Vanilla JavaScript. Mock data and client-side state only.
**Not production-ready.** No backend, database, API, real authentication, real file
upload, real email/SMS/notification service, real document storage, BI builder,
offline app, payment, e-signature, or framework. Every "save", "upload", "send"
and "report" is simulated in the browser.

**Demo date context:** the app treats `15 June 2026` as "today" so Due Soon /
Overdue math is deterministic.

---

## How to run

From the project root, serve the folder with any static server and open it, e.g.:

```
python3 -m http.server 4360
# then open http://localhost:4360/
```

Or simply open `index.html` directly in a browser (it runs from `file://` —
plain `<script>` tags, no modules, no build step). Use **Reset demo** (top-right)
to return to the starting state at any time.

---

## Changed / added files

| File | Purpose |
|---|---|
| `index.html` | App shell: demo ribbon, app root, toast host, modal host, script includes. |
| `css/styles.css` | All styling — restrained navy/slate CAA palette, dashboards, lifecycle stepper, report sheet, modals, responsive rules. |
| `js/data.js` | Mock data + client state: roles, severities, finding statuses, organizations, the Flight Operations checklist template, the 2026 audit plan, seed findings, notifications, audit log, and `seedState()`. |
| `js/helpers.js` | Formatting, date/Due-status logic, lookups, role-scoped visibility, finding presentation, KPI computation, Oversight Health Index, audit-log + notification + toast helpers. |
| `js/views.js` | All screen renderers (return HTML strings) and the modal builders. |
| `js/app.js` | Controller: role-based navigation, routing, event delegation, and every lifecycle mutation (issue finding, submit/accept CAP, upload/accept evidence, close). |
| `docs/plans/2026-06-14-aviasurveil-demo-only-prototype-plan.md` | Saved execution plan (objective, scope, stages, verification, risks, execution prompt). |
| `docs/plans/index.md` | Active plan tracking index. |
| `docs/DEMO_BUILD_SUMMARY.md` | This file. |
| `.claude/launch.json` | Local static-server config used to preview the demo (dev convenience only). |

No numbered source/reference docs under `docs/0X_*` were modified.

---

## Roles implemented

1. **CAA Manager** — oversight, risk, the 2026 surveillance plan, Oversight Health Index.
2. **CAA Inspector** — runs audits and checklists, issues findings, reviews CAP and evidence, closes findings.
3. **Auditee (Airline XYZ)** — sees only its own organization; submits CAP, uploads evidence.
4. **Admin Preview** — previews checklist templates and the audit log.

Switch roles from the **View as** selector in the top bar, or return to the role
select screen via the sidebar.

---

## Screens implemented

1. Role Switch / Login Demo
2. Manager Dashboard (KPIs + Oversight Health Index)
3. Inspector Dashboard
4. Audit Plan Calendar (2026 surveillance plan, all 12 months)
5. New Audit Wizard (5 steps — create and schedule a new audit into the plan)
6. Audit Detail
7. Checklist Runner
8. Finding Detail with 6-step lifecycle stepper
9. Auditee My Findings
10. CAP Submission Form (plain-language helper text)
11. Evidence Upload + Evidence Review (separate auditee/inspector dialogs)
12. Closed Finding / Report Preview
13. Admin Checklist Template Preview
14. Organizations registry (list + organization detail) — Manager / Inspector
15. Admin Users (read-only) and Admin Settings (read-only configured-rules preview)
16. Findings list (filterable), Reports list, Auditee Messages, Admin Audit Log (supporting screens)

Role navigation now matches the UX plan: Manager (Dashboard, Surveillance Plan,
Findings, Organizations, Reports), Inspector (Dashboard, Audit Plan, Findings,
Organizations, Reports), Auditee (My Findings, Messages, Reports), Admin
(Templates, Users, Settings, Audit Log).

---

## Verified demo scenario (end to end, no console errors)

1. Manager sees the 2026 surveillance plan and dashboard — baseline: 3 open findings, OHI **61 (Needs Attention)**.
2. Inspector opens the Airline XYZ Operator Audit (`AUD-2026-001`) and starts the Flight Operations checklist.
3. Inspector marks **"Are crew training records complete and up to date?"** as **Non-Compliant**.
4. Inspector issues **Finding OPS-2026-001** (Level 2 Major, due 15 Jul 2026) — status *Waiting for CAP*.
5. Auditee (Airline XYZ) sees only its own findings, submits the CAP (root cause, corrective action, preventive action, responsible person, target date).
6. Inspector **accepts the CAP** → status becomes *CAP Accepted — Evidence Required*. **The finding does NOT close.**
7. Auditee uploads mock evidence `Training_Record_Updated.pdf`.
8. Inspector reviews and **accepts the evidence** → finding **Closed** (closure basis: evidence accepted and verified).
9. Manager dashboard updates: closed findings 2 → 3, average closure time 24 → 16 days, OHI **61 → 64**.

The audit log records the full chain: Finding issued → CAP submitted → CAP accepted
→ Evidence submitted → Evidence accepted → Finding closed.

**Also verified:**
- **New Audit Wizard** — Manager/Inspector schedules a new audit through all 5 steps; it is added to the 2026 plan (`AUD-2026-009`) and opens its detail page.
- **Authorized closure** — Inspector closes a finding without evidence; the reason is required (empty reason is blocked) and the closure is recorded in the audit trail. The auditee never sees this control or another organization's finding.
- **Organizations registry** (list + detail), **Admin Users**, and **Admin Settings** render correctly; role navigation matches the UX plan.
- **Traceable reminder** — a CAA reminder on an auditee-owned finding adds an in-app notification and an audit-log entry (`Reminder sent to auditee`). Auditee navigation stays scoped to My Findings / Messages / Reports (no Organizations / Users / Settings).

---

## Product rules enforced in the demo

- **CAP accepted is not closure.** Closure is gated on accepted evidence (or an authorized, audit-logged path). Verified: accepting the CAP leaves the finding open at *Evidence Required*.
- **Authorized closure** is wired as a CAA-only alternative path: it requires a typed reason, is recorded in the audit trail (`Finding closed (authorized closure)`), and is not offered to the auditee.
- **Traceable reminders** replace email follow-up: on an open finding the auditee owes a response on, a CAA user can "Send reminder to auditee", which posts an in-app notification and an audit-log entry — no real email is sent.
- **Every finding shows owner, due date, status and next action** — on list rows, the dashboard, and the finding detail.
- **Auditee isolation.** The auditee sees only Airline XYZ findings; the **Internal CAA Notes** section, inspector workload, other organizations, and internal risk scoring are never rendered for the auditee role. Verified in the DOM.
- **Comment to Auditee vs Internal CAA Note** are separate inputs in the review dialogs and separate sections on the finding detail.
- **Due Date / Target / Due Soon / Overdue** language is used; no heavy SLA module.
- **Oversight Health Index is an indicator only** — the UI states it triggers no automatic enforcement, suspension, or closure.
- **Careful regulatory wording** — "regulatory reference", "configured rule", "finding basis", "expected evidence"; reports are marked as mock previews, not legal documents.

---

## Mocked items (explicitly not real)

- **Authentication:** role selection only; no credentials, sessions, or MFA.
- **File upload:** selecting a file shows a **file name and size only** — nothing is read, uploaded, or stored. Evidence "versions" are tracked in memory and preserved (old versions are not overwritten).
- **Notifications:** in-UI toast + a per-role notification panel. No email/SMS/WhatsApp.
- **Reports:** an on-screen preview sheet. "Export PDF (mock)" only shows a toast — no file is generated.
- **Dashboards / KPIs / OHI:** computed live from the in-memory findings/audits, so they change after closure. The OHI formula uses the documented component weights but with demo-simplified inputs.
- **Audit log:** an in-memory list; not tamper-evident or persisted.
- **Persistence:** none. A page refresh or **Reset demo** returns to the seed data.

---

## Known limitations

- State is in-memory only; refreshing the page resets everything (by design for a demo).
- Only one checklist template (**Flight Operations Audit**) is runnable; other templates appear in the Admin list as preview-only. The New Audit Wizard lets you schedule any template, but the runner only renders the Flight Operations items.
- Audits created with the New Audit Wizard are added to the in-memory plan only (lost on refresh / reset).
- Seed numbers for other organizations exist only to make the Manager view realistic; they are not a real data set.
- Accessibility is reasonable (semantic headings, contrast, keyboard-focusable controls) but not formally audited.
- Layout is tuned for desktop/laptop widths with a basic responsive fallback; it is not a mobile app.

---

## Stakeholder feedback questions

1. Does the `Audit → Checklist → Finding → CAP → Evidence → Review → Closure` lifecycle match your surveillance process?
2. Who should be allowed to **issue** findings, and who should be allowed to **close** them?
3. Is **evidence always required before closure**, or do you need an explicit "authorized closure" path (and who may use it)?
4. Should the auditee be able to **request a due-date extension**, and how should that appear?
5. Is the split between **Comment to Auditee** and **Internal CAA Note** clear and sufficient?
6. Which **dashboard metric** matters most to managers, and is the **Oversight Health Index** framing acceptable as an indicator-only signal?
7. Which **audit domain** should we demo next (Airworthiness, Ramp, Security, Cabin, Dangerous Goods)?
8. What is the right **severity vocabulary** (Level 1 Critical / Level 2 Major / Level 3 Minor / Observation)?
9. Which capabilities belong in the demo vs **Phase 2 (MVP)** — e.g. audit creation wizard, reminders, organization registry, real evidence storage?
