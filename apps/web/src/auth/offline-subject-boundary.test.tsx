// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppProviders, useApplicationRuntime } from "../app/providers";
import { ScenarioProvider } from "../app/scenario-context";
import { createMockBackend } from "../mock/create-mock-backend";
import { OfflineSubjectBoundary } from "./session-provider";

class LockableRepository {
  readonly lockSubject = vi.fn<(_: "LOGOUT" | "USER_SWITCH") => Promise<void>>().mockResolvedValue(undefined);
}

function RuntimeProbe() {
  const runtime = useApplicationRuntime();
  return (
    <>
      <output data-testid="subject-id">{runtime.subjectId}</output>
      <button
        type="button"
        onClick={() => void runtime.beforeSubjectChange?.("USER_SWITCH")}
      >
        Switch subject
      </button>
      <button
        type="button"
        onClick={() => void runtime.beforeSubjectChange?.("LOGOUT")}
      >
        Logout subject
      </button>
    </>
  );
}

function renderBoundary(activeSubjectId: string, repository: LockableRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AppProviders
        runtime={{
          backend: createMockBackend(),
          buildProfile: "http",
          environmentLabel: "normal-session-test",
          subjectId: activeSubjectId,
          fieldRepositoryForSubject: () => repository as never,
        }}
      >
        <OfflineSubjectBoundary subjectId={activeSubjectId}>
          <ScenarioProvider>
            <RuntimeProbe />
          </ScenarioProvider>
        </OfflineSubjectBoundary>
      </AppProviders>
    </QueryClientProvider>,
  );
}

afterEach(() => cleanup());

describe("normal-session offline subject boundary", () => {
  it("awaits subject locking before replacing the normal-session working set", async () => {
    const repository = new LockableRepository();

    renderBoundary("subject-a", repository);
    await userEvent.click(screen.getByRole("button", { name: "Switch subject" }));

    expect(repository.lockSubject).toHaveBeenCalledWith("USER_SWITCH");
  });

  it("remounts scenario state with the authenticated subject key", async () => {
    const first = new LockableRepository();
    const second = new LockableRepository();
    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <AppProviders
          runtime={{
            backend: createMockBackend(),
            buildProfile: "http",
            environmentLabel: "normal-session-test",
            subjectId: "subject-a",
            fieldRepositoryForSubject: () => first as never,
          }}
        >
          <OfflineSubjectBoundary subjectId="subject-a">
            <ScenarioProvider>
              <RuntimeProbe />
            </ScenarioProvider>
          </OfflineSubjectBoundary>
        </AppProviders>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("subject-id")).toHaveTextContent("subject-a");

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AppProviders
          runtime={{
            backend: createMockBackend(),
            buildProfile: "http",
            environmentLabel: "normal-session-test",
            subjectId: "subject-b",
            fieldRepositoryForSubject: () => second as never,
          }}
        >
          <OfflineSubjectBoundary subjectId="subject-b">
            <ScenarioProvider>
              <RuntimeProbe />
            </ScenarioProvider>
          </OfflineSubjectBoundary>
        </AppProviders>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("subject-id")).toHaveTextContent("subject-b"));
  });
});
