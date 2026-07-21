import { defineConfig } from "@playwright/test";

const profile = process.env.AVIA_E2E_PROFILE === "http" ? "http" : "mock";
const command =
  profile === "http"
    ? "AVIA_HTTP_TEST_PROFILE=canonical npm run dev:http -- --host 127.0.0.1 --port 4174 --strictPort"
    : "npm run dev:demo -- --host 127.0.0.1 --port 4174 --strictPort";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "/private/tmp/aviasurveil360-react-playwright-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4174",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command,
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    { name: "mock" },
    { name: "http" },
  ],
});
