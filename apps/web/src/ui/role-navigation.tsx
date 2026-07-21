import { Link } from "react-router-dom";

import type { Role } from "../backend/backend";
import {
  REACT_ROUTE_CONTRACTS,
  REACT_ROUTE_CONTRACT_BY_ID,
  type ReactSurfaceId,
  type RouteContract,
} from "../app/route-contracts";
import { BRAND_ASSETS } from "./brand-assets";

export function activePrimaryRouteId(activeRouteId: ReactSurfaceId): ReactSurfaceId {
  const active = REACT_ROUTE_CONTRACT_BY_ID.get(activeRouteId);
  return active?.parentId ?? activeRouteId;
}

export function primaryRoutesForRole(role: Role): readonly RouteContract[] {
  return REACT_ROUTE_CONTRACTS
    .filter((contract) => contract.placement === "primary" && contract.requiredRole === role)
    .sort((left, right) => left.order - right.order);
}

export function RoleNavigation({
  activeRole,
  activeRouteId,
}: {
  activeRole: Role;
  activeRouteId: ReactSurfaceId;
}) {
  const activePrimary = activePrimaryRouteId(activeRouteId);
  const routes = primaryRoutesForRole(activeRole);
  return (
    <nav className="role-navigation" aria-label="Primary navigation">
      {routes.map((route) => (
        <Link
          className="primary-link"
          key={route.id}
          to={route.path}
          aria-current={route.id === activePrimary ? "page" : undefined}
          data-icon-key={route.iconKey}
        >
          <img src={BRAND_ASSETS.icons[route.iconKey]} alt="" aria-hidden="true" width="18" height="18" />
          <span>{route.label}</span>
        </Link>
      ))}
    </nav>
  );
}
