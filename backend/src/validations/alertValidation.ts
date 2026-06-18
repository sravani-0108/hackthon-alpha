import { body, param } from 'express-validator';

export const createAlertValidation = [
  body('customerId').isInt({ min: 1 }).withMessage('Valid customerId is required.'),
  body('transactionId').optional().isInt({ min: 1 }),
  body('alertType').trim().notEmpty().withMessage('alertType is required.'),
  body('riskScore').optional().isInt({ min: 0, max: 100 }),
  body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('status').optional().isIn(['Open', 'Under Investigation', 'Escalated', 'Closed']),
];

export const updateAlertValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid alert id is required.'),
  body('status').optional().isIn(['Open', 'Under Investigation', 'Escalated', 'Closed']),
  body('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('riskScore').optional().isInt({ min: 0, max: 100 }),
];
