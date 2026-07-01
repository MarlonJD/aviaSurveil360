# Other Domain Scenarios and Edge Cases

## Aerodrome Inspection

Finding: AER-2026-004 — Runway lighting maintenance records incomplete.

Flow uses the same product objects: Organization, Audit, Checklist, Finding, CAP, Evidence, Closure.

## ANSP Audit

Finding: ANS-2026-002 — ATC competency assessment records missing.

Flow is the same; only checklist template and regulation references change.

## Training Organization Audit

Finding: ATO-2026-008 — Instructor qualification records not current.

This can later connect to AviaLicense if certificates from that ATO are used in licensing applications.

## Security Inspection

Finding: SEC-2026-003 — Access control log review not performed.

May require restricted visibility and special permissions.

## Edge cases

### CAP rejected

Finding stays open. Auditee sees reason and submits revision.

### Evidence rejected

Evidence version remains. Auditee uploads a new version.

### Due date missed

Finding becomes overdue. Inspector, auditee and manager are notified.

### Level 1 Critical

Manager is notified immediately. Enforcement review may be recommended.

### Observation

CAP and evidence can be optional. Observation should not inflate critical finding KPIs.

### Extension request

Phase 2 feature. Auditee requests extension; CAA approves/rejects; audit trail records decision.
