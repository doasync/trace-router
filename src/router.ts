import { combine, createEvent, createStore, Event, Store } from 'effector';
import {
  createMemoryHistory,
  History,
  parsePath,
  PartialLocation,
  State,
  Update,
} from 'history';
import { compile as createCompile, match as createMatch } from 'path-to-regexp';

import {
  CompileConfig,
  Delta,
  MergedRoute,
  ObjectAny,
  Params,
  Query,
  Route,
  RouteConfig,
  Router,
  RouterConfig,
  ToLocation,
} from './types';

export const shouldUpdate = (
  current: ObjectAny,
  target: ObjectAny
): boolean => {
  for (const key in target) {
    // noinspection JSUnfilteredForInLoop
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

const normalizeLocation = <S extends State = State>(
  toLocation: ToLocation<S>
): PartialLocation<S> => {
  const { to, state = null } =
    typeof toLocation === 'string'
      ? { to: toLocation, state: null }
      : toLocation;
  const path = typeof to === 'string' ? parsePath(to) : to;
  return { ...path, state: state as S };
};

const createRoute = <R, P extends Params = Params>(
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never,
  config: RouteConfig
): Route<P, R> => {
  const { path, matchOptions } = config;
  const match = createMatch<P>(path, matchOptions);
  const navigate = createEvent<P | void>();
  const redirect = createEvent<P | void>();
  const $params = createStore<P | null>(null);
  const $visible = $params.map(Boolean);

  onImmediate($params, router.pathname, (_, pathname) => {
    const result = match(pathname);
    return result ? result.params : null;
  }).reset(router.pathname);

  const compile = ({
    params,
    query,
    hash,
    options,
  }: CompileConfig<P> = {}): string => {
    const queryString = String(new URLSearchParams(query));
    const pathname = createCompile<P>(config.path, options)(params);
    const search = queryString ? `?${queryString}` : '';
    const hashSign = !hash || hash.startsWith('#') ? '' : `#${hash}`;
    return `${pathname}${search}${hashSign}${hash ?? ''}`;
  };

  navigate.watch(params =>
    router.navigate(compile({ params: params as P | undefined }))
  );

  redirect.watch(params =>
    router.redirect(compile({ params: params as P | undefined }))
  );

  return {
    visible: $visible,
    params: $params,
    config,
    compile,
    router,
    navigate,
    redirect,
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
}: RouterConfig<S> = {}): Router<Q, S> => {
  const history = (userHistory ?? createMemoryHistory()) as History<S>;
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
  const $resource = $location.map(
    ({ pathname, search, hash }) => `${pathname}${search}${hash}`
  );
  const $query = $search.map(
    // @ts-ignore
    search => Object.fromEntries(new URLSearchParams(search)) as Q
  );

  const $hasMatches = createStore(false);
  const $noMatches = $hasMatches.map(hasMatches => !hasMatches);

  history.listen(historyUpdated);

  $location.on(historyUpdated, (_, update) => update.location);

  $location.watch(navigate, (location, toLocation) => {
    const newLocation = normalizeLocation<S>(toLocation);
    if (shouldUpdate(location, newLocation)) {
      const { state, ...path } = newLocation;
      history.push(path, state);
    }
  });

  $location.watch(redirect, (location, toLocation) => {
    const newLocation = normalizeLocation<S>(toLocation);
    if (shouldUpdate(location, newLocation)) {
      const { state, ...path } = newLocation;
      history.replace(path, state);
    }
  });

  shift.watch(delta => {
    history.go(delta);
  });

  const connectRoute = <P extends Params = Params>(
    route: Route<P, unknown> | MergedRoute
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
    ): Route<P, Router<Q, S>> => {
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
