import { z } from 'zod';

// ── Auth schemas ───────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refresh_token: z.string({ required_error: 'Refresh token is required' }),
  }),
});

// ── User CRUD schemas ──────────────────────────────────────────────────────────

export const getUsersSchema = z.object({
  query: z.object({
    page:      z.string().regex(/^\d+$/, 'page must be a number').optional(),
    limit:     z.string().regex(/^\d+$/, 'limit must be a number').optional(),
    search:    z.string().max(100, 'search too long').optional(),
    sortBy:    z.enum(['name', 'email', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z.enum(['super_admin', 'admin', 'user']).optional().default('user'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'User ID is required' }),
  }),
});

// ── Inferred types ─────────────────────────────────────────────────────────────

export type RegisterInput    = z.infer<typeof registerSchema>['body'];
export type LoginInput       = z.infer<typeof loginSchema>['body'];
export type CreateUserInput  = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput  = z.infer<typeof updateUserSchema>['body'];
