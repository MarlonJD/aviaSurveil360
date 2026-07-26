import { expect, test } from "@playwright/test";

type DependencyState = {
  name: string;
  required: boolean;
  status: "ready" | "unavailable";
};

type ReadinessReport = {
  status: "ready" | "degraded" | "not_ready" | "ok";
  dependencies?: DependencyState[];
};

test("downstream failure remains live and exposes a safe capability state", async ({
  request,
}) => {
  const expectation = process.env.AVIA_RUNTIME_FAILURE_EXPECTATION ?? "ready";
  const dependencyName = process.env.AVIA_RUNTIME_FAILURE_DEPENDENCY;

  const liveness = await request.get("/health/live");
  expect(liveness.status()).toBe(200);

  const readiness = await request.get("/health/ready");
  const report = (await readiness.json()) as ReadinessReport;
  const serialized = JSON.stringify(report).toLowerCase();
  expect(serialized).not.toMatch(
    /password|credential|client_secret|access_key|database_url/,
  );

  if (expectation === "required-unavailable") {
    expect(readiness.status()).toBe(503);
    expect(report.status).toBe("not_ready");
  } else if (expectation === "optional-degraded") {
    expect(readiness.status()).toBe(200);
    expect(report.status).toBe("degraded");
  } else {
    expect(readiness.status()).toBe(200);
    expect(["ready", "ok"]).toContain(report.status);
  }

  if (dependencyName) {
    expect(report.dependencies).toContainEqual(
      expect.objectContaining({
        name: dependencyName,
        status: "unavailable",
      }),
    );
  }
});
