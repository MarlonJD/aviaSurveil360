# Local Reliability Ownership

These owners apply to local candidate evidence. They do not establish a
production on-call rota or transfer regulatory decision authority.

## Ownership catalog

| Scope | Owner | Escalation | Review cadence |
|---|---|---|---|
| Telemetry infrastructure, dashboards, alerts, backups, restores, and IaC | Platform/Operations | Release authority and Security | per release |
| API, PostgreSQL spans, outbox, worker jobs, and dependency semantics | Backend | Platform/Operations | weekly |
| Browser navigation, Web Vitals, handled errors, and degraded-state UX | Frontend | Backend and Platform/Operations | per release |
| Redaction, secrets, IAM, state protection, and vulnerability policy | Security | Release authority | monthly |
| Retention, legal hold, region, and production backup policy | Records/Legal | Product/CAA Operations | quarterly |
| Alert business severity and advisory product interpretation | Product/CAA Operations | Release authority | quarterly |
| AWS plan/apply/rollback/destroy authorization | Release authority | User/stakeholder | per release |

Every runbook names its owning scope, safe preconditions, reversible actions,
recovery checks, evidence capture, and actions requiring new authorization.
