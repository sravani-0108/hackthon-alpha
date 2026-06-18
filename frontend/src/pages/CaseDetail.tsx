import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CaseDetail } from '../api/client';
import { FormattedReport } from '../components/InvestigationReportView';

export default function CaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState('');

  const loadCase = useCallback(async () => {
    if (!id) return;
    const data = await api.getCase(parseInt(id, 10));
    setCaseData(data);
  }, [id]);

  useEffect(() => {
    loadCase().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load case'));
  }, [loadCase]);

  const investigationId = caseData?.investigation_id ?? caseData?.investigation?.id;
  const alertId = caseData?.alert_id ?? caseData?.alert?.id;
  const aiDecision = caseData?.investigation?.ai_decision;

  if (!caseData) return <div className="loading">{error || 'Loading case...'}</div>;

  return (
    <div>
      <header className="page-header">
        <div>
          <Link to="/cases" className="link back-link">← Back to Cases</Link>
          <h1>{caseData.case_number}</h1>
          <p>
            <span className={`badge badge-${caseData.priority.toLowerCase()}`}>{caseData.priority}</span>
            {' '}{caseData.status}
            {aiDecision && (
              <> · AI recommendation: <strong>{aiDecision}</strong></>
            )}
          </p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <h2>Links</h2>
          <dl className="detail-list">
            {investigationId && (
              <>
                <dt>Investigation</dt>
                <dd><Link to={`/investigations/${investigationId}`} className="link">View investigation #{investigationId}</Link></dd>
              </>
            )}
            {alertId && (
              <>
                <dt>Alert</dt>
                <dd><Link to={`/alerts/${alertId}`} className="link">View alert #{alertId}</Link></dd>
              </>
            )}
            {caseData.investigation?.confidence != null && (
              <>
                <dt>AI Confidence</dt>
                <dd>{caseData.investigation.confidence}%</dd>
              </>
            )}
          </dl>
        </div>

        {caseData.customer && (
          <div className="card">
            <h2>Customer</h2>
            <dl className="detail-list">
              <dt>Name</dt><dd>{caseData.customer.name}</dd>
              <dt>ID</dt><dd>{caseData.customer.customer_number}</dd>
              <dt>Country</dt><dd>{caseData.customer.country || '—'}</dd>
              <dt>Risk</dt><dd>{caseData.customer.risk_category} ({caseData.customer.risk_score})</dd>
            </dl>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Case Summary</h2>
        {caseData.summary ? <FormattedReport text={caseData.summary} /> : <p>No summary available.</p>}
      </div>

      {caseData.sarReports && caseData.sarReports.length > 0 && (
        <div className="card">
          <h2>SAR Reports</h2>
          {caseData.sarReports.map((sar) => (
            <div key={sar.id} className="article-item">
              <strong>{sar.report_number}</strong> — {sar.status}
              <p>{sar.narrative}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
