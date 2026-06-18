"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required.'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    (0, express_validator_1.body)('role').optional().isIn(['bank_manager', 'admin']).withMessage('Role must be bank_manager or admin.'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required.'),
];
//# sourceMappingURL=authValidation.js.map