# React Legacy UI Parity And Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not dispatch subagents unless the user explicitly authorizes subagent work in the execution task.

**Goal:** Make the React/Go candidate recognizably and measurably match the accepted root Vanilla AviaSurveil360 interface for every currently backend-supported production surface, connect the normal HTTP build to the existing OIDC browser-session boundary, and classify every remaining legacy screen without creating inert React placeholders or silently expanding production scope.

**Architecture:** Preserve the root Vanilla application as the visual and behavioral oracle. Introduce a typed parity manifest, a dual-server screenshot harness, a React design-system layer that reuses the existing local brand assets, and a session-aware application shell shared by demo, canonical-test HTTP, and normal OIDC HTTP modes. Migrate the 17 currently backend-connected React surfaces in independently testable role slices; keep the other legacy screen states in the root demo until Product explicitly promotes a complete route family and its OpenAPI, mock, Go, authorization, React, and dual-profile tests are delivered together.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, React Router 7, TanStack Query, React Hook Form, Zod, existing capability-composed `Backend`, existing IndexedDB/OPFS/Service Worker field boundaries, Playwright 1.61, Vitest/React Testing Library, Go 1.26 modular monolith, `chi`, PostgreSQL, Keycloak OIDC, MinIO-compatible object storage, OpenAPI, and the existing root HTML/CSS/Vanilla JavaScript reference.

**Status:** `paused` — detailed plan created after the user rejected the minimal React shell as visually unrelated to the accepted root demo. Implementation must not begin until the independent plan review requested by the user returns `GO` or an accepted `CONDITIONAL GO` and the plan is revised for every Blocking finding.

## Global Constraints

- Use `AviaSurveil360` as the canonical product name.
- Treat `index.html`, `css/styles.css`, `js/`, the root Node smoke tests, and the verified root screenshot evidence as the visual and behavioral source of truth. Do not edit or remove them in this plan except for a separately accepted correction to the reference itself.
- Preserve the existing React/TypeScript/Vite application and Go modular-monolith backend. This is a controlled UI migration, not another framework or backend rewrite.
- Do not directly paste the root application's global state, `innerHTML` render functions, event delegation, or browser-local domain mutations into React. Port appearance and verified behavior into typed components and existing explicit data boundaries.
- Keep every canonical mock mutation behind `Backend`. Keep offline field writes behind the existing `FieldRepository`; do not dual-write `Backend` and `FieldRepository`.
- Preserve build-time separation: the normal HTTP artifact must not contain mock, seed, canonical-test, or root-demo application code. Shared brand assets and shared presentational components are allowed.
- Normal HTTP identity uses the existing same-origin OIDC/session/BFF boundary. Demo and canonical-test HTTP may retain explicit role selection; normal HTTP may expose only roles in the authenticated session.
- Do not add self-registration, public sign-up, invitation delivery, password management, production MFA policy, or a production identity administration surface in this plan. Local Keycloak registration remains disabled.
- Frontend route visibility is not authorization. Every HTTP read and mutation continues to rely on server-side role, organization, assignment, object, revision, and transition authorization.
- Preserve the canonical lifecycle: Checklist Response -> Potential Finding -> Lead decision -> Finding -> CAP -> Evidence -> CAA Review -> Closure. CAP acceptance is not Finding closure.
- Preserve `Comment to Auditee` and `Internal CAA Note` as separate fields and views. Auditee JSON and rendered pages must never contain Internal CAA Notes or another organization's data.
- Preserve immutable-by-version CAP, Evidence, checklist-template, and report projections. Do not overwrite prior versions for visual convenience.
- Preserve all existing offline readiness, IndexedDB, OPFS, outbox, sync, conflict, update, and recovery behavior while changing the Inspector UI.
- A visible control must perform its labelled action, navigate to a real screen, update real application state, download a real generated demo file where already supported, or be clearly disabled with a reason. Do not use inert controls or toast-only substitutes for screen behavior.
- Reuse the root demo's local DM Sans font, login texture, logo mark, Phosphor icons, navy/blue/teal/gold palette, information hierarchy, dense-but-readable workbench patterns, mobile record cards, lifecycle stepper, dossiers, and decision panels. Do not introduce a second visual direction.
- Use semantic HTML, visible focus, status text in addition to color, logical heading order, keyboard-operable navigation/dialogs, and minimum `44px` touch targets for primary and icon-only mobile actions touched by this plan.
- The parity target is controlled equivalence, not blind pixel copying: backend-shaped data, candidate boundary labels, offline state, and security/session state may differ, but shell anatomy, hierarchy, typography, spacing, component language, responsive behavior, and action placement must match the accepted reference.
- Keep the root demo available throughout implementation. Legacy removal, archival, redirect, and traffic cutover require a separate explicit user action after stakeholder acceptance.
- Work on the current branch. Do not create, switch, rename, or delete branches.
- During execution, the user has authorized one Conventional Commit and one push to `origin` after each completed task. Stage only that task's files, inspect the cached diff, commit with the message specified by the task, and push the current branch. Do not stage unrelated changes or protected untracked content.
- Preserve unrelated `.superpowers/`, `docs/demo-evidence/stakeholder/`, and `outputs/` content.
- Do not deploy, route traffic, open a PR, post GitHub comments, or claim `production-ready` in this plan.
- Keep English canonical implementation documents. Add or update a Turkish companion when a stakeholder-facing canonical product/evidence document is created or changed.
- Use evidence labels literally: `verified locally`, `not run`, `blocked`, `candidate-only`, `release pending`, and `production-ready`.

---

## Why This Plan Exists

The local candidate completed the authorized production-transition Tasks 2-13 and passed its technical matrices. Stakeholder visual acceptance did not pass: the user explicitly observed that the React interface was unrelated to the accepted original interface. The cause is concrete:

- the root demo contains an accepted branded role-selection experience, mature application shell, and 86 verified screen states;
- `apps/web/src/styles/app.css` currently provides a separate minimal visual language;
- `apps/web/src/app/router.tsx` exposes 17 concrete React surfaces, but their visual composition was built for functional parity rather than legacy visual parity;
- the normal HTTP entry creates `HttpBackend` but does not yet gate the React application on `/auth/session`, initiate `/auth/login`, expose authenticated role navigation, or provide the CSRF cookie to mutations;
- the canonical HTTP browser profile intentionally uses server-owned test subjects and is not a production login experience.

The plan therefore reopens stakeholder acceptance without invalidating the technical evidence already obtained. Existing Tasks 2-13 remain `verified locally`; this plan adds the missing visual/session acceptance layer.

## Objective

Deliver a React application that a stakeholder familiar with the root demo immediately recognizes as the same product while retaining the real backend and offline architecture:

1. Freeze the exact visual source, route disposition, and comparison rules.
2. Reuse the existing brand assets and design language in typed React primitives.
3. Replace the minimal role page and shell with the accepted original experience.
4. Integrate the normal HTTP build with the existing OIDC browser session and CSRF boundary.
5. Migrate each currently backend-supported role surface without weakening authority, isolation, lifecycle, offline, or artifact-separation rules.
6. Prove controlled visual parity at desktop, tablet, and mobile in addition to existing behavioral parity.
7. Keep every other legacy screen explicitly classified and available in the root demo until its complete vertical route family receives separate approval.

## Scope

### In Scope

- The 17 concrete React surfaces currently registered by `apps/web/src/app/router.tsx`:

  | ID | Legacy source state | React path | Backend profile |
  |---|---|---|---|
  | `role-select` | no role / `login` | `/` | demo role switch; canonical-test role switch; normal HTTP session gate |
  | `inspector-home` | Inspector / `inspector-assignments` | `/inspector/inspector-assignments` | mock + HTTP |
  | `lead-home` | Lead Inspector / `lead-review` | `/lead-inspector/lead-review` | mock + HTTP |
  | `manager-home` | Department Manager / `dashboard` | `/department-manager/dashboard` | mock + HTTP |
  | `gm-home` | General Manager / `gm-dashboard` | `/general-manager/gm-dashboard` | mock + HTTP |
  | `finance-home` | Finance / `finance-review` | `/finance/finance-review` | mock + HTTP |
  | `executive-home` | Executive Director / `executive-dashboard` | `/executive-director/executive-dashboard` | mock + HTTP |
  | `auditee-home` | Auditee / `service-provider-cap` | `/auditee/service-provider-cap` | mock + HTTP |
  | `admin-home` | Admin / `templates` | `/admin/templates` | mock + HTTP |
  | `audit-detail` | Inspector / `audit-detail`, `AUD-2026-001` | `/inspector/audits/AUD-2026-001` | mock + HTTP |
  | `checklist-runner` | Inspector / `checklist`, `AUD-2026-001` | `/inspector/audits/AUD-2026-001/checklist` | mock + HTTP + field repository |
  | `organization-registry` | Department Manager / `organizations` | `/department-manager/organizations` | mock + HTTP |
  | `audit-plan` | Department Manager / `planning` | `/department-manager/audit-plan` | mock + HTTP |
  | `finding-detail` | Lead Inspector / `finding`, `FND-CAB-2026-001` | `/lead-inspector/findings/FND-CAB-2026-001` | mock + HTTP |
  | `cap-review` | Lead Inspector / CAP review state for `FND-CAB-2026-001` | `/lead-inspector/cap-review/FND-CAB-2026-001` | mock + HTTP |
  | `evidence-review` | Lead Inspector / Evidence review state for `FND-CAB-2026-001` | `/lead-inspector/evidence-review/FND-CAB-2026-001` | mock + HTTP |
  | `report-preview` | Department Manager / `report`, canonical report | `/department-manager/reports/RPT-CAB-2026-001-V1` | mock + HTTP |

- A versioned parity/disposition manifest covering all 86 verified legacy screen states, with each row classified as `backend-connected`, `later-legacy-only`, or `demo-only-legacy`.
- A deterministic screenshot/reference harness for the 17 migrated surfaces at `1440x900`, `1024x768`, and `390x844` (51 reference/React pairs).
- Shared React branding, role-selection, shell, navigation, topbar, notification/profile affordances, responsive navigation, and common workbench primitives.
- Normal HTTP session bootstrap, login redirect, logout, authenticated role selection, CSRF cookie wiring, and expired-session recovery using the existing Go auth boundary.
- Visual and interaction migration for Inspector, Lead Inspector, Department Manager, General Manager, Finance, Executive Director, Auditee, and Admin surfaces listed above.
- Existing mock/HTTP/offline/backend contract, browser, root legacy, security, and artifact-isolation regression coverage.
- Bilingual evidence and plan/tracker reconciliation after verification.

### Out Of Scope

- Automatic migration of the other 69 legacy screen states merely to reach the number 86.
- Adding AI, advanced risk/BI, USOAP/SSP, regulatory editing, generic workflow design, enforcement case management, broad checklist editing, user provisioning, notification delivery, or other `later`/`demo-only` behavior to the HTTP artifact without a separately accepted route-family plan.
- Public self-registration, user invitation delivery, password reset, account recovery, production MFA configuration, or production user administration.
- New backend endpoints solely to make an unapproved legacy screen appear populated.
- Copying legacy global state or browser-local authorization into React.
- Changing canonical domain rules, authorization ownership, report authority, Evidence policy, offline protocol, or sync conflict policy.
- Pixel-for-pixel parity where candidate-only boundaries, backend data, browser session state, or offline state require truthful differences.
- Production deployment, production identity/provider selection, production records/storage policy, pilot routing, traffic cutover, legacy removal, or `production-ready` claims.

## Source Precedence

When two sources disagree, apply this order and record the conflict in the parity manifest:

1. Canonical product/security/data documents under `docs/product-specs/`.
2. Verified behavior in root Node tests and the latest browser-scenario evidence.
3. The latest accepted root UI in `index.html`, `css/styles.css`, and `js/`.
4. The 86-screen screenshot audit and critical canonical-scenario captures under `qa/screenshots/`.
5. Earlier execution plans or historical screenshot sets.

Visual copying never overrides authority, privacy, lifecycle, or truthful candidate boundaries.

## Acceptance Criteria

- A stakeholder can identify the React role selection, shell, navigation, typography, palette, content hierarchy, tables/cards, lifecycle, dossiers, forms, and responsive patterns as the same AviaSurveil360 product represented by the root demo.
- The 17 migrated surfaces have one typed parity-manifest row each and no duplicate `(role, legacyView, reactPath)` tuple.
- All 86 legacy screen states have one explicit disposition. Exactly 17 are `backend-connected` in this plan; the remaining 69 stay legacy-only unless a reviewed plan revision changes the accepted route inventory.
- All 51 legacy/React viewport pairs are captured. No pair is missing, blank, wrong-role, wrong-route, or affected by an unexpected console warning/error.
- Every migrated page passes semantic visual contracts for brand font, palette, shell anatomy, first-viewport owner/next-action/status/Due Date information, lifecycle/action placement, and responsive structure.
- Any automated pixel comparison uses deterministic fonts/data/browser, masks explicitly listed dynamic regions, stores its threshold per surface, and cannot pass solely because a broad mask hides the work area.
- The role-selection and shell reference targets use a strict `maxDiffPixelRatio <= 0.03`. Data-heavy pages may use `<= 0.08` only when semantic and geometry assertions also pass. A threshold exception must name the exact dynamic region and reviewer rationale in the manifest.
- No page has document-level horizontal overflow at `1440x900`, `1024x768`, or `390x844`.
- Primary and icon-only mobile controls touched by this plan expose at least one `44px` dimension, visible focus, an accessible name, and a meaningful action.
- Demo and canonical-test HTTP retain eight deterministic role entries. Normal HTTP shows a login action when unauthenticated and only authenticated session roles after login.
- Normal HTTP mutations read the `__Host-avia_csrf` cookie and send `X-CSRF-Token`; access/refresh/ID tokens never enter React state, browser storage, logs, or public configuration.
- An expired/revoked session returns to a safe login state without exposing stale protected data.
- Existing canonical Potential Finding, CAP, Evidence, closure, organization-isolation, Internal CAA Note, report, offline, sync, and artifact-exclusion tests remain green.
- The root demo remains unchanged and its full test suite remains green.
- Task-owned servers, browsers, and containers are cleaned up after verification; no cleanup deletes the user's persistent browser profile or unrelated Docker resources.
- Final result is `candidate-only` and `release pending`; production remains `blocked` until the separately approved release/operations gate passes.

## Ownership Boundaries

| Owner | Responsibility |
|---|---|
| Product/stakeholder owner | Accept the 17-surface parity target, visual source precedence, route dispositions, and final screenshots. |
| Frontend execution owner | Build typed shell/primitives, migrate surfaces, preserve field/offline boundaries, and produce visual/behavior evidence. |
| Backend execution owner | Extend only the existing session projection needed by the HTTP shell; preserve auth/authorization and keep provider credentials server-side. |
| QA | Maintain deterministic reference capture, geometry/semantic assertions, dual-profile behavior tests, and literal evidence labels. |
| Security + Identity | Own production IdP, MFA, provisioning, session policy, secret rotation, and external security evidence; none is accepted by this UI plan. |
| Platform + Operations | Own production hosting, reverse proxy, monitoring, backup/restore, on-call, deployment, and cutover. |
| Records + Legal | Own retention, legal hold, disposition, official Evidence/report records, and signature requirements. |

## Dependencies

- `AGENTS.md`
- `README.md` and `README.turkce.md`
- `docs/product-specs/index.md`
- `docs/product-specs/screen-specs/SCREEN_INVENTORY_AND_FORMS.md`
- `docs/product-specs/screen-specs/DEPARTMENT_MANAGER_WORKSPACES.md`
- `docs/product-specs/ux-plan/NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`
- `docs/product-specs/data-and-rules/PRODUCTION_CONTRACT_VOCABULARY.md`
- `docs/product-specs/data-and-rules/STATUS_PERMISSION_SECURITY.md`
- `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md`
- `docs/demo-evidence/WORKING_SCENARIO_AUDIT_2026-07-20.md`
- `docs/demo-evidence/LOCAL_RELEASE_CANDIDATE_2026-07-21.md`
- `docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md`
- Root reference sources: `index.html`, `css/styles.css`, `js/app.js`, `js/views.js`, `js/data.js`, and root `tests/`.
- Current candidate sources: `apps/web/src/app/router.tsx`, `apps/web/src/features/`, `apps/web/src/styles/app.css`, `apps/web/src/backend/`, `apps/api/internal/httpapi/`, and `api/openapi/aviasurveil360.yaml`.

## File And Module Map

### Contract and parity inventory

- Create `apps/web/src/parity/legacy-screen-manifest.ts` — typed 86-screen disposition inventory and 17 migrated-surface comparison metadata.
- Create `apps/web/src/parity/legacy-screen-manifest.test.ts` — uniqueness, count, classification, path, role, and forbidden-placeholder assertions.
- Create `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md` and `.turkce.md` — stakeholder-readable source precedence, visual equivalence, route disposition, and acceptance contract.

### Visual test harness

- Create `apps/web/scripts/serve-legacy.mjs` — read-only static server rooted at the repository for parity capture.
- Create `apps/web/tests/e2e/support/legacy-parity-fixtures.ts` — deterministic legacy-state preparation, candidate reset, masks, and geometry capture.
- Create `apps/web/tests/e2e/legacy-visual-parity.spec.ts` — 17 surfaces × 3 viewports, screenshot and semantic/geometry checks.
- Modify `apps/web/playwright.config.ts` — add an explicit `parity` profile with legacy and React web servers.
- Modify `apps/web/package.json` — add `serve:legacy` and `test:e2e:parity` scripts.
- Create `qa/screenshots/react-legacy-parity/README.md` and `qa/screenshots/react-legacy-parity/reference/` — accepted source captures and capture metadata. Store transient actual/diff output under `/private/tmp/aviasurveil360-react-legacy-parity`.

### Brand and application shell

- Create `apps/web/src/ui/brand/brand-assets.ts` — Vite-resolved URLs for the existing root font, logo, texture, and icon assets without copying binaries.
- Create `apps/web/src/ui/shell/application-shell.tsx` — responsive shell layout and authenticated/demo role context.
- Create `apps/web/src/ui/shell/candidate-ribbon.tsx` — truthful demo/canonical/HTTP candidate boundary and reset affordance.
- Create `apps/web/src/ui/shell/role-navigation.tsx` and `role-navigation.ts` — role-specific navigation contract, active-route matching, and mobile menu behavior.
- Create `apps/web/src/ui/shell/topbar.tsx` — breadcrumb, notification, identity, role, and logout affordances.
- Create `apps/web/src/ui/shell/role-select-page.tsx` — accepted split-brand role-selection experience for demo/canonical test.
- Modify `apps/web/src/features/shared/workspace-shell.tsx` — compatibility exports and shared formatting only; remove duplicate shell markup after all callers migrate.
- Modify `apps/web/src/app/router.tsx` — route metadata, guarded layout nesting, and removal of the minimal standalone shell.
- Create `apps/web/src/styles/brand-tokens.css`, `shell.css`, `workbench.css`, and `responsive.css`.
- Modify `apps/web/src/styles/app.css` — import ordered style layers and keep feature-specific rules only.

### Identity/session integration

- Create `apps/web/src/auth/session-client.ts` — `/auth/session`, `/auth/login`, `/auth/logout`, CSRF cookie reader, and typed auth failures.
- Create `apps/web/src/auth/session-provider.tsx` — session state machine that never stores provider tokens.
- Create `apps/web/src/auth/http-auth-gate.tsx` — loading, unauthenticated, authenticated, expired, and unavailable states.
- Create `apps/web/src/auth/login-page.tsx` — branded HTTP sign-in surface; no sign-up control.
- Modify `apps/web/src/app/providers.tsx` — add the exact identity mode and session client to runtime.
- Modify `apps/web/src/entry/demo.tsx`, `http-test.tsx`, and `http.tsx` — select `demo-role-switch`, `canonical-test-role-switch`, or `oidc-session` once at bootstrap.
- Modify `apps/web/src/backend/http-backend.ts` — obtain the CSRF header from the session client without changing domain method signatures.
- Modify `apps/api/internal/identity/principal.go`, `apps/api/internal/platform/session/manager.go`, and `apps/api/internal/httpapi/auth.go` only as required to return safe display name plus roles/organization from `/auth/session`.
- Extend existing Go and React auth tests; do not add a user-provisioning endpoint.

### Shared workbench primitives

- Create `apps/web/src/ui/primitives/command-header.tsx`.
- Create `apps/web/src/ui/primitives/metric-strip.tsx`.
- Create `apps/web/src/ui/primitives/status-badge.tsx`.
- Create `apps/web/src/ui/primitives/work-table.tsx`.
- Create `apps/web/src/ui/primitives/responsive-record-list.tsx`.
- Create `apps/web/src/ui/primitives/dossier-tabs.tsx`.
- Create `apps/web/src/ui/primitives/lifecycle-stepper.tsx`.
- Create `apps/web/src/ui/primitives/decision-panel.tsx`.
- Create `apps/web/src/ui/primitives/modal-dialog.tsx`.
- Create `apps/web/src/ui/primitives/primitives.test.tsx` — semantics, keyboard, label, focus hook, and responsive-class contracts.

### Feature migrations

- Modify the existing feature page files under `apps/web/src/features/`; keep data access through `useBackendForRole`, `useScenario`, and the existing domain types.
- Split a feature file only when it exceeds one clear responsibility; colocate its page tests in the same feature directory.
- Do not add root `js/` imports to React.

### Evidence and tracking

- Create `docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.md` and `.turkce.md` only after fresh verification.
- Modify `README.md`, `README.turkce.md`, `MANIFEST.md`, `docs/index.md`, `docs/demo-evidence/BUILD_SUMMARY.md`, and `.turkce.md` only where final package truth changes.
- Modify this plan, `docs/exec-plans/index.md`, and `docs/exec-plans/tech-debt-tracker.md` at each material status change.

## Binding Delivery Order

1. Parity/disposition contract.
2. Deterministic visual harness and red baseline.
3. Brand assets/tokens.
4. Role selection and application shell.
5. Normal HTTP OIDC/session experience.
6. Shared workbench primitives.
7. Inspector surfaces.
8. Lead Inspector surfaces.
9. Auditee surface.
10. Department Manager surfaces.
11. Finance, General Manager, and Executive Director surfaces.
12. Admin surface.
13. Remaining legacy disposition and no-placeholder boundary.
14. Full local candidate verification and stakeholder handoff.

No role feature task may begin before Tasks 1-6 pass. Do not parallelize tasks that edit the same shell, stylesheet, router, backend contract, OpenAPI, or canonical scenario state.

---

### Task 1: Freeze The 86-Screen Disposition And 17-Surface Parity Contract

**Files:**

- Create: `apps/web/src/parity/legacy-screen-manifest.ts`
- Create: `apps/web/src/parity/legacy-screen-manifest.test.ts`
- Create: `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md`
- Create: `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.turkce.md`
- Modify: `docs/exec-plans/index.md`
- Modify: `docs/exec-plans/tech-debt-tracker.md`
- Modify: this plan

**Interfaces:**

- Produces:

  ```ts
  export type LegacyDisposition =
    | "backend-connected"
    | "later-legacy-only"
    | "demo-only-legacy";

  export type VisualParityMode = "strict-shell" | "content-adapted";

  export interface LegacyScreenContract {
    id: string;
    role: Role | null;
    legacyView: string;
    legacyParams: Readonly<Record<string, string>>;
    reactPath: string | null;
    disposition: LegacyDisposition;
    parityMode: VisualParityMode | null;
    referenceScreenshotIds: readonly string[];
    reason: string;
  }

  export const LEGACY_SCREEN_INVENTORY: readonly LegacyScreenContract[];
  export const BACKEND_CONNECTED_SURFACES: readonly LegacyScreenContract[];
  ```

- Consumers: the router tests, visual parity fixtures, evidence generator, and Task 13 no-placeholder boundary.

- [ ] **Step 1: Confirm the protected working-tree baseline**

  Run:

  ```bash
  git status --short --branch
  git log -5 --oneline
  ```

  Expected: current branch only; unrelated `.superpowers/`, `docs/demo-evidence/stakeholder/`, and `outputs/` remain untouched; no branch operation.

- [ ] **Step 2: Write the failing manifest contract test**

  Add assertions that require:

  ```ts
  expect(LEGACY_SCREEN_INVENTORY).toHaveLength(86);
  expect(BACKEND_CONNECTED_SURFACES).toHaveLength(17);
  expect(new Set(LEGACY_SCREEN_INVENTORY.map(({ id }) => id)).size).toBe(86);
  expect(
    new Set(
      LEGACY_SCREEN_INVENTORY.map(({ role, legacyView, legacyParams }) =>
        JSON.stringify([role, legacyView, legacyParams]),
      ),
    ).size,
  ).toBe(86);
  expect(
    BACKEND_CONNECTED_SURFACES.every(
      ({ reactPath, parityMode }) => reactPath?.startsWith("/") && parityMode !== null,
    ),
  ).toBe(true);
  expect(
    LEGACY_SCREEN_INVENTORY.filter(({ disposition }) => disposition !== "backend-connected")
      .every(({ reactPath }) => reactPath === null),
  ).toBe(true);
  ```

  The test must also assert the exact 17 IDs from the In Scope table and reject empty `reason` or `referenceScreenshotIds` arrays.

- [ ] **Step 3: Run the focused test and record the expected red state**

  Run:

  ```bash
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts
  ```

  Expected: FAIL because the manifest module does not exist.

- [ ] **Step 4: Build the complete manifest from the verified route inventory**

  Transcribe the 86 accepted screen-state tuples from `docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md`, `js/app.js` `NAV`/compatibility states, and the audit screenshot index. Use the exact 17 rows in this plan as `backend-connected`. Classify AI, advanced risk/BI, USOAP/SSP, broad regulatory editing, enforcement case handling, and unsupported configuration as `demo-only-legacy`; classify approved product concepts without a complete API vertical as `later-legacy-only`.

  Every non-connected row must have `reactPath: null`; do not create a placeholder path.

- [ ] **Step 5: Write the bilingual stakeholder contract**

  The English/Turkish pair must define:

  - why technical behavioral parity did not equal stakeholder visual acceptance;
  - the 17 connected surfaces and 69 retained legacy states;
  - source precedence;
  - strict-shell vs content-adapted comparison;
  - visible-control, privacy, lifecycle, candidate-only, and cutover boundaries;
  - the rule that a future route promotion requires OpenAPI + mock + Go + authorization + React + mock/HTTP browser coverage in one slice.

- [ ] **Step 6: Run focused contract verification**

  Run:

  ```bash
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/router.test.tsx
  npm --prefix apps/web run typecheck
  ```

  Expected: manifest and router tests PASS; typecheck PASS.

- [ ] **Step 7: Update plan tracking truth**

  Set this plan to `active` only after the independent review is accepted. Add a `note-open` parity/stakeholder-acceptance item; link the parent production-transition plan without marking production blocked work accepted.

- [ ] **Step 8: Commit and push only Task 1**

  ```bash
  git add apps/web/src/parity/legacy-screen-manifest.ts apps/web/src/parity/legacy-screen-manifest.test.ts docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.turkce.md docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git diff --cached --stat
  git commit -m "test(ui): freeze legacy parity contract"
  git push origin HEAD
  ```

  Expected: one Conventional Commit; push succeeds; unrelated files are not staged.

---

### Task 2: Add The Deterministic Legacy/React Visual Comparison Harness

**Files:**

- Create: `apps/web/scripts/serve-legacy.mjs`
- Create: `apps/web/tests/e2e/support/legacy-parity-fixtures.ts`
- Create: `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Create: `qa/screenshots/react-legacy-parity/README.md`
- Create: `qa/screenshots/react-legacy-parity/reference/` metadata and accepted PNGs
- Modify: `apps/web/playwright.config.ts`
- Modify: `apps/web/package.json`
- Modify: this plan

**Interfaces:**

- Produces:

  ```ts
  export interface ParityViewport {
    name: "desktop" | "tablet" | "mobile";
    width: number;
    height: number;
  }

  export interface GeometrySnapshot {
    documentWidth: number;
    viewportWidth: number;
    shellColumns: number;
    visiblePrimaryActions: number;
    minimumActionHeight: number;
  }

  export async function prepareLegacySurface(page: Page, surface: LegacyScreenContract): Promise<void>;
  export async function prepareReactSurface(page: Page, surface: LegacyScreenContract): Promise<void>;
  export async function captureGeometry(page: Page): Promise<GeometrySnapshot>;
  ```

- Reference server: `http://127.0.0.1:4173/index.html`.
- React demo server: `http://127.0.0.1:4174/`.
- Transient output: `/private/tmp/aviasurveil360-react-legacy-parity`.

- [ ] **Step 1: Write a failing package-script/config test**

  Extend `legacy-screen-manifest.test.ts` or create a small Node test that asserts:

  ```ts
  expect(packageJson.scripts["serve:legacy"]).toBe("node scripts/serve-legacy.mjs");
  expect(packageJson.scripts["test:e2e:parity"]).toContain("AVIA_E2E_PROFILE=parity");
  ```

  Run it and expect FAIL before adding scripts.

- [ ] **Step 2: Implement a read-only static server**

  `serve-legacy.mjs` must:

  - resolve repository root with `fileURLToPath(new URL("../../..", import.meta.url))`;
  - bind only `127.0.0.1:4173`;
  - normalize and reject traversal outside the root;
  - serve known MIME types for HTML, CSS, JS, SVG, PNG, JPG, and TTF;
  - never write files or expose dot-directories;
  - return `404` for missing files and `405` for non-GET/HEAD methods.

- [ ] **Step 3: Add the parity Playwright profile**

  Add `AVIA_E2E_PROFILE=parity` handling with two web servers:

  ```ts
  [
    {
      command: "npm run serve:legacy",
      url: "http://127.0.0.1:4173/index.html",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev:demo -- --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174/",
      reuseExistingServer: false,
    },
  ]
  ```

  The parity project must match only `e2e/legacy-visual-parity.spec.ts`.

- [ ] **Step 4: Implement deterministic surface preparation**

  For the root reference, clear `aviasurveil360:v2-demo-state`, reload, choose the exact role through the visible role card, and navigate through visible controls where possible. Use a narrowly scoped state fixture only for deep canonical states that would otherwise require mutating the full lifecycle in every screenshot; fixture state must come from `freshState()` semantics and must be documented in the screenshot metadata.

  For React, reset mock runtime by starting a fresh browser context per test, then navigate by the manifest's exact `reactPath`. Do not inject React component state.

- [ ] **Step 5: Capture and freeze the 51 source-reference images**

  Use:

  ```ts
  const PARITY_VIEWPORTS = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 1024, height: 768 },
    { name: "mobile", width: 390, height: 844 },
  ] as const;
  ```

  Store only accepted legacy PNGs plus a JSON metadata file containing surface ID, role, legacy view/params, viewport, source commit, browser version, and masked dynamic selectors. Do not store transient React actual/diff images in Git.

- [ ] **Step 6: Write the initial red visual parity test**

  For each connected surface and viewport, assert:

  - correct heading/role/path;
  - zero document overflow;
  - no warning/error console events;
  - reference and React screenshots exist;
  - shell/role-selection comparison uses `maxDiffPixelRatio: 0.03`;
  - content-adapted pages use geometry/semantic assertions and an initial `0.08` cap;
  - dynamic masks cover only candidate ribbon timestamps, transient toast regions, or explicitly named server-shaped values.

  Run:

  ```bash
  npm --prefix apps/web run test:e2e:parity
  ```

  Expected: FAIL on the current minimal React role-selection/shell visual comparison. Record the first failing surface and diff ratio in the plan; do not weaken the threshold.

- [ ] **Step 7: Verify harness integrity**

  Deliberately perturb one reference copy in `/private/tmp`, prove the comparison fails, restore the copy, and rerun the harness. This prevents a test that reports success without comparing pixels/geometry.

- [ ] **Step 8: Commit and push only Task 2**

  ```bash
  git add apps/web/scripts/serve-legacy.mjs apps/web/tests/e2e/support/legacy-parity-fixtures.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts apps/web/playwright.config.ts apps/web/package.json apps/web/package-lock.json qa/screenshots/react-legacy-parity docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "test(ui): add legacy visual parity harness"
  git push origin HEAD
  ```

---

### Task 3: Reuse The Accepted Brand Assets And Token System

**Files:**

- Create: `apps/web/src/ui/brand/brand-assets.ts`
- Create: `apps/web/src/styles/brand-tokens.css`
- Create: `apps/web/src/styles/shell.css`
- Create: `apps/web/src/styles/workbench.css`
- Create: `apps/web/src/styles/responsive.css`
- Modify: `apps/web/src/styles/app.css`
- Create or modify: `apps/web/src/ui/brand/brand-assets.test.ts`
- Modify: `apps/web/scripts/assert-http-artifact.mjs`
- Modify: this plan

**Interfaces:**

- Produces:

  ```ts
  export const BRAND_ASSETS: Readonly<{
    mark: string;
    airspaceTexture: string;
    icons: Readonly<Record<Role, string>>;
  }>;
  ```

- CSS token contract includes root-compatible `--navy-900`, `--navy-800`, `--blue-500`, `--ink`, `--muted`, `--line`, `--bg`, `--surface`, status tokens, radius, shadows, and `"DM Sans"` as the primary application font.

- [ ] **Step 1: Write failing asset/token tests**

  Assert that `BRAND_ASSETS` resolves the root mark, texture, and eight local SVG role icons through Vite asset URLs; assert the CSS contains the accepted token values and a local `@font-face` source for `DMSans-Variable.ttf`.

- [ ] **Step 2: Run the focused red test**

  ```bash
  npm --prefix apps/web test -- src/ui/brand/brand-assets.test.ts
  ```

  Expected: FAIL because the asset module/token layer is absent.

- [ ] **Step 3: Implement asset reuse without binary duplication**

  Use `new URL("../../../../../assets/...", import.meta.url).href` in `brand-assets.ts`. Vite must fingerprint the files into both builds. Do not copy or modify the root PNG, SVG, or TTF files.

- [ ] **Step 4: Introduce ordered style layers**

  `app.css` must import in this order:

  ```css
  @import "./brand-tokens.css";
  @import "./shell.css";
  @import "./workbench.css";
  @import "./responsive.css";
  ```

  Until Tasks 4 and 6 create the latter files, add empty files with only layer comments in this task so the build remains green. Do not move page rules yet.

- [ ] **Step 5: Verify build graph and HTTP isolation**

  ```bash
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  ```

  Expected: both builds PASS; local brand assets are emitted; root `js/`, mock, seed, and canonical-test code are absent from HTTP inputs.

- [ ] **Step 6: Commit and push only Task 3**

  ```bash
  git add apps/web/src/ui/brand apps/web/src/styles apps/web/scripts/assert-http-artifact.mjs docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align brand assets and tokens"
  git push origin HEAD
  ```

---

### Task 4: Replace The Minimal Role Page And Shell With The Accepted Interface

**Files:**

- Create: `apps/web/src/ui/shell/role-select-page.tsx`
- Create: `apps/web/src/ui/shell/application-shell.tsx`
- Create: `apps/web/src/ui/shell/candidate-ribbon.tsx`
- Create: `apps/web/src/ui/shell/role-navigation.ts`
- Create: `apps/web/src/ui/shell/role-navigation.tsx`
- Create: `apps/web/src/ui/shell/topbar.tsx`
- Create: `apps/web/src/ui/shell/shell.test.tsx`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/features/shared/workspace-shell.tsx`
- Modify: `apps/web/src/styles/shell.css`
- Modify: `apps/web/src/styles/responsive.css`
- Modify: `apps/web/tests/e2e/release-candidate-gates.spec.ts`
- Modify: this plan

**Interfaces:**

- Produces:

  ```ts
  export interface RoleNavigationItem {
    id: string;
    label: string;
    to: string;
    iconUrl: string;
    capability: "connected" | "disabled";
    disabledReason?: string;
  }

  export interface ApplicationShellProps extends PropsWithChildren {
    role: Role;
    pageTitle: string;
    breadcrumbs: readonly { label: string; to?: string }[];
    primaryAction?: ReactNode;
  }
  ```

- `roleNavigation(role)` returns only connected routes in React. It never fabricates a route for a legacy-only screen.

- [ ] **Step 1: Write failing shell tests**

  Require:

  - the split login/role-selection layout with mark, texture, `Safer oversight, from plan to closure.`, three role groups, and eight keyboard-reachable role cards;
  - the dark navy sidebar, product mark/title, role identity, active item, topbar breadcrumb, notification/profile controls, logout/switch action, and candidate boundary;
  - `aria-expanded` mobile navigation and focus return after close;
  - no link to a `later-legacy-only` or `demo-only-legacy` path;
  - every role home path remains exact.

- [ ] **Step 2: Run the focused red tests**

  ```bash
  npm --prefix apps/web test -- src/ui/shell/shell.test.tsx src/app/router.test.tsx
  ```

  Expected: FAIL because the accepted shell components do not exist.

- [ ] **Step 3: Implement the role-selection experience**

  Use the accepted root structure rather than the current four-column generic card grid:

  - desktop: branded navy visual panel + light role selector panel;
  - tablet: balanced stacked/two-column composition without lost role cards;
  - mobile: brand summary first, all role cards in document order, no fixed-height clipping;
  - role cards use the existing local icons, label, purpose, and exact route;
  - candidate text remains literal and never says production-ready.

- [ ] **Step 4: Implement role-aware shell navigation**

  Build navigation from `BACKEND_CONNECTED_SURFACES`, not a duplicate hand-written route list. For a normal authenticated HTTP session, intersect connected role routes with session roles. Demo/canonical-test mode retains `Switch role`; normal HTTP uses `Switch role` only when the session has multiple supported roles.

- [ ] **Step 5: Add mobile navigation behavior**

  Use React state local to `ApplicationShell`; lock only the application overlay, not browser scrolling globally; close on Escape, backdrop, navigation, and logout; return focus to the menu button.

- [ ] **Step 6: Migrate existing pages through a compatibility wrapper**

  Keep `WorkspaceShell` as a thin adapter to `ApplicationShell` during Tasks 7-12. Remove its old sidebar markup now so there is only one shell implementation.

- [ ] **Step 7: Run focused and visual checkpoint tests**

  ```bash
  npm --prefix apps/web test -- src/ui/shell/shell.test.tsx src/app/router.test.tsx
  npm --prefix apps/web run test:e2e:mock
  npm --prefix apps/web run test:e2e:parity -- --grep "role-select|shell"
  ```

  Expected: role-selection/shell tests PASS at all three viewports; no console issues or overflow; strict shell diff meets `<= 0.03` or has a reviewer-approved exact exception recorded in the manifest.

- [ ] **Step 8: Commit and push only Task 4**

  ```bash
  git add apps/web/src/ui/shell apps/web/src/app/router.tsx apps/web/src/features/shared/workspace-shell.tsx apps/web/src/styles/shell.css apps/web/src/styles/responsive.css apps/web/tests/e2e/release-candidate-gates.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): port legacy application shell"
  git push origin HEAD
  ```

  **Review checkpoint:** obtain focused stakeholder review of the role-selection and shell screenshots before feature-page migration. A rejected shell blocks Tasks 5-14.

---

### Task 5: Connect The Normal HTTP Build To OIDC Session And CSRF

**Files:**

- Create: `apps/web/src/auth/session-client.ts`
- Create: `apps/web/src/auth/session-client.test.ts`
- Create: `apps/web/src/auth/session-provider.tsx`
- Create: `apps/web/src/auth/session-provider.test.tsx`
- Create: `apps/web/src/auth/http-auth-gate.tsx`
- Create: `apps/web/src/auth/login-page.tsx`
- Modify: `apps/web/src/app/providers.tsx`
- Modify: `apps/web/src/app/bootstrap.tsx`
- Modify: `apps/web/src/entry/demo.tsx`
- Modify: `apps/web/src/entry/http-test.tsx`
- Modify: `apps/web/src/entry/http.tsx`
- Modify: `apps/web/src/backend/http-backend.ts`
- Modify: `apps/api/internal/identity/principal.go`
- Modify: `apps/api/internal/platform/session/manager.go`
- Modify: `apps/api/internal/httpapi/auth.go`
- Modify: matching Go/React tests and OpenAPI behavior documentation if the session projection contract is recorded there
- Modify: this plan

**Interfaces:**

- Produces:

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

  export interface SessionClient {
    get(): Promise<SessionProjection>;
    login(returnTo: string): void;
    logout(): Promise<void>;
    csrfToken(): string | null;
  }
  ```

- Go `/auth/session` returns only subject ID, display name, organization ID, and supported roles. It never returns provider tokens, cookie values, email claims, secrets, or Internal CAA data.

- [ ] **Step 1: Write failing React session tests**

  Cover:

  - `401` -> unauthenticated branded login page;
  - successful projection -> authenticated routes only;
  - unsupported/empty roles -> closed authorization error;
  - expired session during API call -> protected data cleared and login action shown;
  - `login()` uses `/auth/login?returnTo=` with a same-origin path;
  - `logout()` includes credentials and CSRF;
  - cookie parser returns only `__Host-avia_csrf` and never stores it.

- [ ] **Step 2: Write failing Go session-projection tests**

  Extend `apps/api/internal/httpapi/auth_test.go` so the session response requires `displayName`, supported roles, and organization while explicitly rejecting serialized token/secret/cookie fields.

- [ ] **Step 3: Run red tests**

  ```bash
  npm --prefix apps/web test -- src/auth/session-client.test.ts src/auth/session-provider.test.tsx
  GOCACHE=/private/tmp/aviasurveil360-ui-parity-go-cache go -C apps/api test ./internal/httpapi ./internal/platform/session ./internal/identity
  ```

  Expected: React modules absent and Go display-name assertion fails.

- [ ] **Step 4: Implement the safe server session projection**

  Add `DisplayName` to the authenticated principal/session query only if it can be derived from the existing identity reference. Do not trust a client display name and do not add provider tokens to the principal. Keep session and OIDC persistence encrypted/server-side.

- [ ] **Step 5: Implement the React session state machine**

  States are exactly `loading`, `unauthenticated`, `authenticated`, `unavailable`, and `expired`. Only `oidc-session` uses the gate. Demo and canonical-test modes never call `/auth/session`.

- [ ] **Step 6: Wire CSRF into normal `HttpBackend` mutations**

  Pass `sessionClient.csrfToken` to `createHttpBackend`. Preserve existing request mapping and problem types. A missing token must result in the existing server `403` and an actionable UI error; do not silently retry a mutation.

- [ ] **Step 7: Verify real local Keycloak login**

  Extend the local HTTP profile browser gate to:

  - open normal HTTP entry without a session;
  - click `Sign in with organization account`;
  - authenticate with the pinned local Keycloak Inspector fixture;
  - complete callback and receive secure browser cookies;
  - render only Inspector-connected navigation;
  - perform one CSRF-protected mutation;
  - log out and verify the session projection returns `401`.

  Registration must remain disabled and no sign-up link may render.

- [ ] **Step 8: Run focused/full auth gates**

  ```bash
  npm --prefix apps/web test -- src/auth src/backend/http-backend.test.ts
  GOCACHE=/private/tmp/aviasurveil360-ui-parity-go-cache go -C apps/api test ./internal/httpapi ./internal/platform/session ./internal/identity
  ./scripts/test-http-profile.sh
  ```

  Expected: focused tests PASS; full profile PASS; canonical-test profile remains isolated; normal HTTP tokens are absent from React/public artifacts.

- [ ] **Step 9: Commit and push only Task 5**

  ```bash
  git add apps/web/src/auth apps/web/src/app/providers.tsx apps/web/src/app/bootstrap.tsx apps/web/src/entry apps/web/src/backend/http-backend.ts apps/api/internal/identity apps/api/internal/platform/session apps/api/internal/httpapi/auth.go apps/api/internal/httpapi/auth_test.go docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(auth): connect browser session experience"
  git push origin HEAD
  ```

---

### Task 6: Build Shared Oversight Workbench Primitives

**Files:**

- Create: `apps/web/src/ui/primitives/*.tsx` files named in the File Map
- Create: `apps/web/src/ui/primitives/primitives.test.tsx`
- Modify: `apps/web/src/styles/workbench.css`
- Modify: `apps/web/src/styles/responsive.css`
- Modify: `apps/web/src/features/shared/workspace-shell.tsx`
- Modify: this plan

**Interfaces:**

- `CommandHeader` requires title, purpose, status/owner/next-action metadata, and optional primary action.
- `WorkTable<T>` requires stable row ID, semantic columns, and an exact row action; `ResponsiveRecordList<T>` renders the same records below the configured breakpoint.
- `DossierTabs` uses real buttons with `aria-selected` and a labelled tabpanel.
- `LifecycleStepper` receives typed stages and never infers closure from CAP acceptance.
- `DecisionPanel` keeps public and internal comments in distinct labelled inputs.
- `ModalDialog` traps focus, closes on Escape/cancel, restores focus, and never closes on an invalid submit.

- [ ] **Step 1: Write failing primitive tests**

  Cover exact semantics, status text, mobile card facts, tab keyboard behavior, modal focus restoration, distinct comment labels, disabled reason, and `44px` class hooks.

- [ ] **Step 2: Run red tests**

  ```bash
  npm --prefix apps/web test -- src/ui/primitives/primitives.test.tsx
  ```

  Expected: FAIL because the primitives are absent.

- [ ] **Step 3: Implement minimal complete primitives**

  Keep primitives presentation-only. They receive domain values and callbacks; they never call `Backend`, mutate scenario context, select a role, or know build profile.

- [ ] **Step 4: Port shared formatting helpers**

  Move date/severity/status label formatting from `workspace-shell.tsx` into focused helpers used by primitives. Keep transport enums out of JSX class-name construction.

- [ ] **Step 5: Verify component accessibility and visual gallery states**

  Render each primitive in at least default, warning, error, disabled, empty, and long-content states where applicable. Assert no truncated finding reference, organization, Due Date, or action label.

- [ ] **Step 6: Run focused tests and builds**

  ```bash
  npm --prefix apps/web test -- src/ui/primitives src/ui/shell
  npm --prefix apps/web run typecheck
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  ```

- [ ] **Step 7: Commit and push only Task 6**

  ```bash
  git add apps/web/src/ui/primitives apps/web/src/styles/workbench.css apps/web/src/styles/responsive.css apps/web/src/features/shared/workspace-shell.tsx docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): add oversight workbench primitives"
  git push origin HEAD
  ```

---

### Task 7: Migrate Inspector Assignments, Audit Detail, And Checklist Runner

**Files:**

- Modify: `apps/web/src/features/assignments/inspector-assignments-page.tsx`
- Modify: `apps/web/src/features/inspections/audit-detail-page.tsx`
- Modify: `apps/web/src/features/checklists/checklist-runner-page.tsx`
- Modify: `apps/web/src/features/inspections/offline-readiness-panel.tsx`
- Create/modify: colocated component tests
- Modify: `apps/web/tests/e2e/canonical-scenario.spec.ts`
- Modify: `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify: this plan

**Interfaces:**

- Consumes existing `Backend.assignments`, `Backend.inspections`, `useScenario`, `FieldRepository`, offline readiness, OPFS attachment, and sync interfaces without signature changes.
- Produces root-compatible Inspector workbench, selected Audit dossier, six-question Cabin checklist, Potential Finding creation surface, visible local/sync/conflict state, and responsive records.

- [ ] **Step 1: Add failing Inspector component assertions**

  Require the root-compatible command header, assignment register + mobile cards, organization/status/Due Date/next action, Audit dossier facts, checklist sections, exact response controls, required-comment state, Inspection Attachment filename, Potential Finding action, and visible offline/sync status.

- [ ] **Step 2: Run focused red tests**

  ```bash
  npm --prefix apps/web test -- src/features/assignments src/features/inspections src/features/checklists
  ```

  Expected: FAIL on missing parity components/classes, not on changed domain behavior.

- [ ] **Step 3: Migrate My Assignments**

  Match the original table-first workbench at desktop and responsive record-card pattern at mobile. Preserve the exact backend-derived assignment list; do not add decorative mock counters not supported by the projection.

- [ ] **Step 4: Migrate Audit Detail**

  Show Audit identity, organization, assigned Inspector, status, Due Date, checklist package, progress, owner, next action, and one primary `Continue Cabin Inspection` control above the first viewport.

- [ ] **Step 5: Migrate Checklist Runner without breaking offline**

  Preserve atomic local response/Potential Finding/outbox behavior, attachment recovery gates, server acknowledgement, conflict presentation, and re-entry. A local save must remain visibly distinct from server acknowledgement.

- [ ] **Step 6: Run mock, HTTP, offline, and visual tests**

  ```bash
  npm --prefix apps/web test -- src/features/assignments src/features/inspections src/features/checklists src/app/scenario-context.offline.test.tsx
  npm --prefix apps/web run test:e2e:mock
  npm --prefix apps/web run test:e2e:parity -- --grep "inspector-home|audit-detail|checklist-runner"
  npm --prefix apps/web run test:e2e:offline
  ./scripts/test-http-profile.sh
  ```

  Expected: all focused/dual/offline gates PASS; Inspector visual ratios and geometry pass at three viewports.

- [ ] **Step 7: Commit and push only Task 7**

  ```bash
  git add apps/web/src/features/assignments apps/web/src/features/inspections apps/web/src/features/checklists apps/web/tests/e2e/canonical-scenario.spec.ts apps/web/tests/e2e/legacy-visual-parity.spec.ts docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align inspector workspaces"
  git push origin HEAD
  ```

---

### Task 8: Migrate Lead Inspector Potential Finding, CAP, And Evidence Review

**Files:**

- Modify: `apps/web/src/features/findings/lead-review-page.tsx`
- Modify: `apps/web/src/features/findings/finding-detail-page.tsx`
- Modify: `apps/web/src/features/caps/cap-review-page.tsx`
- Modify: `apps/web/src/features/evidence/evidence-review-page.tsx`
- Create/modify: colocated tests
- Modify: canonical mock/HTTP Playwright scenario and parity spec
- Modify: this plan

**Interfaces:**

- Consumes existing Potential Finding, Finding, CAP review, Evidence version, Evidence review, and authorized closure Backend capabilities.
- Produces root-compatible review queue/dossier, lifecycle stepper, exact authority decisions, immutable Evidence history, and distinct public/internal comments.

- [ ] **Step 1: Write failing Lead UI tests**

  Require:

  - Potential Finding is visibly pending Lead authority;
  - Inspector cannot select severity or issue a Finding;
  - Lead `Convert`, `Return`, and `Dismiss` actions use reason/required fields;
  - CAP acceptance text explicitly states it does not close the Finding;
  - Evidence versions render newest and prior versions without overwrite;
  - `Close`, `Partially Close`, and `Not Close` results are distinct;
  - `Comment to Auditee` and `Internal CAA Note` are separate labelled controls;
  - owner, next action, Due Date, status, severity, Audit, and organization appear in the dossier.

- [ ] **Step 2: Run focused red tests**

  ```bash
  npm --prefix apps/web test -- src/features/findings src/features/caps/cap-review-page.test.tsx src/features/evidence
  ```

- [ ] **Step 3: Migrate queue and Finding dossier**

  Use the root Findings queue + selected dossier composition. Keep one obvious primary decision and place the lifecycle/authority facts before supporting history.

- [ ] **Step 4: Migrate CAP review**

  Preserve submitted CAP fields, revision, separate acceptance authority, reason-required more-information/rejection paths, and immutable prior revisions.

- [ ] **Step 5: Migrate Evidence review**

  Preserve clean-scan gating, exact Evidence version selection, public/internal comments, closure basis, and open status for partial/not-close outcomes.

- [ ] **Step 6: Run lifecycle and visual matrices**

  ```bash
  npm --prefix apps/web test -- src/features/findings src/features/caps src/features/evidence
  npm --prefix apps/web run test:e2e:mock
  npm --prefix apps/web run test:e2e:parity -- --grep "lead-home|finding-detail|cap-review|evidence-review"
  ./scripts/test-http-profile.sh
  node --test tests/scenario-integrity-regression.test.js tests/working-scenario-audit-remediation.test.js
  ```

- [ ] **Step 7: Commit and push only Task 8**

  ```bash
  git add apps/web/src/features/findings apps/web/src/features/caps/cap-review-page.tsx apps/web/src/features/evidence apps/web/tests/e2e docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align lead review workspaces"
  git push origin HEAD
  ```

  **Review checkpoint:** replay the full Checklist -> Potential Finding -> Finding -> CAP -> Evidence -> Closure scenario in the visible browser before migrating management surfaces.

---

### Task 9: Migrate The Auditee Corrective Action Workspace

**Files:**

- Modify: `apps/web/src/features/caps/auditee-cap-page.tsx`
- Modify: `apps/web/src/features/caps/auditee-projection.tsx`
- Modify: matching tests
- Modify: canonical scenario and parity spec
- Modify: this plan

**Interfaces:**

- Consumes the existing organization-scoped Auditee Backend projections and upload/version capabilities.
- Produces the accepted Service Provider portal visual language for the connected CAP surface only.

- [ ] **Step 1: Add failing Auditee privacy/visual tests**

  Require portal identity, organization scope, CAA request summary, Finding facts, CAP form helper text, Evidence version/filename state, Due Date/status/next action, and absence of Internal CAA Note, other organization, workload, internal risk, and enforcement deliberation strings.

- [ ] **Step 2: Run red tests**

  ```bash
  npm --prefix apps/web test -- src/features/caps/auditee-projection.test.tsx src/features/caps/auditee-cap-page.test.tsx
  ```

- [ ] **Step 3: Migrate portal layout and CAP form**

  Use the root Service Provider shell anatomy and scope note. Keep root cause, corrective action, preventive action, responsible person, Target completion date, and comment to CAA as explicit fields with inline errors.

- [ ] **Step 4: Preserve official Evidence behavior**

  Official Evidence stays online/server-authoritative. Show selected filename, upload/scan/review state, and version history; do not expose OPFS Inspection Attachments as official Evidence.

- [ ] **Step 5: Run Auditee isolation and parity gates**

  ```bash
  npm --prefix apps/web test -- src/features/caps
  npm --prefix apps/web run test:e2e:mock
  npm --prefix apps/web run test:e2e:parity -- --grep "auditee-home"
  ./scripts/test-http-profile.sh
  ```

- [ ] **Step 6: Commit and push only Task 9**

  ```bash
  git add apps/web/src/features/caps apps/web/tests/e2e docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align auditee workspace"
  git push origin HEAD
  ```

---

### Task 10: Migrate Department Manager Dashboard, Organizations, Planning, And Report Preview

**Files:**

- Modify: `apps/web/src/features/findings/manager-dashboard-page.tsx`
- Modify: `apps/web/src/features/organizations/organization-registry-page.tsx`
- Modify: `apps/web/src/features/planning/planning-workspaces.tsx`
- Modify: `apps/web/src/features/reports/report-preview-page.tsx`
- Create/modify: colocated tests
- Modify: first-production and parity Playwright specs
- Modify: this plan

**Interfaces:**

- Consumes existing manager dashboard, organizations, planning items, planning decisions, report versions, and audit events.
- Produces a compact management attention workbench, organization register, plan dossier/calendar, and immutable report preview matching accepted root patterns.

- [ ] **Step 1: Write failing Manager tests**

  Require compact attention metrics, actionable rows, organization status and exact scope, plan status/owner/next action/revision, report version/status/approval facts, and mobile records without document overflow.

- [ ] **Step 2: Run focused red tests**

  ```bash
  npm --prefix apps/web test -- src/features/findings/manager-dashboard-page.test.tsx src/features/organizations src/features/planning src/features/reports/report-preview-page.test.tsx
  ```

- [ ] **Step 3: Migrate the manager dashboard**

  Follow the root's smallest useful decision set. Do not recreate unsupported advanced-risk charts; show only server-shaped counts/attention items and connected navigation.

- [ ] **Step 4: Migrate organization registry**

  Provide desktop table and mobile cards with exact organization identity, type, status, open Finding/next Audit context available from the projection. Preserve Auditee isolation at API level.

- [ ] **Step 5: Migrate Audit Plan Calendar/dossier**

  Show the exact Finance -> GM -> Executive Director -> GM Release chain, current owner, reason-required decision, revision, and history. Department Manager does not perform another role's decision.

- [ ] **Step 6: Migrate report preview**

  Keep exact report version, status, Finding linkage, approval state, and candidate-only document boundary. Report issue does not close Findings.

- [ ] **Step 7: Run focused, route, and visual gates**

  ```bash
  npm --prefix apps/web test -- src/features/findings src/features/organizations src/features/planning src/features/reports
  npm --prefix apps/web run test:e2e:parity -- --grep "manager-home|organization-registry|audit-plan|report-preview"
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  ```

- [ ] **Step 8: Commit and push only Task 10**

  ```bash
  git add apps/web/src/features/findings apps/web/src/features/organizations apps/web/src/features/planning apps/web/src/features/reports/report-preview-page.tsx apps/web/tests/e2e docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align manager workspaces"
  git push origin HEAD
  ```

---

### Task 11: Migrate Finance, General Manager, And Executive Director Decision Workspaces

**Files:**

- Modify: `apps/web/src/features/planning/planning-workspaces.tsx`
- Modify: `apps/web/src/features/reports/executive-dashboard-page.tsx`
- Create/modify: colocated tests
- Modify: first-production route and parity specs
- Modify: this plan

**Interfaces:**

- Consumes the existing shared planning item and exact revision/decision Backend operations.
- Produces root-compatible Finance budget dossier, General Manager intermediate/release workspace, and Executive Director final plan decision workspace.

- [ ] **Step 1: Write failing authority/visual tests**

  Require role-specific title/navigation, exact current owner, planning status, requested budget, reason field, allowed decision buttons, history, and no cross-role decision control.

- [ ] **Step 2: Run focused red tests**

  ```bash
  npm --prefix apps/web test -- src/features/planning src/features/reports/executive-dashboard-page.test.tsx
  ```

- [ ] **Step 3: Migrate Finance Review**

  Show one queue/dossier, `Approve Budget`, and `Return for Revision`. Finance cannot edit scope, approve the final plan, or release it.

- [ ] **Step 4: Migrate General Manager workspace**

  Show GM Review and GM Release as distinct stages. GM cannot act as Executive Director and cannot release before ED approval.

- [ ] **Step 5: Migrate Executive Director workspace**

  Show eligible final plan decisions, literal candidate-only approval mark language, and next owner GM Release. Do not add enforcement action to planning.

- [ ] **Step 6: Run full authority chain at all viewports**

  ```bash
  npm --prefix apps/web run test:e2e:parity -- --grep "finance-home|gm-home|executive-home"
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  ```

  Expected chain: `FINANCE_REVIEW -> GM_REVIEW -> EXECUTIVE_DIRECTOR_REVIEW -> GM_RELEASE -> RELEASED`, with exact owner and reason at every stage.

- [ ] **Step 7: Commit and push only Task 11**

  ```bash
  git add apps/web/src/features/planning apps/web/src/features/reports/executive-dashboard-page.tsx apps/web/tests/e2e docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align leadership workspaces"
  git push origin HEAD
  ```

---

### Task 12: Migrate The Connected Admin Configuration Preview

**Files:**

- Modify: `apps/web/src/features/admin/admin-configuration-page.tsx`
- Create/modify: `apps/web/src/features/admin/admin-configuration-page.test.tsx`
- Modify: first-production and parity specs
- Modify: this plan

**Interfaces:**

- Consumes read-only checklist-template versions, reminder rules, and audit events.
- Produces the accepted root configuration-studio visual pattern without implying production user/configuration editing.

- [ ] **Step 1: Write failing Admin tests**

  Require selected template/version preview, configured question/reference/evidence fields, reminder rule rows, audit-event rows, readable empty/error states, and explicit read-only/candidate boundaries. Reject enabled create/edit/publish/user-management controls.

- [ ] **Step 2: Run focused red tests**

  ```bash
  npm --prefix apps/web test -- src/features/admin/admin-configuration-page.test.tsx
  ```

- [ ] **Step 3: Migrate the configuration-studio layout**

  Match the root Admin Question Bank/Template Preview composition: register/selection on the left, selected record preview on the right, responsive stacking on mobile. Show only Backend-provided version/rule/event data.

- [ ] **Step 4: Verify Admin isolation and parity**

  ```bash
  npm --prefix apps/web test -- src/features/admin
  npm --prefix apps/web run test:e2e:parity -- --grep "admin-home"
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  ```

- [ ] **Step 5: Commit and push only Task 12**

  ```bash
  git add apps/web/src/features/admin apps/web/tests/e2e docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "feat(ui): align admin configuration preview"
  git push origin HEAD
  ```

  **Review checkpoint:** stakeholder reviews the complete 17-surface desktop/tablet/mobile contact sheets. Rejected surfaces return to their owning task; do not continue to final acceptance by merely raising diff thresholds.

---

### Task 13: Enforce The Remaining-Legacy And No-Placeholder Boundary

**Files:**

- Modify: `apps/web/src/parity/legacy-screen-manifest.ts`
- Modify: `apps/web/src/parity/legacy-screen-manifest.test.ts`
- Modify: `apps/web/src/app/router.test.tsx`
- Modify: `apps/web/scripts/assert-http-artifact.mjs`
- Modify: `docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md`
- Modify: matching Turkish companion
- Modify: `docs/exec-plans/tech-debt-tracker.md`
- Modify: this plan

**Interfaces:**

- Produces a machine-enforced rule that every React route is connected and every non-connected legacy route has no React path.
- Produces a reviewer-facing promotion template for future complete route-family plans.

- [ ] **Step 1: Write failing no-placeholder assertions**

  Assert:

  ```ts
  expect(appRoutes.sort()).toEqual(
    BACKEND_CONNECTED_SURFACES.map(({ reactPath }) => reactPath).sort(),
  );
  expect(sourceText).not.toMatch(/RoleEntryPlaceholder|coming soon|implement later/i);
  expect(
    LEGACY_SCREEN_INVENTORY.filter(({ reactPath }) => reactPath === null),
  ).toHaveLength(69);
  ```

  Add the HTTP artifact scan rule that rejects root `js/`, `css/styles.css`, role fixture, canonical-test, mock, and seed inputs.

- [ ] **Step 2: Run the red boundary test**

  ```bash
  npm --prefix apps/web test -- src/parity/legacy-screen-manifest.test.ts src/app/router.test.tsx
  ```

  Expected: FAIL if `RoleEntryPlaceholder` or any unclassified route remains.

- [ ] **Step 3: Remove placeholder routes/components**

  A connected route renders a real feature. A non-connected route does not exist in React navigation/router. The root demo remains the reachable reference for its classified legacy surfaces.

- [ ] **Step 4: Document the promotion gate**

  A future route family may change from legacy-only to connected only when one reviewed slice includes:

  1. canonical vocabulary and owner decision;
  2. OpenAPI paths/schemas/examples and generated drift checks;
  3. Backend capability and deterministic mock behavior;
  4. Go domain/storage/authorization/audit/outbox behavior;
  5. React route/action/state/visibility behavior;
  6. the same mock and real HTTP browser scenario;
  7. visual parity reference and three-viewport evidence;
  8. updated disposition count and stakeholder acceptance.

- [ ] **Step 5: Run boundary and artifact gates**

  ```bash
  npm --prefix apps/web test -- src/parity src/app/router.test.tsx
  npm --prefix apps/web run build:http
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  node --test tests/demo-boundary-smoke.test.js
  ```

- [ ] **Step 6: Commit and push only Task 13**

  ```bash
  git add apps/web/src/parity apps/web/src/app/router.test.tsx apps/web/scripts/assert-http-artifact.mjs docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.md docs/product-specs/ux-plan/REACT_LEGACY_UI_PARITY_CONTRACT.turkce.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git commit -m "docs(ui): classify remaining legacy surfaces"
  git push origin HEAD
  ```

---

### Task 14: Run The Full Candidate Matrix And Request Stakeholder Acceptance

**Files:**

- Create: `docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.md`
- Create: `docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.turkce.md`
- Modify: `README.md`
- Modify: `README.turkce.md`
- Modify: `MANIFEST.md`
- Modify: `docs/index.md`
- Modify: `docs/demo-evidence/BUILD_SUMMARY.md`
- Modify: `docs/demo-evidence/BUILD_SUMMARY.turkce.md`
- Modify: parent production-transition plan
- Modify: `docs/exec-plans/index.md`
- Modify: `docs/exec-plans/tech-debt-tracker.md`
- Modify: this plan

**Interfaces:**

- Produces a local evidence packet and stakeholder acceptance request; it does not produce deployment or cutover authority.

- [ ] **Step 1: Run clean JavaScript dependency and contract gates**

  ```bash
  npm --prefix apps/web ci
  npm --prefix apps/web run contracts:check
  npm --prefix apps/web run typecheck
  npm --prefix apps/web test
  ```

  Expected: clean install, contract drift, typecheck, and all React unit/component tests PASS with zero skips.

- [ ] **Step 2: Run builds and artifact isolation**

  ```bash
  npm --prefix apps/web run build:demo
  npm --prefix apps/web run build:http
  node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http
  npm --prefix apps/web run check:app-shell
  ```

  Expected: both artifacts PASS; HTTP contains no mock/seed/test/root-demo runtime inputs; CSP and app-shell inventories remain valid.

- [ ] **Step 3: Run the 51-pair visual matrix**

  ```bash
  npm --prefix apps/web run test:e2e:parity
  ```

  Expected: 17 surfaces × 3 viewports PASS; all captures present; exact role/path/heading; zero unexpected console issues; zero document overflow; threshold exceptions explicitly enumerated.

- [ ] **Step 4: Run mock, HTTP, and real-offline browser matrices**

  ```bash
  npm --prefix apps/web run test:e2e:mock
  ./scripts/test-http-profile.sh
  npm --prefix apps/web run test:e2e:offline
  ```

  Expected: canonical lifecycle, first-production routes, normal/canonical auth, backend contracts, real PostgreSQL/Keycloak/MinIO, worker, sync, conflict, and offline recovery PASS without skipped required tests.

- [ ] **Step 5: Run root legacy oracle and syntax gates**

  ```bash
  node --test tests/*.test.js tests/parity/react-legacy-parity.test.mjs
  node --check js/data.js
  node --check js/helpers.js
  node --check js/approval.js
  node --check js/planning.js
  node --check js/checklists.js
  node --check js/inspection.js
  node --check js/reports.js
  node --check js/manager-workspaces.js
  node --check js/work-items.js
  node --check js/views.js
  node --check js/app.js
  ```

  Expected: root demo unchanged and all legacy/parity tests PASS.

- [ ] **Step 6: Run security, dependency, and recovery gates**

  ```bash
  npm --prefix apps/web audit --json
  npm --prefix apps/web audit --omit=dev --json
  GOCACHE=/private/tmp/aviasurveil360-ui-parity-go-cache go -C apps/api vet ./...
  ./scripts/test-local-recovery.sh
  ```

  Expected: audits report zero vulnerabilities; Go vet and isolated PostgreSQL/object recovery PASS. If registry/network access prevents a fresh audit, label only that check `blocked` or `not run`; do not reuse an old date as fresh evidence.

- [ ] **Step 7: Inspect runtime cleanup**

  Check for task-owned Vite, Go API, worker, Playwright, Chrome, webdriver, and Docker processes. Stop only task-owned resources. Do not terminate the user's unrelated browser/profile or unrelated containers.

- [ ] **Step 8: Write bilingual evidence**

  Record exact commands, counts, browser/tool versions, reference commit, diff thresholds/exceptions, screenshots, console/overflow/accessibility results, auth profile distinctions, artifact boundary, root demo status, cleanup, and production exclusions. Use literal evidence labels.

- [ ] **Step 9: Reconcile plan lifecycle**

  - If every local gate passes, set this plan to `ready-for-verification`; do not move it to completed until the user explicitly accepts the React visual parity.
  - Keep the parent production-transition plan `active` or `ready-for-verification` according to actual stakeholder acceptance; do not claim acceptance from automated tests alone.
  - Keep production release/operations, production Identity/MFA/provisioning, records, hosting, monitoring/on-call, pilot, cutover, and legacy removal notes open and `blocked`.

- [ ] **Step 10: Commit and push only Task 14**

  ```bash
  git add README.md README.turkce.md MANIFEST.md docs/index.md docs/demo-evidence/BUILD_SUMMARY.md docs/demo-evidence/BUILD_SUMMARY.turkce.md docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.md docs/demo-evidence/REACT_LEGACY_UI_PARITY_2026-07-21.turkce.md docs/exec-plans/index.md docs/exec-plans/tech-debt-tracker.md docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md
  git diff --cached --check
  git diff --cached --stat
  git commit -m "test(release): verify react legacy ui parity"
  git push origin HEAD
  ```

  Expected: local candidate evidence is pushed; no deployment, PR, comment, traffic, or branch action occurs.

## Verification Matrix

| Layer | Required evidence |
|---|---|
| Contract/disposition | 86 unique legacy rows, 17 connected, 69 legacy-only, no placeholder path |
| Brand/shell | Local assets, accepted tokens, eight role cards in demo/test, session roles in normal HTTP, strict visual ratio |
| Auth/session | Real local Keycloak Authorization Code + PKCE, safe session projection, CSRF mutation, logout/revocation, no browser tokens |
| React components | Typecheck and all unit/component tests with zero skips |
| Visual parity | 51 reference/React pairs, thresholds, geometry, headings, roles, console, overflow, mobile targets |
| Mock behavior | Complete canonical lifecycle and first-production route matrix |
| Real HTTP behavior | Same Backend contract/scenarios against Go/PostgreSQL/MinIO/worker |
| Offline | Readiness, IndexedDB, OPFS, outbox, sync/conflict, restart/update recovery unchanged |
| Security/privacy | Role/org/assignment/direct-ID/list/pull isolation; Auditee forbidden-field scan; CSP/rate/session/CSRF tests |
| Artifact boundary | HTTP build excludes mock, seed, canonical-test, and root-demo runtime code |
| Legacy oracle | Root Node/parity suite green; root demo files unchanged |
| Operations-local | Dependency audits, Go vet/race via HTTP profile, worker drain, recovery drill, task-owned cleanup |
| Stakeholder | Explicit acceptance of role selection, shell, 17 surfaces, and route disposition; automated tests alone do not satisfy this row |

## Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Copying 19k lines of CSS creates a second unmaintainable legacy layer | React becomes another global stylesheet clone | Extract accepted tokens and focused primitives; prohibit wholesale CSS copy; add component ownership and style-layer tests |
| Pixel tests are flaky or meaningless | False failure or false confidence | Pin browser/font/data/viewports, mask only named dynamic regions, combine image ratios with semantic/geometry assertions, prove harness failure by perturbation |
| Visual parity weakens domain rules | Attractive but incorrect workflow | Product/security docs outrank screenshots; retain existing Backend and authority tests in every role slice |
| Role switch leaks into real auth | User can impersonate roles client-side | Role selection only in demo/canonical-test entries; normal HTTP intersects routes with server session roles |
| CSRF/session integration breaks mutations | HTTP UI appears connected but cannot act | Add focused session client tests and one real Keycloak CSRF mutation browser gate before role migration |
| Full 86-screen expectation silently expands backend | Huge unreviewed scope and fake routes | Inventory all 86, connect only 17 accepted surfaces, enforce null React paths for the other 69, require complete future vertical plans |
| Inspector UI refactor breaks offline recovery | Field work loss or false acknowledgement | Keep FieldRepository/OPFS/outbox interfaces unchanged and run the real offline matrix in Task 7 and Task 14 |
| Normal HTTP only has one local Keycloak role | Incomplete eight-role production demo | Keep eight-role canonical-test profile for deterministic demonstration; normal HTTP truthfully shows only issued session roles; provisioning remains out of scope |
| Existing user changes are staged accidentally | Workspace loss or polluted commits | Explicit per-task path staging, cached diff/stat review, protected untracked paths, no broad `git add .` |
| Stakeholder rejects another broad pass late | Rework across all screens | Review checkpoints after shell, canonical lifecycle, and complete contact sheets; rejected slice blocks downstream tasks |

## Decision Log

| Date | Decision | Status |
|---|---|---|
| 2026-07-21 | Current user rejected the minimal React shell as unrelated to the original interface. | accepted input |
| 2026-07-21 | Preserve root Vanilla demo as visual/behavior oracle and keep Go/React technical architecture. | proposed; review required |
| 2026-07-21 | Target controlled visual parity for 17 backend-connected surfaces; inventory but do not fake-migrate the other 69 legacy states. | proposed; review required |
| 2026-07-21 | Demo/canonical-test may switch among eight deterministic roles; normal HTTP must use OIDC session roles and CSRF. | proposed; review required |
| 2026-07-21 | One Conventional Commit and push per completed task on the current branch; no branch operations. | user-authorized execution rule |
| 2026-07-21 | Production deployment/cutover and legacy removal remain outside this plan. | retained boundary |

## Plan Self-Review Checklist

- [x] Covers the user's concrete objection: role-selection, shell, and connected pages must match the accepted root product language.
- [x] Separates visual parity from unapproved production route expansion.
- [x] Maps exact current React surfaces, roles, source states, and paths.
- [x] Preserves backend, auth, privacy, lifecycle, offline, sync, artifact, and root-demo constraints.
- [x] Includes test-first red/green cycles, exact commands, review checkpoints, per-task commit/push points, and final evidence.
- [x] Defines normal HTTP OIDC/session behavior instead of calling canonical test headers a membership system.
- [x] Leaves production Identity/MFA/provisioning, hosting, records, operations, deployment, cutover, and removal blocked.
- [x] Contains no implementation placeholder or instruction to weaken a failing gate.

## Independent Plan Review Prompt

Copy the following prompt into a new Codex task for review only:

```text
Perform an independent, evidence-based review of the AviaSurveil360 plan at:
docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md

This is a review-only task. Do not edit files, implement code, start or stop servers/containers, stage, commit, push, deploy, create/switch branches, open a PR, or post GitHub comments. Do not dispatch subagents.

Before reviewing:
1. Read AGENTS.md completely and then the repository source-of-truth documents it requires.
2. Read the entire reviewed plan.
3. Read the entire parent production-transition plan at docs/exec-plans/active/2026-07-20-react-vite-pwa-go-offline-first-production-plan.md.
4. Inspect the accepted root Vanilla interface and behavior sources: index.html, css/styles.css, js/app.js, js/views.js, js/data.js, relevant root tests, docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md, and the critical screenshots under qa/screenshots/.
5. Inspect the current React/Go candidate surfaces: apps/web/src/app/router.tsx, apps/web/src/features/, apps/web/src/styles/app.css, apps/web/src/backend/, apps/web/src/entry/, apps/api/internal/httpapi/, apps/api/internal/identity/, apps/api/internal/platform/session/, api/openapi/aviasurveil360.yaml, and docs/demo-evidence/LOCAL_RELEASE_CANDIDATE_2026-07-21.md.

Review the plan for correctness, completeness, feasibility, task ordering, testability, and scope control. In particular determine whether:
- it directly solves the user's complaint that the React interface is visually unrelated to the original;
- the 17 backend-connected surfaces and 86-screen disposition model are accurate and do not hide missing required screens;
- keeping 69 screens legacy-only is justified by current Product scope or conflicts with the user's requested outcome;
- the visual comparison approach is deterministic, meaningful, and resistant to broad masks or relaxed thresholds;
- the proposed React component/style boundaries avoid copying legacy globals or creating a second unmaintainable CSS system;
- normal HTTP OIDC/session/CSRF integration is technically correct and clearly separated from demo/canonical-test role switching;
- every visible action remains backed by Backend or an existing explicit local/offline boundary;
- Potential Finding authority, CAP/Evidence separation, immutable versions, organization isolation, Internal CAA Note separation, report/closure authority, and offline recovery remain protected;
- the HTTP artifact can still exclude mock/seed/canonical-test/root-demo runtime code while reusing brand assets;
- every task is independently reviewable, has a credible red/green cycle, and uses exact files/interfaces/commands;
- per-task commit/push instructions preserve unrelated working-tree content;
- required docs, bilingual evidence, plan lifecycle, and literal evidence labels are complete;
- production deployment, cutover, Identity/MFA/provisioning, records, hosting, monitoring/on-call, and legacy removal remain correctly blocked.

Return findings first, ordered by severity and labelled Blocking, Suggestion, Nit, or FYI. For every finding cite the exact plan section and supporting repository file/line. Do not approve based on intent; verify claims against source.

Then return:
1. Verdict: GO, CONDITIONAL GO, or NO-GO.
2. Scope reconciliation: expected user outcome versus the plan's exact delivered outcome.
3. Missing task/interface/test list, if any.
4. Security/privacy/offline regression assessment.
5. Visual-parity harness assessment.
6. Execution-order and commit-boundary assessment.
7. Exact plan edits required before execution.

Use GO only if there are no Blocking findings. Use CONDITIONAL GO only when every condition is concrete, bounded, and can be applied to the plan before implementation. Do not claim production readiness.
```

## Execution Prompt

After independent review findings are applied and the user accepts the revised plan, execute with this exact prompt:

```text
Execute docs/exec-plans/active/2026-07-21-react-legacy-ui-parity-and-backend-integration-plan.md task-by-task for AviaSurveil360.

Before implementation, read AGENTS.md and every source-of-truth document it requires, read the entire reviewed plan and its accepted review findings, and use the superpowers:executing-plans skill. Do not dispatch subagents unless the user explicitly authorizes them in this execution task.

Work on the current branch. Do not create, switch, rename, or delete branches. Preserve all unrelated working-tree changes and untracked .superpowers/, docs/demo-evidence/stakeholder/, and outputs/ content. Use apply_patch for text edits.

Follow the binding task order and TDD cycle exactly. After each task passes its focused and broader gates, stage only that task's files, inspect the cached diff, create the specified Conventional Commit, and push the current branch to origin. Stop on a failed required gate, an unresolved Blocking owner decision, or a change that would expand a later/demo-only route into production without a complete reviewed vertical slice.

Keep the root Vanilla demo intact as the visual and behavioral oracle. Build controlled visual parity for the 17 backend-connected React surfaces, inventory all 86 legacy screen states, and do not create inert React placeholders for the other 69. Reuse existing brand assets without copying legacy global state or root JavaScript into React.

Normal HTTP must use the existing same-origin OIDC browser session, session roles, and CSRF boundary. Demo and canonical-test HTTP may retain deterministic role switching. Do not add self-registration, public sign-up, password management, production MFA/provisioning, deployment, traffic routing, cutover, or legacy removal.

Preserve Backend, FieldRepository, offline, sync, authority, privacy, Potential Finding, CAP, Evidence version, Internal CAA Note, report, closure, artifact-separation, and candidate-only boundaries. Every visible control must work or be explicitly disabled with a reason.

At each review checkpoint, present the exact screenshots/evidence requested by the plan and wait for stakeholder acceptance before continuing. Use verified locally, not run, blocked, candidate-only, release pending, and production-ready literally. The final result may be ready-for-verification and candidate-only; it may not be deployed or called production-ready.
```
