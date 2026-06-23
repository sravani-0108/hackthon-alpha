import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardStats } from '../api/client';

const quickLinks = [
  { to: '/alerts', label: 'Review open alerts', desc: 'Triage new suspicious activity' },
  { to: '/investigations', label: 'Investigations', desc: 'View all AI investigation reports' },
  { to: '/cases', label: 'Case queue', desc: 'Escalated cases needing review' },
  { to: '/customers', label: 'Customer profiles', desc: 'KYC and risk overview' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  const severityTotal =
    stats.severityBreakdown.critical +
    stats.severityBreakdown.high +
    stats.severityBreakdown.medium +
    stats.severityBreakdown.low;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>AML operations overview — use Alerts for the full alert list</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card warning">
          <span className="stat-label">Open alerts</span>
          <span className="stat-value">{stats.openAlerts}</span>
          <span className="stat-hint">Need triage</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-label">High / critical</span>
          <span className="stat-value">{stats.highRisk}</span>
          <span className="stat-hint">Across all alerts</span>
        </div>
        <div className="stat-card primary">
          <span className="stat-label">Investigations</span>
          <span className="stat-value">{stats.totalInvestigations}</span>
          <span className="stat-hint">
            {stats.inProgressInvestigations > 0
              ? `${stats.inProgressInvestigations} running now`
              : 'All AI reviews'}
          </span>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Active cases</span>
          <span className="stat-value">{stats.activeCases}</span>
          <span className="stat-hint">Escalated queue</span>
        </div>
        <div className="stat-card escalated">
          <span className="stat-label">Escalated alerts</span>
          <span className="stat-value">{stats.escalatedAlerts}</span>
          <span className="stat-hint">Post-investigation</span>
        </div>
        <div className="stat-card success">
          <span className="stat-label">Customers</span>
          <span className="stat-value">{stats.totalCustomers}</span>
          <span className="stat-hint">Monitored profiles</span>
        </div>
      </div>

      <div className="grid-2 dashboard-panels">
        <section className="card">
          <h2>Alert severity mix</h2>
          <p className="section-desc">{stats.totalAlerts} total alerts in the system</p>
          <div className="severity-bars">
            {(
              [
                { key: 'critical', label: 'Critical', count: stats.severityBreakdown.critical, className: 'badge-critical' },
                { key: 'high', label: 'High', count: stats.severityBreakdown.high, className: 'badge-high' },
                { key: 'medium', label: 'Medium', count: stats.severityBreakdown.medium, className: 'badge-medium' },
                { key: 'low', label: 'Low', count: stats.severityBreakdown.low, className: 'badge-low' },
              ] as const
            ).map((row) => (
              <div key={row.key} className="severity-row">
                <div className="severity-row-head">
                  <span className={`badge ${row.className}`}>{row.label}</span>
                  <span>{row.count}</span>
                </div>
                <div className="severity-track">
                  <div
                    className={`severity-fill ${row.className}`}
                    style={{ width: severityTotal ? `${(row.count / severityTotal) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Quick actions</h2>
          <ul className="quick-links">
            {quickLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="quick-link">
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="section-header-row">
          <div>
            <h2>Open alerts — needs attention</h2>
            <p className="section-desc">Latest 5 open alerts only. Full list is on the Alerts page.</p>
          </div>
          <Link to="/alerts" className="btn btn-secondary">View all alerts →</Link>
        </div>

        {stats.recentOpenAlerts.length === 0 ? (
          <p className="empty-state">No open alerts right now.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Severity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOpenAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.alert_code || `ALT-${alert.id}`}</td>
                  <td>{alert.alert_type}</td>
                  <td>{alert.customer?.name || '—'}</td>
                  <td>
                    <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                  </td>
                  <td>
                    <Link to={`/alerts/${alert.id}`} className="btn btn-sm btn-primary">Investigate</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
