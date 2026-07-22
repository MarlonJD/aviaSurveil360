# Task 4 Pause Handoff

Date: 2026-07-22

## Literal Status

- Task 1: completed and independently approved locally; no commit authorized.
- Task 2: completed and independently approved locally; no commit authorized.
- Task 3: completed and independently approved locally; no commit authorized.
- Task 4: paused during the independent-review fix loop.
- Tasks 5–12: not started.
- Plan 2: not started and not authorized.

Task 4 is not complete. The implementer reported the focused functional and
contract review-fix suite green at 27/27, but the controller did not rerun that
suite after the final interrupted edits. The latest complete 33-pair visual run
after an earlier fix wave passed 16/33. A later partial 21-pair run passed 7/21
and failed 14/21. A fresh complete 33-pair run after the newest edits is `not
run`, so the visual gate is literally `not verified`.

## Independent Review

Verdict: `Changes Required`.

The implementer subsequently reported fixes for the functional findings below,
but they need fresh controller verification and an independent re-review:

1. Inspector Findings, Messages, Calendar, and Reports shell navigation was
   disabled; Assistant was unreachable contextually.
2. Obsolete `/lead-inspector/findings/...` links wildcard-redirected from Lead,
   Manager, Evidence, and CAP screens.
3. Finding, Calendar, and Report rows opened the wrong frozen record.
4. Inspector `Review CAP` only scrolled and did not preserve Lead authority.
5. Assistant displayed CAB/Fly Namibia while drafting against SkyCargo.
6. Mobile/action tests did not prove responsive hierarchy or shell reachability.
7. Profile did not hydrate persisted display name after remount.

The reviewer also found the Task 4 visual gate red. Do not mark Task 4 complete
until all 11 Inspector surfaces × 3 viewports pass unchanged baselines,
thresholds, and bounded-mask rules, and a fresh independent reviewer returns
both spec-compliance and code-quality approval.

## Remaining Visual Work At Pause

The final partial run reported these remaining failures:

- Findings desktop `0.09259` and tablet `0.08239`, plus 40px dossier tabs.
- Messages tablet content-header `0.08051`.
- Calendar desktop header `0.11339`, with tablet/mobile layout still failing;
  mobile was `0.14467` in the partial report.
- Reports mobile `0.08998`.
- Finding Detail mobile `0.14796`.
- Closure desktop header `0.08412`, tablet still failing, mobile `0.14965`.
- Assistant desktop sidebar `0.05544` and content `0.08411`; tablet sidebar
  `0.06496`, header `0.09450`, content `0.10553`; mobile content `0.12156`.

Accepted diagnostic direction:

- Replace per-page header margin hacks with one reserved header/topbar area.
- Keep one accessible active Inspector navigation item.
- Restore accepted Findings queue+dossier geometry.
- Use table-first Message/Calendar/Report hierarchy.
- Keep report sheet width and inner padding source-faithful.
- Keep Assistant source context/review table source-faithful and all targets at
  least 44px.
- Preserve Profile's quiet fact-card geometry while keeping persistence usable.

Read `/private/tmp/task4-visual-diagnostics.md` and
`/private/tmp/task4-source-mapping.md` if they still exist. They are read-only
diagnostics and did not modify repository files.

## Resume Contract

1. Read repo instructions, the active plan, progress ledger, Task 4 brief,
   implementer report, and this handoff.
2. Inspect the dirty working tree and preserve every unrelated user change.
3. Resume only Task 4 with one writing implementer. Parallel agents may perform
   read-only diagnostics/review, but must not edit overlapping files.
4. Run the focused functional/contract suite, typecheck, demo build, scoped 33
   visual comparisons, boundary/profile checks, root-source diff, and
   `git diff --check` from the current tree.
5. Do not weaken thresholds, broaden masks, replace baselines, or change the
   root oracle to manufacture a pass.
6. Obtain a fresh independent Task 4 re-review. Fix every Critical/Important
   finding before Task 5.
7. Continue Tasks 5–12 in exact order only after Task 4 is approved.
8. Do not commit, branch, push, deploy, or start Plan 2 without separate user
   authorization.
