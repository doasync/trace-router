import { createEvent, createStore, Store, withRegion } from 'effector';
import {
  createBrowserHistory,
  parsePath,
  Path as HistoryPath,
  Update as HistoryUpdate,
} from 'history';
import { Path } from 'path-parser';

import { Route, RouteParams } from './types';

const getResource = ({ pathname, search, hash }: HistoryPath) =>
  `${pathname}${search}${hash}`;

const history = createBrowserHistory();

const historyUpdated = createEvent<HistoryUpdate>();
export const onHistoryUpdate = historyUpdated.map(({ action }) => action);

export const navigate = createEvent<string>();

export const $location = createStore(history.location);
export const $pathname = $location.map(location => location.pathname);
export const $search = $location.map(location => location.search);
export const $hash = $location.map(location => location.hash);
export const $state = $location.map(location => location.state);
export const $resource = $location.map(getResource);

export const $query = $search.map(search =>
  // @ts-ignore
  Object.fromEntries(new URLSearchParams(search))
);

const $isFound = createStore(false).reset(onHistoryUpdate);
export const $notFound = $isFound.map(isFound => !isFound);

$location.on(historyUpdated, (_, historyUpdate) => historyUpdate.location);

history.listen(historyUpdated);

$location.watch(navigate, (location, url) => {
  const { pathname, search, hash } = parsePath(url);
  // noinspection OverlyComplexBooleanExpressionJS
  const shouldPush =
    (pathname && pathname !== location.pathname) ||
    (search && search !== location.search) ||
    (hash && hash !== location.hash);

  if (shouldPush) {
    history.push(url);
  }
});

export const createRoute = <T = Record<string, unknown>>({
  path: routePath,
  exact = false,
  caseSensitive = false,
  redirectTo,
  parent,
}: RouteParams = {}): Store<Route<T>> => {
  const $route = createStore<Route<T>>({
    pattern: routePath ? Path.createPath(routePath) : null,
    params: null,
    isVisible: false,
  });

  withRegion($route, () => {
    const onResource = createEvent<string>();

    $route.on(onResource, (route, resource) => {
      if (!route.pattern) {
        return { ...route, params: null, isVisible: false };
      }

      const params = exact
        ? route.pattern.test(resource, {
            strictTrailingSlash: true,
            caseSensitive,
          })
        : route.pattern.partialTest(resource, { caseSensitive });

      return { ...route, params, isVisible: Boolean(params) };
    });

    $isFound.on($route, (isFound, { isVisible }) => isFound || isVisible);

    if (parent) {
      parent.on($route, (state, { isVisible }) => {
        const makeVisible = state.isVisible || isVisible;
        if (makeVisible !== state.isVisible) {
          return { ...state, isVisible: makeVisible };
        }

        return state;
      });
    }

    $resource.watch(onResource);
    $route.watch(
      ({ isVisible }) => redirectTo && isVisible && history.replace(redirectTo)
    );
  });

  return $route;
};
