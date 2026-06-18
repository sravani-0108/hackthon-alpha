import { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  return apiResponse.success(res, stats, 'Dashboard stats retrieved.');
});
