import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JwtUserPayload } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'smart_hr_lanka_super_secret_jwt_key_2026';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid format'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
    req.user = decoded;
    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Session expired. Please log in again.'));
    }
    return next(new UnauthorizedError('Invalid authentication token'));
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // SUPER_ADMIN has global bypass permissions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have the required role to access this resource'));
    }

    return next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasPermission = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Missing required permission: ${requiredPermissions.join(', ')}`
        )
      );
    }

    return next();
  };
};
