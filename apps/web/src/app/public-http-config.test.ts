import { describe, expect, it } from "vitest";

import { parsePublicHttpConfig } from "./public-http-config";

describe("parsePublicHttpConfig", () => {
  it("accepts only the public API base URL and environment label", () => {
    expect(
      parsePublicHttpConfig({ apiBaseUrl: "/", environmentLabel: "Local HTTP candidate" }),
    ).toEqual({ apiBaseUrl: "/", environmentLabel: "Local HTTP candidate" });
  });

  it.each(["backendMode", "token", "clientSecret", "oidcSecret", "refreshToken"])(
    "rejects unknown or secret-shaped field %s",
    (field) => {
      expect(() =>
        parsePublicHttpConfig({
          apiBaseUrl: "/",
          environmentLabel: "Candidate",
          [field]: "must-not-be-public",
        }),
      ).toThrow(/public HTTP configuration/i);
    },
  );

  it("rejects absolute cross-origin API URLs", () => {
    expect(() =>
      parsePublicHttpConfig({
        apiBaseUrl: "https://untrusted.example.test",
        environmentLabel: "Candidate",
      }),
    ).toThrow(/same-origin/i);
  });
});
