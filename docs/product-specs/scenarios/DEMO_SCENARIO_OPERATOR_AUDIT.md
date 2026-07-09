# Demo Scenario — Cabin Inspection

## Scenario

Cabin Inspection for FlyNamibia: PBE serviceability and accessibility not confirmed.

## Actors

- CAA Manager
- CAA Inspector
- FlyNamibia Auditee User

## Data

- Audit: 2026 Cabin Inspection - FlyNamibia
- Checklist: Cabin Inspection
- Question: Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?
- Finding: CAB-2026-001
- Severity: Level 1 Critical
- Risk category: Emergency Preparedness
- Finding type: Equipment
- Due date: 30 days

## Flow

1. Manager opens dashboard and sees the 2026 Cabin Inspection - FlyNamibia plan.
2. Cabin Inspection for FlyNamibia is scheduled.
3. Inspector opens today's assigned Cabin Inspection.
4. Inspector starts the Cabin Inspection checklist.
5. Inspector opens the `EM EQ / PBE` question and marks it Non-Compliant.
6. System opens a finding form with prefilled organization, audit, checklist reference, severity, and expected evidence context.
7. Inspector issues Finding CAB-2026-001.
8. FlyNamibia auditee logs in and sees My Findings for its own organization only.
9. Auditee submits CAP:
   - Root cause: Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.
   - Corrective action: Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.
   - Preventive action: Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.
   - Target completion date: 15 July 2026.
10. Auditee uploads FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf and may reference PBE_Cabin_Position_Photo.jpg as a mock filename.
11. Inspector reviews and accepts the CAP. The finding remains open at Evidence Required.
12. Inspector reviews and accepts evidence.
13. Finding closes only after evidence acceptance.
14. Manager dashboard updates.

## Demo message

The system turns a cabin emergency equipment checklist exception into a traceable CAA-auditee CAP and evidence workflow. The workbook-derived checklist is demo/mock configuration data and is not a legal or regulatory source.
