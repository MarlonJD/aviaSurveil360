import { describe, expect, it } from "vitest";

import { contentSecurityPolicy } from "./csp-policy";

describe("candidate Content Security Policy", () => {
  it("keeps built artifacts self-hosted without inline or evaluated scripts", () => {
    for (const profile of ["demo", "http"] as const) {
      const policy = contentSecurityPolicy(profile, false);
      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain("object-src 'none'");
      expect(policy).toContain("script-src 'self'");
      expect(policy).toContain("worker-src 'self'");
      expect(policy).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    }
    expect(contentSecurityPolicy("demo", false)).toContain("connect-src 'self'");
    expect(contentSecurityPolicy("http", false)).toContain("connect-src 'self' https:");
  });

  it("admits only explicit loopback development channels for the local HTTP profile", () => {
    const policy = contentSecurityPolicy("http", true);
    expect(policy).toContain("'unsafe-inline'");
    expect(policy).toContain("http://127.0.0.1:*");
    expect(policy).toContain("ws://127.0.0.1:*");
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
