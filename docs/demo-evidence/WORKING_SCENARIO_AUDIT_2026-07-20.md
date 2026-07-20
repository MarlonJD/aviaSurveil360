# AviaSurveil360 Working Scenario Audit — 20 July 2026

## Evidence status

- Audit status: `verified locally`
- Release status: `release pending`
- Existing claims and previous browser evidence: treated as `candidate-only` until reproduced in this run
- Production status: `production-ready` is not claimed
- Application changes: none
- Remediation plan: not created

This is a workflow and data-integrity audit of the frontend-only AviaSurveil360 demo. It is not a production-readiness, regulatory-compliance, security-penetration, or legal assessment.

## Executive summary

Seventy discrete role, transition, lifecycle, privacy, control, responsive, and console checks were executed through real browser interactions at `http://127.0.0.1:4173/index.html`. Sixty checks recorded `PASS`, nine were defect-bearing/`FAIL`, and one routine coordination path was `blocked`.

Thirteen root-cause findings were issued:

| Severity | Count |
|---|---:|
| Blocking | 1 |
| High | 6 |
| Medium | 6 |
| Low | 0 |
| FYI | 0 |

The most consequential result is a split Lead Inspector data surface: canonical and newly materialized Audits reach Inspector assignments but do not appear in Lead Inspector Assigned Audits. That prevents the Lead from opening the assignment workspace and sending the coordination package for a routine announced inspection. The Auditee consequently receives no coordination request even though materialization says coordination is ready.

Other high-risk inconsistencies affect actor attribution, checklist mutation authority, owner/next-action routing, planning approval semantics, and the distinction between evidence-verified and authorized closure.

## Method and evidence controls

- Read the repository instructions and required source-of-truth documents before testing, including both English and Turkish companions where required.
- Served the static demo through localhost. `file://` was not used.
- Used the in-app browser and real clicks, selections, typing, navigation, reloads, and role switches.
- Did not mutate browser state or `localStorage` directly for evidence.
- Used `Reset demo data` between independent scenarios. State was intentionally preserved only within a single multi-role lifecycle chain.
- Repeated the planning/materialization chain from a clean start when the routine coordination result required disambiguation.
- Checked the final browser console after all scenario work: zero entries.
- Reset the temporary responsive viewport, finalized browser tabs, stopped the localhost server, and checked for leftover browser/test/server processes.

Evidence directory:

`/private/tmp/aviasurveil360-working-scenario-audit-20260720`

Final diagnostics:

- Console: `/private/tmp/aviasurveil360-working-scenario-audit-20260720/final-console.json`
- Cleanup: `/private/tmp/aviasurveil360-working-scenario-audit-20260720/cleanup.txt`

## Expected-behavior sources

The principal contracts used to judge behavior were:

- `AGENTS.md` — Product Rules, Demo-First Rule, Prototype Guidance, Checks
- `docs/product-specs/workflows/MASTER_WORKFLOW.md` — accepted inspection lifecycle, Finding lifecycle, owner and next-action models, blocking rules
- `docs/product-specs/workflows/SURVEILLANCE_PLANNING_WORKFLOW.md` — approval, release, preparation, materialization, announced/unannounced rules
- `docs/product-specs/workflows/AUDIT_CHECKLIST_WORKFLOW.md` — draft, submit, reopen, and Potential Finding flow
- `docs/product-specs/workflows/FINDING_CAP_EVIDENCE_WORKFLOW.md` — CAP, Evidence, verification results, and closure
- `docs/product-specs/data-and-rules/STATUS_PERMISSION_SECURITY.md` — role authority and organization/privacy boundaries
- `docs/product-specs/data-and-rules/CONCEPTUAL_DATA_MODEL.md` — canonical identities, relationships, owner, status, and evidence history
- `docs/product-specs/modules/AUDITEE_PORTAL.md` — coordination, CAP, report visibility, and organization isolation
- `docs/product-specs/screen-specs/SCREEN_INVENTORY_AND_FORMS.md` — expected screens, labels, and forms
- `docs/product-specs/screen-specs/DEPARTMENT_MANAGER_WORKSPACES.md` — management queues and report approvals
- `docs/product-specs/ux-plan/NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` — eight role workspaces and task navigation
- `docs/demo-evidence/BUILD_SUMMARY.md` and `docs/demo-evidence/BROWSER_SCENARIO_INTEGRITY_2026-07-20.md` — prior `candidate-only` demo claims and browser-integrity expectations

## Finding register

| ID | Severity | Short title | Primary surface |
|---|---|---|---|
| WSA-001 | High | Administration entry is a silent no-op | Login / Administration |
| WSA-002 | High | Planning displays approved preparation before approval | Planning / Finance / GM / Department Manager |
| WSA-003 | Medium | Mobile decision summaries remain visible at desktop | Finance, Auditee, checklist/report actions |
| WSA-004 | High | Logged-in Lead and recorded actor do not match the assignment | Lead Inspector / planning |
| WSA-005 | Blocking | Lead dataset omits canonical/materialized Audits and blocks routine coordination | Lead Assigned Audits / AUD-2026-001 / AUD-2026-009 |
| WSA-006 | High | Inspector can mutate Audits assigned to another Inspector | Inspector / AUD-2026-001 / AUD-2026-005 |
| WSA-007 | Medium | Potential Finding creation is mislabeled as a result action | Inspector checklist |
| WSA-008 | Medium | Observation conversion initially carries CAP/Evidence/Due Date defaults | Lead Potential Finding review |
| WSA-009 | High | The same accepted CAP has conflicting owner/status across roles | Inspector and Auditee / CAB-2026-012 |
| WSA-010 | High | Authorized closure is rendered as evidence-verified closure | Manager Finding detail / CAB-2026-013/014 |
| WSA-011 | Medium | Internal status keys leak into stakeholder UI | Preliminary Reports and planning history |
| WSA-013 | Medium | Inspector assignment search does not update results until unrelated rerender | Inspector My Assignments |
| WSA-014 | Medium | Checklist submission uses the wall-clock date instead of the demo date | Inspector checklist / AUD-2026-009 |

The screenshot initially named `WSA-012-materialized-audit-missing-coordination.png` is supporting evidence for WSA-005, not a separate finding. The apparent missing Auditee request and the missing Lead Audit are the same root-cause path.

## Detailed findings

### WSA-001 — High — Administration entry is a silent no-op

**Screen / role / Audit:** role selection / Administration / not applicable

**Precondition:** clean demo reset at the role-selection page.

**Reproduction:**

1. Click `Reset demo data`.
2. Click the visible `Administration` role card (`Open Administration`).
3. Observe the current page and browser console.

**Expected:** the Administration preview opens, or the card is visibly disabled with an explanation.

**Actual:** the page remains on `Choose your workspace`. No error, warning, toast, or console entry is produced.

**Risk:** one of the eight advertised roles is inaccessible and the failure is silent, undermining demo completeness and truthful controls.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-001-admin-access-noop.png`

**Source:** `AGENTS.md` Prototype Guidance; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` Admin IA; `STATUS_PERMISSION_SECURITY.md` Permissions; `BUILD_SUMMARY.md` Role-based experiences.

### WSA-002 — High — Planning displays approved preparation before approval

**Screen / role / Audit:** Planning command center / Department Manager, Finance, General Manager / `PLAN-2026-Q3-CABIN`

**Precondition:** clean demo reset; plan is awaiting Finance Review.

**Reproduction:**

1. Open Department Manager → `Planning` and select the Q3 Cabin Inspection plan.
2. Confirm the current owner is Finance Review and approval is incomplete.
3. Read `Preparation Detail`, `Preparation Status`, and the current preparation step.
4. Repeat while the plan is under Finance or GM review, and again after Finance returns it for revision.

**Expected:** preparation is not approved/released before Finance, GM, and ED approval plus GM release. A returned plan should show preparation not started or awaiting renewed approval.

**Actual:** the UI shows `Approved - Not Released` while the same dossier says `Awaiting Finance Review`, `Under GM Review`, or `Returned to Department Manager`, and explicitly says approval is incomplete.

**Risk:** managers may believe an unapproved or returned surveillance item is approved and ready for preparation. This is a material lifecycle/authority misrepresentation.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-002-003-planning-finance-contradiction-duplicate.png`

**Source:** `SURVEILLANCE_PLANNING_WORKFLOW.md` Steps and Rules; `MASTER_WORKFLOW.md` accepted inspection lifecycle and blocking rules; `STATUS_PERMISSION_SECURITY.md` Permissions.

### WSA-003 — Medium — Mobile decision summaries remain visible at desktop

**Screen / role / Audit:** Finance Review and Auditee CAP dossier; multiple records

**Precondition:** desktop viewport, clean relevant scenario.

**Reproduction:**

1. Open Finance Review for `PLAN-2026-Q3-CABIN` at desktop width.
2. Count visible `Approve Budget` actions.
3. Open Auditee CAP and select a finding requiring a response.
4. Count visible `Respond` actions.

**Expected:** one clear primary action per decision surface; mobile-only summaries hidden at desktop.

**Actual:** two visible `Approve Budget` buttons appear in Finance. Three visible `Respond` buttons appear for one Auditee Finding. The elements include a `mobile-decision-summary` action that has a non-zero desktop rectangle.

**Risk:** duplicated controls increase ambiguity, accidental repeat actions, and inconsistent keyboard/screen-reader navigation.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-002-003-planning-finance-contradiction-duplicate.png`

**Source:** `AGENTS.md` Prototype Guidance; `UX_PRINCIPLES.md`; `DEPARTMENT_MANAGER_WORKSPACES.md` Accessibility and Responsive Behavior.

### WSA-004 — High — Logged-in Lead and recorded actor do not match the assignment

**Screen / role / Audit:** Lead Inspector planning preparation / `PLAN-2026-Q3-CABIN`

**Precondition:** clean plan advanced through release and Department Manager Lead assignment.

**Reproduction:**

1. Assign `Caner Yildiz` as Lead Inspector.
2. Enter the Lead Inspector workspace.
3. Observe the logged-in identity `John Lead Inspector`.
4. Click `Continue plan preparation` and submit the team/date/resource proposal.
5. Inspect the preparation history.

**Expected:** only the assigned Lead can act, and the displayed/logged actor equals the authenticated actor.

**Actual:** `John Lead Inspector` can act on a task assigned to `Caner Yildiz`; history records the action as `Caner Yildiz · Lead Inspector`.

**Risk:** the demo attributes an action to a person who did not perform it, weakening authority boundaries and audit-trail credibility.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-004-lead-assignment-actor-mismatch.png`

**Source:** `STATUS_PERMISSION_SECURITY.md` Permissions and Security Rules; `CONCEPTUAL_DATA_MODEL.md` Critical modeling rules; `SURVEILLANCE_PLANNING_WORKFLOW.md` Rules.

### WSA-005 — Blocking — Lead dataset omits canonical/materialized Audits and blocks routine coordination

**Screen / role / Audit:** Lead Assigned Audits and Auditee Inspection Coordination / `AUD-2026-001`, `AUD-2026-009`

**Precondition:** clean demo. For the materialized variant, complete Finance → GM → ED → GM release → Department accept → Lead assignment → Lead proposal → Department confirmation.

**Reproduction:**

1. In a clean Lead workspace, search Assigned Audits for canonical `AUD-2026-001`.
2. Observe that the Lead table contains unrelated `AUD-2025-*` rows and not the canonical Audit.
3. From another clean start, complete the full planning and preparation chain.
4. Confirm the toast: `AUD-2026-009 created; Service Provider coordination is ready.`
5. Confirm Inspector My Assignments contains `AUD-2026-009` with `Start`.
6. Switch to Lead Inspector. Search the list, check notifications, and open `+ New Audit Assignment`.
7. Observe that no route exposes `AUD-2026-009` or the `Send Coordination Package` action.
8. Switch to Auditee → `Inspection Coordination`.

**Expected:** the assigned Lead can open the canonical/materialized Audit assignment workspace, release assignments, and send the routine coordination package. The Auditee can then confirm or propose an alternative date.

**Actual:** Lead Assigned Audits omits both the canonical Audit and the newly materialized Audit. No notification or alternate entry exposes it. Inspector sees `AUD-2026-009`, but Auditee Coordination remains empty because the Lead cannot send the package.

**Risk:** the core Manager Planning → Lead preparation → Inspector assignment → routine Auditee coordination path cannot complete. It also demonstrates parallel datasets for the same operational object.

**Evidence:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-005-lead-canonical-audit-missing.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-012-materialized-audit-missing-coordination.png`

**Source:** `SURVEILLANCE_PLANNING_WORKFLOW.md` Steps, Rules, UX notes; `AUDITEE_PORTAL.md` Inspection Coordination; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` Lead Inspector IA; `CONCEPTUAL_DATA_MODEL.md` Relationships and Critical modeling rules.

### WSA-006 — High — Inspector can mutate Audits assigned to another Inspector

**Screen / role / Audit:** Inspector Checklist Runner / `AUD-2026-001`, `AUD-2026-005`, and materialized `AUD-2026-009`

**Precondition:** clean Inspector workspace.

**Reproduction:**

1. Enter as `Ahmed Ali`.
2. Open `AUD-2026-001` and observe `Inspector scope: Aylin Sezer`, current owner Aylin, and question assignment `Unassigned`.
3. Change a result and click `Save Draft`.
4. Open `AUD-2026-005` and observe the same Aylin scope with enabled controls.

**Expected:** Ahmed can edit only questions assigned to Ahmed or a role-authorized shared scope. Other Inspectors' questions are read-only.

**Actual:** Ahmed can change results, save drafts, submit, and reopen packages whose displayed scope and owner are Aylin Sezer.

**Risk:** checklist evidence can be silently changed by the wrong Inspector; the visible assignment boundary is not enforced.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-006-inspector-assignment-owner-mismatch.png`

**Source:** `STATUS_PERMISSION_SECURITY.md` Permissions; `AUDIT_CHECKLIST_WORKFLOW.md` Rules; `CHECKLIST_BUILDER_AND_RUNNER.md` Business rules.

### WSA-007 — Medium — Potential Finding creation is mislabeled as a result action

**Screen / role / Audit:** Inspector Checklist Runner / `AUD-2026-001`

**Precondition:** PBE question has a Non-Compliant result and required comment.

**Reproduction:**

1. Open the PBE row action menu.
2. Inspect the visible commands.
3. Click `Mark Non-Compliant`.
4. Switch to Lead and observe `PF-2026-001`.

**Expected:** the workflow command is clearly labeled `Create Potential Finding` after the result is selected.

**Actual:** the menu only shows `Mark Observation` and `Mark Non-Compliant`; clicking the latter creates a Potential Finding as a hidden side effect.

**Risk:** users cannot predict that the action creates a separate review object, and may duplicate or omit Findings.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-007-potential-finding-mislabeled-action.png`

**Source:** `AUDIT_CHECKLIST_WORKFLOW.md` Steps; `SCREEN_INVENTORY_AND_FORMS.md` Lead Inspector Potential Finding review and Finding conversion form.

### WSA-008 — Medium — Observation conversion initially carries CAP/Evidence/Due Date defaults

**Screen / role / Audit:** Lead Potential Finding review / `PF-2026-001` from `AUD-2026-001`

**Precondition:** Inspector creates a Potential Finding from an Observation result.

**Reproduction:**

1. Open Lead Assigned Audits after the Observation Potential Finding is created.
2. Inspect the conversion controls before changing severity.

**Expected:** Observation defaults have CAP Required off, Evidence Required off, and no Due Date unless the Lead explicitly enables them.

**Actual:** severity is initially blank, but CAP Required and Evidence Required are checked and Due Date is `2026-07-15`. The values clear only after the Lead explicitly re-selects `Observation`.

**Risk:** an Observation can inherit non-observation obligations before the Lead notices or changes the severity control.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-008-observation-defaults-contradiction.png`

**Source:** `FINDING_CAP_EVIDENCE_WORKFLOW.md` Rules and UX notes; `SCREEN_INVENTORY_AND_FORMS.md` Potential Finding conversion form; `AGENTS.md` Product Rules.

### WSA-009 — High — The same accepted CAP has conflicting owner/status across roles

**Screen / role / Audit:** Inspector Findings and Auditee CAP / `CAB-2026-012`, `AUD-2026-001`

**Precondition:** clean seeded state; CAP is accepted and Evidence is still required.

**Reproduction:**

1. Enter Inspector → Findings and select `CAB-2026-012`.
2. Record status, current owner, and next action.
3. Without resetting, switch to Auditee → Corrective Actions and select the same Finding.
4. Record the same fields.

**Expected:** one canonical owner/status/next-action tuple. After CAP acceptance, the Finding remains open and the Auditee owns Evidence upload.

**Actual:** Inspector shows `Accepted`, owner `CAA Inspector`, next `Review CAP and evidence`; Auditee shows `CAP Accepted — Evidence Required`, owner `Auditee`, next `Upload evidence`.

**Risk:** dashboards and work queues can route the same Finding to different actors, causing missed or duplicated action.

**Evidence:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-009-inspector-accepted-cap-owner.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-009-auditee-accepted-cap-owner.png`

**Source:** `MASTER_WORKFLOW.md` Owner model and Next action model; `CONCEPTUAL_DATA_MODEL.md` Minimal Finding fields; `CAP_MANAGEMENT.md` Business rules.

### WSA-010 — High — Authorized closure is rendered as evidence-verified closure

**Screen / role / Audit:** Department Manager Finding detail / `CAB-2026-013`, `CAB-2026-014`

**Precondition:** clean Department Manager workspace.

**Reproduction:**

1. Open seeded closed Observation `CAB-2026-014`.
2. Observe the audit trail says `Finding closed (authorized closure - no CAP required)` and Evidence says no evidence uploaded.
3. Observe the top banner and lifecycle stepper.
4. Separately open `CAB-2026-013`, click `Authorized closure…`, verify a blank reason is blocked, enter a reason, and authorize closure.
5. Recheck the banner, stepper, Evidence section, and audit trail.

**Expected:** the reason-required authorized path is clearly distinct from evidence verification. CAP/Evidence stages that did not occur are not marked complete.

**Actual:** the reason gate and authorized audit-log entry work, but the resulting banner says closure occurred `after evidence acceptance`; the stepper marks CAP submitted, CAP accepted, Evidence submitted, and Evidence verified even though no evidence exists and the CAP is Not Required/Not Submitted.

**Risk:** the record falsely represents the factual basis for closure, which is especially serious for an audit/oversight workbench.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-010-authorized-closure-shown-as-evidence-verified.png`

**Source:** `MASTER_WORKFLOW.md` Finding lifecycle and Hard rule; `FINDING_CAP_EVIDENCE_WORKFLOW.md` Rules; `CONCEPTUAL_DATA_MODEL.md` Critical modeling rules; `AGENTS.md` Product Rules.

### WSA-011 — Medium — Internal status keys leak into stakeholder UI

**Screen / role / Audit:** Lead Preliminary Reports and planning histories / `PR-2026-018`, `PLAN-2026-Q3-CABIN`

**Precondition:** return a Preliminary Report to Lead; separately progress or return a plan.

**Reproduction:**

1. As Department Manager, return `PR-2026-018` with a required comment.
2. Switch to Lead → Preliminary Reports.
3. Observe the Status cell and category counters.
4. Inspect planning preparation history after release, acceptance, assignment, proposal, and materialization.

**Expected:** human-readable lifecycle labels such as `Returned to Lead Inspector`, `Released to Department`, and `Lead Inspector Assigned`.

**Actual:** the report row shows raw `returned_to_lead`, and the report is omitted from Draft/In Review/Approved/Released counters. Planning history exposes raw keys including `released_to_department`, `accepted_by_department`, `lead_inspector_assigned`, `team_schedule_proposed`, and `ready_for_execution`.

**Risk:** stakeholder-facing status semantics become unclear and counters do not reconcile with the visible rows.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-011-preliminary-raw-return-status.png`

**Source:** `MASTER_WORKFLOW.md` accepted lifecycle language; `SURVEILLANCE_PLANNING_WORKFLOW.md` UX notes; `DEPARTMENT_MANAGER_WORKSPACES.md` Interaction and Error States.

### WSA-013 — Medium — Inspector assignment search does not update results until unrelated rerender

**Screen / role / Audit:** Inspector My Assignments / all assignments

**Precondition:** Inspector assignment list is visible.

**Reproduction:**

1. Type `ZZZ-NO-MATCH` in `Search audits...`.
2. Press Enter and wait.
3. Observe that the full list can remain visible.
4. Navigate away and back; now `No assignments match these filters` appears.
5. Clear the input and blur it; the empty field can still show no assignments.
6. Navigate away and back again; the list finally returns.

**Expected:** results update immediately and remain synchronized with the visible query.

**Actual:** the input persists the query but does not render results on input. An unrelated navigation/rerender applies it later, producing stale list/query combinations.

**Risk:** an Inspector may believe assignments do not exist or that the displayed list matches a query when it does not.

**Evidence:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-013-inspector-search-does-not-filter.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-013-inspector-search-stale-results.png`

**Source:** `AGENTS.md` Prototype Guidance; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` Inspector IA; `UX_PRINCIPLES.md`.

### WSA-014 — Medium — Checklist submission uses the wall-clock date instead of the demo date

**Screen / role / Audit:** Inspector Checklist Runner / `AUD-2026-009`

**Precondition:** materialize `AUD-2026-009`, complete all six questions, and submit.

**Reproduction:**

1. Complete all checklist sections through UI selections.
2. Click `Submit to Lead Inspector`.
3. Read `Submitted On` in the submission confirmation.
4. Compare with the demo date used by reminders, approvals, Due Soon calculations, and audit histories.

**Expected:** deterministic demo timestamps use the configured demo date (`15 Jun 2026`) or consistently label real wall-clock time.

**Actual:** the submission modal records `2026-07-20T01:51:15.097Z` while the surrounding lifecycle continues to record `15 Jun 2026`.

**Risk:** ordering, ageing, due-date language, and audit history become internally inconsistent and non-reproducible.

**Evidence:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-014-checklist-real-date-vs-demo-date.png`

**Source:** `BROWSER_SCENARIO_INTEGRITY_2026-07-20.md` deterministic scenario evidence; `REMINDERS_AND_ESCALATION_WORKFLOW.md` Rules; `CONCEPTUAL_DATA_MODEL.md` Critical modeling rules.

## Coverage matrix

Counts below are discrete scenario/transition checks, not click counts.

| Area | Checks | Result | Evidence summary |
|---|---:|---|---|
| Eight role entries and navigation boundaries | 8 | 7 PASS, 1 FAIL | Inspector, Lead, Department Manager, GM, Finance, ED, Auditee passed; Administration WSA-001 |
| Finance → GM → ED → GM release chain | 1 | PASS | ED approval did not itself release; GM release remained required |
| Finance return → Department revision/resubmit | 1 | PASS | reason required; owner returned to Department Manager; resubmission restored Finance queue |
| Department accept → Lead assign → Lead proposal → materialization | 1 | PASS with findings | `AUD-2026-009` created; WSA-002/004 affect semantics and attribution |
| Routine announced coordination | 1 | `blocked` | WSA-005 prevents Lead notification and Auditee response |
| Ad Hoc / Unannounced visibility | 2 | PASS | Inspector can access Security Audit; Auditee is not informed in advance |
| Checklist package identity (Cabin, Security, materialized Cabin) | 3 | PASS | correct organization/package/question sets opened from each Inspector row |
| Save Draft, submit/read-only, reopen-with-reason | 3 | PASS with finding | answers persisted; reopen reason required; WSA-014 timestamp inconsistency |
| Same question isolated across `AUD-2026-001` and `AUD-2026-009` | 1 | PASS | one Audit remained `na`; materialized Audit retained `compliant` |
| Inspector assignment/owner enforcement | 2 | FAIL | WSA-006 |
| Explicitly disabled/template-only assignment controls | 4 | PASS | template preview/report unavailable controls were visibly disabled or labeled |
| Inspector assignment search | 1 | FAIL | WSA-013 |
| Non-Compliant comment requirement | 1 | PASS | blank exception comment blocked creation |
| Potential Finding convert / return / dismiss | 3 | PASS with finding | severity/reasons required; WSA-007 label issue |
| Finding severity and Observation defaults | 2 | 1 PASS, 1 FAIL | Non-Compliant severity required; Observation defaults WSA-008 |
| Potential Finding action label | 1 | FAIL | WSA-007 |
| Auditee CAP submit and revision | 2 | PASS | required root/corrective/preventive fields and return comment enforced |
| Inspector CAP accept without Finding closure | 1 | PASS | Auditee correctly received Evidence-required state |
| Cross-role owner/status consistency | 1 | FAIL | WSA-009 |
| Evidence v1/v2 append-only history | 2 | PASS | v1 retained after Not Close and v2 submission |
| Not Close / Partially Close / Close | 3 | PASS | both CAA-visible comment and Internal CAA Note required; closure only on Close |
| Authorized closure reason gate | 1 | PASS | blank reason blocked; audit-log entry recorded |
| Authorized vs evidence-verified display | 1 | FAIL | WSA-010 |
| Internal CAA Note privacy | 1 | PASS | Auditee saw CAA-visible comment, not internal note |
| Reminder/escalation history | 1 | PASS | `demo_recorded`, `in_app`, no real delivery |
| Preliminary Report DM → GM → ED → Auditee | 4 | PASS | issue only at ED; Auditee visibility began after issue |
| Preliminary return and Lead resubmit | 2 | 1 PASS, 1 FAIL | resubmit worked; raw status/counter WSA-011 |
| Final Report DM → GM → ED → Auditee | 4 | PASS | ED issue disabled terminal actions; open Findings remained open |
| Report organization privacy | 2 | PASS | Fly Namibia portal excluded SkyCargo/BlueWing reports and internal notes |
| Auditee route privacy sweep | 7 | PASS | Coordination, CAP, Preliminary, Final, Messages, Documents, Settings |
| 390×844 responsive checklist and navigation | 2 | PASS with finding | no horizontal overflow; drawer route worked; duplicate actions covered by WSA-003 |
| Final console check | 1 | PASS | zero entries |
| **Total** | **70** | **60 PASS, 9 FAIL, 1 blocked** | `verified locally` |

## Important passing lifecycle evidence

- CAP acceptance did not close the Finding. The Auditee was instructed to upload Evidence.
- Evidence v1 was returned with `Not Close`; v1 remained preserved when v2 was uploaded.
- `Partially Close` kept the Finding open; `Close` closed only after Evidence verification.
- Authorized closure required a reason and recorded the Department Manager actor and reason in audit history.
- Auditee never saw the Internal CAA Note used during Evidence review.
- Preliminary and Final Reports followed Department Manager → General Manager → Executive Director. Only Executive Director issue made them visible to the Auditee.
- Final Report issue did not close open Findings.
- Manual reminder history used `demo_recorded` / `in_app` and explicitly stated there was no real delivery.
- At 390×844, the tested checklist and Findings routes had no horizontal overflow and the navigation drawer changed routes successfully.

## `not run` and `blocked`

### `blocked`

- Administration scenario: blocked after the role card silently did nothing (WSA-001).
- Lead assignment/coordination for canonical and materialized Audits: blocked because the Lead workspace cannot expose `AUD-2026-001` or `AUD-2026-009` (WSA-005).
- Routine Auditee `Confirm Proposed Date` and `Propose Alternative Date`: blocked downstream of WSA-005; no request becomes visible.

### `not run`

- Deep execution of rows explicitly labeled `Template preview only` or `Report preview unavailable`; their truthful disabled state was checked instead.
- Creation of a brand-new Final Report from `Ready for Preparation`; clean seed data exposes Final Reports already in approval states. Department Manager → GM → ED → Auditee was run fully.
- Every viewport and every page at every breakpoint; the key checklist and Findings routes were checked at 390×844 and desktop.
- Verification of downloaded archive/PDF file bytes after the visible report download action.
- Real authentication, backend persistence, database, real file upload/storage, email/SMS/WhatsApp, external notifications, secure document repository, or production audit log. These are intentionally outside the demo boundary.
- Real regulatory source validation or legal interpretation.

## Console and cleanup

- Final console: `verified locally`; zero entries in `final-console.json`.
- Localhost server: stopped with exit code 0.
- Browser: viewport override reset and all in-app tabs finalized.
- Process hygiene: no task server, Playwright, Puppeteer, webdriver, HeadlessChrome, or remote-debugging Chrome process remained after cleanup; the process-check command only matched itself.

## Audit boundary

This report records observed behavior only. It does not implement a fix, recommend a remediation sequence, update existing plans, or claim `production-ready` status. The results are suitable as input to a later remediation plan.
