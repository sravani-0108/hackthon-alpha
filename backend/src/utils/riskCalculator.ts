import config from '../config';
import { AlertSeverity, RiskCategory } from '../types';

export const calculateRiskCategory = (riskScore: number): RiskCategory => {
  const score = Math.min(100, Math.max(0, riskScore));
  const { low, medium } = config.aml.riskCategories;

  if (score <= low.max) return 'Low';
  if (score <= medium.max) return 'Medium';
  return 'High';
};

export const calculateSeverity = (riskScore: number): AlertSeverity => {
  if (riskScore >= 80) return 'Critical';
  if (riskScore >= 60) return 'High';
  if (riskScore >= 30) return 'Medium';
  return 'Low';
};

export const capRiskScore = (score: number): number => Math.min(100, Math.max(0, score));
