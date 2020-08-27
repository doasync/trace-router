import { Store } from 'effector';
import { Path, TestMatch } from 'path-parser';

export type RouteParams = {
  path?: string;
  exact?: boolean;
  caseSensitive?: boolean;
  redirectTo?: string;
  parent?: Store<Route>;
};

export type Route<T = Record<string, unknown>> = {
  pattern: Path<T> | null;
  params: TestMatch<T>;
  isVisible: boolean;
};
