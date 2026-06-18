import { Response } from 'express';
import { PaginationMeta } from '../types';

export const success = <T>(res: Response, data: T, message = 'Success', statusCode = 200): Response =>
  res.status(statusCode).json({ success: true, message, data });

export const error = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors: unknown = null
): Response => res.status(statusCode).json({ success: false, message, errors });

export const paginated = <T>(
  res: Response,
  data: T,
  pagination: PaginationMeta,
  message = 'Success'
): Response => res.status(200).json({ success: true, message, data, pagination });
