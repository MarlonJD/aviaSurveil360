# Full Backend Scenario Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to execute this plan task by task. Do not
> dispatch subagents unless the user explicitly authorizes subagent work.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement every capability required by all 86 React screens in the
Go/PostgreSQL backend and prove that complete multi-role scenarios produce the
same authorized outcomes in deterministic mock and real HTTP profiles.

**Architecture:** Extend the existing Go modular monolith and one versioned
OpenAPI contract. Preserve module-owned tables, application-service
coordination, same-origin session authority, transactional idempotency/audit/
change/outbox writes, and typed `HttpBackend` mapping. New platform-facing work
is queued through outbox adapters; Plan 3 supplies the production-like local
Keycloak, ClamAV, Mailpit, Gotenberg, and gateway services.

**Tech Stack:** Go 1.26, `chi`, PostgreSQL 17, `pgx`, `sqlc`, OpenAPI 3.1,
generated Go/TypeScript transport, React `HttpBackend`, Keycloak OIDC boundary,
MinIO-compatible private storage, Vitest contracts, Go race/integration tests,
and Playwright mock/HTTP transcript parity.

**Status:** `active` — plan-only; implementation has not started. Independent
review is complete. Execution remains blocked until the Full React 86-Screen
Migration finishes and its route/capability/action contracts are accepted.

## Objective

Replace the remaining demo-only capability boundary with real server authority.
At completion all 86 React routes are available in both demo and HTTP profiles,
every visible command reaches an authorized Go application service or explicit
field-local boundary, and all critical scenarios replay against live PostgreSQL
without test skips or mock fallbacks.

## Scope

- Expand the OpenAPI, generated transports, `Backend`, and `HttpBackend` for all
  capabilities frozen by the 86-screen React plan.
- Add authoritative persistence and services for communications, calendars,
  profiles/settings, teams/assignments, documents, notifications/reminders,
  risk/analytics projections, administration, and advisory drafts.
- Complete existing organization, planning, inspection, checklist,
  Potential Finding, Finding, CAP, Evidence, report, configuration, audit, and
  sync modules for every screen state and action.
- Activate the 69 routes currently marked demo-only in HTTP profile only after
  their contract, authorization, persistence, and live test pass.
- Run identical screen and scenario contracts through `MockBackend` and
  `HttpBackend` and compare normalized transcripts.
- Preserve the existing local OIDC and canonical-header lanes as separate tests.
- Produce synchronized evidence and a complete HTTP capability ledger.

## Assumptions

- Plan 1 has completed Tasks 1–12, reached `ready-for-verification`, and its 86
  route IDs, source-role metadata, capability interfaces, deterministic demo
  scenarios, and visible-action ledger have been independently accepted.
- Plan 3 will replace deterministic worker adapters with local real services;
  this plan must still persist and expose real job state, retry state, and
  immutable output metadata.
- Risk, safety intelligence, SSP/NASP, USOAP, and Oversight Health projections
  are configured management indicators, not automatic legal decisions.
- Inspector Assistant produces a server-side advisory draft using a
  deterministic provider; no external model or autonomous action is introduced.
- Production retention/legal-hold rules remain owner decisions, so this plan
  performs no destructive automatic deletion.

## Global Constraints

- Follow `AGENTS.md`, `MODULE_ARCHITECTURE.md`, canonical workflow docs, and the
  frozen Plan 1 capability contract.
- Server object and field authorization is authoritative for list, direct ID,
  download, decision, audit, notification, and sync paths.
- Auditee response schemas structurally omit internal CAA fields.
- CAP acceptance never closes a Finding; scan-clean exact Evidence and a
  distinct authorized verification/closure decision remain required.
- Every submitted CAP, Evidence, report, checklist template, question set, and
  generated document version is immutable.
- Every state transition writes a required audit event. Important transitions
  also write authorized change feed and outbox records in the same transaction.
- Mutations require idempotency keys and expected revisions where replay or
  concurrency is possible. Conflicts preserve the user's draft.
- Do not add microservices, Kafka, RabbitMQ, destructive retention, external AI,
  production deployment, or HTTP-to-mock fallback.
- Work on the current branch and preserve unrelated untracked paths.

## Ownership Boundaries

| Owner | Responsibility |
|---|---|
| Product/CAA Operations | Scenario truth, role authority, decision vocabulary, and indicator meaning |
| Backend | OpenAPI, domain services, authorization, PostgreSQL, outbox, workers, and live projections |
| Frontend | Frozen capability interface, transport mapping, route activation, conflict/error presentation |
| Identity/Security | Session/OIDC/CSRF policy and field-level privacy review |
| QA | Mock/HTTP invariant transcripts, raw-wire scans, concurrency, migration, recovery, and browser gates |
| Records/Legal | Later production retention/legal-hold decision; no destructive policy is inferred here |

## Module And Persistence Structure

Existing packages remain authoritative and are expanded in place:

- `internal/organizations`, `planning`, `inspections`, `checklists`,
  `potentialfindings`, `findings`, `caps`, `evidence`, `reports`,
  `configuration`, `auditlog`, `identity`, and `sync`.

New bounded packages:

- `internal/assignments`
- `internal/communications`
- `internal/notifications`
- `internal/documents`
- `internal/risk`
- `internal/administration`
- `internal/assistant`

Each persistent module owns `store/postgres/queries.sql` and generated sqlc
files. Cross-module workflows are coordinated by `internal/application` and do
not update another module's tables directly.

### Incremental HTTP mapping rule

Tasks 4–9 each own the generated transport mapping, `HttpBackend` capability
slice, and dual-backend contract for the domain implemented in that task. Their
mock/HTTP transcript checks must not depend on future Task 10 work. Route
metadata remains demo-only until Task 10 runs the aggregate live gate and flips
reviewed routes to dual-profile availability.

## Required Scenario Set

1. Routine/announced Cabin Inspection from Planning through closed Finding.
2. Ad Hoc/unannounced intake through Finance, GM release, Lead preparation,
   executable Audit materialization, withheld notice, and field assignment.
3. Checklist submission/reopen, Potential Finding return/dismiss/convert, and
   Observation defaults.
4. CAP submit/revise/accept/return, Evidence version upload/scan/review, Close,
   Partially Close, Not Close, and separate authorized closure.
5. Preliminary and Final Report DM → GM → Executive Director chains and
   organization-scoped Auditee issue/preview.
6. Checklist template/question/version/package authoring and immutable Audit
   snapshot behavior.
7. Organization master data, teams/workload, calendars, communications,
   documents, reminders, settings, users/roles projection, and audit log.
8. Management risk/SSP/USOAP/CAP-effectiveness projections with no automatic
   enforcement or legal decision.
9. Offline Inspector checkout, causal sync, conflict/re-entry, attachment
   delivery, expiry/revoke/logout/user-switch boundaries.
10. Advisory Inspector draft request with no canonical mutation.

## Phases

1. **Contract and persistence — Tasks 1–2:** freeze the full OpenAPI bundle,
   migrations, SQLC stores, and transaction ownership.
2. **Domain authority — Tasks 3–9:** complete identity, planning, checklist,
   lifecycle, report/document, communication, notification, risk/admin, and
   advisory-draft capabilities.
3. **HTTP activation and proof — Tasks 10–12:** map `HttpBackend`, activate all
   86 HTTP routes, enforce identical scenario transcripts, and record evidence.

---

### Task 1: Modularize And Freeze The Full OpenAPI Contract

**Files**

- Create `api/openapi/source/openapi.json`
- Create `api/openapi/source/paths/core.json`
- Create `api/openapi/source/paths/workflows.json`
- Create `api/openapi/source/paths/platform.json`
- Create `api/openapi/source/schemas/domain.json`
- Create `api/openapi/source/schemas/platform.json`
- Modify `api/openapi/aviasurveil360.yaml` as the generated bundled artifact
- Modify `scripts/generate-contracts.sh`
- Modify `scripts/check-contracts.sh`
- Modify `api/openapi/tests/contract-examples.test.mjs`
- Add closed-schema examples under `api/openapi/examples/full-platform/`

**Interfaces**

The bundled contract remains OpenAPI 3.1 JSON content at the existing path.
Source fragments are assembled deterministically; generated TypeScript and Go
types must fail drift checks. Every mutation declares `Idempotency-Key`, CSRF,
expected revision, typed problem responses, and role/organization security.

- [ ] Write failing bundling/drift/example tests that require every Plan 1
  capability method to map to an operation ID and every response to use closed
  schemas with Auditee-safe variants.
- [ ] Run `./scripts/check-contracts.sh`; confirm failure names missing full
  platform operation IDs, not invalid tooling.
- [ ] Implement deterministic fragment assembly, schemas, operations, examples,
  security metadata, pagination, ETags/revisions, and generated transports.
- [ ] Run contract lint, bundle reproducibility, examples, TypeScript generation,
  Go generation, and `git diff --exit-code` against a second generation.
- [ ] Commit exactly `feat(api): freeze full platform contract`.

### Task 2: Extend Migrations, SQLC, And Transaction Ownership

**Files**

- Create `apps/api/migrations/000007_full_workflow_projection.up.sql`
- Create `apps/api/migrations/000008_communications_documents.up.sql`
- Create `apps/api/migrations/000009_notifications_risk_admin.up.sql`
- Create `apps/api/migrations/000010_identity_settings.up.sql`
- Modify `apps/api/migrations/migrations.go`
- Add module-owned `store/postgres/queries.sql` and generated files for every
  new persistent package
- Modify `scripts/check-sqlc.sh`
- Create `apps/api/tests/integration/full_schema_test.go`

**Interfaces**

Migrations are forward-only and N-1 compatible for the supported local upgrade
window. Foreign keys may reference stable IDs but no module query writes another
module's tables. Append-only/version tables reject updates and deletes through
database constraints where practical.

- [ ] Write failing live-PostgreSQL tests for fresh migration, N-1 upgrade,
  immutable versions, uniqueness/idempotency, organization scope indexes,
  outbox/change/audit linkage, and forbidden cross-module writes.
- [ ] Run the focused integration test and `./scripts/check-sqlc.sh`; confirm red
  for absent migrations/queries.
- [ ] Implement migrations, queries, sqlc configuration, constraints, indexes,
  retention-safe tombstone fields, and exact transaction helpers.
- [ ] Run fresh/N-1 migrations, SQLC drift, race tests, and PostgreSQL query plan
  assertions for list/detail paths.
- [ ] Commit exactly `feat(api): add full platform persistence`.

### Task 3: Complete Identity, Profile, Role, And Organization Authority

**Files**

- Extend `apps/api/internal/identity/`
- Extend `apps/api/internal/organizations/`
- Create `apps/api/internal/administration/users.go`
- Create `apps/api/internal/administration/authorization.go`
- Create `apps/api/internal/administration/store/postgres/queries.sql`
- Modify `apps/api/internal/httpapi/auth.go`
- Modify `apps/api/internal/httpapi/api_projections.go`
- Create `apps/api/tests/integration/identity_organization_scope_test.go`

**Interfaces**

Profiles and settings are application records keyed by stable session subject.
Role membership is projected from the authenticated session; clients cannot
assert roles. User provisioning commands persist requested lifecycle state and
an outbox job; Plan 3 performs the real Keycloak Admin API call.

- [ ] Write failing tests for role/list/direct-ID authorization, user lifecycle
  request, profile/settings revisions, logout/revocation, Auditee own-org-only
  raw wire data, and no pre-guard data fetch.
- [ ] Run focused Go and HTTP tests; confirm missing service/operation failures.
- [ ] Implement application services, projections, authorization, session
  invalidation, provisioning job records, and audit events.
- [ ] Run race tests, live OIDC session tests, raw JSON forbidden-field scans,
  and direct-ID/list isolation.
- [ ] Commit exactly `feat(api): complete identity and organization authority`.

### Task 4: Complete Planning, Assignment, Team, And Inspection Packages

**Files**

- Extend `apps/api/internal/planning/`
- Create `apps/api/internal/assignments/state.go`
- Create `apps/api/internal/assignments/service.go`
- Create `apps/api/internal/assignments/authorization.go`
- Create `apps/api/internal/assignments/store/postgres/queries.sql`
- Extend `apps/api/internal/inspections/`
- Modify `apps/api/internal/application/service.go`
- Create `apps/api/tests/integration/planning_assignment_scenario_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for planning, assignment, team, and package capabilities

**Interfaces**

Planning item creation, Finance/GM/Executive decisions, Department preparation,
Lead/team assignment, question assignment, package snapshot, and Audit
materialization are separate commands. Unannounced notice remains withheld and
no executable Audit exists before preparation confirmation.

- [ ] Write failing routine and Ad Hoc scenario tests with revision conflict,
  denial, zero-budget Finance, return/re-entry, workload, exact template version,
  duplicate materialization, and organization-notice assertions.
- [ ] Run focused Go/integration tests and confirm missing states/services.
- [ ] Implement state machines, transactional services, projections, assignment
  package snapshots, audit events, change feed, outbox records, generated
  transport mappers, and the matching `HttpBackend` capability slice.
- [ ] Run race/integration and normalized mock/HTTP planning transcripts.
- [ ] Commit exactly `feat(api): complete planning and assignment workflow`.

### Task 5: Complete Checklist, Template, Question, And Package Configuration

**Files**

- Extend `apps/api/internal/checklists/`
- Extend `apps/api/internal/configuration/`
- Create `apps/api/internal/application/template_workflow.go`
- Modify `apps/api/internal/httpapi/route_families_api.go`
- Create `apps/api/tests/integration/template_execution_snapshot_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for checklist and configuration capabilities

**Interfaces**

Draft questions/templates/packages are editable only at valid draft revisions.
Publish creates immutable versions. Existing Audits retain exact template,
question, reference, evidence-expectation, and package snapshots.

- [ ] Write failing tests for question CRUD/reorder, multiline text, template
  publish/version history, package assembly, Audit snapshot immutability,
  checklist save/submit/reopen, and role denial.
- [ ] Run focused tests and confirm absent operations/state red.
- [ ] Implement state, services, authorization, projections, version snapshots,
  transaction/audit/outbox behavior, generated transport mappers, and the
  matching `HttpBackend` capability slice.
- [ ] Run race/integration, generated-contract, and mock/HTTP checklist/template
  transcript parity.
- [ ] Commit exactly `feat(api): complete checklist configuration workflow`.

### Task 6: Complete Finding, CAP, Evidence, And Closure Authority

**Files**

- Extend `apps/api/internal/potentialfindings/`
- Extend `apps/api/internal/findings/`
- Extend `apps/api/internal/caps/`
- Extend `apps/api/internal/evidence/`
- Extend `apps/api/internal/application/canonical_transitions.go`
- Extend `apps/api/internal/application/auditee_projections.go`
- Create `apps/api/tests/integration/full_finding_lifecycle_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for Finding, CAP, Evidence, and closure capabilities

**Interfaces**

The exact chain is Checklist Response → Potential Finding → Lead decision →
Finding → immutable CAP revision/review → immutable Evidence version/scan/review
→ verification or explicit authorized closure. Partial/not-close remains open.

- [ ] Write failing tests for every valid/invalid transition, Observation
  defaults, return/dismiss reasons, concurrency, exact version scan gate,
  CAP-not-closure, partial/not-close, authorized closure, organization privacy,
  audit/outbox atomicity, and idempotent replay.
- [ ] Run focused Go/live HTTP tests and confirm state/service red failures.
- [ ] Implement missing reads/commands/projections, transaction coordination,
  generated transport mappers, and the matching `HttpBackend` capability slice
  without overwriting submitted versions.
- [ ] Run race/integration, upload/worker contract, raw-wire privacy, and full
  mock/HTTP canonical transcript comparison.
- [ ] Commit exactly `feat(api): complete finding lifecycle authority`.

### Task 7: Complete Reports And Document Job Authority

**Files**

- Extend `apps/api/internal/reports/`
- Create `apps/api/internal/documents/state.go`
- Create `apps/api/internal/documents/service.go`
- Create `apps/api/internal/documents/store/postgres/queries.sql`
- Create `apps/api/internal/documents/renderer.go`
- Extend `apps/api/internal/application/service.go`
- Create `apps/api/tests/integration/report_document_workflow_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for report and document capabilities

**Interfaces**

Preliminary and Final Reports are separate immutable version families. DM, GM,
and Executive decisions bind exact versions. Organization issue creates an
Auditee-safe projection. Document rendering is an idempotent outbox job whose
real Gotenberg adapter arrives in Plan 3.

- [ ] Write failing tests for preparation/readiness, return, DM/GM/Executive
  authority, exact version, duplicate decision, Auditee issue, document job,
  output hash/version, download authorization, and no Finding auto-closure.
- [ ] Run focused tests; confirm missing document/report operations.
- [ ] Implement report/document states, services, projections, job records,
  private object metadata, audit/change/outbox transaction behavior, generated
  transport mappers, and the matching `HttpBackend` capability slice.
- [ ] Run race/integration and normalized mock/HTTP report transcripts.
- [ ] Commit exactly `feat(api): complete report and document workflow`.

### Task 8: Add Communications, Notifications, Reminders, And Calendars

**Files**

- Create `apps/api/internal/communications/`
- Create `apps/api/internal/notifications/`
- Extend existing reminder/configuration projections
- Create `apps/api/internal/application/communications_workflow.go`
- Create `apps/api/tests/integration/communications_notification_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for communications, notification, reminder, and calendar capabilities

**Interfaces**

Threads are object- and organization-scoped. `AUDITEE_VISIBLE` messages and
`INTERNAL_CAA` notes are distinct types and storage paths. Notification events
produce recipient-specific in-app records and idempotent email jobs; Plan 3
delivers them through SMTP. Calendars are projections over authorized work, not
an independent source of truth.

- [ ] Write failing tests for message visibility, unread counts, internal-note
  exclusion, attachment metadata, reminder rules, Due Soon/Overdue scheduling,
  duplicate suppression, calendar scope, and email job audit trail.
- [ ] Run focused tests and confirm absent modules.
- [ ] Implement services, queries, projections, scheduler command, recipient
  policy, outbox jobs, retries, audit events, generated transport mappers, and
  the matching `HttpBackend` capability slice.
- [ ] Run race/integration and mock/HTTP communications/notification transcripts.
- [ ] Commit exactly `feat(api): add communications and notification authority`.

### Task 9: Add Risk, Intelligence, Analytics, Admin, And Advisory Draft Projections

**Files**

- Create `apps/api/internal/risk/`
- Extend `apps/api/internal/administration/`
- Create `apps/api/internal/assistant/provider.go`
- Create `apps/api/internal/assistant/service.go`
- Create `apps/api/internal/assistant/deterministic_provider.go`
- Create `apps/api/tests/integration/management_admin_assistant_test.go`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Expand `apps/web/tests/contract/` for risk, analytics, administration, and advisory-draft capabilities

**Interfaces**

Risk/SSP/USOAP/CAP-effectiveness/Oversight Health values are versioned
projections with source, calculation time, reason, and non-decision label.
Assistant drafts accept authorized Finding/checklist context, redact forbidden
fields, return a draft with provenance, and perform no canonical mutation.

- [ ] Write failing tests for projection source/refresh, role denial, no automatic
  enforcement/closure, administration lists/audit filters, deterministic draft,
  prompt/data minimization, no mutation, and complete audit events.
- [ ] Run focused tests and confirm missing modules.
- [ ] Implement read models, configured calculations, admin projections,
  deterministic advisory provider/service, generated transport mappers, and the
  matching `HttpBackend` capability slice.
- [ ] Run race/integration, raw-wire privacy, and mock/HTTP projection parity.
- [ ] Commit exactly `feat(api): add governed management projections`.

### Task 10: Finalize The HttpBackend Registry And Activate 86 HTTP Routes

**Files**

- Modify `apps/web/src/backend/backend.ts`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/transport-mappers.test.ts`
- Modify `apps/web/src/app/route-contracts.ts`
- Modify `apps/web/src/app/route-contracts.test.ts`
- Expand `apps/web/tests/contract/`
- Modify `apps/web/scripts/assert-http-artifact.mjs`

**Interfaces**

Tasks 4–9 have already mapped their domain slices from generated transport to
UI-domain projections. Task 10 fails on any unmapped capability, consolidates
shared error/cursor/session behavior, and changes each route to
`availableProfiles: ["demo", "http"]` only after its exact live contract passes.
No handwritten transport DTO or hidden retry is allowed.

- [ ] Write failing adapter contracts for every capability, HTTP problem,
  cancellation, timeout, conflict, unauthorized session, cursor, raw forbidden
  field, and route-profile activation.
- [ ] Run focused Vitest/HTTP contracts and confirm any remaining registry,
  shared-error, or activation gaps rather than domain mappings deferred from
  Tasks 4–9.
- [ ] Complete the aggregate registry and shared adapters, activate each route
  in reviewed domain batches, and keep local draft/conflict presentation explicit.
- [ ] Run typecheck, all backend contracts against mock and live HTTP, artifact
  exclusions, and direct loads for all 86 routes.
- [ ] Commit exactly `feat(web): activate full http capability parity`.

### Task 11: Enforce Complete Multi-Role Mock And HTTP Transcript Parity

**Files**

- Create `apps/web/tests/e2e/full-platform-scenarios.spec.ts`
- Create `apps/web/tests/contract/full-platform-backend.contract.ts`
- Modify `apps/web/playwright.config.ts`
- Modify `scripts/test-http-profile.sh`
- Modify `tests/parity/behavior-ledger.json`
- Modify `tests/parity/react-legacy-parity.test.mjs`
- Create `apps/api/tests/integration/full_platform_denials_test.go`
- Create `apps/api/cmd/test-profile-reset/`
- Create `apps/api/internal/httpapi/test_profile_boundary_test.go`
- Create `scripts/reset-test-profile.sh`

**Interfaces**

The same scenario implementation runs under mock and HTTP projects. A normalized
transcript records exact entity IDs, revision/status/owner, role, organization,
version, audit-event types, notification/document jobs, denials, and dashboard
projections.

Deterministic reset is an explicit test-profile-only, out-of-process one-shot
command. It is never registered as a route in the normal OIDC/full API. The full
profile starts from fresh scoped volumes and uses normal authorized
provisioning/application commands; `/__test/*` must return 404 there.

- [ ] Write failing scenario tests for the 10 required scenario families and
  mutation fixtures for a skipped HTTP project, normalized mismatch, forbidden
  field, missing denial, missing audit event, or UI-only state change.
- [ ] Run mock and HTTP scenario commands and confirm the HTTP gaps fail.
- [ ] Complete the test-profile-only reset command, deterministic clocks/IDs,
  transcript normalizer, live service orchestration, and fail-closed project
  checks. Add mutation tests proving reset/seed routes cannot be registered in
  normal OIDC/full configuration.
- [ ] Run Go race/integration, HTTP contracts, 86 HTTP routes × three viewports,
  OIDC, offline sync, and exact mock/HTTP transcript equality.
- [ ] Commit exactly `test(api): enforce full scenario parity`.

### Task 12: Run The Full Backend Matrix And Prepare Handoff

**Files**

- Create `docs/demo-evidence/FULL_BACKEND_SCENARIO_PARITY_2026-07-22.md`
- Create `docs/demo-evidence/FULL_BACKEND_SCENARIO_PARITY_2026-07-22.turkce.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.turkce.md`
- Modify `docs/index.md`
- Modify `MANIFEST.md`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify this plan

- [ ] Run clean generation, migrations, SQLC, Go race/unit/integration, React,
  artifacts, root oracle, mock contracts/browser, canonical HTTP, OIDC, offline,
  all 86 HTTP routes, all 10 scenario families, audits, and cleanup.
- [ ] Record endpoint/operation/module/table/role/screen/action coverage and
  prove 86 dual-profile routes with zero mock imports in HTTP and zero
  test/reset routes in the normal full API.
- [ ] Record transient failures separately and count only fresh full green runs.
- [ ] Write synchronized evidence and set the plan to
  `ready-for-verification` only if every required local gate passes.
- [ ] Commit exactly `docs(evidence): record full backend scenario parity` and
  push only when explicitly authorized.

## Required Verification Matrix

```bash
npm --prefix apps/web ci
./scripts/check-contracts.sh
./scripts/check-sqlc.sh
node api/openapi/tests/contract-examples.test.mjs
GOCACHE=/private/tmp/aviasurveil360-full-go-cache go -C apps/api test -race -p 1 -count=1 ./...
npm --prefix apps/web run typecheck
npm --prefix apps/web test
node --test tests/*.test.js tests/parity/react-legacy-parity.test.mjs
npm --prefix apps/web run build:demo
npm --prefix apps/web run build:http
npm --prefix apps/web run check:app-shell
node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
node apps/web/scripts/assert-parity-boundary.mjs
npm --prefix apps/web run test:e2e:mock
./scripts/test-http-profile.sh
./scripts/test-http-oidc-profile.sh
npm --prefix apps/web run test:e2e:offline
```

Expected final scope: 86 dual-profile routes, complete live PostgreSQL
projections, 10 mock/HTTP-identical scenario families, zero HTTP mock/seed input,
zero skipped projects, and no task-owned residue.

## Risks And Controls

| Risk | Control |
|---|---|
| OpenAPI becomes an unreviewable monolith | Deterministic source fragments and generated bundled canonical artifact |
| Shared database becomes cross-module coupling | Module-owned SQLC stores, transaction coordinator, forbidden-write tests |
| UI and API drift despite matching names | Same backend contract and scenario implementation against mock and HTTP |
| Auditee or direct-ID privacy leak | Raw-wire schema variants, list/direct-ID/download denial tests |
| Idempotency hides partial transactions | Mutation/audit/change/outbox exact transaction assertions and lost-ack replay |
| Indicator or assistant becomes authority | Non-decision labels, no-mutation tests, explicit role/field authorization |
| External services block backend progress | Persist real job state now; activate adapters in Plan 3 |
| Route activation exposes an incomplete screen | Per-route HTTP activation only after focused live contract and direct-load pass |

## Dependencies

- Plan 1 route/capability/action contracts and deterministic scenarios.
- Plan 1 Tasks 1–12 must be complete and its contract handoff independently
  accepted; partial overlap with Plan 1 is not allowed.
- Existing Go authority, upload, OIDC, offline sync, and local profile foundations.
- Plan 3 consumes the provisioning, scan, email, and document job adapters.
- Plan 4 consumes health, metrics, job, migration, backup, and failure semantics.

## Out Of Scope

- Real Keycloak Admin API provisioning, TOTP enrollment UI, ClamAV signatures,
  SMTP delivery, Gotenberg rendering, Caddy HTTPS, and consolidated Compose.
- Production identity federation, external model provider, legal retention,
  enforcement case automation, deployment, Terraform, Terragrunt, or AWS.
- Traffic cutover or root-demo removal.

## Execution Prompt

```text
Execute docs/exec-plans/active/2026-07-22-full-backend-scenario-parity-plan.md task by task with superpowers:executing-plans only after the Full React 86-Screen Migration completes Tasks 1-12, reaches ready-for-verification, and its route/capability/action handoff is independently accepted. Do not overlap this plan with unfinished React-plan work. Do not dispatch subagents unless explicitly authorized. Work on the current branch and preserve unrelated .superpowers/, docs/demo-evidence/stakeholder/, and outputs/ content.

Keep one Go modular monolith with separate API/worker processes, one generated OpenAPI contract, PostgreSQL module-owned stores, transactional idempotency/audit/change/outbox writes, and strict server authorization. Tasks 4-9 must each implement their own generated transport mapping and HttpBackend slice before running mock/HTTP transcript parity; Task 10 is the aggregate registry and route-activation gate. Implement every capability used by all 86 routes and activate a route in HTTP only after its focused live contract passes. Never fall back to mock in the HTTP artifact, and never expose test reset/seed routes in normal OIDC/full mode.

Preserve Potential Finding authority, immutable checklist/CAP/Evidence/report/document versions, Auditee organization isolation, Internal CAA Note separation, scan-clean Evidence gating, report decision authority, explicit closure basis, offline recovery, and advisory-only risk/assistant behavior. Run the same scenario implementations against MockBackend and HttpBackend and require exact normalized transcript parity.

Use the plan's TDD order and exact per-task commit messages only when Git actions are separately authorized. Inspect upstream, allowlist, cached names, full cached diff, and diff check before every commit. Do not start external platform-service integration, deploy, remove the root demo, or claim production readiness. Finish with synchronized evidence and stakeholder verification as the next todo.
```
