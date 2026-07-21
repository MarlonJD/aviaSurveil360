import { createHttpBackend } from "../../src/backend/http-backend";
import { createCanonicalTestFetch } from "../../src/test-profile/http-test-boundary";
import { backendContract, type BackendContractHarness } from "./backend-contract";

const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
const testToken = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";

backendContract(async (): Promise<BackendContractHarness> => {
  const response = await fetch(`${apiURL}/__test/reset`, {
    method: "POST",
    headers: { "x-avia-test-token": testToken },
  });
  if (!response.ok) {
    throw new Error(`Canonical HTTP reset failed with ${response.status}: ${await response.text()}`);
  }
  return {
    backendFor: (principal) =>
      createHttpBackend(
        { apiBaseUrl: apiURL, environmentLabel: "Canonical HTTP contract" },
        { fetchImplementation: createCanonicalTestFetch(principal.subjectId, testToken) },
      ),
  };
});
