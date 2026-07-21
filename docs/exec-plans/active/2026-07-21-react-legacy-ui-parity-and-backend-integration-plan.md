# React Legacy UI Parity And Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan task by task. Do not dispatch subagents unless the user explicitly authorizes subagent work for the execution task.

**Goal:** Make the 17 already-routed React surfaces recognizably and measurably match the accepted root Vanilla AviaSurveil360 interface, add the missing read contracts needed for direct-load Potential Finding, CAP, and Admin preview behavior, connect the normal HTTP build to the real same-origin OIDC browser-session boundary, and classify every accepted legacy screen without hiding missing Product scope or creating inert React placeholders.

**Architecture:** Keep the root Vanilla application intact as the visual and behavioral oracle. Freeze an independently checkable 86-row source inventory and a typed 17-route registry before implementation. Complete the Potential Finding, immutable CAP-revision, and checklist-template-detail read verticals before the pages that consume them. Use one layered React visual system, a session-aware shell, subject-scoped offline repositories, and two intentionally separate HTTP lanes: deterministic canonical-header testing and real local OIDC session testing. The 17 routes are `react-parity` surfaces; they are not all backend-complete at plan start. The other 69 accepted audit rows remain reachable only in the root demo until Product approves a complete route-family slice.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, React Router 7, TanStack Query, React Hook Form, Zod, Dexie/IndexedDB, OPFS, Service Worker/Cache Storage, Playwright 1.61, Vitest/React Testing Library, Go 1.26 modular monolith, `chi`, PostgreSQL, Keycloak OIDC, MinIO-compatible object storage, OpenAPI, and the existing root HTML/CSS/Vanilla JavaScript reference.

**Status:** `active` — Tasks 1-6 are `verified locally`: the independent 86-row inventory/17-route contract is frozen; Potential Finding plus immutable CAP revision read projections pass mock, HTTP mapping, OpenAPI, sqlc, and Go race gates; Admin checklist-template-version detail reads pass exact snapshot, mock/HTTP mapping, OpenAPI, sqlc, and Go race gates; the deterministic tracked visual-parity harness now has 51 hash-verified legacy baselines plus an intentionally red React comparison; the layered brand system now has a typed approved asset registry, restricted Vite asset access, image/font app-shell manifests, HTTP artifact exclusions, and stopped-origin mark/icon/font recovery; and the candidate role selection/application shell now uses presentational role/navigation/topbar/mobile components with registry-derived primary navigation, contextual active-parent state, profile/logout callbacks, notification modes, and shell-only geometry checks. Task 7 is next. No deployment, traffic cutover, legacy removal, stakeholder acceptance, or `production-ready` claim has occurred; release remains `release pending`.

## Independent Review Resolution

| Review condition | Binding correction in this revision |
|---|---|
| The 17 surfaces were inaccurately called backend-connected. | They are now `react-parity` routes with an explicit `dataBoundary`. Potential Finding, CAP, and Admin detail reads are prerequisites in Tasks 2-3. |
| Lead Potential Finding and CAP review could not survive a direct load. | Task 2 adds exact list/get read contracts, immutable role-shaped CAP revision views, authorization, mock/HTTP parity, and direct-load tests. |
| Admin question/reference/evidence preview exceeded its list schema. | Task 3 adds `GET /v1/configuration/checklist-template-versions/{templateVersionId}` and a typed detail projection before Admin UI work. |
| The canonical test script could not prove normal OIDC. | Task 7 preserves `scripts/test-http-profile.sh` and adds a separate `scripts/test-http-oidc-profile.sh` with canonical seed and canonical-header authentication decoupled. |
| Routes, cross-role links, expiry, and offline subjects were not safely integrated. | Tasks 1, 6, and 7 add a typed route registry, `RoleGuard`, bounded `RoleHandoff`, central authentication-loss handling, query/projection clearing, and `lockSubject` without deleting offline records. |
| The screenshot method allowed ignored baselines, weak determinism, broad masks, and relaxed comparison. | Task 4 stores hashed baselines under a tracked app test path, pins the browser environment, caps masks at 5%, expands geometry checks, and adds comparator-integrity tests. |
| A self-authored 86-row manifest could hide substitutions. | Task 1 adds a deterministic extractor and exact ordered comparison against the 86 rows in `UI_SCREEN_AUDIT_2026-07-19.md` plus a Product-scope crosswalk. |
| Brand reuse did not prove Vite/SW/offline artifact behavior. | Task 5 fixes the asset path, restricts Vite file access, adds fonts/images to the app-shell manifest, and verifies stopped-origin asset recovery. |
| The proposed CSS boundaries could become a second unowned stylesheet. | Task 5 defines real `@layer` order, system-font workbench defaults, login-only DM Sans, feature-owned styles, and selector-ownership tests. |
| Navigation/topbar behavior and visible controls were underspecified. | Tasks 1, 6, and 7 define route metadata, contextual detail routes, active-parent behavior, profile/logout behavior, and a truthful normal-HTTP notification boundary. |
| Task red/green, staging, docs, and lifecycle boundaries were too broad. | This plan uses 16 dependency-ordered tasks, exact task allowlists, an upstream-aware commit protocol, bilingual evidence, Product index updates, and literal release labels. |

These corrections close the review conditions at the planning level only. They do not constitute implementation evidence or stakeholder acceptance.

## Global Constraints

- Treat `index.html`, `css/styles.css`, root `js/`, root Node tests, `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md`, and critical `qa/screenshots/` as protected reference sources. Do not edit them in this plan.
- Preserve the root demo until React parity and a later cutover are explicitly accepted. The HTTP artifact may reuse brand image/font assets but must not import root JavaScript, root CSS, mock/seed modules, canonical-test modules, or root-demo runtime code.
- Do not copy legacy globals, global event wiring, mutable browser authorization, or root CSS wholesale into React.
- Preserve the canonical lifecycle: Checklist Response -> Potential Finding -> Lead decision -> Finding -> CAP -> Evidence -> CAA Review -> Closure.
- CAP acceptance is not Finding closure. Report issue does not close Findings. Potential Finding conversion remains Lead Inspector authority.
- Preserve immutable CAP revisions, Evidence versions, checklist-template versions, and report versions. Never update or overwrite a submitted version to simplify UI state.
- Keep `Comment to Auditee` and `Internal CAA Note` separate in contracts, storage, projections, components, and tests. Auditee transport shapes must structurally omit `internalCaaNote`.
- Server authorization remains authoritative. Client route guards reduce exposure and stale UI; they are not a substitute for Go authorization.
- Auditee data remains organization-scoped. Auditee UI and transport must omit other organizations, internal notes, workload, internal risk, and enforcement deliberations.
- Official Evidence remains online-first. Offline field bytes remain `InspectionAttachment` data and must not be presented as accepted Evidence.
- Preserve subject-scoped IndexedDB/OPFS, server-issued offline grants, causal outbox behavior, explicit conflict recovery, and no-delete recovery. Logout/user switch locks the old subject but does not erase pending records.
- Every visible action must either call an existing or newly approved Backend capability, use an existing explicit local/offline boundary, navigate to a real route, update visible local UI state, or be visibly disabled with a specific reason. Toast-only or inert controls fail.
- Demo and canonical-test HTTP may expose deterministic role switching. Normal HTTP exposes only authenticated session roles and never fabricates membership.
- Normal HTTP uses same-origin OIDC/session/CSRF. Do not store provider tokens in React, expose them through `/auth/session`, weaken Secure/HttpOnly/SameSite cookies, or retry a failed mutation without user action.
- Use the root system-font workbench stack for authenticated screens. Load local DM Sans only for the login/role-selection composition where the accepted reference uses it.
- Reuse semantic brand assets through typed registries. Do not inline large SVG copies into components.
- Use literal evidence labels: `verified locally`, `not run`, `blocked`, `candidate-only`, `release pending`, and `production-ready` only when their exact evidence exists.
- Work on the current branch only. Do not create, switch, rename, or delete branches.
- Production deployment, cutover, production Identity/MFA/provisioning, records/legal-hold policy, hosting/provider selection, monitoring/SLO/on-call, pilot routing, rollback, and legacy removal remain `blocked` and out of scope.

## Why This Plan Exists

The current React/Go candidate passed local technical matrices but failed stakeholder visual acceptance: the user found the React interface visually unrelated to the accepted original. The root demo has a mature branded role-selection page, shell, dense workbench patterns, lifecycle dossiers, and 86 audited screen states. The React candidate has 17 concrete routes but a separate minimal visual language.

The correction is deliberately narrower than “rebuild all 86 screens in React.” It brings the 17 already-routed candidate surfaces into controlled visual and interaction parity, completes the read contracts those surfaces actually require, and records the remaining Product scope without fake routes. If the expected user outcome is a complete React replacement of every root screen, this plan is insufficient and must be expanded by Product before implementation.

## Scope

### Exact React-Parity Route Set

| Surface ID | Accepted legacy source | React path | Required role | Placement | Data boundary |
|---|---|---|---|---|---|
| `role-select` | Global / Role selection / login | `/` | none | none | `session` |
| `inspector-home` | CAA Inspector / My Assignments | `/inspector/inspector-assignments` | `inspector` | primary | `backend` |
| `lead-home` | Lead Inspector / Potential Finding review entry | `/lead-inspector/lead-review` | `leadInspector` | primary | `backend` after Task 2 |
| `manager-home` | Department Manager / Dashboard | `/department-manager/dashboard` | `manager` | primary | `backend` |
| `gm-home` | General Manager / dashboard | `/general-manager/gm-dashboard` | `gm` | primary | `backend` |
| `finance-home` | Finance / review | `/finance/finance-review` | `finance` | primary | `backend` |
| `executive-home` | Executive Director / dashboard | `/executive-director/executive-dashboard` | `executiveDirector` | primary | `backend` |
| `auditee-home` | Auditee / My Findings, CAP, Evidence state | `/auditee/service-provider-cap` | `auditee` | primary | `backend` after Task 2 |
| `admin-home` | Admin Preview / checklist template preview | `/admin/templates` | `admin` | primary | `backend` after Task 3 |
| `audit-detail` | CAA Inspector / Audit Detail / `AUD-2026-001` | `/inspector/audits/AUD-2026-001` | `inspector` | contextual | `backend` |
| `checklist-runner` | CAA Inspector / Checklist Runner / `AUD-2026-001` | `/inspector/audits/AUD-2026-001/checklist` | `inspector` | contextual | `backend+field` |
| `organization-registry` | Department Manager / Organizations | `/department-manager/organizations` | `manager` | primary | `backend` |
| `audit-plan` | Department Manager / Planning | `/department-manager/audit-plan` | `manager` | primary | `backend` |
| `finding-detail` | Lead Inspector / Finding Detail / `FND-CAB-2026-001` | `/lead-inspector/findings/FND-CAB-2026-001` | `leadInspector` | contextual | `backend` |
| `cap-review` | Lead Inspector / CAP Review / `FND-CAB-2026-001` | `/lead-inspector/cap-review/FND-CAB-2026-001` | `leadInspector` | contextual | `backend` after Task 2 |
| `evidence-review` | Lead Inspector / Evidence Review / `FND-CAB-2026-001` | `/lead-inspector/evidence-review/FND-CAB-2026-001` | `leadInspector` | contextual | `backend` |
| `report-preview` | Department Manager / report preview / `RPT-CAB-2026-001-V1` | `/department-manager/reports/RPT-CAB-2026-001-V1` | `manager` | contextual | `backend` |

The route registry is the authority for path, role, placement, active parent, label, icon, order, and data boundary. Detail routes are contextual and do not become sidebar entries.

The binding primary audit-row mapping is:

| React surface | Primary audit row | Content parity |
|---|---|---|
| `role-select` | `ui-audit-001` Role selection / login | `strict-shell` |
| `inspector-home` | `ui-audit-002` My Assignments | `content-adapted` |
| `lead-home` | `ui-audit-013` Lead Assigned Audits | `content-adapted` queue pattern plus critical Potential Finding scenario evidence |
| `manager-home` | `ui-audit-027` Department Manager Dashboard | `content-adapted` |
| `gm-home` | `ui-audit-052` General Manager Dashboard | `content-adapted` |
| `finance-home` | `ui-audit-058` Finance Review | `content-adapted` |
| `executive-home` | `ui-audit-059` Executive Dashboard | `content-adapted` |
| `auditee-home` | `ui-audit-066` Auditee Corrective Actions | `content-adapted` |
| `admin-home` | `ui-audit-076` Admin Template Preview | `content-adapted`; the standalone Templates register row remains legacy-only |
| `audit-detail` | `ui-audit-007` Inspector Audit Detail | `content-adapted` |
| `checklist-runner` | `ui-audit-008` Inspector Checklist Runner | `content-adapted` |
| `organization-registry` | `ui-audit-041` Manager Organizations | `content-adapted` |
| `audit-plan` | `ui-audit-028` Manager Planning | `content-adapted`; create/intake wizard rows remain legacy-only |
| `finding-detail` | `ui-audit-009` Inspector Finding Detail | `content-adapted` shared dossier plus critical Lead scenario evidence |
| `cap-review` | `ui-audit-022` Lead CAP Review Detail | `content-adapted` |
| `evidence-review` | `ui-audit-044` Manager Inspection Evidence | `content-adapted` shared Evidence dossier plus critical Lead scenario evidence |
| `report-preview` | `ui-audit-030` Manager Reports Approval | `content-adapted` shared immutable report dossier/decision composition |

Cross-role primary rows are visual composition references only; they never broaden the route’s `requiredRole` or Backend authority. The exact 17-row set above is test data, not an executor choice. Additional critical scenario screenshots may refine a surface but cannot substitute, add, or remove a primary row without a reviewed plan amendment.

### 86-Screen And Product-Scope Reconciliation

- The exact ordered 86 rows come from the Markdown table in `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md`, not from the new manifest itself.
- Exactly 17 audit rows or accepted interaction states map to `react-parity` surfaces. Exactly 69 rows remain `later-legacy-only` or `demo-only-legacy` and have `reactPath: null`.
- The committed source inventory must match the audit document’s ordered audit ID, role, and screen name byte-for-byte after deterministic normalization. A count-only test is insufficient.
- The extractor reads only the six-column table between `## Preserved pre-remediation screen findings` and `## Prioritized issue list`, derives `ui-audit-NNN` from the numeric first column, and rejects any other table as an inventory source.
- The Product crosswalk must map every required demo/MVP screen from `AGENTS.md` and `docs/product-specs/screen-specs/SCREEN_INVENTORY_AND_FORMS.md` to a source audit row, an interaction inside that row, and a disposition.
- `New Inspection Planning Intake` is explicitly cross-mapped to Department Manager Planning plus `ui-audit-047` through `ui-audit-051` (`New Audit Wizard 1-5`). All five wizard rows remain `later-legacy-only` in this plan. Their Routine/Announced and Ad Hoc/Unannounced rules stay in the root demo; no React create/intake control may appear.
- The 69-screen boundary is justified only for the current candidate scope: those states lack a complete accepted HTTP vertical or are demo-only. It is not a claim that the user accepted permanent removal.
- Any future promotion requires one reviewed slice containing Product authority, OpenAPI, generated transport, mock, Go persistence/authorization, React route/UI, mock/HTTP browser tests, privacy tests, and updated disposition evidence.

The required Product crosswalk is fixed before execution:

| Repo-required outcome | Delivery in this plan |
|---|---|
| Role switch / login | `role-select`; deterministic role switch in demo/canonical and real sign-in/session roles in normal HTTP |
| Manager Dashboard | `manager-home` |
| Inspector Dashboard | `inspector-home` |
| Audit Plan Calendar | `audit-plan` |
| Audit Detail | `audit-detail` |
| Checklist Runner | `checklist-runner` |
| Finding Detail with lifecycle stepper | `finding-detail` |
| Auditee My Findings | authorized Finding register/summary inside `auditee-home` |
| CAP Submission Form | versioned submission state inside `auditee-home` |
| Evidence Upload / Review | online Evidence submission/history inside `auditee-home` and CAA decision at `evidence-review` |
| Closed Finding / Report Preview | closed lifecycle state at `finding-detail` and immutable report dossier at `report-preview` |
| Admin Checklist Template Preview | `admin-home` backed by Task 3 detail read |
| New Inspection Planning Intake | `later-legacy-only`: `ui-audit-047` through `ui-audit-051`; no React control or route |

The first 12 outcomes are delivered through the 17-route set, sometimes as an interaction/state rather than a separate URL. The final intake outcome remains intentionally outside the candidate because no accepted create vertical exists.

### In Scope

- Independent 86-row inventory, 17-route registry, Product-scope crosswalk, and bilingual parity contract.
- Potential Finding list/get, CAP revision list/get, and Admin checklist-template-version detail read verticals.
- A tracked, hashed, deterministic visual baseline and comparison harness for 17 surfaces at `1440x900`, `1024x768`, and `390x844`.
- One layered React token/shell/primitives/features CSS system that reuses accepted local assets.
- Branded role selection/login, application shell, navigation, topbar, profile/logout, responsive navigation, truthful notification state, and contextual role handoffs.
- Normal OIDC session bootstrap, role guard, CSRF mutation, expiration recovery, logout, subject changes, and a separate local OIDC browser test lane.
- Visual/interaction migration of the exact 17 routes.
- Existing mock, canonical HTTP, normal OIDC HTTP, offline, backend, root, security, and artifact-exclusion regressions.
- English/Turkish verification evidence, Product index, plan index, parent-plan status, and tracker reconciliation.

### Out Of Scope

- Creating React routes or placeholders for the remaining 69 audit rows.
- Adding HTTP user administration, broad checklist editing, AI, advanced risk/BI, USOAP/SSP, regulatory editing, enforcement case management, generic workflow design, or notification delivery.
- Public sign-up, self-registration, invitations, password reset, account recovery, or production identity administration.
- New backend writes beyond existing accepted commands.
- Pixel identity where truthful session, backend, candidate, privacy, or offline state must differ. Such differences require documented semantic equivalence, not a relaxed global threshold.
- Production deployment, traffic, cutover, release, hosting, records, operations, or legacy archival/removal.

## Source Precedence

When sources disagree:

1. Product/security/data authority under `docs/product-specs/` and repo `AGENTS.md`.
2. Verified root behavior tests and latest accepted browser-scenario evidence.
3. Root `index.html`, `css/styles.css`, and `js/` behavior.
4. The ordered 86-row audit and critical `qa/screenshots/`.
5. Historical plans or screenshots.

Visual copying never overrides authority, privacy, lifecycle, immutable history, truthful action state, or offline recovery.

## Acceptance Criteria

- The source extractor proves the exact ordered 86 audit rows. The manifest has 86 unique `auditId` values, 17 `react-parity` rows, and 69 legacy-only rows with no React path.
- The Product crosswalk explicitly covers every repo-required screen and calls out `New Inspection Planning Intake` as legacy-only.
- All 17 registered paths derive from one typed route registry and enforce direct-URL role authorization before page render or data fetch.
- Potential Finding and CAP review pages load from a fresh URL, refresh, and a new authenticated browser session without relying on `ScenarioProvider` mutation history.
- CAP revision responses preserve submitted fields and revision history. Auditee response objects cannot contain `internalCaaNote`.
- Admin preview obtains prompt, configured reference, and expected Evidence only from the new template-detail contract.
- Normal OIDC login returns a safe session projection; only session roles render; one real CSRF mutation succeeds; logout and an expired read/mutation clear protected in-memory data and return to login.
- Demo/canonical role handoff remains deterministic. Normal OIDC never switches to a role absent from the session.
- Logout/user switch calls `lockSubject`, preserves pending offline records, and prevents the next subject from seeing the old subject’s records.
- Each of 51 automated React screenshots uses a tracked hash-verified legacy viewport baseline, strict environment metadata, bounded masks, semantic assertions, and geometry assertions.
- Shell diff ratio is at most `0.03`. Adapted content diff ratio is at most `0.08` only for an explicitly named region with semantic/geometry evidence and reviewer rationale. A threshold increase requires a plan revision.
- The workbench keeps the root system-font stack; DM Sans is limited to login/role selection.
- Every visible action works through Backend, a declared local/offline boundary, navigation, or explicit local UI state, or is disabled with a reason.
- Existing Potential Finding authority, CAP/Evidence separation, immutable versioning, organization isolation, Internal CAA Note privacy, report/closure authority, sync/conflict, app-shell recovery, and artifact-exclusion tests remain green.
- HTTP artifacts contain no root runtime CSS/JS, mock/seed, canonical-test, or root-demo modules. Approved local image/font assets are allowed and app-shell cached.
- Evidence remains `verified locally` and `candidate-only`. Stakeholder acceptance, release, and production remain separate.

## Ownership Boundaries

| Owner | Responsibility |
|---|---|
| Product/stakeholder owner | Accept the 17-route outcome versus a full 86-screen React replacement, approve visual evidence, and decide later route promotion. |
| Frontend execution owner | Inventory, route registry, layered styles, shell, session UI, feature parity, visible controls, offline subject isolation, and evidence. |
| Backend execution owner | Potential Finding/CAP/Admin read projections, OpenAPI, authorization, immutable role-shaped views, session display name, and seed/auth separation. |
| QA/reviewer | Audit inventory integrity, direct-load/privacy/authority matrices, comparator integrity, 51-pair review, and literal evidence labels. |
| Identity/platform owner | Local OIDC fixture only in this plan; production provider, MFA, provisioning, secrets, and assurance remain blocked. |
| Operations/records/security owners | No production action in this plan; hosting, retention, legal hold, monitoring, on-call, DR, and cutover remain blocked. |

## Dependencies

- Current root demo and audited source files remain unchanged.
- Existing OpenAPI generation and `scripts/check-contracts.sh` remain authoritative.
- Existing canonical test script remains green while normal OIDC receives a new independent script.
- Keycloak local realm import supports the pinned test user and disabled registration.
- Baselines are generated with the Playwright-bundled Chromium from the committed lockfile on the recorded platform; cross-platform comparisons fail closed.
- Task 1 must pass before route/scope consumers. Tasks 2-3 must pass before Lead/Auditee/Admin feature tasks. Task 4 must produce the initial red React comparison before visual implementation. Tasks 5-8 must pass before feature migration.

## Safe Commit And Push Protocol

This plan records a per-task commit/push workflow because the earlier execution authorization requested it. It is not authorization for this plan-edit turn. At execution time, use these Git steps only if the current user request explicitly authorizes commit and push.

Before Task 1:

```bash
git status --short --branch
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{upstream}
git rev-list --left-right --count @{upstream}...HEAD
git log --format='%H %s' @{upstream}..HEAD
```

Record the current branch, upstream, initial ahead count, and exact ahead commits in the Task 1 log. If the upstream is absent, the branch changed, or the ahead set contains an unexplained commit, stop before the first push. Never perform a branch operation.

For every task:

1. Run `git status --short` before staging.
2. Use only the exact `git add --` command printed in that task. A newly generated baseline subtree is allowed only where Task 4 names it.
3. Run:

   ```bash
   git diff --cached --name-status
   git diff --cached --
   git diff --cached --check
   ```

4. Compare every staged path with the task allowlist. If any path is unexpected, stop; do not commit or push. Do not use `git add .`, `git add -A`, broad feature/style/test directories, or a root glob.
5. Commit with the task’s exact Conventional Commit message.
6. Before push, rerun:

   ```bash
   git rev-list --left-right --count @{upstream}...HEAD
   git log --format='%H %s' @{upstream}..HEAD
   ```

   The ahead set may contain only the recorded initial commits plus completed commits from this plan. Otherwise stop.
7. Run `git push origin HEAD` only after the task tests and cached-diff inspection pass.
8. Run `git status --short` after push and verify unrelated `.superpowers/`, `docs/demo-evidence/stakeholder/`, `outputs/`, and any other pre-existing content are unchanged.

If commit/push is not authorized in the execution request, finish each task after verification and plan-log updates without staging.

## Binding Delivery Order

1. Independent 86-screen inventory, Product crosswalk, and typed route registry.
2. Potential Finding and immutable CAP-revision read verticals.
3. Checklist-template-version detail read vertical.
4. Deterministic tracked visual harness and initial red comparisons.
5. Brand assets, app-shell caching, tokens, and CSS ownership layers.
6. Presentational role selection, shell, navigation, and topbar.
7. Normal OIDC/session/CSRF, role guards/handoffs, expiry, and offline subject binding.
8. Shared workbench primitives.
9. Inspector routes.
10. Lead Inspector routes.
11. Auditee route.
12. Department Manager routes.
13. Finance, General Manager, and Executive Director routes.
14. Admin route.
15. Remaining-legacy/no-placeholder/artifact boundary.
16. Full candidate matrix, bilingual evidence, and stakeholder handoff.

No feature task may begin until its prerequisites pass. Tasks that edit OpenAPI, generated types, router/session state, canonical fixtures, `app.css`, or the visual spec are sequential.

---

### Task 1: Freeze The Independent 86-Screen Inventory And 17-Route Contract

**Files**

- Create `apps/web/scripts/extract-legacy-screen-inventory.mjs`
- Create `apps/web/src/parity/legacy-screen-source.json`
- Create `apps/web/src/parity/legacy-screen-manifest.ts`
- Create `apps/web/src/parity/legacy-screen-manifest.test.ts`
- Create `apps/web/src/app/route-contracts.ts`
- Create `apps/web/src/app/route-contracts.test.ts`
- Create `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md`
- Create `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.turkce.md`
- Modify `docs/product-specs/index.md`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Modify this plan

**Interfaces**

```ts
export type LegacyDisposition =
  | "react-parity"
  | "later-legacy-only"
  | "demo-only-legacy";

export type VisualParityMode = "strict-shell" | "content-adapted";
export type DataBoundary = "session" | "backend" | "backend+field";
export type RoutePlacement = "primary" | "contextual" | "none";
export type IconKey =
  | "assignments" | "leadReview" | "dashboard" | "planning"
  | "organizations" | "finance" | "reports" | "templates"
  | "profile" | "notifications" | "logout" | "menu";

export interface RouteContract {
  id: ReactSurfaceId;
  path: string;
  requiredRole: Role | null;
  placement: RoutePlacement;
  parentId: ReactSurfaceId | null;
  label: string;
  iconKey: IconKey;
  order: number;
  dataBoundary: DataBoundary;
}

export interface LegacyScreenContract {
  auditId: string;
  role: string;
  screenName: string;
  legacyView: string;
  legacyParams: Readonly<Record<string, string>>;
  reactSurfaceId: ReactSurfaceId | null;
  reactPath: string | null;
  disposition: LegacyDisposition;
  dataBoundary: DataBoundary | null;
  parityMode: VisualParityMode | null;
  productAuthority: readonly string[];
  sourceEvidence: readonly string[];
  referenceScreenshotIds: readonly string[];
  reason: string;
}
```

`legacy-screen-source.json` contains only ordered `auditId`, `role`, and `screenName` source tuples. The extractor parses the English audit Markdown table and `--check` fails on any missing, reordered, renamed, duplicated, or extra tuple. The manifest enriches those tuples but cannot redefine them.

**Red/green cycle**

- [x] Add failing extractor/manifest tests that assert:
  - exact ordered equality with all 86 Markdown rows;
  - IDs exactly `ui-audit-001` through `ui-audit-086`;
  - the exact 17 `react-parity` audit IDs printed in the binding mapping table and 69 legacy-only rows;
  - all legacy-only rows have `reactPath: null`, `reactSurfaceId: null`, `dataBoundary: null`, and empty `referenceScreenshotIds`;
  - all React rows match the route registry path/role/data boundary;
  - all rows have Product authority, source evidence, and a nonempty reason;
  - exact mapping for every required repo screen;
  - `New Inspection Planning Intake` maps to Department Manager Planning and exact source rows `ui-audit-047` through `ui-audit-051`; every wizard row remains legacy-only.
- [x] Run:

  ```bash
  node apps/web/scripts/extract-legacy-screen-inventory.mjs --check
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/route-contracts.test.ts
  ```

  Expected red: extractor/source/registry modules are absent.
- [x] Implement the deterministic parser, committed source JSON, enriched manifest, and exact route registry. Do not infer a screenshot path for any of the 69 retained rows.

  ```bash
  mkdir -p apps/web/src/parity
  ```

  Create/edit all files through `apply_patch` after the expected red run.
- [x] Write the English/Turkish parity contract. It must state the exact user outcome, the narrower 17-route delivery, the 69-row boundary, the New Inspection Planning Intake disposition, source precedence, visual thresholds, action truth, privacy, candidate-only status, and the complete future route-promotion rule.
- [x] Add both parity-contract links to `docs/product-specs/index.md`. Reconcile this plan, parent status, active index, and tracker without closing stakeholder or production gates.
- [x] Run:

  ```bash
  node apps/web/scripts/extract-legacy-screen-inventory.mjs --check
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx
  npm --prefix apps/web run typecheck
  node --test tests/parity/react-legacy-parity.test.mjs
  ```

  Expected green: exact inventory and route contracts pass; existing behavior ledger remains green.

**Execution log — 2026-07-21**

- Initial branch/upstream check: branch `main`, upstream `origin/main`, ahead/behind `0/0`, and no commits in `@{upstream}..HEAD`.
- Preserved pre-existing working-tree content: modified plan/index/tracker docs plus untracked `.superpowers/`, `docs/demo-evidence/stakeholder/`, and `outputs/`.
- Expected red captured before implementation:
  - `node apps/web/scripts/extract-legacy-screen-inventory.mjs --check` failed with `MODULE_NOT_FOUND` because the extractor did not exist.
  - `npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/route-contracts.test.ts` failed with no matching test files.
- Implemented deterministic source extraction, committed 86-row source inventory, typed 17-route registry, enriched manifest/crosswalk tests, and English/Turkish parity contracts.
- Green gate passed:
  - `node apps/web/scripts/extract-legacy-screen-inventory.mjs --check`
  - `npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx` passed 3 files / 10 tests.
  - `npm --prefix apps/web run typecheck`
  - `node --test tests/parity/react-legacy-parity.test.mjs` passed 3 tests.

**Task 1 staging allowlist and commit**

```bash
git add -- apps/web/scripts/extract-legacy-screen-inventory.mjs apps/web/src/parity/legacy-screen-source.json apps/web/src/parity/legacy-screen-manifest.ts apps/web/src/parity/legacy-screen-manifest.test.ts apps/web/src/app/route-contracts.ts apps/web/src/app/route-contracts.test.ts docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.turkce.md docs/product-specs/index.md docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "test(ui): freeze independent parity inventory"
git push origin HEAD
```

---

### Task 2: Add Potential Finding And Immutable CAP Revision Reads

**Files**

- Modify `api/openapi/aviasurveil360.yaml`
- Create `api/openapi/examples/canonical/potential-findings-response.json`
- Create `api/openapi/examples/canonical/cap-revision-caa.json`
- Create `api/openapi/examples/canonical/cap-revision-auditee.json`
- Modify `api/openapi/tests/contract-examples.test.mjs`
- Modify `apps/web/src/generated/transport/api-types.ts`
- Modify `apps/api/internal/httpapi/generated/api.gen.go`
- Modify `apps/web/src/backend/backend.ts`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/transport-mappers.test.ts`
- Modify `apps/web/src/mock/create-mock-backend.ts`
- Modify `apps/web/src/mock/memory-mock-store.ts`
- Modify `apps/web/src/mock/mock-engine.ts`
- Modify `apps/web/src/mock/seed-data.ts`
- Modify `apps/web/tests/contract/backend-contract.ts`
- Modify `apps/web/tests/contract/mock-backend.test.ts`
- Modify `apps/web/tests/contract/http-backend-live.test.ts`
- Create `apps/api/internal/potentialfindings/authorization.go`
- Create `apps/api/internal/potentialfindings/authorization_test.go`
- Create `apps/api/internal/caps/authorization.go`
- Create `apps/api/internal/caps/authorization_test.go`
- Modify `apps/api/internal/potentialfindings/store/postgres/queries.sql`
- Modify `apps/api/internal/potentialfindings/store/postgres/queries.sql.go`
- Modify `apps/api/internal/potentialfindings/store/postgres/models.go`
- Modify `apps/api/internal/potentialfindings/store/postgres/querier.go`
- Modify `apps/api/internal/caps/store/postgres/queries.sql`
- Modify `apps/api/internal/caps/store/postgres/queries.sql.go`
- Modify `apps/api/internal/caps/store/postgres/models.go`
- Modify `apps/api/internal/caps/store/postgres/querier.go`
- Modify `apps/api/internal/httpapi/api_projections.go`
- Modify `apps/api/internal/httpapi/canonical_api.go`
- Modify `apps/api/internal/httpapi/canonical_api_test.go`
- Modify `scripts/lint-openapi.mjs`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Modify this plan

**Exact HTTP contracts**

- `GET /v1/potential-findings?status=PENDING_LEAD_REVIEW&limit=50` -> `ListPotentialFindingsOutput`.
- `GET /v1/potential-findings/{potentialFindingId}` -> `PotentialFindingView`.
- `GET /v1/findings/{findingId}/cap-revisions` -> `ListCapRevisionsOutput` ordered by immutable revision ascending.
- `GET /v1/cap-revisions/{capRevisionId}` -> discriminated `CapRevisionView`.

```ts
export interface ListPotentialFindingsInput {
  status?: PotentialFindingStatus;
  limit?: number;
}

export type ListPotentialFindingsOutput = PageOutput<PotentialFindingView>;
export type CapRevisionView = CaaCapRevisionView | AuditeeCapRevisionView;

export interface CapRevisionSubmission {
  id: string;
  capId: string;
  findingId: string;
  organizationId: string;
  revision: number;
  status: CapStatus;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  targetCompletionDate: LocalDate;
  commentToCaa: string;
  submittedAt: Instant;
}

export interface CaaCapRevisionView extends CapRevisionSubmission {
  audience: "CAA";
  latestReview: null | {
    decision: "ACCEPT" | "REJECT" | "REQUEST_MORE_INFORMATION";
    commentToAuditee: string;
    internalCaaNote: string;
    decidedAt: Instant;
  };
}

export interface AuditeeCapRevisionView extends CapRevisionSubmission {
  audience: "AUDITEE";
  latestReview: null | {
    decision: "ACCEPT" | "REJECT" | "REQUEST_MORE_INFORMATION";
    commentToAuditee: string;
    decidedAt: Instant;
  };
}

export interface ListCapRevisionsOutput {
  items: CapRevisionView[];
  nextCursor: null;
}

export interface PotentialFindingBackend {
  list(input: ListPotentialFindingsInput, options?: BackendRequestOptions):
    Promise<ListPotentialFindingsOutput>;
  get(input: { potentialFindingId: string }, options?: BackendRequestOptions):
    Promise<PotentialFindingView>;
}

export interface CapBackend {
  listRevisions(input: { findingId: string }, options?: BackendRequestOptions):
    Promise<ListCapRevisionsOutput>;
  getRevision(input: { capRevisionId: string }, options?: BackendRequestOptions):
    Promise<CapRevisionView>;
}
```

These snippets add read members to the existing interfaces; the current fully typed `create`/`decide` and `submit`/`review` members remain unchanged.

Authorization is exact:

- Lead Inspector may list/get Potential Findings and decide them.
- Inspector may get only a Potential Finding originating from an inspection/question assignment authorized to that subject; Inspector cannot list a Lead queue or decide.
- Inspector, Lead Inspector, and Department Manager may read CAA-shaped CAP revisions only when existing Finding authority permits the record.
- Auditee may read only its own organization’s CAP revisions and receives `audience: "AUDITEE"` with no `internalCaaNote` property.
- Finance, GM, Executive Director, and Admin receive `403` for these lifecycle reads.
- Authorization is checked before projecting record content. Not-found/forbidden behavior must not leak another organization.

**Red/green cycle**

- [x] Add OpenAPI examples/tests for exact list/detail shapes, discriminator behavior, pagination, and structural absence of Auditee internal notes.
- [x] Add failing Backend contract tests for mock/HTTP mapping, direct get/list, abort behavior, and role-shaped CAP output.
- [x] Add failing Go authorization/projection tests for allowed roles, forbidden roles, other organization, missing record, ordered revisions, two immutable revisions, and Internal CAA Note separation.
- [x] Run:

  ```bash
  node api/openapi/tests/contract-examples.test.mjs
  npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test ./internal/potentialfindings ./internal/caps ./internal/httpapi
  ```

  Expected red: paths, generated operations, Backend methods, and projections are absent.
- [x] Implement OpenAPI first, regenerate TypeScript/Go, then implement mock/HTTP adapters and Go stores/projections/authorization. Do not add a migration or mutable CAP update.
- [x] Ensure list/get values come from persisted state, not canonical fixture objects or React scenario memory.
- [x] Run:

  ```bash
  ./scripts/check-contracts.sh
  ./scripts/check-sqlc.sh
  node api/openapi/tests/contract-examples.test.mjs
  npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts
  npm --prefix apps/web run typecheck
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -count=1 ./internal/potentialfindings ./internal/caps ./internal/httpapi ./internal/application
  ```

  Expected green: both adapters and Go return the same authorized, immutable shapes.

**Execution log — 2026-07-21**

- Baseline Task 2 commands were green before adding failing assertions, confirming the required tests were not yet present.
- Expected red captured after adding Task 2 tests/examples:
  - `node api/openapi/tests/contract-examples.test.mjs` failed on missing `CapRevisionView` and missing lifecycle read paths.
  - `npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts` failed on missing Backend read methods and CAP mapper functions.
  - `GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test ./internal/potentialfindings ./internal/caps ./internal/httpapi` failed on missing Potential Finding and CAP authorization helpers.
- `scripts/lint-openapi.mjs` was added to this task's file list and staging allowlist because `./scripts/check-contracts.sh` failed until the explicit route registry included the three new OpenAPI read paths.
- `./scripts/check-sqlc.sh` failed inside the sandbox because Go tried to use `/Users/marlonjd/Library/Caches/go-build`; the same required command passed after approved escalation.
- Green gate passed:
  - `./scripts/check-contracts.sh`
  - `./scripts/check-sqlc.sh`
  - `node api/openapi/tests/contract-examples.test.mjs` passed 6 tests.
  - `npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts` passed 3 files / 24 tests.
  - `npm --prefix apps/web run typecheck`
  - `GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -count=1 ./internal/potentialfindings ./internal/caps ./internal/httpapi ./internal/application`

**Task 2 staging allowlist and commit**

```bash
git add -- api/openapi/aviasurveil360.yaml api/openapi/examples/canonical/potential-findings-response.json api/openapi/examples/canonical/cap-revision-caa.json api/openapi/examples/canonical/cap-revision-auditee.json api/openapi/tests/contract-examples.test.mjs apps/web/src/generated/transport/api-types.ts apps/api/internal/httpapi/generated/api.gen.go apps/web/src/backend/backend.ts apps/web/src/backend/http-backend.ts apps/web/src/backend/http-backend.test.ts apps/web/src/backend/transport-mappers.ts apps/web/src/backend/transport-mappers.test.ts apps/web/src/mock/create-mock-backend.ts apps/web/src/mock/memory-mock-store.ts apps/web/src/mock/mock-engine.ts apps/web/src/mock/seed-data.ts apps/web/tests/contract/backend-contract.ts apps/web/tests/contract/mock-backend.test.ts apps/web/tests/contract/http-backend-live.test.ts apps/api/internal/potentialfindings/authorization.go apps/api/internal/potentialfindings/authorization_test.go apps/api/internal/caps/authorization.go apps/api/internal/caps/authorization_test.go apps/api/internal/potentialfindings/store/postgres/queries.sql apps/api/internal/potentialfindings/store/postgres/queries.sql.go apps/api/internal/potentialfindings/store/postgres/models.go apps/api/internal/potentialfindings/store/postgres/querier.go apps/api/internal/caps/store/postgres/queries.sql apps/api/internal/caps/store/postgres/queries.sql.go apps/api/internal/caps/store/postgres/models.go apps/api/internal/caps/store/postgres/querier.go apps/api/internal/httpapi/api_projections.go apps/api/internal/httpapi/canonical_api.go apps/api/internal/httpapi/canonical_api_test.go scripts/lint-openapi.mjs docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(api): add lifecycle read projections"
git push origin HEAD
```

---

### Task 3: Add Checklist Template Version Detail Read

**Files**

- Modify `api/openapi/aviasurveil360.yaml`
- Create `api/openapi/examples/canonical/checklist-template-version-detail.json`
- Modify `api/openapi/tests/contract-examples.test.mjs`
- Modify `apps/web/src/generated/transport/api-types.ts`
- Modify `apps/api/internal/httpapi/generated/api.gen.go`
- Modify `apps/web/src/backend/backend.ts`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Modify `apps/web/src/backend/transport-mappers.ts`
- Modify `apps/web/src/backend/transport-mappers.test.ts`
- Modify `apps/web/src/mock/create-mock-backend.ts`
- Modify `apps/web/src/mock/memory-mock-store.ts`
- Modify `apps/web/src/mock/mock-engine.ts`
- Modify `apps/web/src/mock/seed-data.ts`
- Modify `apps/web/tests/contract/backend-contract.ts`
- Modify `apps/web/tests/contract/mock-backend.test.ts`
- Modify `apps/web/tests/contract/http-backend-live.test.ts`
- Modify `apps/api/internal/configuration/authorization.go`
- Create `apps/api/internal/configuration/authorization_test.go`
- Modify `apps/api/internal/configuration/store/postgres/queries.sql`
- Modify `apps/api/internal/configuration/store/postgres/queries.sql.go`
- Modify `apps/api/internal/configuration/store/postgres/models.go`
- Modify `apps/api/internal/configuration/store/postgres/querier.go`
- Modify `apps/api/internal/httpapi/route_families_api.go`
- Modify `apps/api/internal/httpapi/canonical_api.go`
- Modify `apps/api/internal/httpapi/canonical_api_test.go`
- Modify `apps/api/internal/testprofile/canonical.go`
- Modify `scripts/lint-openapi.mjs`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Modify this plan

**Exact contract**

- `GET /v1/configuration/checklist-template-versions/{templateVersionId}` -> `ChecklistTemplateVersionDetailView`.

```ts
export interface ChecklistTemplateQuestionView {
  id: string;
  sectionId: string;
  prompt: string;
  regulatoryReference: string | null;
  expectedEvidence: string | null;
  allowedAnswers: ChecklistAnswer[];
  commentRequiredFor: ChecklistAnswer[];
}

export interface ChecklistTemplateVersionDetailView
  extends ChecklistTemplateVersionView {
  questions: ChecklistTemplateQuestionView[];
}

export interface ConfigurationBackend {
  getChecklistTemplateVersion(
    input: { templateVersionId: string },
    options?: BackendRequestOptions,
  ): Promise<ChecklistTemplateVersionDetailView>;
}
```

This snippet adds one member to the existing `ConfigurationBackend`; its current fully typed list members remain unchanged.

Only Admin may read this detail. All other roles receive `403`. The projection parses the immutable published snapshot; it never invents question text from UI fixtures and never exposes inspector assignments, draft editing state, secrets, or user administration. The canonical snapshot fixture must persist exact `allowedAnswers` and `commentRequiredFor` arrays in addition to its existing prompt/reference/evidence fields so the HTTP test proves the same schema as mock.

**Red/green cycle**

- [x] Add failing OpenAPI/example, Backend adapter, Go authorization, exact snapshot parsing, malformed snapshot, not-found, and direct-load tests.
- [x] Run:

  ```bash
  node api/openapi/tests/contract-examples.test.mjs
  npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test ./internal/configuration ./internal/httpapi
  ```

  Expected red: detail operation and types are absent.
- [x] Implement OpenAPI/generation, mock/HTTP mapping, immutable snapshot projection, and Admin-only authorization.
- [x] Run:

  ```bash
  ./scripts/check-contracts.sh
  ./scripts/check-sqlc.sh
  node api/openapi/tests/contract-examples.test.mjs
  npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts
  npm --prefix apps/web run typecheck
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -count=1 ./internal/configuration ./internal/httpapi
  ```

  Expected green: Admin receives exact immutable question/reference/evidence data; every other role is forbidden.

**Execution log — 2026-07-21**

- Expected red captured after adding Task 3 tests/examples:
  - `node api/openapi/tests/contract-examples.test.mjs` failed on missing `ChecklistTemplateVersionDetailView` and missing `/v1/configuration/checklist-template-versions/{templateVersionId}`.
  - `npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts` failed on missing `getChecklistTemplateVersion` and `mapChecklistTemplateVersionDetail`.
  - `GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test ./internal/configuration ./internal/httpapi` failed on missing Admin detail authorization and snapshot parser helpers.
- `apps/web/src/mock/mock-engine.ts`, `apps/web/src/mock/seed-data.ts`, and `scripts/lint-openapi.mjs` were added to this task's file list and staging allowlist because the mock projection needs immutable detail seed state and `./scripts/check-contracts.sh` requires the exact OpenAPI route registry to include the new detail path.
- Green gate passed:
  - `./scripts/check-contracts.sh`
  - `./scripts/check-sqlc.sh`
  - `node api/openapi/tests/contract-examples.test.mjs` passed 7 tests.
  - `npm --prefix apps/web test -- src/backend/http-backend.test.ts src/backend/transport-mappers.test.ts tests/contract/mock-backend.test.ts` passed 3 files / 27 tests.
  - `npm --prefix apps/web run typecheck`
  - `GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -count=1 ./internal/configuration ./internal/httpapi`

**Task 3 staging allowlist and commit**

```bash
git add -- api/openapi/aviasurveil360.yaml api/openapi/examples/canonical/checklist-template-version-detail.json api/openapi/tests/contract-examples.test.mjs apps/web/src/generated/transport/api-types.ts apps/api/internal/httpapi/generated/api.gen.go apps/web/src/backend/backend.ts apps/web/src/backend/http-backend.ts apps/web/src/backend/http-backend.test.ts apps/web/src/backend/transport-mappers.ts apps/web/src/backend/transport-mappers.test.ts apps/web/src/mock/create-mock-backend.ts apps/web/src/mock/memory-mock-store.ts apps/web/src/mock/mock-engine.ts apps/web/src/mock/seed-data.ts apps/web/tests/contract/backend-contract.ts apps/web/tests/contract/mock-backend.test.ts apps/web/tests/contract/http-backend-live.test.ts apps/api/internal/configuration/authorization.go apps/api/internal/configuration/authorization_test.go apps/api/internal/configuration/store/postgres/queries.sql apps/api/internal/configuration/store/postgres/queries.sql.go apps/api/internal/configuration/store/postgres/models.go apps/api/internal/configuration/store/postgres/querier.go apps/api/internal/httpapi/route_families_api.go apps/api/internal/httpapi/canonical_api.go apps/api/internal/httpapi/canonical_api_test.go apps/api/internal/testprofile/canonical.go scripts/lint-openapi.mjs docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(api): add template detail projection"
git push origin HEAD
```

---

### Task 4: Build A Deterministic Tracked Visual-Parity Harness

**Files**

- Create `apps/web/scripts/serve-legacy.mjs`
- Create `apps/web/scripts/verify-visual-baselines.mjs`
- Create `apps/web/tests/e2e/support/legacy-parity-fixtures.ts`
- Create `apps/web/tests/e2e/legacy-baseline-update.spec.ts`
- Create `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Create `apps/web/tests/visual/visual-contract.test.ts`
- Create `apps/web/tests/visual-baselines/react-legacy-parity/baseline-manifest.json`
- Create the 51 PNG files named by that manifest under `apps/web/tests/visual-baselines/react-legacy-parity/`
- Modify `apps/web/playwright.config.ts`
- Modify `apps/web/package.json`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Modify this plan

**Determinism contract**

- Automated comparisons use Playwright-bundled `chromium`, never `channel: "chrome"`.
- Each project pins `timezoneId: "UTC"`, `locale: "en-GB"`, `colorScheme: "light"`, `reducedMotion: "reduce"`, `deviceScaleFactor: 1`, exact viewport, headless mode, and one worker.
- Before either application script runs, install the same Playwright clock at `2026-06-15T09:00:00Z`, use a new isolated context, clear Cache Storage/IndexedDB/localStorage/sessionStorage/service workers, and then apply only the manifest-declared deterministic legacy or React fixture state.
- Before capture, wait for network idle where finite, `document.fonts.ready`, every `img.decode()`, and the manifest-declared stable heading/content selector. Inject CSS that disables animation, transition, smooth scrolling, blinking carets, and text selection highlights.
- Automated screenshots are viewport-sized with `fullPage: false`. Full-page captures/contact sheets are reviewer evidence only and never comparator inputs.
- The manifest records audit/surface ID, viewport, relative file, PNG SHA-256, source route/view/params, source commit, SHA-256 for `index.html`/`css/styles.css`/`js/app.js`/`js/views.js`/`js/data.js` and the audit document, Playwright version, Chromium version, Node version, OS/platform/arch, and `package-lock.json` SHA-256.
- `verify-visual-baselines.mjs` fails on a missing/extra file, hash drift, route mismatch, metadata mismatch, ignored path, or unexpected baseline update mode.
- Default tests are read-only. Only `npm --prefix apps/web run visual:baseline:update` may rewrite baselines, and it requires `AVIA_UPDATE_LEGACY_BASELINES=1` inside the script. A threshold or source change requires a reviewed plan amendment and a new manifest hash.
- `AVIA_VISUAL_SURFACES` may contain a validated comma-separated subset of registry IDs for a task’s focused red/green cycle; an unknown, duplicate, or explicitly empty value fails. Omission always runs all 17 surfaces. `AVIA_VISUAL_REGIONS=shell` is allowed only for Task 6’s shell checkpoint; omission means all regions. Task 16 never sets either filter.
- Package scripts are exact:

  ```json
  "test:e2e:visual-parity": "AVIA_E2E_PROFILE=visual-parity playwright test --project=legacy-parity",
  "visual:baseline:update": "AVIA_E2E_PROFILE=visual-parity AVIA_UPDATE_LEGACY_BASELINES=1 playwright test --project=legacy-baseline-update"
  ```

**Mask and comparison contract**

- Masks are an explicit per-surface array of stable selectors with rationale.
- Reject `html`, `body`, `#root`, shell/sidebar/topbar/work-content containers, wildcard selectors, and any ancestor containing more than the intended dynamic leaf.
- Reject missing or multi-match selectors unless the contract names the exact expected count.
- The union of mask rectangles may cover at most 5% of viewport pixels.
- `strict-shell` uses `maxDiffPixelRatio: 0.03` for the viewport and named shell regions.
- `content-adapted` may use at most `0.08` only for the named content region; shell remains `0.03`. Every adapted region needs a written semantic reason.
- Geometry snapshots include shell, sidebar, topbar, content origin, primary action, first data table/register, lifecycle stepper when present, role mark, key typography metrics, and palette tokens.
- Semantic assertions cover heading, role, owner, next action, status, Due Date, primary action label/state, candidate boundary, and expected privacy absence.

**Red/green cycle**

- [x] Add failing integrity tests that prove:
  - an unmasked deterministic patch outside the allowlist that exceeds the strict region ratio fails;
  - a perturbation inside one allowlisted dynamic leaf is tolerated only in that leaf;
  - a 4 px shell/geometry shift fails;
  - a broad mask or mask ratio above 5% fails;
  - a missing baseline, altered PNG, stale hash, changed lockfile hash, wrong browser/platform metadata, or full-page comparator input fails;
  - the ordinary test command cannot update a baseline.
  - unknown/duplicate/empty focused surface filters and unsupported region filters fail.
- [x] Run:

  ```bash
  npm --prefix apps/web test -- tests/visual/visual-contract.test.ts
  npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: harness and tracked baselines do not exist.
- [x] Implement the legacy static server on `127.0.0.1:4173` with explicit root-only read paths and no mutation. Add isolated Playwright projects for baseline update and React comparison.

  ```bash
  mkdir -p apps/web/tests/visual apps/web/tests/visual-baselines/react-legacy-parity
  ```

  Create/edit all files through `apply_patch`.
- [x] Generate the 51 legacy viewport baselines with the explicit update command. Verify the path is tracked:

  ```bash
  npm --prefix apps/web run visual:baseline:update
  node apps/web/scripts/verify-visual-baselines.mjs
  if git check-ignore -q apps/web/tests/visual-baselines/react-legacy-parity/baseline-manifest.json; then exit 1; fi
  ```

- [x] Run the current React comparison:

  ```bash
  npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: current minimal React shell fails at least one strict shell/geometry comparison. Record the first failing surface, viewport, region, and ratio in this plan. Do not weaken a threshold or add a mask to make the red state green.
- [x] Run harness integrity:

  ```bash
  npm --prefix apps/web test -- tests/visual/visual-contract.test.ts
  node apps/web/scripts/verify-visual-baselines.mjs
  npm --prefix apps/web run typecheck
  ```

  Expected green: harness-integrity tests pass while the product parity test remains intentionally red.

**Execution log — 2026-07-21**

- Expected red captured before implementation:
  - `npm --prefix apps/web test -- tests/visual/visual-contract.test.ts` failed because `../e2e/support/legacy-parity-fixtures` did not exist.
  - `npm --prefix apps/web run test:e2e:visual-parity` failed because the package script did not exist.
- Implemented the read-only legacy oracle server, shared fixture registry, synthetic comparator/mask/geometry/manifest integrity checks, guarded baseline update project, read-only React comparison project, verifier script, exact package scripts, and Playwright bundled-Chromium visual projects.
- `npm --prefix apps/web run visual:baseline:update` first failed in the sandbox with the macOS Chromium `MachPortRendezvousServer` permission error before the first PNG. The same required command passed after approved escalation: 51/51 baseline captures.
- Baseline verification passed:
  - `node apps/web/scripts/verify-visual-baselines.mjs` verified 51 PNGs after approved escalation for Chromium metadata validation.
  - `if git check-ignore -q apps/web/tests/visual-baselines/react-legacy-parity/baseline-manifest.json; then exit 1; fi`
  - `find apps/web/tests/visual-baselines/react-legacy-parity -type f | sort | wc -l` returned 52 files: 51 PNGs plus `baseline-manifest.json`.
- Current React comparison produced the required intentional red without threshold or mask relaxation:
  - `npm --prefix apps/web run test:e2e:visual-parity`
  - First failure: `role-select` / `desktop` / `viewport` ratio `0.99850`, max `0.03`.
- Harness integrity passed while product parity remains intentionally red:
  - `npm --prefix apps/web test -- tests/visual/visual-contract.test.ts` passed 1 file / 7 tests.
  - `node apps/web/scripts/verify-visual-baselines.mjs` verified 51 PNGs after approved escalation.
  - `npm --prefix apps/web run typecheck`
- Browser/test process hygiene check after the Playwright runs matched only the process-check command itself; no leftover Playwright, webdriver, headless Chrome, or remote-debugging Chrome process was found.
- `docs/exec-plans/index.md`, `docs/exec-plans/tech-debt-tracker.md`, and the parent React/Vite plan were added to this task's file list and staging allowlist because repo-local plan tracking requires the next todo to move from Task 4 to Task 5 when the harness task is verified.

**Task 4 staging allowlist and commit**

The baseline directory is a new task-owned subtree. Its manifest must list every staged PNG; no other file may exist in that subtree.

```bash
git add -- apps/web/scripts/serve-legacy.mjs apps/web/scripts/verify-visual-baselines.mjs apps/web/tests/e2e/support/legacy-parity-fixtures.ts apps/web/tests/e2e/legacy-baseline-update.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts apps/web/tests/visual/visual-contract.test.ts apps/web/tests/visual-baselines/react-legacy-parity/baseline-manifest.json apps/web/tests/visual-baselines/react-legacy-parity/ apps/web/playwright.config.ts apps/web/package.json docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "test(ui): add deterministic parity harness"
git push origin HEAD
```

### Task 5: Reuse Brand Assets And Establish One Layered Style System

**Files**

- Create `apps/web/src/ui/brand-assets.ts`
- Create `apps/web/src/ui/brand-assets.test.ts`
- Create `apps/web/src/styles/reset.css`
- Create `apps/web/src/styles/tokens.css`
- Create `apps/web/src/styles/base.css`
- Create `apps/web/src/styles/shell.css`
- Create `apps/web/src/styles/utilities.css`
- Create `apps/web/src/styles/responsive.css`
- Create `apps/web/src/styles/style-ownership.test.ts`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/vite.config.ts`
- Modify `apps/web/src/sw.ts`
- Modify `apps/web/src/offline/sw-policy.test.ts`
- Modify `apps/web/scripts/assert-app-shell-artifact.mjs`
- Modify `apps/web/scripts/assert-http-artifact.mjs`
- Create `apps/web/tests/e2e/brand-app-shell-restart.spec.ts`
- Modify `apps/web/playwright.config.ts`
- Modify `apps/web/package.json`
- Modify this plan

**Asset and CSS contracts**

`apps/web/src/ui/brand-assets.ts` resolves root assets with the correct source-relative prefix `../../../../assets/`. It exports semantic mark/texture/font/icon keys; components do not embed filesystem strings or choose icons by role labels.

```ts
import type { IconKey } from "../app/route-contracts";

export const BRAND_ASSETS: {
  mark: string;
  loginTexture: string;
  dmSansVariable: string;
  icons: Readonly<Record<IconKey, string>>;
};
```

`app.css` contains only the layer declaration and ordered imports:

```css
@layer reset, tokens, base, shell, primitives, features, utilities, responsive;
@import "./reset.css" layer(reset);
@import "./tokens.css" layer(tokens);
@import "./base.css" layer(base);
@import "./shell.css" layer(shell);
@import "./utilities.css" layer(utilities);
@import "./responsive.css" layer(responsive);
```

- `base.css` alone may style `html`, `body`, and `#root`.
- Authenticated workbench pages use the accepted root system stack. Only the login/role-selection selector receives local `"DM Sans"`.
- Feature selectors must live in exact feature stylesheets created by Tasks 9-14 and be imported into `layer(features)`. Shared primitives belong only to Task 8’s `primitives.css`.
- No production stylesheet may import `css/styles.css`, use `!important`, define an unlayered rule, or duplicate an owned selector across files.
- Status colors must have a text/icon cue and readable foreground; color alone is not state.

Vite development access is restricted to `apps/web` and the repository `assets/` directory. Do not allow the repository root as a general filesystem server root. Build output may emit only approved image/font assets from the asset registry.

The app-shell asset manifest and Service Worker classifier include `svg|png|jpg|jpeg|webp|ttf|woff|woff2` in addition to CSS/JS. The HTTP artifact scan allows emitted approved image/font files but still rejects root `css/styles.css`, any root `js/` module, `src/mock`, `seed-data`, `http-test`, canonical test token/boundary, and root-demo runtime paths.

Add exact package script:

```json
"test:e2e:brand-offline": "npm run build:demo && AVIA_E2E_PROFILE=offline playwright test tests/e2e/brand-app-shell-restart.spec.ts --project=offline"
```

**Red/green cycle**

- [x] Add failing tests for asset existence, exact relative prefix, semantic icon completeness, CSS layer order, system-font workbench, login-only DM Sans, selector ownership, no root CSS import, no unlayered rules, and no `!important`.
- [x] Extend app-shell/SW/artifact tests so an emitted mark, icon, and font are required in both demo and HTTP manifests.
- [x] Add a stopped-origin Playwright test: load/build once, verify mark/icon/font, stop the origin through the existing offline server harness, reload offline, and assert the same assets render from Cache Storage without a network response.
- [x] Run:

  ```bash
  npm --prefix apps/web test -- src/ui/brand-assets.test.ts src/styles/style-ownership.test.ts src/offline/sw-policy.test.ts
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  npm --prefix apps/web run check:app-shell
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  npm --prefix apps/web run test:e2e:brand-offline
  ```

  Expected red: asset registry/layers are absent and image/font manifest checks fail.
- [x] Implement the registry, tokens, layers, restricted Vite access, asset classifier, and artifact rules. Do not copy root declarations en masse.

  ```bash
  mkdir -p apps/web/src/ui
  ```

  Create/edit all files through `apply_patch`.
- [x] Run the same commands plus:

  ```bash
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  ```

  Expected green: layered ownership and online/offline asset behavior pass; the visual product matrix may remain red until Tasks 6 and 9-14.

  Result 2026-07-21: red tests first failed on the absent `brand-assets` registry, missing layered stylesheet files, missing TTF Service Worker classification, and missing required app-shell brand assets. The implemented slice adds the typed approved local asset registry, one binding `app.css` layer/import surface, focused reset/token/base/shell/utility/responsive styles, restricted Vite filesystem access to `apps/web` plus repository `assets/`, non-inlined image/font asset emission, image/font app-shell manifest validation, HTTP root-runtime exclusions, and a stopped-origin brand asset cache check. Fresh green gates passed: focused Vitest 22/22; demo and HTTP builds; demo/HTTP app-shell scans across 16 files and 8 assets each; HTTP artifact scan across 16 files and 89 inputs; `test:e2e:brand-offline` 1/1 after rerunning outside the macOS sandbox because the first Playwright-bundled Chromium launch was denied by the sandbox; TypeScript; and full React/Vitest 180/180. The visual product matrix may remain red until Tasks 6 and 9-14. Task 6 is next.

**Task 5 staging allowlist and commit**

```bash
git add -- apps/web/src/ui/brand-assets.ts apps/web/src/ui/brand-assets.test.ts apps/web/src/styles/reset.css apps/web/src/styles/tokens.css apps/web/src/styles/base.css apps/web/src/styles/shell.css apps/web/src/styles/utilities.css apps/web/src/styles/responsive.css apps/web/src/styles/style-ownership.test.ts apps/web/src/styles/app.css apps/web/vite.config.ts apps/web/src/sw.ts apps/web/src/offline/sw-policy.test.ts apps/web/scripts/assert-app-shell-artifact.mjs apps/web/scripts/assert-http-artifact.mjs apps/web/tests/e2e/brand-app-shell-restart.spec.ts apps/web/playwright.config.ts apps/web/package.json docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): establish layered brand system"
git push origin HEAD
```

---

### Task 6: Build The Presentational Role Selection And Application Shell

This task is presentational. It accepts identity/session presentation as props and does not claim normal OIDC integration before Task 7.

**Files**

- Create `apps/web/src/ui/role-select-page.tsx`
- Create `apps/web/src/ui/role-select-page.test.tsx`
- Create `apps/web/src/ui/application-shell.tsx`
- Create `apps/web/src/ui/application-shell.test.tsx`
- Create `apps/web/src/ui/role-navigation.tsx`
- Create `apps/web/src/ui/role-navigation.test.tsx`
- Create `apps/web/src/ui/application-topbar.tsx`
- Create `apps/web/src/ui/application-topbar.test.tsx`
- Create `apps/web/src/ui/mobile-navigation.tsx`
- Create `apps/web/src/ui/candidate-boundary.tsx`
- Modify `apps/web/src/features/shared/workspace-shell.tsx`
- Modify `apps/web/src/app/router.tsx`
- Modify `apps/web/src/app/router.test.tsx`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Presentational contracts**

```ts
export interface ShellIdentityPresentation {
  mode: "demo-role-switch" | "canonical-test-role-switch" | "oidc-session";
  displayName: string;
  organizationLabel: string;
  activeRole: Role;
  availableRoles: readonly Role[];
}

export interface ApplicationShellProps {
  identity: ShellIdentityPresentation;
  activeRouteId: ReactSurfaceId;
  onRoleRequest(role: Role): void;
  onLogout(): void;
  notificationState:
    | { kind: "local"; unreadCount: number; onOpen(): void }
    | { kind: "unavailable"; reason: string };
}
```

- Role selection matches the root navy visual panel/light selector composition, accepted mark/texture, purpose copy, eight deterministic role cards in demo/canonical mode, keyboard focus, and responsive stacking.
- Primary navigation is derived only from the typed registry. Contextual detail routes never appear as primary items; their `parentId` remains active.
- Profile menu shows supplied display name, organization, active role, and a working logout callback.
- Demo/canonical notification control opens explicit local UI state. Normal HTTP uses `unavailable` and is hidden or disabled with the exact reason: “Notification delivery is not connected in this candidate.”
- A disabled control remains focusable only when needed to expose its reason; otherwise it is omitted. Dropdown-looking controls use a real menu/listbox interaction.
- Mobile navigation traps no focus, restores focus to the opener, closes on Escape/selection, and does not hide the primary action.
- Candidate boundary says `Candidate-only` and `No production-readiness claim` without obscuring work.

**Red/green cycle**

- [x] Add failing tests for all eight role cards, registry order, icon keys, contextual route active parent, profile menu, logout callback, notification local/unavailable modes, mobile focus/Escape, 44 px touch targets, and every visible control.
- [x] Add failing semantic/geometry assertions for root and one shell route at all three viewports.
- [x] Run:

  ```bash
  npm --prefix apps/web test -- src/ui/role-select-page.test.tsx src/ui/application-shell.test.tsx src/ui/role-navigation.test.tsx src/ui/application-topbar.test.tsx src/app/router.test.tsx
  AVIA_VISUAL_REGIONS=shell npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: current minimal role page/shell fails composition and control contracts.
- [x] Implement the presentational shell and adapt `WorkspaceShell` as a compatibility wrapper that delegates to it. Do not read `/auth/session` or infer normal roles here.
- [x] Run:

  ```bash
  npm --prefix apps/web test -- src/ui/role-select-page.test.tsx src/ui/application-shell.test.tsx src/ui/role-navigation.test.tsx src/ui/application-topbar.test.tsx src/app/router.test.tsx
  npm --prefix apps/web run typecheck
  AVIA_VISUAL_REGIONS=shell npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: role-select and strict shell regions pass; content regions for unmigrated feature tasks may remain recorded red.

  Result 2026-07-21: red tests first failed on missing `role-select-page`, `application-shell`, `role-navigation`, and `application-topbar` modules, the current root route lacking the new `role-select-panel`, and the shell visual checkpoint lacking the role-selection panel after the local Vite server run was retried outside the macOS sandbox. The implemented slice adds presentational role selection, registry-derived role navigation, application topbar, mobile navigation, candidate boundary, and an `ApplicationShell` adapter used by the existing `WorkspaceShell` without reading `/auth/session` or claiming normal OIDC. Fresh green gates passed: focused React/Vitest 14/14; TypeScript; shell visual checkpoint 6/6 across desktop, tablet, and mobile; full React/Vitest 191/191; and a focused process query found no leftover Playwright/Chromium/Vite process. Task 7 is next.

**Task 6 staging allowlist and commit**

```bash
git add -- apps/web/src/ui/role-select-page.tsx apps/web/src/ui/role-select-page.test.tsx apps/web/src/ui/application-shell.tsx apps/web/src/ui/application-shell.test.tsx apps/web/src/ui/role-navigation.tsx apps/web/src/ui/role-navigation.test.tsx apps/web/src/ui/application-topbar.tsx apps/web/src/ui/application-topbar.test.tsx apps/web/src/ui/mobile-navigation.tsx apps/web/src/ui/candidate-boundary.tsx apps/web/src/features/shared/workspace-shell.tsx apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): rebuild candidate application shell"
git push origin HEAD
```

---

### Task 7: Integrate Normal OIDC Session, Route Authority, And Offline Subjects

**Files**

- Create `apps/web/src/auth/session-client.ts`
- Create `apps/web/src/auth/session-client.test.ts`
- Create `apps/web/src/auth/session-provider.tsx`
- Create `apps/web/src/auth/session-provider.test.tsx`
- Create `apps/web/src/auth/http-auth-gate.tsx`
- Create `apps/web/src/auth/login-page.tsx`
- Create `apps/web/src/auth/role-guard.tsx`
- Create `apps/web/src/auth/role-handoff.tsx`
- Create `apps/web/src/auth/role-authorization.test.tsx`
- Create `apps/web/src/auth/offline-subject-boundary.test.tsx`
- Modify `apps/web/src/app/providers.tsx`
- Modify `apps/web/src/app/bootstrap.tsx`
- Modify `apps/web/src/app/router.tsx`
- Modify `apps/web/src/app/router.test.tsx`
- Modify `apps/web/src/app/scenario-context.tsx`
- Modify `apps/web/src/app/scenario-context.offline.test.tsx`
- Modify `apps/web/src/features/inspections/audit-detail-page.tsx`
- Modify `apps/web/src/features/checklists/checklist-runner-page.tsx`
- Modify `apps/web/src/entry/demo.tsx`
- Modify `apps/web/src/entry/http-test.tsx`
- Modify `apps/web/src/entry/http.tsx`
- Modify `apps/web/src/backend/http-backend.ts`
- Modify `apps/web/src/backend/http-backend.test.ts`
- Modify `apps/web/src/offline/field-repository.ts`
- Modify `apps/web/tests/offline/field-repository.test.ts`
- Create `apps/web/tests/e2e/oidc-session.spec.ts`
- Modify `apps/web/tests/e2e/offline-sync.http.spec.ts`
- Modify `apps/web/playwright.config.ts`
- Modify `apps/web/package.json`
- Create `scripts/test-http-oidc-profile.sh`
- Modify `scripts/test-http-profile.sh`
- Modify `deploy/local/keycloak/realm.json`
- Modify `apps/api/cmd/api/main.go`
- Modify `apps/api/internal/platform/config/config.go`
- Modify `apps/api/internal/platform/config/config_test.go`
- Modify `apps/api/internal/testprofile/canonical.go`
- Modify `apps/api/internal/identity/principal.go`
- Modify `apps/api/internal/identity/principal_test.go`
- Modify `apps/api/internal/platform/session/manager.go`
- Modify `apps/api/internal/platform/session/session_test.go`
- Modify `apps/api/internal/httpapi/auth.go`
- Modify `apps/api/internal/httpapi/auth_test.go`
- Modify this plan

**Session and routing interfaces**

```ts
export type IdentityMode =
  | "demo-role-switch"
  | "canonical-test-role-switch"
  | "oidc-session";

export interface SessionProjection {
  subjectId: string;
  displayName: string;
  organizationId: string;
  roles: Role[];
}

export type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; session: SessionProjection; activeRole: Role }
  | { status: "unavailable"; message: string }
  | { status: "expired" };

export interface SessionClient {
  get(signal?: AbortSignal): Promise<SessionProjection>;
  login(returnTo: string): void;
  logout(): Promise<void>;
  csrfToken(): string | null;
}

export interface HttpBackendDependencies {
  fetchImplementation?: typeof fetch;
  csrfToken?: () => string | null;
  requestTimeoutMs?: number;
  onAuthenticationLost?: (error: BackendAuthenticationError) => void;
}
```

- `onAuthenticationLost` fires once for any protected read or mutation `401` before the error reaches the page.
- On authentication loss/logout/user switch: abort active requests, call `queryClient.clear()`, discard in-memory scenario/projection state by remounting it with the authenticated subject key, and render no stale protected DOM.
- `ScenarioProvider` is inside the successful authentication gate in normal HTTP. Demo/canonical modes retain deterministic providers.
- Every protected route uses `RoleGuard` before its element mounts or fetches. Test every one of the 16 protected registry routes with its allowed role, one disallowed role, and a direct URL. Test `/` separately for each identity mode.
- `RoleHandoff` switches Backend/subject and navigates only in demo/canonical mode. In normal OIDC it navigates only if the session contains the target role; otherwise render a noninteractive next-owner state or disabled control with a reason.
- Unknown/unsupported/empty roles fail closed. A `returnTo` value must be a same-origin registered path.

**Offline subject contract**

- `ApplicationRuntime` receives subject-bound `fieldRepositoryForSubject` and `inspectionAttachmentStoreForSubject` factories.
- Normal HTTP obtains the subject only from `SessionProjection.subjectId`. Demo/canonical uses its explicit fixed test subject mapping.
- `AuditDetailPage`, `ChecklistRunnerPage`, `ScenarioProvider`, and HTTP sync fixtures must remove `USR-INSPECTOR-AMINA` constants from runtime authority decisions. Demo may keep that value only in its explicit mock subject map; canonical Inspector and normal OIDC use the pinned UUID.
- Before subject A is replaced or logged out, await `fieldRepositoryForSubject(A).lockSubject("USER_SWITCH" | "LOGOUT")`.
- Locking preserves packages, responses, Potential Finding drafts, attachments, outbox, and sync metadata. Subject B queries cannot see subject A rows or OPFS paths.
- Relogin as subject A may recover pending state through existing readiness/grant checks. No automatic deletion is added.

**Separate HTTP lanes**

- Preserve `scripts/test-http-profile.sh` as canonical-header authentication with:
  - `AVIA_ENABLE_CANONICAL_SEED=true`;
  - `AVIA_ENABLE_CANONICAL_TEST_PROFILE=true`;
  - canonical test token and role headers.
- Add `scripts/test-http-oidc-profile.sh` with:
  - `AVIA_ENABLE_CANONICAL_SEED=true`;
  - `AVIA_ENABLE_CANONICAL_TEST_PROFILE=false`;
  - no canonical token/header;
  - callback `http://127.0.0.1:4174/auth/callback` through the Vite `/auth` proxy;
  - normal `src/entry/http.tsx`;
  - Keycloak UI login and Secure session/CSRF cookies.
- Add exact package script:

  ```json
  "test:e2e:oidc": "AVIA_E2E_PROFILE=oidc playwright test --project=oidc"
  ```

  `scripts/test-http-oidc-profile.sh` invokes this script only after its API/worker/dependency readiness checks pass.
- `AVIA_ENABLE_CANONICAL_SEED` is test-only and forbidden in production. Canonical seed reset/IDs are no longer conditional on enabling canonical-header authentication.
- Configuration validation requires the seed flag to run only in `test`, requires canonical-header mode to enable the seed explicitly, keeps the canonical token conditional on canonical-header mode, and permits deterministic scanner/server-managed local object-store CORS only in these test lanes. Every seed/test flag remains forbidden in production.
- Pin `testprofile.CanonicalInspectorSubjectID` to UUID `154ec5ac-6f97-4f55-916f-d2f142fc6211`. Use that exact ID in the seed, canonical Inspector header fixture, Keycloak imported user `id`, inspection/question assignment, session reference, and offline grant. Set the Keycloak organization claim to exact `CAA`. The browser test asserts `/auth/session` returns the same subject and a nonempty Inspector assignment.
- Keycloak retains `registrationAllowed: false`, `resetPasswordAllowed: false`, direct grants disabled, PKCE S256, and exact local callback/post-logout allowlists for `127.0.0.1:4174`. Do not add wildcards outside that local origin.
- Keep Secure/HttpOnly/SameSite cookies. Do not weaken cookie flags to make the local lane pass.

**Red/green cycle**

- [ ] Add failing React tests for session states, safe projection, same-origin login, CSRF cookie parsing, logout, read/mutation `401` callback, stale DOM clearing, 16 route matrices, contextual handoff, and no normal role fabrication.
- [ ] Add failing offline tests for logout/user switch lock, subject-B invisibility, pending record preservation, and subject-A recovery.
- [ ] Add failing Go tests for `displayName`, no token/cookie/secret serialization, seed/auth flag independence, production rejection, stable OIDC subject alignment, and callback return.
- [ ] Add the OIDC browser spec:
  1. unauthenticated normal HTTP shows branded sign-in and no protected content;
  2. click organization sign-in;
  3. authenticate `inspector.local` through the local Keycloak form;
  4. callback to `4174` and assert safe `/auth/session`;
  5. render only Inspector primary navigation;
  6. direct-load a disallowed Lead route and prove no Lead fetch/content;
  7. execute one existing CSRF-protected Inspector checkout/checklist mutation;
  8. prove real server-time expiry in Go tests; in browser/unit integration, make separate protected read and mutation calls return `401` from an expired/revoked session fixture and prove clearing before either page can retain protected DOM;
  9. log in again, log out normally, and assert `/auth/session` returns `401`;
  10. assert no registration/reset/password-management link.
- [ ] Run red:

  ```bash
  npm --prefix apps/web test -- src/auth src/app/router.test.tsx src/app/scenario-context.offline.test.tsx src/backend/http-backend.test.ts tests/offline/field-repository.test.ts
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test ./internal/httpapi ./internal/platform/session ./internal/identity ./internal/platform/config
  ```

  Expected red: auth/session modules, callback, route guards, and seed flag are absent.
- [ ] Implement the central session state, route guards/handoffs, subject lock/remount, safe Go projection, deterministic flag separation, and local fixture alignment.

  ```bash
  mkdir -p apps/web/src/auth
  ```

  Create/edit all files through `apply_patch`.
- [ ] Set and verify the new script’s executable mode:

  ```bash
  chmod 0755 scripts/test-http-oidc-profile.sh
  test -x scripts/test-http-oidc-profile.sh
  ```

- [ ] Run focused green:

  ```bash
  npm --prefix apps/web test -- src/auth src/app/router.test.tsx src/app/scenario-context.offline.test.tsx src/backend/http-backend.test.ts tests/offline/field-repository.test.ts
  npm --prefix apps/web run typecheck
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -count=1 ./internal/httpapi ./internal/platform/session ./internal/identity ./internal/platform/config ./internal/testprofile
  ./scripts/test-http-profile.sh
  ./scripts/test-http-oidc-profile.sh
  ```

  Expected green: canonical and real OIDC lanes both pass independently; no normal-session role switch or stale subject data appears.

**Task 7 staging allowlist and commit**

```bash
git add -- apps/web/src/auth/session-client.ts apps/web/src/auth/session-client.test.ts apps/web/src/auth/session-provider.tsx apps/web/src/auth/session-provider.test.tsx apps/web/src/auth/http-auth-gate.tsx apps/web/src/auth/login-page.tsx apps/web/src/auth/role-guard.tsx apps/web/src/auth/role-handoff.tsx apps/web/src/auth/role-authorization.test.tsx apps/web/src/auth/offline-subject-boundary.test.tsx apps/web/src/app/providers.tsx apps/web/src/app/bootstrap.tsx apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src/app/scenario-context.tsx apps/web/src/app/scenario-context.offline.test.tsx apps/web/src/features/inspections/audit-detail-page.tsx apps/web/src/features/checklists/checklist-runner-page.tsx apps/web/src/entry/demo.tsx apps/web/src/entry/http-test.tsx apps/web/src/entry/http.tsx apps/web/src/backend/http-backend.ts apps/web/src/backend/http-backend.test.ts apps/web/src/offline/field-repository.ts apps/web/tests/offline/field-repository.test.ts apps/web/tests/e2e/oidc-session.spec.ts apps/web/tests/e2e/offline-sync.http.spec.ts apps/web/playwright.config.ts apps/web/package.json scripts/test-http-oidc-profile.sh scripts/test-http-profile.sh deploy/local/keycloak/realm.json apps/api/cmd/api/main.go apps/api/internal/platform/config/config.go apps/api/internal/platform/config/config_test.go apps/api/internal/testprofile/canonical.go apps/api/internal/identity/principal.go apps/api/internal/identity/principal_test.go apps/api/internal/platform/session/manager.go apps/api/internal/platform/session/session_test.go apps/api/internal/httpapi/auth.go apps/api/internal/httpapi/auth_test.go docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(auth): integrate normal oidc session"
git push origin HEAD
```

---

### Task 8: Build Shared Oversight Workbench Primitives

**Files**

- Create `apps/web/src/ui/workbench/page-header.tsx`
- Create `apps/web/src/ui/workbench/fact-grid.tsx`
- Create `apps/web/src/ui/workbench/status-pill.tsx`
- Create `apps/web/src/ui/workbench/data-register.tsx`
- Create `apps/web/src/ui/workbench/mobile-record-card.tsx`
- Create `apps/web/src/ui/workbench/lifecycle-stepper.tsx`
- Create `apps/web/src/ui/workbench/decision-panel.tsx`
- Create `apps/web/src/ui/workbench/due-state.tsx`
- Create `apps/web/src/ui/workbench/empty-error-state.tsx`
- Create `apps/web/src/ui/workbench/workbench-primitives.test.tsx`
- Create `apps/web/src/styles/primitives.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/features/shared/workspace-shell.tsx`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Primitive contracts**

- `PageHeader` keeps purpose, owner/next-action/status/Due Date context, and one primary action in the first viewport.
- `FactGrid` uses semantic `dl/dt/dd` and a stable mobile order.
- `DataRegister` renders a semantic table at desktop and explicit record cards at the configured responsive boundary; it never hides right-hand decision fields.
- `LifecycleStepper` receives typed stages and an explicit current stage. It cannot infer Finding closure from CAP acceptance.
- `DecisionPanel` receives typed, authorized actions and explicit pending/error/success state. It cannot render an action without a handler or disabled reason.
- `DueState` uses `Due Date`, `Due Soon`, and `Overdue` language.
- Error/empty/loading states preserve page identity and do not leak another role’s last data.

**Red/green cycle**

- [ ] Add failing RTL tests for semantics, keyboard/focus, responsive card field preservation, lifecycle rules, disabled reasons, pending double-submit prevention, status text+icon, and accessibility names.
- [ ] Add geometry gallery states to the visual spec for table, cards, stepper, dossier, decision panel, and error/empty state.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/ui/workbench/workbench-primitives.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  ```

  Expected red: primitives and owned layer are absent.
- [ ] Implement primitives and import `primitives.css` with `layer(primitives)` before all feature imports.

  ```bash
  mkdir -p apps/web/src/ui/workbench
  ```

  Create/edit all files through `apply_patch`.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/ui/workbench/workbench-primitives.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  ```

  Expected green: primitive tests and gallery geometry pass; feature screenshot comparisons remain owned by Tasks 9-14.

**Task 8 staging allowlist and commit**

```bash
git add -- apps/web/src/ui/workbench/page-header.tsx apps/web/src/ui/workbench/fact-grid.tsx apps/web/src/ui/workbench/status-pill.tsx apps/web/src/ui/workbench/data-register.tsx apps/web/src/ui/workbench/mobile-record-card.tsx apps/web/src/ui/workbench/lifecycle-stepper.tsx apps/web/src/ui/workbench/decision-panel.tsx apps/web/src/ui/workbench/due-state.tsx apps/web/src/ui/workbench/empty-error-state.tsx apps/web/src/ui/workbench/workbench-primitives.test.tsx apps/web/src/styles/primitives.css apps/web/src/styles/app.css apps/web/src/features/shared/workspace-shell.tsx apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): add oversight workbench primitives"
git push origin HEAD
```

### Task 9: Migrate Inspector Assignments, Audit Detail, And Checklist Runner

**Files**

- Modify `apps/web/src/features/assignments/inspector-assignments-page.tsx`
- Create `apps/web/src/features/assignments/inspector-assignments-page.test.tsx`
- Modify `apps/web/src/features/inspections/audit-detail-page.tsx`
- Create `apps/web/src/features/inspections/audit-detail-page.test.tsx`
- Modify `apps/web/src/features/checklists/checklist-runner-page.tsx`
- Create `apps/web/src/features/checklists/checklist-runner-page.test.tsx`
- Create `apps/web/src/styles/features/inspector.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/app/scenario-context.tsx`
- Modify `apps/web/src/app/scenario-context.offline.test.tsx`
- Modify `apps/web/tests/e2e/canonical-scenario.spec.ts`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/offline-startup.spec.ts`
- Modify `apps/web/tests/e2e/offline-sync.http.spec.ts`
- Modify `apps/web/tests/e2e/attachment-restart-recovery.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- Assignments render a root-compatible attention header, decision-first register, and mobile cards with Audit, organization, status, Due Date, due state, and next action.
- Audit Detail renders a dossier with organization, inspection type, status, assigned Inspector, Due Date, checklist/package state, offline eligibility, and one real path to the runner.
- Checklist Runner preserves all six canonical Cabin questions, configured references, expected Evidence, exact response controls, required comment rules, selected Inspection Attachment filename, local-save/server-ack distinction, offline readiness, sync/conflict status, and Potential Finding creation.
- Local writes remain atomic through `FieldRepository`. A pending local command is never styled as globally accepted.
- Potential Finding creation remains an Inspector field action; conversion is absent. Inspector handoff to Lead uses `RoleHandoff`, not an unconditional cross-role link.
- No New Inspection Planning Intake or unrelated legacy control is added.

**Red/green cycle**

- [ ] Add failing RTL tests for direct load, owner/next-action/status/Due Date, register/mobile equivalence, required comments, real select/radio behavior, attachment filename, local/server state, conflict recovery, and Potential Finding handoff.
- [ ] Extend browser tests for online mock, canonical HTTP, stopped-origin recovery, lost acknowledgement, stale revision, pending outbox, subject relogin, and no cross-role direct link.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/assignments/inspector-assignments-page.test.tsx src/features/inspections/audit-detail-page.test.tsx src/features/checklists/checklist-runner-page.test.tsx src/app/scenario-context.offline.test.tsx
  npm --prefix apps/web run test:e2e:mock
  AVIA_VISUAL_SURFACES=inspector-home,audit-detail,checklist-runner npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: accepted hierarchy/geometry and new tests fail against current pages.
- [ ] Migrate composition with shared primitives and `inspector.css` only. Do not add selectors to `shell.css` or copy root CSS.

  ```bash
  mkdir -p apps/web/src/styles/features
  ```

  Create/edit all files through `apply_patch`. Later feature tasks reuse this exact directory and create only their named stylesheet.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/assignments/inspector-assignments-page.test.tsx src/features/inspections/audit-detail-page.test.tsx src/features/checklists/checklist-runner-page.test.tsx src/app/scenario-context.offline.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  npm --prefix apps/web run test:e2e:offline
  AVIA_VISUAL_SURFACES=inspector-home,audit-detail,checklist-runner npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: three Inspector routes pass mock/HTTP/offline and three-viewport parity without weakening shared thresholds.

**Task 9 staging allowlist and commit**

```bash
git add -- apps/web/src/features/assignments/inspector-assignments-page.tsx apps/web/src/features/assignments/inspector-assignments-page.test.tsx apps/web/src/features/inspections/audit-detail-page.tsx apps/web/src/features/inspections/audit-detail-page.test.tsx apps/web/src/features/checklists/checklist-runner-page.tsx apps/web/src/features/checklists/checklist-runner-page.test.tsx apps/web/src/styles/features/inspector.css apps/web/src/styles/app.css apps/web/src/app/scenario-context.tsx apps/web/src/app/scenario-context.offline.test.tsx apps/web/tests/e2e/canonical-scenario.spec.ts apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/offline-startup.spec.ts apps/web/tests/e2e/offline-sync.http.spec.ts apps/web/tests/e2e/attachment-restart-recovery.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate inspector workbench"
git push origin HEAD
```

---

### Task 10: Migrate Lead Potential Finding, Finding, CAP, And Evidence Review

**Files**

- Modify `apps/web/src/features/findings/lead-review-page.tsx`
- Create `apps/web/src/features/findings/lead-review-page.test.tsx`
- Modify `apps/web/src/features/findings/finding-detail-page.tsx`
- Create `apps/web/src/features/findings/finding-detail-page.test.tsx`
- Modify `apps/web/src/features/caps/cap-review-page.tsx`
- Create `apps/web/src/features/caps/cap-review-page.test.tsx`
- Modify `apps/web/src/features/evidence/evidence-review-page.tsx`
- Create `apps/web/src/features/evidence/evidence-review-page.test.tsx`
- Create `apps/web/src/styles/features/lead-review.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/app/scenario-context.tsx`
- Modify `apps/web/src/app/canonical-scenario.contract.test.ts`
- Modify `apps/web/tests/e2e/canonical-scenario.spec.ts`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- Lead home loads `potentialFindings.list({status: "PENDING_LEAD_REVIEW"})` on entry and `get` for selection. Empty state means no authorized persisted records, not “nothing happened in this React session.”
- Potential Finding decisions remain Return, Dismiss, and Convert. Return/Dismiss require a reason; Convert requires severity and explicit CAP/Evidence requirements. Only Lead renders/calls them.
- Finding Detail loads `findings.get` directly and displays all canonical finding facts, lifecycle, owner, next action, Due Date, organization, audit, severity, configured reference, and finding basis.
- CAP Review loads Finding plus `caps.listRevisions` and `caps.getRevision`. It shows every submitted field, revision number/history, latest public review state, separate `Comment to Auditee` and `Internal CAA Note` inputs, and reason-required reject/more-information actions. It never relies on `projection.capSubmission`.
- Evidence Review loads `evidence.listVersions` and Finding directly, preserves immutable versions/scan/review states, requires a reason where configured, and makes authorized closure separate and explicit.
- CAP acceptance text must say the Finding remains open and Evidence is required where applicable. Evidence acceptance alone does not bypass verification/authorized closure.
- All direct routes work after refresh/new authenticated browser state. Cross-role handoffs use `RoleHandoff`.

**Red/green cycle**

- [ ] Add failing tests for fresh direct load of all four routes, persisted Potential Finding queue, no session-history dependency, two CAP revisions, immutable old values, CAA/Auditee shape distinction, reason requirements, no premature closure, Evidence version history, and forbidden roles.
- [ ] Add mock/HTTP browser replay from checklist Potential Finding through Lead conversion, CAP review, Evidence review, and authorized closure. Reload the Lead home and CAP route before decision.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/findings/lead-review-page.test.tsx src/features/findings/finding-detail-page.test.tsx src/features/caps/cap-review-page.test.tsx src/features/evidence/evidence-review-page.test.tsx src/app/canonical-scenario.contract.test.ts
  AVIA_VISUAL_SURFACES=lead-home,finding-detail,cap-review,evidence-review npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: current Lead/CAP pages depend on in-memory scenario state and lack accepted composition.
- [ ] Replace those read dependencies with Task 2 Backend reads and migrate with shared primitives/`lead-review.css`.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/findings/lead-review-page.test.tsx src/features/findings/finding-detail-page.test.tsx src/features/caps/cap-review-page.test.tsx src/features/evidence/evidence-review-page.test.tsx src/app/canonical-scenario.contract.test.ts src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  AVIA_VISUAL_SURFACES=lead-home,finding-detail,cap-review,evidence-review npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: four Lead routes direct-load from Backend, protect authority/versioning, and pass three-viewport parity.

**Task 10 staging allowlist and commit**

```bash
git add -- apps/web/src/features/findings/lead-review-page.tsx apps/web/src/features/findings/lead-review-page.test.tsx apps/web/src/features/findings/finding-detail-page.tsx apps/web/src/features/findings/finding-detail-page.test.tsx apps/web/src/features/caps/cap-review-page.tsx apps/web/src/features/caps/cap-review-page.test.tsx apps/web/src/features/evidence/evidence-review-page.tsx apps/web/src/features/evidence/evidence-review-page.test.tsx apps/web/src/styles/features/lead-review.css apps/web/src/styles/app.css apps/web/src/app/scenario-context.tsx apps/web/src/app/canonical-scenario.contract.test.ts apps/web/tests/e2e/canonical-scenario.spec.ts apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate lead review workspaces"
git push origin HEAD
```

---

### Task 11: Migrate The Auditee Corrective Action Workspace

**Files**

- Modify `apps/web/src/features/caps/auditee-cap-page.tsx`
- Create `apps/web/src/features/caps/auditee-cap-page.test.tsx`
- Modify `apps/web/src/features/caps/auditee-projection.tsx`
- Modify `apps/web/src/features/caps/auditee-projection.test.tsx`
- Create `apps/web/src/styles/features/auditee.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/src/app/scenario-context.tsx`
- Modify `apps/web/tests/e2e/canonical-scenario.spec.ts`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- The page loads authorized Findings, CAP revisions, and Evidence versions from Backend on direct entry; organization name comes from session/authorized projections, never hardcoded role switching.
- It presents My Findings, CAA request summary, Finding facts, lifecycle, CAP form/revision history, Evidence versions/selected filename, Due Date/status/owner/next action, and CAA-visible review comments.
- CAP form preserves root cause, corrective action, preventive action, responsible person, target completion date, and Comment to CAA. Revisions remain immutable and prior values stay visible.
- Official Evidence submission stays online-first through the existing bounded upload/version Backend. In demo it is explicitly marked deterministic; in normal HTTP it is real candidate HTTP behavior. It is not called a mock upload in normal HTTP.
- `Internal CAA Note`, CAA workload, internal risk, other organizations, enforcement deliberations, reviewer-private identity, and unrelated report state are absent from both object shape and DOM.
- Other-organization IDs return forbidden/not-found without rendering stale Fly Namibia data.
- Handoffs to CAA are noninteractive next-owner state in one-role normal OIDC and `RoleHandoff` in demo/canonical mode.

**Red/green cycle**

- [ ] Add failing tests for direct load, own-org list, other-org isolation, structural `internalCaaNote` absence using `Object.hasOwn`/serialized transport, full CAP fields/revisions, Evidence history, online-only control state, and exact handoff behavior.
- [ ] Extend canonical browser scenario with refresh before CAP submission, refresh after submission, second CAP revision after more information, and privacy DOM/network assertions.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/caps/auditee-cap-page.test.tsx src/features/caps/auditee-projection.test.tsx
  AVIA_VISUAL_SURFACES=auditee-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: current page has hardcoded scope/cross-role links and incomplete persisted CAP hydration.
- [ ] Migrate with Task 2 role-shaped reads, shared primitives, and `auditee.css`.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/caps/auditee-cap-page.test.tsx src/features/caps/auditee-projection.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  AVIA_VISUAL_SURFACES=auditee-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: Auditee route passes direct-load, organization/privacy, immutable revision, action, and visual gates.

**Task 11 staging allowlist and commit**

```bash
git add -- apps/web/src/features/caps/auditee-cap-page.tsx apps/web/src/features/caps/auditee-cap-page.test.tsx apps/web/src/features/caps/auditee-projection.tsx apps/web/src/features/caps/auditee-projection.test.tsx apps/web/src/styles/features/auditee.css apps/web/src/styles/app.css apps/web/src/app/scenario-context.tsx apps/web/tests/e2e/canonical-scenario.spec.ts apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate auditee corrective actions"
git push origin HEAD
```

---

### Task 12: Migrate Department Manager Oversight Surfaces

**Files**

- Modify `apps/web/src/features/findings/manager-dashboard-page.tsx`
- Create `apps/web/src/features/findings/manager-dashboard-page.test.tsx`
- Modify `apps/web/src/features/organizations/organization-registry-page.tsx`
- Create `apps/web/src/features/organizations/organization-registry-page.test.tsx`
- Modify `apps/web/src/features/planning/planning-workspaces.tsx`
- Create `apps/web/src/features/planning/audit-plan-calendar-page.test.tsx`
- Modify `apps/web/src/features/reports/report-preview-page.tsx`
- Create `apps/web/src/features/reports/report-preview-page.test.tsx`
- Create `apps/web/src/styles/features/management.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/release-candidate-gates.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- Dashboard answers where the department is exposed, delayed, or overloaded with the smallest useful decision set. Oversight Health Index is visibly advisory and never an automatic enforcement/closure decision.
- Organization Registry uses the authorized list projection and responsive register/cards without implying organization editing.
- Audit Plan Calendar uses authorized planning list/decide actions only. It must not render a create button, New Inspection Planning Intake, Ad Hoc/Unannounced intake, or any fake edit control because that route family is legacy-only in this plan.
- Report Preview uses the immutable report-version projection, decision history/state, finding references, and exact Department Manager authority. It does not imply issue, signature, or closure authority.
- All routes keep owner, next action, status, Due Date, organization scope, and candidate boundary visible.

**Red/green cycle**

- [ ] Add failing tests for direct load, manager-only access, KPI/advisory wording, organization register/card equivalence, planning action authority/reasons, explicit absence of intake/create, report immutable version/authority, and all visible controls.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/findings/manager-dashboard-page.test.tsx src/features/organizations/organization-registry-page.test.tsx src/features/planning/audit-plan-calendar-page.test.tsx src/features/reports/report-preview-page.test.tsx
  AVIA_VISUAL_SURFACES=manager-home,organization-registry,audit-plan,report-preview npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: accepted table/dossier composition and explicit scope assertions fail.
- [ ] Migrate four routes with shared primitives and `management.css`; do not add a write vertical.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/findings/manager-dashboard-page.test.tsx src/features/organizations/organization-registry-page.test.tsx src/features/planning/audit-plan-calendar-page.test.tsx src/features/reports/report-preview-page.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  AVIA_VISUAL_SURFACES=manager-home,organization-registry,audit-plan,report-preview npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: all four Manager routes pass authority, scope, action, responsive, and visual gates.

**Task 12 staging allowlist and commit**

```bash
git add -- apps/web/src/features/findings/manager-dashboard-page.tsx apps/web/src/features/findings/manager-dashboard-page.test.tsx apps/web/src/features/organizations/organization-registry-page.tsx apps/web/src/features/organizations/organization-registry-page.test.tsx apps/web/src/features/planning/planning-workspaces.tsx apps/web/src/features/planning/audit-plan-calendar-page.test.tsx apps/web/src/features/reports/report-preview-page.tsx apps/web/src/features/reports/report-preview-page.test.tsx apps/web/src/styles/features/management.css apps/web/src/styles/app.css apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/release-candidate-gates.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate manager oversight surfaces"
git push origin HEAD
```

---

### Task 13: Migrate Finance, General Manager, And Executive Director Surfaces

**Files**

- Modify `apps/web/src/features/planning/planning-workspaces.tsx`
- Create `apps/web/src/features/planning/finance-review-page.test.tsx`
- Create `apps/web/src/features/planning/general-manager-dashboard-page.test.tsx`
- Modify `apps/web/src/features/reports/executive-dashboard-page.tsx`
- Create `apps/web/src/features/reports/executive-dashboard-page.test.tsx`
- Create `apps/web/src/styles/features/executive-review.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/release-candidate-gates.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- Finance renders only Finance-owned plan decisions and reason-required return/reject behavior available in the existing contract.
- General Manager renders only intermediate forward/return authority and cannot issue a report or close a Finding.
- Executive Director renders only eligible final plan/report decisions. Report issue locks the immutable report version and never closes Findings.
- Each page shows current owner, next action, status, Due Date/target where applicable, revision, decision history/context, and truthful disabled states.
- Cross-role workflow continuation uses `RoleHandoff`; normal OIDC with a single role shows the next owner without impersonation.

**Red/green cycle**

- [ ] Add failing tests for exact role authority, stale revision, reason requirements, report-version immutability, no closure side effect, direct URL guard, handoff modes, and all visible actions.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/planning/finance-review-page.test.tsx src/features/planning/general-manager-dashboard-page.test.tsx src/features/reports/executive-dashboard-page.test.tsx
  AVIA_VISUAL_SURFACES=finance-home,gm-home,executive-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: root-compatible decision composition and handoff boundaries fail.
- [ ] Migrate three routes with shared primitives and `executive-review.css`.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/planning/finance-review-page.test.tsx src/features/planning/general-manager-dashboard-page.test.tsx src/features/reports/executive-dashboard-page.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  AVIA_VISUAL_SURFACES=finance-home,gm-home,executive-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: three authority workspaces pass mock/HTTP/direct-load/responsive/visual tests.

**Task 13 staging allowlist and commit**

```bash
git add -- apps/web/src/features/planning/planning-workspaces.tsx apps/web/src/features/planning/finance-review-page.test.tsx apps/web/src/features/planning/general-manager-dashboard-page.test.tsx apps/web/src/features/reports/executive-dashboard-page.tsx apps/web/src/features/reports/executive-dashboard-page.test.tsx apps/web/src/styles/features/executive-review.css apps/web/src/styles/app.css apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/release-candidate-gates.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate executive review surfaces"
git push origin HEAD
```

---

### Task 14: Migrate The Admin Checklist Template Preview

**Files**

- Modify `apps/web/src/features/admin/admin-configuration-page.tsx`
- Create `apps/web/src/features/admin/admin-configuration-page.test.tsx`
- Create `apps/web/src/styles/features/admin.css`
- Modify `apps/web/src/styles/app.css`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify this plan

**Required behavior**

- Admin route lists published versions through `listChecklistTemplateVersions`, selects one, and direct-loads its exact detail through `getChecklistTemplateVersion`.
- Desktop uses accepted register/selection plus detail preview; mobile stacks without clipping.
- Preview shows version/status/published date and Backend-provided question prompt, configured regulatory reference, expected Evidence, allowed answers, and comment rules.
- It does not render edit/publish/delete/user/role/configuration controls, draft claims, or invented question content.
- Non-Admin direct URL fails before any configuration fetch.

**Red/green cycle**

- [ ] Add failing tests for list/detail calls, direct load, exact question/reference/evidence content, Admin-only guard, responsive order, immutable preview, no editing controls, and empty/malformed error states.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/admin/admin-configuration-page.test.tsx
  AVIA_VISUAL_SURFACES=admin-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected red: current list-only contract cannot render the required detail.
- [ ] Migrate with Task 3’s detail read, shared primitives, and `admin.css`.
- [ ] Run:

  ```bash
  npm --prefix apps/web test -- src/features/admin/admin-configuration-page.test.tsx src/styles/style-ownership.test.ts
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  AVIA_VISUAL_SURFACES=admin-home npm --prefix apps/web run test:e2e:visual-parity
  ```

  Expected green: Admin route passes direct-load, authority, schema, action, responsive, and visual gates.

**Task 14 staging allowlist and commit**

```bash
git add -- apps/web/src/features/admin/admin-configuration-page.tsx apps/web/src/features/admin/admin-configuration-page.test.tsx apps/web/src/styles/features/admin.css apps/web/src/styles/app.css apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "feat(ui): migrate admin template preview"
git push origin HEAD
```

### Task 15: Enforce The Remaining-Legacy, Visible-Action, And Artifact Boundary

**Files**

- Create `apps/web/scripts/assert-parity-boundary.mjs`
- Create `apps/web/tests/e2e/visible-action-contract.spec.ts`
- Modify `apps/web/src/parity/legacy-screen-manifest.test.ts`
- Modify `apps/web/src/app/route-contracts.test.ts`
- Modify `apps/web/src/app/router.test.tsx`
- Modify `apps/web/src/app/build-profile.test.ts`
- Modify `apps/web/src/app/canonical-scenario.contract.test.ts`
- Modify `apps/web/tests/e2e/first-production-routes.spec.ts`
- Modify `apps/web/tests/e2e/release-candidate-gates.spec.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify `apps/web/playwright.config.ts`
- Modify `apps/web/package.json`
- Modify `apps/web/scripts/assert-app-shell-artifact.mjs`
- Modify `apps/web/scripts/assert-http-artifact.mjs`
- Modify `tests/parity/behavior-ledger.json`
- Modify `tests/parity/react-legacy-parity.test.mjs`
- Modify this plan

**Boundary rules**

- Router paths equal the exact 17 registry entries. No `RoleEntryPlaceholder`, placeholder route, “coming soon” page, generic card, or hidden path exists for the other 69 rows.
- The exact 69 legacy-only rows remain `reactPath: null` and have a reason/source/Product classification.
- `assert-parity-boundary.mjs` scans source imports and both build manifests. It fails if HTTP inputs/artifacts contain:
  - root `css/styles.css` or root `js/`;
  - `src/mock/`, `seed-data`, `http-test`, canonical test token/boundary, test subject maps, or root-demo state;
  - an undeclared React route or visible placeholder label;
  - a brand file not present in the semantic registry/app-shell manifest.
- Approved emitted image/font assets are allowed; runtime root code is not.
- The visible-action browser contract inventories visible `button`, `a`, `input`, `select`, `textarea`, menuitem, tab, and button-role elements on every 17 surface/viewport. Each must have a stable accessible name and one of: verified navigation, visible state change, Backend/local boundary call, form behavior, or explicit disabled reason.
- Add the visible-action spec to both `mock` and canonical `http` project test matches. The normal OIDC-only controls remain covered by Task 7’s `oidc-session.spec.ts`.
- A toast without durable state/navigation/download/form change does not satisfy the contract.
- Normal HTTP notification delivery stays hidden/disabled with its reason. Admin editing, New Inspection Planning Intake, self-registration, user provisioning, and unsupported legacy actions remain absent.

Add exact package script:

```json
"test:e2e:visible-actions": "AVIA_E2E_PROFILE=mock playwright test tests/e2e/visible-action-contract.spec.ts --project=mock"
```

**Red/green cycle**

- [ ] Add failing tests by asserting the exact registry/manifest set, source/build exclusion strings, and action inventory. Include fixture mutations that add one undeclared route, one inert button, one broad root import, and one HTTP mock import; every mutation must make the boundary test fail.
- [ ] Run:

  ```bash
  node apps/web/scripts/assert-parity-boundary.mjs
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/route-contracts.test.ts src/app/router.test.tsx src/app/build-profile.test.ts src/app/canonical-scenario.contract.test.ts
  npm --prefix apps/web run test:e2e:visible-actions
  ```

  Expected red: boundary script/action spec are absent.
- [ ] Implement the fail-closed source/build/action checks and update the behavior ledger with exact React/legacy disposition and Backend/local action ownership.
- [ ] Build both profiles and run:

  ```bash
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  npm --prefix apps/web run check:app-shell
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  node apps/web/scripts/assert-parity-boundary.mjs
  node --test tests/parity/react-legacy-parity.test.mjs
  npm --prefix apps/web run test:e2e:visible-actions
  ./scripts/test-http-profile.sh
  ```

  Expected green: exact route/action/artifact boundaries pass with approved brand assets and no hidden placeholders.

**Task 15 staging allowlist and commit**

```bash
git add -- apps/web/scripts/assert-parity-boundary.mjs apps/web/tests/e2e/visible-action-contract.spec.ts apps/web/src/parity/legacy-screen-manifest.test.ts apps/web/src/app/route-contracts.test.ts apps/web/src/app/router.test.tsx apps/web/src/app/build-profile.test.ts apps/web/src/app/canonical-scenario.contract.test.ts apps/web/tests/e2e/first-production-routes.spec.ts apps/web/tests/e2e/release-candidate-gates.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts apps/web/playwright.config.ts apps/web/package.json apps/web/scripts/assert-app-shell-artifact.mjs apps/web/scripts/assert-http-artifact.mjs tests/parity/behavior-ledger.json tests/parity/react-legacy-parity.test.mjs docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "test(ui): enforce parity scope boundary"
git push origin HEAD
```

---

### Task 16: Run The Full Candidate Matrix And Prepare Stakeholder Handoff

**Files**

- Create `docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.md`
- Create `docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.turkce.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.md`
- Modify `docs/demo-evidence/BUILD_SUMMARY.turkce.md`
- Modify `docs/index.md`
- Modify `MANIFEST.md`
- Modify `docs/exec-plans/index.md`
- Modify `docs/exec-plans/tech-debt-tracker.md`
- Modify `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Modify this plan

The evidence filenames use the planned verification date. If Task 16 executes after 2026-07-21, do not backdate evidence: first make a reviewed plan amendment replacing both exact filenames and all references with the actual execution date.

**Required matrix**

- [ ] **Clean install and generated-contract gate**

  ```bash
  npm --prefix apps/web ci
  ./scripts/check-contracts.sh
  ./scripts/check-sqlc.sh
  node api/openapi/tests/contract-examples.test.mjs
  ```

- [ ] **Go authority/security gate**

  ```bash
  GOCACHE=/private/tmp/aviasurveil360-parity-go-cache go -C apps/api test -race -p 1 -count=1 ./...
  ```

- [ ] **React/unit/contract/build gate**

  ```bash
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  npm --prefix apps/web run check:app-shell
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  node apps/web/scripts/assert-parity-boundary.mjs
  node apps/web/scripts/verify-visual-baselines.mjs
  ```

- [ ] **Root oracle and parity ledger gate**

  ```bash
  node --test tests/*.test.js tests/parity/react-legacy-parity.test.mjs
  ```

- [ ] **Mock browser gate**

  ```bash
  npm --prefix apps/web run test:e2e:mock
  npm --prefix apps/web run test:e2e:visible-actions
  ```

- [ ] **Canonical-header HTTP gate**

  ```bash
  ./scripts/test-http-profile.sh
  ```

- [ ] **Normal OIDC session gate**

  ```bash
  ./scripts/test-http-oidc-profile.sh
  ```

- [ ] **Real offline/recovery gate**

  ```bash
  npm --prefix apps/web run test:e2e:offline
  ./scripts/test-local-recovery.sh
  ```

- [ ] **51-pair visual gate**

  ```bash
  npm --prefix apps/web run test:e2e:visual-parity
  ```

  Require 17 surfaces × 3 viewports, zero missing/hash/metadata/mask/geometry failures, shell ratio at most 0.03, and only predeclared adapted regions at most 0.08.

- [ ] **Dependency gate**

  ```bash
  npm --prefix apps/web audit
  npm --prefix apps/web audit --omit=dev
  ```

  Record exact results. Do not use a broad forced upgrade to clear an unrelated advisory.

- [ ] **Manual reviewer evidence**

  Review 51 legacy/React viewport pairs plus contact sheets. For each route record source audit ID, browser metadata, baseline/React file, diff ratio, masks and masked ratio, geometry result, semantic result, visible-action result, reviewer, and disposition. Review the complete canonical lifecycle and the normal OIDC login/logout path. Manual full-page images may support review but never replace automated viewport comparisons.

- [ ] **Cleanup**

  Confirm task-owned scripts stopped their own API, worker, Vite, static server, Keycloak/PostgreSQL/object-store containers, and Playwright/Chromium processes. Do not stop unrelated user processes. Record cleanup evidence and any externally owned residue as `blocked`.

**Evidence and lifecycle rules**

- English/Turkish evidence must report exact command/result counts, the 17/69 scope reconciliation, three new read verticals, canonical versus OIDC lane results, privacy/authority/offline results, visual environment/hash/mask/ratio results, artifact exclusions, manual reviewer result, and cleanup.
- Use `verified locally` only for commands actually run and passing. Use `not run` or `blocked` literally for missing checks.
- The artifact remains `candidate-only` and `release pending`. Do not write `production-ready`.
- If all local gates pass, set this plan to `ready-for-verification` and leave stakeholder acceptance as the next todo. Do not move it to completed until the user explicitly accepts the React outcome.
- The parent plan stays `active` and points to this `ready-for-verification` remediation. Production deployment/cutover remains `blocked`.
- If any required gate fails, leave this plan `active` or mark `blocked` only for a genuine external blocker, record the exact failed gate, and do not request acceptance.

**Task 16 staging allowlist and commit**

```bash
git add -- docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.md docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.turkce.md docs/demo-evidence/BUILD_SUMMARY.md docs/demo-evidence/BUILD_SUMMARY.turkce.md docs/index.md MANIFEST.md docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
git commit -m "docs(evidence): record react legacy parity"
git push origin HEAD
```

Expected: evidence is pushed only if authorized; no deployment, branch, PR, GitHub comment, traffic, cutover, or legacy action occurs.

## Verification Matrix

| Area | Required proof |
|---|---|
| Scope truth | Exact ordered 86 audit rows; 17 `react-parity`; 69 null-path legacy rows; required Product screen crosswalk; New Inspection Planning Intake explicit |
| Read completeness | Potential Finding list/get, CAP revision list/get, Admin template detail, mock/HTTP parity, fresh direct loads |
| Route authority | All 16 protected routes allowed/disallowed/direct URL; root by identity mode; no pre-guard fetch or stale DOM |
| Normal identity | Safe session projection, stable local subject, real Keycloak UI login, session roles only, CSRF mutation, expiry, logout `401` |
| Canonical identity | Existing deterministic header lane remains isolated and green |
| Privacy | Auditee org isolation and structural Internal CAA Note omission; no workload/risk/enforcement leakage |
| Lifecycle | Lead-only Potential Finding decision; CAP not closure; immutable CAP/Evidence; Evidence/verification/authorized closure; report authority |
| Offline | Session subject binding, logout/user-switch lock, pending record preservation, other-subject invisibility, recovery |
| Visual | Tracked SHA-256 baselines, pinned environment, 51 viewport pairs, mask ≤5%, shell ≤0.03, adapted region ≤0.08, geometry/semantic checks |
| CSS/assets | One layer order, selector ownership, workbench system font, login-only DM Sans, restricted Vite asset access, stopped-origin mark/icon/font |
| Actions | Every visible control works or is disabled with exact reason; no toast-only substitute |
| Artifact | HTTP excludes root runtime/mock/seed/canonical-test; approved brand assets cached |
| Regression | Full Go, React, OpenAPI, sqlc, root, mock, HTTP, OIDC, offline, recovery, dependency gates |
| Evidence | English/Turkish exact results, literal labels, lifecycle/tracker/index reconciliation, cleanup |

## Security, Privacy, And Offline Regression Assessment

The plan adds no new write authority. The read additions are the principal security risk and therefore precede UI work with role and organization tests. CAP uses discriminated role-shaped views so Auditee serialization cannot accidentally include `Internal CAA Note`. Route guards reduce client exposure, while Go authorization remains authoritative.

Normal identity never uses canonical role headers. Session expiry clears in-memory/query projections, but offline records are locked rather than deleted. Subject IDs originate from the authenticated session in normal HTTP. Provider tokens remain encrypted/server-side and absent from React.

Offline field behavior stays limited to existing Inspector package/checklist/Potential Finding/Inspection Attachment commands. CAP, official Evidence, management, configuration, reports, and closure remain online-first. Production browser/device policy, encryption/key ownership, records retention, legal hold, monitoring, and incident response remain blocked outside this candidate.

## Visual-Parity Harness Assessment

The harness is meaningful only when source and candidate use the same pinned viewport/browser/platform/locale/time/font/image state and when the baseline is tracked and hash verified. Broad masking, full-page comparator inputs, unrecorded baseline rewrites, cross-platform drift, and threshold increases fail closed. Pixel evidence is paired with semantic and geometry assertions so a visually similar but behaviorally false screen cannot pass.

`0.08` is not a general page threshold. It is available only to a named content region whose truthful backend/session state differs from the root demo; the shell stays at `0.03`. Any new mask or ratio relaxation requires a plan revision and reviewer rationale.

## Execution And Commit-Boundary Assessment

Tasks 1-4 establish truth/contracts before visual implementation. Tasks 2-3 unblock direct-load data. Tasks 5-8 establish assets, CSS ownership, shell, session/route/offline safety, and primitives before feature edits. Tasks 9-14 own nonoverlapping feature styles and route families. Tasks 15-16 enforce scope/artifacts, then run the full matrix.

The shared router, OpenAPI/generated files, canonical scenario, `app.css`, and visual spec are intentionally sequential. Each task has a focused red state, bounded green state, exact file allowlist, cached-diff review, and an upstream-ahead check before any authorized push. Pre-existing working-tree content is never staged by a broad repository command.

## Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| User expects all 86 screens in React | 17-route result still feels incomplete | State exact outcome before execution; map all 86 and required Product screens; expand only by explicit Product plan |
| Read APIs leak internal/other-org data | Privacy breach | Role-shaped CAP union, structural omission, authorize before projection, other-org tests |
| UI still relies on scenario mutation history | Refresh/direct URL fails | Complete read verticals first; fresh-provider/direct-load tests |
| Canonical lane is mistaken for OIDC | False identity evidence | Separate flags, scripts, entries, browser tests, and evidence sections |
| OIDC fixture does not align with assignments | Empty/false test | One pinned UUID across Keycloak, seed, header fixture, assignment, session, and offline grant; assert it |
| Expiry leaves stale protected data | Cross-user exposure | Central auth-loss callback, abort, Query clear, keyed provider remount, route guard tests |
| Logout erases or exposes offline work | Data loss/privacy | Await `lockSubject`; never delete; subject-B invisibility and subject-A recovery tests |
| Masks/thresholds hide visual failure | False parity | Tracked hashes, mask selector denylist, 5% cap, integrity perturbations, plan revision for increases |
| Asset reuse imports root runtime | HTTP artifact contamination | Typed asset-only registry, restricted Vite FS, build-input scan, artifact denylist |
| CSS becomes unmaintainable | Second legacy global system | Real layers, selector ownership, feature files, system-font rule, no root import/`!important` |
| Visible controls overpromise scope | Stakeholder distrust | Browser action inventory; remove or exact disabled reason; no placeholder/intake/Admin CRUD |
| Per-task push includes unrelated work | Workspace corruption/publication | Exact add allowlist, cached name/diff check, recorded upstream/ahead set, stop on mismatch |
| Local success is presented as release | Governance error | Literal `candidate-only`/`release pending`; production gates remain blocked |

## Decision Log

| Date | Decision | Status |
|---|---|---|
| 2026-07-21 | Preserve the root Vanilla demo as visual/behavior oracle and keep the React/Go candidate architecture. | accepted for this plan |
| 2026-07-21 | Treat the 17 paths as `react-parity` surfaces, not as already backend-complete. | accepted review correction |
| 2026-07-21 | Keep 69 audit rows legacy-only for current scope, while explicitly recording required Product screens and New Inspection Planning Intake. | accepted for current candidate; not permanent removal |
| 2026-07-21 | Add Potential Finding list/get, immutable role-shaped CAP revision list/get, and Admin template detail before UI migration. | accepted review correction |
| 2026-07-21 | Separate canonical-header and normal local OIDC scripts; decouple deterministic seed from test authentication. | accepted review correction |
| 2026-07-21 | Use a typed route registry, client guard, bounded handoff, central auth-loss clearing, and subject lock. | accepted review correction |
| 2026-07-21 | Store hash-verified baselines under `apps/web/tests/visual-baselines/` with strict mask/ratio/environment gates. | accepted review correction |
| 2026-07-21 | Use one CSS layer/ownership model; authenticated workbench keeps system fonts and login alone uses DM Sans. | accepted review correction |
| 2026-07-21 | Commit/push steps are conditional on explicit execution-time authorization and must use exact allowlists/upstream checks. | binding safety rule |
| 2026-07-21 | Production deployment, cutover, Identity/MFA/provisioning, records, hosting, monitoring/on-call, and legacy removal remain blocked. | unchanged |

## Plan Self-Review Checklist

- [x] Directly addresses the complaint that React is visually unrelated to the accepted original.
- [x] Reconciles the expected 17-route outcome with a possible full-86-screen expectation.
- [x] Uses an independent ordered source for 86 rows instead of a self-validating count.
- [x] Explicitly maps required Product screens and New Inspection Planning Intake.
- [x] Corrects the false backend-connected claim and adds the three missing read projections.
- [x] Protects Potential Finding authority, immutable CAP/Evidence, organization isolation, Internal CAA Note separation, report/closure authority, and offline recovery.
- [x] Separates canonical-header and real OIDC session evidence.
- [x] Defines direct-route guards, handoffs, expiry clearing, and session-subject offline behavior.
- [x] Defines deterministic tracked visual evidence with bounded masks and integrity tests.
- [x] Defines real CSS layer/ownership boundaries and offline brand asset behavior.
- [x] Gives each task exact files, interfaces, red/green commands, staging allowlist, and commit message.
- [x] Updates Product docs/index, bilingual evidence, active index, parent status, tracker, and literal lifecycle labels.
- [x] Keeps all production/release/cutover/legacy actions blocked.
- [x] Ends with an exact Execution Prompt.

## Execution Prompt

Use `superpowers:executing-plans` and execute `docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md` exactly in its 16-task binding order. Do not dispatch subagents unless I explicitly authorize them for the execution task.

Before Task 1, read `AGENTS.md` and its complete source-of-truth reading list, then read this entire plan, the parent production-transition plan, the accepted root UI/behavior sources, and the current React/Go/OpenAPI/session/offline sources named here. Confirm the current branch/upstream/ahead set and preserve all unrelated working-tree content. Do not create, switch, rename, or delete a branch.

First freeze the independent ordered 86-screen inventory, required Product crosswalk, New Inspection Planning Intake legacy-only disposition, and typed 17-route registry. Then implement the Potential Finding list/get, immutable role-shaped CAP revision list/get, and Admin checklist-template detail read verticals before any dependent UI. Do not describe the 17 routes as already backend-connected.

Build the tracked hash-verified 51-baseline visual harness before changing the interface. Use Playwright-bundled Chromium, pinned timezone/locale/color/reduced-motion/device scale, viewport-only comparator images, font/image readiness, mask denylist and 5% cap, shell ratio no greater than 0.03, and content ratio no greater than 0.08 only for predeclared regions. Do not broaden a mask, update a baseline, or relax a threshold except through the plan’s explicit update command and a reviewed plan amendment.

Reuse only approved local brand assets through the typed registry. Keep the HTTP artifact free of root runtime CSS/JS, mock/seed, and canonical-test code. Use the binding CSS layer order, root system-font workbench stack, login-only DM Sans, shared primitives, and exact feature-owned stylesheets.

Keep canonical-header HTTP and normal OIDC HTTP separate. Normal HTTP must use the same-origin session projection, authenticated roles, route guards, CSRF, central `401` clearing, logout, bounded handoff, and session subject for IndexedDB/OPFS. Await `lockSubject` on logout/user switch without deleting pending offline work. Do not weaken cookies, expose provider tokens, add self-registration, or fabricate role membership.

Preserve Potential Finding Lead authority, CAP/Evidence separation, immutable versions, Auditee organization isolation, structural Internal CAA Note omission, report/closure authority, and explicit offline/local/server acknowledgement. Every visible control must work through Backend, an existing local/offline boundary, navigation, or visible local UI state, or be disabled with an exact reason. Do not create React placeholders or routes for the remaining 69 screens.

Run each task’s red test before implementation and its focused green tests afterward. Do not start a dependent task on a failed gate. Use the plan’s exact per-task staging allowlist, inspect staged names and the full cached diff, and check the upstream-ahead set before any commit/push. Commit and push only if my execution request explicitly authorizes those Git actions; otherwise do not stage.

At Task 16 run the complete clean-install, OpenAPI/sqlc, Go race, React, root, mock, canonical HTTP, normal OIDC, offline/recovery, visual, visible-action, artifact, dependency, reviewer, and cleanup matrix. If the execution date is later than 2026-07-21, amend the exact evidence filenames before creating evidence rather than backdating them. Produce synchronized English/Turkish evidence and reconcile this plan, the parent plan, Product/docs indexes, build summary, manifest, active index, and tracker.

The result may be labelled only `verified locally`, `candidate-only`, and `release pending` when supported. Do not claim stakeholder acceptance, deploy, route traffic, cut over, remove/archive the legacy demo, configure production Identity/MFA/provisioning, or claim `production-ready`. Production deployment, records, hosting, monitoring/on-call, disaster recovery, cutover, and legacy removal remain `blocked`.
