import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveBuildProfile } from "./build-profile";

describe("build-time backend profile", () => {
  it("accepts only explicit demo and HTTP values", () => {
    expect(resolveBuildProfile("demo")).toBe("demo");
    expect(resolveBuildProfile("http")).toBe("http");
    expect(() => resolveBuildProfile("production")).toThrow(/exactly 'demo' or 'http'/);
  });

  it("keeps backend-family imports separated at the two entries", () => {
    const root = path.resolve(import.meta.dirname, "..");
    const demoEntry = fs.readFileSync(path.join(root, "entry/demo.tsx"), "utf8");
    const httpEntry = fs.readFileSync(path.join(root, "entry/http.tsx"), "utf8");
    expect(demoEntry).toMatch(/createMockBackend/);
    expect(demoEntry).not.toMatch(/createHttpBackend/);
    expect(httpEntry).toMatch(/createHttpBackend/);
    expect(httpEntry).not.toMatch(/src\/mock|createMockBackend|seed-data/);
  });
});
