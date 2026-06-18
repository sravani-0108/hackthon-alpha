import { PIPELINE_HELP, OVERALL_RISK_HELP, DECISION_HELP } from '../constants/investigationHelp';

export const INVESTIGATION_STEPS = [
  {
    id: 'internal_data_analysis',
    icon: '📂',
    label: 'Internal Data Analysis',
    basis: 'Customer profile and transaction behavior analysis from internal bank records',
  },
  {
    id: 'external_screening',
    icon: '🌐',
    label: 'External Screening',
    basis: 'Sanctions, PEP, and adverse media checks from configured screening sources',
  },
  {
    id: 'investigation_decision',
    icon: '⚖️',
    label: 'Investigation & Decision',
    basis: 'Correlated risk assessment, compliance narrative, and final recommendation',
  },
] as const;

export const REPORT_BASIS_SUMMARY = {
  title: 'On What Basis Is the Report Generated?',
  intro: 'When you start an AI investigation, Gemini ADK agents read live data from your bank database and external screening sources (OpenSanctions, Google Search), then produce structured findings. The final report and disposition follow AML compliance rules applied by the investigation agent.',
  dataSources: [
    { label: 'Customer KYC', detail: 'Name, occupation, country, PEP status, risk score, account history (PostgreSQL)' },
    { label: 'Transaction History', detail: 'Alert transaction, velocity, spike vs monthly average (PostgreSQL)' },
    { label: 'Alert Context', detail: 'Alert type, triggered rule, severity, linked transaction' },
    { label: 'External Screening', detail: 'OpenSanctions (PEP + sanctions), Google Search (adverse media); mock fallback when offline' },
  ],
  scoring: OVERALL_RISK_HELP.rules,
  decisions: DECISION_HELP.rules,
  pipeline: PIPELINE_HELP.rules,
};
