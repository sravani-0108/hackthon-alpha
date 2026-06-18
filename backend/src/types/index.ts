export type UserRole = 'bank_manager' | 'admin';
export type RiskCategory = 'Low' | 'Medium' | 'High';
export type AccountType = 'Savings' | 'Current' | 'Fixed Deposit' | 'NRI';
export type TransactionType = 'Credit' | 'Debit' | 'Transfer' | 'Withdrawal' | 'Deposit';
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Reversed';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'Open' | 'Under Investigation' | 'Escalated' | 'Closed' | 'Cleared';
export type InvestigationStatus = 'Open' | 'Under Investigation' | 'Legitimate' | 'Escalated' | 'Closed' | 'Completed';
export type InvestigationAction = 'legitimate' | 'escalate' | 'close';
export type AiDecisionType = 'CLEAR' | 'ESCALATE' | 'SAR';
export type CaseStatus = 'Open' | 'Assigned' | 'Under Review' | 'Closed' | 'SAR Filed';
export type AgentType =
  | 'customer_analysis'
  | 'transaction_analysis'
  | 'sanctions_check'
  | 'pep_check'
  | 'media_analysis'
  | 'investigation'
  | 'decision'
  | 'report';

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface AppError extends Error {
  statusCode?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  /** null = return all rows (no pagination) */
  limit: number | null;
  offset: number;
}

export interface QueryFilters {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  riskCategory?: RiskCategory;
  status?: string;
  severity?: AlertSeverity;
  alertType?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  transactionType?: TransactionType;
  managerId?: string;
  action?: InvestigationAction;
}

export interface CreateAlertInput {
  customerId: number;
  transactionId?: number | null;
  alertType: string;
  reason?: string;
  riskScore?: number;
  severity?: AlertSeverity;
  status?: AlertStatus;
}

export interface TriggeredRule {
  rule: string;
  riskIncrease: number;
  transactionId: number;
}

export interface AgentAnalysisInput {
  alertId: number;
  customerId?: number;
  investigationId?: number;
}

export interface OrchestratorResult {
  investigationId: number;
  alertId: number;
  customerId: number;
  agentResults: Record<string, unknown>;
  decision: AiDecisionType;
  confidence: number;
  report: string;
  caseId?: number;
}
