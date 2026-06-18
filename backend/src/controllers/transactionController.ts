import { Request, Response } from 'express';
import transactionService from '../services/transactionService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { QueryFilters } from '../types';

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionService.getTransactions(req.query as QueryFilters);
  return apiResponse.paginated(res, result.transactions, result.pagination);
});

export const getTransactionsByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionService.getTransactionsByCustomer(
    parseInt(req.params.customerId, 10),
    req.query as QueryFilters
  );
  return apiResponse.paginated(res, result.transactions, result.pagination);
});
