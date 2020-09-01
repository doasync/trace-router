/* eslint-disable react/jsx-props-no-spreading */
import { useStore } from 'effector-react';
import { ParseOptions, TokensToFunctionOptions } from 'path-to-regexp';
import React, {
  AnchorHTMLAttributes,
  ComponentType,
  DetailedHTMLProps,
  ReactNode,
  useMemo,
  useRef,
} from 'react';

import { shouldUpdate } from './router';
import { MergedRoute, ObjectAny, Params, Route as RouteType } from './types';

type RouteProps = {
  of: RouteType;
  children?: ReactNode;
  component?: ComponentType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UseRoute = (route: RouteType<any> | MergedRoute) => boolean;

export const useRoute: UseRoute = route => useStore(route.visible);

export const Route = ({
  of: route,
  component: Component,
  children,
}: RouteProps): JSX.Element => {
  const element = children ?? (Component && <Component />);
  return <>{useStore(route.visible) && element}</>;
};

type LinkProps<P extends Params> = {
  to: RouteType<P>;
  children: ReactNode;
  params?: P;
  query?: string[][] | Record<string, string> | string | URLSearchParams;
  hash?: string;
  compileOptions?: ParseOptions & TokensToFunctionOptions;
} & DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

const useShouldUpdateRef = (dep: ObjectAny | undefined) => {
  const ref = useRef(dep);
  if (dep && ref.current) {
    if (shouldUpdate(ref.current, dep)) ref.current = dep;
  }
  return ref;
};

export const Link = <P extends Params>({
  to,
  children,
  params,
  query,
  hash,
  compileOptions,
  ...props
}: LinkProps<P>) => {
  const paramsRef = useShouldUpdateRef(params);
  const compileOptionsRef = useShouldUpdateRef(compileOptions);

  const compileFactory = () => {
    return to.compile({
      params,
      query,
      hash,
      options: compileOptions,
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const href = useMemo(compileFactory, [
    to,
    query,
    hash,
    paramsRef.current,
    compileOptionsRef.current,
  ]);

  return (
    <a
      href={href}
      onClick={event => {
        event.preventDefault();
        to.router.navigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
};
