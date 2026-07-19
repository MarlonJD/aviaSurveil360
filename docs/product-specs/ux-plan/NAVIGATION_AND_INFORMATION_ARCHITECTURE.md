# Navigation and Information Architecture

## Inspector IA

Home is a workbench, not a general dashboard. It prioritizes today's assigned
Cabin Inspections, checklists in progress, CAP and Evidence reviews, Due Soon,
and Overdue work. An Inspector cannot enter Lead Inspector assignment routes.
Inspector and Lead Inspector Evidence review exposes the explicit `Close`,
`Partially Close`, and `Not Close` verification outcomes.

## Lead Inspector IA

Lead Inspector work is audit and report-package based. Assignment Questions
supports multiple real team members and question-level ownership. Preliminary
Reports open an existing Report ID directly into `Inspection & Findings`; the
UI does not create an orphan report shell.

## Service Provider IA

Service Provider sees only its own organization and only actions or reports
released to it. The exact operational navigation is:

- Inspection Coordination
- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

The home route is Corrective Actions (CAP). List, detail, preview, message, and
download selectors enforce organization scope. Internal CAA Notes, enforcement
deliberations, internal risk, inspector workload, other organizations, and
unreleased drafts are excluded.

Inspection Coordination shows only Routine / Announced requests explicitly
released to the current organization after Lead Inspector assignment. It lets
the Service Provider confirm the proposed date or suggest an alternative and
shows the checklist plus auditee-safe relevant information. Ad Hoc /
Unannounced inspections and withheld-notice records are excluded entirely.
Released CAP verification metadata may be shown, but Internal CAA Notes remain
excluded.

## Finance IA

Finance has one operational workspace and lands directly on it:

- Finance Review

It contains one budget queue, one selected budget dossier, approval history,
and two decisions: `Approve Budget` and `Return for Revision`. Finance cannot
edit audit scope, sign or release a plan, issue a report, or bypass Executive
Director approval. Finance approval advances to GM Review; `Return for
Revision` goes to Department Manager.

Planning approval order: Department Manager -> Finance Review -> GM Review ->
Executive Director. Finance approval advances to GM Review. Finance Return for
Revision goes to Department Manager.
GM may forward a Finance-reviewed plan to
Executive Director or return it to Department Manager; a corrected submission
must pass Finance again. Executive Director approval does not release the plan
directly; GM Release to Department remains a separate next action.

## Executive Director IA

Executive Director has distinct planning, Preliminary Report, and Final Report
decision surfaces plus supporting utilities:

- Dashboard
- Planning
- Preliminary Reports
- Final Reports
- Notifications
- Settings

Dashboard puts pending plan and report decisions in the first viewport, then
shows derived department, risk, and overdue context. Planning provides one
selected plan dossier with preview, `Approve & Sign (Demo)`, and Reject. ED
plan approval records a mock approval mark but still requires explicit General
Manager release to the Department.

Preliminary Reports contains only GM-forwarded Preliminary Reports. Executive
Director can approve and issue one exact report to its Service Provider
organization, return it to General Manager, or reject it. No enforcement action
appears on this surface. Approval records a browser-local mock mark, locks the
issued copy, and is not a real e-signature.

Final Reports provides a Final-Report-only queue, selected review dossier,
state-backed preview, and Approve, Return, Reject, or Refer for Enforcement
Review decisions. Only Executive Director approval can issue, mock-sign, and
lock an eligible Final Report. Enforcement remains a configured
recommendation/referral and never applies a sanction automatically.

## Department Manager IA

Department Manager sees exposure, team work, Findings, CAP delay, checklist
governance, and reports awaiting the department decision. Department Manager
approval forwards both Preliminary and Final Reports to General Manager; it
does not issue, share, sign, or lock either report.

## General Manager IA

General Manager uses Dashboard, Planning, Report Approvals, Departments, Risk
Dashboard, and Settings. Planning exposes Finance-approved plans for GM Review:
GM may return a plan to Department Manager or advance it to Executive Director.
GM is also the intermediate reviewer for Preliminary and Final Reports: GM may
return either exact report to Department Manager or advance it to Executive
Director, but cannot issue, share, sign, or lock it. After ED plan approval, GM
performs the separate Release to Department step.

## Admin IA

Admin manages configuration rather than daily operational decisions. Primary
areas include Checklist Templates, Audit Types, Organization Types, Severity
Rules, Due-Date Rules, Notification Templates, Roles & Permissions, and Audit
Log. Demo configuration is not a production authorization service.

## Stakeholder Readiness IA Evidence — 2026-07-10

The selected Fly Namibia Cabin Inspection keeps one identity across assignment, six-section Inspector execution, canonical Preliminary/Final Reports, and the Service Provider portal. Assignment keys are the exact execution Question IDs; another Inspector's assigned question remains visible for audit context but read-only. Lead Final actions carry the exact Report ID. GM navigation supports intermediate review only, and ED owns final issue/mock-sign/lock.

Status: **demo-only**; focused/static checks plus fresh isolated-browser selected-ID, visible-control, responsive, and keyboard/modal checks are **verified locally**. External stakeholder acceptance and production authorization are **not run**; **production-readiness not claimed**.
