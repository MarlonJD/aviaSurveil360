# AviaSurveil360 Agent Harness Entropy Cleanup Checklist

Use this checklist for small, reviewable cleanup passes. It prevents stale
instructions, duplicated runbooks, plan-index drift, and evidence-label drift
from becoming the next agent's default context.

## Current Cleanup Items

| Item | Status | Owner | Evidence / next action |
|---|---|---|---|
| Canonical harness package exists under `docs/agent-harness/`. | verified locally | Agent executing readiness plan | Verified with `node tests/harness-docs-smoke.test.js`. |
| Old runbook points to the canonical entrypoint. | verified locally | Agent executing readiness plan | `../08_DEMO_AND_BUILD_HANDOFF/AGENT_HARNESS_RUNBOOK.md` opening section points to `../agent-harness/index.md`. |
| `AGENTS.md` stays short and map-like. | recurring check | Future agents | Add pointers only; move working detail into this package. |
| `MANIFEST.md` lists new harness docs and smoke test. | verified locally | Agent executing readiness plan | Manifest Agent Harness and Smoke Tests sections. |
| Active plan index matches actual harness status. | ready-for-verification | Plan owner / future agents | `../exec-plans/index.md` row for harness readiness. |
| Superseded partial adaptation remains historical, not completed by inference. | accepted current risk | Future agents | Keep continuation note linked to readiness plan. |
| Demo summary keeps local evidence separate from production gaps. | recurring check | Future agents | `../DEMO_BUILD_SUMMARY.md` after visible demo verification. |

## Recurring Drift Symptoms

- `AGENTS.md` grows into a long encyclopedia instead of routing agents to
  focused docs.
- `../08_DEMO_AND_BUILD_HANDOFF/AGENT_HARNESS_RUNBOOK.md` and this package
  repeat the same rule with different wording.
- `../exec-plans/index.md` keeps an old next todo after implementation evidence
  changes.
- A plan is moved to `completed/` without user/stakeholder sign-off.
- The demo is described with production-scope language after only local checks.
- README or MANIFEST omits current prototype, test, plan, or harness files.
- Browser evidence uses hidden navigation labels instead of visible target
  content.
- A new test or instruction implies `npm test`, GitHub Actions, remote CI, or
  paid automation even though this repo uses direct local commands.

## Cleanup Rules

- Prefer one targeted edit to the authoritative surface over repeating the same
  warning across many files.
- If a recurring issue can be checked mechanically, add or extend a direct Node
  smoke test using built-ins only.
- Keep durable blockers and accepted risks in
  `../exec-plans/tech-debt-tracker.md` when they must survive the current plan.
- Preserve unrelated dirty worktree changes; classify them rather than
  reverting them.
- Use `verified locally`, `blocked`, and `not run` literally in status
  readouts.
- Keep demo-only and production-readiness boundaries explicit whenever a task
  touches role visibility, evidence, upload, AI, regulatory, audit-log,
  notification, offline, reporting, or security language.

## Next Adoption Check

After this readiness plan reaches `ready-for-verification`, use this package on
one small future AviaSurveil360 task and confirm the agent can answer before
editing:

- What source rule controls the task?
- What output contract applies?
- Which verification level applies?
- Where will evidence be recorded?
- What is explicitly out of scope?

If the package causes confusion, fix `index.md` or `output-contract.md` first.
Do not expand `AGENTS.md` unless a concise pointer is missing.
