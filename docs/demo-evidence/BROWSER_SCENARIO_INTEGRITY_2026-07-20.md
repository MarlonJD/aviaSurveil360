# Browser Scenario Integrity Evidence — 20 July 2026

## Evidence status

Status: **demo-only** and **verified locally**. Production deployment,
production authorization, real notification delivery, real Evidence storage,
regulatory validation, real-device testing, and stakeholder sign-off are **not
run**. This evidence does not claim production readiness.

The real-click run used the Codex in-app Browser through
`http://127.0.0.1:4173/index.html`; it did not use `file://` or direct state
mutation. Browser-local mock state was changed only through visible controls.

## Automated verification

- JavaScript syntax: all `js/*.js` files passed `node --check`.
- Focused gate: 16/16 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo.
- Complete `tests/*.test.js` gate: 88/88 passed, 0 failed, 0 cancelled, 0
  skipped, 0 todo.
- The final fresh-tab console query returned `[]` for warning/error entries.

## Real-click scenario matrix

| # | Scenario | Result | Verified local evidence |
|---|---|---|---|
| 1 | Eight role home/navigation boundaries | PASS | Inspector, Lead Inspector, Department Manager, General Manager, Finance Review, Executive Director, Service Provider Portal, and Administration opened with their exact navigation and authority boundaries. |
| 2 | Planning approval, release, scoped Lead preparation, and materialization | PASS | Department Manager -> Finance -> GM -> Executive Director -> GM Release -> Department acceptance -> Lead proposal -> Department confirmation produced exact executable Audits without broad Lead Planning access. |
| 3 | Routine coordination and alternative date propagation | PASS | Auditee proposed 17 June 2026, Lead accepted it, and the canonical Audit/Inspector date range updated to 15–17 June 2026. |
| 4 | Ad Hoc / Unannounced intake and notice withholding | PASS | The Security intake retained `Ad Hoc / Unannounced` and `No Advance Notice`; Inspector visibility and Auditee absence were checked. |
| 5 | Truthful checklist controls and packages | PASS | Cabin and Security continued their exact Audits; materialized Flight Operations Audit `AUD-2026-010` opened its own three-question package. Completed Ramp and Airworthiness rows no longer route to a generic report; they explicitly disable `Report preview unavailable`. Other unsupported previews remain disabled. |
| 6 | Same question ID in two Audits | PASS | The PBE question retained distinct Audit-scoped answers and Potential Findings in `AUD-2026-001` and `AUD-2026-009`. |
| 7 | Lead Potential Finding decisions | PASS | Real clicks recorded return, dismissal, and conversion; Observation conversion cleared CAP/Evidence/Due Date defaults unless explicitly enabled. |
| 8 | Submit and reason-required reopen | PASS | Submitted checklist was read-only; empty reopen reason was rejected; authorized reopen with a reason preserved the Audit-scoped answers. |
| 9 | Auditee CAP submit/revision and Inspector accept/return | PASS | Auditee submitted and revised `CAB-2026-013`; Inspector returned it with a Comment to Auditee. CAP acceptance for `CAB-2026-011` stayed in Inspector and left the Finding open for Evidence. |
| 10 | Evidence v1/v2 and three verification outcomes | PASS | Ramp v1 recorded `Not Close`; `CAB-2026-011` v1 recorded `Partially Close`; Auditee v2 then recorded `Close`. Versions remained visible and the report basis became `Evidence accepted and verified`. |
| 11 | Department Manager canonical consistency | PASS | Manager Findings Review showed the same `CAB-2026-011`, canonical closure date, v1/v2 statuses, audit trail, comments, and closure basis. |
| 12 | Reminder stages and overdue manager escalation | PASS | Deterministic due-stage history rendered; `AWO-2026-003` showed both `Overdue reminder` for Auditee and `Overdue manager escalation` for Department Manager with the demo-delivery boundary. |
| 13 | Preliminary and Final Report decisions | PASS | Department Manager approved/forwarded, GM forwarded, and Executive Director recorded demo-only Preliminary and Final decisions. Final Report approval did not close open Findings. |
| 14 | Auditee privacy and Internal CAA Note separation | PASS | Fly Namibia Portal contained no SkyCargo/BlueWing records and no `Internal CAA Note`; CAA-visible comments and Evidence history remained visible. |
| 15 | Closure-basis labels | PASS | Evidence-verified report and Auditee timeline used `Evidence accepted and verified`; authorized closure remained a distinct reason-required label/path. |

## Critical screenshots

Temporary evidence directory:
`/private/tmp/aviasurveil360-browser-scenario-integrity-20260720/`.

- `02-scoped-lead-preparation.png` — selected-plan Lead preparation only.
- `06-second-audit-scoped-answer.png` — same question ID, second Audit answer.
- `08-reason-required-reopen.png` — guarded reopen dialog.
- `15-auditee-closure-basis.png` — Auditee closure-basis label.
- `20-cap-accepted-finding-stays-open.png` — CAP accepted while Evidence remains required.
- `23-evidence-verified-closure-report.png` — v1/v2 and evidence-verified closure report.
- `32-inspector-management-route-denied.png` — Inspector screen without management closure controls.
- `34-flight-operations-checklist.png` — materialized Flight Operations checklist.
- `35-ramp-airworthiness-explicit-disabled-report.png` — exact disabled boundary replacing the false generic report action.

## Browser defects found and closed during verification

- A mixed old/new browser cache produced `closureBasisLabel is not defined`.
  All stylesheet/script versions were aligned to one cache-bust value and the
  final fresh-tab console was clean.
- Planning wizard copy understated the runnable package set; it now lists the
  five audit-specific packages.
- Materialized executable Audits were absent from Inspector assignments; they
  now appear dynamically with exact package totals and actions.
- Completed Ramp/Airworthiness `View Report` controls opened a generic report
  list. The controls are now explicitly disabled until an audit-specific
  Inspector report preview exists.

## Cleanup

Browser tabs were closed, the localhost server was stopped, and the final
process search found no task-owned HTTP server, Playwright, Puppeteer,
webdriver, headless Chrome, or remote-debugging Chrome process.
