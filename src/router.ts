import { combine, createEvent, createStore, Event, Store } from 'effector';
import {
  createMemoryHistory,
  Location,
  MemoryHistory,
  parsePath,
  PartialLocation,
  Path,
  State,
  Update,
} from 'history';
import { match as createMatch } from 'path-to-regexp';

import {
  Delta,
  MergedRoute,
  Params,
  Query,
  Route,
  RouteConfig,
  Router,
  RouterConfig,
  ToLocation,
} from './types';

export const throwError = (message: string): Error => {
  throw new Error(message);
};

const getResource = ({ pathname, search, hash }: Path) =>
  `${pathname}${search}${hash}`;

const normalizeLocation = <S extends State = State>(
  toLocation: ToLocation<S>
): PartialLocation<S> => {
  const { to, state } =
    typeof toLocation === 'string'
      ? { to: toLocation, state: undefined }
      : toLocation;

  if (to == null && state == null)
    throwError('router: to or state should be present');

  const path = typeof to === 'string' ? parsePath(to) : to;

  return { ...path, state };
};

const shouldUpdateLocation = (
  current: Location,
  target: PartialLocation
): boolean => {
  const targetKeys = Object.keys(target) as Array<keyof typeof target>;

  for (const key of targetKeys) {
    if (key in current && target[key] !== current[key]) {
      return true;
    }
  }

  return false;
};

const onImmediate = <S, T>(
  store: Store<S>,
  trigger: Store<T> | Event<T>,
  reducer: (state: S, payload: T) => S
): Store<S> => {
  const update = createEvent<T>();
  store.on(update, reducer);
  trigger.watch(update);

  return store;
};

const createRoute = <R, P extends Params = Params>(
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never,
  config: RouteConfig
): Route<P> => {
  const { path, matchOptions } = config;
  const match = createMatch<P>(path, matchOptions);

  const $params = createStore<P | null>(null);
  const $visible = $params.map(Boolean);

  onImmediate($params, router.pathname, (_, pathname) => {
    const result = match(pathname);
    return result ? result.params : null;
  }).reset(router.historyUpdated);

  return {
    visible: $visible,
    params: $params,
    config,
  };
};

const createMergedRoute = (routes: Route[]): MergedRoute => {
  const $someVisible = combine(
    routes.map(route => route.visible)
  ).map(statuses => statuses.some(Boolean));

  const $visible = onImmediate(
    createStore(false),
    $someVisible,
    (visible, someVisible) => visible || someVisible
  ).reset($someVisible);

  const configs = routes.map(route => route.config);

  return {
    visible: $visible,
    routes,
    configs,
  };
};

export const createRouter = <Q extends Query = Query, S extends State = State>({
  history: userHistory,
}: RouterConfig = {}): Router<Q, S> => {
  const history = (userHistory ?? createMemoryHistory()) as MemoryHistory<S>;
  const historyUpdated = createEvent<Update<S>>();
  const $historyUpdate = createStore<Update<S>>({
    location: history.location,
    action: history.action,
  });

  const navigate = createEvent<ToLocation<S>>();
  const redirect = createEvent<ToLocation<S>>();
  const shift = createEvent<Delta>();
  const back = shift.prepend<void>(() => -1);
  const forward = shift.prepend<void>(() => 1);

  const $location = $historyUpdate.map(update => update.location);
  const $action = $historyUpdate.map(update => update.action);
  const $pathname = $location.map(location => location.pathname);
  const $search = $location.map(location => location.search);
  const $hash = $location.map(location => location.hash);
  const $state = $location.map(location => location.state);
  const $key = $location.map(location => location.key);
  const $resource = $location.map(getResource);

  const $query = $search.map(
    // @ts-ignore
    search => Object.fromEntries(new URLSearchParams(search)) as Q
  );

  const $hasMatches = createStore(false).reset(historyUpdated);
  const $noMatches = $hasMatches.map(hasMatches => !hasMatches);

  history.listen(historyUpdated);

  $location.on(historyUpdated, (_, update) => update.location);

  $location.watch(navigate, (location, toLocation) => {
    const newLocation = normalizeLocation<S>(toLocation);
    if (shouldUpdateLocation(location, newLocation)) {
      const { state, ...path } = newLocation;
      history.push(path, state);
    }
  });

  $location.watch(redirect, (location, toLocation) => {
    const newLocation = normalizeLocation(toLocation);
    if (shouldUpdateLocation(location, newLocation)) {
      const { state, ...path } = newLocation;
      history.replace(path, state);
    }
  });

  shift.watch(delta => {
    history.go(delta);
  });

  const connectRoute = <P extends Params = Params>(
    route: Route<P> | MergedRoute
  ): void => {
    onImmediate(
      $hasMatches,
      route.visible,
      (hasMatches, visible) => hasMatches || visible
    );
  };

  const router: Router<Q, S> = {
    history,
    historyUpdated,
    historyUpdate: $historyUpdate,

    navigate,
    redirect,
    shift,
    back,
    forward,

    location: $location,
    action: $action,
    pathname: $pathname,
    search: $search,
    hash: $hash,
    state: $state,
    key: $key,
    resource: $resource,
    query: $query,
    hasMatches: $hasMatches,
    noMatches: $noMatches,

    add: <P extends Params = Params>(
      pathConfig: string | RouteConfig
    ): Route<P> => {
      const routeConfig =
        typeof pathConfig === 'string' ? { path: pathConfig } : pathConfig;
      const route = createRoute<typeof router, P>(router, routeConfig);
      connectRoute(route);
      return route;
    },

    merge: <T extends Route[]>(routes: T): MergedRoute => {
      const route = createMergedRoute(routes);
      connectRoute(route);
      return route;
    },

    none: <T extends Route[]>(routes: T): MergedRoute => {
      const route = createMergedRoute(routes);
      route.visible = route.visible.map(visible => !visible);
      return route;
    },
  };

  return router;
};

// TODO: Remove
export const routerRef: { current: Router | null } = { current: null };

// TODO: Use Context instead
export const applyRouter = (router: Router): void => {
  routerRef.current = router;
};
