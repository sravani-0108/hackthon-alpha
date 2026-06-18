import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import userRepository from '../repositories/userRepository';
import * as apiResponse from '../utils/apiResponse';
import { JwtPayload } from '../types';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      apiResponse.error(res, 'Access denied. No token provided.', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      apiResponse.error(res, 'Invalid token. User not found.', 401);
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      apiResponse.error(res, 'Token expired.', 401);
      return;
    }
    apiResponse.error(res, 'Invalid token.', 401);
  }
};
