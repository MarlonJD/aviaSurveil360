import { describe, expect, it, vi } from "vitest";

import {
  BackendAuthenticationError,
  BackendAuthorizationError,
  BackendCancelledError,
  BackendProtocolError,
  createHttpBackend,
} from "./http-backend";

function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "content-type": "application/json", "x-request-id": "REQ-TEST-001" },
    ...init,
  });
}

describe("HttpBackend", () => {
  it("maps an assignment response with same-origin credentials", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        items: [
          {
            auditId: "AUD-2026-001",
            organizationId: "ORG-FLY-NAMIBIA",
            organizationName: "Fly Namibia",
            title: "2026 Cabin Inspection - Fly Namibia",
            status: "IN_PROGRESS",
            dueDate: "2026-06-18",
            dueState: "DUE_SOON",
            nextAction: "Continue Cabin Inspection checklist",
          },
        ],
        nextCursor: null,
      }),
    );
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );
    const result = await backend.assignments.list({ limit: 20 });
    expect(result.items[0]?.auditId).toBe("AUD-2026-001");
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImplementation.mock.calls[0]!;
    expect(url).toBe("/v1/assignments?limit=20");
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("accept")).toBe("application/json");
  });

  it("injects CSRF and operation ID once without hidden command replay", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        capRevisionId: "CAP-CAB-2026-001-R1",
        capRevision: 1,
        capStatus: "SUBMITTED",
        findingStatus: "CAP_SUBMITTED",
        findingRevision: 2,
      }, { status: 201 }),
    );
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );
    await backend.caps.submit({
      operationId: "OP-CAP-HTTP-001",
      findingId: "FND-CAB-2026-001",
      expectedFindingRevision: 1,
      rootCause: "Root cause",
      correctiveAction: "Corrective action",
      preventiveAction: "Preventive action",
      responsiblePerson: "Responsible person",
      targetCompletionDate: "2026-07-15",
      commentToCaa: "CAA comment",
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    const [, init] = fetchImplementation.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get("x-csrf-token")).toBe("csrf-test");
    expect(JSON.parse(String(init?.body)).operationId).toBe("OP-CAP-HTTP-001");
  });

  it.each([
    [401, BackendAuthenticationError],
    [403, BackendAuthorizationError],
  ] as const)("maps %s problem responses without exposing transport DTOs", async (status, ErrorType) => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          type: "about:blank",
          title: status === 401 ? "Session expired" : "Forbidden",
          status,
          detail: "Deterministic fake response",
          code: status === 401 ? "SESSION_EXPIRED" : "FORBIDDEN",
          requestId: "REQ-TEST-001",
        },
        { status },
      ),
    );
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );
    await expect(backend.findings.get({ findingId: "FND-CAB-2026-001" })).rejects.toBeInstanceOf(
      ErrorType,
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("rejects a successful non-JSON response", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not-json", { status: 200, headers: { "content-type": "text/plain" } }));
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );
    await expect(backend.findings.list({})).rejects.toBeInstanceOf(BackendProtocolError);
  });

  it("propagates an AbortSignal and maps cancellation", async () => {
    const controller = new AbortController();
    const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      expect(init?.signal).toBe(controller.signal);
      throw new DOMException("The operation was aborted", "AbortError");
    });
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );
    await expect(
      backend.assignments.list({}, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(BackendCancelledError);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("maps lifecycle read routes and preserves AbortSignal for direct loads", async () => {
    const controller = new AbortController();
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{
            id: "PF-2026-001",
            auditId: "AUD-2026-001",
            questionId: "CAB-EMEQ-PBE-001",
            organizationId: "ORG-FLY-NAMIBIA",
            title: "PBE serviceability and accessibility not confirmed",
            description: "Configured check exception.",
            status: "PENDING_LEAD_REVIEW",
            revision: 1,
            convertedFindingId: null,
          }],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          audience: "AUDITEE",
          id: "CAP-CAB-2026-001-R1",
          capId: "CAP-CAB-2026-001",
          findingId: "FND-CAB-2026-001",
          organizationId: "ORG-FLY-NAMIBIA",
          revision: 1,
          status: "ACCEPTED",
          rootCause: "Root cause",
          correctiveAction: "Corrective action",
          preventiveAction: "Preventive action",
          responsiblePerson: "Fly Namibia Cabin Safety Manager",
          targetCompletionDate: "2026-07-15",
          commentToCaa: "CAP submitted for CAA review.",
          submittedAt: "2026-06-15T09:00:00.000Z",
          latestReview: {
            decision: "ACCEPT",
            commentToAuditee: "CAP accepted.",
            decidedAt: "2026-06-15T09:00:00.000Z",
          },
        }),
      );
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );

    const queue = await backend.potentialFindings.list(
      { status: "PENDING_LEAD_REVIEW", limit: 50 },
      { signal: controller.signal },
    );
    expect(queue.items[0]?.id).toBe("PF-2026-001");
    const cap = await backend.caps.getRevision(
      { capRevisionId: "CAP-CAB-2026-001-R1" },
      { signal: controller.signal },
    );
    expect(cap.audience).toBe("AUDITEE");
    expect(JSON.stringify(cap)).not.toMatch(/internalCaaNote/i);

    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      "/v1/potential-findings?status=PENDING_LEAD_REVIEW&limit=50",
    );
    expect(fetchImplementation.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
    expect(fetchImplementation.mock.calls[1]?.[0]).toBe(
      "/v1/cap-revisions/CAP-CAB-2026-001-R1",
    );
    expect(fetchImplementation.mock.calls[1]?.[1]?.signal).toBe(controller.signal);
  });

  it("maps first-production registry and planning requests to exact versioned routes", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{
            id: "ORG-FLY-NAMIBIA",
            legalName: "Fly Namibia",
            organizationType: "OPERATOR",
            status: "ACTIVE",
            openFindingCount: 0,
            lastAuditDate: null,
            nextAuditDate: "2026-07-15",
            revision: 1,
          }],
          nextCursor: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "PLAN-2026-CAB-001",
          title: "2026 Cabin Surveillance — Fly Namibia",
          planYear: 2026,
          organizationId: "ORG-FLY-NAMIBIA",
          organizationName: "Fly Namibia",
          inspectionType: "CABIN",
          scheduledDate: "2026-07-15",
          estimatedBudget: 48000,
          status: "GM_REVIEW",
          currentOwnerRole: "gm",
          nextAction: "General Manager to review operational scope",
          revision: 2,
        }),
      );
    const backend = createHttpBackend(
      { apiBaseUrl: "/", environmentLabel: "Test" },
      { fetchImplementation, csrfToken: () => "csrf-test" },
    );

    const registry = await backend.organizations.list({ limit: 20 });
    expect(registry.items[0]?.legalName).toBe("Fly Namibia");
    const updated = await backend.planning.decide({
      operationId: "OP-PLAN-FINANCE-APPROVE",
      planningItemId: "PLAN-2026-CAB-001",
      expectedPlanningRevision: 1,
      decision: "APPROVE_BUDGET",
      reason: "Budget envelope confirmed.",
    });
    expect(updated).toMatchObject({ status: "GM_REVIEW", currentOwnerRole: "gm", revision: 2 });

    expect(fetchImplementation.mock.calls[0]?.[0]).toBe("/v1/organizations?limit=20");
    const [decisionURL, decisionInit] = fetchImplementation.mock.calls[1]!;
    expect(decisionURL).toBe("/v1/planning/items/PLAN-2026-CAB-001/decisions");
    expect(decisionInit?.method).toBe("POST");
    expect(JSON.parse(String(decisionInit?.body))).toMatchObject({
      operationId: "OP-PLAN-FINANCE-APPROVE",
      decision: "APPROVE_BUDGET",
      expectedPlanningRevision: 1,
    });
  });
});
