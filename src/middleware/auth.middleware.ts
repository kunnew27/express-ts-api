import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '@/types';

/**
 * protect — JWT access-token guard.
 * Attach as middleware to any route that requires authentication.
 * On success it sets req.user = { id, email } for downstream handlers.
 */
const protect = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(
      Object.assign(new Error('Not authorized — no token provided'), {
        statusCode: 401,
      })
    );
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    (req as AuthRequest).user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(
      Object.assign(new Error('Not authorized — token invalid or expired'), {
        statusCode: 401,
      })
    );
  }
};

export default protect;
