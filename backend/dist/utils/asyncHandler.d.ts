import { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export declare const asyncHandler: (fn: AsyncRequestHandler) => RequestHandler;
export default asyncHandler;
//# sourceMappingURL=asyncHandler.d.ts.map