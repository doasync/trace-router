import { Event, Store } from 'effector';
import {
  Action,
  Hash,
  History,
  Key,
  Location,
  MemoryHistory,
  Pathname,
  Search,
  State,
  To,
  Update,
} from 'history';
import {
  ParseOptions,
  RegexpToFunctionOptions,
  TokensToFunctionOptions,
  TokensToRegexpOptions,
} from 'path-to-regexp';

export interface ObjectAny {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export interface ObjectUnknown {
  [key: string]: unknown;
}
export interface ObjectString {
  [key: string]: unknown;
}

export type ToLocation<S extends State = State> =
  | string
  | { to?: To; state?: S };
export type Delta = number;
export type Resource = string;
export type Pattern = string;
export interface Query extends ObjectString {}
export interface Params extends ObjectUnknown {}

export type RouterConfig<S extends State> = {
  history?: History<S> | MemoryHistory<S>;
};

export type RouteConfig = {
  path: Pattern;
  matchOptions?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions;
};

export type CompileConfig<P extends Params = Params> = {
  params?: P;
  query?: string[][] | Record<string, string> | string | URLSearchParams;
  hash?: string;
  options?: ParseOptions & TokensToFunctionOptions;
};

export type Route<P extends Params = Params, R = Router> = {
  visible: Store<boolean>;
  params: Store<null | P>;
  config: RouteConfig;
  compile: (compileConfig?: CompileConfig<P>) => string;
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never;
  navigate: Event<P | void>;
  redirect: Event<P | void>;
};

export type MergedRoute = {
  visible: Store<boolean>;
  routes: Route[];
  configs: RouteConfig[];
};

export type Router<Q extends Query = Query, S extends State = State> = {
  history: History<S>;
  historyUpdated: Event<Update<S>>;
  historyUpdate: Store<Update<S>>;
  navigate: Event<ToLocation<S>>;
  redirect: Event<ToLocation<S>>;
  shift: Event<Delta>;
  back: Event<void>;
  forward: Event<void>;
  location: Store<Location<S>>;
  action: Store<Action>;
  pathname: Store<Pathname>;
  search: Store<Search>;
  hash: Store<Hash>;
  state: Store<S>;
  key: Store<Key>;
  resource: Store<Resource>;
  query: Store<Q>;
  hasMatches: Store<boolean>;
  noMatches: Store<boolean>;
  add: <P extends Params = Params>(
    pathConfig: Pattern | RouteConfig
  ) => Route<P, Router<Q, S>>;
  merge: <T extends Route[]>(routes: T) => MergedRoute;
  none: <T extends Route[]>(routes: T) => MergedRoute;
};
