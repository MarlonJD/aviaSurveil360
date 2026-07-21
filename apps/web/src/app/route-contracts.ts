import type { Role } from "../backend/backend";

export type ReactSurfaceId =
  | "role-select"
  | "inspector-home"
  | "lead-home"
  | "manager-home"
  | "gm-home"
  | "finance-home"
  | "executive-home"
  | "auditee-home"
  | "admin-home"
  | "audit-detail"
  | "checklist-runner"
  | "organization-registry"
  | "audit-plan"
  | "finding-detail"
  | "cap-review"
  | "evidence-review"
  | "report-preview";

export type DataBoundary = "session" | "backend" | "backend+field";
export type RoutePlacement = "primary" | "contextual" | "none";
export type IconKey =
  | "assignments"
  | "leadReview"
  | "dashboard"
  | "planning"
  | "organizations"
  | "finance"
  | "reports"
  | "templates"
  | "profile"
  | "notifications"
  | "logout"
  | "menu";

export interface RouteContract {
  id: ReactSurfaceId;
  path: string;
  requiredRole: Role | null;
  placement: RoutePlacement;
  parentId: ReactSurfaceId | null;
  label: string;
  iconKey: IconKey;
  order: number;
  dataBoundary: DataBoundary;
}

export const REACT_ROUTE_CONTRACTS: readonly RouteContract[] = [
  {
    id: "role-select",
    path: "/",
    requiredRole: null,
    placement: "none",
    parentId: null,
    label: "Role Selection",
    iconKey: "profile",
    order: 0,
    dataBoundary: "session",
  },
  {
    id: "inspector-home",
    path: "/inspector/inspector-assignments",
    requiredRole: "inspector",
    placement: "primary",
    parentId: null,
    label: "My Assignments",
    iconKey: "assignments",
    order: 10,
    dataBoundary: "backend",
  },
  {
    id: "lead-home",
    path: "/lead-inspector/lead-review",
    requiredRole: "leadInspector",
    placement: "primary",
    parentId: null,
    label: "Lead Review",
    iconKey: "leadReview",
    order: 20,
    dataBoundary: "backend",
  },
  {
    id: "manager-home",
    path: "/department-manager/dashboard",
    requiredRole: "manager",
    placement: "primary",
    parentId: null,
    label: "Dashboard",
    iconKey: "dashboard",
    order: 30,
    dataBoundary: "backend",
  },
  {
    id: "gm-home",
    path: "/general-manager/gm-dashboard",
    requiredRole: "gm",
    placement: "primary",
    parentId: null,
    label: "General Manager",
    iconKey: "dashboard",
    order: 40,
    dataBoundary: "backend",
  },
  {
    id: "finance-home",
    path: "/finance/finance-review",
    requiredRole: "finance",
    placement: "primary",
    parentId: null,
    label: "Finance Review",
    iconKey: "finance",
    order: 50,
    dataBoundary: "backend",
  },
  {
    id: "executive-home",
    path: "/executive-director/executive-dashboard",
    requiredRole: "executiveDirector",
    placement: "primary",
    parentId: null,
    label: "Executive Dashboard",
    iconKey: "reports",
    order: 60,
    dataBoundary: "backend",
  },
  {
    id: "auditee-home",
    path: "/auditee/service-provider-cap",
    requiredRole: "auditee",
    placement: "primary",
    parentId: null,
    label: "Corrective Actions",
    iconKey: "assignments",
    order: 70,
    dataBoundary: "backend",
  },
  {
    id: "admin-home",
    path: "/admin/templates",
    requiredRole: "admin",
    placement: "primary",
    parentId: null,
    label: "Templates",
    iconKey: "templates",
    order: 80,
    dataBoundary: "backend",
  },
  {
    id: "audit-detail",
    path: "/inspector/audits/AUD-2026-001",
    requiredRole: "inspector",
    placement: "contextual",
    parentId: "inspector-home",
    label: "Audit Detail",
    iconKey: "assignments",
    order: 110,
    dataBoundary: "backend",
  },
  {
    id: "checklist-runner",
    path: "/inspector/audits/AUD-2026-001/checklist",
    requiredRole: "inspector",
    placement: "contextual",
    parentId: "inspector-home",
    label: "Checklist Runner",
    iconKey: "assignments",
    order: 120,
    dataBoundary: "backend+field",
  },
  {
    id: "organization-registry",
    path: "/department-manager/organizations",
    requiredRole: "manager",
    placement: "primary",
    parentId: null,
    label: "Organizations",
    iconKey: "organizations",
    order: 130,
    dataBoundary: "backend",
  },
  {
    id: "audit-plan",
    path: "/department-manager/audit-plan",
    requiredRole: "manager",
    placement: "primary",
    parentId: null,
    label: "Audit Plan Calendar",
    iconKey: "planning",
    order: 140,
    dataBoundary: "backend",
  },
  {
    id: "finding-detail",
    path: "/lead-inspector/findings/FND-CAB-2026-001",
    requiredRole: "leadInspector",
    placement: "contextual",
    parentId: "lead-home",
    label: "Finding Detail",
    iconKey: "leadReview",
    order: 150,
    dataBoundary: "backend",
  },
  {
    id: "cap-review",
    path: "/lead-inspector/cap-review/FND-CAB-2026-001",
    requiredRole: "leadInspector",
    placement: "contextual",
    parentId: "lead-home",
    label: "CAP Review",
    iconKey: "leadReview",
    order: 160,
    dataBoundary: "backend",
  },
  {
    id: "evidence-review",
    path: "/lead-inspector/evidence-review/FND-CAB-2026-001",
    requiredRole: "leadInspector",
    placement: "contextual",
    parentId: "lead-home",
    label: "Evidence Review",
    iconKey: "leadReview",
    order: 170,
    dataBoundary: "backend",
  },
  {
    id: "report-preview",
    path: "/department-manager/reports/RPT-CAB-2026-001-V1",
    requiredRole: "manager",
    placement: "contextual",
    parentId: "manager-home",
    label: "Report Preview",
    iconKey: "reports",
    order: 180,
    dataBoundary: "backend",
  },
] as const;

export const REACT_ROUTE_CONTRACT_BY_ID = new Map<ReactSurfaceId, RouteContract>(
  REACT_ROUTE_CONTRACTS.map((contract) => [contract.id, contract]),
);
