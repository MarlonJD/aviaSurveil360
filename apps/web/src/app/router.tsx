import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { useApplicationRuntime } from "./providers";
import type { Role } from "../backend/backend";
import { InspectorAssignmentsPage } from "../features/assignments/inspector-assignments-page";
import { AdminConfigurationPage } from "../features/admin/admin-configuration-page";
import { AuditeeCapPage } from "../features/caps/auditee-cap-page";
import { CapReviewPage } from "../features/caps/cap-review-page";
import { ChecklistRunnerPage } from "../features/checklists/checklist-runner-page";
import { EvidenceReviewPage } from "../features/evidence/evidence-review-page";
import { FindingDetailPage } from "../features/findings/finding-detail-page";
import { LeadReviewPage } from "../features/findings/lead-review-page";
import { ManagerDashboardPage } from "../features/findings/manager-dashboard-page";
import { AuditDetailPage } from "../features/inspections/audit-detail-page";
import { OrganizationRegistryPage } from "../features/organizations/organization-registry-page";
import {
  AuditPlanCalendarPage,
  FinanceReviewPage,
  GeneralManagerDashboardPage,
} from "../features/planning/planning-workspaces";
import { ExecutiveDashboardPage } from "../features/reports/executive-dashboard-page";
import { ReportPreviewPage } from "../features/reports/report-preview-page";
import {
  RoleSelectPage,
  ROLE_ENTRIES,
  createRoleEntryPath,
  type RoleEntry,
} from "../ui/role-select-page";

export { ROLE_ENTRIES, createRoleEntryPath } from "../ui/role-select-page";

function RoleSelectRoute() {
  const { buildProfile } = useApplicationRuntime();
  const navigate = useNavigate();
  return (
    <RoleSelectPage
      mode={buildProfile === "http" ? "canonical-test-role-switch" : "demo-role-switch"}
      onRoleRequest={(role) => navigate(createRoleEntryPath(role))}
    />
  );
}

export function RoleEntryPlaceholder({ entry }: { entry: RoleEntry }) {
  return (
    <article className="placeholder-panel">
      <span>React foundation</span>
      <h2>{entry.route}</h2>
      <p>
        This candidate React entry route is wired without legacy globals. Secondary route families
        stay in the legacy demo until Product approves them.
      </p>
    </article>
  );
}

function RoleEntryRoute({ entry }: { entry: RoleEntry }) {
  if (entry.role === "inspector") return <InspectorAssignmentsPage />;
  if (entry.role === "leadInspector") return <LeadReviewPage />;
  if (entry.role === "manager") return <ManagerDashboardPage />;
  if (entry.role === "gm") return <GeneralManagerDashboardPage />;
  if (entry.role === "finance") return <FinanceReviewPage />;
  if (entry.role === "executiveDirector") return <ExecutiveDashboardPage />;
  if (entry.role === "auditee") return <AuditeeCapPage />;
  if (entry.role === "admin") return <AdminConfigurationPage />;
  return <RoleEntryPlaceholder entry={entry} />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectRoute />} />
      {ROLE_ENTRIES.map((entry) => (
        <Route
          key={entry.role}
          path={createRoleEntryPath(entry.role)}
          element={<RoleEntryRoute entry={entry} />}
        />
      ))}
      <Route path="/inspector/audits/AUD-2026-001" element={<AuditDetailPage />} />
      <Route path="/department-manager/organizations" element={<OrganizationRegistryPage />} />
      <Route path="/department-manager/audit-plan" element={<AuditPlanCalendarPage />} />
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
