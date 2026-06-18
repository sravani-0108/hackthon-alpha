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
exports.updateAlertStatus = exports.updateAlert = exports.createAlert = exports.getAlertById = exports.getAlerts = void 0;
const alertService_1 = __importDefault(require("../services/alertService"));
const apiResponse = __importStar(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.getAlerts = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await alertService_1.default.getAlerts(req.query);
    return apiResponse.paginated(res, result.alerts, result.pagination);
});
exports.getAlertById = (0, asyncHandler_1.default)(async (req, res) => {
    const alert = await alertService_1.default.getAlertById(parseInt(req.params.id, 10));
    return apiResponse.success(res, alert, 'Alert details retrieved.');
});
exports.createAlert = (0, asyncHandler_1.default)(async (req, res) => {
    const alert = await alertService_1.default.createAlert(req.body);
    return apiResponse.success(res, alert, 'Alert created.', 201);
});
exports.updateAlert = (0, asyncHandler_1.default)(async (req, res) => {
    const alert = await alertService_1.default.updateAlert(parseInt(req.params.id, 10), {
        status: req.body.status,
        severity: req.body.severity,
        risk_score: req.body.riskScore,
    });
    return apiResponse.success(res, alert, 'Alert updated.');
});
exports.updateAlertStatus = (0, asyncHandler_1.default)(async (req, res) => {
    const alert = await alertService_1.default.updateAlertStatus(parseInt(req.params.id, 10), req.body.status);
    return apiResponse.success(res, alert, 'Alert status updated.');
});
//# sourceMappingURL=alertController.js.map