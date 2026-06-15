# Conceptual Data Model

## Core entities

- User
- Role
- Organization
- OrganizationUser
- Audit
- AuditTeamMember
- ChecklistTemplate
- ChecklistTemplateVersion
- ChecklistQuestion
- ChecklistResponse
- Finding
- CAP
- Evidence
- ReviewDecision
- Notification
- Report
- AuditLog

## Relationships

Organization has many Audits.
Audit has many ChecklistResponses.
Audit has many Findings.
Finding has many CAP revisions.
Finding has many Evidence versions.
CAP may have Evidence.
Evidence has ReviewDecisions.
Finding has status history and audit logs.

## Critical modeling rules

1. Do not merge CAP and Evidence.
2. Do not delete submitted evidence; version it.
3. Separate internal CAA note from auditee-visible comment.
4. Every status transition must be audit logged.
5. Every finding must have current owner and next action.
6. Overdue can be computed from due date, but visible as label.

## Minimal Finding fields

- id
- finding_number
- audit_id
- organization_id
- title
- description
- regulation_reference
- severity
- due_date
- status
- current_owner_type
- current_owner_id
- next_action
- cap_required
- evidence_required
- repeat_finding_flag
- created_by
- issued_at
- closed_at
