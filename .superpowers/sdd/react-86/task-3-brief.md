### Task 3: Expand The Visual Oracle To 258 Pairs

**Files**

- Modify `apps/web/tests/e2e/support/legacy-parity-fixtures.ts`
- Modify `apps/web/tests/e2e/legacy-visual-parity.spec.ts`
- Modify `apps/web/tests/visual/visual-contract.test.ts`
- Modify `apps/web/scripts/verify-visual-baselines.mjs`
- Modify `apps/web/tests/visual-baselines/react-legacy-parity/baseline-manifest.json`
- Add 207 PNGs under
  `apps/web/tests/visual-baselines/react-legacy-parity/{desktop,tablet,mobile}/`
- Replace the six tracked role-crossed baselines for `ui-audit-009` and
  `ui-audit-044` with source-role-correct captures
- Modify `apps/web/scripts/assert-parity-boundary.mjs`

**Interfaces**

- Exactly 86 surfaces × 3 viewports = 258 legacy/React comparisons.
- The 207 new images cover the 69 new rows; the six replaced images correct the
  two inherited source-role mismatches and do not change the 86-surface count.
- Decoded RGBA threshold remains per-channel delta `40`, shell `<= 0.03`,
  predeclared content `<= 0.08`, masks explicit and `<= 5%`.

- [ ] Add red mutation fixtures for missing route, skipped viewport, absent
  shell/content region, changed comparator, untracked baseline, broad mask, and
  candidate/result attachment count below 258.
- [ ] Run the visual contract and boundary tests; confirm every mutation fails
  for its named reason.
- [ ] Capture the remaining accepted root states with pinned Chromium inputs,
  inspect every new baseline contact sheet, and update the hash manifest only
  through the reviewed baseline command.
- [ ] Run baseline verification and a no-op root recapture; expect 258 valid
  hashes, zero missing metadata, and no unauthorized root-source change.
- [ ] Commit exactly `test(ui): expand full screen visual oracle`.

