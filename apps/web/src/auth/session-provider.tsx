import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  ApplicationRuntimeProvider,
  useApplicationRuntime,
} from "../app/providers";
import type { Role } from "../backend/backend";
import type {
  IdentityMode,
  SessionClient,
  SessionProjection,
  SessionState,
} from "./session-client";
import { SessionClientError } from "./session-client";

export type {
  IdentityMode,
  SessionClient,
  SessionProjection,
  SessionState,
} from "./session-client";

interface SessionContextValue {
  identityMode: IdentityMode;
  state: SessionState;
  login(returnTo: string): void;
  logout(): Promise<void>;
  setActiveRole(role: Role): void;
  handleAuthenticationLost(): void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function activeRoleFor(session: SessionProjection, requested: Role | null): Role {
  if (requested && session.roles.includes(requested)) return requested;
  return session.roles[0]!;
}

export function SessionProvider({
  client,
  identityMode,
  initialRole = null,
  children,
}: PropsWithChildren<{
  client: SessionClient;
  identityMode: IdentityMode;
  initialRole?: Role | null;
}>) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const clearProtectedState = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  const handleAuthenticationLost = useCallback(() => {
    clearProtectedState();
    setState({ status: "expired" });
  }, [clearProtectedState]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    client
      .get(controller.signal)
      .then((session) => {
        setState({
          status: "authenticated",
          session,
          activeRole: activeRoleFor(session, initialRole),
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        clearProtectedState();
        if (error instanceof SessionClientError && error.code === "UNAUTHENTICATED") {
          setState({ status: "unauthenticated" });
          return;
        }
        setState({
          status: "unavailable",
          message: error instanceof Error ? error.message : "Session projection is unavailable.",
        });
      });
    return () => controller.abort();
  }, [client, clearProtectedState, initialRole]);

  useEffect(() => {
    const listener = () => handleAuthenticationLost();
    window.addEventListener("avia:authentication-lost", listener);
    return () => window.removeEventListener("avia:authentication-lost", listener);
  }, [handleAuthenticationLost]);

  const value = useMemo<SessionContextValue>(
    () => ({
      identityMode,
      state,
      login: (returnTo) => client.login(returnTo),
      async logout() {
        await client.logout();
        clearProtectedState();
        setState({ status: "unauthenticated" });
      },
      setActiveRole(role) {
        setState((current) => {
          if (current.status !== "authenticated" || !current.session.roles.includes(role)) {
            return current;
          }
          return { ...current, activeRole: role };
        });
      },
      handleAuthenticationLost,
    }),
    [clearProtectedState, client, handleAuthenticationLost, identityMode, state],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session context is unavailable");
  return value;
}

export function useOptionalSession(): SessionContextValue | null {
  return useContext(SessionContext);
}

export function OfflineSubjectBoundary({
  subjectId,
  children,
}: {
  subjectId: string;
  children: ReactNode;
}) {
  const runtime = useApplicationRuntime();
  const queryClient = useQueryClient();
  const beforeSubjectChange = useCallback(
    async (reason: "LOGOUT" | "USER_SWITCH") => {
      const activeSubject = runtime.subjectId ?? subjectId;
      const repository = runtime.fieldRepositoryForSubject?.(activeSubject);
      await repository?.lockSubject(reason);
      queryClient.clear();
    },
    [queryClient, runtime, subjectId],
  );
  const scopedRuntime = useMemo(
    () => ({
      ...runtime,
      subjectId,
      beforeSubjectChange,
    }),
    [beforeSubjectChange, runtime, subjectId],
  );

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ subjectId: string; reason: "LOGOUT" | "USER_SWITCH" }>).detail;
      if (detail?.subjectId === subjectId) void beforeSubjectChange(detail.reason);
    };
    window.addEventListener("avia:subject-changing", listener);
    return () => window.removeEventListener("avia:subject-changing", listener);
  }, [beforeSubjectChange, subjectId]);

  return (
    <ApplicationRuntimeProvider runtime={scopedRuntime}>
      <div key={subjectId} data-testid="offline-subject-boundary">
        {children}
      </div>
    </ApplicationRuntimeProvider>
  );
}
