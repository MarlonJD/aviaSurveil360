import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { Role } from "../backend/backend";
import type { ReactSurfaceId } from "../app/route-contracts";
import { activePrimaryRouteId, primaryRoutesForRole } from "./role-navigation";

export function MobileNavigation({
  activeRole,
  activeRouteId,
}: {
  activeRole: Role;
  activeRouteId: ReactSurfaceId;
}) {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const activePrimary = activePrimaryRouteId(activeRouteId);
  const close = () => {
    setOpen(false);
    openerRef.current?.focus();
  };
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return (
    <div className="mobile-navigation">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="secondary-button"
        onClick={() => setOpen((value) => !value)}
        ref={openerRef}
        type="button"
      >
        Open navigation
      </button>
      {open ? (
        <div
          aria-label="Primary navigation"
          className="surface-card"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          role="dialog"
        >
          <nav aria-label="Mobile primary navigation">
            {primaryRoutesForRole(activeRole).map((route) => (
              <Link
                className="primary-link"
                key={route.id}
                onClick={close}
                to={route.path}
                aria-current={route.id === activePrimary ? "page" : undefined}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
