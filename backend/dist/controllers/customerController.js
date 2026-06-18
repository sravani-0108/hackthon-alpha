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
exports.getCustomerRiskProfile = exports.getCustomerTransactions = exports.getCustomerById = exports.getCustomers = void 0;
const customerService_1 = __importDefault(require("../services/customerService"));
const apiResponse = __importStar(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.getCustomers = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await customerService_1.default.getCustomers(req.query);
    return apiResponse.paginated(res, result.customers, result.pagination);
});
exports.getCustomerById = (0, asyncHandler_1.default)(async (req, res) => {
    const customer = await customerService_1.default.getCustomerById(parseInt(req.params.id, 10));
    return apiResponse.success(res, customer, 'Customer details retrieved.');
});
exports.getCustomerTransactions = (0, asyncHandler_1.default)(async (req, res) => {
    const transactions = await customerService_1.default.getCustomerTransactions(parseInt(req.params.id, 10));
    return apiResponse.success(res, transactions, 'Customer transactions retrieved.');
});
exports.getCustomerRiskProfile = (0, asyncHandler_1.default)(async (req, res) => {
    const profile = await customerService_1.default.getCustomerRiskProfile(parseInt(req.params.id, 10));
    return apiResponse.success(res, profile, 'Customer risk profile retrieved.');
});
//# sourceMappingURL=customerController.js.map