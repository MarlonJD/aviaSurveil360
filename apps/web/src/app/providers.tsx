import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type PropsWithChildren, useContext, useState } from "react";

import type { Backend, Role } from "../backend/backend";
import type { IndexedDbFieldRepository } from "../offline/field-repository";
import type { InspectionAttachmentStore } from "../offline/opfs-inspection-attachment-store";

export type BuildProfile = "demo" | "http";

export interface ApplicationRuntime {
  backend: Backend;
  backendForRole?: (role: Role) => Backend;
  buildProfile: BuildProfile;
  environmentLabel: string;
  fieldRepositoryForSubject?: (subjectId: string) => IndexedDbFieldRepository;
  inspectionAttachmentStoreForSubject?: (subjectId: string) => InspectionAttachmentStore;
}

const ApplicationRuntimeContext = createContext<ApplicationRuntime | null>(null);

export function AppProviders({
  runtime,
  children,
}: PropsWithChildren<{ runtime: ApplicationRuntime }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <ApplicationRuntimeContext.Provider value={runtime}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApplicationRuntimeContext.Provider>
  );
}

export function useApplicationRuntime(): ApplicationRuntime {
  const runtime = useContext(ApplicationRuntimeContext);
  if (!runtime) throw new Error("Application runtime is unavailable");
  return runtime;
}

export function useBackendForRole(role: Role): Backend {
  const runtime = useApplicationRuntime();
  return runtime.backendForRole?.(role) ?? runtime.backend;
}
