# Responsive QA Evidence - 2026-07-08

Status: verified locally

Test URL: `http://127.0.0.1:4173/index.html`
Build boundary: frontend-only static demo; mock data and browser-local state only.
Production deployment verification: not run - no push/deploy was requested. Release status: release pending.

## Viewports

- 1920 x 1080
- 1536 x 864
- 1366 x 768
- 1024 x 768
- 768 x 1024
- 390 x 844

## Routes

### Inspector

- Dashboard
- My Assignments
- Findings
- Calendar / Audit Work Queue
- SMS Oversight Audit execution
- Checklist Runner
- Reports
- Messages

### Lead Inspector

- Assigned Audits
- Assign Checklist Questions
- Preliminary Reports
- Final Reports
- Prepare Final Report
- Calendar
- Messages

### Department Manager

- Dashboard
- Planning
- Checklist Approvals
- Question Bank
- Checklist Builder
- Version History
- Audit Reports
- Audit Work Queue
- Organizations
- Findings
- CAP Reviews

### Service Provider

- Received Reports
- My CAPs
- Communications
- Documents
- Settings

### Admin / Governance

- Regulatory Library
- Templates
- Question Bank
- Version History
- Reports
- Users
- Settings
- Organizations
- Audit Log
- GM Planning
- Finance Planning
- Executive Director Planning

## Automated Render Matrix

Final local matrix result: 258 checks, 258 pass, 0 fail, 0 console warnings/errors.

Full JSON evidence: `/private/tmp/aviasurveil360-responsive-qa-2026-07-08/matrix-results.json`

| Role | Route | 1920 x 1080 | 1536 x 864 | 1366 x 768 | 1024 x 768 | 768 x 1024 | 390 x 844 |
|---|---|---|---|---|---|---|---|
| inspector | Dashboard | pass | pass | pass | pass | pass | pass |
| inspector | My Assignments | pass | pass | pass | pass | pass | pass |
| inspector | Findings | pass | pass | pass | pass | pass | pass |
| inspector | Calendar / Audit Work Queue | pass | pass | pass | pass | pass | pass |
| inspector | SMS Oversight Audit execution | pass | pass | pass | pass | pass | pass |
| inspector | Checklist Runner | pass | pass | pass | pass | pass | pass |
| inspector | Reports | pass | pass | pass | pass | pass | pass |
| inspector | Messages | pass | pass | pass | pass | pass | pass |
| leadInspector | Assigned Audits | pass | pass | pass | pass | pass | pass |
| leadInspector | Assign Checklist Questions | pass | pass | pass | pass | pass | pass |
| leadInspector | Preliminary Reports | pass | pass | pass | pass | pass | pass |
| leadInspector | Final Reports | pass | pass | pass | pass | pass | pass |
| leadInspector | Prepare Final Report | pass | pass | pass | pass | pass | pass |
| leadInspector | Calendar | pass | pass | pass | pass | pass | pass |
| leadInspector | Messages | pass | pass | pass | pass | pass | pass |
| manager | Dashboard | pass | pass | pass | pass | pass | pass |
| manager | Planning | pass | pass | pass | pass | pass | pass |
| manager | Checklist Approvals | pass | pass | pass | pass | pass | pass |
| manager | Question Bank | pass | pass | pass | pass | pass | pass |
| manager | Checklist Builder | pass | pass | pass | pass | pass | pass |
| manager | Version History | pass | pass | pass | pass | pass | pass |
| manager | Audit Reports | pass | pass | pass | pass | pass | pass |
| manager | Audit Work Queue | pass | pass | pass | pass | pass | pass |
| manager | Organizations | pass | pass | pass | pass | pass | pass |
| manager | Findings | pass | pass | pass | pass | pass | pass |
| manager | CAP Reviews | pass | pass | pass | pass | pass | pass |
| auditee | Received Reports | pass | pass | pass | pass | pass | pass |
| auditee | My CAPs | pass | pass | pass | pass | pass | pass |
| auditee | Communications | pass | pass | pass | pass | pass | pass |
| auditee | Documents | pass | pass | pass | pass | pass | pass |
| auditee | Settings | pass | pass | pass | pass | pass | pass |
| admin | Regulatory Library | pass | pass | pass | pass | pass | pass |
| admin | Templates | pass | pass | pass | pass | pass | pass |
| admin | Question Bank | pass | pass | pass | pass | pass | pass |
| admin | Version History | pass | pass | pass | pass | pass | pass |
| admin | Reports | pass | pass | pass | pass | pass | pass |
| admin | Users | pass | pass | pass | pass | pass | pass |
| admin | Settings | pass | pass | pass | pass | pass | pass |
| admin | Organizations | pass | pass | pass | pass | pass | pass |
| admin | Audit Log | pass | pass | pass | pass | pass | pass |
| gm | GM Planning | pass | pass | pass | pass | pass | pass |
| finance | Finance Planning | pass | pass | pass | pass | pass | pass |
| executiveDirector | Executive Director Planning | pass | pass | pass | pass | pass | pass |

## Screenshot Evidence

- `/private/tmp/aviasurveil360-responsive-qa-2026-07-08/inspector-findings-1920x1080.png`
- `/private/tmp/aviasurveil360-responsive-qa-2026-07-08/inspector-findings-390x844.png`
- `/private/tmp/aviasurveil360-responsive-qa-2026-07-08/lead-assignment-768x1024.png`
- `/private/tmp/aviasurveil360-responsive-qa-2026-07-08/final-report-prepare-1024x768.png`

## Issues Resolved

### QA-01: Deployed/cached inspector screen still shows legacy CAP Verification

Resolution: Inspector IA now exposes one `Findings` workspace. Old inspector CAP verification route IDs redirect to `findings` with the open filter; Lead Inspector and Department Manager CAP-specific ownership routes remain available.

Evidence:

- `node tests/inspector-nav-smoke.test.js`: passed.
- Final render matrix: pass for Inspector `Findings` at all six viewports.
- `index.html` asset token bumped to `20260708-responsive-qa`.

Production status: not run - deployed Vercel fresh-load verification is release pending.

### QA-02: Legacy CAP Verification table has badge/text collisions

Resolution: Unified Findings/CAP badges can wrap, dense table shells use inner horizontal scroll, and the Findings detail rail no longer squeezes CAP/detail fields into horizontal columns.

Evidence:

- Final render matrix: `clippedBadges = 0` across 258 checks.
- Visual screenshot checked: `inspector-findings-1920x1080.png`.

### QA-03: Dense table plus right summary rail exceeds practical content width

Resolution: Shared responsive workbench/table primitives keep dense tables inside scroll shells and stack rails below desktop. Service Provider report panels also use zero-min-width grid behavior.

Evidence:

- Final render matrix: `documentElement.scrollWidth <= clientWidth + 4` across all route/viewport checks.
- Service Provider `Received Reports` passed at `1024 x 768`, `768 x 1024`, and `390 x 844`.

### QA-04: Filter rows are not consistently responsive

Resolution: High-risk filter rows now use `responsive-filter-row`, which wraps to one column on narrow viewports.

Evidence:

- `node tests/inspector-nav-smoke.test.js`: asserts responsive filter wrapper presence.
- Final render matrix: My Assignments, Findings, assignment questions, reports, and governance filters pass all viewports.

### QA-05: Checklist runner and attached-file cells are fragile at narrow widths

Resolution: Inspection/checklist tables use responsive table shells, stable minimum table widths, and non-collapsing checklist title text.

Evidence:

- Final render matrix: Inspector `SMS Oversight Audit execution` and `Checklist Runner` passed at `768 x 1024` and `390 x 844`.
- `node tests/inspection-execution-smoke.test.js`: passed in full test suite.

### QA-06: Lead assignment question table can collapse text vertically

Resolution: Assignment question tables use the shared table shell and non-collapsing question title spans.

Evidence:

- Visual screenshot checked: `lead-assignment-768x1024.png`.
- Final render matrix: `letterCollapse = 0` across 258 checks.

### QA-07: Preliminary/final report step cards still have proportional imbalance risks

Resolution: Report step grids and action bars now wrap proportionally at tablet and mobile widths.

Evidence:

- Visual screenshot checked: `final-report-prepare-1024x768.png`.
- Final render matrix: Lead Inspector preliminary/final report surfaces passed all viewports.

### QA-08: Asset cache/versioning is not a reliable deployment signal

Resolution: CSS and JS asset query tokens in `index.html` now use `20260708-responsive-qa`.

Evidence:

- `rg -n "20260708-responsive-qa" index.html`: all CSS/JS asset tags use the new token.

Production status: not run - deployed Vercel fresh-load verification is release pending.

### QA-09: Current automated smoke tests do not cover rendered responsive quality

Resolution: This run records a local rendered route/viewport matrix and screenshot evidence. The project still does not commit a Playwright dependency; the temporary harness lived under `/private/tmp`.

Evidence:

- Final local matrix: 258 checks, 0 failures, 0 console warnings/errors.
- Full Node smoke suite: 19 tests passed.

## Verification Log

- `python3 -m http.server 4173`: served the frontend-only static demo locally.
- Browser plugin local page health: loaded the app with title `AviaSurveil360 - Clickable Demo`; no console warnings/errors recorded in the health check.
- Browser plugin `domSnapshot()`: blocked by internal runtime error `TypeError: o.incrementalAriaSnapshot is not a function`; fallback used local bundled Playwright/Chromium for rendered matrix verification.
- `git diff --check`: passed.
- `node --check js/app.js`: passed.
- `node --check js/views.js`: passed.
- `node tests/inspector-nav-smoke.test.js`: passed.
- `node tests/service-provider-final-report-smoke.test.js`: passed.
- All `tests/*.test.js`: 19 passed.
- Rendered matrix with bundled Playwright/Chromium: 258 checks, 0 failures, 0 console warnings/errors.

## Remaining Risk

- Production deployment verification is not run because no push/deploy was requested. The next release owner must verify `https://aviasurveil360.vercel.app` on a fresh load and confirm the new `20260708-responsive-qa` asset URLs before marking this plan completed.
