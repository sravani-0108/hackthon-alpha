import type { ReactNode } from 'react';
import { InfoTooltip, InfoNote } from './InfoTooltip';
import {
  AGENT_HELP,
  OVERALL_RISK_HELP,
  DECISION_HELP,
  CONFIDENCE_HELP,
  PIPELINE_HELP,
} from '../constants/investigationHelp';

function fmt(n: unknown): string {
  const num = Number(n);
  if (Number.isNaN(num)) return String(n ?? '—');
  return `₹${num.toLocaleString('en-IN')}`;
}

function Row({ label, value, highlight }: { label: string; value: ReactNode; highlight?: boolean }) {
  return (
    <div className={`result-row${highlight ? ' highlight' : ''}`}>
      <span className="result-label">{label}</span>
      <span className="result-value">{value ?? '—'}</span>
    </div>
  );
}

function StatusPill({ ok, yesLabel, noLabel }: { ok: boolean; yesLabel: string; noLabel: string }) {
  return (
    <span className={`status-pill ${ok ? 'status-danger' : 'status-ok'}`}>
      {ok ? yesLabel : noLabel}
    </span>
  );
}

function AgentCard({
  icon,
  title,
  helpKey,
  children,
}: {
  icon: string;
  title: string;
  helpKey?: string;
  children: ReactNode;
}) {
  const help = helpKey ? AGENT_HELP[helpKey] : undefined;
  return (
    <div className="agent-result-card">
      <div className="agent-result-header">
        <span className="agent-icon">{icon}</span>
        <h3>{title}</h3>
        {help && <InfoTooltip title={help.title} body={help.body} rules={help.rules} align="end" />}
      </div>
      <div className="agent-result-body">{children}</div>
    </div>
  );
}

function CustomerAnalysis({ data }: { data: Record<string, unknown> }) {
  return (
    <AgentCard icon="👤" title="Customer Profile Analysis" helpKey="customer_analysis">
      <Row label="Customer" value={String(data.customerName)} />
      <Row label="Risk Category" value={<span className={`badge badge-${String(data.customerRisk).toLowerCase()}`}>{String(data.customerRisk)}</span>} />
      <Row label="Risk Score" value={String(data.riskScore)} />
      <Row label="Country" value={String(data.country)} />
      <Row label="Occupation" value={String(data.occupation)} />
      <Row label="Account Age" value={`${data.accountAgeDays} days`} />
      <Row label="Accounts" value={String(data.accountCount)} />
      <Row label="Total Balance" value={fmt(data.totalBalance)} />
      <Row label="PEP Status" value={<StatusPill ok={!!data.isPep} yesLabel="PEP Match" noLabel="Not PEP" />} highlight={!!data.isPep} />
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function TransactionAnalysis({ data }: { data: Record<string, unknown> }) {
  const recent = (data.recentTransactions as Array<Record<string, unknown>>) || [];
  return (
    <AgentCard icon="💳" title="Transaction Analysis" helpKey="transaction_analysis">
      <Row label="Current Transfer" value={fmt(data.currentTransfer)} highlight />
      {data.triggerAccountNumber != null && (
        <Row label="Trigger Account" value={String(data.triggerAccountNumber)} />
      )}
      {data.dataVerified === false && (
        <Row label="Data Check" value={<span className="status-pill status-danger">Account mismatch</span>} highlight />
      )}
      <Row label="Monthly Average" value={fmt(data.usualMonthlyAverage)} />
      <Row label="Spike Multiplier" value={`${data.spikeMultiplier}x`} highlight={Number(data.spikeMultiplier) >= 3} />
      <Row label="Risk Level" value={<span className={`badge badge-${String(data.risk).toLowerCase()}`}>{String(data.risk)}</span>} />
      <Row label="Velocity Pattern" value={String(data.velocityPattern)} />
      <Row label="30-Day Txn Count" value={String(data.transactionCount30Days)} />
      {recent.length > 0 && (
        <div className="mini-table-wrap">
          <p className="result-subheading">Recent Transactions</p>
          <table className="mini-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Country</th></tr></thead>
            <tbody>
              {recent.map((t, i) => (
                <tr key={i}>
                  <td>{new Date(String(t.date)).toLocaleDateString()}</td>
                  <td>{String(t.type)}</td>
                  <td>{fmt(t.amount)}</td>
                  <td>{String(t.country || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function SanctionsCheck({ data }: { data: Record<string, unknown> }) {
  const matched = (data.matchedLists as string[]) || [];
  const checked = (data.checkedLists as string[]) || [];
  return (
    <AgentCard icon="🚫" title="Sanctions Screening" helpKey="sanctions_check">
      <Row label="Sanction Match" value={<StatusPill ok={!!data.sanctionMatch} yesLabel="MATCH FOUND" noLabel="No Match" />} highlight={!!data.sanctionMatch} />
      <Row label="High-Risk Country Txns" value={String(data.highRiskCountryTransactions)} />
      {matched.length > 0 && (
        <div className="tag-list">
          <span className="result-subheading">Matched Lists</span>
          {matched.map((l) => <span key={l} className="tag tag-danger">{l}</span>)}
        </div>
      )}
      <div className="tag-list">
        <span className="result-subheading">Lists Checked</span>
        {checked.map((l) => <span key={l} className="tag">{l}</span>)}
      </div>
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function PepCheck({ data }: { data: Record<string, unknown> }) {
  const details = data.pepDetails as Record<string, string> | null;
  const checked = (data.checkedDatabases as string[]) || [];
  return (
    <AgentCard icon="🏛️" title="PEP Screening" helpKey="pep_check">
      <Row label="PEP Match" value={<StatusPill ok={!!data.pepMatch} yesLabel="PEP MATCH" noLabel="No Match" />} highlight={!!data.pepMatch} />
      {details && (
        <>
          <Row label="Position" value={details.position} />
          <Row label="Source" value={details.source} />
        </>
      )}
      <div className="tag-list">
        <span className="result-subheading">Databases Checked</span>
        {checked.map((d) => <span key={d} className="tag">{d}</span>)}
      </div>
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function MediaAnalysis({ data }: { data: Record<string, unknown> }) {
  const articles = (data.articles as Array<{ title: string; source: string; date: string }>) || [];
  const searchFailed = data.searchStatus === 'failed' || data.source === 'unavailable';
  const negativeLabel = searchFailed ? 'Search Failed' : 'None Found';
  const negativeOk = searchFailed ? false : !!data.negativeNews;

  return (
    <AgentCard icon="📰" title="Adverse Media Analysis" helpKey="media_analysis">
      <Row
        label="Negative News"
        value={
          <StatusPill
            ok={negativeOk}
            yesLabel="Found"
            noLabel={negativeLabel}
          />
        }
        highlight={!!data.negativeNews}
      />
      <Row label="Articles Found" value={String(data.articleCount)} />
      <Row label="Source" value={searchFailed ? 'Google Search (unavailable)' : 'Google Search'} />
      {articles.length > 0 && (
        <div className="article-list">
          {articles.map((a, i) => (
            <div key={i} className="article-item">
              <strong>{a.title}</strong>
              <span>{a.source} · {a.date}</span>
            </div>
          ))}
        </div>
      )}
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function InvestigationSynthesis({ data }: { data: Record<string, unknown> }) {
  const factors = (data.riskFactors as string[]) || [];
  const score = Number(data.overallRiskScore) || 0;
  return (
    <AgentCard icon="🔍" title="Investigation Synthesis" helpKey="investigation">
      <div className="risk-score-bar">
        <div className="risk-score-label">
          <span>
            Overall Risk Score
            <InfoTooltip {...OVERALL_RISK_HELP} />
          </span>
          <strong>{score}/100</strong>
        </div>
        <div className="risk-bar-track">
          <div className="risk-bar-fill" style={{ width: `${score}%`, background: score >= 70 ? 'var(--danger)' : score >= 40 ? 'var(--warning)' : 'var(--success)' }} />
        </div>
      </div>
      <Row label="Transaction Risk" value={String(data.transactionRisk)} />
      <Row label="Customer Risk" value={String(data.customerRisk)} />
      <Row label="PEP Match" value={data.pepMatch ? 'Yes' : 'No'} />
      <Row label="Adverse Media" value={data.negativeMedia ? 'Yes' : 'No'} />
      <Row label="Sanctions Match" value={data.sanctionMatch ? 'Yes' : 'No'} />
      {factors.length > 0 && (
        <div className="tag-list">
          <span className="result-subheading">Risk Factors</span>
          {factors.map((f) => <span key={f} className="tag tag-warning">{f}</span>)}
        </div>
      )}
      <p className="agent-summary">{String(data.summary)}</p>
    </AgentCard>
  );
}

function DecisionView({ data }: { data: Record<string, unknown> }) {
  const reasoning = (data.reasoning as string[]) || [];
  return (
    <AgentCard icon="⚖️" title="AI Decision" helpKey="decision">
      <div className="decision-box">
        <span className={`decision decision-${String(data.decision).toLowerCase()}`}>{String(data.decision)}</span>
        <span className="confidence">
          {String(data.confidence)}% confidence
          <InfoTooltip {...CONFIDENCE_HELP} />
        </span>
      </div>
      {reasoning.length > 0 && (
        <ul className="reasoning-list">
          {reasoning.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </AgentCard>
  );
}

function ReportSummary({ data }: { data: Record<string, unknown> }) {
  const fullReport = String(data.fullReport || data.summary || '');
  return (
    <AgentCard icon="📋" title="Investigation Report" helpKey="report">
      <FormattedReport text={fullReport} />
    </AgentCard>
  );
}

const AGENT_META: Record<string, { icon: string; label: string; order: number }> = {
  customer_analysis: { icon: '👤', label: 'Customer Profile', order: 1 },
  transaction_analysis: { icon: '💳', label: 'Transaction Analysis', order: 2 },
  sanctions_check: { icon: '🚫', label: 'Sanctions Screening', order: 3 },
  pep_check: { icon: '🏛️', label: 'PEP Screening', order: 4 },
  media_analysis: { icon: '📰', label: 'Adverse Media', order: 5 },
  investigation: { icon: '🔍', label: 'Risk Synthesis', order: 6 },
  decision: { icon: '⚖️', label: 'Final Decision', order: 7 },
  report: { icon: '📋', label: 'Report Generated', order: 8 },
};

export function AgentResultView({ agentType, result }: { agentType: string; result: Record<string, unknown> }) {
  switch (agentType) {
    case 'customer_analysis': return <CustomerAnalysis data={result} />;
    case 'transaction_analysis': return <TransactionAnalysis data={result} />;
    case 'sanctions_check': return <SanctionsCheck data={result} />;
    case 'pep_check': return <PepCheck data={result} />;
    case 'media_analysis': return <MediaAnalysis data={result} />;
    case 'investigation': return <InvestigationSynthesis data={result} />;
    case 'decision': return <DecisionView data={result} />;
    case 'report': return <ReportSummary data={result} />;
    default: return <AgentCard icon="🤖" title={agentType.replace(/_/g, ' ')}><p className="agent-summary">{JSON.stringify(result)}</p></AgentCard>;
  }
}

export function PipelineMethodologyNote() {
  return (
    <InfoNote title="How the AI Pipeline Works" variant="info">
      <p>{PIPELINE_HELP.body}</p>
      <ul className="methodology-list">
        {PIPELINE_HELP.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="methodology-footer">
        <strong>Decision thresholds:</strong> CLEAR (score &lt; 40) · ESCALATE (40–69 or PEP/media flags) · SAR (≥ 70 or sanctions match)
        <InfoTooltip {...DECISION_HELP} size="md" />
      </p>
    </InfoNote>
  );
}

export function AgentPipeline({ results }: { results: Array<{ agent?: string; agent_type?: string; result: Record<string, unknown> }> }) {
  const sorted = [...results].sort((a, b) => {
    const keyA = a.agent || a.agent_type || '';
    const keyB = b.agent || b.agent_type || '';
    return (AGENT_META[keyA]?.order ?? 99) - (AGENT_META[keyB]?.order ?? 99);
  });

  return (
    <div className="pipeline-timeline">
      {sorted.map((ar, i) => {
        const key = ar.agent || ar.agent_type || '';
        const meta = AGENT_META[key];
        return (
          <div key={i} className="pipeline-item">
            <div className="pipeline-connector">
              <div className="pipeline-dot">{meta?.icon || i + 1}</div>
              {i < sorted.length - 1 && <div className="pipeline-line" />}
            </div>
            <div className="pipeline-content">
              <AgentResultView agentType={key} result={ar.result} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export function StagePipeline({
  stages,
}: {
  stages: Array<{ name: string; status: StageStatus; summary: string }>;
}) {
  const statusIcon: Record<StageStatus, string> = {
    NOT_STARTED: '○',
    IN_PROGRESS: '⏳',
    COMPLETED: '✓',
    FAILED: '✕',
  };

  return (
    <div className="pipeline-timeline">
      {stages.map((stage, i) => (
        <div key={stage.name} className="pipeline-item">
          <div className="pipeline-connector">
            <div className="pipeline-dot">{statusIcon[stage.status]}</div>
            {i < stages.length - 1 && <div className="pipeline-line" />}
          </div>
          <div className="pipeline-content">
            <div className="agent-result-card">
              <div className="agent-result-header">
                <h3>{stage.name}</h3>
                <span className={`status-pill ${stage.status === 'FAILED' ? 'status-danger' : stage.status === 'COMPLETED' ? 'status-ok' : ''}`}>
                  {stage.status.replace('_', ' ')}
                </span>
              </div>
              <div className="agent-result-body">
                <p className="agent-summary">{stage.summary || 'No summary available yet.'}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormattedReport({ text }: { text: string }) {
  if (!text) return null;

  const sections = text.split(/\n(?=---|\===)/).filter(Boolean);

  return (
    <div className="formatted-report">
      {sections.map((section, i) => {
        const lines = section.trim().split('\n').filter(Boolean);
        const titleLine = lines[0]?.replace(/^[-=]+\s*/, '').replace(/\s*[-=]+$/, '').trim();
        const isMainTitle = lines[0]?.startsWith('===');
        const bodyLines = isMainTitle ? lines.slice(1) : lines.slice(titleLine && lines[0].startsWith('---') ? 1 : 0);

        if (isMainTitle) {
          return (
            <div key={i} className="report-main-title">
              <h2>{titleLine || 'AML Investigation Report'}</h2>
            </div>
          );
        }

        if (lines[0]?.startsWith('---')) {
          return (
            <div key={i} className="report-section">
              <h3>{titleLine}</h3>
              <div className="report-section-body">
                {bodyLines.map((line, j) => {
                  if (line.startsWith('RECOMMENDATION:')) {
                    const rec = line.replace('RECOMMENDATION:', '').trim();
                    const isClear = rec.toLowerCase().includes('clear');
                    const isSar = rec.toLowerCase().includes('sar');
                    return (
                      <div key={j} className={`recommendation-box ${isSar ? 'rec-sar' : isClear ? 'rec-clear' : 'rec-escalate'}`}>
                        <strong>Recommendation</strong>
                        <p>{rec}</p>
                      </div>
                    );
                  }
                  if (line.includes(':')) {
                    const [k, ...rest] = line.split(':');
                    return <Row key={j} label={k.trim()} value={rest.join(':').trim()} />;
                  }
                  return <p key={j} className="report-line">{line}</p>;
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="report-section">
            {bodyLines.map((line, j) => {
              if (line.includes(':') && !line.startsWith(' ')) {
                const [k, ...rest] = line.split(':');
                return <Row key={j} label={k.trim()} value={rest.join(':').trim()} />;
              }
              return <p key={j} className="report-line">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
