import { bootstrap } from "../app/bootstrap";
import { readPublicHttpConfig } from "../app/public-http-config";
import type { Role } from "../backend/backend";
import { createHttpBackend } from "../backend/http-backend";
import { createCanonicalTestFetch } from "../test-profile/http-test-boundary";

declare const __AVIA_CANONICAL_TEST_TOKEN__: string;

const testSubjects: Record<Role, string> = {
  inspector: "154ec5ac-6f97-4f55-916f-d2f142fc6211",
  leadInspector: "USR-LEAD-CANER",
  manager: "USR-MANAGER-NORA",
  finance: "USR-FINANCE-LINA",
  gm: "USR-GM-OMAR",
  executiveDirector: "USR-ED-ZARA",
  auditee: "USR-AUDITEE-FLY",
  admin: "USR-ADMIN-ADA",
};

async function start(): Promise<void> {
  const config = await readPublicHttpConfig();
  const backendForRole = (role: Role) =>
    createHttpBackend(config, {
      fetchImplementation: createCanonicalTestFetch(
        testSubjects[role],
        __AVIA_CANONICAL_TEST_TOKEN__,
      ),
    });
  bootstrap({
    backend: backendForRole("inspector"),
    backendForRole,
    buildProfile: "http",
    environmentLabel: `${config.environmentLabel} · canonical test profile`,
    identityMode: "canonical-test-role-switch",
    subjectId: testSubjects.inspector,
  });
}

void start();
