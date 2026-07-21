import { describe, expect, it } from "vitest";

import { classifyAppShellRequest } from "../sw";

describe("Service Worker request policy", () => {
  it.each([
    ["https://candidate.test/", "navigate", "app-shell-navigation"],
    ["https://candidate.test/inspector/audits/AUD-2026-001", "navigate", "app-shell-navigation"],
    ["https://candidate.test/assets/index-abcd1234.js", "no-cors", "versioned-static-asset"],
    ["https://candidate.test/http-config.json", "cors", "versioned-static-asset"],
  ] as const)("classifies %s as %s", (url, mode, expected) => {
    expect(
      classifyAppShellRequest(
        { url, method: "GET", mode },
        "https://candidate.test",
      ),
    ).toBe(expected);
  });

  it.each([
    "https://candidate.test/v1/findings",
    "https://candidate.test/auth/session",
    "https://candidate.test/health/ready",
    "https://candidate.test/__test/reset",
    "https://candidate.test/reports/RPT-001.pdf",
    "https://other.test/assets/index-abcd1234.js",
  ])("never caches business, API, auth, health, test, or cross-origin request %s", (url) => {
    expect(
      classifyAppShellRequest(
        { url, method: "GET", mode: "cors" },
        "https://candidate.test",
      ),
    ).toBe("network-only");
  });

  it("never caches a mutation even when its path resembles a static asset", () => {
    expect(
      classifyAppShellRequest(
        {
          url: "https://candidate.test/assets/index-abcd1234.js",
          method: "POST",
          mode: "cors",
        },
        "https://candidate.test",
      ),
    ).toBe("network-only");
  });
});
