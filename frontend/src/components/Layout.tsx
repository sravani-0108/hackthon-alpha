import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/alerts', label: 'Alerts' },
  { to: '/investigations', label: 'Investigations' },
  { to: '/cases', label: 'Cases' },
  { to: '/customers', label: 'Customers' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modeLabel, setModeLabel] = useState<string | null>(null);

  useEffect(() => {
    api.getSystemMode().then((m) => {
      setModeLabel(m.llmEnabled && m.screeningMode === 'live' ? 'Gemini · Live' : m.screeningMode === 'mock' ? 'Mock data' : 'Gemini');
    }).catch(() => setModeLabel(null));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🛡️</span>
          <div>
            <strong>AML Shield</strong>
            <small>AI Triage System{modeLabel ? ` · ${modeLabel}` : ''}</small>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.name}</strong>
            <small>{user?.role?.replace('_', ' ')}</small>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
