import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { InvestigationReport } from '../api/client';
import { StagePipeline, FormattedReport, PipelineMethodologyNote } from '../components/InvestigationReportView';
import { InfoTooltip, InfoNote } from '../components/InfoTooltip';
import { DECISION_HELP, CONFIDENCE_HELP } from '../constants/investigationHelp';

export default function InvestigationDetail() {
  const { id } = useParams();
  const [report, setReport] = useState<InvestigationReport | null>(null);

  useEffect(() => {
    if (id) api.getInvestigationReport(parseInt(id, 10)).then(setReport);
  }, [id]);

  if (!report) return <div className="loading">Loading investigation report...</div>;

  return (
    <div>
      <header className="page-header">
        <Link to="/investigations" className="link back-link">← Back to Investigations</Link>
        <h1>Investigation #{report.investigationId}</h1>
        <p>Alert #{report.alertId} · Status: {report.investigationStatus}</p>
        <div className="decision-banner">
          <span className={`decision decision-${report.finalDecision?.toLowerCase()}`}>{report.finalDecision}</span>
          <span className="confidence">
            {report.confidenceScore}% confidence
            <InfoTooltip {...CONFIDENCE_HELP} />
          </span>
          <InfoTooltip {...DECISION_HELP} size="md" />
        </div>
      </header>

      <PipelineMethodologyNote />

      <InfoNote variant="tip" title="Reading the results">
        Hover or click the <strong>ⓘ</strong> icon on any agent card to see exactly what data was checked and how scores were calculated.
        The overall risk score is a weighted sum of transaction, PEP, media, sanctions, and customer profile factors.
      </InfoNote>

      <div className="card">
        <div className="section-header-with-info">
          <h2>Investigation Stages</h2>
          <InfoTooltip title="Stage Progress" body="Underlying agents run in sequence, but results are grouped into three business stages for investigation review." rules={['Internal Data Analysis', 'External Screening', 'Investigation & Decision']} />
        </div>
        <StagePipeline stages={report.stages} />
      </div>

      <div className="card">
        <h2>Full Investigation Report</h2>
        <FormattedReport text={report.report} />
      </div>
    </div>
  );
}
