# Codex Demo-Only Prompt

Use this prompt when the goal is only a front-end clickable demo.

```text
You are working on AVIASURVEIL 360, a Civil Aviation Authority surveillance and findings management product.

Current goal:
Build ONLY a front-end clickable demo for stakeholder feedback. Do not build the full system.

Hard constraints:
- No backend.
- No database.
- No real authentication.
- No real file upload.
- No real e-mail service.
- No production architecture.
- No advanced BI/report builder.
- No offline mobile app.
- Use mock data and client-side state only.

Product story:
AVIASURVEIL helps CAA teams plan audits, run checklists, issue findings, receive auditee CAP responses, review evidence, close findings and monitor oversight status.

Demo scenario:
CAA Manager sees a 2026 surveillance plan.
Inspector opens an Operator Audit for Airline XYZ.
Inspector runs Flight Operations checklist.
Inspector marks “Crew training records complete?” as Non-Compliant.
System creates Finding OPS-2026-001.
Airline XYZ auditee logs in.
Auditee submits root cause, corrective action, preventive action and target completion date.
Auditee uploads evidence file.
Inspector reviews evidence.
Inspector accepts evidence.
Finding closes.
Manager dashboard updates.

Required roles:
- CAA Manager
- CAA Inspector
- Auditee
- Admin Preview

Required screens:
1. Role switch / login demo
2. Manager dashboard
3. Inspector dashboard
4. Audit plan calendar
5. Checklist runner
6. Finding detail with lifecycle stepper
7. Auditee My Findings
8. CAP submission form
9. Evidence upload/review
10. Closed finding / report preview
11. Admin template preview

Locked UX rules:
- Every page must show one main purpose.
- Every finding must show current owner, due date, status and next action.
- CAP accepted is not finding closed.
- Finding closes only after evidence is accepted or authorized closure is performed.
- Auditee must not see internal CAA notes, inspector workload, other organizations or internal risk scoring.
- Use due date/target language, not heavy SLA language.
- Use plain language for auditee forms.

After finishing:
- Run the demo locally if possible.
- Fix console errors.
- Add docs/DEMO_BUILD_SUMMARY.md describing changed files, mocked items and feedback questions.
```
