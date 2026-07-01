# AviaSurveil360 Planning Pack And Frontend Demo

This repository contains a structured planning pack plus a **frontend-only static
clickable demo** for a proposed Civil Aviation Authority surveillance, audit,
findings, CAP, and evidence management product.

The executable demo is `index.html` with `css/`, `js/`, mock data, client-side
state, and targeted Node smoke tests under `tests/`.

**Demo-only / not production-ready:** there is no backend, database, API, real
authentication, real authorization enforcement, real file upload, real AI
service, real regulatory ingestion, real notification service, production audit
log, or framework migration.

## Product definition

**AviaSurveil360** is a task-based oversight platform for Civil Aviation
Authorities. It helps CAA teams plan audits, run checklists, issue findings,
receive corrective action plans from auditees, review evidence, track due dates,
close findings, and monitor oversight performance.

## Core product thesis

Do not build an EMPIC-like complex enterprise screen first. Build a simple, role-based product where each user immediately understands what to do next:

- Inspector: What do I inspect or review today?
- Auditee: What does the CAA need from my organization?
- Manager: Where are we exposed, delayed or overloaded?
- Admin: Which template or rule must be configured?

## Recommended reading order

1. `docs/index.md`
2. `docs/product-specs/index.md`
3. `docs/demo-handoff/CODEX_DEMO_ONLY_PROMPT.md`
4. `docs/demo-evidence/BUILD_SUMMARY.md`
5. `docs/exec-plans/index.md`

For the clickable demo, open `index.html` directly in a browser or serve this
folder with a local static server. See `docs/demo-evidence/BUILD_SUMMARY.md` for current
verification status and known demo limitations.


## Source Notes
- EMPIC Solutions — surveillance layer, checklists, findings, CAP, evidence, external stakeholder access: https://www.empic.aero/solutions/
- EMPIC-EAP booklet — external stakeholder web client and corrective action handling: https://www.empic.aero/wp-content/uploads/2022/05/Booklet_202205_eng.pdf
- TrustFlight Centrik 5 QMS — aviation quality, safety, risk, workflows, documents and dashboards: https://www.trustflight.com/products/centrik-5-qms/
- ASQS/iQSMS Quality Management Module via Aircraft IT — internal/external audits, auditee guest users, due-date emails and finding status: https://www.aircraftit.com/vendors/comply365-2/quality-management-module/
- ICAO / UK CAAi audit training material — oversight activity, audit reports, findings and observations: https://www.icao.int/sites/default/files/APAC/Meetings/2025/2025%20COSCAP%20SEA%20AND%20UK%20CAAi%20AGA%20CERT%20AND%20SURV/5-Presentations/08-Conducting-Audits_v02_COSCAP.pdf
- Irish Aviation Authority UAM-020 — root cause, CAP, target completion and evidence expectations: https://www.iaa.ie/docs/default-source/publications/advisory-memoranda/uas-advisory-memoranda-%28uam%29/uam-020---guidance-on-the-competent-authority-oversight-audits.pdf
- ANAO CASA surveillance audit report — planning, data, tracking and reporting weaknesses in regulator surveillance: https://www.anao.gov.au/work/performance-audit/civil-aviation-safety-authority-planning-and-conduct-surveillance-activities
- UK CAA compliance monitoring sample checklist/finding form: https://www.caa.co.uk/media/0g3ekh5a/sample-compliance-monitioring-audit-checklists-and-findings-form-1.docx
- FOCA supervision review — Level 1/Level 2 finding handling examples: https://www.newsd.admin.ch/newsd/message/attachments/66693.pdf
- GOV.UK Design System / Service Manual — simple form and question-page patterns: https://design-system.service.gov.uk/patterns/question-pages/ and https://www.gov.uk/service-manual/design/form-structure
- Nielsen Norman Group — complex application and dashboard usability principles: https://www.nngroup.com/articles/complex-application-design/ and https://www.nngroup.com/articles/dashboards-preattentive/
