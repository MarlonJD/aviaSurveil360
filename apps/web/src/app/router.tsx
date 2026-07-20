import { Link, Navigate, Route, Routes } from "react-router-dom";

import { useApplicationRuntime } from "./providers";
import { InspectorAssignmentsPage } from "../features/assignments/inspector-assignments-page";
import { AuditeeCapPage } from "../features/caps/auditee-cap-page";
import { CapReviewPage } from "../features/caps/cap-review-page";
import { ChecklistRunnerPage } from "../features/checklists/checklist-runner-page";
import { EvidenceReviewPage } from "../features/evidence/evidence-review-page";
import { FindingDetailPage } from "../features/findings/finding-detail-page";
import { LeadReviewPage } from "../features/findings/lead-review-page";
import { ManagerDashboardPage } from "../features/findings/manager-dashboard-page";
import { AuditDetailPage } from "../features/inspections/audit-detail-page";
import { ExecutiveDashboardPage } from "../features/reports/executive-dashboard-page";
import { ReportPreviewPage } from "../features/reports/report-preview-page";

export type Role =
  | "inspector"
  | "leadInspector"
  | "manager"
  | "gm"
  | "finance"
  | "executiveDirector"
  | "auditee"
  | "admin";

export interface RoleEntry {
  role: Role;
  route: string;
  slug: string;
  label: string;
  purpose: string;
}

export const ROLE_ENTRIES: readonly RoleEntry[] = [
  {
    role: "inspector",
    route: "inspector-assignments",
    slug: "inspector",
    label: "CAA Inspector",
    purpose: "What do I need to inspect or review today?",
  },
  {
    role: "leadInspector",
    route: "lead-review",
    slug: "lead-inspector",
    label: "Lead Inspector",
    purpose: "Which submitted checklist or Potential Finding needs my decision?",
  },
  {
    role: "manager",
    route: "dashboard",
    slug: "department-manager",
    label: "Department Manager",
    purpose: "Where is my department exposed, delayed, or overloaded?",
  },
  {
    role: "gm",
    route: "gm-dashboard",
    slug: "general-manager",
    label: "General Manager",
    purpose: "Which cross-department review needs an intermediate decision?",
  },
  {
    role: "finance",
    route: "finance-review",
    slug: "finance",
    label: "Finance Review",
    purpose: "Which budget-required surveillance plan needs review?",
  },
  {
    role: "executiveDirector",
    route: "executive-dashboard",
    slug: "executive-director",
    label: "Executive Director",
    purpose: "Which eligible plan or report needs a final decision?",
  },
  {
    role: "auditee",
    route: "service-provider-cap",
    slug: "auditee",
    label: "Auditee — Fly Namibia",
    purpose: "What does the CAA need from my organization?",
  },
  {
    role: "admin",
    route: "templates",
    slug: "admin",
    label: "Admin Preview",
    purpose: "Which configured template or rule is available for preview?",
  },
] as const;

export function createRoleEntryPath(role: Role): string {
  const entry = ROLE_ENTRIES.find((candidate) => candidate.role === role);
  if (!entry) throw new Error(`Unknown role: ${role}`);
  return `/${entry.slug}/${entry.route}`;
}

function CandidateBoundary() {
  const { buildProfile, environmentLabel } = useApplicationRuntime();
  return (
    <div className="candidate-boundary">
      <span>Candidate-only</span>
      <span>{buildProfile === "demo" ? "Deterministic mock data" : environmentLabel}</span>
      <span>No production-readiness claim</span>
    </div>
  );
}

function RoleSelectPage() {
  return (
    <main className="role-select-page">
      <header className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">A360</div>
        <div>
          <p className="eyebrow">Civil aviation oversight workbench</p>
          <h1>AviaSurveil360</h1>
          <p>Choose a role entry for the authorized React candidate slice.</p>
        </div>
      </header>
      <section className="role-grid" aria-label="Role entries">
        {ROLE_ENTRIES.map((entry) => (
          <Link className="role-card" key={entry.role} to={createRoleEntryPath(entry.role)}>
            <span className="role-card__kicker">{entry.route}</span>
            <strong>{entry.label}</strong>
            <span>{entry.purpose}</span>
            <span className="role-card__action">Enter workspace →</span>
          </Link>
        ))}
      </section>
      <p className="legacy-note">
        Secondary, later, and demo-only routes remain in the intact root Vanilla JavaScript demo.
      </p>
    </main>
  );
}

export function RoleEntryPlaceholder({ entry }: { entry: RoleEntry }) {
  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link className="sidebar-brand" to="/">AviaSurveil360</Link>
        <p>{entry.label}</p>
        <nav aria-label="Candidate navigation">
          <span aria-current="page">{entry.route}</span>
        </nav>
        <Link className="switch-role" to="/">Switch role</Link>
      </aside>
      <section className="workspace-content">
        <CandidateBoundary />
        <p className="eyebrow">Authorized role entry</p>
        <h1>{entry.label}</h1>
        <p className="workspace-purpose">{entry.purpose}</p>
        <article className="placeholder-panel">
          <span>React foundation</span>
          <h2>{entry.route}</h2>
          <p>
            This candidate React entry route is wired without legacy globals. The complete Cabin
            Inspection workflow is implemented in Task 4; secondary route families stay in the
            legacy demo.
          </p>
        </article>
      </section>
    </main>
  );
}

function RoleEntryRoute({ entry }: { entry: RoleEntry }) {
  if (entry.role === "inspector") return <InspectorAssignmentsPage />;
  if (entry.role === "leadInspector") return <LeadReviewPage />;
  if (entry.role === "manager") return <ManagerDashboardPage />;
  if (entry.role === "executiveDirector") return <ExecutiveDashboardPage />;
  if (entry.role === "auditee") return <AuditeeCapPage />;
  return <RoleEntryPlaceholder entry={entry} />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />
      {ROLE_ENTRIES.map((entry) => (
        <Route
          key={entry.role}
          path={createRoleEntryPath(entry.role)}
          element={<RoleEntryRoute entry={entry} />}
        />
      ))}
      <Route path="/inspector/audits/AUD-2026-001" element={<AuditDetailPage />} />
      <Route path="/inspector/audits/AUD-2026-001/checklist" element={<ChecklistRunnerPage />} />
      <Route path="/lead-inspector/findings/FND-CAB-2026-001" element={<FindingDetailPage />} />
      <Route path="/lead-inspector/cap-review/FND-CAB-2026-001" element={<CapReviewPage />} />
      <Route path="/lead-inspector/evidence-review/FND-CAB-2026-001" element={<EvidenceReviewPage />} />
      <Route
        path="/department-manager/reports/RPT-CAB-2026-001-V1"
        element={<ReportPreviewPage />}
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
