"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const dashboardRoutes_1 = __importDefault(require("./dashboardRoutes"));
const customerRoutes_1 = __importDefault(require("./customerRoutes"));
const transactionRoutes_1 = __importDefault(require("./transactionRoutes"));
const alertRoutes_1 = __importDefault(require("./alertRoutes"));
const investigationRoutes_1 = __importDefault(require("./investigationRoutes"));
const agentRoutes_1 = __importDefault(require("./agentRoutes"));
const caseRoutes_1 = __importDefault(require("./caseRoutes"));
const systemRoutes_1 = __importDefault(require("./systemRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/dashboard', dashboardRoutes_1.default);
router.use('/customers', customerRoutes_1.default);
router.use('/transactions', transactionRoutes_1.default);
router.use('/alerts', alertRoutes_1.default);
router.use('/investigations', investigationRoutes_1.default);
router.use('/agents', agentRoutes_1.default);
router.use('/cases', caseRoutes_1.default);
router.use('/system', systemRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map