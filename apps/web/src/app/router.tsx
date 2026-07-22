import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { useApplicationRuntime } from "./providers";
import { REACT_ROUTE_CONTRACT_BY_ID, type ReactSurfaceId } from "./route-contracts";
import type { Role } from "../backend/backend";
import { LoginPage } from "../auth/login-page";
import { RoleGuard } from "../auth/role-guard";
import { useOptionalSession } from "../auth/session-provider";
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
} from "../ui/role-select-page";

export { ROLE_ENTRIES, createRoleEntryPath } from "../ui/role-select-page";

function RoleSelectRoute() {
  const { buildProfile, identityMode } = useApplicationRuntime();
  const session = useOptionalSession();
  const navigate = useNavigate();
  if (identityMode === "oidc-session" && session?.state.status === "authenticated") {
    return <OidcLogoutRoute />;
  }
  return (
    <RoleSelectPage
      mode={identityMode ?? (buildProfile === "http" ? "canonical-test-role-switch" : "demo-role-switch")}
      onRoleRequest={(role) => navigate(createRoleEntryPath(role))}
    />
  );
}

function OidcLogoutRoute() {
  const runtime = useApplicationRuntime();
  const session = useOptionalSession();
  useEffect(() => {
    if (session?.state.status !== "authenticated") return;
    void (async () => {
      await runtime.beforeSubjectChange?.("LOGOUT");
      await session.logout();
    })();
  }, [runtime, session]);
  return <LoginPage message="You have signed out." onLogin={() => session?.login("/inspector/inspector-assignments")} />;
}

function roleEntryElement(role: Role): ReactElement {
  switch (role) {
    case "inspector": return <InspectorAssignmentsPage />;
    case "leadInspector": return <LeadReviewPage />;
    case "manager": return <ManagerDashboardPage />;
    case "gm": return <GeneralManagerDashboardPage />;
    case "finance": return <FinanceReviewPage />;
    case "executiveDirector": return <ExecutiveDashboardPage />;
    case "auditee": return <AuditeeCapPage />;
    case "admin": return <AdminConfigurationPage />;
  }
}

function guarded(contractId: ReactSurfaceId, element: ReactElement) {
  const contract = REACT_ROUTE_CONTRACT_BY_ID.get(contractId);
  if (!contract) throw new Error(`Missing React route contract ${contractId}`);
  return <RoleGuard requiredRole={contract.requiredRole}>{element}</RoleGuard>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectRoute />} />
      {ROLE_ENTRIES.map((entry) => (
        <Route
          key={entry.role}
          path={createRoleEntryPath(entry.role)}
          element={guarded(entry.routeId, roleEntryElement(entry.role))}
        />
      ))}
      <Route path="/inspector/audits/AUD-2026-001" element={guarded("audit-detail", <AuditDetailPage />)} />
      <Route path="/department-manager/organizations" element={guarded("organization-registry", <OrganizationRegistryPage />)} />
      <Route path="/department-manager/audit-plan" element={guarded("audit-plan", <AuditPlanCalendarPage />)} />
      <Route path="/inspector/audits/AUD-2026-001/checklist" element={guarded("checklist-runner", <ChecklistRunnerPage />)} />
      <Route path="/lead-inspector/findings/FND-CAB-2026-001" element={guarded("finding-detail", <FindingDetailPage />)} />
      <Route path="/lead-inspector/cap-review/FND-CAB-2026-001" element={guarded("cap-review", <CapReviewPage />)} />
      <Route path="/lead-inspector/evidence-review/FND-CAB-2026-001" element={guarded("evidence-review", <EvidenceReviewPage />)} />
      <Route
        path="/department-manager/reports/RPT-CAB-2026-001-V1"
        element={guarded("report-preview", <ReportPreviewPage />)}
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
