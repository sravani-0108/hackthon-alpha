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
exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const apiResponse = __importStar(require("../utils/apiResponse"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.register = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService_1.default.register({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
    });
    return apiResponse.success(res, result, 'Registration successful.', 201);
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService_1.default.login({ email: req.body.email, password: req.body.password });
    return apiResponse.success(res, result, 'Login successful.');
});
exports.logout = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService_1.default.logout(req.user.id);
    return apiResponse.success(res, result, 'Logged out successfully.');
});
exports.refreshToken = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await authService_1.default.refreshToken(req.body.refreshToken);
    return apiResponse.success(res, result, 'Token refreshed.');
});
//# sourceMappingURL=authController.js.map