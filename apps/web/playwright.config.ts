import { defineConfig } from "@playwright/test";

const e2eProfile = process.env.AVIA_E2E_PROFILE;
const profile =
  e2eProfile === "http"
    ? "http"
    : e2eProfile === "offline"
      ? "offline"
      : e2eProfile === "visual-parity"
        ? "visual-parity"
        : "mock";
const command =
  profile === "http"
    ? "AVIA_HTTP_TEST_PROFILE=canonical npm run dev:http -- --host 127.0.0.1 --port 4174 --strictPort"
    : "npm run dev:demo -- --host 127.0.0.1 --port 4174 --strictPort";
const shouldStartWebServer =
  profile !== "offline" && process.env.AVIA_UPDATE_LEGACY_BASELINES !== "1";
const visualUse = {
  browserName: "chromium" as const,
  colorScheme: "light" as const,
  deviceScaleFactor: 1,
  headless: true,
  locale: "en-GB",
  reducedMotion: "reduce" as const,
  serviceWorkers: "block" as const,
  timezoneId: "UTC",
  viewport: { width: 1440, height: 900 },
};

export default defineConfig({
  testDir: "./tests",
  outputDir: "/private/tmp/aviasurveil360-react-playwright-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer:
    !shouldStartWebServer
      ? undefined
      : {
          command,
          url: "http://127.0.0.1:4174",
          reuseExistingServer: false,
          timeout: 30_000,
          stdout: "pipe",
          stderr: "pipe",
        },
  projects: [
    {
      name: "mock",
      testMatch: [
        "e2e/canonical-scenario.spec.ts",
        "e2e/first-production-routes.spec.ts",
        "e2e/release-candidate-gates.spec.ts",
      ],
    },
    {
      name: "http",
      testMatch: [
        "e2e/canonical-scenario.spec.ts",
        "e2e/first-production-routes.spec.ts",
        "e2e/offline-sync.http.spec.ts",
        "e2e/release-candidate-gates.spec.ts",
      ],
    },
    {
      name: "offline",
      testMatch: [
        "e2e/brand-app-shell-restart.spec.ts",
        "e2e/offline-*.spec.ts",
        "e2e/attachment-restart-recovery.spec.ts",
        "offline/restart-recovery.spec.ts",
      ],
      testIgnore: ["e2e/offline-sync.http.spec.ts"],
    },
    {
      name: "legacy-baseline-update",
      testMatch: ["e2e/legacy-baseline-update.spec.ts"],
      use: visualUse,
    },
    {
      name: "legacy-parity",
      testMatch: ["e2e/legacy-visual-parity.spec.ts"],
      use: visualUse,
    },
  ],
});
