# Auditee Portal

## Purpose

Give an external Service Provider a focused, organization-scoped workspace for
responding to announced-inspection coordination requests and CAA Findings, and
for viewing reports that the CAA has explicitly released to that organization.

## Operational navigation

The Service Provider home is `Corrective Actions (CAP)`. The operational
navigation is:

- Inspection Coordination
- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

Duplicate `Received Reports`, `My CAPs`, and `CAP Management` entries are not
shown. The Service Provider does not receive an internal CAA dashboard.

## Inspection Coordination

Only Routine / Announced inspections whose configured policy requires advance
notice appear in this workspace. After the Lead Inspector is identified, the
CAA shares the proposed date, checklist filename, inspection scope, location,
and other auditee-safe relevant information. The Service Provider can confirm
the proposed date or suggest an alternative. A proposed alternative remains
pending until the CAA accepts it.

Ad Hoc / Unannounced inspections never appear in advance and do not create a
Service Provider notification or shared checklist package. In this
frontend-only demo, sending and responding records browser-local state and
in-app notifications only; it does not send a real email or calendar invite.

## Corrective Actions (CAP)

The CAP queue is projected from the current organization's canonical Findings.
It shows Finding ID, Audit / Inspection, Finding Title, Level, Status, Due Date,
progress, and the available action. A selected dossier shows the current owner,
next action, lifecycle timeline, configured Due Date, CAP content, and evidence
status.

`Respond` opens the existing CAP or evidence response appropriate to the
Finding's current lifecycle step. CAP acceptance is not Finding closure. A
Finding closes only after an Inspector or Lead Inspector records `Close` for
the submitted Evidence, or an authorized closure path is separately recorded.
`Partially Close` and `Not Close` keep the Finding open and require remaining
action or Evidence. The dossier shows the latest result, actor, date, Evidence
version, and next action, but never the related `Internal CAA Note`. Evidence
version history is preserved.

## Preliminary Reports

Only Preliminary Reports approved and released by the Executive Director to
the current organization are visible. Lead Inspector, Department Manager, and
General Manager stages are not Service Provider-visible. CAP-required and
no-CAP reports follow the same approval chain. After release, `capRequired`
changes only the next action: respond to CAP and Evidence requests, or view the
report. The queue shows Report ID, Audit / Inspection, Date Shared, Findings,
configured response Due Date, and Action. The dossier contains only auditee-safe
summary, sharing metadata, allowed attachments, a report preview, and an in-UI
message action.

## Final Reports

Only Executive-Director-issued and locked Final Reports for the current
organization are visible. The list intentionally uses only Report ID, Audit /
Inspection, Date Released, Findings, and Action. CAP work remains in the
Corrective Actions workspace rather than being duplicated in the report table.

`View Report` opens the shared state-backed viewer using an auditee-safe
projection. Browser-generated files are demo artifacts; they are not production
records or signed legal documents.

## Privacy and permission rules

- The Service Provider sees only its own organization's audits, Findings, CAP
  requests, announced-inspection coordination requests, evidence requests,
  CAA-visible comments, released Preliminary Reports, issued Final Reports,
  and closure status.
- Advance-notice-withheld inspection records and packages never render in the
  Service Provider portal.
- Direct navigation by an out-of-scope Finding or Report ID resolves to a
  not-found/forbidden state.
- Internal CAA Notes, enforcement deliberations, internal risk scores,
  inspector workload, other organizations, and unreleased drafts never render.
- `Comment to Auditee` remains separate from `Internal CAA Note`.
- CAP verification result metadata may be shown, but the accompanying
  `Internal CAA Note` never renders.
- Due Dates come from configured records; severity does not invent a legal
  deadline.
- Mock uploads retain filenames only. No file bytes are read or stored.
- Role selection is demo-only and is not real authentication or authorization
  enforcement.

## Primary actions

- View Finding and CAP status
- Confirm a proposed Routine / Announced inspection date
- Propose an alternative inspection date for CAA confirmation
- View the checklist filename and relevant information shared for an announced
  inspection
- Submit or update CAP
- Provide mock evidence filenames
- Respond to a request for more information
- View released Preliminary and Final Reports
- Generate browser-local demo downloads
- Message the CAA through the in-UI composer

## UX direction

Show status, owner, Due Date, next action, and record identity before secondary
details. Use queue-first layouts with a clearly selected dossier, working
filters, and responsive task order. Advanced configuration stays behind
internal admin permissions.

## Demo acceptance criteria

- Supports the Fly Namibia Cabin Inspection scenario.
- Organization isolation applies to list, detail, preview, messages, and
  download actions.
- Auditee-visible and internal information remain separated.
- CAP acceptance cannot bypass Evidence or Finding closure requirements.
- Preliminary Reports remain invisible until Executive Director release.
- `Partially Close` and `Not Close` visibly leave the Finding open.
- Every visible control produces an in-screen state, navigation, modal,
  preview, message, or browser-local file result.
- This remains frontend-only, browser-local, and demo-only; production
  auditability and authorization are not claimed.
- Approvals and timestamps are browser-local mock records; traceability is demo
  audit history, not a production audit trail; attachments are mock filenames
  in local browser state, not secure document storage.

## Stakeholder Readiness Privacy Evidence — 2026-07-10

Organization scope now applies consistently to Messages, Settings, unread counts, documents, Preliminary and Final Reports, CAP, Evidence, and notifications. Direct legacy `reports` navigation resolves to the organization-scoped Documents projection. Cross-organization fixtures are unavailable and do not contribute identifying copy or counts.

Status: **demo-only**; focused regressions and fresh isolated-browser checks of Messages, Documents, Final Reports, and Settings at all four required viewports are **verified locally**. Production authentication, authorization enforcement, storage, notification delivery, and privacy certification are **not run**; **production-readiness not claimed**.
