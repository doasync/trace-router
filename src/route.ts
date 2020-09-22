import { combine, createEvent, createStore } from 'effector';
import { compile as createCompile, match as createMatch } from 'path-to-regexp';

import {
  BindConfig,
  CompileConfig,
  MergedRoute,
  Params,
  Route,
  RouteConfig,
  Router,
} from './types';
import { reduceStore, throwError } from './utils';

export const compileRoute = <
  P extends Params = Params,
  R extends Router = Router
>(
  route: Route<P, R>,
  { params, query, hash, options }: CompileConfig<P> = {}
): string => {
  const queryString = String(new URLSearchParams(query));

  if (params) {
    const paramsNames = Object.keys(params) as Array<keyof P>;
    for (const paramName of paramsNames) {
      if (paramName in route.bindings) {
        const { format } = route.bindings[paramName] as BindConfig;
        params[paramName] = format
          ? (format(String(params[paramName])) as P[keyof P])
          : params[paramName];
      }
    }
  }

  const pathname = createCompile<P>(route.config.path, options)(params);
  const search = queryString ? `?${queryString}` : '';
  const hashSign = !hash || hash.startsWith('#') ? '' : `#`;
  return `${pathname}${search}${hashSign}${hash ?? ''}`;
};

export const bindToRoute = <
  P extends Params = Params,
  R extends Router = Router
>(
  route: Route<P, R>,
  { paramName, bindConfig }: { paramName: keyof P; bindConfig: BindConfig }
): Route<P, R> => {
  const { router: childRouter, parse } = bindConfig;
  if (route.bindings[paramName])
    throwError(`"${String(paramName)}" is already bound`);

  route.bindings[paramName] = bindConfig;

  combine([route.visible, childRouter.pathname]).watch(
    route.params,
    ([visible, childPath], params) => {
      const param = parse
        ? parse(params?.[paramName] as string)
        : (params?.[paramName] as string);
      if (visible && param !== childPath) {
        if (param) {
          childRouter.navigate(param);
          return;
        }
        const newParams: P = { ...(params as P), [paramName]: childPath };
        route.router.redirect(
          compileRoute<P, R>(route, { params: newParams })
        );
      }
    }
  );

  route.params.on(childRouter.pathname, (params, childPath) => {
    if (params?.[paramName] !== childPath) {
      const newParams: P = { ...(params as P), [paramName]: childPath };
      route.router.navigate(
        compileRoute<P, R>(route, { params: newParams })
      );
    }
  });

  return route;
};

export const createRoute = <
  P extends Params = Params,
  R extends Router = Router
>(
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never,
  config: RouteConfig
): Route<P, R> => {
  const bindings: Partial<{ [K in keyof P]: BindConfig }> = {};
  const { path, matchOptions } = config;
  const match = createMatch<P>(path, matchOptions);
  const navigate = createEvent<P | void>();
  const redirect = createEvent<P | void>();
  const $params = createStore<P | null>(null);
  const $visible = $params.map(Boolean);

  reduceStore($params, router.pathname, (_, pathname) => {
    const result = match(pathname);
    return result ? result.params : null;
  });

  const route: Route<P, R> = {
    visible: $visible,
    params: $params,
    config,
    router,
    navigate,
    redirect,
    bindings,
    compile: (compileConfig?: CompileConfig<P>): string =>
      compileRoute<P, R>(route, compileConfig),
    bind: (paramName: keyof P, bindConfig: BindConfig): Route<P, R> =>
      bindToRoute<P, R>(route, { paramName, bindConfig }),
  };

  navigate.watch(params =>
    router.navigate(
      compileRoute<P, R>(route, { params: params as P | undefined })
    )
  );

  redirect.watch(params =>
    router.redirect(
      compileRoute<P, R>(route, { params: params as P | undefined })
    )
  );

  return route;
};

export const createMergedRoute = (routes: Route[]): MergedRoute => {
  const $someVisible = combine(
    routes.map(route => route.visible)
  ).map(statuses => statuses.some(Boolean));

  const $visible = reduceStore(
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
