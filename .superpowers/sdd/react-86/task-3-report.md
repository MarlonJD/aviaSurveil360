# Task 3 — Expand The Visual Oracle To 258 Pairs

Status: `verified locally` for the root baseline oracle and fail-closed visual contracts. The full React candidate comparison is `candidate-only`; it was not run in this task because the 69 demo-only routes remain intentionally pending their owning migration tasks.

## Scope completed

- Visual fixture registry: 86 source-role-correct route fixtures × 3 fixed viewports = 258 pairs.
- Added 207 new tracked root baseline PNGs for the 69 newly contracted surfaces.
- Replaced exactly six inherited cross-role baseline PNGs: `ui-audit-009` / `finding-detail` and `ui-audit-044` / `evidence-review`, each at desktop, tablet, and mobile. The `git status` accounting after the capture is 207 added PNGs and six modified PNGs (plus the manifest).
- Preserved the decoded RGBA comparator: channel delta `40`, shell `<= 0.03`, adapted-content `<= 0.08`, explicit masks only, total mask coverage `<= 5%`.
- Root static-demo source files were not changed.

## RED / GREEN evidence

| Stage | Command / result |
|---|---|
| RED source-role capture | First guarded baseline capture rejected `finding-detail` because the role-correct Inspector root screen is `Finding CAB-2026-011`, while the inherited cross-role fixture expected `CAB-2026-001`. The fixture expectation was corrected; no root source changed. |
| RED mutations | `missing-route`, `skip-viewport`, missing sidebar assertion, missing content-header assertion, compressed-byte comparator, candidate attachment decrement, result attachment decrement, broad mask, and untracked PNG each fail for their named contract reason. |
| GREEN contracts | `npm --prefix apps/web test -- tests/visual/visual-contract.test.ts` — 12/12 passed. |
| GREEN types | `npm --prefix apps/web run typecheck` — passed. |
| GREEN boundary | `AVIA_BOUNDARY_SOURCE_ONLY=1 node apps/web/scripts/assert-parity-boundary.mjs` — `ok (86 routes, 0 build profiles)`. |
| GREEN baseline hashes | `node apps/web/scripts/verify-visual-baselines.mjs` — `Verified 258 visual baseline PNGs`. |

## Capture provenance

- Guarded command: `npm --prefix apps/web run visual:baseline:update`.
- Capture profile: Playwright `1.61.1`, Chromium `149.0.7827.55`, Node `24.16.0`, fixed browser time `2026-06-15T09:00:00.000Z`.
- Manifest source commit: `38cf0934de04777af0fc97e64883741d516e7001`.
- Manifest outcome: 86 surfaces, 3 viewports, 258 items, 258 valid SHA-256 hashes, zero missing metadata.
- No-op root-source check: the five protected source hashes (`index.html`, `css/styles.css`, `js/app.js`, `js/views.js`, `js/data.js`) all match the reviewed manifest; `git diff --exit-code HEAD --` for those files passed.

## Manual visual inspection

Temporary contact sheets for all 86 baseline states were generated and visually inspected at desktop, tablet, and mobile:

- `/private/tmp/task3-desktop-contact-sheet.png`
- `/private/tmp/task3-tablet-contact-sheet.png`
- `/private/tmp/task3-mobile-contact-sheet.png`

The sheets show all expected role families and viewport shells with no blank/failed capture tiles. `ui-audit-009` is rendered under the Inspector shell and `ui-audit-044` under the Department Manager shell at all three viewports.

## Cleanup

- The capture server and isolated Playwright/Chromium processes exited.
- Post-capture process inspection found no task-owned `legacy-baseline-update`, Playwright, Chromium, or `serve-legacy` process.

## Superseding correction — exact source-state recapture

This section supersedes the earlier capture narrative where it differs. The final oracle was regenerated only after a no-write, all-86 source-state preflight passed with zero heading or semantic-marker failures.

- The independent verifier now owns exact 86-surface legacy view, params, and role metadata. It checks source-role/route-role equality and rejects stale mappings, including `ui-audit-009` as CAA Inspector and `ui-audit-044` as Department Manager.
- The 17 dual-profile set and the 69 demo-only route boundary are fail-closed; the Plan 2 HTTP reason is exact and the boundary mutation tests are green.
- Direct legacy states now cover the manager preliminary-report review, organization detail for `ORG-XYZ`, five distinct wizard steps, the lead preliminary workflow, and valid final-report states rather than generic report-list or unavailable-record fallbacks.
- Final guarded capture: `npm --prefix apps/web run visual:baseline:update` — `258/258` passed.
- Final checks: `npm --prefix apps/web test -- tests/visual/visual-contract.test.ts` — `12/12` passed; `npm --prefix apps/web run typecheck` — passed; `AVIA_BOUNDARY_SOURCE_ONLY=1 node apps/web/scripts/assert-parity-boundary.mjs` — `ok (86 routes, 0 build profiles)`; `node apps/web/scripts/verify-visual-baselines.mjs` — `Verified 258 visual baseline PNGs`.
- Final Git accounting is exact: 207 new PNGs, six modified inherited PNGs (`finding-detail` and `evidence-review` at desktop/tablet/mobile), plus the modified manifest. Two unrelated visual recapture drifts (`desktop/admin-home.png`, `mobile/finance-home.png`) were restored to their HEAD bytes before the final hash verification.
- Contact sheets were regenerated and inspected at `/private/tmp/task3-desktop-contact-sheet.png`, `/private/tmp/task3-tablet-contact-sheet.png`, and `/private/tmp/task3-mobile-contact-sheet.png`. They show nonblank, role-correct source states; the admin package builder and organization detail, five wizard states, lead workflow, Inspector finding, and Department Manager evidence states are visually distinct.

Verification status: `verified locally` for the root visual oracle. The React comparison remains `candidate-only` and `not run`; its 69 new routes stay demo-only until their owning migration tasks, and Plan 2 was not started.

## Final closure after the all-86 semantic-marker gate

This section supersedes every earlier Task 3 result where it differs.

- RED: the new no-write all-86 preflight exposed eight stale inherited semantic markers on otherwise valid source states. The reviewed fixtures now identify the actual source records (`PR-2026-018`, `PF-2026-001`, `INS-2026-001`, `CAB EMEQ PBE`, `PLAN-2026-Q3-CABIN`, `RAMP-2026-005`, and `FR-2026-022`).
- GREEN: the no-write preflight passed all 86 source headings and mandatory semantic markers: `1 passed (52.7s)`.
- Guarded root recapture: `npm --prefix apps/web run visual:baseline:update` passed `258/258` (`3.6m`). The Executive Director report preview is populated with `FR-2026-022`; the Auditee report preview is populated with `FR-2025-009`.
- Exact PNG accounting: 207 new PNGs plus only the six modified inherited `ui-audit-009` and `ui-audit-044` PNGs. Four incidental recapture drifts (`desktop/admin-home.png`, `desktop/checklist-runner.png`, `desktop/executive-home.png`, and `tablet/lead-home.png`) and only their matching manifest item fields were restored exactly from `HEAD`.
- Final manifest: 86 distinct surfaces, three distinct viewports, 258 items, source commit `38cf0934de04777af0fc97e64883741d516e7001`. `node apps/web/scripts/verify-visual-baselines.mjs` reported `Verified 258 visual baseline PNGs`.
- Final contracts: visual contract `12/12` passed; source-only boundary `ok (86 routes, 0 build profiles)`; TypeScript typecheck passed; focused diff-check passed.
- Root no-op evidence: pre-capture and post-capture SHA-256 values are identical for all five protected root files, and `git diff --exit-code HEAD -- index.html css/styles.css js/app.js js/views.js js/data.js` passed.
- Final contact sheets were regenerated and visually inspected at `/private/tmp/task3-desktop-contact-sheet.png`, `/private/tmp/task3-tablet-contact-sheet.png`, and `/private/tmp/task3-mobile-contact-sheet.png`. All 86 states per viewport are nonblank; the populated Executive Director and Auditee report previews are visible and source-role correct.
- Cleanup: the allowlist-external preflight spec, temporary Playwright preflight config, and contact-sheet composer were removed after their run evidence was recorded here. Final process inspection found no task-owned legacy server, Playwright, Chromium, webdriver, or remote-debugging process.

Verification status: `verified locally` for the root visual oracle. The React comparison remains `candidate-only` and `not run`. All 69 newly contracted routes remain demo-only until their owning migration tasks; Plan 2 was not started.
