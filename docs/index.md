# AviaSurveil360 Docs Index

This is the canonical docs map for AviaSurveil360. Use it after the root
`AGENTS.md`, `README.md`, and `MANIFEST.md`.

## Core Surfaces

| Surface | Use |
|---|---|
| `agent-harness/index.md` | Agent routing, output contracts, verification, registry, and cleanup rules. |
| `exec-plans/index.md` | Active execution-plan status and one next concrete todo per plan. |
| `exec-plans/tech-debt-tracker.md` | Durable blockers, accepted risks, missing evidence, and technical debt. |
| `product-specs/index.md` | Product source documents for domain, workflow, UX, data, analytics, scenarios, and references. |
| `demo-handoff/` | Demo prompts, stakeholder acceptance criteria, and full-MVP handoff prompt. |
| `demo-evidence/BUILD_SUMMARY.md` | Current local demo evidence, known limitations, and production gaps. |
| `demo-evidence/REACT_MOCK_SLICE_2026-07-20.md` | Tasks 2-4 React mock candidate scope, canonical transcript, local gates, and explicit exclusions. |
| `../api/openapi/aviasurveil360.yaml` | Minimal versioned transport source for the authorized React mock slice. |
| `../apps/web/` | Build-time-separated React/Vite demo and HTTP candidate entries; no real API or offline behavior. |

## Demo Boundary

AviaSurveil360 remains a planning pack with the intact frontend-only static
clickable demo plus a separate `candidate-only` React mock vertical. The typed
HTTP adapter is fake-fetch tested only. The docs do not claim a real backend,
database, deployed API, authentication, production authorization enforcement,
real upload/storage, PWA/offline persistence, real regulatory ingestion,
production synchronization, notification delivery, deployment, production
audit-log behavior, remote CI, cutover, or production readiness.
