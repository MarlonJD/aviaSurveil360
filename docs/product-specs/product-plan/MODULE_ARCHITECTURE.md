# Module Architecture

## Core modules

| Module | Purpose | MVP priority |
|---|---|---|
| Organization Registry | Master list of audited organizations | Must |
| Surveillance Planning | Annual/ad hoc audit planning | Must |
| Audit Execution | Audit record and progress | Must |
| Checklist Builder/Runner | Template and execution | Must |
| Findings Management | Central finding lifecycle | Must |
| Auditee Portal | External organization actions | Must |
| CAP Management | Root cause and corrective action | Must |
| Evidence Repository | Evidence upload/review/versioning | Must |
| Notifications | Due-date and status messages | Must |
| Dashboard/Reports | Oversight visibility | Must |
| Admin Configuration | Templates, roles and rules | Basic MVP |
| Mobile Inspection App | Field/offline support | Later |
| Risk-Based Planning | Smart frequency/risk suggestions | Later |
| Enforcement Integration | Escalation and legal cases | Later |

## Shared platform services

AVIASURVEIL may share these with other AVIA products:

- Users and roles
- Organization registry
- Document storage
- Notification service
- Audit trail
- Reporting shell
- Risk flags

## Architecture UX rule

Backend can be modular and configurable. Frontend must remain role-based and task-based. Do not expose backend modules as menu items just because they exist.
