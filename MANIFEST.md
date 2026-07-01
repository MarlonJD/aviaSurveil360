# AviaSurveil360 Package Manifest

This repository is a planning pack plus a **frontend-only static clickable
demo**. It is not a production system.

Demo boundary: no backend, database, API, real authentication, real
authorization enforcement, real file upload/storage, real AI service, real
regulatory ingestion, real notification service, production audit log, or
framework migration is included.

## Root Files

- `AGENTS.md` — repo-local agent instructions and source-of-truth routing.
- `CLAUDE.md` — Claude-facing project guidance.
- `README.md` — English package overview.
- `README.turkce.md` — Turkish package overview.
- `MANIFEST.md` — this package inventory.
- `index.html` — frontend-only static clickable demo entry point.

## Static Prototype

- `css/styles.css` — demo styling and responsive behavior.
- `js/data.js` — mock data, status maps, and browser-only demo persistence
  boundary.
- `js/helpers.js` — shared helpers, role visibility helpers, status helpers,
  demo notifications, and rendering helpers.
- `js/approval.js` — shared mock approval-chain primitive.
- `js/planning.js` — planning approval and audit-preparation demo logic.
- `js/checklists.js` — checklist management demo logic.
- `js/inspection.js` — inspection execution and Potential Finding demo logic.
- `js/reports.js` — preliminary/final report approval demo logic.
- `js/work-items.js` — shared table-first work-item shaping for audits,
  findings, CAP/evidence child rows, approvals, planning items, and admin
  queues.
- `js/views.js` — static demo screen rendering.
- `js/app.js` — role routing, UI action handling, mock interactions, and demo
  bootstrapping.

## Smoke Tests

There is no `package.json`; do not assume `npm test`.

- `tests/approval-smoke.test.js`
- `tests/audit-work-queue-smoke.test.js`
- `tests/checklist-approval-smoke.test.js`
- `tests/checklist-comment-render-smoke.test.js`
- `tests/checklist-management-smoke.test.js`
- `tests/demo-boundary-smoke.test.js`
- `tests/governance-render-smoke.test.js`
- `tests/harness-docs-smoke.test.js`
- `tests/inspection-execution-smoke.test.js`
- `tests/inspector-nav-smoke.test.js`
- `tests/lead-inspector-nav-smoke.test.js`
- `tests/lead-inspector-workspace-smoke.test.js`
- `tests/planning-release-smoke.test.js`
- `tests/planning-render-smoke.test.js`
- `tests/planning-workspace-smoke.test.js`
- `tests/report-approval-smoke.test.js`
- `tests/table-first-workbench-smoke.test.js`

## Agent Harness

- `docs/index.md` — canonical docs map for agent, plan, product, demo handoff,
  and demo evidence surfaces.
- `docs/agent-harness/index.md` — canonical harness entrypoint for future
  agents.
- `docs/agent-harness/output-contract.md` — required status, evidence, and
  final-readout contract.
- `docs/agent-harness/registry.md` — source, plan, evidence, static demo, and
  local test registry.
- `docs/agent-harness/verification-matrix.md` — local-only verification ladder
  for docs, JS, workflow, UI, and boundary-sensitive tasks.
- `docs/agent-harness/entropy-cleanup-checklist.md` — drift and cleanup tracker
  for stale harness instructions, evidence labels, plan state, and package
  truth.

## Build Evidence And Handoff

- `docs/demo-evidence/BUILD_SUMMARY.md` — English canonical demo evidence, verification
  status, and known limitations.
- `docs/demo-evidence/BUILD_SUMMARY.turkce.md` — Turkish stakeholder companion summary.
- `docs/demo-handoff/ACCEPTANCE_CRITERIA_AND_FEEDBACK.md`
- `docs/demo-handoff/ACCEPTANCE_CRITERIA_AND_FEEDBACK.turkce.md`
- `docs/demo-handoff/AGENT_HARNESS_RUNBOOK.md`
- `docs/demo-handoff/CODEX_DEMO_ONLY_PROMPT.md`
- `docs/demo-handoff/CODEX_DEMO_ONLY_PROMPT.turkce.md`
- `docs/demo-handoff/FULL_MVP_BUILD_PROMPT_LATER.md`
- `docs/demo-handoff/FULL_MVP_BUILD_PROMPT_LATER.turkce.md`

## Product Source Documents

- `docs/product-specs/index.md` — product specs map and reading order.
- `docs/product-specs/research-and-positioning/` — market research and product
  positioning.
- `docs/product-specs/product-plan/` — product vision, MVP scope, roadmap, and module
  architecture.
- `docs/product-specs/ux-plan/` — UX principles and navigation/information architecture.
- `docs/product-specs/workflows/` — surveillance, checklist, Finding/CAP/Evidence, and
  reminder workflows.
- `docs/product-specs/modules/` — module-level planning for audit planning, checklist
  builder, findings, CAP, evidence, auditee portal, dashboards, notifications,
  organization registry, and admin configuration.
- `docs/product-specs/screen-specs/` — screen inventory and form specs.
- `docs/product-specs/data-and-rules/` — conceptual data model, status, permission,
  security, and audit rules.
- `docs/product-specs/analytics/` — Oversight Health Index, KPIs, and report catalog.
- `docs/product-specs/scenarios/` — demo scenario and other domain scenarios.
- `docs/product-specs/references/` — glossary and source notes.

Most stakeholder-facing canonical docs have matching `.turkce.md` companion
files in the same folder.

## Execution Plans

- `docs/exec-plans/index.md` — active execution-plan tracking index.
- `docs/exec-plans/active/2026-06-14-aviasurveil-demo-only-prototype-plan.md`
- `docs/exec-plans/active/2026-06-23-ncaa-platform-v2-and-mvp-plan.md`
- `docs/exec-plans/active/2026-06-28-caa-governance-workflow-and-roles-plan.md`
- `docs/exec-plans/active/2026-06-29-agent-harness-readiness-completion-plan.md`
- `docs/exec-plans/active/2026-06-29-aviasurveil-harness-engineering-adaptation-plan.md`
- `docs/exec-plans/active/2026-06-30-planning-panel-simplification-plan.md`
- `docs/exec-plans/active/2026-07-01-table-first-surveillance-workbench-ux-plan.md`

## Execution Plan Archive And Tracker

- `docs/exec-plans/completed/index.md` — completed and archived execution-plan
  records.
- `docs/exec-plans/completed/2026-06-29-governance-browser-qa-mobile-blocker.md`
- `docs/exec-plans/tech-debt-tracker.md` — durable blocker, handoff,
  accepted-risk, missing-evidence, and technical-debt tracker.

## Production Boundary

The files above support stakeholder feedback and local demo verification only.
They do not prove regulatory, security, enforcement, evidence repository,
notification, mobile/offline, reporting, audit-log, or production readiness.
