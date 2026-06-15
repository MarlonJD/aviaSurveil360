# Ana Workflow

## Core loop

Surveillance Plan → Audit / Inspection → Checklist → Finding / Observation → CAP → Evidence → CAA Review → Closure → Dashboard / Report

## Audit lifecycle

1. Draft
2. Planned
3. Scheduled
4. In Progress
5. Checklist Completed
6. Draft Report
7. Report Issued
8. Follow-up Open
9. Closed
10. Cancelled

## Finding lifecycle

1. Draft Finding
2. Finding Issued
3. Waiting for CAP
4. CAP Submitted
5. CAP Accepted or Rejected
6. Evidence Required
7. Evidence Submitted
8. Evidence Accepted or Rejected
9. Pending Closure
10. Closed
11. Escalated, if required

## Sert kural

CAP acceptance finding'i kapatmaz. Closure için evidence verification veya authorized closure decision gerekir.

## Owner modeli

Her kaydın bir current owner'ı olmalı:

- CAA Inspector
- Lead Inspector
- CAA Manager
- Auditee
- Enforcement, if escalated
- System, if waiting for automated event

## Next action modeli

Her kayıt next action göstermeli:

- Start inspection
- Complete checklist
- Issue finding
- Submit CAP
- Review CAP
- Upload evidence
- Review evidence
- Close finding
- Escalate

## Blocking rules

Required CAP accepted değilse, required evidence accepted değilse, mandatory fields eksikse, closure authority yoksa veya enforcement lock varsa finding kapanamaz.
