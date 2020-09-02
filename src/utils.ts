import { createEvent, Event, Store } from 'effector';
import { parsePath, PartialLocation, State } from 'history';
import { ObjectAny, ToLocation } from './types';

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

export const onImmediate = <S, T>(
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
  return { ...path, state: state as S };
};
