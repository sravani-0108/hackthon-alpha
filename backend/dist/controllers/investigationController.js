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
exports.getInvestigations = exports.updateInvestigation = exports.createInvestigation = exports.getInvestigationReport = exports.getInvestigationById = exports.startInvestigation = void 0;
const investigationService_1 = __importDefault(require("../services/investigationService"));
const apiResponse = __importStar(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.startInvestigation = (0, asyncHandler_1.default)(async (req, res) => {
    const investigation = await investigationService_1.default.startAiInvestigation(parseInt(req.params.alertId, 10), req.user.id);
    return apiResponse.success(res, investigation, 'AI investigation started.', 201);
});
exports.getInvestigationById = (0, asyncHandler_1.default)(async (req, res) => {
    const investigation = await investigationService_1.default.getInvestigationById(parseInt(req.params.id, 10));
    return apiResponse.success(res, investigation, 'Investigation retrieved.');
});
exports.getInvestigationReport = (0, asyncHandler_1.default)(async (req, res) => {
    const report = await investigationService_1.default.getInvestigationReport(parseInt(req.params.id, 10));
    return apiResponse.success(res, report, 'Investigation report retrieved.');
});
exports.createInvestigation = (0, asyncHandler_1.default)(async (req, res) => {
    const investigation = await investigationService_1.default.createInvestigation({
        alertId: req.body.alertId,
        managerId: req.user.id,
        notes: req.body.notes,
        action: req.body.action,
    });
    return apiResponse.success(res, investigation, 'Investigation created.', 201);
});
exports.updateInvestigation = (0, asyncHandler_1.default)(async (req, res) => {
    const investigation = await investigationService_1.default.updateInvestigation(parseInt(req.params.id, 10), {
        notes: req.body.notes,
        action: req.body.action,
    });
    return apiResponse.success(res, investigation, 'Investigation updated.');
});
exports.getInvestigations = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await investigationService_1.default.getInvestigations(req.query);
    return apiResponse.paginated(res, result.investigations, result.pagination);
});
//# sourceMappingURL=investigationController.js.map