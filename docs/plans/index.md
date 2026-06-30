# Plans Index — Active

This is the active plan tracking index for AviaSurveil360, per `AGENTS.md`.
Status terms: `active`, `paused`, `blocked`, `ready-for-verification`,
`completed`, `archived`, `superseded`.

Keep only the next concrete todo per active plan here. Detailed task lists live
inside each plan artifact.

| Plan | Status | Next Todo |
|---|---|---|
| [Demo-Only Prototype Plan](2026-06-14-aviasurveil-demo-only-prototype-plan.md) | ready-for-verification | Demo built and verified end-to-end in a browser (no console errors). All required screens plus New Audit Wizard, Organizations registry, Admin Users/Settings, authorized-closure path, and traceable reminders; bilingual build summary written (`docs/DEMO_BUILD_SUMMARY.md` + `.turkce.md`). Next: stakeholder review/sign-off, then move to `completed/`. |
| [NCAA Platform V2 And MVP Plan](2026-06-23-ncaa-platform-v2-and-mvp-plan.md) | ready-for-verification | Frontend V2 demo implemented and verified locally with browser persistence, simulated offline outbox, Regulatory Trace, AI draft decisions, all nine V2 screens, Furkan role-experience IA feedback, and Inspector Today’s Workbench. Next: stakeholder review/sign-off of the three-experience IA, then choose the follow-up track (README/MANIFEST package-truth cleanup, production MVP architecture execution, regulatory owner packet, offline mobile discovery, or AI governance discovery). |
| [CAA Governance Workflow And Multi-Role Expansion](2026-06-28-caa-governance-workflow-and-roles-plan.md) | ready-for-verification | Phases 0-4 implemented locally in the frontend-only demo: reusable approval primitive; Phase 0B Planning Approval; Phase 1A Checklist Approval Shell; Phase 1B/1C Question Bank, Builder, Version History, mandatory Reason for Change, publish/archive; Phase 2 Inspector → Lead Potential Finding conversion; Phase 3 planning release/audit preparation; Phase 4 report approval/final lock. Deterministic Node smoke checks pass. **Next:** browser click-through/visual QA across all new role paths, then stakeholder review before moving to `completed/`. |
| [Planning Panel Simplification](2026-06-30-planning-panel-simplification-plan.md) | ready-for-verification | Canonical Planning panel implemented and verified locally. The Department Manager -> GM -> Finance Review -> Executive Director chain is preserved; legacy Planning Board / Planning Approvals wrappers remain internal compatibility routes; Audit Work Queue remains the execution queue. **Next:** stakeholder review/sign-off before moving to `completed/`. |

## Companion indexes

- `completed/index.md` — created when the first plan is completed/archived.
- `notes/index.md` — created when the first durable post-plan note is recorded.
