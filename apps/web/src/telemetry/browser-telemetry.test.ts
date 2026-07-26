import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createBrowserTelemetry,
  activateBrowserTelemetry,
  recordActiveBrowserAPIOutcome,
  activeBrowserRequestHeaders,
  type BrowserTelemetryBatch,
  type BrowserTelemetryTransport,
} from "./browser-telemetry";

describe("browser telemetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports bounded route, Web Vital, API outcome, and handled-error records", async () => {
    const batches: BrowserTelemetryBatch[] = [];
    const transport: BrowserTelemetryTransport = {
      send: async (batch) => {
        batches.push(batch);
      },
    };
    const telemetry = createBrowserTelemetry({
      buildProfile: "http",
      serviceVersion: "test",
      transport,
      now: () => new Date("2026-07-25T00:00:00.000Z"),
      correlationID: "CORRELATION-BROWSER-001",
    });

    telemetry.recordNavigation("finding-detail", "push");
    telemetry.recordWebVital("LCP", 420, "good", "finding-detail");
    telemetry.recordAPIOutcome("command", "succeeded", "finding-detail");
    telemetry.recordHandledError(
      new Error("password=secret; message body contains Internal CAA Note"),
      "finding-detail",
    );

    await expect(telemetry.flush()).resolves.toEqual({ delivered: true, count: 4 });
    expect(batches).toHaveLength(1);
    expect(batches[0]?.records.map((record) => record.name)).toEqual([
      "browser.route.navigation",
      "browser.web_vital",
      "browser.api.outcome",
      "browser.error.handled",
    ]);
    expect(JSON.stringify(batches)).not.toMatch(
      /password=secret|message body|Internal CAA Note/,
    );
    expect(batches[0]?.records[3]?.attributes).toEqual({
      "build.profile": "http",
      "correlation.id": "CORRELATION-BROWSER-001",
      "error.class": "Error",
      "outcome.class": "handled",
      "route.id": "finding-detail",
    });
    expect(telemetry.requestHeaders()).toEqual({
      "X-Correlation-ID": "CORRELATION-BROWSER-001",
      traceparent: expect.stringMatching(
        /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/,
      ),
    });
  });

  it("exports spans, metrics, and logs to their exact OTLP endpoints", async () => {
    const send = vi.fn(async (
      _url: string,
      _request: RequestInit,
    ) => ({ ok: true }) as Response);
    vi.stubGlobal("fetch", send);
    const telemetry = createBrowserTelemetry({
      buildProfile: "http",
      serviceVersion: "test",
      now: () => new Date("2026-07-25T00:00:00.000Z"),
      correlationID: "CORRELATION-BROWSER-002",
    });
    telemetry.recordNavigation("dashboard", "load");
    telemetry.recordWebVital("LCP", 420, "good", "dashboard");
    telemetry.recordAPIOutcome("read", "succeeded", "dashboard");
    telemetry.recordHandledError(new TypeError("private content"), "dashboard");

    await expect(telemetry.flush()).resolves.toEqual({ delivered: true, count: 4 });
    expect(send.mock.calls.map(([url]) => url)).toEqual([
      "/otel/v1/traces",
      "/otel/v1/metrics",
      "/otel/v1/logs",
    ]);
    const payloads = send.mock.calls.map(([, request]) =>
      JSON.parse(String((request as RequestInit).body)),
    );
    expect(payloads[0]).toHaveProperty("resourceSpans");
    expect(payloads[1]).toHaveProperty("resourceMetrics");
    expect(payloads[2]).toHaveProperty("resourceLogs");
    const metrics = payloads[1].resourceMetrics[0].scopeMetrics[0].metrics;
    expect(
      metrics.find((metric: { name: string }) => metric.name === "browser.web_vital")
        .gauge.dataPoints[0].asDouble,
    ).toBe(420);
    expect(
      metrics.find((metric: { name: string }) => metric.name === "browser.api.outcome")
        .sum.dataPoints[0].asInt,
    ).toBe("1");
  });

  it("fails open when the collector transport is unavailable", async () => {
    const send = vi.fn(async () => {
      throw new Error("collector unavailable");
    });
    const telemetry = createBrowserTelemetry({
      buildProfile: "demo",
      serviceVersion: "test",
      transport: { send },
    });
    telemetry.recordNavigation("dashboard", "load");

    await expect(telemetry.flush()).resolves.toEqual({ delivered: false, count: 1 });
    expect(send).toHaveBeenCalledOnce();
  });

  it("flushes pending records during shutdown and then ignores new records", async () => {
    const batches: BrowserTelemetryBatch[] = [];
    const telemetry = createBrowserTelemetry({
      buildProfile: "demo",
      serviceVersion: "test",
      transport: {
        send: async (batch) => {
          batches.push(batch);
        },
      },
    });
    telemetry.recordAPIOutcome("read", "failed", "dashboard");
    await telemetry.shutdown();
    telemetry.recordNavigation("ignored", "push");
    await telemetry.flush();

    expect(batches).toHaveLength(1);
    expect(batches[0]?.records).toHaveLength(1);
  });

  it("connects HTTP backend outcomes to the active route telemetry", async () => {
    const batches: BrowserTelemetryBatch[] = [];
    const telemetry = createBrowserTelemetry({
      buildProfile: "http",
      serviceVersion: "test",
      transport: {
        send: async (batch) => {
          batches.push(batch);
        },
      },
    });
    activateBrowserTelemetry(telemetry, () => "finding-detail");
    recordActiveBrowserAPIOutcome("command", "succeeded");
    await telemetry.flush();

    expect(batches[0]?.records[0]).toMatchObject({
      name: "browser.api.outcome",
      attributes: {
        "operation.class": "command",
        "outcome.class": "succeeded",
        "route.id": "finding-detail",
      },
    });
    expect(activeBrowserRequestHeaders()).toEqual({
      "X-Correlation-ID": expect.stringMatching(/^[A-Za-z0-9._-]{8,128}$/),
      traceparent: expect.stringMatching(
        /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/,
      ),
    });
  });
});
