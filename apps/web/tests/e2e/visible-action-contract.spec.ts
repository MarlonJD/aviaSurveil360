import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  driveReactSurface,
  installDeterministicPageState,
  VISUAL_SURFACES,
  VISUAL_VIEWPORTS,
  type VisualSurfaceFixture,
} from "./support/legacy-parity-fixtures";

interface OwnershipRule {
  id: string;
  surfaceIds: string[];
  namePattern: string;
  boundary: string;
  durableEffect: string;
  evidence: string;
}

interface VisibleControl {
  tag: string;
  role: string;
  name: string;
  disabled: boolean;
  disabledReason: string;
  href: string | null;
  type: string | null;
  ariaControls: string | null;
  ariaExpanded: string | null;
  ariaPressed: string | null;
  ariaSelected: string | null;
}

const repoRoot = resolve(process.cwd(), "../..");
const ledger = JSON.parse(
  readFileSync(resolve(repoRoot, "tests/parity/behavior-ledger.json"), "utf8"),
) as { visibleActionOwnership: OwnershipRule[] };

const controlSelector = [
  "button:visible",
  "a:visible",
  "input:visible",
  "select:visible",
  "textarea:visible",
  "[role='menuitem']:visible",
  "[role='tab']:visible",
  "[role='button']:visible",
].join(", ");

function normalize(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

async function collectVisibleControls(page: Page, scope?: string): Promise<VisibleControl[]> {
  const selector = scope
    ? controlSelector.split(", ").map((control) => `${scope} ${control}`).join(", ")
    : controlSelector;
  return page.locator(selector).evaluateAll((elements) => elements.flatMap((element) => {
    if (element.closest("[aria-hidden='true'], [inert]")) return [];
    const html = element as HTMLElement;
    const formControl = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const labels = "labels" in formControl && formControl.labels
      ? [...formControl.labels].map((label) => label.textContent ?? "").join(" ")
      : "";
    const describedBy = html.getAttribute("aria-describedby")
      ?.split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ") ?? "";
    const textClone = html.cloneNode(true) as HTMLElement;
    textClone.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove());
    const name = (
      html.getAttribute("aria-label") ||
      labels ||
      (element instanceof HTMLImageElement ? element.alt : "") ||
      (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type) ? element.value : "") ||
      textClone.textContent ||
      html.getAttribute("title") ||
      html.getAttribute("placeholder") ||
      ""
    ).replace(/\s+/g, " ").trim();
    const disabled = "disabled" in formControl
      ? Boolean(formControl.disabled)
      : html.getAttribute("aria-disabled") === "true";
    const nearby = disabled
      ? (html.closest("label, span, td, .workbench-decision-panel__action")?.textContent ?? "")
      : "";
    return [{
      tag: element.tagName,
      role: html.getAttribute("role") ?? "",
      name,
      disabled,
      disabledReason: (html.getAttribute("title") || describedBy || html.getAttribute("placeholder") || nearby).replace(/\s+/g, " ").trim(),
      href: element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
      type: "type" in formControl ? formControl.type : null,
      ariaControls: html.getAttribute("aria-controls"),
      ariaExpanded: html.getAttribute("aria-expanded"),
      ariaPressed: html.getAttribute("aria-pressed"),
      ariaSelected: html.getAttribute("aria-selected"),
    }];
  }));
}

function uniqueControls(controls: VisibleControl[]): VisibleControl[] {
  const seen = new Set<string>();
  return controls.filter((control) => {
    const key = JSON.stringify(control);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ownershipFor(surface: VisualSurfaceFixture, control: VisibleControl): string | null {
  if (control.tag === "A" && control.href && control.href !== "#") return "verified-navigation";
  if (control.disabled && control.disabledReason && (
    control.disabledReason !== control.name || /\b(?:no|none|unavailable|not connected|assigned to another)\b/i.test(control.name)
  )) return "explicit-disabled-reason";
  if (control.disabled) return null;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(control.tag)) return "verified-form-behavior";
  if (control.role === "tab" && control.ariaSelected !== null) return "verified-tab-state";
  if (control.ariaExpanded !== null || control.ariaPressed !== null || control.ariaSelected !== null) return "verified-visible-state";
  if (control.ariaControls) return "verified-controlled-state";
  const declared = ledger.visibleActionOwnership.find((rule) =>
    (rule.surfaceIds.includes("*") || rule.surfaceIds.includes(surface.id)) &&
    new RegExp(rule.namePattern, "i").test(control.name),
  );
  return declared ? `${declared.boundary}:${declared.id}` : null;
}

async function resetHttpProfile(page: Page): Promise<void> {
  const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
  const token = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";
  const response = await page.request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": token },
  });
  expect(response.ok()).toBe(true);
}

for (const viewport of VISUAL_VIEWPORTS) {
  test(`inventories all 17 visible-action surfaces at ${viewport.id}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    if (testInfo.project.name === "http") await resetHttpProfile(page);
    for (const surface of VISUAL_SURFACES) {
      await installDeterministicPageState(page);
      await driveReactSurface(page, surface);

      const pageControls = await collectVisibleControls(page);
      let navigationControls: VisibleControl[] = [];
      if (surface.id === "role-select") {
        await expect(page.getByRole("navigation", { name: "Primary role navigation" })).toHaveCount(0);
      } else if (viewport.width <= 900) {
        await expect(page.locator(".workspace-sidebar")).toHaveAttribute("aria-hidden", "true");
        const opener = page.getByRole("button", { name: "Open navigation" });
        await expect(opener).toHaveAttribute("aria-expanded", "false");
        await opener.click();
        await expect(opener).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("navigation", { name: "Primary role navigation" })).toHaveCount(1);
        navigationControls = await collectVisibleControls(page, ".mobile-navigation__drawer");
        await page.keyboard.press("Escape");
        await expect(opener).toBeFocused();
      } else {
        await expect(page.getByRole("navigation", { name: "Primary role navigation" })).toHaveCount(1);
        await expect(page.locator(".workspace-sidebar")).not.toHaveAttribute("aria-hidden", "true");
      }

      const controls = uniqueControls([...pageControls, ...navigationControls]);
      const unnamed = controls.filter((control) => !normalize(control.name));
      const unowned = controls.map((control) => ({
        ...control,
        ownership: ownershipFor(surface, control),
      })).filter(({ ownership }) => ownership === null);
      const duplicateActions = viewport.width <= 1024
        ? [...controls.reduce((groups, control) => {
            if (control.disabled || !["A", "BUTTON"].includes(control.tag)) return groups;
            const key = `${control.tag}:${control.name}:${control.href ?? control.ariaControls ?? ""}`;
            groups.set(key, (groups.get(key) ?? 0) + 1);
            return groups;
          }, new Map<string, number>())].filter(([, count]) => count > 1)
        : [];

      await testInfo.attach(`visible-actions-${surface.id}-${viewport.id}`, {
        body: JSON.stringify({
          surfaceId: surface.id,
          viewport: viewport.id,
          controls: controls.map((control) => ({ ...control, ownership: ownershipFor(surface, control) })),
          duplicateActions,
        }, null, 2),
        contentType: "application/json",
      });

      expect.soft(unnamed, `${surface.id}/${viewport.id} has unnamed controls`).toEqual([]);
      expect.soft(unowned, `${surface.id}/${viewport.id} has unowned or unexplained controls`).toEqual([]);
      expect.soft(duplicateActions, `${surface.id}/${viewport.id} exposes duplicate route actions`).toEqual([]);
    }
  });
}
