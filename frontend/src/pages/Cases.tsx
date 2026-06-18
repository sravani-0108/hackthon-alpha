import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Case } from '../api/client';

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    api.getCases().then(setCases);
  }, []);

  return (
    <div>
      <header className="page-header">
        <h1>Case Management</h1>
        <p>Escalated cases requiring human review</p>
      </header>

      <div className="card">
        {cases.length === 0 ? (
          <p className="empty-state">No cases yet. Run AI investigations on alerts to generate cases.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Customer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`} className="link">{c.case_number}</Link></td>
                  <td>{c.customer?.name || '—'}</td>
                  <td><span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                  <td>{c.status}</td>
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
