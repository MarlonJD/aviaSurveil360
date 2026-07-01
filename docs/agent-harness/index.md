# AviaSurveil360 Agent Harness Index

This is the canonical entrypoint for AviaSurveil360 agent harness work. Read it
after `../../AGENTS.md` when the task touches repo implementation, plans,
verification, readiness, handoff, or demo evidence.

The harness does not change product scope. AviaSurveil360 remains a planning
pack plus a frontend-only static clickable demo until the user explicitly
approves a different build direction.

## Source Hierarchy

1. `../../AGENTS.md` is the highest local authority for product, demo,
   planning, verification, and git boundaries.
2. Numbered product docs under `../00_RESEARCH_AND_POSITIONING/` through
   `../10_REFERENCES/` define the AviaSurveil360 domain.
3. `../plans/index.md` is the active plan router and next-todo tracker.
4. This harness package defines agent-facing output, registry, verification,
   and cleanup rules.
5. `../DEMO_BUILD_SUMMARY.md` records local demo evidence and known production
   gaps.
6. `../08_DEMO_AND_BUILD_HANDOFF/AGENT_HARNESS_RUNBOOK.md` remains the applied
   historical runbook and scenario-oriented operating notes.

## Harness Package Map

| File | Use it for |
|---|---|
| `output-contract.md` | Final readout shape, status labels, evidence language, and forbidden claims. |
| `registry.md` | Repo surface inventory and task-to-source routing. |
| `verification-matrix.md` | Local command ladder by risk level. |
| `entropy-cleanup-checklist.md` | Drift, stale-claim, plan-index, and evidence-label cleanup. |
| `../08_DEMO_AND_BUILD_HANDOFF/AGENT_HARNESS_RUNBOOK.md` | Applied examples, browser QA paths, and older runbook context. |
| `../plans/index.md` | Active plan state and one concrete next todo per active plan. |
| `../DEMO_BUILD_SUMMARY.md` | Current demo evidence, local verification status, and limitations. |

## Task Routing Summary

| Task | First source | Harness rule |
|---|---|---|
| Status or readiness readout | `../plans/index.md`, `../DEMO_BUILD_SUMMARY.md` | Use `output-contract.md`; separate local proof from production scope. |
| Plan creation or execution | `../../AGENTS.md`, `../plans/index.md`, nearest plan | Keep the index row and next todo synchronized with the actual result. |
| Docs-only product update | Relevant numbered product docs and glossary | Preserve careful regulatory wording and bilingual companions when applicable. |
| Static demo behavior | Relevant workflow/module docs, `../DEMO_BUILD_SUMMARY.md`, targeted tests | Use the smallest local verification level that covers the changed path. |
| Role, visibility, CAP, evidence, upload, AI, or regulatory copy | `../06_DATA_AND_RULES/STATUS_PERMISSION_SECURITY.md` plus workflow/module docs | Treat as boundary-sensitive and review demo-only labels. |
| Harness maintenance | This package, runbook, manifest, plan index | Prefer one focused harness doc update over broad AGENTS expansion. |

## Demo-Only Boundary

Do not add or claim backend, database, API, real authentication, real
authorization enforcement, real upload/storage, real AI service, real
regulatory ingestion, real notification service, production audit-log behavior,
remote CI, hosted runners, paid automation, framework migration, branch actions,
commits, pushes, PRs, or GitHub comments unless the user explicitly asks for
that exact action.

Local verification is the default: direct `node`, `git diff --check`, `rg`, and
local browser QA only when a visible workflow requires it.

## Before Editing Checklist

- Which `AGENTS.md` rule or active plan controls this task?
- Which product source doc defines the domain behavior?
- Which harness output contract applies?
- Which verification level applies?
- Where will evidence or status be recorded?
- What is explicitly out of scope?

If those answers are unclear, stop and read the relevant source document before
editing.
