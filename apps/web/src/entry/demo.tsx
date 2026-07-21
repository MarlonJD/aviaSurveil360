import { bootstrap } from "../app/bootstrap";
import { DEMO_PRINCIPALS, createMockBackendRuntime } from "../mock/create-mock-backend";

const mockRuntime = createMockBackendRuntime();

bootstrap({
  backend: mockRuntime.backend,
  backendForRole: mockRuntime.backendForRole,
  buildProfile: "demo",
  environmentLabel: "Deterministic memory mock",
  identityMode: "demo-role-switch",
  subjectId: DEMO_PRINCIPALS.inspector.subjectId,
});
