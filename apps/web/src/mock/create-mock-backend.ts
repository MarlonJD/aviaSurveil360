import type { Backend, BackendPrincipal, Role } from "../backend/backend";
import { MemoryMockStore } from "./memory-mock-store";
import { MockBackendEngine } from "./mock-engine";

const defaultPrincipal: BackendPrincipal = {
  subjectId: "USR-INSPECTOR-AMINA",
  role: "inspector",
  organizationId: null,
};

export interface CreateMockBackendOptions {
  store?: MemoryMockStore;
  principal?: BackendPrincipal;
  clock?: () => string;
}

export function createMockBackend(options: CreateMockBackendOptions = {}): Backend {
  const clock = options.clock ?? (() => "2026-06-15T09:00:00.000Z");
  const store = options.store ?? MemoryMockStore.createCanonical({ clock });
  return new MockBackendEngine(store, options.principal ?? defaultPrincipal);
}

export const DEMO_PRINCIPALS: Record<Role, BackendPrincipal> = {
  inspector: defaultPrincipal,
  leadInspector: {
    subjectId: "USR-LEAD-CANER",
    role: "leadInspector",
    organizationId: null,
  },
  manager: {
    subjectId: "USR-MANAGER-NORA",
    role: "manager",
    organizationId: null,
  },
  gm: { subjectId: "USR-GM-OMAR", role: "gm", organizationId: null },
  finance: { subjectId: "USR-FINANCE-LINA", role: "finance", organizationId: null },
  executiveDirector: {
    subjectId: "USR-ED-ZARA",
    role: "executiveDirector",
    organizationId: null,
  },
  auditee: {
    subjectId: "USR-AUDITEE-FLY",
    role: "auditee",
    organizationId: "ORG-FLY-NAMIBIA",
  },
  admin: { subjectId: "USR-ADMIN-ADA", role: "admin", organizationId: null },
};

export function createMockBackendRuntime(clock = () => "2026-06-15T09:00:00.000Z") {
  const store = MemoryMockStore.createCanonical({ clock });
  const sessions = new Map<Role, Backend>();
  const backendForRole = (role: Role): Backend => {
    const existing = sessions.get(role);
    if (existing) return existing;
    const backend = createMockBackend({ store, principal: DEMO_PRINCIPALS[role] });
    sessions.set(role, backend);
    return backend;
  };
  return { backend: backendForRole("inspector"), backendForRole };
}
