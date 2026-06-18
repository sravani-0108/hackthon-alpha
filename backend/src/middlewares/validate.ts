import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import * as apiResponse from '../utils/apiResponse';

const validate: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    apiResponse.error(res, 'Validation failed.', 400, errors.array());
    return;
  }

  next();
};

export default validate;
