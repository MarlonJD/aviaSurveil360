# Status, Permission, Security ve Audit Kuralları

## Audit statüleri

Draft, Planned, Scheduled, In Progress, Checklist Completed, Draft Report, Report Issued, Follow-up Open, Closed, Cancelled.

## Finding statüleri

Draft, Open, Waiting for CAP, CAP Submitted, CAP Accepted, CAP Rejected, Evidence Required, Evidence Submitted, Pending CAA Review, More Information Requested, Overdue, Pending Closure, Closed, Escalated.

## CAP statüleri

Draft, Submitted, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Evidence statüleri

Uploaded, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Permissions

| Action | Inspector | Lead Inspector | Manager | Auditee | Admin |
|---|---:|---:|---:|---:|---:|
| View assigned audits | Yes | Yes | Yes | No | Yes |
| Create audit | Limited | Yes | Yes | No | Yes |
| Complete checklist | Yes | Yes | No | No | No |
| Create finding | Yes | Yes | Yes | No | No |
| Issue finding | Configurable | Yes | Yes | No | No |
| Submit CAP | No | No | No | Yes | No |
| Upload evidence | No | No | No | Yes | No |
| Review CAP/evidence | Yes | Yes | Yes | No | No |
| Close finding | Configurable | Yes | Yes | No | No |
| Configure templates | No | Limited | Limited | No | Yes |

## Security rules

- Auditee sadece kendi organization'ını görebilir.
- Auditee internal notes, inspector workload, diğer organization veya internal risk scoring göremez.
- Submitted evidence asla silinmez.
- Critical actions audit trail gerektirir.
- Internal users MFA kullanmalı.
- Sensitive data ve files access control gerektirir.
