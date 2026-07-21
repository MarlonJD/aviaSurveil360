import type { PropsWithChildren } from "react";

import type { Role } from "../backend/backend";
import type { SessionState } from "./session-client";
import { useOptionalSession } from "./session-provider";

export function RoleGuard({
  requiredRole,
  state,
  children,
}: PropsWithChildren<{
  requiredRole: Role | null;
  state?: SessionState;
}>) {
  const session = useOptionalSession();
  const resolvedState = state ?? session?.state ?? null;
  if (!requiredRole) return <>{children}</>;
  if (!resolvedState) return <>{children}</>;
  if (resolvedState.status === "loading") {
    return <p data-testid="route-loading">Loading session...</p>;
  }
  if (resolvedState.status === "unauthenticated" || resolvedState.status === "expired") {
    return <p data-testid="route-unauthenticated">Authentication required</p>;
  }
  if (resolvedState.status === "unavailable") {
    return <p data-testid="route-unavailable">{resolvedState.message}</p>;
  }
  if (!resolvedState.session.roles.includes(requiredRole)) {
    return <p data-testid="route-forbidden">Not available for this role</p>;
  }
  return <>{children}</>;
}
