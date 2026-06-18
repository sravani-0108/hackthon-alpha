import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Alert } from '../api/client';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAlerts().then(setAlerts).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading alerts...</div>;

  return (
    <div>
      <header className="page-header">
        <h1>AML Alerts</h1>
        <p>Review and triage suspicious activity alerts</p>
      </header>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Customer</th>
              <th>Risk Score</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td><strong>{alert.alert_code || `ALT-${alert.id}`}</strong></td>
                <td>{alert.alert_type}</td>
                <td>{alert.reason || '—'}</td>
                <td>{alert.customer?.name || '—'}</td>
                <td>{alert.risk_score}</td>
                <td><span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                <td>{alert.status}</td>
                <td>{new Date(alert.created_at).toLocaleDateString()}</td>
                <td><Link to={`/alerts/${alert.id}`} className="btn btn-sm btn-primary">Investigate</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
