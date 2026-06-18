import { Request, Response } from 'express';
import customerService from '../services/customerService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { QueryFilters } from '../types';

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getCustomers(req.query as QueryFilters);
  return apiResponse.paginated(res, result.customers, result.pagination);
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(parseInt(req.params.id, 10));
  return apiResponse.success(res, customer, 'Customer details retrieved.');
});

export const getCustomerTransactions = asyncHandler(async (req: Request, res: Response) => {
  const transactions = await customerService.getCustomerTransactions(parseInt(req.params.id, 10));
  return apiResponse.success(res, transactions, 'Customer transactions retrieved.');
});

export const getCustomerRiskProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await customerService.getCustomerRiskProfile(parseInt(req.params.id, 10));
  return apiResponse.success(res, profile, 'Customer risk profile retrieved.');
});
