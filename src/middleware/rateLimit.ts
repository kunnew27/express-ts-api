import { rateLimit } from 'express-rate-limit';

/**
 * Global limiter — applied to every route.
 * 100 requests per IP per 15 minutes.
 */
export const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  limit:            100,
  standardHeaders:  'draft-7',       // RateLimit headers (RFC draft 7)
  legacyHeaders:    false,
  message: {
    status:  'error',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Auth limiter — applied to /api/auth/*.
 * Stricter: 10 requests per IP per 15 minutes.
 * Prevents brute-force on login / register.
 */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  limit:            10,
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  message: {
    status:  'error',
    message: 'Too many auth attempts, please try again in 15 minutes.',
  },
});

/**
 * Sensitive-action limiter — for any future endpoints that are
 * especially sensitive (e.g. password reset, 2FA).
 * 5 requests per IP per hour.
 */
export const sensitiveLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hour
  limit:            5,
  standardHeaders:  'draft-7',
  legacyHeaders:    false,
  message: {
    status:  'error',
    message: 'Too many attempts, please try again in 1 hour.',
  },
});
