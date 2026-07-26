# Local Candidate Service Objectives

These are engineering acceptance objectives for the local candidate. They are
not contractual production SLOs, legal commitments, or evidence of a staffed
on-call service.

## Objective catalog

| ID | Indicator | Metric | Target | Window | Owner | Unit | Histogram boundaries |
|---|---|---|---|---|---|---|---|
| api-read-latency | Successful API read latency | http.server.duration | p95 <= 500 | 5m | Backend | ms | 5,10,25,50,100,250,500,1000,2500 |
| api-command-latency | Successful API command latency | http.server.duration | p95 <= 1000 | 5m | Backend | ms | 5,10,25,50,100,250,500,1000,2500 |
| outbox-ready-age | Oldest ready outbox item | outbox.ready.age | warning 120; critical 600 | 5m | Backend | s | 5,15,30,60,120,300,600 |
| job-attempts | Failed scan, email, or document attempts | worker.job.attempts | alert at 3 | 15m | Backend | attempt | none |
| backup-freshness | Age of the latest valid recovery point | backup.recovery_point.age | warning 1800; critical 93600 | 5m | Platform/Operations | s | 60,300,900,1800,3600,21600,43200,93600 |
| candidate-rpo | Measured source-to-recovery-point loss | recovery.rpo.duration | <= 900 | per drill | Platform/Operations | s | 0,60,300,600,900,1800 |
| candidate-rto | Measured isolated complete restore duration | recovery.rto.duration | <= 3600 | per drill | Platform/Operations | s | 60,300,600,1200,1800,2700,3600 |

Latency excludes asynchronous scan, email, and document completion. Liveness,
readiness, technical SLOs, audit history, and business KPIs remain separate.
Production targets require explicit Product, Platform, Operations, Security,
Records/Legal, and release-authority approval.
