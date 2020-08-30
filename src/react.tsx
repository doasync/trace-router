import { useStore } from 'effector-react';
import React, { ReactNode } from 'react';

import { routerRef } from './router';
import { MergedRoute, Route as RouteType, Router } from './types';

type RouteProps = {
  of: RouteType;
  children: ReactNode;
};

export const useRoute = (route: RouteType | MergedRoute): boolean =>
  useStore(route.visible);

// TODO: Relative navigation
export const Route = ({ of: route, children }: RouteProps): JSX.Element => (
  <>{useStore(route.visible) && children}</>
);

type LinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
  router?: Router;
};

export const Link = ({ to, router, children, className }: LinkProps) => (
  <button
    type="button"
    className={className}
    onClick={() => (routerRef.current ?? router)?.navigate(to)}
  >
    {children}
  </button>
);
