import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useMemo,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import * as LegacyRouter from "react-router-dom-v5";

export interface Location<State = unknown> {
  pathname: string;
  search: string;
  hash: string;
  state: State;
  key?: string;
}

export type To =
  | string
  | {
      pathname?: string;
      search?: string;
      hash?: string;
      state?: unknown;
    };

interface RouterProps {
  children?: ReactNode;
}

interface MemoryRouterProps extends RouterProps {
  initialEntries?: To[];
  initialIndex?: number;
}

interface RouteProps {
  element: ReactElement;
  exact?: boolean;
  path: string;
}

interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

interface NavigateProps extends NavigateOptions {
  to: To;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  replace?: boolean;
  to: To;
}

type SearchParamsInit =
  | string
  | URLSearchParams
  | Record<string, string | string[]>
  | Array<[string, string]>;

export const BrowserRouter = LegacyRouter.BrowserRouter as ComponentType<RouterProps>;
export const MemoryRouter = LegacyRouter.MemoryRouter as ComponentType<MemoryRouterProps>;
export const Link = LegacyRouter.Link as unknown as ComponentType<LinkProps>;

export function Routes({ children }: RouterProps) {
  const exactChildren = Children.map(children, (child) =>
    isValidElement<RouteProps>(child)
      ? cloneElement(child, { exact: child.props.exact ?? true })
      : child,
  );
  return <LegacyRouter.Switch>{exactChildren}</LegacyRouter.Switch>;
}

export function Route({ element, exact = true, path }: RouteProps) {
  return <LegacyRouter.Route exact={exact} path={path} render={() => element} />;
}

export function Navigate({ replace = false, state, to }: NavigateProps) {
  const destination =
    typeof to === "string"
      ? { pathname: to, state }
      : { ...to, state: state ?? to.state };
  return <LegacyRouter.Redirect push={!replace} to={destination} />;
}

export function useLocation<State = unknown>() {
  return LegacyRouter.useLocation() as Location<State>;
}

export function useNavigate() {
  const history = LegacyRouter.useHistory();
  return useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      if (typeof to === "number") {
        history.go(to);
        return;
      }
      const method = options.replace ? history.replace : history.push;
      method(to, options.state);
    },
    [history],
  );
}

export function useParams<Params extends Record<string, string | undefined> = Record<string, string>>() {
  return LegacyRouter.useParams() as Params;
}

function createSearchParams(init: SearchParamsInit = "") {
  if (init instanceof URLSearchParams || typeof init === "string" || Array.isArray(init)) {
    return new URLSearchParams(init);
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(init)) {
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  return params;
}

export function useSearchParams(): [
  URLSearchParams,
  (nextInit: SearchParamsInit, options?: NavigateOptions) => void,
] {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(
    () => createSearchParams(location.search),
    [location.search],
  );
  const setSearchParams = useCallback(
    (nextInit: SearchParamsInit, options?: NavigateOptions) => {
      const search = createSearchParams(nextInit).toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : "",
          hash: location.hash,
        },
        options,
      );
    },
    [location.hash, location.pathname, navigate],
  );
  return [searchParams, setSearchParams];
}
