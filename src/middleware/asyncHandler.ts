import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn<P = Record<string, never>, ResBody = unknown, ReqBody = unknown> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler<
  P = Record<string, never>,
  ResBody = unknown,
  ReqBody = unknown,
>(fn: AsyncFn<P, ResBody, ReqBody>): RequestHandler {
  return (req, res, next) =>
    Promise.resolve(fn(req as Request<P, ResBody, ReqBody>, res, next)).catch(next);
}
