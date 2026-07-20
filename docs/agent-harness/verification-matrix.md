# AviaSurveil360 Agent Harness Verification Matrix

Use the smallest level that covers the actual risk. All checks are local-only.
Do not add GitHub Actions, `.github/workflows`, hosted runners, scheduled
workflows, package-manager scripts, remote CI, or paid automation for this
private repository.

## Level 1 - Docs-Only

Use for Markdown, plan, prompt, manifest, harness, or source-index changes.

Required local checks:

```bash
git diff --check
rg -n "docs/agent-harness|agent-harness/index|output-contract|verification-matrix|entropy-cleanup" AGENTS.md MANIFEST.md docs
```

When harness docs are touched, also run:

```bash
node tests/harness-docs-smoke.test.js
```

## Level 2 - JavaScript Logic

Use for helper, data, state transition, render function, or smoke-test changes.
Run `node --check` for touched JS files and the smallest relevant smoke test.

Current syntax commands:

```bash
node --check js/data.js
node --check js/helpers.js
node --check js/approval.js
node --check js/planning.js
node --check js/checklists.js
node --check js/inspection.js
node --check js/reports.js
node --check js/views.js
node --check js/app.js
```

Current targeted smoke tests:

```bash
node tests/approval-smoke.test.js
node tests/checklist-approval-smoke.test.js
node tests/checklist-management-smoke.test.js
node tests/governance-render-smoke.test.js
node tests/inspection-execution-smoke.test.js
node tests/planning-render-smoke.test.js
node tests/planning-release-smoke.test.js
node tests/report-approval-smoke.test.js
node tests/audit-work-queue-smoke.test.js
node tests/demo-boundary-smoke.test.js
```

## Level 3 - Static Workflow

Use for user-facing click path changes.

Required checks:

- Level 2 for touched JS and targeted tests.
- Local browser click-through of the changed role path.
- Console error review for the changed path.

Use direct file opening when enough. Serve locally only when browser behavior
requires it:

```bash
python3 -m http.server 4360
```

## Level 4 - Visual Or UI

Use for layout, responsive behavior, dashboard, role home, or visual polish.

Required checks:

- Level 3 checks.
- Desktop and mobile viewport visual review.
- Confirm no incoherent overlap, hidden target content, or horizontal overflow.
- Assert against visible page content, not hidden navigation text.
- Clean up browser or GUI automation processes before reporting completion.

## Level 5 - Boundary-Sensitive

Use for auth, upload, AI, regulatory, audit-log, offline, evidence,
notification, reporting, permission, or production-readiness language.

Required checks:

- Relevant lower-level checks.
- `node tests/demo-boundary-smoke.test.js` when demo boundaries may be affected.
- Explicit review that the task did not add or claim backend, database, API,
  real auth, real upload/storage, real AI service, real regulatory ingestion,
  real notification delivery, production audit-log behavior, remote CI, or
  paid automation.

## Production-Application Candidate Lane

This lane is local-only and supplements rather than replaces the static-demo
levels above. Run only the commands supported by the explicitly authorized
slice; label unavailable later-slice gates `not run` or `blocked` rather than
silently skipping them.

For the Tasks 2-4 mock-data first executable slice:

```bash
npm --prefix apps/web ci
npm --prefix apps/web run contracts:check
npm --prefix apps/web run typecheck
npm --prefix apps/web test
npm --prefix apps/web run build:demo
npm --prefix apps/web run build:http
node apps/web/scripts/assert-http-artifact.mjs apps/web/dist
node --test api/openapi/tests/contract-examples.test.mjs tests/parity/react-legacy-parity.test.mjs
npm --prefix apps/web run test:e2e:mock -- canonical-scenario.spec.ts
node --test tests/*.test.js
git diff --check
```

Expected: locked install succeeds; OpenAPI examples and checked generation are
clean; React type/unit/build and mock browser tests pass; the HTTP artifact has
no mock/seed or demo-public input; the legacy demo suite remains passing. Real
HTTP, Go, IndexedDB/OPFS, Service Worker/PWA, offline, sync, deployment, and
production evidence are `not run` for this slice. The result is
`candidate-only`.

Future application slices must add their authorized Go build/race/integration,
Playwright HTTP/offline, fail-on-skip/zero-test, migration/restore, artifact,
and task-owned process/container cleanup gates before those capabilities can be
reported as `verified locally`. Remote CI remains separately authorized.

## Current Harness Completion Gate

For agent harness readiness work, run:

```bash
git diff --check
node tests/harness-docs-smoke.test.js
node tests/demo-boundary-smoke.test.js
rg -n "docs/agent-harness|agent-harness/index|output-contract|verification-matrix|entropy-cleanup" AGENTS.md MANIFEST.md docs
if [ -d .github ]; then find .github -maxdepth 3 -type f; fi
```

Expected `.github` result for this task: no new workflow file. If an unrelated
pre-existing `.github` file appears, do not delete it; report the ambiguity.
If a task-owned workflow appears, remove it before reporting success.
