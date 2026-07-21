// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SessionProvider,
  useSession,
  type SessionClient,
  type SessionProjection,
} from "./session-provider";

const inspectorSession: SessionProjection = {
  subjectId: "154ec5ac-6f97-4f55-916f-d2f142fc6211",
  displayName: "Local Inspector",
  organizationId: "CAA",
  roles: ["inspector"],
};

function SessionHarness() {
  const session = useSession();
  const queryClient = useQueryClient();
  return (
    <>
      <output data-testid="session-status">{session.state.status}</output>
      <output data-testid="active-role">
        {session.state.status === "authenticated" ? session.state.activeRole : "none"}
      </output>
      <output data-testid="protected-cache">
        {String(queryClient.getQueryData(["protected", "projection"]) ?? "empty")}
      </output>
      <button type="button" onClick={() => void session.logout()}>
        Logout
      </button>
      <button type="button" onClick={() => void session.handleAuthenticationLost()}>
        Expire
      </button>
    </>
  );
}

function renderSession(client: SessionClient) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(["protected", "projection"], "stale protected data");
  render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider client={client} identityMode="oidc-session" initialRole="manager">
        <SessionHarness />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

afterEach(() => cleanup());

describe("SessionProvider", () => {
  it("uses the first authenticated session role instead of fabricating the requested role", async () => {
    const client: SessionClient = {
      get: vi.fn().mockResolvedValue(inspectorSession),
      login: vi.fn(),
      logout: vi.fn(),
      csrfToken: vi.fn(() => "csrf"),
    };

    renderSession(client);

    await waitFor(() => expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated"));
    expect(screen.getByTestId("active-role")).toHaveTextContent("inspector");
  });

  it("clears protected query state before rendering expired normal-session DOM", async () => {
    const client: SessionClient = {
      get: vi.fn().mockResolvedValue(inspectorSession),
      login: vi.fn(),
      logout: vi.fn(),
      csrfToken: vi.fn(() => "csrf"),
    };
    const queryClient = renderSession(client);

    await waitFor(() => expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated"));
    expect(screen.getByTestId("protected-cache")).toHaveTextContent("stale protected data");
    await userEvent.click(screen.getByRole("button", { name: "Expire" }));

    expect(queryClient.getQueryData(["protected", "projection"])).toBeUndefined();
    expect(screen.getByTestId("session-status")).toHaveTextContent("expired");
    expect(screen.getByTestId("protected-cache")).toHaveTextContent("empty");
  });

  it("logs out through the client and clears all protected query state", async () => {
    const client: SessionClient = {
      get: vi.fn().mockResolvedValue(inspectorSession),
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      csrfToken: vi.fn(() => "csrf"),
    };
    const queryClient = renderSession(client);

    await waitFor(() => expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated"));
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(client.logout).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(["protected", "projection"])).toBeUndefined();
    expect(screen.getByTestId("session-status")).toHaveTextContent("unauthenticated");
  });
});
