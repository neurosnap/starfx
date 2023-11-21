import type { Operation, Result } from "../deps.ts";
import type { LoaderItemState, LoaderPayload, Payload } from "../types.ts";

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export interface PipeCtx<P = any> extends Payload<P> {
  name: string;
  key: string;
  action: ActionWithPayload<CreateActionPayload<P>>;
  actionFn: IfAny<
    P,
    CreateAction<PipeCtx>,
    CreateActionWithPayload<PipeCtx<P>, P>
  >;
  result: Result<void>;
}

export interface LoaderCtx<P = unknown> extends PipeCtx<P> {
  loader: Partial<LoaderItemState> | null;
}

export type ApiFetchResult<ApiSuccess = any, ApiError = any> =
  | {
    ok: true;
    value: ApiSuccess;
    /**
     * @deprecated Use {@link ApiFetchResult.value} instead.
     */
    data: ApiSuccess;
  }
  | {
    ok: false;
    error: ApiError;
    /**
     * @deprecated Use {@link ApiFetchResult.error} instead.
     */
    data: ApiError;
  };

export type ApiRequest = Partial<{ url: string } & RequestInit>;
export type RequiredApiRequest = {
  url: string;
  headers: HeadersInit;
} & Partial<RequestInit>;

export interface FetchCtx<P = any> extends PipeCtx<P> {
  request: ApiRequest | null;
  req: (r?: ApiRequest) => RequiredApiRequest;
  response: Response | null;
  bodyType: "arrayBuffer" | "blob" | "formData" | "json" | "text";
}

export interface FetchJson<ApiSuccess = any, ApiError = any> {
  json: ApiFetchResult<ApiSuccess, ApiError>;
}

export interface FetchJsonCtx<P = any, ApiSuccess = any, ApiError = any>
  extends FetchCtx<P>, FetchJson<ApiSuccess, ApiError> {}

export interface ApiCtx<Payload = any, ApiSuccess = any, ApiError = any>
  extends FetchJsonCtx<Payload, ApiSuccess, ApiError> {
  actions: Action[];
  loader: Omit<LoaderPayload<any>, "id"> | null;
  cache: boolean;
  cacheData: any;
}

export interface PerfCtx<P = unknown> extends PipeCtx<P> {
  performance: number;
}

export type Middleware<Ctx extends PipeCtx = PipeCtx> = (
  ctx: Ctx,
  next: Next,
) => Operation<any>;
export type MiddlewareCo<Ctx extends PipeCtx = PipeCtx> =
  | Middleware<Ctx>
  | Middleware<Ctx>[];

export type MiddlewareApi<Ctx extends ApiCtx = ApiCtx> = (
  ctx: Ctx,
  next: Next,
) => Operation<any>;
export type MiddlewareApiCo<Ctx extends ApiCtx = ApiCtx> =
  | Middleware<Ctx>
  | Middleware<Ctx>[];

export type Next = () => Operation<void>;

export interface Action {
  type: string;
}

export interface ActionWithPayload<P> extends Action {
  payload: P;
}

export interface CreateActionPayload<P = any> {
  name: string;
  key: string;
  options: P;
}

export type CreateActionFn = () => ActionWithPayload<
  CreateActionPayload<Record<string | number | symbol, never>>
>;

export interface CreateAction<Ctx> extends CreateActionFn {
  run: (
    p: ActionWithPayload<
      CreateActionPayload<Record<string | number | symbol, never>>
    >,
  ) => Operation<Ctx>;
}

export type CreateActionFnWithPayload<P = any> = (
  p: P,
) => ActionWithPayload<CreateActionPayload<P>>;

export interface CreateActionWithPayload<Ctx, P>
  extends CreateActionFnWithPayload<P> {
  run: (a: ActionWithPayload<CreateActionPayload<P>>) => Operation<Ctx>;
}

export type Supervisor<T = unknown> = (
  pattern: string,
  op: (action: Action) => Operation<T>,
) => Operation<T>;
