import { Response } from 'express';
import { PaginationMeta } from '../types';
export declare const success: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response;
export declare const error: (res: Response, message?: string, statusCode?: number, errors?: unknown) => Response;
export declare const paginated: <T>(res: Response, data: T, pagination: PaginationMeta, message?: string) => Response;
//# sourceMappingURL=apiResponse.d.ts.map