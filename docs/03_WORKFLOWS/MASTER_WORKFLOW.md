# Master Workflow

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

## Hard rule

CAP acceptance does not close the finding. Closure requires evidence verification or an authorized closure decision.

## Owner model

Every record must have one current owner:

- CAA Inspector
- Lead Inspector
- CAA Manager
- Auditee
- Enforcement, if escalated
- System, if waiting for automated event

## Next action model

Every record must show the next action:

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

A finding cannot close if required CAP is not accepted, required evidence is not accepted, mandatory fields are missing, closure authority is missing, or enforcement lock exists.
