import { Request, Response } from 'express';
import authService from '../services/authService';
import * as apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { UserRole } from '../types';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role as UserRole | undefined,
  });
  return apiResponse.success(res, result, 'Registration successful.', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login({ email: req.body.email, password: req.body.password });
  return apiResponse.success(res, result, 'Login successful.');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.logout(req.user!.id);
  return apiResponse.success(res, result, 'Logged out successfully.');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  return apiResponse.success(res, result, 'Token refreshed.');
});
