import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Case } from '../api/client';
import { caseStatusBadgeClass, formatCaseStatus } from '../utils/caseStatus';

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api.getCases(showAll ? { includeClosed: 'true' } : undefined).then(setCases);
  }, [showAll]);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Case Management</h1>
          <p>Escalated alerts after AI investigation (ESCALATE / SAR) — not open alerts</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Hide closed' : 'Show all cases'}
        </button>
      </header>

      <div className="card">
        {cases.length === 0 ? (
          <p className="empty-state">No active cases. Run AI investigations on alerts; cases appear when the AI recommends ESCALATE or SAR.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Customer</th>
                <th>AI decision</th>
                <th>Priority</th>
                <th>Case status</th>
                <th>Alert status</th>
                <th>Summary</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`} className="link">{c.case_number}</Link></td>
                  <td>{c.customer?.name || '—'}</td>
                  <td>{c.investigation?.ai_decision || '—'}</td>
                  <td><span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                  <td>
                    <span className={`badge ${caseStatusBadgeClass(c.status)}`}>
                      {formatCaseStatus(c.status)}
                    </span>
                  </td>
                  <td>{c.alert?.status || '—'}</td>
                  <td className="truncate">{c.summary || '—'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
