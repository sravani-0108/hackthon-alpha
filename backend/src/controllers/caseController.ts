import { Request, Response } from 'express';
import caseService from '../services/caseService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getCases = asyncHandler(async (req: Request, res: Response) => {
  const result = await caseService.getCases(
    req.query as { page?: string; limit?: string; status?: string; includeClosed?: string }
  );
  return apiResponse.paginated(res, result.cases, result.pagination);
});

export const getCaseById = asyncHandler(async (req: Request, res: Response) => {
  const amlCase = await caseService.getCaseById(parseInt(req.params.id, 10));
  return apiResponse.success(res, amlCase, 'Case retrieved.');
});

export const assignCase = asyncHandler(async (req: Request, res: Response) => {
  const amlCase = await caseService.assignCase(parseInt(req.params.id, 10), req.body.userId || req.user!.id);
  return apiResponse.success(res, amlCase, 'Case assigned.');
});

export const closeCase = asyncHandler(async (req: Request, res: Response) => {
  const amlCase = await caseService.closeCase(parseInt(req.params.id, 10));
  return apiResponse.success(res, amlCase, 'Case closed.');
});

export const resolveCase = asyncHandler(async (req: Request, res: Response) => {
  const decision = req.body.decision as string;
  if (decision !== 'CLEAR' && decision !== 'SAR') {
    return apiResponse.error(res, 'Decision must be CLEAR or SAR.', 400);
  }

  const amlCase = await caseService.resolveCase(
    parseInt(req.params.id, 10),
    decision,
    req.user!.id,
    req.body.notes as string | undefined
  );

  const message = decision === 'CLEAR' ? 'Case marked as CLEAR and closed.' : 'SAR filed and case updated.';
  return apiResponse.success(res, amlCase, message);
});
