# React Mock First Executable Slice Evidence — 2026-07-20

## Status

- Implementation scope: Tasks 2-4 only.
- Local result: `verified locally`.
- Maturity: `candidate-only`.
- Release: `release pending`.
- Real HTTP/API, Go, offline, deployment, cutover, and production evidence: `not run`.
- Tasks 5-13 and their unresolved owner decisions: `blocked` without separate authorization.

This evidence covers only the explicitly authorized mock-data first executable
slice in the active production-transition plan. It does not claim that
AviaSurveil360 is `production-ready`.

## Implemented Slice

Task 2 adds canonical English/Turkish contract vocabulary, a minimal versioned
OpenAPI contract with checked examples and generated TypeScript transport
types, an executable nine-entry behavior ledger, and build-time-separated React
demo and HTTP entries under `apps/web/`.

Task 3 adds one capability-composed `Backend`, deterministic
`MemoryMockStore`/`MockBackend`, a thin typed `HttpBackend` covered only by
deterministic fake-fetch mapper tests, reusable backend contract tests, and an
artifact check that rejects mock/seed inputs from the HTTP build.

Task 4 adds the complete canonical Cabin Inspection route flow in React mock
mode. Every canonical mutation is issued through `Backend`; no component owns
or directly mutates canonical mock records. The root Vanilla JavaScript demo
remains the behavioral oracle and was not replaced or removed.

No `FieldRepository`, IndexedDB behavior, OPFS, Service Worker/PWA behavior,
sync engine, Go service, database, object storage, real identity, real upload,
deployment, or production cutover was added.

## Normalized Canonical Transcript

| Invariant | Verified value |
|---|---|
| Exact Audit/question | `AUD-2026-001` / `CAB-EMEQ-PBE-001` |
| Potential Finding | `PF-2026-001` / `PENDING_LEAD_REVIEW` |
| Converted Finding | `CAB-2026-001` / `WAITING_FOR_CAP` |
| CAP submission | `CAP_SUBMITTED` |
| CAP acceptance | `EVIDENCE_REQUIRED`; Finding remains open |
| Evidence version 1 | `PARTIALLY_CLOSE` -> `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Evidence version 2 | `NOT_CLOSE` -> `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Evidence version 3 | `CLOSE` -> `CLOSED` |
| Closure basis | `EVIDENCE_VERIFIED` |
| Immutable Evidence history | 3 versions preserved |
| Report decision | `LOCKED`; issue did not close the Finding |
| Manager projection | 1 closed Finding after verified closure |
| Auditee projection | Fly Namibia only; no internal CAA or other-organization data |

The browser scenario also proves that another Inspector's checklist question is
read-only, Lead conversion is required before the canonical Finding exists,
CAP submission and CAA review are separate, `Comment to Auditee` and `Internal
CAA Note` are separate CAA fields, authorized closure is a distinct
reason-required Department Manager path, and an unreleased report is not
available to the Auditee.

## Verification Evidence

All successful results below are `verified locally` on 2026-07-20.

| Gate | Result |
|---|---|
| Locked install | `npm --prefix apps/web ci` passed |
| Contract lint/examples/regeneration diff | `npm --prefix apps/web run contracts:check` passed |
| TypeScript | `npm --prefix apps/web run typecheck` passed |
| Unit/component/backend | 32/32 assertions across 8 Vitest files passed |
| Focused Auditee component/backend boundary | 11/11 assertions passed |
| OpenAPI and behavior-ledger Node gate | 7/7 assertions passed |
| Canonical mock browser scenario | 1/1 Playwright scenario passed with no page or console warning/error |
| Demo build | 92 modules built successfully |
| HTTP build | 169 modules built successfully |
| HTTP artifact isolation | 7 files and 71 inputs scanned; no mock/seed input or demo-public artifact found |
| Intact legacy behavior oracle | 103/103 root Node tests passed |
| Browser/server cleanup | No task-owned Vite, Playwright, headless Chrome, or remote-debugging Chrome process remained |

The test-first browser run initially failed at the first unported React route,
`/inspector/inspector-assignments`. The completed implementation passed the
same scenario and attached the normalized transcript.

## Evidence Boundaries

- `HttpBackend` is covered by fake-fetch mapping tests only. Real HTTP
  conformance is `not run`.
- Mock file selection records a filename and size only. Real upload, scanning,
  object storage, and chain-of-custody evidence are `not run`.
- Browser persistence, offline restart, IndexedDB, OPFS, PWA update behavior,
  and sync are `not run`.
- Real authentication, authorization enforcement, OIDC/MFA, CSRF policy,
  session revocation, and production Auditee isolation are `not run`.
- Deployment, production release approval, traffic cutover, and legacy removal
  are `blocked` and require separate authorization.

The slice is ready for stakeholder/user review as a `candidate-only` local
artifact. It is not a production release.
