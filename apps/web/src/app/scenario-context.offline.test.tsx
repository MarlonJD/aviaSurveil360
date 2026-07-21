// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

import Dexie from "dexie";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OfflineFieldDatabase } from "../offline/db";
import { IndexedDbFieldRepository } from "../offline/field-repository";
import { createMockBackend } from "../mock/create-mock-backend";
import { AppProviders } from "./providers";
import { ScenarioProvider, useScenario } from "./scenario-context";

const subjectId = "USR-INSPECTOR-AMINA";
const packageId = "PKG-CAB-2026-001";
const now = () => new Date("2026-06-15T09:00:00.000Z");
const databases = new Set<string>();

function FieldHarness() {
  const { actions, projection } = useScenario();
  return (
    <>
      <button type="button" onClick={() => void actions.loadPackage()}>Load local package</button>
      <button
        type="button"
        onClick={() => void actions.saveChecklistResponse("NON_COMPLIANT", "PBE record unavailable.")}
      >
        Save local response
      </button>
      <button type="button" onClick={() => void actions.createPotentialFinding()}>
        Create local Potential Finding
      </button>
      <button type="button" onClick={() => void actions.submitChecklist()}>
        Submit local checklist
      </button>
      <output data-testid="field-mode">{String(projection.fieldMode)}</output>
      <output data-testid="field-pending">{projection.fieldPendingOperationCount}</output>
      <output data-testid="field-answer">{projection.response?.answer ?? "none"}</output>
      <output data-testid="field-potential">{projection.potentialFinding?.status ?? "none"}</output>
      <output data-testid="field-checklist">{projection.checklistSubmission?.checklistStatus ?? "none"}</output>
    </>
  );
}

afterEach(async () => {
  cleanup();
  await Promise.all([...databases].map((name) => Dexie.delete(name)));
  databases.clear();
});

describe("ScenarioProvider field working set", () => {
  it("loads and mutates a checked-out package through FieldRepository without Backend writes", async () => {
    const backend = createMockBackend();
    const inspectionPackage = await backend.inspections.getPackage({ packageId });
    const checkout = await backend.inspections.checkout({
      operationId: "OP-TEST-CHECKOUT",
      packageId,
      expectedPackageVersion: inspectionPackage.packageVersion,
      deviceInstanceId: "DEVICE-TEST-001",
    });
    const databaseName = `aviasurveil360-scenario-field-${crypto.randomUUID()}`;
    databases.add(databaseName);
    const database = new OfflineFieldDatabase({ name: databaseName });
    const repository = new IndexedDbFieldRepository({ database, subjectId, now });
    await repository.checkoutPackage({
      ...checkout,
      checkedOutAt: now().toISOString(),
    });
    const backendResponseWrite = vi.spyOn(backend.inspections, "upsertChecklistResponse");
    const backendPotentialWrite = vi.spyOn(backend.potentialFindings, "create");
    const backendChecklistWrite = vi.spyOn(backend.inspections, "submitChecklist");

    render(
      <AppProviders
        runtime={{
          backend,
          buildProfile: "demo",
          environmentLabel: "field-test",
          fieldRepositoryForSubject: () => repository,
        }}
      >
        <ScenarioProvider>
          <FieldHarness />
        </ScenarioProvider>
      </AppProviders>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Load local package" }));
    await waitFor(() => expect(screen.getByTestId("field-mode")).toHaveTextContent("true"));
    await userEvent.click(screen.getByRole("button", { name: "Save local response" }));
    await waitFor(() =>
      expect(screen.getByTestId("field-answer")).toHaveTextContent("NON_COMPLIANT"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Create local Potential Finding" }));
    await waitFor(() =>
      expect(screen.getByTestId("field-potential")).toHaveTextContent("PENDING_LEAD_REVIEW"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit local checklist" }));

    await waitFor(() =>
      expect(screen.getByTestId("field-checklist")).toHaveTextContent("SUBMITTED"),
    );
    expect(screen.getByTestId("field-pending")).toHaveTextContent("3");
    expect(backendResponseWrite).not.toHaveBeenCalled();
    expect(backendPotentialWrite).not.toHaveBeenCalled();
    expect(backendChecklistWrite).not.toHaveBeenCalled();
    expect(await repository.listOutbox(packageId)).toHaveLength(3);
  });
});
