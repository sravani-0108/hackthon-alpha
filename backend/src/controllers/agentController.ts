import { Request, Response } from 'express';
import agentService from '../services/agentService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const customerAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.customerAnalysis(req.body.alertId);
  return apiResponse.success(res, result, 'Customer analysis complete.');
});

export const transactionAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.transactionAnalysis(req.body.alertId);
  return apiResponse.success(res, result, 'Transaction analysis complete.');
});

export const sanctionsCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.sanctionsCheck(req.body.alertId);
  return apiResponse.success(res, result, 'Sanctions check complete.');
});

export const pepCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.pepCheck(req.body.alertId);
  return apiResponse.success(res, result, 'PEP check complete.');
});

export const mediaAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.mediaAnalysis(req.body.alertId);
  return apiResponse.success(res, result, 'Media analysis complete.');
});

export const finalDecision = asyncHandler(async (req: Request, res: Response) => {
  const result = await agentService.finalDecision(req.body.alertId);
  return apiResponse.success(res, result, 'Final decision generated.');
});
