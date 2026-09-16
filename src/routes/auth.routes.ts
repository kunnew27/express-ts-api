import { Router } from 'express';
import asyncHandler from '@/middleware/asyncHandler';
import validate from '@/middleware/validate';
import {
  register,
  login,
  refreshToken,
  logout,
} from '@/controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@/schemas/user.schema';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), asyncHandler(register));

// POST /api/auth/login
router.post('/login', validate(loginSchema), asyncHandler(login));

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(refreshToken));

// POST /api/auth/logout
router.post('/logout', asyncHandler(logout));

export default router;
