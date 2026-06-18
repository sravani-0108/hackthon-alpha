import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as apiResponse from '../utils/apiResponse';
import { UserRole } from '../types';

export const authorize = (...allowedRoles: UserRole[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiResponse.error(res, 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      apiResponse.error(res, 'Access denied. Insufficient permissions.', 403);
      return;
    }

    next();
  };

export const ROLES = {
  BANK_MANAGER: 'bank_manager' as UserRole,
  ADMIN: 'admin' as UserRole,
};
