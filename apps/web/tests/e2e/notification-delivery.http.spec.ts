import { expect, test } from "@playwright/test";

const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
const testToken = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";

function canonicalHeaders(
  subject: string,
  operationId?: string,
): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-avia-test-token": testToken,
    "x-avia-test-subject": subject,
    "x-csrf-token": "canonical-notification-delivery-test",
    ...(operationId ? { "idempotency-key": operationId } : {}),
  };
}

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": testToken },
  });
  expect(response.ok(), await response.text()).toBe(true);
});

test("HTTP notification exposes exact email delivery state without cross-organization leakage", async ({
  page,
  request,
}) => {
  const operationId = "OP-NOTIFICATION-DELIVERY-HTTP-001";
  const sent = await request.post(`${apiURL}/v1/communications`, {
    headers: canonicalHeaders(
      "154ec5ac-6f97-4f55-916f-d2f142fc6211",
      operationId,
    ),
    data: {
      operationId,
      expectedRevision: null,
      idempotencyKey: operationId,
      organizationId: "ORG-FLY-NAMIBIA",
      subject: "Internal report review queue",
      body: "Private enforcement deliberation remains in the authorized CAA record.",
      audience: "CAA",
    },
  });
  expect(sent.ok(), await sent.text()).toBe(true);

  const leadResponse = await request.get(`${apiURL}/v1/notifications`, {
    headers: canonicalHeaders("USR-LEAD-CANER"),
  });
  expect(leadResponse.ok(), await leadResponse.text()).toBe(true);
  const lead = await leadResponse.json() as {
    items: Array<{
      id: string;
      title: string;
      body: string;
      emailDeliveryStatus: string;
      emailDeliveryAttempts: number;
      emailAcceptedAt: string | null;
      emailNextAttemptAt: string | null;
    }>;
  };
  expect(lead.items).toHaveLength(1);
  expect(lead.items[0]).toMatchObject({
    title: "New Internal CAA Note",
    emailDeliveryStatus: "PENDING",
    emailDeliveryAttempts: 0,
    emailAcceptedAt: null,
    emailNextAttemptAt: null,
  });
  expect(lead.items[0]?.body).not.toContain(
    "Private enforcement deliberation",
  );

  const auditeeResponse = await request.get(`${apiURL}/v1/notifications`, {
    headers: canonicalHeaders("USR-AUDITEE-FLY"),
  });
  expect(auditeeResponse.ok(), await auditeeResponse.text()).toBe(true);
  expect((await auditeeResponse.json() as { items: unknown[] }).items).toEqual(
    [],
  );

  await page.goto("/");
  await page.getByRole("link", { name: "Open Lead Inspector" }).click();
  await page.getByRole("link", { name: "Messages" }).click();
  const notification = page.getByRole("article", {
    name: `Notification ${lead.items[0]!.id}`,
  });
  await expect(notification).toContainText("New Internal CAA Note");
  await expect(notification).toContainText("Email delivery: Pending");
  await expect(notification).not.toContainText("enforcement deliberation");
});
