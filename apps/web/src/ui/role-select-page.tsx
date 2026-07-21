import { Link } from "react-router-dom";

import type { Role } from "../backend/backend";
import type { IconKey, ReactSurfaceId } from "../app/route-contracts";
import { BRAND_ASSETS } from "./brand-assets";

export interface RoleEntry {
  role: Role;
  routeId: ReactSurfaceId;
  route: string;
  slug: string;
  label: string;
  purpose: string;
  iconKey: IconKey;
}

export const ROLE_ENTRIES: readonly RoleEntry[] = [
  {
    role: "inspector",
    routeId: "inspector-home",
    route: "inspector-assignments",
    slug: "inspector",
    label: "CAA Inspector",
    purpose: "What do I need to inspect or review today?",
    iconKey: "assignments",
  },
  {
    role: "leadInspector",
    routeId: "lead-home",
    route: "lead-review",
    slug: "lead-inspector",
    label: "Lead Inspector",
    purpose: "Which submitted checklist or Potential Finding needs my decision?",
    iconKey: "leadReview",
  },
  {
    role: "manager",
    routeId: "manager-home",
    route: "dashboard",
    slug: "department-manager",
    label: "Department Manager",
    purpose: "Where is my department exposed, delayed, or overloaded?",
    iconKey: "dashboard",
  },
  {
    role: "gm",
    routeId: "gm-home",
    route: "gm-dashboard",
    slug: "general-manager",
    label: "General Manager",
    purpose: "Which cross-department review needs an intermediate decision?",
    iconKey: "dashboard",
  },
  {
    role: "finance",
    routeId: "finance-home",
    route: "finance-review",
    slug: "finance",
    label: "Finance Review",
    purpose: "Which budget-required surveillance plan needs review?",
    iconKey: "finance",
  },
  {
    role: "executiveDirector",
    routeId: "executive-home",
    route: "executive-dashboard",
    slug: "executive-director",
    label: "Executive Director",
    purpose: "Which eligible plan or report needs a final decision?",
    iconKey: "reports",
  },
  {
    role: "auditee",
    routeId: "auditee-home",
    route: "service-provider-cap",
    slug: "auditee",
    label: "Auditee — Fly Namibia",
    purpose: "What does the CAA need from my organization?",
    iconKey: "assignments",
  },
  {
    role: "admin",
    routeId: "admin-home",
    route: "templates",
    slug: "admin",
    label: "Admin Preview",
    purpose: "Which configured template or rule is available for preview?",
    iconKey: "templates",
  },
] as const;

export type RoleSelectionMode = "demo-role-switch" | "canonical-test-role-switch" | "oidc-session";

export function createRoleEntryPath(role: Role): string {
  const entry = ROLE_ENTRIES.find((candidate) => candidate.role === role);
  if (!entry) throw new Error(`Unknown role: ${role}`);
  return `/${entry.slug}/${entry.route}`;
}

export function roleLabel(role: Role): string {
  return ROLE_ENTRIES.find((entry) => entry.role === role)?.label ?? role;
}

function modeCopy(mode: RoleSelectionMode): string {
  if (mode === "canonical-test-role-switch") return "Canonical test role switch";
  if (mode === "oidc-session") return "Signed-in role entry";
  return "Deterministic demo role switch";
}

export function RoleSelectPage({
  mode,
  onRoleRequest,
}: {
  mode: RoleSelectionMode;
  onRoleRequest(role: Role): void;
}) {
  return (
    <main className="role-select-page">
      <header className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <img src={BRAND_ASSETS.mark} alt="" />
        </div>
        <div>
          <p className="eyebrow">{modeCopy(mode)}</p>
          <h1>AviaSurveil360</h1>
          <p>Choose an authorized workbench role for this candidate slice.</p>
        </div>
      </header>
      <section className="role-select-panel role-grid" data-testid="role-select-panel" aria-label="Role entries">
        {ROLE_ENTRIES.map((entry) => (
          <Link
            className="role-card"
            data-icon-key={entry.iconKey}
            key={entry.role}
            onClick={() => onRoleRequest(entry.role)}
            to={createRoleEntryPath(entry.role)}
          >
            <img
              aria-hidden="true"
              data-testid="role-card-icon"
              src={BRAND_ASSETS.icons[entry.iconKey]}
              alt=""
              width="24"
              height="24"
            />
            <span className="role-card__kicker">{entry.route}</span>
            <strong>{entry.label}</strong>
            <span>{entry.purpose}</span>
            <span className="role-card__action">Enter workspace</span>
          </Link>
        ))}
      </section>
      <p className="legacy-note">
        Secondary, later, and demo-only routes remain in the intact root Vanilla JavaScript demo.
      </p>
    </main>
  );
}
