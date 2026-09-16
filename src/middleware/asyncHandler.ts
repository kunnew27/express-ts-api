import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void | unknown>;

/**
 * Wraps an async route handler so thrown errors are forwarded to next()
 * without needing try/catch in every controller.
 */
const asyncHandler = <T extends Request = Request>(
  fn: AsyncFn<T>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

export default asyncHandler;
