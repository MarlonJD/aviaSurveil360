# Premium UI Remediation Plan

Date: 2026-07-08
Status: ready-for-verification
Owner: Codex
Related audit: `2026-07-08-ui-self-critique-audit.md`

## Objective

Elevate the AviaSurveil360 frontend-only demo from a mostly table-first
prototype into a premium, role-specific civil aviation authority workbench where
the user's next action is visible, understandable, and supported by the screen's
structure. The redesign must preserve the demo boundary and the existing
Finding -> CAP -> Evidence -> CAA Review -> Closure product rules.

## Scope

In scope:

- Visual and interaction remediation for captured demo screens across manager,
  inspector, auditee, admin, lead inspector, and governance roles.
- Dossier-first layouts for decision/review/editor surfaces.
- Queue layouts only where the screen's main job is truly triage or discovery.
- Shared premium workbench patterns for command headers, lifecycle rails,
  regulatory trace, decision bars, and configuration studios.
- Responsive verification at desktop, tablet, and mobile viewports.
- Nested overflow/clipping detection for internal cards, tabs, metadata, action
  columns, and topbar actions.
- Documentation updates for audit findings, plan state, and verification.

Out of scope:

- Backend, database, API, real authentication, real authorization enforcement,
  real file upload/storage, real AI service, real regulatory ingestion, real
  notification service, production audit log, mobile/offline app, e-signature,
  or framework migration.
- Binding legal/regulatory claims.
- Git branch creation, commit, push, deployment, or PR creation unless the user
  explicitly asks.
- Replacing the static HTML/CSS/Vanilla JS architecture.

## Assumptions

- The current local working tree includes the Findings dossier redesign and
  right-panel overflow fixes. Those changes are treated as the baseline for this
  plan.
- The user wants a plan first: identify issues, then remediate in controlled
  phases rather than making broad visual edits immediately.
- "Fancy premium" means refined, operational, designed, and domain-specific. It
  does not mean decorative gradients, marketing hero sections, or generic card
  walls.
- Screenshots under `/private/tmp/aviasurveil360-ui-audit-2026-07-08/` are
  temporary local evidence for this audit run.

## Creative Classification

| Surface Family | Product Shape | Signature Element |
|---|---|---|
| Manager dashboard / Safety Intelligence / Org Risk | governance + investigation | Oversight command strip with risk drivers and recommended management action |
| Inspector assignments / audit queue | queue + workbench | Today's next task dossier with owner, due date, progress, and primary action |
| Findings / CAP / Evidence review | dossier + decision | Finding lifecycle rail and CAP/evidence decision bar |
| Checklist runner / assignment questions | editor | Active question dossier with answer controls, expected evidence, and regulatory trace |
| Auditee portal | request center | Required Now / Waiting CAA / Closed grouping with plain-language next action |
| Planning / reports / approvals | governance | Approval path with current owner, blocking reason, and decision controls |
| Admin configuration | configuration studio | Selected template/question/rule preview with version and regulatory reference context |
| Communication / messages | communication | Selected thread with reply/action affordance |

## Findings To Fix

Blocking first:

- Fix Manager Safety Intelligence desktop internal clipping where the action
  column is partially hidden inside the table container.
- Fix Lead CAP Review Detail topbar collision where `Actions` overlaps the bell
  notification area.
- Generalize the Findings dossier fix so selected work is never demoted to a
  cramped rail on decision screens.

High-priority UX:

- Rebuild Auditee My CAPs around what the CAA currently needs from the service
  provider.
- Convert Inspector My Assignments into a daily workbench, not only a large
  table.
- Convert Checklist Runner active question into the primary interaction surface.
- Align governance approval pages around one approval decision pattern.
- Replace admin role-mismatched reports and generic config tables with
  configuration/report catalog patterns.

## Phases

### Phase 0 - Freeze Evidence And QA Gates

- Keep the screenshot capture script and screenshot index in `/private/tmp` for
  this audit run.
- Add or update a reusable local QA script that checks nested clipping/overlap
  for:
  - topbar action groups
  - tab bars
  - metadata cards
  - table action columns
  - queue/dossier layouts
  - mobile shell controls
- Define acceptance thresholds for desktop, tablet, and mobile:
  - no document-level overflow
  - no internal action clipping
  - no badge/button overlap
  - primary action visible in the first viewport for decision screens
  - selected record larger than supporting queue on desktop dossier screens

### Phase 1 - Shared Premium Workbench Patterns

- Implement or consolidate CSS/HTML primitives for:
  - command header
  - dossier layout
  - lifecycle rail
  - regulatory trace block
  - decision bar
  - selected queue item
  - configuration studio
  - report/approval package
- Keep styling restrained and civil-authority appropriate:
  - controlled blue/green/amber/red semantics
  - stronger hierarchy through layout, spacing, and selected surfaces
  - no decorative orbs, hero gradients, or generic marketing composition

### Phase 2 - Blocking Visual Defects

- Safety Intelligence: remove the desktop table action clipping by changing the
  management signal table into a risk-signal dossier or by making the action
  column structurally contained.
- Lead CAP Review Detail: make topbar actions and notification/profile controls
  collision-proof.
- Add focused screenshot assertions for both defects.

### Phase 3 - Operational Role Surfaces

- Inspector My Assignments:
  - add a "Next Inspection / Continue Work" dossier above or beside the queue
  - make the queue secondary but still scannable
  - ensure Start/Continue/View Report actions are first-viewport visible
- Checklist Runner:
  - promote active question, answer controls, comment, finding creation, and
    expected evidence into the main interaction panel
  - keep question list as navigation
- Inspector Findings:
  - preserve current local dossier-first improvement
  - add parity for CAP and conversation tabs

### Phase 4 - Auditee Request Center

- Reframe Auditee My CAPs around:
  - Required Now
  - Waiting CAA Review
  - Returned / More Information Requested
  - Closed / Archive
- Show plain-language action copy:
  - Submit CAP
  - Upload Evidence
  - Respond to CAA
  - View Report
- Remove confusing zero counters when the list still contains visible work
  items.

### Phase 5 - Manager And Governance Surfaces

- Manager dashboard:
  - build a management attention command area
  - keep table rows for triage, but make risk drivers and next action more
    prominent
- Safety Intelligence:
  - turn rows into signal dossiers with recommended action and linked profile
- Organization Risk Profile:
  - improve risk driver cards and right-side context facts
- Planning/report approvals:
  - unify current owner, next action, approval path, decision controls, and
    blocker reason across manager, GM, finance, and executive views.

### Phase 6 - Admin Configuration Studio

- Question Bank:
  - left: searchable question list
  - right: selected question editor/preview
  - inline regulatory reference and expected evidence preview
- Templates and Checklist Versions:
  - template/version timeline and active published version
- Reports:
  - replace role-mismatched closure report reuse or remove this nav item for
    Admin Preview.
- Users / Settings / Organizations / Audit Log:
  - add selected record detail or event drawer without overbuilding production
    admin behavior.

### Phase 7 - Final Visual QA

- Capture all 55 routes at desktop, tablet, and mobile again.
- Inspect contact sheets and selected full screenshots.
- Run all Node smoke tests.
- Run `git diff --check` and `node --check js/views.js`.
- Record evidence using literal status labels:
  - `verified locally`
  - `not run`
  - `release pending`

## Verification

Required local checks:

```bash
git diff --check
node --check js/views.js
for f in tests/*.test.js; do node "$f" || exit 1; done
```

Required rendered checks:

- Re-run screenshot capture for all planned routes at desktop, tablet, and
  mobile.
- Re-run nested clipping/overlap guards.
- Manually inspect contact sheets plus full-size screenshots for all changed
  high-priority surfaces.
- Verify no backend, database, API, auth, upload, email, real notification, real
  regulatory ingestion, production audit log, or framework migration was added.

## Implementation Evidence - 2026-07-08

- `verified locally`: Blocking visual defects remediated for Safety
  Intelligence internal action clipping, Lead CAP Review topbar overlap, and
  decision/editor/admin screens where selected work was cramped into rails.
- `verified locally`: Shared premium workbench patterns added for command
  headers, dossier layouts, regulatory trace blocks, decision bars, auditee
  request center, governance approval packages, and admin configuration studio.
- `verified locally`: `git diff --check`, `node --check js/views.js`, and
  `for f in tests/*.test.js; do node "$f" || exit 1; done` pass.
- `verified locally`: Full screenshot capture completed for 55 routes across
  desktop, tablet, and mobile viewports; local evidence is under
  `/private/tmp/aviasurveil360-premium-ui-remediation-2026-07-08/` with 165
  screenshots, 0 capture errors, 0 console issues, 0 document overflow issues,
  0 clipping issues, and 0 overlap issues.
- `verified locally`: Targeted Playwright interaction proof passed for Manager
  Safety Intelligence -> Organization Risk Profile navigation, with no console
  issues.
- `release pending`: Stakeholder review/sign-off is still required before
  moving this plan to `completed/`.
- `not run`: Production, release, deployment, backend, database, API, real auth,
  real upload/storage, real notification, real AI, real regulatory ingestion,
  and production audit-log checks remain out of scope for this frontend-only
  demo task.

## Risks

- A broad visual pass can accidentally weaken existing demo behavior. Keep each
  phase focused and rerun smoke tests after meaningful route or action changes.
- Premium polish can become decorative. Every visual improvement must support
  the screen's single job.
- Role-specific redesign may expose stale shared views that were reused across
  roles. Treat role mismatch as a product problem, not only styling.
- Screenshot evidence under `/private/tmp` is temporary; durable findings are
  captured in this plan and the audit file.

## Dependencies

- Existing static demo architecture: `index.html`, `css/styles.css`, `js/*.js`.
- Product guidance in `AGENTS.md`, `docs/product-specs/ux-plan/`, and workflow
  docs.
- Current Node smoke tests under `tests/`.
- Local Playwright or Browser path for rendered verification.

## Ownership Boundaries

- Codex may implement static demo UI/CSS/JS and update docs/plans.
- Codex must not create branches, commit, push, deploy, or open PRs unless the
  user explicitly requests that action.
- Codex must not claim production readiness or regulatory completeness.
- Stakeholder review decides whether premium visual direction is acceptable
  before moving the plan to completed.

## Explicit Out Of Scope

- Production architecture.
- Authentication/authorization.
- Database or API design.
- Real uploads or evidence storage.
- Real notifications.
- Real AI or regulatory ingestion.
- Legal/regulatory determinations.
- Deployment or release unless explicitly requested.

## Execution Prompt

```text
Implement the AviaSurveil360 Premium UI Remediation Plan from docs/exec-plans/active/2026-07-08-premium-ui-remediation-plan.md. Use docs/exec-plans/active/2026-07-08-ui-self-critique-audit.md as the issue ledger. Keep the frontend-only static HTML/CSS/Vanilla JS demo boundary. Do not add backend, database, API, real auth, real upload/storage, real AI, real regulatory ingestion, real notifications, production audit log, framework migration, branch operations, commit, push, or deploy unless explicitly requested. Apply ui-self-critique before and after each major surface family. Prioritize blocking visual defects first: Safety Intelligence internal action clipping, Lead CAP Review topbar overlap, and decision screens where selected work is cramped into rails. Then implement shared premium workbench patterns for command headers, dossier layouts, lifecycle rails, regulatory trace blocks, decision bars, auditee request center, governance approval packages, and admin configuration studio. Verify with git diff --check, node --check js/views.js, all tests/*.test.js, full desktop/tablet/mobile screenshot capture, nested clipping/overlap guards, and visual inspection. Update docs/exec-plans/index.md and report evidence with literal status labels such as verified locally, not run, and release pending.
```
