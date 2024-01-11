/**
 * This is an auto-generated file, do not edit directly!
 * Run "yarn template" to generate this file.
 */
import type { ThunksApi } from "./thunk.ts";
import type {
  ApiCtx,
  CreateAction,
  CreateActionWithPayload,
  FetchJson,
  MiddlewareApiCo,
  Next,
  Supervisor,
} from "./types.ts";
import type { Payload } from "../types.ts";
import type { Operation } from "../deps.ts";

export type ApiName = string | string[];

export interface QueryApi<Ctx extends ApiCtx = ApiCtx> extends ThunksApi<Ctx> {
  request: (
    r: Partial<RequestInit>,
  ) => (ctx: Ctx, next: Next) => Operation<unknown>;
  cache: () => (ctx: Ctx, next: Next) => Operation<unknown>;

  uri: (uri: string) => {
    /**
     * Options only
     */
    get(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    get<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    get<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    get<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    get(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    get<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    get<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    get<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    get<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    get<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    get(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    get<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    get<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    get<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    get<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    get<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    post(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    post<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    post<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    post<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    post(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    post<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    post<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    post<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    post<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    post<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    post(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    post<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    post<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    post<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    post<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    post<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    put(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    put<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    put<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    put<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    put(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    put<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    put<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    put<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    put<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    put<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    put(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    put<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    put<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    put<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    put<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    put<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    patch(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    patch<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    patch<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    patch<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    patch(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    patch<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    patch<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    patch<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    patch<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    patch<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    patch(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    patch<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    patch<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    patch<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    patch<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    patch<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    delete(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    delete<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    delete<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    delete<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    delete(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    delete<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    delete<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    delete<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    delete<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    delete<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    delete(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    delete<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    delete<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    delete<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    delete<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    delete<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    options(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    options<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    options<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    options<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    options(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    options<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    options<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    options<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    options<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    options<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    options(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    options<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    options<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    options<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    options<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    options<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    head(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    head<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    head<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    head<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    head(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    head<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    head<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    head<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    head<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    head<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    head(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    head<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    head<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    head<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    head<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    head<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    connect(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    connect<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    connect<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    connect<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    connect(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    connect<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    connect<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    connect<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    connect<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    connect<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    connect(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    connect<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    connect<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    connect<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    connect<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    connect<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options only
     */
    trace(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
    trace<P>(
      req: { supervisor?: Supervisor },
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    trace<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    trace<P, ApiSuccess, ApiError = unknown>(req: {
      supervisor?: Supervisor;
    }): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Middleware only
     */
    trace(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
    trace<Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    trace<P>(
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    trace<P, Gtx extends Ctx = Ctx>(
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    trace<P extends never, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    trace<P, ApiSuccess, ApiError = unknown>(
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;

    /**
     * Options and Middleware
     */
    trace(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateAction<Ctx>;
    trace<Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateAction<Gtx>;
    trace<P>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
    ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
    trace<P, Gtx extends Ctx = Ctx>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Gtx>,
    ): CreateActionWithPayload<Gtx, P>;
    trace<P extends never, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<
        & Omit<Ctx, "json">
        & FetchJson<
          ApiSuccess,
          ApiError extends unknown ? Ctx["_error"] : ApiError
        >
      >,
    ): CreateAction<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      ApiSuccess
    >;
    trace<P, ApiSuccess, ApiError = unknown>(
      req: { supervisor?: Supervisor },
      fn: MiddlewareApiCo<Ctx>,
    ): CreateActionWithPayload<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >,
      P,
      ApiSuccess
    >;
  };

  /**
   * Only name
   */
  get(name: ApiName): CreateAction<Ctx>;
  get<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  get<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  get<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  get(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  get<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  get<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  get<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  get<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  get(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  get<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  get<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  get<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  get<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  get<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  get(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  get<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  get<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  get<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  get<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  get<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  post(name: ApiName): CreateAction<Ctx>;
  post<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  post<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  post<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  post(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  post<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  post<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  post<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  post<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  post(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  post<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  post<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  post<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  post<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  post<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  post(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  post<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  post<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  post<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  post<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  post<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  put(name: ApiName): CreateAction<Ctx>;
  put<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  put<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  put<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  put(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  put<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  put<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  put<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  put<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  put(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  put<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  put<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  put<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  put<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  put<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  put(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  put<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  put<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  put<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  put<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  put<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  patch(name: ApiName): CreateAction<Ctx>;
  patch<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  patch<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  patch<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  patch(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  patch<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  patch<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  patch<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  patch<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  patch(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  patch<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  patch<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  patch<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  patch<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  patch<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  patch(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  patch<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  patch<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  patch<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  patch<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  patch<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  delete(name: ApiName): CreateAction<Ctx>;
  delete<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  delete<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  delete<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  delete(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  delete<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  delete<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  delete<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  delete<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  delete(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  delete<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  delete<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  delete<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  delete<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  delete<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  delete(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  delete<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  delete<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  delete<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  delete<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  delete<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  options(name: ApiName): CreateAction<Ctx>;
  options<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  options<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  options<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  options(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  options<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  options<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  options<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  options<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  options(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  options<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  options<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  options<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  options<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  options<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  options(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  options<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  options<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  options<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  options<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  options<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  head(name: ApiName): CreateAction<Ctx>;
  head<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  head<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  head<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  head(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  head<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  head<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  head<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  head<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  head(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  head<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  head<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  head<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  head<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  head<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  head(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  head<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  head<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  head<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  head<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  head<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  connect(name: ApiName): CreateAction<Ctx>;
  connect<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  connect<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  connect<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  connect(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  connect<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  connect<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  connect<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  connect<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  connect(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  connect<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  connect<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  connect<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  connect<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  connect<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  connect(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  connect<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  connect<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  connect<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  connect<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  connect<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Only name
   */
  trace(name: ApiName): CreateAction<Ctx>;
  trace<P>(
    name: ApiName,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  trace<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  trace<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and options
   */
  trace(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
  trace<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  trace<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<Gtx, P>;
  trace<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  trace<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name and middleware
   */
  trace(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
  trace<Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  trace<P>(
    name: ApiName,
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  trace<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  trace<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  trace<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;

  /**
   * Name, options, and middleware
   */
  trace(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Ctx>,
  ): CreateAction<Ctx>;
  trace<Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateAction<Gtx>;
  trace<P>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Omit<Ctx, "payload"> & Payload<P>>,
  ): CreateActionWithPayload<Omit<Ctx, "payload"> & Payload<P>, P>;
  trace<P, Gtx extends Ctx = Ctx>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<Gtx>,
  ): CreateActionWithPayload<Gtx, P>;
  trace<P extends never, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "json">
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateAction<
    & Omit<Ctx, "json">
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    ApiSuccess
  >;
  trace<P, ApiSuccess, ApiError = unknown>(
    name: ApiName,
    req: { supervisor?: Supervisor },
    fn: MiddlewareApiCo<
      & Omit<Ctx, "payload" | "json">
      & Payload<P>
      & FetchJson<
        ApiSuccess,
        ApiError extends unknown ? Ctx["_error"] : ApiError
      >
    >,
  ): CreateActionWithPayload<
    & Omit<Ctx, "payload" | "json">
    & Payload<P>
    & FetchJson<
      ApiSuccess,
      ApiError extends unknown ? Ctx["_error"] : ApiError
    >,
    P,
    ApiSuccess
  >;
}
