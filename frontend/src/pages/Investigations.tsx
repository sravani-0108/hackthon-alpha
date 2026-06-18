import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Investigation } from '../api/client';

export default function Investigations() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  useEffect(() => {
    api.getInvestigations().then(setInvestigations);
  }, []);

  return (
    <div>
      <header className="page-header">
        <h1>Investigations</h1>
        <p>AI and manual AML investigations</p>
      </header>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Alert</th>
              <th>Customer</th>
              <th>Status</th>
              <th>AI Decision</th>
              <th>Confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {investigations.map((inv) => (
              <tr key={inv.id}>
                <td>#{inv.id}</td>
                <td>{inv.alert?.alert_type || inv.alert_id}</td>
                <td>{inv.alert?.customer?.name || '—'}</td>
                <td>{inv.status}</td>
                <td>
                  {inv.ai_decision ? (
                    <span className={`badge badge-${inv.ai_decision.toLowerCase()}`}>{inv.ai_decision}</span>
                  ) : '—'}
                </td>
                <td>{inv.confidence ? `${inv.confidence}%` : '—'}</td>
                <td><Link to={`/investigations/${inv.id}`} className="link">View Report</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
