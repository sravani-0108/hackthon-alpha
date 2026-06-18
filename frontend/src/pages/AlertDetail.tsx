import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { AlertDetail, Investigation, InvestigationReport } from '../api/client';
import { StagePipeline, FormattedReport, PipelineMethodologyNote } from '../components/InvestigationReportView';
import { InvestigationStartModal, InvestigationProgress } from '../components/InvestigationStartModal';
import { InfoTooltip, InfoNote } from '../components/InfoTooltip';
import { ALERT_RISK_HELP, CUSTOMER_RISK_HELP, CONFIDENCE_HELP } from '../constants/investigationHelp';
import { INVESTIGATION_STEPS } from '../constants/investigationSteps';

export default function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<Investigation | null>(null);
  const [stageReport, setStageReport] = useState<InvestigationReport | null>(null);
  const [error, setError] = useState('');
  const isOpenAlert = alert?.summary.status === 'Open';

  useEffect(() => {
    if (id) api.getAlert(parseInt(id, 10)).then(setAlert).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s < INVESTIGATION_STEPS.length - 1 ? s + 1 : s));
    }, 700);
    return () => clearInterval(interval);
  }, [running]);

  const runAiInvestigation = async () => {
    if (!id) return;
    setShowStartModal(false);
    setRunning(true);
    setActiveStep(0);
    setError('');
    try {
      const investigation = await api.startInvestigation(parseInt(id, 10));
      setActiveStep(INVESTIGATION_STEPS.length);
      setResult(investigation);
      const report = await api.getInvestigationReport(investigation.id);
      setStageReport(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Investigation failed');
    } finally {
      setRunning(false);
    }
  };

  if (!alert) return <div className="loading">{error || 'Loading alert...'}</div>;

  return (
    <div>
      <header className="page-header">
        <div>
          <Link to="/alerts" className="link back-link">← Back to Alerts</Link>
          <h1>{alert.summary.alert_code || `Alert #${alert.summary.id}`}</h1>
          <p>{alert.summary.alert_type} — {alert.summary.reason}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowStartModal(true)}
          disabled={running || !isOpenAlert}
        >
          {running ? '🤖 Investigating...' : isOpenAlert ? '🤖 Start AI Investigation' : 'Investigation Already Run'}
        </button>
      </header>

      {showStartModal && (
        <InvestigationStartModal
          alertCode={alert.summary.alert_code || `ALT-${alert.summary.id}`}
          customerName={alert.customer?.name || 'Unknown'}
          alertType={alert.summary.alert_type}
          onConfirm={runAiInvestigation}
          onCancel={() => setShowStartModal(false)}
        />
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {!isOpenAlert && (
        <InfoNote variant="info" title="Investigation Locked">
          AI investigation can run only when alert status is <strong>Open</strong>. This alert is already in
          <strong> {alert.summary.status}</strong> status.
        </InfoNote>
      )}

      {running && <InvestigationProgress activeStep={activeStep} />}

      <div className="grid-2">
        <div className="card">
          <h2>Alert Summary</h2>
          <dl className="detail-list">
            <dt>Severity</dt><dd><span className={`badge badge-${alert.summary.severity.toLowerCase()}`}>{alert.summary.severity}</span></dd>
            <dt>Status</dt><dd>{alert.summary.status}</dd>
            <dt>Risk Score</dt>
            <dd>
              {alert.summary.risk_score}
              <InfoTooltip {...ALERT_RISK_HELP} />
            </dd>
            <dt>Triggered Rule</dt><dd>{alert.triggeredRule}</dd>
          </dl>
        </div>

        <div className="card">
          <h2>Customer</h2>
          {alert.customer && (
            <dl className="detail-list">
              <dt>Name</dt><dd>{alert.customer.name}</dd>
              <dt>ID</dt><dd>{alert.customer.customer_number}</dd>
              <dt>Occupation</dt><dd>{alert.customer.occupation || '—'}</dd>
              <dt>Country</dt><dd>{alert.customer.country || 'India'}</dd>
              <dt>Risk</dt>
              <dd>
                {alert.customer.risk_category} ({alert.customer.risk_score})
                <InfoTooltip {...CUSTOMER_RISK_HELP} />
              </dd>
              {alert.customer.is_pep && <dt>PEP</dt>}
              {alert.customer.is_pep && <dd><span className="badge badge-high">PEP Flagged</span></dd>}
            </dl>
          )}
        </div>
      </div>

      {alert.relatedTransaction && (
        <div className="card">
          <h2>Related Transaction</h2>
          <dl className="detail-list">
            <dt>Amount</dt><dd>₹{parseFloat(String(alert.relatedTransaction.amount)).toLocaleString('en-IN')}</dd>
            <dt>Type</dt><dd>{alert.relatedTransaction.transaction_type}</dd>
            <dt>Country</dt><dd>{alert.relatedTransaction.country || '—'}</dd>
            <dt>Date</dt><dd>{new Date(alert.relatedTransaction.transaction_date).toLocaleString()}</dd>
          </dl>
        </div>
      )}

      {!running && !result && (
        <InfoNote variant="info" title="Before you investigate">
          Click <strong>Start AI Investigation</strong> to see exactly what data sources and agents will be used
          to generate the report, risk score, and CLEAR / ESCALATE / SAR recommendation for this alert.
        </InfoNote>
      )}

      {result && (
        <div className="investigation-results">
          <PipelineMethodologyNote />

          <div className="card result-card">
            <h2>AI Investigation Complete</h2>
            <div className="decision-banner">
              <span className={`decision decision-${result.ai_decision?.toLowerCase()}`}>{result.ai_decision}</span>
              <span className="confidence">
                {result.confidence}% confidence
                <InfoTooltip {...CONFIDENCE_HELP} />
              </span>
            </div>
            <InfoNote variant="tip" title="What this means">
              {result.ai_decision === 'CLEAR' && (
                <>
                  {alert.summary.severity === 'Critical' || alert.summary.severity === 'High'
                    ? 'Rules engine flagged this as Critical, but AI found no PEP, sanctions, or adverse media concerns — likely a false positive. Safe to clear.'
                    : 'No significant risk indicators were found. This alert is likely a false positive and can be closed.'}
                </>
              )}
              {result.ai_decision === 'ESCALATE' && 'Multiple risk factors detected. A senior AML analyst should manually review before closing.'}
              {result.ai_decision === 'SAR' && 'Strong evidence of suspicious activity. A Suspicious Activity Report should be filed with the regulator.'}
              {!result.ai_decision && 'Review the stage progress below for detailed findings.'}
            </InfoNote>
          </div>

          {stageReport?.stages && stageReport.stages.length > 0 && (
            <div className="card">
              <div className="section-header-with-info">
                <h2>Investigation Stages</h2>
                <InfoTooltip title="Stage Progress" body="Underlying agents run internally, but results are grouped into three business stages." />
              </div>
              <StagePipeline stages={stageReport.stages} />
            </div>
          )}

          {result.report_summary && (
            <div className="card">
              <h2>Investigation Report</h2>
              <FormattedReport text={result.report_summary} />
            </div>
          )}

          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/investigations/${result.id}`)}>
            View Full Investigation →
          </button>
        </div>
      )}
    </div>
  );
}
