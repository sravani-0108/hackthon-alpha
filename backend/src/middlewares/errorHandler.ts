import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import * as apiResponse from '../utils/apiResponse';
import { AppError } from '../types';

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  console.error('[Error]', err);

  if (err instanceof QueryFailedError) {
    const pgError = err.driverError as { code?: string };
    if (pgError?.code === '23505') {
      return apiResponse.error(res, 'Duplicate entry.', 409);
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  return apiResponse.error(res, message, statusCode);
};

export default errorHandler;
