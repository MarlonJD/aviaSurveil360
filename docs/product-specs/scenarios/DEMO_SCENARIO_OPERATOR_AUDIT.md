# Demo Scenario — Cabin Inspection

## Scenario

Cabin Inspection for Fly Namibia: PBE serviceability and accessibility not confirmed.

## Actors

- CAA Manager
- CAA Inspector
- Fly Namibia Auditee User

## Data

- Audit: 2026 Cabin Inspection - Fly Namibia
- Checklist: Cabin Inspection
- Question: Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?
- Finding: CAB-2026-001
- Severity: Level 1 Critical
- Risk category: Emergency Preparedness
- Finding type: Equipment
- Due date: 30 days

## Flow

1. Manager opens dashboard and sees the 2026 Cabin Inspection - Fly Namibia plan.
2. Cabin Inspection for Fly Namibia is scheduled.
3. Inspector opens today's assigned Cabin Inspection.
4. Inspector starts the Cabin Inspection checklist.
5. Inspector opens the `EM EQ / PBE` question and marks it Non-Compliant.
6. System opens a finding form with prefilled organization, audit, checklist reference, severity, and expected evidence context.
7. Inspector issues Finding CAB-2026-001.
8. Fly Namibia auditee logs in and sees My Findings for its own organization only.
9. Auditee submits CAP:
   - Root cause: Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.
   - Corrective action: Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.
   - Preventive action: Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.
   - Target completion date: 15 July 2026.
10. Auditee uploads Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf and may reference PBE_Cabin_Position_Photo.jpg as a mock filename.
11. Inspector reviews and accepts the CAP. The finding remains open at Evidence Required.
12. Inspector reviews and accepts evidence.
13. Finding closes only after evidence acceptance.
14. Manager dashboard updates.

## Department and General Manager oversight extension

The same Fly Namibia demo data also supports the management-review path:

1. Department Manager uses only Dashboard, Audits, Reports Approval, Risk
   Dashboard, Inspection Team, Findings Review, CAP Monitoring, and Checklist
   Management.
2. Findings Review opens Fly Namibia inspection findings and their related
   report without replacing the primary `CAB-2026-001` lifecycle.
3. Inspection Team actions update only manager-scoped demo members, schedules,
   notes, messages, history, and the downloadable Team Assignment PDF.
4. Preliminary and Final Reports are separate artifacts. Department Manager
   may request revision, return, or approve the applicable artifact and may
   download Final Report and Executive Summary PDFs.
5. Department Manager Final Report approval forwards the report to the
   configured final authorized stage; it does not issue or lock the report.
6. CAP Monitoring allows filters, five-tab detail review, and visible updates.
   CAP acceptance or an update does not close a Finding.
7. Checklist Management preserves published versions while browser-local demo
   package, section, and question changes create a draft/new version.
8. Risk Dashboard values are management indicators only and do not trigger an
   automatic legal, enforcement, certificate, or closure action.
9. General Manager uses only Dashboard, Report Approvals, Departments, Risk
   Dashboard, and Settings. The General Manager can return a Final Report with
   a required comment or advance it to Executive Director; GM cannot issue,
   sign, or lock it.
10. Executive Director reviews the selected Final Report and is the only role
    that may apply the demo approval mark, issue it, and lock it.
11. Executive Director report approval does not close `CAB-2026-001` while any
    required CAP, Evidence, or verification work remains open.

## Demo message

The system turns a cabin emergency equipment checklist exception into a traceable CAA-auditee CAP and evidence workflow. The workbook-derived checklist is demo/mock configuration data and is not a legal or regulatory source.
