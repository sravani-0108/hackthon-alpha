import { Request, Response } from 'express';
import alertService from '../services/alertService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateAlertInput, QueryFilters } from '../types';
import { AlertSeverity, AlertStatus } from '../types';

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const result = await alertService.getAlerts(req.query as QueryFilters);
  return apiResponse.paginated(res, result.alerts, result.pagination);
});

export const getAlertById = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alertService.getAlertById(parseInt(req.params.id, 10));
  return apiResponse.success(res, alert, 'Alert details retrieved.');
});

export const createAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alertService.createAlert(req.body as CreateAlertInput);
  return apiResponse.success(res, alert, 'Alert created.', 201);
});

export const updateAlert = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alertService.updateAlert(parseInt(req.params.id, 10), {
    status: req.body.status as AlertStatus | undefined,
    severity: req.body.severity as AlertSeverity | undefined,
    risk_score: req.body.riskScore,
  });
  return apiResponse.success(res, alert, 'Alert updated.');
});

export const updateAlertStatus = asyncHandler(async (req: Request, res: Response) => {
  const alert = await alertService.updateAlertStatus(
    parseInt(req.params.id, 10),
    req.body.status as AlertStatus
  );
  return apiResponse.success(res, alert, 'Alert status updated.');
});
