"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvestigationValidation = exports.createInvestigationValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createInvestigationValidation = [
    (0, express_validator_1.body)('alertId').isInt({ min: 1 }).withMessage('Valid alertId is required.'),
    (0, express_validator_1.body)('notes').optional().isString(),
    (0, express_validator_1.body)('action')
        .optional()
        .isIn(['legitimate', 'escalate', 'close'])
        .withMessage('Action must be legitimate, escalate, or close.'),
];
exports.updateInvestigationValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid investigation id is required.'),
    (0, express_validator_1.body)('notes').optional().isString(),
    (0, express_validator_1.body)('action')
        .optional()
        .isIn(['legitimate', 'escalate', 'close'])
        .withMessage('Action must be legitimate, escalate, or close.'),
];
//# sourceMappingURL=investigationValidation.js.map