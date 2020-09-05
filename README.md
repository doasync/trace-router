[![NPM Version][npm-image]][npm-url] ![NPM Downloads][downloads-image] [![GitHub issues][issues-image]][issues-url]

[npm-image]: https://img.shields.io/npm/v/trace-router.svg
[npm-url]: https://www.npmjs.com/package/trace-router
[downloads-image]: https://img.shields.io/npm/dw/trace-router.svg
[deps-image]: https://david-dm.org/doasync/trace-router.svg
[issues-image]: https://img.shields.io/github/issues/doasync/trace-router.svg
[issues-url]: https://github.com/doasync/trace-router/issues

# Trace Router

The next generation router for your app

### Installation

```
yarn add effector trace-router
```

### Examples

Create a router:

```js
import { createRouter, history } from 'trace-router';

export const router = createRouter({ history });
```

Create routes:

```ts
// This route is used only for redirection below
export const exactRoot = router.add({ path: '/' });

// User section
export const user = router.add('/user(/.*)?'); // parent route
export const userProfile = router.add('/user');
export const userTickets = router.add('/user/tickets');
export const userTicket = router.add<{ id: number }>('/user/tickets/:id');

// Info section
export const joinUs = router.add('/join-us');
export const about = router.add('/about');
export const privacy = router.add('/privacy');

// Merge routes to create a parent route
// When you can't create common path
export const info = router.merge([joinUs, about, privacy]);

// Redirect from "/" to "/user"
exactRoot.visible.watch(visible => {
  if (visible) {
    user.redirect();
  }
});
```

Use routes in React (`trace-router-react` package):

```jsx
export const Root = () => (
  <>
    {useRoute(user) && <UserPage />}
    {useRoute(info) && <InfoPage />}
    {useStore(router.noMatches) && <NotFound />}
  </>
);

export const UserPage = () => (
  <AppFrame>
    <UserTemplate>
      {useRoute(userProfile) && <UserProfile />}
      {useRoute(userTickets) && <UserTickets />}
      {useRoute(userTicket) && <UserTicket />}
    </UserTemplate>
  </AppFrame>
);

export const InfoPage = () => (
  <AppFrame>
    <InfoTemplate>
      {useRoute(joinUs) && <JoinUs />}
      {useRoute(about) && <About />}
      {useRoute(privacy) && <Privacy />}
    </InfoTemplate>
  </AppFrame>
);
```

You can also use `Route` component instead of a hook:

```tsx
<Route of={map} component={MapPage} />
```

Use links to navigate routes directly:

```jsx
<Link to={about}>About</Link>
```

Use can add params to the route (if it has ones):

```jsx
<Link to={userTicket} params={{ id: 100 }}>
  Month
</Link>
```

The above link compiles to something like:

```jsx
<a href="/user-tiket/100" onClick={/* prevent default & navigate */}>
  Join Us
</a>
```

Here is how you compile route to a `string`:

```jsx
const href = route.compile({
  params: { id: 100 },
  query: {
    lang: 'ru',
  },
  hash: '#description',
});
```

Manual route navigation:

```jsx
<Button onClick={() => product.navigate({ id: '100' })} />
```

or `redirect` + `compile` as an example:

```jsx
<Button
  onClick={() =>
    product.router.redirect({
      to: product.compile({ params: { id: '100' } }),
      state: { back },
    })
  }
/>
```

You can use another history for a router:

```jsx
import hashHistory from 'history/hash';
import { router } from '~/core/router';

router.use(hashHistory);
```

You can bind one router to another:

```ts
export const product = router
  .add<{ tab: string }>('/product:tab(.*)?')
  .bind('tab', { router: tabRouter });
```

`.bind` method binds child router path to a parent router parameter

You can have an url `/product/info` where:
`/product` - the path of the main router (without a parameter)
`/info` - tabRouter path

### Types

<details>
<summary>
  Router
</summary>

```ts
export type Router<Q extends Query = Query, S extends State = State> = {
  history: History<S>;
  historyUpdated: Event<Update<S>>;
  historyUpdate: Store<Update<S>>;
  navigate: Event<ToLocation<S>>;
  redirect: Event<ToLocation<S>>;
  shift: Event<Delta>;
  back: Event<void>;
  forward: Event<void>;
  location: Store<Location<S>>;
  action: Store<Action>;
  pathname: Store<Pathname>;
  search: Store<Search>;
  hash: Store<Hash>;
  state: Store<S>;
  key: Store<Key>;
  href: Store<Href>;
  query: Store<Q>;
  hasMatches: Store<boolean>;
  noMatches: Store<boolean>;
  add: <P extends Params = Params>(
    pathConfig: Pattern | RouteConfig
  ) => Route<P, Router<Q, S>>;
  merge: <T extends Route[]>(routes: T) => MergedRoute;
  none: <T extends Route[]>(routes: T) => MergedRoute;
  use: (
    givenHistory: BrowserHistory<S> | HashHistory<S> | MemoryHistory<S>
  ) => void;
};
```

</details>

<details>
<summary>
  Route
</summary>

```ts
export type Route<P extends Params = Params, R = Router> = {
  visible: Store<boolean>;
  params: Store<null | P>;
  config: RouteConfig;
  compile: (compileConfig?: CompileConfig<P>) => string;
  router: R extends Router<infer Q, infer S> ? Router<Q, S> : never;
  navigate: Event<P | void>;
  redirect: Event<P | void>;
  bindings: Partial<{ [K in keyof P]: BindConfig }>;
  bind: (
    param: keyof P,
    bindConfig: {
      router: Router;
      parse?: (rawParam?: string) => string | undefined;
      format?: (path?: string) => string | undefined;
    }
  ) => Route<P, R>;
};
```

</details>

<details>

<summary>
  Other typings
</summary>

```ts
export type ToLocation<S extends State = State> =
  | string
  | { to?: To; state?: S };
export type Delta = number;
export type Href = string;
export type Pattern = string;
export interface Query extends ObjectString {}
export interface Params extends ObjectUnknown {}

export type RouterConfig<S extends State = State> = {
  history?: BrowserHistory<S> | HashHistory<S> | MemoryHistory<S>;
  root?: InitialEntry;
};

export type RouteConfig = {
  path: Pattern;
  matchOptions?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions;
};

export type CompileConfig<P extends Params = Params> = {
  params?: P;
  query?: string[][] | Record<string, string> | string | URLSearchParams;
  hash?: string;
  options?: ParseOptions & TokensToFunctionOptions;
};

export type BindConfig = {
  router: Router;
  parse?: (rawParam?: string) => string | undefined;
  format?: (path?: string) => string | undefined;
};

export type MergedRoute = {
  visible: Store<boolean>;
  routes: Route[];
  configs: RouteConfig[];
};
```

</details>

### Repo

Give `trace-router` a star!

GitHub ★: https://github.com/doasync/trace-router
