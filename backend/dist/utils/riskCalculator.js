"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capRiskScore = exports.calculateSeverity = exports.calculateRiskCategory = void 0;
const config_1 = __importDefault(require("../config"));
const calculateRiskCategory = (riskScore) => {
    const score = Math.min(100, Math.max(0, riskScore));
    const { low, medium } = config_1.default.aml.riskCategories;
    if (score <= low.max)
        return 'Low';
    if (score <= medium.max)
        return 'Medium';
    return 'High';
};
exports.calculateRiskCategory = calculateRiskCategory;
const calculateSeverity = (riskScore) => {
    if (riskScore >= 80)
        return 'Critical';
    if (riskScore >= 60)
        return 'High';
    if (riskScore >= 30)
        return 'Medium';
    return 'Low';
};
exports.calculateSeverity = calculateSeverity;
const capRiskScore = (score) => Math.min(100, Math.max(0, score));
exports.capRiskScore = capRiskScore;
//# sourceMappingURL=riskCalculator.js.map