import { createHmac, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const approvedRoles = new Set([
  "inspector",
  "leadInspector",
  "manager",
  "gm",
  "finance",
  "executiveDirector",
  "auditee",
  "admin",
]);

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function decodeBase32(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of value.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Keycloak returned an invalid TOTP secret");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function totp(secret: string, now = Date.now()): string {
  const counter = BigInt(Math.floor(now / 30_000));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(message)
    .digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const value = (
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff)
  ) % 1_000_000;
  return value.toString().padStart(6, "0");
}

async function avoidTotpBoundary(page: Page): Promise<void> {
  const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
  if (remainingSeconds < 4) {
    await page.waitForTimeout((remainingSeconds + 1) * 1000);
  }
}

async function beginLogin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Sign in to AviaSurveil360/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign in with organization identity" })
    .click();
  await page.getByLabel(/username or email/i).fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

async function expectApplicationSession(
  page: Page,
  expectedRole: string,
): Promise<void> {
  await expect.poll(async () => {
    if (!page.url().startsWith("http://127.0.0.1:4174/")) return null;
    return page.evaluate(async () => {
      const response = await fetch("/auth/session", {
        credentials: "same-origin",
      });
      if (!response.ok) return { status: response.status, roles: [] };
      const body = await response.json() as { roles?: string[] };
      return { status: response.status, roles: body.roles ?? [] };
    });
  }, { timeout: 60_000 }).toMatchObject({
    status: 200,
    roles: expect.arrayContaining([expectedRole]),
  });
}

async function enrollTotp(
  page: Page,
  username: string,
  password: string,
  expectedRole: string,
): Promise<string> {
  await beginLogin(page, username, password);
  await expect(page.locator("#kc-totp-settings")).toBeVisible();
  await page.locator("#mode-manual").click();
  const secret = (
    await page.locator("#kc-totp-secret-key").innerText()
  ).replace(/\s+/g, "");
  expect(secret).not.toBe("");
  await avoidTotpBoundary(page);
  await page.locator('input[name="totp"]').fill(totp(secret));
  const label = page.locator('input[name="userLabel"]');
  if (await label.isVisible()) await label.fill("Plan 3 isolated browser");
  await page.locator('button[type="submit"], input[type="submit"]').click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4174\//);
  await expectApplicationSession(page, expectedRole);
  return secret;
}

async function loginAfterLocalLogout(
  page: Page,
  username: string,
  password: string,
  secret: string,
  expectedRole: string,
): Promise<void> {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Sign in to AviaSurveil360/i }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign in with organization identity" })
    .click();
  const usernameField = page.getByLabel(/username or email/i);
  await expect.poll(async () => {
    if (await usernameField.isVisible()) return "credentials";
    if (page.url().startsWith("http://127.0.0.1:4174/")) {
      const status = await page.evaluate(async () =>
        (await fetch("/auth/session", { credentials: "same-origin" })).status
      );
      if (status === 200) return "provider-sso";
    }
    return "waiting";
  }, { timeout: 60_000 }).not.toBe("waiting");
  if (await usernameField.isVisible()) {
    await usernameField.fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    const otpField = page.locator('input[name="otp"], input[name="totp"]');
    await expect(otpField).toBeVisible();
    await avoidTotpBoundary(page);
    await otpField.fill(totp(secret));
    await page.getByRole("button", { name: /sign in/i }).click();
  }
  await expectApplicationSession(page, expectedRole);
}

async function keycloakAdminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(
    `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/realms/master/protocol/openid-connect/token`,
    {
      form: {
        client_id: "admin-cli",
        grant_type: "password",
        username: requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_ADMIN_USERNAME"),
        password: requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_ADMIN_PASSWORD"),
      },
    },
  );
  expect(response.status()).toBe(200);
  const body = await response.json() as { access_token?: string };
  expect(body.access_token).toBeTruthy();
  return body.access_token!;
}

async function keycloakUser(
  request: APIRequestContext,
  token: string,
  email: string,
): Promise<Record<string, unknown>> {
  const response = await request.get(
    `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/admin/realms/aviasurveil360/users`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { email, exact: "true" },
    },
  );
  expect(response.status()).toBe(200);
  const users = await response.json() as Array<Record<string, unknown>>;
  expect(users).toHaveLength(1);
  return users[0]!;
}

test("production-mode Keycloak requires MFA and application provisioning revokes exact sessions", async ({
  browser,
  page,
  request,
}) => {
  test.setTimeout(360_000);
  const adminUsername = requiredEnvironment("AVIA_OIDC_TEST_ADMIN_USERNAME");
  const adminPassword = requiredEnvironment("AVIA_OIDC_TEST_ADMIN_PASSWORD");
  const apiURL = requiredEnvironment("AVIA_HTTP_API_URL");
  const inspectorEmail =
    `provisioned.${randomBytes(6).toString("hex")}@example.test`;
  const inspectorPassword = `${randomBytes(18).toString("hex")}Aa1!`;

  const reset = await request.post(`${apiURL}/__test/reset`);
  expect(reset.status()).toBe(404);

  const adminTotpSecret = await enrollTotp(
    page,
    adminUsername,
    adminPassword,
    "admin",
  );
  await page.goto("/admin/users-roles");
  await expect(
    page.getByRole("heading", { name: "Users / Roles" }),
  ).toBeVisible();

  const missingCsrf = await page.evaluate(async () => {
    const response = await fetch("/api/v1/admin/user-lifecycle-requests", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "missing-csrf-must-fail",
      },
      body: JSON.stringify({
        operationId: "missing-csrf-must-fail",
        idempotencyKey: "missing-csrf-must-fail",
        subjectId: null,
        action: "PROVISION",
        roles: ["inspector"],
        organizationId: "CAA",
        email: "must-not-exist@example.test",
        displayName: "Must Not Exist",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(missingCsrf).toMatchObject({
    status: 403,
    body: { code: "CSRF_INVALID" },
  });

  const wrongOrganization = await page.evaluate(async () => {
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("__Host-avia_csrf="))
      ?.split("=")[1];
    const response = await fetch("/api/v1/admin/user-lifecycle-requests", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "wrong-organization-must-fail",
        "x-csrf-token": decodeURIComponent(csrf ?? ""),
      },
      body: JSON.stringify({
        operationId: "wrong-organization-must-fail",
        idempotencyKey: "wrong-organization-must-fail",
        subjectId: null,
        action: "PROVISION",
        roles: ["inspector"],
        organizationId: "ORG-FLY-NAMIBIA",
        email: "wrong-organization-must-not-exist@example.test",
        displayName: "Wrong Organization",
      }),
    });
    return { status: response.status, body: await response.json() };
  });
  expect(wrongOrganization).toMatchObject({
    status: 422,
    body: { code: "INVALID_COMMAND" },
  });

  await page.getByRole("button", { name: "Create user" }).click();
  await page.getByLabel("Provisioning email").fill(inspectorEmail);
  await page.getByLabel("Provisioning display name").fill("Provisioned Inspector");
  await page.getByLabel("Provisioning organization").fill("CAA");
  await page.getByLabel("Provisioning role").selectOption("inspector");
  const provisioningResponsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" &&
    response.url().endsWith("/v1/admin/user-lifecycle-requests")
  );
  await page.getByRole("button", { name: "Submit provisioning" }).click();
  const provisioningResponse = await provisioningResponsePromise;
  expect(provisioningResponse.status()).toBe(202);
  const provisioningBody = await provisioningResponse.json();
  expect({
    body: provisioningBody,
  }).toMatchObject({
    body: {
      action: "PROVISION",
      organizationId: "CAA",
      email: inspectorEmail,
      status: expect.stringMatching(/^(?:PENDING|SUCCEEDED)$/),
    },
  });
  await expect(
    page.getByText(/Provisioning status: (?:PENDING|SUCCEEDED)/),
  ).toBeVisible();
  await expect.poll(async () => {
    await page.getByRole(
      "button",
      { name: "Refresh provisioning status" },
    ).click();
    return page.getByText(/Provisioning status:/).innerText();
  }, { timeout: 30_000 }).toContain("SUCCEEDED");

  let adminToken = await keycloakAdminToken(request);
  const created = await keycloakUser(
    request,
    adminToken,
    inspectorEmail,
  );
  const subjectID = String(created.id);
  expect(created).toMatchObject({
    username: inspectorEmail,
    email: inspectorEmail,
    enabled: true,
    attributes: { organization_id: ["CAA"] },
  });
  expect(created.requiredActions).toContain("CONFIGURE_TOTP");

  const rolesResponse = await request.get(
    `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/admin/realms/aviasurveil360/users/${encodeURIComponent(subjectID)}/role-mappings/realm`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  expect(rolesResponse.status()).toBe(200);
  const mappedRoles = (await rolesResponse.json() as Array<{ name: string }>)
    .map(({ name }) => name)
    .filter((name) => approvedRoles.has(name));
  expect(mappedRoles).toEqual(["inspector"]);

  const duplicateEmail = await page.evaluate(async (email) => {
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("__Host-avia_csrf="))
      ?.split("=")[1];
    const response = await fetch("/api/v1/admin/user-lifecycle-requests", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "duplicate-email-must-fail",
        "x-csrf-token": decodeURIComponent(csrf ?? ""),
      },
      body: JSON.stringify({
        operationId: "duplicate-email-must-fail",
        idempotencyKey: "duplicate-email-must-fail",
        subjectId: null,
        action: "PROVISION",
        roles: ["inspector"],
        organizationId: "CAA",
        email,
        displayName: "Duplicate Inspector",
      }),
    });
    return { status: response.status, body: await response.json() };
  }, inspectorEmail);
  expect(duplicateEmail).toMatchObject({
    status: 409,
    body: { code: "CONFLICT" },
  });

  const passwordResponse = await request.put(
    `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/admin/realms/aviasurveil360/users/${encodeURIComponent(subjectID)}/reset-password`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        type: "password",
        temporary: false,
        value: inspectorPassword,
      },
    },
  );
  expect(passwordResponse.status()).toBe(204);

  execFileSync(
    "docker",
    [
      "compose",
      "--project-name",
      requiredEnvironment("AVIA_OIDC_TEST_COMPOSE_PROJECT"),
      "--file",
      requiredEnvironment("AVIA_OIDC_TEST_COMPOSE_FILE"),
      "restart",
      "keycloak",
    ],
    { stdio: "pipe" },
  );
  await expect.poll(async () => {
    try {
      const response = await request.get(
        `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/realms/aviasurveil360/.well-known/openid-configuration`,
      );
      return response.status();
    } catch {
      return 0;
    }
  }, { timeout: 60_000 }).toBe(200);
  adminToken = await keycloakAdminToken(request);
  expect((await keycloakUser(request, adminToken, inspectorEmail)).enabled)
    .toBe(true);

  const logoutStatus = await page.evaluate(async () => {
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("__Host-avia_csrf="))
      ?.split("=")[1];
    const response = await fetch("/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "x-csrf-token": decodeURIComponent(csrf ?? ""),
      },
    });
    return response.status;
  });
  expect(logoutStatus).toBe(204);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Sign in to AviaSurveil360/i }),
  ).toBeVisible();
  await loginAfterLocalLogout(
    page,
    adminUsername,
    adminPassword,
    adminTotpSecret,
    "admin",
  );

  const inspectorContext = await browser.newContext();
  const inspectorPage = await inspectorContext.newPage();
  const inspectorTotpSecret = await enrollTotp(
    inspectorPage,
    inspectorEmail,
    inspectorPassword,
    "inspector",
  );
  expect(inspectorTotpSecret).not.toBe("");
  await expect(inspectorPage).toHaveURL(/\/inspector\/inspector-assignments$/);

  const wrongRole = await inspectorPage.evaluate(async () => {
    const csrf = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("__Host-avia_csrf="))
      ?.split("=")[1];
    const response = await fetch("/api/v1/admin/user-lifecycle-requests", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "wrong-role-must-fail",
        "x-csrf-token": decodeURIComponent(csrf ?? ""),
      },
      body: JSON.stringify({
        operationId: "wrong-role-must-fail",
        idempotencyKey: "wrong-role-must-fail",
        subjectId: null,
        action: "PROVISION",
        roles: ["admin"],
        organizationId: "CAA",
        email: "wrong-role-must-not-exist@example.test",
        displayName: "Wrong Role",
      }),
    });
    return response.status;
  });
  expect(wrongRole).toBe(403);

  await page.goto("/admin/users-roles");
  await page.getByLabel("Search users").fill("Provisioned Inspector");
  await expect(page.getByText("Provisioned Inspector")).toBeVisible();
  await page.getByRole(
    "button",
    { name: `Deactivate ${subjectID}` },
  ).click();
  await expect.poll(async () => {
    await page.getByRole(
      "button",
      { name: "Refresh provisioning status" },
    ).click();
    return page.getByText(/Provisioning status:/).innerText();
  }, { timeout: 30_000 }).toContain("SUCCEEDED");

  await expect.poll(async () => inspectorPage.evaluate(async () => {
    const response = await fetch("/auth/session", {
      credentials: "same-origin",
    });
    return response.status;
  }), { timeout: 20_000 }).toBe(401);

  adminToken = await keycloakAdminToken(request);
  expect((await keycloakUser(request, adminToken, inspectorEmail)).enabled)
    .toBe(false);
  const sessions = await request.get(
    `${requiredEnvironment("AVIA_OIDC_TEST_KEYCLOAK_BASE_URL")}/admin/realms/aviasurveil360/users/${encodeURIComponent(subjectID)}/sessions`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  expect(sessions.status()).toBe(200);
  expect(await sessions.json()).toEqual([]);
  await inspectorContext.close();
});
