import { REPORT_BASIS_SUMMARY, INVESTIGATION_STEPS } from '../constants/investigationSteps';

interface InvestigationStartModalProps {
  alertCode: string;
  customerName: string;
  alertType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InvestigationStartModal({
  alertCode,
  customerName,
  alertType,
  onConfirm,
  onCancel,
}: InvestigationStartModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div className="modal-panel investigation-start-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="inv-modal-title">
        <div className="modal-header">
          <h2 id="inv-modal-title">Start AI Investigation</h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <p className="modal-intro">
            You are about to run an automated AML investigation for{' '}
            <strong>{alertCode}</strong> — <strong>{customerName}</strong> ({alertType}).
          </p>

          <div className="basis-block">
            <h3>{REPORT_BASIS_SUMMARY.title}</h3>
            <p>{REPORT_BASIS_SUMMARY.intro}</p>
          </div>

          <div className="basis-block">
            <h3>Data Sources Used</h3>
            <ul className="basis-list">
              {REPORT_BASIS_SUMMARY.dataSources.map((d) => (
                <li key={d.label}>
                  <strong>{d.label}</strong> — {d.detail}
                </li>
              ))}
            </ul>
          </div>

          <div className="basis-block">
            <h3>3 Investigation Stages</h3>
            <ol className="agent-steps-preview">
              {INVESTIGATION_STEPS.map((step, i) => (
                <li key={step.id}>
                  <span className="step-preview-icon">{step.icon}</span>
                  <div>
                    <strong>{i + 1}. {step.label}</strong>
                    <span>{step.basis}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="basis-block basis-grid">
            <div>
              <h3>Risk Score Calculation</h3>
              <ul className="basis-rules">
                {REPORT_BASIS_SUMMARY.scoring.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Final Decision Rules</h3>
              <ul className="basis-rules">
                {REPORT_BASIS_SUMMARY.decisions.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="modal-footer-note">
            The report is generated automatically from the above rules. No manual input is required.
            Results are stored for audit and can be reviewed by a compliance officer.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Run Investigation</button>
        </div>
      </div>
    </div>
  );
}

interface InvestigationProgressProps {
  activeStep: number;
}

export function InvestigationProgress({ activeStep }: InvestigationProgressProps) {
  return (
    <div className="card investigation-progress-card">
      <h2>🤖 AI Investigation In Progress...</h2>
      <p className="progress-intro">
        Running the AML workflow through three business stages: internal analysis, external screening, and final investigation decision.
      </p>
      <ol className="progress-steps">
        {INVESTIGATION_STEPS.map((step, i) => {
          const status = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending';
          return (
            <li key={step.id} className={`progress-step progress-step-${status}`}>
              <span className="progress-step-icon">{status === 'done' ? '✓' : step.icon}</span>
              <div className="progress-step-text">
                <strong>{step.label}</strong>
                <span>{step.basis}</span>
              </div>
              {status === 'active' && <span className="progress-spinner" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
