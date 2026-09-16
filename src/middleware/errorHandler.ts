import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

// ── AppError shape ─────────────────────────────────────────────────────────────
export interface AppError extends Error {
  statusCode?: number;
}

// ── Normalizers (each returns a plain AppError) ────────────────────────────────

const fromZodError = (err: ZodError): AppError => {
  const message = err.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(' | ');
  return Object.assign(new Error(message), { statusCode: 422 });
};

const fromMongooseValidation = (
  err: mongoose.Error.ValidationError
): AppError => {
  const message = Object.values(err.errors)
    .map((e) => e.message)
    .join(' | ');
  return Object.assign(new Error(message), { statusCode: 400 });
};

const fromMongooseCast = (err: mongoose.Error.CastError): AppError =>
  Object.assign(
    new Error(`Invalid value for field "${err.path}": ${String(err.value)}`),
    { statusCode: 400 }
  );

const fromMongoDuplicate = (err: Record<string, unknown>): AppError => {
  const keyValue = err['keyValue'] as Record<string, unknown> | undefined;
  const field = keyValue ? Object.keys(keyValue)[0] : 'field';
  return Object.assign(
    new Error(`Duplicate value — "${field}" already exists`),
    { statusCode: 409 }
  );
};

// ── Classifier ─────────────────────────────────────────────────────────────────

const classify = (err: unknown): AppError => {
  if (err instanceof ZodError) return fromZodError(err);
  if (err instanceof mongoose.Error.ValidationError)
    return fromMongooseValidation(err);
  if (err instanceof mongoose.Error.CastError) return fromMongooseCast(err);

  if (
    typeof err === 'object' &&
    err !== null &&
    (err as Record<string, unknown>)['code'] === 11000
  ) {
    return fromMongoDuplicate(err as Record<string, unknown>);
  }

  if (err instanceof Error) {
    const appErr = err as AppError;
    if (!appErr.statusCode) appErr.statusCode = 500;
    return appErr;
  }

  return Object.assign(new Error('An unexpected error occurred'), {
    statusCode: 500,
  });
};

// ── Global error handler ───────────────────────────────────────────────────────
// Must have exactly 4 parameters so Express recognises it as an error handler.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProd = process.env.NODE_ENV === 'production';
  const appErr = classify(err);
  const statusCode = appErr.statusCode ?? 500;

  const body: Record<string, unknown> = {
    status: 'error',
    message: appErr.message,
  };

  // Expose stack trace in non-production environments
  if (!isProd) {
    body['stack'] = appErr.stack;
  }

  res.status(statusCode).json(body);
};

export default globalErrorHandler;
