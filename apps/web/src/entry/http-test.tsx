import { bootstrap } from "../app/bootstrap";
import { readPublicHttpConfig } from "../app/public-http-config";
import type { Role } from "../backend/backend";
import { createHttpBackend } from "../backend/http-backend";
import { createCanonicalTestFetch } from "../test-profile/http-test-boundary";

declare const __AVIA_CANONICAL_TEST_TOKEN__: string;

const testSubjects: Record<Role, string> = {
  inspector: "USR-INSPECTOR-AMINA",
  leadInspector: "USR-LEAD-CANER",
  manager: "USR-MANAGER-NORA",
  finance: "USR-MANAGER-NORA",
  gm: "USR-GM-OMAR",
  executiveDirector: "USR-ED-ZARA",
  auditee: "USR-AUDITEE-FLY",
  admin: "USR-MANAGER-NORA",
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
  });
}

void start();
