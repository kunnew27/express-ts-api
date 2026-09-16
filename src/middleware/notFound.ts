import { Request, Response, NextFunction } from 'express';

/**
 * 404 handler — mount AFTER all routes.
 * Passes a 404 AppError to the global error handler.
 */
const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = Object.assign(
    new Error(`Not Found — ${req.method} ${req.originalUrl}`),
    { statusCode: 404 }
  );
  next(error);
};

export default notFound;
