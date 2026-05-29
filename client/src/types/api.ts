/**
 * Backend AppRouter type.
 *
 * This template uses a loose `AnyRouter` type so the frontend doesn't need to
 * directly import the backend tRPC router. Runtime behavior is untyped — every
 * `trpc.foo.bar.useQuery()` call returns `any`, which is fine for a starter.
 *
 * To get FULL type safety later, replace this with a direct import:
 *
 *   import type { AppRouter } from "../../../../backend/server/routers";
 *   export type { AppRouter };
 *
 * Or publish the backend types as an npm package and import from there.
 */
import type { AnyRouter } from "@trpc/server";

export type AppRouter = AnyRouter;
