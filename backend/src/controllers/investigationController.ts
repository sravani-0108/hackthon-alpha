import { Request, Response } from 'express';
import investigationService from '../services/investigationService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { InvestigationAction, QueryFilters } from '../types';

export const startInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const investigation = await investigationService.startAiInvestigation(
    parseInt(req.params.alertId, 10),
    req.user!.id
  );
  return apiResponse.success(res, investigation, 'AI investigation started.', 201);
});

export const getInvestigationById = asyncHandler(async (req: Request, res: Response) => {
  const investigation = await investigationService.getInvestigationById(parseInt(req.params.id, 10));
  return apiResponse.success(res, investigation, 'Investigation retrieved.');
});

export const getInvestigationReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await investigationService.getInvestigationReport(parseInt(req.params.id, 10));
  return apiResponse.success(res, report, 'Investigation report retrieved.');
});

export const createInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const investigation = await investigationService.createInvestigation({
    alertId: req.body.alertId,
    managerId: req.user!.id,
    notes: req.body.notes,
    action: req.body.action as InvestigationAction | undefined,
  });
  return apiResponse.success(res, investigation, 'Investigation created.', 201);
});

export const updateInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const investigation = await investigationService.updateInvestigation(parseInt(req.params.id, 10), {
    notes: req.body.notes,
    action: req.body.action as InvestigationAction | undefined,
  });
  return apiResponse.success(res, investigation, 'Investigation updated.');
});

export const getInvestigations = asyncHandler(async (req: Request, res: Response) => {
  const result = await investigationService.getInvestigations(req.query as QueryFilters);
  return apiResponse.paginated(res, result.investigations, result.pagination);
});
