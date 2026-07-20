import { bootstrap } from "../app/bootstrap";
import { createMockBackendRuntime } from "../mock/create-mock-backend";

const mockRuntime = createMockBackendRuntime();

bootstrap({
  backend: mockRuntime.backend,
  backendForRole: mockRuntime.backendForRole,
  buildProfile: "demo",
  environmentLabel: "Deterministic memory mock",
});
