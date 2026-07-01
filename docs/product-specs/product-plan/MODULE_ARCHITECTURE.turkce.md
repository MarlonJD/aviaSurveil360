# Modül Mimarisi

## Core modüller

| Module | Amaç | MVP priority |
|---|---|---|
| Organization Registry | Denetlenen kuruluşların master listesi | Must |
| Surveillance Planning | Annual/ad hoc audit planning | Must |
| Audit Execution | Audit kaydı ve progress | Must |
| Checklist Builder/Runner | Template ve execution | Must |
| Findings Management | Merkezi finding lifecycle | Must |
| Auditee Portal | External organization aksiyonları | Must |
| CAP Management | Root cause ve corrective action | Must |
| Evidence Repository | Evidence upload/review/versioning | Must |
| Notifications | Due-date ve status messages | Must |
| Dashboard/Reports | Oversight visibility | Must |
| Admin Configuration | Templates, roles ve rules | Basic MVP |
| Mobile Inspection App | Field/offline support | Later |
| Risk-Based Planning | Smart frequency/risk suggestions | Later |
| Enforcement Integration | Escalation ve legal cases | Later |

## Ortak platform servisleri

AVIASURVEIL diğer AVIA ürünleriyle şunları paylaşabilir:

- Users and roles
- Organization registry
- Document storage
- Notification service
- Audit trail
- Reporting shell
- Risk flags

## Architecture UX rule

Backend modular ve configurable olabilir. Frontend role-based ve task-based kalmalı. Backend'de modül var diye onu menüye koyma.
