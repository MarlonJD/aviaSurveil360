import { describe, expect, it } from "vitest";

import {
  browserTelemetryContract,
  validateBrowserTelemetryContract,
  type BrowserTelemetryContract,
} from "./telemetry-contract";

describe("browser telemetry contract", () => {
  it("defines bounded route, Web Vital, API outcome, and handled-error signals", () => {
    const contract = browserTelemetryContract();
    expect(validateBrowserTelemetryContract(contract)).toEqual([]);
    expect(contract.signals.map((signal) => signal.name)).toEqual([
      "browser.route.navigation",
      "browser.web_vital",
      "browser.api.outcome",
      "browser.error.handled",
    ]);
    expect(contract.signals[0]?.allowedAttributes).toContain("correlation.id");
    expect(contract.signals[3]?.allowedAttributes).toContain("correlation.id");
    expect(contract.signals[1]?.unit).toBe("{web_vital}");
  });

  it("rejects sensitive, content-bearing, or high-cardinality attributes", () => {
    const invalid: BrowserTelemetryContract = structuredClone(browserTelemetryContract());
    invalid.signals[0].allowedAttributes.push(
      "session.cookie",
      "message.body",
      "finding.id",
    );
    expect(validateBrowserTelemetryContract(invalid)).toEqual([
      "browser.route.navigation: forbidden attribute finding.id",
      "browser.route.navigation: forbidden attribute message.body",
      "browser.route.navigation: forbidden attribute session.cookie",
    ]);
  });

  it("requires every signal to have an owner and redaction class", () => {
    const invalid: BrowserTelemetryContract = structuredClone(browserTelemetryContract());
    invalid.signals[0].owner = "";
    invalid.signals[1].redactionClass = "";
    expect(validateBrowserTelemetryContract(invalid)).toEqual([
      "browser.route.navigation: owner is required",
      "browser.web_vital: redaction class is required",
    ]);
  });
});
