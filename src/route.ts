import { combine, createEvent, createStore } from 'effector';
import { compile as createCompile, match as createMatch } from 'path-to-regexp';
import {
  CompileConfig,
  MergedRoute,
  Params,
  Route,
  RouteConfig,
  Router,
} from './types';
import { reduceStore } from './utils';

export const createRoute = <R, P extends Params = Params>(
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never,
  config: RouteConfig
): Route<P, R> => {
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

  const compile = ({
    params,
    query,
    hash,
    options,
  }: CompileConfig<P> = {}): string => {
    const queryString = String(new URLSearchParams(query));
    const pathname = createCompile<P>(path, options)(params);
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

  const route: Route<P, R> = {
    visible: $visible,
    params: $params,
    config,
    compile,
    router,
    navigate,
    redirect,
    bind: (
      paramName,
      bindConfig: {
        router: Router;
        parse?: (rawParam?: string) => string | undefined;
        format?: (path?: string) => string | undefined;
      }
    ) => {
      const { router: childRouter, parse, format } = bindConfig;

      combine([$visible, childRouter.pathname]).watch(
        $params,
        ([visible, childPath], params) => {
          const param = parse
            ? parse(params?.[paramName] as string)
            : (params?.[paramName] as string);
          if (visible && param !== childPath) {
            if (param) {
              childRouter.navigate(param);
              return;
            }
            const rawParam = format ? format(childPath) : childPath;
            const newParams: P = { ...(params as P), [paramName]: rawParam };
            router.redirect(compile({ params: newParams }));
          }
        }
      );

      $params.on(childRouter.pathname, (params, childPath) => {
        const rawParam = format ? format(childPath) : childPath;
        if (params?.[paramName] !== rawParam) {
          const newParams: P = { ...(params as P), [paramName]: rawParam };
          router.navigate(compile({ params: newParams }));
        }
      });

      return route;
    },
  };

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
