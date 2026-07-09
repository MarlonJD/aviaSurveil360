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
| [Table-First Surveillance Workbench UX](active/2026-07-01-table-first-surveillance-workbench-ux-plan.md) | ready-for-verification | Deeper table-first pass (2026-07-02) implemented and verified locally: hero/callout/progress-card removals, shared-row `Lifecycle` column dedup, Organization Risk Profile overflow fix, and mobile stacked work-item rows. All 17 Node smoke tests pass; fresh Playwright evidence under `qa/screenshots/playwright-2026-07-02/` (140 captures, 0 errors, 0 overflow). **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [Premium UI Remediation Plan](active/2026-07-08-premium-ui-remediation-plan.md) | ready-for-verification | Premium UI remediation implemented and verified locally: blocking visual defects fixed, shared workbench patterns added, all Node smoke tests pass, full 55-route desktop/tablet/mobile screenshots captured with clipping/overlap guards clean. **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [Modern Aviation SaaS Rollout](active/2026-07-08-modern-aviation-saas-rollout-plan.md) | active | Visual direction confirmed as Modern Aviation SaaS / Aviation Command SaaS. **Next:** Phase 0 baseline, token audit, and QA gate before broad styling changes. |
| [Cabin Inspection Demo Scenario](active/2026-07-09-cabin-inspection-demo-scenario-plan.md) | ready-for-verification | Cabin Inspection primary scenario implemented and verified locally: workbook-derived 6-question runnable checklist, `CAB-2026-001` lifecycle, updated tests, scenario docs, and bilingual build summaries. **Next:** stakeholder review/sign-off before moving to `completed/`. |
| [Department And General Manager Oversight Workspaces](active/2026-07-09-department-manager-workspaces-plan.md) | active | Tasks 1-5 are verified locally; Tasks 1-4 are committed and pushed, and Task 5 manager navigation/dashboard is prepared as its focused commit. **Next:** write the Task 6 CAP Monitoring smoke test and verify RED. |
| [AviaSurveil360 Harness Engineering Adaptation](active/2026-06-29-aviasurveil-harness-engineering-adaptation-plan.md) | superseded | Superseded for final readiness tracking by [AviaSurveil360 Agent Harness Readiness Completion](active/2026-06-29-agent-harness-readiness-completion-plan.md). Keep as historical partial-adaptation record; do not move to `completed/` until the replacement plan is verified or explicitly accepted. |
| [AviaSurveil360 Agent Harness Readiness Completion](active/2026-06-29-agent-harness-readiness-completion-plan.md) | ready-for-verification | Canonical `docs/agent-harness/` package and local-only Node harness docs smoke gate are in place. Local checks passed: `git diff --check`, `node tests/harness-docs-smoke.test.js`, `node tests/demo-boundary-smoke.test.js`, required `rg` link search, and `.github` workflow check. No GitHub Actions, hosted runners, remote CI, or paid workflow minutes were added. **Next:** stakeholder/user sign-off before moving to `completed`. |

## Companion Records

- `completed/index.md` - completed or archived execution-plan records.
- `tech-debt-tracker.md` - durable blockers, accepted risks, missing evidence,
  and follow-up facts.
