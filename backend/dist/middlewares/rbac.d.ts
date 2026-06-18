import { RequestHandler } from 'express';
import { UserRole } from '../types';
export declare const authorize: (...allowedRoles: UserRole[]) => RequestHandler;
export declare const ROLES: {
    BANK_MANAGER: UserRole;
    ADMIN: UserRole;
};
//# sourceMappingURL=rbac.d.ts.map