import { useRef, useState } from "react";

import type { Role } from "../backend/backend";
import type { ReactSurfaceId } from "../app/route-contracts";
import { useDialogFocus } from "./dialog-focus";
import { RoleNavigation } from "./role-navigation";

export function MobileNavigation({
  activeRole,
  activeRouteId,
}: {
  activeRole: Role;
  activeRouteId: ReactSurfaceId;
}) {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    setOpen(false);
    openerRef.current?.focus();
  };
  useDialogFocus({ containerRef: drawerRef, initialFocusRef: closeRef, onClose: close, open });
  return (
    <div className="mobile-navigation">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open navigation"
        className="mobile-navigation__opener"
        onClick={() => setOpen((value) => !value)}
        ref={openerRef}
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>
      {open ? <div className="mobile-navigation__backdrop" onClick={close} aria-hidden="true" /> : null}
      {open ? (
        <aside
          aria-label="Primary navigation"
          aria-modal="true"
          className="mobile-navigation__drawer"
          ref={drawerRef}
          role="dialog"
        >
          <button className="mobile-navigation__close" onClick={close} ref={closeRef} type="button" aria-label="Close navigation">×</button>
          <RoleNavigation activeRole={activeRole} activeRouteId={activeRouteId} onNavigate={close} />
        </aside>
      ) : null}
    </div>
  );
}
