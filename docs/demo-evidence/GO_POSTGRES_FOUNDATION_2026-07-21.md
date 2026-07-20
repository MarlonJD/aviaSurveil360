# Go And PostgreSQL Foundation Evidence — 2026-07-21

## Outcome

- Evidence status: `verified locally`
- Artifact status: `candidate-only`
- Release status: `release pending`
- Production deployment, cutover, and legacy removal: `blocked`
- Canonical domain transitions, real OIDC, object upload/scan, real HTTP parity, offline storage, sync, and production operations: `not run`

Task 9 establishes the one-module Go runtime and PostgreSQL foundation without claiming later-slice behavior. The root Vanilla demo remains intact as the behavioral reference.

## Test-First Evidence

The initial tests failed for the intended missing capabilities: no checked Go OpenAPI generator/output, no Go runtime packages, no fail-closed readiness response in the contract, no platform session/idempotency/audit/outbox boundaries, and no pinned local PostgreSQL profile. The first full profile also failed on a real generator defect: the `pushFieldOperation` operation request collided with the `PushFieldOperationRequest` schema. Operation types were placed in a separate generated namespace and the complete profile then passed.

## Verified Foundation

- Go `1.26` module containing independently buildable `cmd/api` and `cmd/worker` commands.
- `chi` health routing and `pgx` pool/transaction primitives.
- Liveness independent of PostgreSQL; readiness fails closed for unavailable dependencies or an incompatible migration version.
- Production configuration rejects test principal, test session, and development-secret bypasses.
- Explicit test configuration creates one deterministic PostgreSQL identity/session pair, preserves its original eight-hour expiry across idempotent bootstrap, and is unreachable from production configuration.
- Repository-owned, versioned Go request/response/model/handler generation from the same OpenAPI 3.1 source as TypeScript, with SHA-256 source binding and clean-regeneration checks.
- SQLC `1.30.0` locked through the Go tool graph, with module-owned Organization and Inspection PostgreSQL query packages and clean-regeneration checks.
- Two forward-only migrations covering the Task 9 platform and workflow tables, plus empty-install and retained N-1 upgrade verification against live PostgreSQL.
- PostgreSQL `17.6-alpine3.22` pinned to a multi-architecture digest, with an isolated named volume, health check, deterministic credentials, and cleanup trap.

## Fresh Verification

The final command was:

```bash
./scripts/test-http-profile.sh
```

It completed with exit code `0` and proved:

- API and worker builds: pass
- Go race suite: pass
- Empty migration install: pass
- Retained N-1 upgrade fixture: pass
- Health/config/platform tests: pass
- Deterministic test identity/session bootstrap: pass
- OpenAPI examples and TypeScript/Go generation drift: pass
- SQLC generation drift: pass
- Task-owned PostgreSQL container, network, and volume cleanup: pass

The evidence supports only a local candidate foundation. A `production-ready` claim remains blocked by the separate release/operations gate.
