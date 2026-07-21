# AviaSurveil360 Package Manifest

This repository is a planning pack plus an intact **frontend-only static
clickable demo** and a separate `candidate-only` React/Go application. It is
not a production system.

Candidate boundary: a local Go/PostgreSQL API/worker, pinned local Keycloak,
private MinIO upload, deterministic scan adapter, real canonical HTTP scenario,
and Task 6 PWA app-shell/offline-readiness foundation are `verified locally`.
They are not deployed production services. Production OIDC/MFA, production
storage/scanning/records policy, atomic offline field/outbox persistence,
staged offline attachments, production synchronization, deployment, cutover,
legacy removal, and a `production-ready` claim remain excluded or `blocked`.
The root Vanilla demo remains intact.

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
- `js/manager-workspaces.js` — Department Manager workspace state normalization
  and lookup selectors.
- `js/work-items.js` — shared work-item shaping plus deterministic,
  organization-scoped browser-local reminder and manager-attention records.
- `js/views.js` — static demo screen rendering.
- `js/app.js` — role routing, UI action handling, mock interactions, and demo
  bootstrapping.

## Versioned Contract, React Candidate, And Go Candidate

- `api/openapi/aviasurveil360.yaml` — minimal versioned transport contract for
  the authorized local candidate slices.
- `api/openapi/examples/canonical/` — canonical closed-schema request and
  response examples.
- `api/openapi/tests/contract-examples.test.mjs` — OpenAPI example and Auditee
  projection checks.
- `scripts/generate-contracts.sh` and `scripts/check-contracts.sh` — checked
  TypeScript generation, lint, example validation, and drift detection.
- `tests/parity/behavior-ledger.json` — nine-entry canonical scenario and role
  entry parity ledger.
- `tests/parity/react-legacy-parity.test.mjs` — executable ledger and intact
  legacy-oracle checks.
- `apps/web/` — React + TypeScript + Vite candidate with build-time-separated
  demo and HTTP entries.
- `apps/web/src/backend/` — one capability-composed `Backend`, thin typed HTTP
  adapter, transport mapping, and boundary invariants.
- `apps/web/src/mock/` — deterministic `MemoryMockStore`, mock seed, and
  `MockBackend`; reachable only from the demo build entry.
- `apps/web/src/features/` — canonical Cabin Inspection assignments,
  inspection, checklist, Finding, CAP, Evidence, report, and dashboard routes.
- `apps/web/src/sw.ts` — version-fenced app-shell-only Service Worker; it does
  not cache authenticated API or business-record responses.
- `apps/web/src/offline/storage-readiness.ts` — thirteen-result explicit
  managed-profile gate, browser storage canaries, restart proof, exact grant
  checks, and foundation checkout snapshot boundary.
- `apps/web/src/offline/update-coordinator.ts` — positive N/N-1 compatibility,
  pending-work deferral, cross-tab owner lock/broadcast, migration pause,
  read-only recovery, and shell-only rollback policy.
- `apps/web/src/features/inspections/offline-readiness-panel.tsx` — explicit
  policy attestations, online fallback, advisory capacity, checkout result, and
  site-data-loss messaging.
- `apps/web/tests/contract/` — reusable backend contract executed against the
  deterministic mock harness and the seeded live HTTP profile.
- `apps/web/tests/e2e/canonical-scenario.spec.ts` — normalized mock-mode Cabin
  lifecycle and organization-isolation browser scenario, executed unchanged
  under mock and HTTP Playwright projects.
- `apps/web/tests/e2e/offline-*.spec.ts` — dedicated persistent-profile Chrome
  restart/server-stop startup and two-client update/site-data recovery checks.
- `apps/web/scripts/assert-app-shell-artifact.mjs` — generated manifest/asset,
  version marker, and forbidden Service Worker behavior gate.
- `apps/web/scripts/assert-http-artifact.mjs` — HTTP build input/public-artifact
  exclusion gate for mock, seed, and test-profile code plus app-shell policy.
- `apps/api/go.mod` — the single Go module and pinned runtime dependencies.
- `apps/api/cmd/api/` and `apps/api/cmd/worker/` — production-shaped HTTP and
  worker command entry points.
- `apps/api/internal/` — canonical domain/authority modules, module-owned
  PostgreSQL stores, same-origin OIDC/session boundary, private object-store
  adapter, Evidence and Inspection Attachment upload services, deterministic
  scan worker, and fail-closed local test profile.
- `apps/api/internal/httpapi/generated/` — checked generated Go OpenAPI types.
- `apps/api/migrations/` — forward-only PostgreSQL foundation, authority, and
  Evidence upload migrations with retained N-1 verification.
- `apps/api/sqlc.yaml` and module-owned `queries.sql` / generated store output —
  checked SQLC source and drift-controlled persistence boundaries.
- `apps/api/tests/integration/` — live PostgreSQL, Keycloak, MinIO, authority,
  upload, worker recovery/failure/timeout, migration, generation, and cleanup
  tests.
- `deploy/local/compose.test.yaml` — digest-pinned, isolated local PostgreSQL,
  Keycloak, and MinIO verification services.
- `scripts/test-http-profile.sh` — fresh Go race/generation, live API/worker,
  React contract/build, mock/HTTP Playwright, and task-owned cleanup profile.

## Smoke Tests

There is no root `package.json`; root legacy checks use Node directly. The
separate `apps/web/package.json` owns the React candidate commands.

- `tests/approval-smoke.test.js`
- `tests/audit-work-queue-smoke.test.js`
- `tests/browser-scenario-contract-smoke.test.js` — role/action authority,
  canonical CAP/Finding mutation, reason-required reopen, and closure-label
  regression coverage.
- `tests/checklist-approval-smoke.test.js`
- `tests/checklist-comment-render-smoke.test.js`
- `tests/checklist-management-smoke.test.js`
- `tests/demo-boundary-smoke.test.js`
- `tests/department-manager-findings-smoke.test.js`
- `tests/department-manager-state-smoke.test.js`
- `tests/department-preliminary-review-smoke.test.js`
- `tests/executive-director-workspace-smoke.test.js`
- `tests/finance-review-workspace-smoke.test.js`
- `tests/general-manager-workspace-smoke.test.js`
- `tests/governance-render-smoke.test.js`
- `tests/harness-docs-smoke.test.js`
- `tests/inspection-execution-smoke.test.js`
- `tests/inspection-coordination-smoke.test.js`
- `tests/inspection-lifecycle-alignment-smoke.test.js`
- `tests/inspection-team-smoke.test.js`
- `tests/unannounced-inspection-intake-smoke.test.js` — implemented focused
  coverage for Department Manager Planning intake, notice-policy persistence,
  governed materialization, idempotency, and Service Provider privacy.
- `tests/inspector-nav-smoke.test.js`
- `tests/lead-inspector-nav-smoke.test.js`
- `tests/lead-inspector-workspace-smoke.test.js`
- `tests/manager-cap-monitoring-smoke.test.js`
- `tests/manager-checklist-management-smoke.test.js`
- `tests/manager-navigation-dashboard-smoke.test.js`
- `tests/manager-report-pdf-smoke.test.js`
- `tests/manager-reports-approval-smoke.test.js`
- `tests/manager-risk-dashboard-smoke.test.js`
- `tests/manager-workspace-responsive-smoke.test.js`
- `tests/planning-release-smoke.test.js`
- `tests/planning-render-smoke.test.js`
- `tests/planning-workspace-smoke.test.js`
- `tests/premium-ui-remediation-smoke.test.js`
- `tests/report-approval-smoke.test.js`
- `tests/scenario-integrity-regression.test.js` — exact-Audit checklist,
  Potential Finding, Observation, closure, and deterministic reminder contract.
- `tests/service-provider-final-report-smoke.test.js`
- `tests/service-provider-portal-smoke.test.js`
- `tests/stakeholder-readiness-regressions.test.js`
- `tests/table-first-workbench-smoke.test.js`
- `tests/ui-screenshot-audit-remediation-smoke.test.js` — focused responsive,
  interaction, and truthful-control contract for the 86-screen visual audit.

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
- `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md` — canonical 86-screen
  desktop, tablet, and mobile visual-audit evidence.
- `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.turkce.md` — Turkish
  stakeholder companion for the visual-audit evidence.
- `docs/demo-evidence/BROWSER_SCENARIO_INTEGRITY_2026-07-20.md` — canonical
  real-click browser matrix, automated gate, console, screenshot, and cleanup evidence.
- `docs/demo-evidence/BROWSER_SCENARIO_INTEGRITY_2026-07-20.turkce.md` — Turkish
  stakeholder companion for the scenario-integrity evidence.
- `docs/demo-evidence/REACT_MOCK_SLICE_2026-07-20.md` — canonical Tasks 2-4
  React mock slice scope, transcript, local verification, and evidence limits.
- `docs/demo-evidence/REACT_MOCK_SLICE_2026-07-20.turkce.md` — Turkish
  stakeholder companion for the React mock slice evidence.
- `docs/demo-evidence/GO_POSTGRES_FOUNDATION_2026-07-21.md` and `.turkce.md` —
  Task 9 Go/PostgreSQL candidate foundation evidence.
- `docs/demo-evidence/CANONICAL_AUTHORITY_FOUNDATION_2026-07-21.md` and
  `.turkce.md` — Task 10 authority, OIDC/session, isolation, and audit evidence.
- `docs/demo-evidence/BOUNDED_UPLOAD_AND_HTTP_PARITY_2026-07-21.md` and
  `.turkce.md` — Task 11 bounded upload/scan, live `HttpBackend`, and shared
  mock/HTTP scenario evidence.
- `docs/demo-evidence/PWA_OFFLINE_READINESS_2026-07-21.md` and `.turkce.md` —
  Task 6 app-shell caching, explicit readiness, restart survival, multi-client
  update, and actual server-stopped startup evidence.
- `docs/demo-evidence/INDEXEDDB_FIELD_STORAGE_2026-07-21.md` and `.turkce.md` —
  Task 7 atomic subject-scoped field storage, causal outbox, migration, and
  pending/in-flight restart-recovery evidence.
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
- `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- `docs/exec-plans/active/2026-06-14-aviasurveil-demo-only-prototype-plan.md`
- `docs/exec-plans/active/2026-06-23-ncaa-platform-v2-and-mvp-plan.md`
- `docs/exec-plans/active/2026-06-28-caa-governance-workflow-and-roles-plan.md`
- `docs/exec-plans/active/2026-06-29-agent-harness-readiness-completion-plan.md`
- `docs/exec-plans/active/2026-06-29-aviasurveil-harness-engineering-adaptation-plan.md`
- `docs/exec-plans/active/2026-06-30-planning-panel-simplification-plan.md`
- `docs/exec-plans/active/2026-07-01-table-first-surveillance-workbench-ux-plan.md`
- `docs/exec-plans/active/2026-07-08-modern-aviation-saas-rollout-plan.md`
- `docs/exec-plans/active/2026-07-08-premium-ui-remediation-plan.md`
- `docs/exec-plans/active/2026-07-09-cabin-inspection-demo-scenario-plan.md`
- `docs/exec-plans/active/2026-07-09-department-manager-workspaces-plan.md`
- `docs/exec-plans/active/2026-07-10-inspector-report-and-governance-workflow-remediation-plan.md`
- `docs/exec-plans/active/2026-07-10-stakeholder-readiness-final-remediation-plan.md`
- `docs/exec-plans/active/2026-07-18-inspection-lifecycle-alignment-plan.md`
- `docs/exec-plans/active/2026-07-19-ui-screenshot-audit-remediation-plan.md`
- `docs/exec-plans/active/2026-07-20-unannounced-inspection-intake-alignment-plan.md`
- `docs/exec-plans/active/2026-07-20-browser-scenario-integrity-remediation-plan.md`

## Execution Plan Archive And Tracker

- `docs/exec-plans/completed/index.md` — completed and archived execution-plan
  records.
- `docs/exec-plans/completed/2026-06-29-governance-browser-qa-mobile-blocker.md`
- `docs/exec-plans/tech-debt-tracker.md` — durable blocker, handoff,
  accepted-risk, missing-evidence, and technical-debt tracker.

## Production Boundary

The files above support stakeholder feedback, local demo verification, and a
`candidate-only` React/Go vertical. They prove the scoped local HTTP/API,
authority, audit-event, private upload, deterministic scan, scenario contracts,
and Task 6 app-shell/readiness/restart behavior recorded in Task evidence. They
do not prove production identity/MFA, production storage/scanning or records
operations, regulatory or enforcement approval, notification delivery, atomic
offline field/outbox or attachment persistence, production sync, deployment,
cutover, release, or production readiness.
