# UI Self-Critique Audit - Screenshot Review

Date: 2026-07-08
Status: audit captured, issues recorded
Owner: Codex
Related plan: `2026-07-08-premium-ui-remediation-plan.md`

## Objective

Review AviaSurveil360's rendered demo screens with the `ui-self-critique`
method: each screen should make the next user action visible, understandable,
and role-specific. The target is not decorative polish alone; the target is a
premium civil aviation authority workbench that feels intentionally designed
around inspection, finding, CAP, evidence, approval, and oversight decisions.

## Evidence Package

Screenshot capture ran against the local static demo after the current local UX
changes in `css/styles.css`, `js/views.js`, and `tests/inspector-nav-smoke.test.js`.

- URL: `http://127.0.0.1:4173/index.html`
- Capture tool: regular Playwright batch fallback
- Browser plugin path: attempted first, but the in-app Browser interaction path
  failed with an internal `incrementalAriaSnapshot` API error after documented
  setup and troubleshooting review.
- Routes captured: 55
- Viewports captured: desktop `1440x900`, tablet `1024x768`, mobile `390x844`
- Screenshots captured: 165
- Capture errors: 0
- Console warnings/errors: 0
- Page-level horizontal overflow: 0
- Screenshot index: `/private/tmp/aviasurveil360-ui-audit-2026-07-08/screenshot-index.json`
- Screenshot directory: `/private/tmp/aviasurveil360-ui-audit-2026-07-08/screenshots/`
- Contact sheets:
  - `/private/tmp/aviasurveil360-ui-audit-2026-07-08/contact-sheets/desktop-1440.jpg`
  - `/private/tmp/aviasurveil360-ui-audit-2026-07-08/contact-sheets/tablet-1024.jpg`
  - `/private/tmp/aviasurveil360-ui-audit-2026-07-08/contact-sheets/mobile-390.jpg`

## Audit Criteria

- One screen, one main job.
- Current owner, next action, due date, status, and primary action visible near
  the top for operational records.
- The selected item or task should occupy the user's attention; supporting
  queues should not dominate the screen.
- The product shape should be explicit: queue, dossier, investigation, editor,
  reconciliation, governance, discovery, communication, or security surface.
- One AviaSurveil360-specific signature element should carry the screen:
  lifecycle rail, regulatory trace, risk driver panel, CAP/evidence dossier,
  approval path, or audit package builder.
- Generic SaaS card/table layouts are acceptable only when the screen's job is
  genuinely a queue; decision screens need a dossier/editor/investigation
  structure.
- QA must look for nested clipping and overlap, not only document-level
  horizontal overflow.

## Top Findings

| Priority | Surface | Issue | Evidence | Recommendation |
|---|---|---|---|---|
| Blocking | Manager Safety Intelligence | Desktop table has an internal action-column clipping defect: a blue action button appears as a partial sliver at the right edge even though page-level overflow is false. | `desktop-1440__manager-safety-intelligence.png` | Replace the desktop table with a signal dossier layout or add a reviewed nested overflow guard for action cells. |
| Blocking | Lead CAP Review Detail | Top-right `Actions` button overlaps the notification/bell area. | `desktop-1440__lead-cap-review-detail.png` | Fix topbar action layout with constrained action groups and collision tests. |
| Blocking | Findings and other decision screens | Previous right-rail issue proved a structural problem: selected work can be demoted to a narrow preview. The new local Findings dossier improves this, but the pattern is not generalized. | `desktop-1440__inspector-findings.png`; prior live screenshot | Define a shared dossier-first pattern for finding, CAP, evidence, checklist question, approval, and report review screens. |
| High | Auditee My CAPs | The heading says "what the CAA needs", but counters show 0 required actions while the list contains CAP/evidence rows. This weakens the user's understanding of what is needed now. | `desktop-1440__auditee-my-caps.png` | Make the auditee request center action-state driven: Required Now, Waiting CAA, Closed/Archive. |
| High | Admin Reports | Admin context reuses closure-report rows and CAP/evidence child rows, which feels role-mismatched and generic. | `desktop-1440__admin-reports.png`; `mobile-390__admin-reports.png` | Redesign Admin Reports as report catalog/configuration or hide if not meaningful for Admin Preview. |
| High | Inspector My Assignments | The table is readable but the first viewport is a filter/table surface, not a daily workbench that answers "what should I do next?" | `desktop-1440__inspector-assignments.png` | Promote one selected assignment or "today's next task" dossier before the queue. |
| High | Checklist Runner | The active question panel exists, but the table still dominates; the answer controls feel like a side rail rather than the main inspection action. | `desktop-1440__inspector-checklist-runner.png` | Convert active question to a larger question dossier with answer controls, expected evidence, regulatory trace, and finding creation path in the primary column. |
| High | Manager dashboards | Several manager screens use badges and tables effectively but lack a premium "oversight command" signature. | `desktop-1440__manager-dashboard.png`, `desktop-1440__manager-safety-intelligence.png` | Add a focused risk/attention command strip with clear recommended action and linked evidence. |
| High | Governance approval pages | Planning and audit-report approvals are functional, but many pages are dense and visually similar. | `desktop-1440__manager-planning.png`, `desktop-1440__executive-planning.png`, `desktop-1440__gm-audit-reports.png` | Apply one governance approval pattern: approval path, current owner, blocking reason, decision controls. |
| Medium | Admin configuration pages | Question Bank, templates, users, settings, organizations, audit log are mostly plain tables/forms. | Admin screenshots across all viewports | Create a configuration studio pattern with selected item preview, reference/evidence preview, and publish/version status. |
| Medium | Mobile topbar | Mobile screenshots show role dropdown/header controls consume first-row space and sometimes truncate labels such as "Department Manage". | mobile contact sheet | Compact mobile shell with role chip/menu behavior and stable header sizes. |
| Medium | V2 advanced screens | Package Builder, Offline Field, AI Assistant, USOAP, SSP/NASP have useful content but inconsistent signature elements and visual hierarchy. | manager V2 screenshots | Normalize advanced surfaces around specific signatures: package scope builder, offline outbox, AI draft review, PQ readiness, SSP indicator review. |
| Medium | Visual system | UI is restrained and readable but often feels like a white-table admin template. | full screenshot set | Introduce premium workbench details: stronger selected-state surfaces, denser but calmer tokens, aviation-specific lifecycle/risk traces, better section rhythm. |

## Screen-By-Screen Notes

| Screen | Product Shape | Single Job | Current Assessment | Main Remediation |
|---|---|---|---|---|
| Role Switch / Login Demo | discovery | Choose demo role | Clear and usable. Could feel more branded and less modal-card-like. | Add role story headers and product scenario preview without adding marketing noise. |
| Manager Dashboard | governance / queue | Show exposure and delay | Actionable table, but generic dashboard composition. | Build a management attention command strip with risk drivers and recommended next action. |
| Planning Workspace | governance | Approve/release/prepare audit plan | Improved; selected plan and next action are visible. | Premium pass on approval path rhythm and decision controls. |
| Checklist Approvals | governance | Approve or return checklist version | Functional, but still table/dossier mixed without strong design signature. | Use version approval dossier with change summary and publish risk. |
| Question Bank | editor | Configure reusable questions | Plain form and table; low premium feel. | Turn into question configuration studio with selected question preview and regulatory/evidence trace. |
| Checklist Builder | editor | Build checklist template | Useful but generic; builder state could be more visual. | Add template outline, section builder, and selected question details. |
| Checklist Version History | governance | Inspect version lineage | Reads like a plain table. | Add version timeline and current active/published comparison. |
| Audit Reports Approval | governance | Review report state | Dense and approval-heavy; similar to planning. | Use report approval path with current blocker and decision controls. |
| Safety Intelligence Dashboard | investigation / governance | Decide which risk needs attention | Good intent, but desktop action clipping is a blocking UI defect. | Replace table with risk signal dossier cards or fix table action containment. |
| SSP/NASP Dashboard | governance | Monitor SSP/NASP indicators | Looks report-like rather than decision-oriented. | Add indicator review strip with target variance and owner. |
| Audit Work Queue | queue | Open audit work needing action | Functional. | Keep queue, but give row actions and priority rail premium polish. |
| Organizations | discovery / registry | Find organization | Plain registry table. | Add organization health preview and current oversight state. |
| Organization Risk Profile | investigation | Explain organization risk | One of the stronger surfaces; risk score and regulatory trace are product-specific. | Improve right-side drivers into concise risk driver cards. |
| Manager Open Findings | queue | Triage findings | Clear table but pattern repeats. | Keep as queue; add selected finding quick preview or next-action command strip. |
| Department Manager CAP Reviews | governance | Approve CAP/review outcome | Focused but dense; needs clearer decision hierarchy. | Approval dossier pattern with decision bar. |
| CAP Effectiveness | reconciliation | Review repeated findings/effectiveness | Useful but flat. | Add CAP recurrence map and post-closure review status. |
| USOAP Readiness | governance | Review PQ readiness | Mock score/table feels generic. | Add PQ readiness dossier with evidence gaps and owner. |
| Inspection Package Builder | editor | Assemble inspection package | Strong potential; current layout too document-like. | Make package scope, checklist, references, and output preview more explicit. |
| Offline Field Inspection | editor / field capture | Save mock offline evidence | Clear demo guardrail. | Make outbox and sync state the signature element. |
| AI Inspector Assistant | editor / review | Review AI draft | Guardrails visible but page is basic. | Add draft review compare panel and authorized-decision affordances. |
| Inspector My Assignments | queue | Choose next assigned inspection | Readable, but not enough "today's workbench". | Promote next task dossier above queue or split queue/detail. |
| Inspector Findings Dossier | dossier | Review selected finding/CAP/evidence | Current local redesign fixes the prior narrow rail problem. | Generalize dossier-first pattern and keep verifying nested overflow. |
| Inspector Calendar / Audit Queue | queue | Open scheduled audit work | Functional and clear. | Add route/date context and selected audit preview. |
| Audit Detail | dossier | Continue audit execution | Clearer than many screens; strong operational context. | Refine as audit mission control with progress/next section. |
| Checklist Runner | editor | Answer selected checklist question | Active action exists but side panel is still secondary. | Make active question/action the main column. |
| Inspector Reports | queue | View reports | Sparse and generic. | Add report preview/status context or collapse if secondary. |
| Inspector Messages | communication | Read CAA messages | Too sparse, little thread affordance. | Add selected thread panel and action/reply affordance. |
| Auditee Received Reports | dossier | Review received final report | Decent report package view. | Clarify report acknowledgement/download action. |
| Auditee My CAPs | queue / request center | Understand what CAA needs now | Counters conflict with list state; current need is unclear. | Rebuild around Required Now, Waiting CAA, Closed. |
| Auditee Communications | communication | Read/respond to CAA | Sparse. | Add selected thread/reply panel. |
| Auditee Documents | queue | Review shared documents | Report table reused; acceptable but not special. | Add document package cards by finding/audit. |
| Auditee Settings | configuration | Manage portal settings | Basic admin form. | Keep simple; polish spacing and mobile header. |
| Admin Regulatory Library | discovery / governance | Inspect mock regulatory references | Content useful, layout generic. | Add clause/reference preview and applicability map. |
| Admin Templates | registry | Choose template | Plain table. | Add template health/version preview. |
| Admin Template Preview | dossier | Inspect checklist template | Reasonable, but dense. | Add section navigation and active question preview. |
| Admin Question Bank | editor | Manage question bank | Plain form/table. | Configuration studio pattern. |
| Admin Checklist Versions | governance | Review version history | Plain table. | Version timeline and diff preview. |
| Admin Reports | role mismatch | Admin reports view | Role-mismatched closure report reuse. | Replace or hide for Admin Preview. |
| Admin Users / Roles | configuration | Manage demo roles | Plain table. | Add role matrix and permission preview. |
| Admin Settings | configuration | Configure rules | Basic cards. | Add settings categories and dependency warnings. |
| Admin Organizations | registry | Manage master data | Plain registry. | Add org type/status health preview. |
| Admin Audit Log | security / governance | Inspect audit events | Functional table. | Add event detail drawer and actor/action filters. |
| Lead Assigned Audits | queue | Choose audit to lead | Clear but table-first. | Add lead workload command strip. |
| Lead Preliminary Reports | queue | Review preliminary reports | Metrics and table useful. | Add selected report preview. |
| Lead Final Reports | queue | Review final reports | Similar to preliminary; generic. | Shared report queue/detail pattern. |
| Lead Assignment Workspace | governance / editor | Approve assignment package | Stronger than average. | Improve approval path visualization. |
| Lead Assignment Questions | editor | Assign checklist questions | Good operational content, but dense. | Keep selected-question workbench pattern. |
| Lead CAP Review Detail | dossier / decision | Make lead CAP decision | Strong structure, but topbar action overlap is blocking. | Fix header collision and clarify decision bar. |
| Lead Final Report Prepare | editor | Prepare final report content | Functional but form-heavy. | Add report section navigator and completion rail. |
| Lead Final Report View | dossier | Inspect final report | Good report outline. | Add approval state and key findings summary. |
| GM Planning Approval | governance | Approve/release planning | Same planning pattern, acceptable. | Premium approval pattern. |
| GM Audit Reports | governance | Approve audit reports | Dense. | Report approval dossier. |
| Finance Planning Review | governance | Review budget/resource | Same planning screen, but finance-specific decision weak. | Add budget/resource justification panel. |
| Executive Director Planning | governance | Final planning approval | Same planning screen, executive decision context weak. | Executive approval summary with risks and requested decision. |
| Executive Director Audit Reports | governance | Final report approval | Dense and not executive-summary-first. | Executive report approval package. |

## Cross-Cutting Problems

1. Nested overflow and clipping are not sufficiently guarded. Page-level
   overflow can be clean while buttons, metadata, or table action columns are
   clipped inside containers.
2. Many pages reuse the same table-first shell even when the user's job is a
   decision, review, or editor task.
3. Demo guardrail chips are useful but visually repetitive; they can overpower
   the operational task.
4. The premium feel is inconsistent. Some screens have product-specific
   patterns, but many still read as generic admin tables.
5. Mobile is mostly overflow-safe, but the mobile shell and long stacked cards
   need stronger information hierarchy.
6. Role-specific meaning is diluted where one generic view is reused across
   manager, admin, auditee, and governance roles.

## Recommended Pattern Library

- `Command Header`: current owner, next action, due date/target, blocking reason,
  primary action.
- `Dossier Layout`: supporting queue on one side, selected record as the primary
  work surface.
- `Lifecycle Rail`: finding/CAP/evidence/approval/report state with clear current
  step and what remains.
- `Regulatory Trace Block`: source, clause/PQ, applicability, linked checklist or
  evidence, guardrail text.
- `Decision Bar`: accept/return/request more information/escalate actions grouped
  near the reviewed evidence.
- `Configuration Studio`: selected template/question/rule preview with version
  and reference context, not only a form and table.
- `Nested Visual QA Guard`: scan tabs, cards, tables, action groups, badges, and
  metadata children for clipping, overlap, and insufficient edge spacing.

## Verification Notes

This audit is `verified locally` for screenshot capture and first-pass visual
classification. It is not production evidence and does not claim backend,
authorization, upload, notification, regulatory ingestion, audit-log, or
production readiness.
