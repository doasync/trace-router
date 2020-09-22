import { createEvent, Event, Store } from 'effector';
import {
  createMemoryHistory,
  InitialEntry,
  Location,
  MemoryHistory,
  parsePath,
  PartialLocation,
  PartialPath,
  State,
} from 'history';

import { ObjectAny, Query, ToLocation } from './types';

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

export const reduceStore = <S, T>(
  store: Store<S>,
  trigger: Store<T> | Event<T>,
  reducer: (state: S, payload: T) => S
): Store<S> => {
  const update = createEvent<T>();
  store.on(update, reducer);
  trigger.watch(update);
  return store;
};

export const normalizeLocation = <S extends State = State>(
  toLocation: ToLocation<S>
): PartialLocation<S> => {
  const { to, state = null } =
    typeof toLocation === 'string'
      ? { to: toLocation, state: null }
      : toLocation;
  const path = typeof to === 'string' ? parsePath(to) : to;
  const { pathname = '', search = '', hash = '' } = path ?? {};
  return { pathname, search, hash, state: state as S };
};

export const getQueryParams = <Q extends Query = Query>(
  query: string[][] | string | URLSearchParams
  // @ts-expect-error
): Q => Object.fromEntries<string>(new URLSearchParams(query)) as Q;

export const historyChanger = <S extends State = State>(
  fn: (path: PartialPath, state?: S) => void
) => (location: Location<S>, toLocation: ToLocation<S>): void => {
  const newLocation = normalizeLocation<S>(toLocation);
  if (shouldUpdate(location, newLocation)) {
    const { state, ...path } = newLocation;
    fn(path, state);
  }
};

export const createHistory = <S extends State = State>(
  root?: InitialEntry
): MemoryHistory<S> =>
  createMemoryHistory({
    initialEntries: root ? [root] : undefined,
  }) as MemoryHistory<S>;

export const throwError = (message: string): never => {
  throw new Error(message);
};
