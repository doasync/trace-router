# Trace Router

The next generation router for your app

### Installation

```
yarn add effector trace-router
```

### Exports

```ts
export { createRouter } from './router';
```

### Examples

Create a router:

```js
import history from 'history/browser';
import { createRouter } from 'trace-router';

export const router = createRouter({ history });
````

Create routes:

```js
// This route is used only for redirection below
export const exactRoot = router.add({ path: '/' });

// User section
export const user = router.add('/user(/.*)?'); // parent
export const userProfile = router.add('/user');
export const userTickets = router.add('/user/tickets');
export const userTicket = router.add<{ id: number }>('/user/tickets/:id');

// Info section
export const joinUs = router.add('/join-us');
export const about = router.add('/about');
export const privacy = router.add('/privacy');

// Merge routes to create a parent route
// When you can't create common path
export const info = router.merge([
  joinUs,
  about,
  privacy,
]);

// Redirect from "/" to "/user"
exactRoot.visible.watch((visible) => {
  if (visible) {
    user.redirect();
  }
});
````

Use routes in React (`trace-router-react`):

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
````

You can also use `Route` component instead of a hook:

```tsx
<Route of={map} component={MapPage} />
```

Use links to navigate routes directly:

```jsx
<Link to={about}>About</Link>
````

Use can add params to the route (if it has ones):

```jsx
<Link to={userTicket} params={{ id: 100 }}>Month</Link>
````

The above link compiles to something like:

```jsx
<a href="/user-tiket/100" onClick={/* prevent default & navigate */}>Join Us</a>
````

Here is how you compile route to a `string`:

```jsx
const href = route.compile({
  params: { id: 100 },
  query: {
    lang: 'ru'
  },
  hash: '#description',
})
````

Manual route navigation:

```jsx
<Button onClick={() => product.navigate({ id: '100' })} />
````

or `redirect` + `compile` as an example:

```jsx
<Button onClick={() => product.router.redirect({
  to: product.compile({ params: { id: '100' } }),
  state: { back }
})} />
````

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
  resource: Store<Resource>;
  query: Store<Q>;
  hasMatches: Store<boolean>;
  noMatches: Store<boolean>;
  add: <P extends Params = Params>(
    pathConfig: Pattern | RouteConfig
  ) => Route<P, Router<Q, S>>;
  merge: <T extends Route[]>(routes: T) => MergedRoute;
  none: <T extends Route[]>(routes: T) => MergedRoute;
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
export type Resource = string;
export type Pattern = string;
export interface Query extends ObjectString {}
export interface Params extends ObjectUnknown {}

export type RouterConfig<S extends State> = {
  history?: History<S> | MemoryHistory<S>;
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

export type MergedRoute = {
  visible: Store<boolean>;
  routes: Route[];
  configs: RouteConfig[];
};

```

</details>

### Docs

See the source code ;)
