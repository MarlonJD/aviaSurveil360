import { bootstrap } from "../app/bootstrap";
import { DEMO_PRINCIPALS, createMockBackendRuntime } from "../mock/create-mock-backend";
import { seedVisualRuntimeForPath } from "../mock/seed-visual-runtime";

const mockRuntime = createMockBackendRuntime();

async function startDemo(): Promise<void> {
  if (import.meta.env.VITE_AVIA_VISUAL_FIXTURES === "1") {
    await seedVisualRuntimeForPath(mockRuntime, window.location.pathname);
  }

  bootstrap({
    backend: mockRuntime.backend,
    backendForRole: mockRuntime.backendForRole,
    buildProfile: "demo",
    environmentLabel: "Deterministic memory mock",
    identityMode: "demo-role-switch",
    subjectId: DEMO_PRINCIPALS.inspector.subjectId,
  });
}

void startDemo();
