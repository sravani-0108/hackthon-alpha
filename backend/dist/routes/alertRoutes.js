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
const express_1 = require("express");
const alertController = __importStar(require("../controllers/alertController"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const alertValidation_1 = require("../validations/alertValidation");
const validate_1 = __importDefault(require("../middlewares/validate"));
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), alertController.getAlerts);
router.get('/:id', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), alertController.getAlertById);
router.post('/', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), alertValidation_1.createAlertValidation, validate_1.default, alertController.createAlert);
router.put('/:id', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), alertValidation_1.updateAlertValidation, validate_1.default, alertController.updateAlert);
router.put('/:id/status', auth_1.authenticate, (0, rbac_1.authorize)(rbac_1.ROLES.BANK_MANAGER, rbac_1.ROLES.ADMIN), alertController.updateAlertStatus);
exports.default = router;
//# sourceMappingURL=alertRoutes.js.map