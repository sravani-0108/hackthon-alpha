"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertValidation = exports.createAlertValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createAlertValidation = [
    (0, express_validator_1.body)('customerId').isInt({ min: 1 }).withMessage('Valid customerId is required.'),
    (0, express_validator_1.body)('transactionId').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('alertType').trim().notEmpty().withMessage('alertType is required.'),
    (0, express_validator_1.body)('riskScore').optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    (0, express_validator_1.body)('status').optional().isIn(['Open', 'Under Investigation', 'Escalated', 'Closed']),
];
exports.updateAlertValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid alert id is required.'),
    (0, express_validator_1.body)('status').optional().isIn(['Open', 'Under Investigation', 'Escalated', 'Closed']),
    (0, express_validator_1.body)('severity').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    (0, express_validator_1.body)('riskScore').optional().isInt({ min: 0, max: 100 }),
];
//# sourceMappingURL=alertValidation.js.map