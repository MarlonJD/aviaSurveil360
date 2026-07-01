# Execution Plans Index

This is the active execution-plan tracking index for AviaSurveil360, per
`AGENTS.md`.
Status terms: `active`, `paused`, `blocked`, `ready-for-verification`,
`completed`, `archived`, `superseded`.

Keep only the next concrete todo per active plan here. Detailed task lists live
inside each plan artifact under `active/`. Completed plan records live under
`completed/`. Durable blockers, accepted risks, and follow-up facts live in
`tech-debt-tracker.md`.

| Plan | Status | Next Todo |
|---|---|---|
| [Demo-Only Prototype Plan](active/2026-06-14-aviasurveil-demo-only-prototype-plan.md) | ready-for-verification | Demo built and verified end-to-end in a browser (no console errors). All required screens plus New Audit Wizard, Organizations registry, Admin Users/Settings, authorized-closure path, and traceable reminders; bilingual build summary written (`docs/demo-evidence/BUILD_SUMMARY.md` + `.turkce.md`). Next: stakeholder review/sign-off, then move to `completed/`. |
| [NCAA Platform V2 And MVP Plan](active/2026-06-23-ncaa-platform-v2-and-mvp-plan.md) | ready-for-verification | Frontend V2 demo implemented and verified locally with browser persistence, simulated offline outbox, Regulatory Trace, AI draft decisions, all nine V2 screens, Furkan role-experience IA feedback, and Inspector Today’s Workbench. Next: stakeholder review/sign-off of the three-experience IA, then choose the follow-up track (production MVP architecture execution, regulatory owner packet, offline mobile discovery, or AI governance discovery). README/MANIFEST package-truth cleanup is complete. |
| [CAA Governance Workflow And Multi-Role Expansion](active/2026-06-28-caa-governance-workflow-and-roles-plan.md) | ready-for-verification | Phases 0-4 implemented locally in the frontend-only demo. Syntax, deterministic Node smoke checks, desktop browser QA, and mobile Planning Approval content visual QA are verified locally. **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [Planning Panel Simplification](active/2026-06-30-planning-panel-simplification-plan.md) | ready-for-verification | Canonical Planning panel implemented and verified locally. The Department Manager -> GM -> Finance Review -> Executive Director chain is preserved; legacy Planning Board / Planning Approvals wrappers remain internal compatibility routes; Audit Work Queue remains the execution queue. **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [Table-First Surveillance Workbench UX](active/2026-07-01-table-first-surveillance-workbench-ux-plan.md) | ready-for-verification | Table-first workbench refactor implemented and verified locally for the frontend-only demo. Syntax checks, deterministic Node smoke tests, in-app Browser row-click/privacy/viewport QA, and changed-route screenshot evidence under `qa/screenshots/table-first-2026-07-01/` are complete. **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [AviaSurveil360 Harness Engineering Adaptation](active/2026-06-29-aviasurveil-harness-engineering-adaptation-plan.md) | superseded | Superseded for final readiness tracking by [AviaSurveil360 Agent Harness Readiness Completion](active/2026-06-29-agent-harness-readiness-completion-plan.md). Keep as historical partial-adaptation record; do not move to `completed/` until the replacement plan is verified or explicitly accepted. |
| [AviaSurveil360 Agent Harness Readiness Completion](active/2026-06-29-agent-harness-readiness-completion-plan.md) | ready-for-verification | Canonical `docs/agent-harness/` package and local-only Node harness docs smoke gate are in place. Local checks passed: `git diff --check`, `node tests/harness-docs-smoke.test.js`, `node tests/demo-boundary-smoke.test.js`, required `rg` link search, and `.github` workflow check. No GitHub Actions, hosted runners, remote CI, or paid workflow minutes were added. **Next:** stakeholder/user sign-off before moving to `completed`. |

## Companion Records

- `completed/index.md` - completed or archived execution-plan records.
- `tech-debt-tracker.md` - durable blockers, accepted risks, missing evidence,
  and follow-up facts.
