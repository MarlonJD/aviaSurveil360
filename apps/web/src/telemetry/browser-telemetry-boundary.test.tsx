// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserTelemetry } from "./browser-telemetry";
import { BrowserTelemetryErrorBoundary } from "./browser-telemetry-boundary";

function CrashingView(): never {
  throw new Error("password=secret Internal CAA Note");
}

describe("BrowserTelemetryErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("records only the handled error class and renders a bounded recovery view", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const recordHandledError = vi.fn();
    const telemetry = {
      recordHandledError,
    } as unknown as BrowserTelemetry;

    render(
      <BrowserTelemetryErrorBoundary
        telemetry={telemetry}
        routeID={() => "finding-detail"}
      >
        <CrashingView />
      </BrowserTelemetryErrorBoundary>,
    );

    expect(recordHandledError).toHaveBeenCalledOnce();
    expect(recordHandledError).toHaveBeenCalledWith(
      expect.any(Error),
      "finding-detail",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The application view could not be displayed.",
    );
    expect(document.body.textContent).not.toMatch(
      /password=secret|Internal CAA Note/,
    );
  });
});
