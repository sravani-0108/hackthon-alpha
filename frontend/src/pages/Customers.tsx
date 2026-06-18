import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Customer } from '../api/client';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.getCustomers().then(setCustomers);
  }, []);

  return (
    <div>
      <header className="page-header">
        <h1>Customers</h1>
        <p>Customer profiles and risk information</p>
      </header>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Occupation</th>
              <th>Country</th>
              <th>Risk Score</th>
              <th>Risk Category</th>
              <th>PEP</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.customer_number}</td>
                <td><Link to={`/customers/${c.id}`} className="link">{c.name}</Link></td>
                <td>{c.occupation || '—'}</td>
                <td>{c.country || 'India'}</td>
                <td>{c.risk_score}</td>
                <td><span className={`badge badge-${c.risk_category.toLowerCase()}`}>{c.risk_category}</span></td>
                <td>{c.is_pep ? '⚠️ Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
