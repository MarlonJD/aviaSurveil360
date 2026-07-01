# AviaSurveil360 Agent Harness Runbook

> Canonical harness entrypoint: use `../agent-harness/index.md` first for
> harness navigation, output contract, registry, verification matrix, and
> entropy cleanup. This runbook remains the applied historical runbook and
> scenario-oriented operating notes.

This runbook translates harness engineering into a practical operating layer for
AviaSurveil360 agents. It does not replace `AGENTS.md`; it is a shorter entry
point that tells future agents how to choose source docs, scope edits, verify
work, and record durable evidence.

Use this runbook when the task is about repo implementation, prototype changes,
plan updates, status/readiness, stakeholder handoff, or verification.

## Source Translation Boundary

The OpenAI harness-engineering article is adapted here as an operating model,
not copied as product scope. For AviaSurveil360, harness engineering means:

- keep repo docs, plans, tests, and evidence as the agent's record system
- make the static demo inspectable through deterministic smoke tests and local
  browser paths
- turn repeated product rules into mechanical checks where practical
- preserve demo-only and production-readiness boundaries
- record blockers and verification gaps in durable plan notes

It does not mean adding cloud CI, backend services, autonomous merge bots,
production observability, or broader agent permissions unless the user asks for
those later.

## Non-Negotiable Boundary

AviaSurveil360 is currently a planning pack plus a frontend-only clickable demo.

Do not add or claim:

- backend
- database
- API
- real authentication
- real authorization enforcement
- real file upload or document storage
- real email/SMS/notification service
- real AI service
- real regulatory ingestion
- production audit log
- production evidence chain-of-custody
- production security readiness
- framework migration

The default executable artifact remains:

```text
index.html + css/ + js/ + mock data + browser-only demo persistence
```

## Harness Map

| Surface | Purpose | Agent rule |
|---|---|---|
| `AGENTS.md` | Highest local authority for product, planning, demo, verification, and git rules. | Read before any material task. Do not duplicate it here. |
| `docs/exec-plans/index.md` | Active plan routing and next concrete todo per plan. | Check before creating or materially changing a plan. |
| `docs/exec-plans/active/*.md` | Execution plans, status, verification, and prompt artifacts. | Update when a plan state or next todo changes. |
| `docs/00_RESEARCH_AND_POSITIONING/` | Market and positioning context. | Use for product positioning and competitor framing. |
| `docs/01_PRODUCT_PLAN/` | Product vision, MVP, and module architecture. | Use for scope, object model, and roadmap decisions. |
| `docs/02_UX_PLAN/` | Role-based UX and IA. | Use for UI/navigation decisions. |
| `docs/03_WORKFLOWS/` | Lifecycle workflow rules. | Use for audit, checklist, finding, CAP, evidence, reminders. |
| `docs/04_MODULES/` | Module-level fields, actions, rules, and acceptance criteria. | Use before changing a module surface. |
| `docs/05_SCREEN_SPECS/` | Screen inventory and forms. | Use before adding/removing visible screens or fields. |
| `docs/06_DATA_AND_RULES/` | Conceptual data model, status, permission, security rules. | Use before changing statuses, owners, visibility, or role behavior. |
| `docs/07_ANALYTICS/` | Oversight Health Index and reports. | Use before changing dashboard/KPI behavior. |
| `docs/08_DEMO_AND_BUILD_HANDOFF/` | Demo prompts, acceptance criteria, and this runbook. | Use for agent handoff and build instructions. |
| `docs/09_SCENARIOS/` | Demo and edge-case scenarios. | Use for smoke paths and stakeholder replay. |
| `docs/10_REFERENCES/` | Glossary and source notes. | Use for terminology and regulatory wording. |
| `docs/DEMO_BUILD_SUMMARY.md` | Current demo evidence and known production gaps. | Update when demo behavior or verification status changes. |
| `tests/*.test.js` | Deterministic smoke checks for demo logic and rendering. | Run the smallest relevant subset before claiming local verification. |

## Article Principles Applied Here

| Article principle | AviaSurveil360 rule |
|---|---|
| `AGENTS.md` should be a map, not an encyclopedia. | Keep global/local rules in `AGENTS.md`; put working detail in docs, plans, this runbook, and evidence files. |
| The repo should be the agent's main knowledge base. | Durable decisions go into `docs/`, `docs/exec-plans/`, `docs/DEMO_BUILD_SUMMARY.md`, or `docs/exec-plans/tech-debt-tracker.md`, not only chat. |
| Agents need to see the application. | Use local static browser verification, console review, screenshots, and role-flow click-throughs for UI work. |
| Architecture rules should become mechanical checks. | Prefer targeted smoke tests and future structural checks for lifecycle, visibility, and demo-boundary rules. |
| Human taste should be encoded in the system. | Put repeated review preferences into UX docs, this runbook, tests, or visual QA checklists. |
| High agent capacity changes merge philosophy. | Keep diffs scoped and follow-up-friendly, but follow this repo's no branch/commit/push/GitHub-write rules unless explicitly asked. |
| Technical debt needs continuous cleanup. | Schedule doc gardening, stale metadata cleanup, and targeted refactor/QA tasks instead of letting bad patterns spread. |
| Success depends more on environment quality than prompt quality. | Improve the harness when agents fail repeatedly; do not rely on longer prompts alone. |

## Task Routing

| Task type | Read first | Likely edit surface | Verification |
|---|---|---|---|
| Docs-only product wording | `AGENTS.md`, relevant `docs/0*`, `docs/10_REFERENCES/GLOSSARY_AND_SOURCE_NOTES.md` | Matching English doc and `.turkce.md` companion if one exists | Markdown/path review, terminology consistency |
| New or updated plan | `AGENTS.md`, `docs/exec-plans/index.md`, nearest active plan | `docs/exec-plans/active/YYYY-MM-DD-<topic>-plan.md`, `docs/exec-plans/index.md` | Plan includes required sections and exact `Execution Prompt`; index row matches status/next todo |
| Static prototype behavior | `AGENTS.md`, active plan, `docs/DEMO_BUILD_SUMMARY.md`, relevant workflow/module docs | `index.html`, `css/styles.css`, `js/*.js`, targeted tests | JS syntax, targeted Node smoke, browser click-through |
| Role/permission/visibility | `AGENTS.md`, `docs/06_DATA_AND_RULES/STATUS_PERMISSION_SECURITY.md`, `docs/04_MODULES/AUDITEE_PORTAL.md` | `js/helpers.js`, `js/views.js`, `js/app.js`, relevant tests | Auditee isolation check, internal note visibility check, targeted smoke |
| Finding/CAP/Evidence lifecycle | `docs/03_WORKFLOWS/FINDING_CAP_EVIDENCE_WORKFLOW.md`, `docs/04_MODULES/{FINDINGS_MANAGEMENT,CAP_MANAGEMENT,EVIDENCE_REPOSITORY}.md` | `js/data.js`, `js/helpers.js`, `js/app.js`, tests | CAP acceptance does not close finding; evidence acceptance or authorized closure closes |
| Checklist/governance approval | Active governance plan, `docs/04_MODULES/CHECKLIST_BUILDER_AND_RUNNER.md`, `docs/03_WORKFLOWS/AUDIT_CHECKLIST_WORKFLOW.md` | `js/approval.js`, `js/checklists.js`, `js/planning.js`, `js/views.js`, tests | Approval smoke, checklist smoke, browser role path |
| UI/visual polish | `AGENTS.md`, `docs/02_UX_PLAN/*`, relevant active plan | CSS/views only unless behavior is required | Desktop/mobile visual QA, no overlap, no generic template drift |
| Status/readiness answer | `docs/exec-plans/index.md`, `docs/DEMO_BUILD_SUMMARY.md`, relevant plan/evidence | Usually no edit unless status is stale | Answer with `done / remaining / blocked` and local-vs-production split |
| Stakeholder handoff prompt | Active plan, `docs/08_DEMO_AND_BUILD_HANDOFF/*`, source docs | Plan `Execution Prompt` or handoff doc | Prompt is self-contained and preserves demo-only constraints |

## Decision Manifest

Use this for any material change beyond a typo or narrow mechanical correction.
Put it in the plan, a plan note, or the final evidence summary.

```markdown
## Decision Manifest Entry

- Evidence observed:
- Root cause or opportunity:
- Targeted component:
- Change made:
- Predicted fix:
- At-risk regression:
- Verification:
- Verdict:
```

Example:

```markdown
## Decision Manifest Entry

- Evidence observed: CAP review action moved a finding directly to Closed.
- Root cause or opportunity: CAP acceptance and evidence acceptance were coupled.
- Targeted component: `js/app.js` CAP review transition.
- Change made: CAP acceptance now sets `EVIDENCE_REQUIRED`.
- Predicted fix: Finding remains open until evidence is accepted or authorized closure is used.
- At-risk regression: Auditee evidence upload button may disappear if next action mapping is wrong.
- Verification: `node tests/inspection-execution-smoke.test.js` plus browser replay of OPS-2026-001.
- Verdict: verified locally / blocked / not run.
```

## Verification Matrix

Choose the smallest level that covers the risk.

| Level | Use when | Required checks |
|---|---|---|
| 1. Docs-only | Markdown, copy, planning, prompt, or source-index update. | Content review, changed links/paths, terminology consistency, plan index sync if touched. |
| 2. JS logic | Helper, state transition, data shape, or smoke-test change. | `node --check` for touched JS plus targeted `node tests/...`. |
| 3. Static workflow | User-facing click path changes. | Level 2 plus browser click-through of the changed role path. |
| 4. Visual/UI | Layout, responsive behavior, dashboard, or role-home changes. | Level 3 plus desktop/mobile screenshot review for overlap and readability. |
| 5. Boundary-sensitive | Auth, upload, AI, regulatory, audit-log, offline, evidence, notification, or reporting copy/behavior. | Relevant lower levels plus explicit no-production-claim review. |

Current targeted commands:

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

There is currently no `package.json`; do not tell agents to run `npm test`
unless one is added later.

## Browser QA Paths

Use local static browser verification for changed workflows:

```bash
python3 -m http.server 4360
```

Then open:

```text
http://localhost:4360/
```

Or open `index.html` directly when a server is not needed.

For visual evidence, assert against visible content that proves the target
screen is actually open. Hidden sidebar/navigation text is not enough. If a
browser tool rejects the local URL or file route, record `blocked` and keep the
coverage gap explicit instead of accepting a screenshot from the wrong screen.

Minimum paths by role:

- **CAA Inspector:** Today Workbench -> Audit Work Queue -> Audit Detail -> Checklist Runner -> Potential Finding/Finding path.
- **Lead Inspector:** Potential Finding review -> convert/return/dismiss.
- **Department Manager:** Planning Approval -> release/department acceptance/assignment flows.
- **GM / Finance / Executive Director:** Planning and report approval queues.
- **Auditee:** My Findings -> CAP submission -> evidence filename submission.
- **Admin Preview:** Template preview, question bank, version history, settings/audit-log surfaces.

After browser automation or GUI tests, check for leftover browser/test processes
before reporting completion, per `AGENTS.md`.

## Agent Autonomy Ladder

Use the highest level only when the lower levels already have repo-backed
support.

| Level | Agent can do | Required support |
|---|---|---|
| 0. Readout | Summarize current status and next todo. | Current plan index and evidence file are readable. |
| 1. Docs edit | Update docs/exec-plans/prompts. | Source docs and plan lifecycle are clear. |
| 2. Logic edit | Change demo data/helper/state transitions. | Targeted smoke test exists or is added. |
| 3. UI workflow edit | Change visible role paths. | Browser QA path and visual checklist are run. |
| 4. Evidence update | Update build summary or plan status after verification. | Local evidence exists and coverage gaps are named. |
| 5. External action | Commit, push, PR, GitHub write, deployment, or production claim. | Explicit user request for that exact action. |

## Demo Boundary Checklist

Before finalizing any demo/prototype work, confirm:

- CAP accepted is not finding closure.
- Finding closes only after evidence acceptance or authorized closure.
- Auditee sees only its own organization and auditee-visible comments.
- Internal CAA notes are not visible to auditee.
- Mock uploads display filenames only.
- Regulatory trace is labelled as mock/reference, not legal advice.
- AI output is labelled draft assistance and requires authorized review.
- Offline behavior is labelled simulated and no production sync is claimed.
- Oversight Health Index is a management indicator only.
- No backend, database, API, auth, upload service, AI service, regulatory ingestion, or production audit-log claim was introduced.

## Mechanical Gates To Add When Relevant

When a recurring issue appears, prefer a small check over another long reminder.

Current and good first candidates:

- `tests/demo-boundary-smoke.test.js` verifies that Auditee output cannot contain
  `Internal CAA Note`, inspector workload, or other-organization data.
- `tests/demo-boundary-smoke.test.js` verifies that CAP acceptance moves to
  evidence-required, not closed.
- `tests/demo-boundary-smoke.test.js` verifies that mock evidence stores and
  displays filename-shaped data only.
- `tests/demo-boundary-smoke.test.js` verifies that Auditee navigation does not
  expose internal CAA surfaces.
- Markdown package metadata must not claim "Markdown-only" after prototype files exist.
- Visible terminology uses `Finding`, `CAP`, `Evidence`, `Due Date`, `Target`, `Overdue`, `Auditee`, `CAA Inspector`, `CAA Manager`, `Internal CAA Note`, and `Comment to Auditee` consistently.

Each gate should fail with a message that names the product rule and the likely
fix location.

## Entropy Cleanup

Run cleanup as small, reviewable tasks:

- reconcile stale README/MANIFEST/package-truth claims
- remove duplicated or obsolete plan instructions after replacement plans exist
- archive completed plans only after objective and verification are inspected
- keep `docs/exec-plans/index.md` to one next concrete todo per active plan
- fold repeated review comments into this runbook, a UX doc, or a smoke test
- preserve demo-only labels when adding attractive advanced features

## Status Language

Use literal, scoped status:

- `verified locally` - local checks actually ran and passed.
- `not run` - checks were not run; say why.
- `blocked` - required evidence or environment access is unavailable.
- `ready-for-verification` - implementation/docs are in place but stakeholder/browser/source-bound verification remains.
- `demo-only` - behavior is mock/static/browser-local.
- `source-bound` - depends on a verified external/source-owner input.
- `production-readiness not claimed` - local/demo proof does not establish production readiness.

For Turkish user readouts, keep the answer compact and split:

```text
Done:
Remaining:
Blocked:
Verification:
Next:
```

## Plan Lifecycle Rules

When a plan is created or materially changed:

- update `docs/exec-plans/index.md`
- keep exactly one next concrete todo in the active index row
- do not move plans to `completed/` without inspected completion and verification
- record durable blockers or handoffs in `docs/exec-plans/tech-debt-tracker.md` only when they need to survive beyond the plan
- keep detailed task lists inside the plan, not the active index

## Git And Workspace Hygiene

- Do not create, switch, rename, or delete branches unless the user explicitly asks in the current task.
- Do not commit, push, or post GitHub comments unless the user explicitly asks.
- Preserve unrelated dirty worktree changes.
- Do not revert CSS/JS/test/docs changes you did not make.
- This folder may not always behave like a normal app repo; inspect before assuming package scripts or CI.

## First Harness Application

The best first use of this runbook is the active governance plan's next todo:

```text
Browser click-through/visual QA across all new role paths, then stakeholder review.
```

For that task, read:

- `AGENTS.md`
- this runbook
- `docs/exec-plans/index.md`
- `docs/exec-plans/active/2026-06-28-caa-governance-workflow-and-roles-plan.md`
- `docs/DEMO_BUILD_SUMMARY.md`

Then run the relevant Node smoke checks, perform browser QA, update durable
evidence, and only change the active index row if the status or next todo really
changes.
