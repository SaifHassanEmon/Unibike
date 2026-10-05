import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taka } from '../api';

const STUDENT_LINKS = [
  { to: '/stations', label: 'Stations', icon: '📍' },
  { to: '/ride', label: 'My Ride', icon: '🚲' },
  { to: '/history', label: 'History', icon: '🕘' },
  { to: '/wallet', label: 'Wallet', icon: '💳' },
  { to: '/report', label: 'Report Issue', icon: '🛠️' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/stations', label: 'Stations', icon: '📍' },
  { to: '/admin/bikes', label: 'Bikes', icon: '🚲' },
  { to: '/admin/plans', label: 'Plans', icon: '🏷️' },
  { to: '/admin/rides', label: 'Rides', icon: '🛣️' },
  { to: '/admin/users', label: 'Students', icon: '👥' },
  { to: '/admin/issues', label: 'Issues', icon: '🛠️' },
];

export default function Layout({ children }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = profile.role === 'admin' ? ADMIN_LINKS : STUDENT_LINKS;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-100 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6 text-xl font-bold">
          🚲 <span>Uni<span className="text-brand-500">Bike</span></span>
        </div>
        <nav className="space-y-1 p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <button className="text-2xl md:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="hidden text-sm text-slate-500 md:block">
            {profile.role === 'admin' ? 'Admin Panel' : 'Campus Bike Sharing'}
          </div>
          <div className="flex items-center gap-4">
            {profile.role === 'student' && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
                {taka(profile.walletBalance)}
              </span>
            )}
            <div className="text-right">
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.role === 'admin' ? 'Administrator' : profile.studentId}</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary !px-3 !py-1.5">Logout</button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
