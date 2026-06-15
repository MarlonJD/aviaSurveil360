# Claude Instructions for AviaSurveil360

This file is intentionally small. The canonical project instructions are in
`AGENTS.md` at the repository root.

## Required Startup Sequence

Before doing any work in this repository, Claude must:

1. Read `AGENTS.md` from the project root.
2. Treat `AGENTS.md` as the source of truth for product scope, workflow rules,
   planning rules, documentation rules, prototype guardrails, checks, and change
   control.
3. Apply this `CLAUDE.md` only as a Claude-specific adapter. If this file and
   `AGENTS.md` conflict, `AGENTS.md` wins.
4. If `AGENTS.md` is missing, stop and ask for it before making product,
   documentation, prototype, or implementation changes.

## Project Context

This repository is for `AviaSurveil360`, a Civil Aviation Authority surveillance
and oversight product focused on:

- surveillance planning,
- audit / inspection execution,
- checklist running,
- finding creation,
- corrective action plan (CAP) submission,
- evidence upload and review,
- finding closure,
- auditee portal,
- oversight dashboards and reporting.

## Current Build Mode

Unless the user explicitly changes the scope, the first build is a
**frontend-only clickable demo** for stakeholder feedback.

Use only:

- HTML,
- CSS,
- Vanilla JavaScript,
- mock data,
- client-side state.

Do not add:

- backend,
- database,
- API,
- real authentication,
- real file upload,
- real email / SMS / notification service,
- real document storage,
- production architecture,
- framework migration,
- advanced BI/report builder,
- offline mobile app.

## Non-Negotiable Product Rules

Follow the detailed rules in `AGENTS.md`. The most important rules are repeated
here only to prevent accidental drift:

1. AviaSurveil360 is not a generic checklist app. The core value is the full
   `Audit Plan -> Checklist -> Finding -> CAP -> Evidence -> CAA Review -> Closure`
   lifecycle.
2. CAP acceptance is not finding closure.
3. A finding closes only after required evidence is accepted, verification is
   completed, or an authorized closure path is explicitly used and audit-logged.
4. Auditee users must only see their own organization's audits, findings, CAP
   requests, evidence requests, CAA-visible comments, and closure status.
5. Auditee users must not see internal CAA notes, inspector workload, other
   organizations, internal risk scoring, enforcement deliberations, or private
   dashboard data.
6. Always separate `Comment to Auditee` from `Internal CAA Note`.
7. Use `Due Date`, `Target`, `Due Soon`, and `Overdue` language. Do not build or
   emphasize a heavy SLA module in the demo.
8. `Oversight Health Index` is a management indicator only. It must not create
   automatic legal, enforcement, certificate suspension, or closure decisions.
9. Regulatory references are references, not legal advice. Use careful wording
   such as `regulatory reference`, `configured rule`, `finding basis`, and
   `expected evidence`.

## Claude Work Style

When working in this repository:

1. Start by identifying the relevant section of `AGENTS.md`.
2. Keep changes focused and minimal.
3. For plan requests, create or update a Markdown plan artifact in the plan
   folder specified by `AGENTS.md`.
4. For demo work, preserve the static frontend architecture unless the user
   explicitly asks otherwise.
5. For visible UI copy changes, keep terminology consistent with `AGENTS.md`.
6. Do not claim production readiness for mocked demo behavior.
7. Before finalizing, summarize changed files, checks performed, remaining mocks,
   and any assumptions or risks.

## Preferred Demo Scenario

Unless the user gives a different scenario, the demo should show:

1. CAA Manager sees the surveillance plan.
2. CAA Inspector opens an Operator Audit for Airline XYZ.
3. Inspector runs a Flight Operations checklist.
4. Inspector marks `Crew training records complete?` as `Non-Compliant`.
5. System creates `Finding OPS-2026-001`.
6. Airline XYZ logs into the Auditee Portal.
7. Auditee submits root cause, corrective action, preventive action, target
   completion date, and mock evidence.
8. Inspector reviews the evidence.
9. Inspector accepts or requests more information.
10. Finding closes only after evidence acceptance or authorized closure.
11. Manager dashboard updates.

## Final Reminder

`AGENTS.md` is authoritative. Read it first, follow it throughout the task, and
use this file only as the Claude-specific entry point.
