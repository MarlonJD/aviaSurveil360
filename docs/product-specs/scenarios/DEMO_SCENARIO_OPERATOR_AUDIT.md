# Demo Scenario — Operator Audit

## Scenario

Operator Audit for Airline XYZ: Incomplete Crew Training Records.

## Actors

- CAA Manager
- CAA Inspector
- Airline XYZ Auditee User

## Data

- Audit: 2026 Operator Audit
- Checklist: Flight Operations Audit
- Question: Are crew training records complete and up to date?
- Finding: OPS-2026-001
- Severity: Level 2 Major
- Due date: 30 days

## Flow

1. Manager opens dashboard and sees 2026 surveillance plan.
2. Operator Audit for Airline XYZ is scheduled.
3. Inspector opens today's assigned audit.
4. Inspector starts Flight Operations checklist.
5. Inspector marks crew training records question Non-Compliant.
6. System opens finding form with prefilled organization, audit and checklist reference.
7. Inspector issues Finding OPS-2026-001.
8. Airline XYZ auditee logs in and sees My Findings.
9. Auditee submits CAP:
   - Root cause: Training records were maintained manually.
   - Corrective action: Migrate to digital training system.
   - Preventive action: Monthly training record audit.
   - Target completion date: 15 July 2026.
10. Auditee uploads Training_Record_Updated.pdf.
11. Inspector reviews and accepts evidence.
12. Finding closes.
13. Manager dashboard updates.

## Demo message

The system replaced e-mail follow-up with a traceable CAA–auditee workflow.
