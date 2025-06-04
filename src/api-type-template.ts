import { writeFileSync } from "fs";

function createQueryApi() {
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
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(req: {
  supervisor?: Supervisor;
}): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<Ctx>,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor },
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
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
  fn: MiddlewareApiCo<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>>,
): CreateAction<Omit<Ctx, 'json'> & FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>, ApiSuccess>;
${method}<P, ApiSuccess, ApiError = unknown>(
  name: ApiName,
  req: { supervisor?: Supervisor },
  fn: MiddlewareApiCo<
    Omit<Ctx, 'payload' | 'json'> &
      Payload<P> &
      FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>
  >,
): CreateActionWithPayload<
  Omit<Ctx, 'payload' | 'json'> &
    Payload<P> &
    FetchJson<ApiSuccess, ApiError extends unknown ? Ctx["_error"] : ApiError>,
  P,
  ApiSuccess
>;`;
  const regMethods = methods.map((m) => methodTmpl(m)).join("\n\n");

  const tmpl = `/**
* This is an auto-generated file, do not edit directly!
* Run "yarn template" to generate this file.
*/
import type { ThunksApi } from "./thunk.js";
import type {
  ApiCtx,
  CreateAction,
  CreateActionWithPayload,
  FetchJson,
  MiddlewareApiCo,
  Supervisor,
} from "./types.js";
import type { Next, Payload } from "../types.js";
import type { Operation } from "effection";

export type ApiName = string | string[];

export interface QueryApi<Ctx extends ApiCtx = ApiCtx> extends ThunksApi<Ctx> {
  request: (
    r: Partial<RequestInit>,
  ) => (ctx: Ctx, next: Next) => Operation<unknown>;
  cache: () => (ctx: Ctx, next: Next) => Operation<unknown>;

  uri: (uri: string) => {
    ${uriMethods}
  }

${regMethods}
}`;

  return tmpl;
}

async function createTemplateFile(tmpl: string) {
  try {
    writeFileSync("./query/api-types.js", tmpl);
  } catch (err) {
    console.error(err);
  }
}

createTemplateFile(createQueryApi()).then(console.log).catch(console.error);
