import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { isFirebaseConfigured } from './firebase';
import Layout from './components/Layout';
import { Spinner } from './components/ui';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import Stations from './pages/student/Stations';
import StationDetail from './pages/student/StationDetail';
import ActiveRide from './pages/student/ActiveRide';
import History from './pages/student/History';
import Wallet from './pages/student/Wallet';
import ReportIssue from './pages/student/ReportIssue';

import Dashboard from './pages/admin/Dashboard';
import AdminStations from './pages/admin/AdminStations';
import AdminBikes from './pages/admin/AdminBikes';
import AdminPlans from './pages/admin/AdminPlans';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRides from './pages/admin/AdminRides';
import AdminIssues from './pages/admin/AdminIssues';

function RequireRole({ role, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner className="py-32" />;
  if (!profile) return <Navigate to="/login" replace />;
  if (role && profile.role !== role) return <Navigate to={profile.role === 'admin' ? '/admin' : '/stations'} replace />;
  return <Layout>{children}</Layout>;
}

function GuestOnly({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner className="py-32" />;
  if (profile) return <Navigate to={profile.role === 'admin' ? '/admin' : '/stations'} replace />;
  return children;
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto mt-24 max-w-lg card">
        <h1 className="mb-2 text-xl font-bold">Firebase is not configured</h1>
        <p className="text-sm text-slate-600">
          Copy your Firebase web app config into <code className="rounded bg-slate-100 px-1">client/.env</code>{' '}
          (see <code className="rounded bg-slate-100 px-1">.env.example</code>) and restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  const S = (el) => <RequireRole role="student">{el}</RequireRole>;
  const A = (el) => <RequireRole role="admin">{el}</RequireRole>;

  return (
    <Routes>
      <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route path="/stations" element={S(<Stations />)} />
      <Route path="/stations/:id" element={S(<StationDetail />)} />
      <Route path="/ride" element={S(<ActiveRide />)} />
      <Route path="/history" element={S(<History />)} />
      <Route path="/wallet" element={S(<Wallet />)} />
      <Route path="/report" element={S(<ReportIssue />)} />

      <Route path="/admin" element={A(<Dashboard />)} />
      <Route path="/admin/stations" element={A(<AdminStations />)} />
      <Route path="/admin/bikes" element={A(<AdminBikes />)} />
      <Route path="/admin/plans" element={A(<AdminPlans />)} />
      <Route path="/admin/users" element={A(<AdminUsers />)} />
      <Route path="/admin/rides" element={A(<AdminRides />)} />
      <Route path="/admin/issues" element={A(<AdminIssues />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
