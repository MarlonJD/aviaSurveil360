import { expect, test } from "@playwright/test";

import { createHttpBackend } from "../../src/backend/http-backend";
import type { BackendPrincipal } from "../../src/backend/backend";
import { createMockBackend } from "../../src/mock/create-mock-backend";
import { MemoryMockStore } from "../../src/mock/memory-mock-store";
import { createCanonicalTestFetch } from "../../src/test-profile/http-test-boundary";
import {
  FIXED_NOW,
  type BackendContractHarness,
} from "../contract/backend-contract";
import {
  FULL_PLATFORM_EXPECTED_TRANSCRIPT,
  normalizeFullPlatformTranscript,
  runFullPlatformScenarios,
  type FullPlatformTranscript,
} from "../contract/full-platform-backend.contract";

const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
const testToken = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";

function httpSubject(principal: BackendPrincipal): string {
  return principal.subjectId === "USR-INSPECTOR-AMINA"
    ? "154ec5ac-6f97-4f55-916f-d2f142fc6211"
    : principal.subjectId;
}

test.beforeAll(async ({ request }, testInfo) => {
  if (testInfo.project.name !== "http") return;
  const response = await request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": testToken },
  });
  expect(response.ok()).toBe(true);
});

test("ten scenario families have exact normalized MockBackend and HttpBackend parity", async (
  {},
  testInfo,
) => {
  let harness: BackendContractHarness;
  if (testInfo.project.name === "http") {
    harness = {
      backendFor(principal) {
        return createHttpBackend(
          { apiBaseUrl: apiURL, environmentLabel: "Full-platform HTTP parity" },
          { fetchImplementation: createCanonicalTestFetch(httpSubject(principal), testToken) },
        );
      },
    };
  } else {
    const store = MemoryMockStore.createCanonical({ clock: () => FIXED_NOW });
    store.execute("TEST-FIXTURE-FINAL-REPORT-DM-REVIEW", {}, (state) => {
      const report = state.reportVersions["RPT-CAB-2026-001-V1"];
      if (!report) throw new Error("Canonical Final Report fixture is unavailable.");
      report.status = "DEPARTMENT_REVIEW";
      report.revision = 1;
      report.issuedAt = null;
      return report;
    });
    harness = {
      backendFor(principal) {
        return createMockBackend({ store, principal });
      },
    };
  }
  expect(await runFullPlatformScenarios(harness)).toEqual(FULL_PLATFORM_EXPECTED_TRANSCRIPT);
});

test("normalizer rejects a forbidden private field", () => {
  expect(() => normalizeFullPlatformTranscript({
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    statuses: { internalCaaNote: "must never cross the boundary" },
  })).toThrow(/Forbidden private/);
});

test("normalizer rejects a missing denial", () => {
  expect(() => normalizeFullPlatformTranscript({
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    denials: FULL_PLATFORM_EXPECTED_TRANSCRIPT.denials.slice(1),
  })).toThrow(/missing a required denial/);
});

test("normalizer rejects a missing audit event", () => {
  expect(() => normalizeFullPlatformTranscript({
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    auditEventTypes: [],
  })).toThrow(/missing a required audit event/);
});

test("normalizer rejects a missing required scenario proof", () => {
  expect(() => normalizeFullPlatformTranscript({
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    scenarioProofs: [],
  })).toThrow(/missing a required scenario proof/);
});

test("normalizer rejects UI-only state", () => {
  expect(() => normalizeFullPlatformTranscript({
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    dashboardProjections: { uiOnlyState: "selected" },
  })).toThrow(/UI-only field/);
});

test("a normalized mismatch cannot equal the frozen transcript", () => {
  const mutation: FullPlatformTranscript = {
    ...FULL_PLATFORM_EXPECTED_TRANSCRIPT,
    statuses: { ...FULL_PLATFORM_EXPECTED_TRANSCRIPT.statuses, finding: "OPEN" },
  };
  expect(mutation).not.toEqual(FULL_PLATFORM_EXPECTED_TRANSCRIPT);
});
