import { describe, expect, it } from "vitest";

import { REACT_ROUTE_CONTRACTS } from "./route-contracts";

describe("React route contracts", () => {
  it("freezes the exact 17 routed React surfaces in binding order", () => {
    expect(REACT_ROUTE_CONTRACTS.map(({ id, path, requiredRole, dataBoundary }) => ({
      id,
      path,
      requiredRole,
      dataBoundary,
    }))).toEqual([
      { id: "role-select", path: "/", requiredRole: null, dataBoundary: "session" },
      {
        id: "inspector-home",
        path: "/inspector/inspector-assignments",
        requiredRole: "inspector",
        dataBoundary: "backend",
      },
      {
        id: "lead-home",
        path: "/lead-inspector/lead-review",
        requiredRole: "leadInspector",
        dataBoundary: "backend",
      },
      {
        id: "manager-home",
        path: "/department-manager/dashboard",
        requiredRole: "manager",
        dataBoundary: "backend",
      },
      {
        id: "gm-home",
        path: "/general-manager/gm-dashboard",
        requiredRole: "gm",
        dataBoundary: "backend",
      },
      {
        id: "finance-home",
        path: "/finance/finance-review",
        requiredRole: "finance",
        dataBoundary: "backend",
      },
      {
        id: "executive-home",
        path: "/executive-director/executive-dashboard",
        requiredRole: "executiveDirector",
        dataBoundary: "backend",
      },
      {
        id: "auditee-home",
        path: "/auditee/service-provider-cap",
        requiredRole: "auditee",
        dataBoundary: "backend",
      },
      {
        id: "admin-home",
        path: "/admin/templates",
        requiredRole: "admin",
        dataBoundary: "backend",
      },
      {
        id: "audit-detail",
        path: "/inspector/audits/AUD-2026-001",
        requiredRole: "inspector",
        dataBoundary: "backend",
      },
      {
        id: "checklist-runner",
        path: "/inspector/audits/AUD-2026-001/checklist",
        requiredRole: "inspector",
        dataBoundary: "backend+field",
      },
      {
        id: "organization-registry",
        path: "/department-manager/organizations",
        requiredRole: "manager",
        dataBoundary: "backend",
      },
      {
        id: "audit-plan",
        path: "/department-manager/audit-plan",
        requiredRole: "manager",
        dataBoundary: "backend",
      },
      {
        id: "finding-detail",
        path: "/lead-inspector/findings/FND-CAB-2026-001",
        requiredRole: "leadInspector",
        dataBoundary: "backend",
      },
      {
        id: "cap-review",
        path: "/lead-inspector/cap-review/FND-CAB-2026-001",
        requiredRole: "leadInspector",
        dataBoundary: "backend",
      },
      {
        id: "evidence-review",
        path: "/lead-inspector/evidence-review/FND-CAB-2026-001",
        requiredRole: "leadInspector",
        dataBoundary: "backend",
      },
      {
        id: "report-preview",
        path: "/department-manager/reports/RPT-CAB-2026-001-V1",
        requiredRole: "manager",
        dataBoundary: "backend",
      },
    ]);
  });

  it("keeps contextual routes out of primary navigation while naming active parents", () => {
    const byId = Object.fromEntries(REACT_ROUTE_CONTRACTS.map((contract) => [contract.id, contract]));
    expect(REACT_ROUTE_CONTRACTS.filter(({ placement }) => placement === "primary")).toHaveLength(10);
    expect(REACT_ROUTE_CONTRACTS.filter(({ placement }) => placement === "contextual")).toHaveLength(6);
    expect(byId["audit-detail"]?.parentId).toBe("inspector-home");
    expect(byId["checklist-runner"]?.parentId).toBe("inspector-home");
    expect(byId["finding-detail"]?.parentId).toBe("lead-home");
    expect(byId["cap-review"]?.parentId).toBe("lead-home");
    expect(byId["evidence-review"]?.parentId).toBe("lead-home");
    expect(byId["report-preview"]?.parentId).toBe("manager-home");
  });

  it("rejects duplicate paths, ids, or unsupported icon metadata", () => {
    const ids = REACT_ROUTE_CONTRACTS.map(({ id }) => id);
    const paths = REACT_ROUTE_CONTRACTS.map(({ path }) => path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(REACT_ROUTE_CONTRACTS.every(({ label, iconKey, order }) =>
      label.trim() && iconKey.trim() && Number.isInteger(order),
    )).toBe(true);
  });
});
