# Auditee Portal

## Purpose

Give an external Service Provider a focused, organization-scoped workspace for
responding to CAA Findings and viewing reports that the CAA has explicitly
released to that organization.

## Operational navigation

The Service Provider home is `Corrective Actions (CAP)`. The operational
navigation is:

- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

Duplicate `Received Reports`, `My CAPs`, and `CAP Management` entries are not
shown. The Service Provider does not receive an internal CAA dashboard.

## Corrective Actions (CAP)

The CAP queue is projected from the current organization's canonical Findings.
It shows Finding ID, Audit / Inspection, Finding Title, Level, Status, Due Date,
progress, and the available action. A selected dossier shows the current owner,
next action, lifecycle timeline, configured Due Date, CAP content, and evidence
status.

`Respond` opens the existing CAP or evidence response appropriate to the
Finding's current lifecycle step. CAP acceptance is not Finding closure. A
Finding closes only after required evidence is accepted, verification is
completed, or an authorized closure path is explicitly recorded. Evidence
version history is preserved.

## Preliminary Reports

Only Preliminary Reports explicitly shared with the current organization are
visible. The queue shows Report ID, Audit / Inspection, Date Shared, Findings,
configured response Due Date, and Action. The dossier contains only
auditee-safe summary, sharing metadata, allowed attachments, a report preview,
and an in-UI message action.

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
  requests, evidence requests, CAA-visible comments, released Preliminary
  Reports, issued Final Reports, and closure status.
- Direct navigation by an out-of-scope Finding or Report ID resolves to a
  not-found/forbidden state.
- Internal CAA Notes, enforcement deliberations, internal risk scores,
  inspector workload, other organizations, and unreleased drafts never render.
- `Comment to Auditee` remains separate from `Internal CAA Note`.
- Due Dates come from configured records; severity does not invent a legal
  deadline.
- Mock uploads retain filenames only. No file bytes are read or stored.
- Role selection is demo-only and is not real authentication or authorization
  enforcement.

## Primary actions

- View Finding and CAP status
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
- Every visible control produces an in-screen state, navigation, modal,
  preview, message, or browser-local file result.
- This remains frontend-only, browser-local, and demo-only; production
  auditability and authorization are not claimed.
