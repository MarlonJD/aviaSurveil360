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

| Action | Inspector | Lead Inspector | Department Manager | Finance | General Manager | Executive Director | Auditee | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View assigned audits | Yes | Yes | Yes | No | Summary | Summary | Own organization | Yes |
| Create audit | Limited | Yes | Yes | No | No | No | No | Yes |
| Complete checklist | Yes, assigned scope | Yes | No | No | No | No | No | No |
| Create / issue Finding | Create | Review / issue | Yes | No | No | No | No | No |
| Submit CAP / Evidence | No | No | No | No | No | No | Own organization | No |
| Review CAP / Evidence | Yes | Yes | Yes | No | Summary | Summary | No | No |
| Close Finding | Configurable recommendation | Recommend | Authorized path | No | No | No | No | No |
| Review budget-required plan | No | No | Submit | Approve / return only | Review / release stage | Final plan approval (demo) | No | No |
| Review Final Report | No | Prepare | Department review | No | Return / forward only | Final decision | Issued own-organization only | No |
| Issue, mock-sign, or lock Final Report | No | No | No | No | No | Yes, demo-only | No | No |
| Configure templates | No | Limited | Limited | No | No | No | No | Yes |

## Security rules

- Auditee can see only its own organization across Messages, Settings, counts, documents, reports, CAP, Evidence, and notifications.
- Auditee cannot see Internal CAA Notes, inspector workload, other organizations, internal risk scoring, private dashboards, or enforcement deliberations.
- General Manager review is intermediate. GM can return or forward a Final Report but cannot issue, mock-sign, or lock it.
- Executive Director alone may issue, mock-sign, and lock an eligible Final Report in this demo.
- Finance can approve or return a budget-required plan only; Finance cannot edit audit scope, release a plan, or decide a report.
- Planning approval order: Department Manager -> Finance Review -> GM Review -> Executive Director.
  Finance approval advances to GM Review. Finance Return for Revision goes to Department Manager.
  GM may forward a Finance-reviewed plan to Executive Director or return it to Department Manager.
  A corrected submission must pass Finance again. Executive Director approval does not release the plan directly; GM Release to Department remains a separate next action.
- CAP acceptance is not Finding closure. Report approval does not close open Findings or bypass required Evidence/verification.
- Enforcement remains a separate configured or authorized process and is never automatic.
- Submitted evidence is never deleted.
- Critical actions require audit trail.
- Internal users should use MFA.
- Sensitive data and files need access control.

Implementation evidence is **demo-only** and **verified locally** through focused Node regressions and fresh isolated-browser authority/privacy checks at `1536x864`, `1366x768`, `1024x768`, and `390x844`. Production identity, authorization, signing, enforcement execution, and immutable audit logging are **not run**; **production-readiness not claimed**.
