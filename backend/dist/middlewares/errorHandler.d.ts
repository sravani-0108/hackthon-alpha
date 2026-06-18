import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
export declare const errorHandler: (err: AppError, _req: Request, res: Response, _next: NextFunction) => Response;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map