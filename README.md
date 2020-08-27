# Trace Router

The router for your app

### Installation

```
yarn add trace-router
```

### Examples

Create routes:

```js
import { createRoute } from 'trace-router';

export const root = createRoute({ path: '/', exact: true });
export const about = createRoute({ path: '/about' });
export const joinUs = createRoute({ path: '/join-us' });
````

Use routes:

```jsx
<main className="content">
  {useRoute(root) && <Root />}
  {useRoute(joinUs) && <JoinUs />}
  {useRoute(about) && <About />}
</main>
````

Use links:

```jsx
<Link to="/about">About</Link>
````

You can use `navigate` method:

```jsx
export const Link = ({ to, children }) => (
  <button onClick={() => navigate(to)}>
    {children}
  </button>
);
````

### Exports

All exported stores (prefixed with $) are `effector` stores.

A route created by `createRoute` factory is also a store.

`navigate` and `onHistoryUpdate` are events.

```js
export {
  onHistoryUpdate,
  $pathname,
  $search,
  $hash,
  $state,
  $query,
  $resource,
  $notFound,
  navigate,
  createRoute,
} from './router';

export {
  useRoute, 
  useRouteStore, 
  useStore, 
  Route, 
  Link 
} from './react';
```

### Types

```ts
// createRoute params
export type RouteParams = {
  path?: string;
  exact?: boolean;
  caseSensitive?: boolean;
  redirectTo?: string;
  parent?: Store<Route>;
};

// Route state
export type Route<T = Record<string, unknown>> = {
  pattern: Path<T> | null;
  params: TestMatch<T>;
  isVisible: boolean;
};
```

### Docs

See the source code ;)
