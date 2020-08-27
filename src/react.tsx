import { Store } from 'effector';
import { useStore } from 'effector-react';
import React, { ReactNode } from 'react';

import { navigate } from './router';
import { Route as RouteType } from './types';

export const useRoute = ($route: Store<RouteType>): boolean =>
  useStore($route).isVisible;

export const useRouteStore = <T extends unknown>(
  $route: Store<RouteType<T>>
): RouteType<T> => useStore($route);

export { useStore };

type RouteProps = {
  of: Store<RouteType>;
  children: ReactNode;
};

export const Route = ({ of, children }: RouteProps): JSX.Element => (
  <>{useRoute(of) && children}</>
);

type LinkProps = {
  to: string;
  children: ReactNode;
  className: string;
};

export const Link = ({ to, children, className }: LinkProps) => (
  <button type="button" className={className} onClick={() => navigate(to)}>
    {children}
  </button>
);
