# Kavramsal Veri Modeli

## Core entity'ler

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

## İlişkiler

Organization has many Audits.
Audit has many ChecklistResponses.
Audit has many Findings.
Finding has many CAP revisions.
Finding has many Evidence versions.
CAP may have Evidence.
Evidence has ReviewDecisions.
Finding has status history and audit logs.

## Kritik modelleme kuralları

1. CAP ve Evidence birleştirilmemeli.
2. Submitted evidence silinmemeli; version kullanılmalı.
3. Internal CAA note ile auditee-visible comment ayrılmalı.
4. Her status transition audit log'a yazılmalı.
5. Her finding current owner ve next action içermeli.
6. Overdue due date'ten computed olabilir ama label olarak görünmeli.

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
