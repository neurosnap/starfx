import type { Operation, Result } from "../deps.ts";
import type {
  Action,
  ActionWithPayload,
  LoaderItemState,
  LoaderPayload,
  Payload,
} from "../types.ts";

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export interface ThunkCtx<P = any> extends Payload<P> {
  name: string;
  key: string;
  action: ActionWithPayload<CreateActionPayload<P>>;
  actionFn: IfAny<
    P,
    CreateAction<ThunkCtx>,
    CreateActionWithPayload<ThunkCtx<P>, P>
  >;
  result: Result<void>;
}

export interface LoaderCtx<P = unknown> extends ThunkCtx<P> {
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

export interface FetchCtx<P = any> extends ThunkCtx<P> {
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
  // should we cache ctx.json?
  cache: boolean;
  // should we use mdw.stub?
  stub: boolean;
  // previously cached data
  cacheData: any;
  _success: ApiSuccess;
  _error: ApiError;
}

export interface PerfCtx<P = unknown> extends ThunkCtx<P> {
  performance: number;
}

export type Middleware<Ctx extends ThunkCtx = ThunkCtx> = (
  ctx: Ctx,
  next: Next,
) => Operation<any>;
export type MiddlewareCo<Ctx extends ThunkCtx = ThunkCtx> =
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

export interface CreateActionPayload<P = any, ApiSuccess = any> {
  name: string;
  key: string;
  options: P;
  _result: ApiSuccess;
}

export type CreateActionFn<ApiSuccess = any> = () => ActionWithPayload<
  CreateActionPayload<Record<string | number | symbol, never>, ApiSuccess>
>;

export interface CreateAction<
  Ctx extends ThunkCtx = ThunkCtx,
  ApiSuccess = any,
> extends CreateActionFn<ApiSuccess> {
  run: (
    p?: ActionWithPayload<
      CreateActionPayload<Record<string | number | symbol, never>, ApiSuccess>
    >,
  ) => Operation<Ctx>;
  use: (mdw: Middleware<Ctx>) => void;
}

export type CreateActionFnWithPayload<P = any, ApiSuccess = any> = (
  p: P,
) => ActionWithPayload<CreateActionPayload<P, ApiSuccess>>;

export interface CreateActionWithPayload<
  Ctx extends ThunkCtx,
  P,
  ApiSuccess = any,
> extends CreateActionFnWithPayload<P, ApiSuccess> {
  run: (
    a: ActionWithPayload<CreateActionPayload<P, ApiSuccess>> | P,
  ) => Operation<Ctx>;
  use: (mdw: Middleware<Ctx>) => void;
}

export type ThunkAction<P = any, ApiSuccess = any> = ActionWithPayload<
  CreateActionPayload<P, ApiSuccess>
>;

export type Supervisor<T = unknown> = (
  pattern: string,
  op: (action: Action) => Operation<T>,
) => Operation<T>;
