declare module "react-router-dom-v5" {
  import type { ComponentType, ReactNode } from "react";

  interface LegacyLocation {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key?: string;
  }

  interface LegacyHistory {
    go(delta: number): void;
    push(to: unknown, state?: unknown): void;
    replace(to: unknown, state?: unknown): void;
  }

  export const BrowserRouter: ComponentType<{ children?: ReactNode }>;
  export const Link: ComponentType<Record<string, unknown>>;
  export const MemoryRouter: ComponentType<{
    children?: ReactNode;
    initialEntries?: unknown[];
    initialIndex?: number;
  }>;
  export const Redirect: ComponentType<{
    push?: boolean;
    to: unknown;
  }>;
  export const Route: ComponentType<{
    exact?: boolean;
    path: string;
    render: () => ReactNode;
  }>;
  export const Switch: ComponentType<{ children?: ReactNode }>;

  export function useHistory(): LegacyHistory;
  export function useLocation(): LegacyLocation;
  export function useParams(): Record<string, string | undefined>;
}
