# Full MVP Build Prompt — Use Later

Use this only after the demo has been reviewed and the workflow is approved.

```text
You are building AVIASURVEIL 360, a Civil Aviation Authority surveillance, audit, findings, CAP and evidence management MVP.

Use the planning documents as the source of truth.

Goal:
Build a maintainable MVP that supports the end-to-end loop:
Organization → Audit planning → Checklist execution → Finding issue → Auditee CAP → Evidence upload → CAA review → Finding closure → Dashboard/reporting.

Core rules:
1. Auditee portal is core.
2. CAP accepted is not finding closed.
3. Finding closure requires evidence accepted or authorized closure decision.
4. Every finding must show owner, due date, status and next action.
5. Auditee must only see its own organization and auditee-visible comments.
6. Internal CAA notes must never be visible to auditee.
7. Use due-date/target language; do not build a heavy SLA module first.
8. Avoid complex admin workflow builders in MVP.
9. All critical actions must create audit trail entries.
10. Build simple dashboards first; advanced BI later.

Stages:
0. Inspect docs and create implementation plan.
1. App foundation, roles, navigation and seed data.
2. Organization Registry.
3. Audit Planning and Calendar.
4. Checklist Template and Runner.
5. Findings Management.
6. Auditee Portal.
7. CAP and Evidence workflows.
8. Notifications and Due-Date reminders.
9. Manager Dashboard and Reports Preview.
10. Admin Template Configuration.
11. Security, permissions and audit trail.
12. Demo data and acceptance test scenario.

Final output:
Runnable MVP, README, seeded demo scenario, build summary and list of mocked/deferred features.
```
