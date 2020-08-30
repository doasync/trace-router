# Trace Router

The router for your app

### Installation

```
yarn add trace-router
```

### Examples

Create router:

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
    router.redirect('/user');
  }
});
````

Use routes:

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

Use links:

```jsx
<Link to="/about" router={router}>About</Link>
````

Use can apply default router for Links:

```jsx
import history from 'history/browser';
import { applyRouter, createRouter } from 'trace-router';
export const router = createRouter({ history });

applyRouter(router);
````

And use Links without router:

```jsx
<Link to="/join-us">Join Us</Link>
````

You can use `navigate` method:

```jsx
export const Button = ({ to, children }) => (
  <button onClick={() => router.navigate(to)}>
    {children}
  </button>
);
````

There is also `replace`, `shift`, `back` and `forward` methods

### Types

<details>
<summary>
  Router
</summary>

```ts
export type Router<Q extends Query = Query, S extends State = State> = {
  history: MemoryHistory<S>;
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
  ) => Route<P>;
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
export type Route<P extends Params = Params> = {
  visible: Store<boolean>;
  params: Store<null | P>;
  config: RouteConfig;
};
```

</details>

### Exports

```ts
export { createRouter, applyRouter } from './router';

export { useRoute, Route, Link } from './react';
````

### Docs

See the source code ;)
