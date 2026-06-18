import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { CustomerDetail } from '../api/client';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    if (id) api.getCustomer(parseInt(id, 10)).then(setCustomer);
  }, [id]);

  if (!customer) return <div className="loading">Loading customer...</div>;

  return (
    <div>
      <header className="page-header">
        <Link to="/customers" className="link back-link">← Back to Customers</Link>
        <h1>{customer.profile.name}</h1>
        <p>{customer.profile.customer_number}</p>
      </header>

      <div className="grid-2">
        <div className="card">
          <h2>Profile</h2>
          <dl className="detail-list">
            <dt>Occupation</dt><dd>{customer.profile.occupation || '—'}</dd>
            <dt>Country</dt><dd>{customer.profile.country || 'India'}</dd>
            <dt>Risk</dt><dd>{customer.riskInformation.risk_category} ({customer.riskInformation.risk_score})</dd>
            <dt>Open Alerts</dt><dd>{customer.alertCount.open} / {customer.alertCount.total}</dd>
          </dl>
        </div>
        <div className="card">
          <h2>Accounts</h2>
          {customer.accounts.map((a) => (
            <div key={a.id} className="account-row">
              <strong>{a.account_number}</strong>
              <span>{a.account_type}</span>
              <span>₹{parseFloat(String(a.balance)).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Transactions</h2>
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Amount</th><th>Country</th></tr>
          </thead>
          <tbody>
            {customer.recentTransactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.transaction_date).toLocaleString()}</td>
                <td>{t.transaction_type}</td>
                <td>₹{parseFloat(String(t.amount)).toLocaleString('en-IN')}</td>
                <td>{t.country || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
