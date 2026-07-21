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
| `demo-evidence/GO_POSTGRES_FOUNDATION_2026-07-21.md` | Task 9 one-module Go, forward-only PostgreSQL, generation, and local profile evidence. |
| `demo-evidence/CANONICAL_AUTHORITY_FOUNDATION_2026-07-21.md` | Task 10 domain authority, isolation, session/OIDC, idempotency, audit, and migration evidence. |
| `demo-evidence/BOUNDED_UPLOAD_AND_HTTP_PARITY_2026-07-21.md` | Task 11 private bounded upload, deterministic scan, live HTTP contract, and mock/HTTP parity evidence. |
| `demo-evidence/PWA_OFFLINE_READINESS_2026-07-21.md` | Task 6 app-shell-only cache, explicit readiness, restart survival, multi-client update, and server-stopped startup evidence. |
| `demo-evidence/INDEXEDDB_FIELD_STORAGE_2026-07-21.md` | Task 7 atomic subject-scoped field storage, causal outbox, v1 migration, and pending/in-flight browser restart evidence. |
| `demo-evidence/OPFS_INSPECTION_ATTACHMENT_RECOVERY_2026-07-21.md` | Task 8 manifest-first OPFS staging, startup reconciliation, no-delete policy, and server-stopped attachment restart evidence. |
| `../api/openapi/aviasurveil360.yaml` | Minimal versioned transport source for the authorized local candidate slices. |
| `../apps/web/` | Build-time-separated React/Vite mock and HTTP candidate entries plus verified PWA/readiness, atomic field-storage/outbox, and manifest-first OPFS attachment foundations; network sync remains the next slice. |
| `../apps/api/` | One-module Go API/worker candidate with canonical authority, local OIDC/session, PostgreSQL stores, and bounded upload/scan services. |
| `../deploy/local/compose.test.yaml` | Pinned isolated PostgreSQL, Keycloak, and MinIO local verification profile. |

## Demo Boundary

AviaSurveil360 remains a planning pack with the intact frontend-only static
clickable demo plus a separate `candidate-only` React/Go vertical. A real local
Go/PostgreSQL HTTP path, pinned local Keycloak exchange, private MinIO upload,
deterministic scan worker, canonical mock/HTTP browser parity, and Task 6
app-shell/readiness/restart behavior plus Task 7-8 field/attachment recovery are
`verified locally`. These are not
deployed production services. The docs do not claim production OIDC/MFA,
production authorization operations, production storage/scanning or Evidence
records management, production synchronization, notification delivery, deployment, remote CI,
cutover, legacy removal, or production readiness.
