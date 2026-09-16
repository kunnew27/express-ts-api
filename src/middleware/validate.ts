import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Zod validation middleware.
 * Validates req.body, req.query, and req.params against the given schema.
 * On failure the ZodError is forwarded to the global error handler.
 */
const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      next(err); // ZodError → globalErrorHandler
    }
  };

export default validate;
