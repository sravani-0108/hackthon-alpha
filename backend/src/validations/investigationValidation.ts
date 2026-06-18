import { body, param } from 'express-validator';

export const createInvestigationValidation = [
  body('alertId').isInt({ min: 1 }).withMessage('Valid alertId is required.'),
  body('notes').optional().isString(),
  body('action')
    .optional()
    .isIn(['legitimate', 'escalate', 'close'])
    .withMessage('Action must be legitimate, escalate, or close.'),
];

export const updateInvestigationValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid investigation id is required.'),
  body('notes').optional().isString(),
  body('action')
    .optional()
    .isIn(['legitimate', 'escalate', 'close'])
    .withMessage('Action must be legitimate, escalate, or close.'),
];
