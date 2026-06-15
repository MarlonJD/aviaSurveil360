# Status, Permission, Security and Audit Rules

## Audit statuses

Draft, Planned, Scheduled, In Progress, Checklist Completed, Draft Report, Report Issued, Follow-up Open, Closed, Cancelled.

## Finding statuses

Draft, Open, Waiting for CAP, CAP Submitted, CAP Accepted, CAP Rejected, Evidence Required, Evidence Submitted, Pending CAA Review, More Information Requested, Overdue, Pending Closure, Closed, Escalated.

## CAP statuses

Draft, Submitted, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Evidence statuses

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

- Auditee can see only its own organization.
- Auditee cannot see internal notes, inspector workload, other organizations or internal risk scoring.
- Submitted evidence is never deleted.
- Critical actions require audit trail.
- Internal users should use MFA.
- Sensitive data and files need access control.
