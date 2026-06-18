import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardStats } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>AML monitoring overview and recent activity</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Alerts</span>
          <span className="stat-value">{stats.totalAlerts}</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-label">Open Alerts</span>
          <span className="stat-value">{stats.openAlerts}</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">High Risk</span>
          <span className="stat-value">{stats.highRisk}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Customers</span>
          <span className="stat-value">{stats.totalCustomers}</span>
        </div>
      </div>

      <section className="card">
        <h2>All Alerts</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Customer</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentAlerts || []).map((alert) => (
              <tr key={alert.id}>
                <td>{alert.alert_code || `#${alert.id}`}</td>
                <td>{alert.alert_type}</td>
                <td>{alert.customer?.name || '—'}</td>
                <td><span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                <td>{alert.status}</td>
                <td><Link to={`/alerts/${alert.id}`} className="link">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
