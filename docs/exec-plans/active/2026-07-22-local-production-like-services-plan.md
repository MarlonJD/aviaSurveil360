# Local Production-Like Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to execute this plan task by task. Do not
> dispatch subagents unless the user explicitly authorizes subagent work.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the complete 86-screen AviaSurveil360 application locally through
Docker Compose with production-like HTTPS, OIDC/MFA/provisioning, private object
storage, real malware scanning, SMTP delivery, PDF rendering, workers, secrets,
and clean operational boundaries.

**Architecture:** Keep the application as one React artifact and one Go module,
but package the gateway, API, workers, identity, databases, object store,
scanner, email sink, and document renderer as isolated containers. Caddy owns
the one local HTTPS origin. Application commands persist durable jobs first;
workers call typed Keycloak, ClamAV, SMTP, Gotenberg, and MinIO adapters with
idempotent retries and observable terminal state.

**Tech Stack:** Docker Compose, multi-stage Dockerfiles, Caddy, React/Vite
static HTTP artifact, Go API/worker, PostgreSQL 17, Keycloak 26-compatible OIDC
realm with TOTP MFA, MinIO, ClamAV `clamd`/`freshclam`, Mailpit SMTP, Gotenberg,
Docker secrets, SOPS + age, Playwright, and the existing contract/integration
test harness.

**Status:** `active` — plan-only; implementation has not started. Independent
review is complete. Execution remains dependent on accepted React and backend
plans; it must not overlap their unfinished work.

## Objective

Make local Docker the complete executable target for stakeholder demos and real
backend validation. A clean checkout with supported prerequisites must be able
to initialize local secrets, start either deterministic demo or full HTTP mode,
exercise all services, stop cleanly, and recover without silently substituting
mock behavior.

## Scope

- Build reproducible containers for the React demo artifact, React HTTP
  artifact, Go API, Go worker, and scheduled job runner.
- Route the full HTTP application through one local HTTPS origin at
  `https://localhost:8443`.
- Run Keycloak in production mode with its own PostgreSQL database, imported
  realm baseline, application-managed provisioning, TOTP MFA, revocation, and
  role/organization mapping.
- Run private MinIO buckets with versioning and quarantine/clean/generated
  object separation.
- Replace deterministic scan completion with real ClamAV scanning and signature
  readiness.
- Deliver notification emails through the SMTP adapter into Mailpit and expose
  auditable delivery/retry state.
- Render versioned PDFs through Gotenberg and store immutable outputs in MinIO.
- Generate runtime secrets into gitignored files, mount them as Docker secrets,
  and support SOPS + age for encrypted configuration.
- Add health/startup/readiness, network, resource, non-root, filesystem, and
  cleanup gates.
- Generate CycloneDX SBOMs for every built runtime image and fail closed on
  unresolved HIGH/CRITICAL container-image vulnerabilities before full-profile
  acceptance.
- Keep deterministic fixture/reset machinery in a one-shot `test` lane only.
  Normal `full` mode starts from fresh scoped volumes, provisions through
  authorized application/Keycloak flows, and exposes no `/__test/*` route.
- Run all 86 routes and scenario families against the full Compose profile.

## Assumptions

- Plans 1 and 2 are accepted: 86 routes work in demo and HTTP, and durable jobs
  already exist for provisioning, scan, email, and document work.
- Local developer prerequisites are Docker Desktop/Engine with Compose v2,
  Node only for host-side tests, Go only for host-side checks, and `age`/`sops`
  for encrypted configuration maintenance.
- Local HTTPS uses Caddy's internal CA. Trusting that CA in the user's operating
  system is an explicit user action; scripts may print instructions but cannot
  change system trust without approval.
- Mailpit is a real SMTP receiver for local verification, not production email.
- ClamAV signature readiness is required before Evidence upload/review becomes
  ready. A scanner outage fails closed.
- Gotenberg output is a real local PDF artifact but production signing and legal
  validity remain outside scope.

## Global Constraints

- No default password in the full profile and no plaintext runtime secret in
  Git, Compose YAML, container image layers, logs, or browser bundles.
- Images are immutable-digest locked in `deploy/local/image-lock.json`; the
  compose gate rejects an unpinned external image.
- Containers run as non-root where the upstream image supports it; writable
  paths and Linux capabilities are minimized and recorded for exceptions.
- Only Caddy publishes the full application's browser port. PostgreSQL,
  Keycloak, MinIO API, ClamAV, SMTP, and Gotenberg remain on internal networks;
  optional developer consoles bind to loopback under an explicit tools profile.
- HTTP build has no mock/seed/test-profile module path.
- Normal OIDC/full API configuration cannot register seed/reset handlers; direct
  `/__test/*` requests return 404. Test fixtures run only through a scoped
  one-shot command/container that is absent after initialization.
- Provider tokens remain server-side; application cookies remain Secure,
  HttpOnly, SameSite, bounded idle/absolute, and CSRF protected.
- Scan-clean exact Evidence version is required before review/download/closure.
- Worker retries are bounded, idempotent, observable, and never overwrite an
  immutable version.
- Do not add Kubernetes, cloud resources, external SMTP, external AI, external
  identity federation, or production cutover in this plan.
- Work on the current branch and preserve unrelated untracked paths.

## Ownership Boundaries

| Owner | Responsibility |
|---|---|
| Platform | Containers, Compose profiles, gateway, networks, secrets, image lock, health, resource constraints |
| Identity/Security | Keycloak realm, MFA, provisioning, session/revocation, credential and CA handling; image/SBOM vulnerability policy |
| Backend | Typed service adapters, job state, retries, authorization, scan/document/email/provisioning outcomes |
| Frontend | Same-origin runtime configuration, login/enrollment/error presentation, no mock fallback |
| QA | Clean-machine bring-up, full browser matrix, failure injection, restart, cleanup, raw artifact/secret scans |
| Records/Operations | Local evidence review only; production policy and provider approval remain later |

## Compose Topology

| Service | Profile | Published access | Persistence |
|---|---|---|---|
| `gateway` | `demo`, `full` | `127.0.0.1:8443` | Caddy local CA volume |
| `web-demo` | `demo` | internal | immutable image artifact |
| `web-http` | `full` | internal | immutable image artifact |
| `api` | `full` | internal | PostgreSQL/MinIO |
| `worker` | `full` | internal | PostgreSQL/MinIO |
| `scheduler` | `full` | internal | PostgreSQL |
| `fixture-init` | `test` only | none; one-shot | fresh test volumes only |
| `postgres` | `full`, `test`, `recovery` | internal | app database volume |
| `keycloak-postgres` | `full` | internal | identity database volume |
| `keycloak` | `full` | internal via `/identity` | identity database |
| `minio` | `full`, `test`, `recovery` | internal | primary object volume |
| `clamav` | `full` | internal | signature volume |
| `mailpit` | `full`, `tools` | UI loopback only in `tools` | optional message volume |
| `gotenberg` | `full` | internal | ephemeral working data |

The later observability and backup services belong to Plan 4 and join the same
network through separate profiles.

## Phases

1. **Secure runtime foundation — Tasks 1–2:** lock images/secrets/networks and
   containerize the application behind one local HTTPS origin.
2. **Real platform adapters — Tasks 3–6:** activate Keycloak MFA/provisioning,
   MinIO/ClamAV, Gotenberg, and Mailpit SMTP.
3. **Resilience and handoff — Tasks 7–9:** enforce health/failure/restart
   behavior, prove clean demo/full profiles, and record synchronized evidence.

---

### Task 1: Lock Images, Secrets, Profiles, And Network Policy

**Files**

- Create `deploy/local/compose.yaml`
- Create `deploy/local/image-lock.json`
- Create `deploy/local/compose-policy.json`
- Create `deploy/local/secrets/README.md`
- Create `deploy/local/config/application.example.yaml`
- Create `deploy/local/config/application.enc.yaml`
- Create `.sops.yaml`
- Create `scripts/init-local-secrets.sh`
- Create `scripts/check-compose-policy.sh`
- Modify `.gitignore`
- Create `tests/local-compose-policy.test.mjs`

**Interfaces**

`init-local-secrets.sh` writes random local credentials only under
`.local/aviasurveil360/secrets/`, sets restrictive permissions, and refuses to
overwrite without an explicit rotate flag. Compose mounts named secret files;
environment variables contain only non-secret configuration and secret paths.

- [ ] Write failing policy tests for plaintext secret values, missing secret
  mounts, external images without digests, published internal ports, shared
  app/identity database, unrestricted networks, root user, writable rootfs
  exceptions without reasons, and absent health checks.
- [ ] Run `node --test tests/local-compose-policy.test.mjs`; confirm named
  topology/policy failures.
- [ ] Implement the Compose skeleton, profiles, internal networks, volumes,
  encrypted config, secret generator, image-lock resolver, and policy checker.
  Resolve and review current upstream digests during execution, then record
  their immutable values in `image-lock.json`.
- [ ] Run Compose config for `demo`, `full`, `test`, and `recovery`, SOPS decrypt
  validation, secret-file scan, and policy tests; expect zero published internal
  services and zero plaintext credentials.
- [ ] Commit exactly `build(local): define secure compose topology`.

### Task 2: Containerize Web, API, Workers, And The HTTPS Gateway

**Files**

- Create `apps/web/Dockerfile`
- Create `apps/api/Dockerfile`
- Create `deploy/local/gateway/Dockerfile`
- Create `deploy/local/gateway/Caddyfile`
- Create `deploy/local/gateway/security-headers.caddy`
- Create `deploy/local/api/entrypoint.sh`
- Create `deploy/local/worker/entrypoint.sh`
- Create `deploy/local/scheduler/entrypoint.sh`
- Modify `deploy/local/compose.yaml`
- Create `scripts/build-local-images.sh`
- Create `scripts/generate-image-sboms.sh`
- Create `scripts/scan-local-images.sh`
- Create `tests/local-image-security-policy.test.mjs`
- Create `tests/local-image-boundary.test.mjs`

**Interfaces**

The web image has separate immutable `demo` and `http` targets. The Go image has
`api`, `worker`, `scheduler`, and migration targets built from one module. Caddy
serves `/`, proxies `/api` and `/auth` to Go, and proxies `/identity` to
Keycloak under the one external origin.
Every runtime image is identified by digest, has a reviewed CycloneDX SBOM, and
passes the configured HIGH/CRITICAL vulnerability policy. A finding may be
accepted only through an explicit owner, expiry, rationale, and tracker record.

- [ ] Write failing image/boundary tests for root runtime/mock input in HTTP,
  build tools in runtime layers, root user, missing read-only rootfs, missing
  startup/readiness, non-reproducible build metadata, wrong same-origin routes,
  missing SBOM, unscanned digest, and unapproved HIGH/CRITICAL findings.
- [ ] Build targets and confirm expected Dockerfile/config red failures.
- [ ] Implement multi-stage builds, non-root entrypoints, migrations-before-api
  startup lock, Caddy HTTPS/routing/security headers, CSP, immutable assets,
  compression, bounded shutdown, image SBOM generation, digest-bound scanning,
  and a fail-closed vulnerability policy.
- [ ] Start demo then full gateway from clean volumes; verify HTTPS artifact,
  `/health/*`, no mock input in HTTP, no `/__test/*` route in full mode, SIGTERM
  drain, SBOM/vulnerability results, and image boundary tests.
- [ ] Commit exactly `build(local): containerize application runtime`.

### Task 3: Activate Production-Mode Keycloak, MFA, And Provisioning

**Files**

- Replace `deploy/local/keycloak/realm.json` with generated/reviewed source under
  `deploy/local/keycloak/realm-source.json`
- Create `deploy/local/keycloak/build-realm.mjs`
- Create `deploy/local/keycloak/realm-contract.test.mjs`
- Create `apps/api/internal/identity/keycloak_admin.go`
- Create `apps/api/internal/identity/keycloak_admin_test.go`
- Extend `apps/api/internal/administration/`
- Modify `apps/api/internal/platform/config/config.go`
- Modify `deploy/local/compose.yaml`
- Create `apps/web/tests/e2e/oidc-mfa-provisioning.spec.ts`

**Interfaces**

Keycloak starts in production mode with proxy/hostname/health settings and a
separate database. Application provisioning creates/deactivates users, maps
approved realm roles and organization attributes, requires TOTP configuration
on first login, records external subject, and revokes sessions on disable.

- [ ] Write failing realm, Go adapter, and browser tests for exact clients/
  redirect URIs, PKCE, no self-registration, no password grant, required TOTP,
  admin provisioning authorization, duplicate email, role/org mapping,
  deactivation, revocation, and safe application session projection.
- [ ] Run realm/Go/OIDC tests; confirm production-mode/provisioning gaps fail.
- [ ] Implement deterministic realm generation, Keycloak Admin API adapter,
  outbox handler, status reconciliation, MFA enrollment/required action, role
  mapping, audit events, and failure/retry presentation.
- [ ] Run complete login, first-login TOTP, logout, expiry, CSRF, create/disable/
  revoke, wrong-role, wrong-org, restart, and secret/log scans.
- [ ] Commit exactly `feat(identity): activate local mfa provisioning`.

### Task 4: Activate Private Object Storage And Real Malware Scanning

**Files**

- Create `deploy/local/minio/init.sh`
- Create `deploy/local/minio/bucket-policy-contract.test.mjs`
- Create `apps/api/internal/platform/scanner/scanner.go`
- Create `apps/api/internal/platform/scanner/clamav.go`
- Create `apps/api/internal/platform/scanner/clamav_test.go`
- Extend `apps/api/internal/worker/evidence/worker.go`
- Modify `apps/api/internal/evidence/upload_service.go`
- Modify `apps/api/internal/inspections/attachments/upload_service.go`
- Modify `deploy/local/compose.yaml`
- Create `apps/api/tests/integration/clamav_object_pipeline_test.go`

**Interfaces**

Buckets are private and separated as `evidence-quarantine`, `evidence-clean`,
`inspection-attachments`, and `generated-documents`. Object keys never
overwrite. ClamAV receives exact bytes, records engine/signature version and
scan time, and promotes only clean exact versions. Infected/error/timeout remain
quarantined and non-downloadable.

- [ ] Write failing policy/integration tests for public access, overwrite,
  wrong bucket, MIME/size/hash mismatch, EICAR detection, clean promotion,
  scanner unavailable/timeout, stale signature readiness, download/review
  denial, retry idempotency, and immutable version history.
- [ ] Run focused tests; confirm absent real scanner/bucket policies.
- [ ] Implement MinIO initialization, least-privilege service credentials,
  versioning, scanner adapter, worker handler, health/readiness, quarantine and
  promotion transaction semantics.
- [ ] Run real clean/infected/error/timeout/restart cases through browser, API,
  ClamAV, worker, and MinIO; expect no infected/public/downloadable object.
- [ ] Commit exactly `feat(evidence): activate local malware scanning`.

### Task 5: Activate Gotenberg Document Rendering

**Files**

- Create `apps/api/internal/documents/gotenberg_renderer.go`
- Create `apps/api/internal/documents/gotenberg_renderer_test.go`
- Create `apps/api/internal/documents/templates/`
- Create `apps/api/internal/documents/template_contract_test.go`
- Extend the document worker command
- Modify `deploy/local/compose.yaml`
- Create `apps/api/tests/integration/gotenberg_document_pipeline_test.go`
- Create `apps/web/tests/e2e/generated-document.http.spec.ts`

**Interfaces**

Rendering consumes a versioned server-owned HTML/template/data snapshot and
returns PDF bytes plus renderer/template/source hashes. The worker stores a new
immutable generated-document version and never treats rendering as report
approval or signature.

- [ ] Write failing template/adapter/integration/browser tests for escaped
  content, deterministic metadata, exact source/report version, PDF signature,
  private object, duplicate job, renderer timeout/error, retry, download scope,
  and no legal/e-signature claim.
- [ ] Run focused tests and confirm missing adapter/templates.
- [ ] Implement approved templates, Gotenberg adapter, bounded request, worker
  handler, immutable object/metadata, audit event, and UI status/download.
- [ ] Run real render/download/retry/restart for Preliminary, Final, and Closure
  report versions; expect exact version/hash evidence.
- [ ] Commit exactly `feat(documents): activate local pdf rendering`.

### Task 6: Activate SMTP Delivery Through Mailpit

**Files**

- Create `apps/api/internal/notifications/smtp_sender.go`
- Create `apps/api/internal/notifications/smtp_sender_test.go`
- Create `apps/api/internal/notifications/templates/`
- Create `apps/api/internal/notifications/template_contract_test.go`
- Extend notification worker and scheduler commands
- Modify `deploy/local/compose.yaml`
- Create `apps/api/tests/integration/mailpit_notification_pipeline_test.go`
- Create `apps/web/tests/e2e/notification-delivery.http.spec.ts`

**Interfaces**

Recipient resolution is server-authoritative and organization-scoped. Templates
receive bounded typed data and separate CAA-internal from Auditee-safe content.
Outbox delivery records message ID, attempt, accepted/failed state, next retry,
and audit event without logging body or credentials.

- [ ] Write failing tests for Due Soon/Overdue/status notifications, recipient
  isolation, template escaping, forbidden internal content, duplicate
  suppression, SMTP refusal/timeout/retry, permanent failure, Mailpit receipt,
  and visible in-app delivery state.
- [ ] Run focused tests and confirm missing SMTP/templates.
- [ ] Implement templates, SMTP adapter, worker/scheduler handlers, retry policy,
  dead-letter state, audit events, and Mailpit tools profile.
- [ ] Run real Mailpit delivery/failure/restart scenarios and query exact message
  metadata through its local API; expect no duplicate or privacy leak.
- [ ] Commit exactly `feat(notifications): activate local email delivery`.

### Task 7: Enforce Runtime Health, Isolation, Failure, And Restart Behavior

**Files**

- Extend `apps/api/internal/httpapi/health.go`
- Extend `apps/api/internal/httpapi/health_test.go`
- Create `apps/api/internal/platform/health/dependencies.go`
- Modify all Compose health checks and dependency conditions
- Create `scripts/local-stack.sh`
- Create `scripts/check-local-runtime.sh`
- Create `tests/local-runtime-contract.test.mjs`
- Create `apps/web/tests/e2e/local-service-failures.http.spec.ts`

**Interfaces**

Liveness never depends on downstream services. Startup waits for migrations and
required configuration. Readiness reports named required dependencies without
secrets. Optional delivery failures degrade only their capabilities; identity,
database, and required scan readiness fail closed where needed.

- [ ] Write failing tests for dependency loss, restart order, migration lock,
  stale ClamAV signature, Keycloak loss, MinIO loss, Gotenberg loss, SMTP loss,
  worker crash, bounded shutdown, orphan container, and secret/log leakage.
- [ ] Run runtime contracts and confirm current topology cannot meet them.
- [ ] Implement dependency probes, degraded/readiness semantics, restart policy,
  resource limits, stop grace periods, one-shot migration, stack wrapper, and
  exact cleanup ownership.
- [ ] Execute failure injection and restart matrix without deleting user data;
  verify recovery, visible capability states, no cross-network access, and no
  leftover task-owned processes/containers.
- [ ] Commit exactly `test(local): enforce runtime resilience boundary`.

### Task 8: Prove Clean Demo And Full Local Docker Profiles

**Files**

- Create `scripts/test-local-demo-profile.sh`
- Create `scripts/test-local-full-profile.sh`
- Create `apps/web/tests/e2e/local-full-platform.spec.ts`
- Modify `apps/web/playwright.config.ts`
- Modify `tests/parity/behavior-ledger.json`
- Modify `MANIFEST.md`

**Interfaces**

Both scripts create unique Compose project names, use fresh scoped volumes,
trap only task-owned resources, emit a machine-readable summary, and fail if a
required test/project is skipped. Full mode uses normal OIDC/MFA and real local
service adapters; it never enables canonical-header auth, deterministic scan,
test reset routes, or test-profile fixture handlers. Its initial state is
created through normal authorized provisioning/application commands. The
one-shot `fixture-init` lane belongs only to the separate `test` profile.

- [ ] Write failing script contract tests for reused project name, shared fixed
  volume, missing trap, skipped Playwright project, mock import, deterministic
  scanner, registered `/__test/*` route, test fixture container in full mode,
  direct internal port, or missing cleanup assertion.
- [ ] Run script contracts and confirm expected failures.
- [ ] Implement clean demo/full orchestration, seed/provision flow, browser
  profiles, 86 direct loads, 10 scenarios, service adapters, artifact checks,
  restart/failure cases, and cleanup summaries. Full-mode setup must use fresh
  volumes plus normal provisioning/application commands, never a reset API.
- [ ] Run both exact scripts from clean state twice; expect identical outcome,
  86 demo and 86 HTTP routes, real MFA/scan/email/PDF evidence, and zero residue.
- [ ] Commit exactly `test(local): prove complete docker profiles`.

### Task 9: Record Local Production-Like Service Evidence

**Files**

- Create `docs/demo-evidence/LOCAL_PRODUCTION_LIKE_SERVICES_2026-07-22.md`
- Create `docs/demo-evidence/LOCAL_PRODUCTION_LIKE_SERVICES_2026-07-22.turkce.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.turkce.md`
- Modify `docs/index.md`
- Modify `MANIFEST.md`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify this plan

- [ ] Run clean image build, Compose policy, secret scan, demo/full profiles,
  normal MFA OIDC, provisioning, real scan, Mailpit, Gotenberg, failure/restart,
  dependency audits, digest-bound image SBOM/vulnerability gates, absence of
  full-profile test routes, and cleanup from fresh scoped volumes.
- [ ] Record immutable image digests, configuration hashes, exact test counts,
  Keycloak realm/MFA behavior, scanner signature/engine, SMTP receipts, PDF and
  object hashes, failure results, timings, resource observations, and cleanup.
- [ ] Keep literal labels: `verified locally`, `candidate-only`, and
  `release pending`; do not claim production deployment or production-ready.
- [ ] Set this plan `ready-for-verification` only after all local service gates
  pass and Plans 1–2 remain green.
- [ ] Commit exactly `docs(evidence): record local production services` and push
  only when explicitly authorized.

## Required Verification Matrix

```bash
node --test tests/local-compose-policy.test.mjs tests/local-image-boundary.test.mjs tests/local-runtime-contract.test.mjs
./scripts/check-compose-policy.sh
./scripts/build-local-images.sh
./scripts/generate-image-sboms.sh
./scripts/scan-local-images.sh
./scripts/test-local-demo-profile.sh
./scripts/test-local-full-profile.sh
npm --prefix apps/web audit
npm --prefix apps/web audit --omit=dev
GOCACHE=/private/tmp/aviasurveil360-local-services-go-cache go -C apps/api test -race -p 1 -count=1 ./...
```

Expected final result: clean reproducible demo and full profiles, one HTTPS
origin, 86 full HTTP routes, normal MFA OIDC, real ClamAV/Mailpit/Gotenberg/
MinIO behavior, no plaintext secrets, no published internal services, and zero
task-owned residue.

## Risks And Controls

| Risk | Control |
|---|---|
| Compose becomes an unmaintainable production substitute | Profiles, policy tests, one ownership file, AWS remains separate Plan 4 |
| Local credentials leak | Generated gitignored secret files, Docker secrets, SOPS+age, artifact/log scans |
| Keycloak dev mode weakens evidence | Production-mode startup, separate DB, MFA and provisioning browser tests |
| Infected Evidence becomes reviewable | Quarantine, exact-version scan, fail-closed readiness/download/review tests |
| Mail or PDF retries duplicate versions | Durable job idempotency and output/message identity constraints |
| Gateway bypass exposes internal services | Internal networks, no published ports, same-origin browser tests |
| Image tags drift | Digest lock and compose policy gate |
| A pinned image contains a known critical vulnerability | Digest-bound SBOM and image scan, fail-closed HIGH/CRITICAL policy, explicit expiring exception record only |
| Test reset authority leaks into the full stack | Fresh volumes and normal provisioning in full mode; one-shot test-only fixture lane; `/__test/*` 404 contract |
| Cleanup stops user resources | Unique Compose project names and task-owned trap assertions |

## Dependencies

- Plans 1 and 2 accepted with 86 demo/HTTP routes and durable worker jobs.
- Docker Engine/Desktop and Compose v2.
- User-approved local CA trust if warning-free interactive HTTPS is required.
- Plan 4 adds observability, backup, RPO/RTO, DR, Terraform, and Terragrunt.

## Out Of Scope

- Production external IdP federation, SCIM, SMS/hardware MFA, external email
  provider, legal e-signature, external malware service, or external AI.
- Monitoring/alerts, backup/DR objectives, Terraform/Terragrunt/AWS deployment,
  public DNS, traffic cutover, or production on-call.
- Automatic modification of the user's operating-system trust store.

## Execution Prompt

```text
Execute docs/exec-plans/active/2026-07-22-local-production-like-services-plan.md task by task with superpowers:executing-plans only after the 86-screen React and full backend parity plans are complete, ready-for-verification, and independently accepted. Do not overlap unfinished Plan 1 or Plan 2 work. Do not dispatch subagents unless explicitly authorized. Work on the current branch and preserve unrelated .superpowers/, docs/demo-evidence/stakeholder/, and outputs/ content.

Build a production-like local Docker Compose system with one Caddy HTTPS origin, separate React demo/HTTP artifacts, Go API/worker/scheduler, separate app and Keycloak PostgreSQL databases, Keycloak production-mode TOTP MFA and application provisioning, private MinIO, real ClamAV, Mailpit SMTP, and Gotenberg PDF rendering. Use Docker secrets and SOPS+age; never commit or log plaintext credentials. Pin all external images by reviewed immutable digest.

Keep server authority, Auditee privacy, immutable versions, scan-clean Evidence gating, idempotent jobs, and exact audit events. Full mode must never import mock/seed, register /__test reset routes, run the test fixture initializer, or enable canonical-header authentication/deterministic scanning. Start it from fresh volumes and use normal authorized provisioning/application commands. Generate digest-bound image SBOMs and fail closed on unresolved HIGH/CRITICAL image findings. Test real failure, timeout, retry, restart, health/readiness, and cleanup behavior.

Use the plan's TDD order and exact commit messages only when Git actions are separately authorized. Inspect upstream, allowlist, cached names, full cached diff, and diff check before every commit. Do not add cloud resources, modify system trust without approval, deploy, or claim production readiness. Finish with synchronized local-service evidence and stakeholder verification as the next todo.
```
