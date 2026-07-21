import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { IconKey } from "../app/route-contracts";
import { BRAND_ASSETS, BRAND_ASSET_SOURCES } from "./brand-assets";

const testDirectory = fileURLToPath(new URL(".", import.meta.url));
const expectedIconKeys: readonly IconKey[] = [
  "assignments",
  "leadReview",
  "dashboard",
  "planning",
  "organizations",
  "finance",
  "reports",
  "templates",
  "profile",
  "notifications",
  "logout",
  "menu",
];

function assertSourcePath(sourcePath: string): void {
  expect(sourcePath).toMatch(/^\.\.\/\.\.\/\.\.\/\.\.\/assets\//);
  expect(sourcePath).not.toMatch(/(?:^|\/)(?:css|js)\//);
  expect(existsSync(resolve(testDirectory, sourcePath))).toBe(true);
}

describe("brand asset registry", () => {
  it("uses the approved repository asset prefix for every semantic asset", () => {
    assertSourcePath(BRAND_ASSET_SOURCES.mark);
    assertSourcePath(BRAND_ASSET_SOURCES.loginTexture);
    assertSourcePath(BRAND_ASSET_SOURCES.dmSansVariable);
    for (const sourcePath of Object.values(BRAND_ASSET_SOURCES.icons)) {
      assertSourcePath(sourcePath);
    }
  });

  it("exports a complete semantic icon registry keyed by route contract icon names", () => {
    expect(Object.keys(BRAND_ASSETS.icons).sort()).toEqual([...expectedIconKeys].sort());
    for (const key of expectedIconKeys) {
      expect(BRAND_ASSETS.icons[key]).toMatch(/\.(?:svg)(?:\?|$)/);
      expect(BRAND_ASSET_SOURCES.icons[key]).toMatch(/assets\/icons\/phosphor\//);
    }
  });

  it("keeps mark, texture, and font as asset-only values", () => {
    expect(BRAND_ASSETS.mark).toMatch(/\.(?:png)(?:\?|$)/);
    expect(BRAND_ASSETS.loginTexture).toMatch(/\.(?:png)(?:\?|$)/);
    expect(BRAND_ASSETS.dmSansVariable).toMatch(/\.(?:ttf)(?:\?|$)/);
  });
});
