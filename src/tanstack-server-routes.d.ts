// Adds the TanStack Start `server` option (server route handlers) to file
// routes. The published augmentation does not merge reliably across the
// installed router-core / start-client-core versions, so declare it here.
import type { AnyRoute, AnyContext } from "@tanstack/router-core";

declare module "@tanstack/router-core" {
  interface FilebaseRouteOptionsInterface<
    TRegister,
    TParentRoute extends AnyRoute = AnyRoute,
    TId extends string = string,
    TPath extends string = string,
    TSearchValidator = undefined,
    TParams = {},
    TLoaderDeps extends Record<string, any> = {},
    TLoaderFn = undefined,
    TRouterContext = {},
    TRouteContextFn = AnyContext,
    TBeforeLoadFn = AnyContext,
    TRemountDepsFn = AnyContext,
    TSSR = unknown,
    TServerMiddlewares = unknown,
    THandlers = undefined,
  > {
    server?: any;
  }
}

export {};
