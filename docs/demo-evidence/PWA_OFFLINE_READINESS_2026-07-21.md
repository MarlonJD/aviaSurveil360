# PWA App Shell And Offline Readiness Evidence — 2026-07-21

## Outcome

- Evidence status: `verified locally`
- Artifact status: `candidate-only`
- Release status: `release pending`
- Production managed-device policy, MDM evidence, app-level local encryption,
  deployment, traffic cutover, legacy removal, and a `production-ready` claim:
  `blocked`
- Atomic field persistence/outbox (Task 7): subsequently `verified locally`
- Staged OPFS Inspection Attachments (Task 8), production sync (Task 12), wider
  role-entry migration (Task 5), and final release-candidate packet (Task 13):
  `not run`

Task 6 implements the browser PWA app-shell and explicit managed-profile
offline-readiness foundation for the React candidate. At its checkpoint it did
not add a `FieldRepository`, offline checklist edits, an outbox, staged
attachment bytes, or sync. Task 7 subsequently added and verified the first
three; Task 8 and Task 12 still own staged bytes and network sync. The root
Vanilla JavaScript demo remains intact as the behavioral reference.

## Test-First Evidence

Readiness, update-policy, Service Worker request-policy, UI, and browser tests
were written against absent behavior before implementation. The red/green cycle
caught and corrected:

- the missing readiness gate, app-shell worker, update coordinator, and offline
  startup behavior;
- a restart canary that passed preflight but was deleted and then failed when
  grant validation repeated the gate in the same user action;
- an update test server that changed worker bytes but not the minified cache
  version, so a waiting worker did not create the N cache;
- an invalid version `0` being treated as N-1 when N was `1`; and
- UI copy that stated `local package missing` without first qualifying that the
  authoritative server must report an outstanding checkout.

The final restart canary is idempotent within one browser boot after a prior
boot has proved persistence. The worker contains an explicit build-version
marker that is checked against the emitted app-shell manifest.

## Verified Readiness Boundary

- All thirteen result codes are covered: `ready`, `unsupported-browser`,
  `managed-policy-unapproved`, `ephemeral-or-unmanaged-storage`,
  `service-worker-unavailable`, `indexeddb-health-failed`,
  `opfs-health-failed`, `persistence-denied`, `quota-insufficient`,
  `offline-grant-invalid`, `app-version-incompatible`,
  `schema-version-incompatible`, and `protocol-version-incompatible`.
- Official checkout requires a secure context, current Chrome, explicit
  owner-policy and encrypted-profile attestations, a ready Service Worker,
  separate IndexedDB and OPFS write/read/hash/delete canaries, persistent
  storage, advisory capacity plus conservative headroom, a survived browser
  restart, positive N/N-1 versions, and an exact server-issued grant.
- `navigator.storage.persist()` is requested only from the explicit user action.
  Denial blocks offline checkout but preserves online use.
- Capacity is explicitly advisory. The UI does not claim disk reservation or
  private-browsing detection.
- Grant validation binds subject, organization, device instance, package ID,
  package version/digest, assignment scope, expiry, and protocol version.
- The current single-scenario screen is scoped to canonical Inspector
  `USR-INSPECTOR-AMINA`; a differently scoped grant fails closed. Task 5 still
  owns wider authenticated role-entry/session-subject wiring.
- At the Task 6 checkpoint, the foundation IndexedDB stored only the device
  identity, restart canary, and exact-subject immutable checkout snapshot.
  Task 7 subsequently upgraded it to the subject-scoped v2 field schema and
  causal outbox; see [Task 7 evidence](INDEXEDDB_FIELD_STORAGE_2026-07-21.md).
- The OPFS interaction is a health canary only. Task 8 still owns staged
  Inspection Attachment bytes and recovery.
- The UI states the explicit site-data loss boundary. It does not claim that a
  package is missing unless an authoritative outstanding-checkout report is
  present.

## Verified App-Shell And Update Boundary

- The generated demo and HTTP artifacts contain matching positive app-shell
  versions, an asset manifest, and a module Service Worker.
- Cache Storage is limited to navigation shell, versioned static assets, and
  allowlisted public build configuration. API, auth, health, test, report, other
  business-record, mutation, and cross-origin requests remain network-only.
- There is no generic stale-while-revalidate behavior for authenticated API
  responses.
- The worker does not automatically call `skipWaiting`, claim clients, or delete
  old caches.
- App-shell, IndexedDB schema, package schema, and sync protocol versions are
  evaluated independently with a positive N/N-1 policy.
- Pending outbox/package/attachment work defers activation. One browser lock
  serializes the update decision and a broadcast channel shares it across tabs.
- Every declared migration boundary opens read-only recovery after failure;
  edits pause during migration. An N-1 shell rollback cannot downgrade the
  database, package, or protocol state.
- A real two-page Chrome test installs a waiting N worker while the N-1 worker
  remains active and proves that both shell caches, an IndexedDB pending-work
  sentinel, and OPFS bytes remain intact. Those sentinels exercise preservation
  policy; they are not a Task 7/8 implementation.

## Actual Offline Startup Evidence

The offline test used a dedicated temporary Chrome profile and localhost secure
context. It visited the candidate online, completed the explicit readiness
flow, proved that an ordinary page reload still remained blocked, closed Chrome,
reopened the same profile, checked out the package, closed Chrome again, and
stopped the origin server. A fresh Chrome process then loaded
the Audit shell and `PKG-CAB-2026-001` snapshot from local app-shell/IndexedDB
state while a direct `/v1/` network probe failed. This is stronger than
DevTools page-only offline emulation.

The update-recovery test used two pages, a real waiting Service Worker, N and
N-1 caches, IndexedDB and OPFS sentinels, and explicit Chrome site-data clearing.
After clearing, the local snapshot was absent and the irreversible local-data
warning remained visible.

## Fresh Verification

The following completed with exit code `0`:

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web test`: 12 files, 76/76 tests
- `npm --prefix apps/web run build:demo`
- `npm --prefix apps/web run build:http`
- `npm --prefix apps/web run check:app-shell`: demo and HTTP artifacts pass
- `node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http`: 10 files,
  75 inputs; no mock/seed or local test-profile path
- `npm --prefix apps/web run test:e2e:offline`: 2/2 real-browser tests
- `npm --prefix apps/web run test:e2e:mock`: 1/1 canonical scenario
- `./scripts/test-http-profile.sh`: full Go race/live integration suite,
  OpenAPI 5/5, SQLC clean generation, React 76/76, live HTTP contract 9/9,
  mock Playwright 1/1, HTTP Playwright 1/1, both builds, artifact isolation,
  and task-owned dependency cleanup
- `go vet ./...` from `apps/api`
- Root Vanilla JavaScript smoke suite: 103/103
- `git diff --check`

Browser-process and local-container cleanup was checked after the browser and
HTTP profiles. No task-owned Chrome, Playwright, Vite, API/worker process,
container, network, or volume remained.

This evidence supports only the local Task 6 candidate. Tasks 7-8 are
subsequently `verified locally`; the next binding slice is Task 12 typed network
sync. Production release and cutover remain outside this authorization and
`blocked`.
