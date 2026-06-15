# Agent Notes

## Scope

- This folder owns the `AviaSurveil360` surveillance, audit, findings, CAP,
  evidence, auditee portal, dashboard, and demo-first planning pack.
- Use `AviaSurveil360` as the canonical product name in documentation,
  prototype copy, implementation notes, prompts, and stakeholder handoffs.
- This project is currently a structured product/specification and planning
  pack. It is not yet a full application repository unless a later task
  explicitly creates a buildable app.
- The first executable artifact should be a frontend-only clickable demo for
  stakeholder feedback, not a production system.
- Keep source code identifiers, comments, canonical docs, file names where
  practical, and implementation plans in English. Provide Turkish companion
  docs as `.turkce.md` when updating stakeholder-facing documentation that
  already follows the bilingual pattern.

## Source Of Truth

Start with these files before product, implementation, or prototype work:

1. `README.md`
2. `README.turkce.md`
3. `MANIFEST.md`
4. `00_RESEARCH_AND_POSITIONING/MARKET_RESEARCH_SUMMARY.md`
5. `00_RESEARCH_AND_POSITIONING/PRODUCT_POSITIONING_AND_DECISIONS.md`
6. `01_PRODUCT_PLAN/PRODUCT_VISION.md`
7. `01_PRODUCT_PLAN/MVP_SCOPE_AND_ROADMAP.md`
8. `01_PRODUCT_PLAN/MODULE_ARCHITECTURE.md`
9. `02_UX_PLAN/UX_PRINCIPLES.md`
10. `02_UX_PLAN/NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
11. `03_WORKFLOWS/MASTER_WORKFLOW.md`
12. `03_WORKFLOWS/SURVEILLANCE_PLANNING_WORKFLOW.md`
13. `03_WORKFLOWS/AUDIT_CHECKLIST_WORKFLOW.md`
14. `03_WORKFLOWS/FINDING_CAP_EVIDENCE_WORKFLOW.md`
15. `03_WORKFLOWS/REMINDERS_AND_ESCALATION_WORKFLOW.md`
16. `04_MODULES/AUDIT_PLANNING.md`
17. `04_MODULES/CHECKLIST_BUILDER_AND_RUNNER.md`
18. `04_MODULES/FINDINGS_MANAGEMENT.md`
19. `04_MODULES/CAP_MANAGEMENT.md`
20. `04_MODULES/EVIDENCE_REPOSITORY.md`
21. `04_MODULES/AUDITEE_PORTAL.md`
22. `04_MODULES/DASHBOARDS_AND_REPORTS.md`
23. `04_MODULES/ORGANIZATION_REGISTRY.md`
24. `05_SCREEN_SPECS/SCREEN_INVENTORY_AND_FORMS.md`
25. `06_DATA_AND_RULES/CONCEPTUAL_DATA_MODEL.md`
26. `06_DATA_AND_RULES/STATUS_PERMISSION_SECURITY.md`
27. `07_ANALYTICS/OVERSIGHT_HEALTH_INDEX_AND_KPIS.md`
28. `08_DEMO_AND_BUILD_HANDOFF/CODEX_DEMO_ONLY_PROMPT.md`
29. `08_DEMO_AND_BUILD_HANDOFF/FULL_MVP_BUILD_PROMPT_LATER.md`
30. `09_SCENARIOS/DEMO_SCENARIO_OPERATOR_AUDIT.md`
31. `09_SCENARIOS/OTHER_DOMAIN_SCENARIOS_AND_EDGE_CASES.md`
32. `10_REFERENCES/GLOSSARY_AND_SOURCE_NOTES.md`

For Turkish phrasing, stakeholder summaries, or local-language handoffs, also
read the matching `.turkce.md` files.

## Product Rules

- AviaSurveil360 is a focused CAA surveillance and oversight workbench, not a
  broad enterprise suite clone.
- The product's core operational value is the clean lifecycle from audit plan
  to checklist, finding, CAP, evidence review, closure, and management
  visibility.
- Keep the central operational objects as:
  - `Organization`
  - `Audit / Inspection`
  - `Checklist Template`
  - `Checklist Response`
  - `Finding`
  - `Corrective Action Plan (CAP)`
  - `Evidence`
  - `Reminder / Notification`
  - `Report`
  - `Audit Log`
- Design around three user questions:
  - CAA Inspector: `What do I need to inspect or review today?`
  - Auditee: `What does the CAA need from my organization?`
  - CAA Manager: `Where are we exposed, delayed, or overloaded?`
- Do not present the product as a generic checklist app. The differentiator is
  the Finding -> CAP -> Evidence -> CAA Review -> Closure workflow.
- CAP acceptance is not finding closure. A finding closes only after required
  evidence is accepted, verification is completed, or an authorized closure path
  is explicitly used and audit-logged.
- Use simple lifecycle language. Avoid excessive enterprise workflow terms.
- Use `Due Date`, `Target`, `Due Soon`, and `Overdue` language. Do not make a
  heavy SLA module part of the demo or first product story.
- `Oversight Health Index` is a management indicator only. It must not be used
  as an automatic legal, enforcement, certificate suspension, or closure
  decision.
- Finding severity should be clear but careful:
  - `Level 1 Critical`
  - `Level 2 Major`
  - `Level 3 Minor`
  - `Observation`
- Finding escalation to enforcement is not automatic by default. Treat
  enforcement as a separate configured or authorized process for critical,
  repeated, overdue, or high-risk cases.
- Auditee Portal users must only see their own organization's audits,
  findings, CAP requests, evidence requests, CAA-visible comments, and closure
  status.
- Auditee users must not see internal CAA notes, inspector workload, other
  organizations, internal risk scoring, private dashboard data, or enforcement
  deliberations unless a later source document explicitly changes this.
- Separate `Comment to Auditee` from `Internal CAA Note` in every relevant
  workflow and screen.
- Evidence version history must be preserved conceptually. Do not overwrite old
  evidence records in product plans or implementation notes.
- Regulatory references are references, not legal advice. Use careful language
  such as `reference`, `regulatory reference`, `configured rule`, `finding
  basis`, and `expected evidence`.
- Do not invent binding legal, aviation authority, surveillance, enforcement,
  certificate, medical, security, or operational obligations. Mark unresolved
  regulatory assumptions as assumptions or open questions.

## Demo-First Rule

- The first build handoff is demo-only.
- Use only HTML, CSS, and Vanilla JavaScript unless the existing prototype
  already uses another stack and the user explicitly asks to keep it.
- Use mock data and client-side state only.
- Do not create backend, database, API, real authentication, real file upload,
  real email, real notification service, real document storage, real mobile
  offline app, production architecture, advanced BI, or framework migration for
  the demo.
- The demo must be sales-demo ready and feedback-oriented, not production-ready.
- The demo must clearly show one main scenario:
  1. CAA Manager sees a surveillance plan.
  2. CAA Inspector opens an Operator Audit for Airline XYZ.
  3. Inspector runs a Flight Operations checklist.
  4. Inspector marks `Crew training records complete?` as `Non-Compliant`.
  5. System creates `Finding OPS-2026-001`.
  6. Airline XYZ logs into the Auditee Portal.
  7. Auditee submits root cause, corrective action, preventive action, target
     completion date, and mock evidence.
  8. Inspector reviews the evidence.
  9. Inspector accepts or requests more information.
  10. Finding closes only after evidence acceptance or authorized closure.
  11. Manager dashboard updates.

## Prototype Guidance

- If a prototype folder exists, keep the static architecture unless the user
  explicitly asks for a framework migration.
- If creating a new demo prototype, use a simple root structure such as:
  - `index.html`
  - `css/`
  - `js/`
  - `data/` for mock data if useful
  - `docs/DEMO_BUILD_SUMMARY.md` or equivalent if the repository structure uses
    a different docs location.
- Required demo roles:
  - `CAA Manager`
  - `CAA Inspector`
  - `Auditee`
  - `Admin Preview`
- Required demo screens:
  1. Role switch / login demo
  2. Manager Dashboard
  3. Inspector Dashboard
  4. Audit Plan Calendar
  5. Audit Detail
  6. Checklist Runner
  7. Finding Detail with lifecycle stepper
  8. Auditee My Findings
  9. CAP Submission Form
  10. Evidence Upload / Review
  11. Closed Finding / Report Preview
  12. Admin Checklist Template Preview
- Every page should have one clear main purpose.
- Every finding must show:
  - current owner
  - next action
  - due date
  - status
  - severity
  - related audit
  - organization
- Prefer task-based navigation over broad enterprise menus.
- Keep UI suitable for a civil aviation authority: restrained, readable,
  audit-friendly, accessible, and low-clutter.
- For mock uploads, display a selected file name only. Do not implement real
  storage.
- For mock notifications, use in-UI messages or notification cards only. Do not
  implement real email/SMS/WhatsApp services.
- For mock reports, create a report preview screen. Do not implement a real
  reporting engine.
- For dashboards, show the smallest useful decision set. Avoid heavy chart walls.

## Documentation Guidance

- Preserve the existing numbered folder structure unless a task explicitly asks
  for a new structure.
- Do not modify original source/reference materials unless the user explicitly
  asks to add, replace, or correct source material.
- When a canonical English stakeholder/product doc changes, update the matching
  `.turkce.md` companion when one exists, or state why no Turkish update was
  needed.
- Keep English docs canonical for implementation. Use Turkish companion docs for
  stakeholder handoff, local explanation, and sales/WhatsApp summaries.
- Keep regulatory wording careful. Use `reference`, `configured check`,
  `expected evidence`, `finding basis`, and `review result` language unless a
  verified source document requires stronger legal wording.
- Do not claim regulatory, security, enforcement, evidence, notification,
  reporting, or audit-log behavior is complete without matching docs and
  scenario evidence.
- Keep demo-specific claims clearly marked as mock/demo behavior.

## Planning

- For implementation plans, roadmaps, production-readiness plans, stakeholder
  follow-up plans, prototype execution plans, or `<proposed_plan>` requests,
  create or update a Markdown artifact under `11_PLANS/` unless the repository
  already has an established plan folder.
- If a repository already contains `docs/plans/`, use that existing path instead
  of creating `11_PLANS/`.
- Do not leave requested plans only in chat unless the user explicitly asks for
  a conversational answer only.
- Name plan files in English kebab-case as
  `YYYY-MM-DD-<short-topic>-plan.md`.
- Saved plans must be self-contained and include:
  - objective
  - scope
  - assumptions
  - phases
  - verification
  - risks
  - dependencies
  - ownership boundaries
  - explicit out-of-scope items
  - `Execution Prompt`
- End every saved plan with an `Execution Prompt` section containing the exact
  prompt the user can paste into Codex or Claude.
- In the final response for any plan creation or plan update, link to the saved
  plan file, summarize only the highest-signal points, and include or identify
  the exact `Execution Prompt` text from the saved plan.
- Plan and review with practical engineering quality principles: improve overall
  quality, prefer facts/tests/project conventions over preference, avoid
  speculative flexibility, separate refactors from behavior changes when
  practical, and mark review findings as `Blocking`, `Suggestion`, `Nit`, or
  `FYI` when useful.

### Plan And Todo Tracking

- This `AGENTS.md` is authoritative for this folder's plan tracking lifecycle.
- If `11_PLANS/` is used, the active tracking files are:
  - `11_PLANS/index.md`
  - `11_PLANS/completed/index.md`
  - `11_PLANS/notes/index.md`
- If `docs/plans/` already exists, use:
  - `docs/plans/index.md`
  - `docs/plans/completed/index.md`
  - `docs/plans/notes/index.md`
- Use these index status terms consistently: `active`, `paused`, `blocked`,
  `ready-for-verification`, `completed`, `archived`, `superseded`,
  `note-open`, and `note-closed`.
- Update the active plan index when a plan is created, materially paused,
  blocked, resumed, verified, completed, superseded, or archived.
- Keep only the next concrete todo per active plan in the active index; detailed
  task lists stay inside the plan artifact.
- Move a plan to `completed/` only after its objective is met, required
  verification has passed or the coverage gap is documented, and remaining work
  is captured in a note or follow-up plan. Preserve the original filename when
  moving a completed plan.
- Record completed plans in `completed/index.md` with completion date, original
  location, owner, verification, commit or evidence pointer, and follow-up note
  link when applicable.
- Store durable post-plan facts, blockers, accepted risks, missing evidence,
  regulatory assumptions, stakeholder handoffs, and owner handoffs in
  `notes/`.
- Track notes in `notes/index.md` using `note-open` or `note-closed`.
- Superseded plans may move to `completed/` only when the supersession is
  explicit and the replacement plan is linked. If completion evidence is not
  verified, leave the old plan in place and mark it `superseded` in the active
  index.
- For historical plans, do not infer completion from old dates alone. Leave
  unverified historical plans in place; add an index row only when a human or
  agent has inspected and classified the plan.
- Before finishing a task that touches plan artifacts, verify that the active
  index row, next todo, verification status, completed archive row, and note
  entries match the work actually performed.
- A plan execution task is not complete until its active index row and todo
  match the actual final state.

## Checks

- For documentation-only changes, run a focused Markdown/content review and
  check links/paths that changed.
- For static prototype changes, open `index.html` directly or serve the folder
  locally only if browser behavior requires it. Verify the changed workflow in
  the rendered prototype.
- For JavaScript changes, prefer targeted browser smoke checks and syntax checks
  available in the local environment.
- For demo-only work, verify there is no backend, database, API, auth service,
  upload service, email service, or framework migration unless explicitly
  requested.
- Do not claim regulatory, security, enforcement, evidence repository,
  notification, mobile/offline, reporting, or workflow behavior is production
  complete without matching docs and scenario evidence.
- When changing visible UI copy, check for terminology consistency:
  - `Finding`
  - `CAP`
  - `Evidence`
  - `Due Date`
  - `Target`
  - `Overdue`
  - `Auditee`
  - `CAA Inspector`
  - `CAA Manager`
  - `Internal CAA Note`
  - `Comment to Auditee`

## Git And Change Control

- This folder may not be a Git repository. Do not assume `git commit` or
  `git push` are available.
- Do not initialize a Git repository, create branches, commit, push, or rename
  this folder unless the user explicitly asks for that action.
- Keep unrelated local files such as `.DS_Store`, local tool settings, generated
  caches, and original input archives untouched unless the user explicitly asks.
- Keep changes focused. Do not combine unrelated product decisions, refactors,
  copy changes, and prototype behavior changes when separate changes would be
  clearer.

Run commands from the project root unless a task-specific doc says otherwise.
