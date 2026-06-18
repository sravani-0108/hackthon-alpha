"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalDecision = exports.mediaAnalysis = exports.pepCheck = exports.sanctionsCheck = exports.transactionAnalysis = exports.customerAnalysis = void 0;
const agentService_1 = __importDefault(require("../services/agentService"));
const apiResponse = __importStar(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.customerAnalysis = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.customerAnalysis(req.body.alertId);
    return apiResponse.success(res, result, 'Customer analysis complete.');
});
exports.transactionAnalysis = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.transactionAnalysis(req.body.alertId);
    return apiResponse.success(res, result, 'Transaction analysis complete.');
});
exports.sanctionsCheck = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.sanctionsCheck(req.body.alertId);
    return apiResponse.success(res, result, 'Sanctions check complete.');
});
exports.pepCheck = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.pepCheck(req.body.alertId);
    return apiResponse.success(res, result, 'PEP check complete.');
});
exports.mediaAnalysis = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.mediaAnalysis(req.body.alertId);
    return apiResponse.success(res, result, 'Media analysis complete.');
});
exports.finalDecision = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await agentService_1.default.finalDecision(req.body.alertId);
    return apiResponse.success(res, result, 'Final decision generated.');
});
//# sourceMappingURL=agentController.js.map