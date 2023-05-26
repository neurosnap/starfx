function createSagaQueryApi() {
  const methods = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
    "connect",
    "trace",
  ];

  const uriTmpl = (method: string) =>
    `/**
 * Options only
 */
${method}(req: { supervisor?: Supervisor }): CreateAction<Ctx>;
${method}<P>(
  req: { supervisor?: Supervisor }
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  req: { supervisor?: Supervisor }
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(req: {
  supervisor?: Supervisor;
}): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
* Middleware only
*/
${method}(fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
* Options and Middleware
*/
${method}(req: { supervisor?: Supervisor }, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;`;
  const uriMethods = methods.map((m) => uriTmpl(m)).join("\n\n");

  const methodTmpl = (method: string) =>
    `/**
 * Only name
 */
${method}(name: ApiName): CreateAction<Ctx>;
${method}<P>(
  name: ApiName,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  name: ApiName,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name and options
 */
${method}(name: ApiName, req: { supervisor?: Supervisor }): CreateAction<Ctx>;
${method}<P>(
  name: ApiName,
  req: { supervisor?: Supervisor }
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { supervisor?: Supervisor }
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor }
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor },
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name and middleware
 */
${method}(name: ApiName, fn: MiddlewareApiCo<Ctx>): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  name: ApiName,
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  name: ApiName,
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError>
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;

/**
 * Name, options, and middleware
 */
${method}(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Ctx>,
): CreateAction<Ctx>;
${method}<Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Gtx>,
): CreateAction<Gtx>;
${method}<P>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Omit<Ctx, 'payload'> & Payload<P>>,
): CreateActionWithPayload<Omit<Ctx, 'payload'> & Payload<P>, P>;
${method}<P, Gtx extends Ctx = Ctx>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Gtx>,
): CreateActionWithPayload<Gtx, P>;
${method}<P extends never, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError>>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError>
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError>,
  P
>;`;
  const regMethods = methods.map((m) => methodTmpl(m)).join("\n\n");

  const tmpl = `/**
* This is an auto-generated file, do not edit directly!
* Run "yarn template" to generate this file.
*/
import type { SagaApi } from "./pipe.ts";
import type {
  ApiCtx,
  CreateAction,
  CreateActionWithPayload,
  Next,
  FetchJson,
  MiddlewareApiCo,
  Supervisor,
} from "./types.ts";
import type { Payload } from "../types.ts";

export type ApiName = string | string[];

export interface SagaQueryApi<Ctx extends ApiCtx = ApiCtx> extends SagaApi<Ctx> {
  request: (
    r: Partial<RequestInit>,
  ) => (ctx: Ctx, next: Next) => Iterator<unknown>;
  cache: () => (ctx: Ctx, next: Next) => Iterator<unknown>;

  uri: (uri: string) => {
    ${uriMethods}
  }

${regMethods}
}`;

  return tmpl;
}

async function createTemplateFile(tmpl: string) {
  try {
    await Deno.writeTextFile("./query/api-types.ts", tmpl);
  } catch (err) {
    console.error(err);
  }
}

createTemplateFile(createSagaQueryApi()).then(console.log).catch(console.error);
