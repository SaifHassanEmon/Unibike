import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, taka } from '../../api';
import { PageHeader, Spinner, StatCard } from '../../components/ui';

export default function Dashboard() {
  const [s, setS] = useState(null);

  useEffect(() => {
    api('/admin/stats').then(setS).catch((e) => toast.error(e.message));
  }, []);

  if (!s) return <Spinner />;
  const maxRides = Math.max(1, ...s.week.map((d) => d.rides));
  const maxRev = Math.max(1, ...s.week.map((d) => d.revenue));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of the UniBike system" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bikes" value={s.bikes.total} icon="🚲" />
        <StatCard label="Active rides" value={s.activeRides} icon="🛣️" tone="blue" />
        <StatCard label="Revenue today" value={taka(s.revenueToday)} icon="💰" tone="purple" />
        <StatCard label="Open issues" value={s.openIssues} icon="🛠️" tone="red" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Available" value={s.bikes.available || 0} color="bg-emerald-500" total={s.bikes.total} />
        <MiniStat label="In use" value={s.bikes.in_use || 0} color="bg-blue-500" total={s.bikes.total} />
        <MiniStat label="Maintenance" value={s.bikes.maintenance || 0} color="bg-amber-500" total={s.bikes.total} />
        <div className="card flex justify-around text-center">
          <div><p className="text-2xl font-bold">{s.stations}</p><p className="text-xs text-slate-500">Stations</p></div>
          <div><p className="text-2xl font-bold">{s.students}</p><p className="text-xs text-slate-500">Students</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold">Last 7 days</h3>
          <div className="flex h-56 items-end gap-3">
            {s.week.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div title={`${d.rides} rides`} className="w-1/2 rounded-t bg-brand-500" style={{ height: `${(d.rides / maxRides) * 100}%` }} />
                  <div title={taka(d.revenue)} className="w-1/2 rounded-t bg-purple-400" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-brand-500" /> Rides</span>
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-purple-400" /> Revenue</span>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold">Busiest stations (7 days)</h3>
          {s.topStations.length === 0 ? (
            <p className="text-sm text-slate-500">No rides yet.</p>
          ) : (
            <ul className="space-y-3">
              {s.topStations.map((t, i) => (
                <li key={t.name} className="flex items-center justify-between text-sm">
                  <span>{i + 1}. {t.name}</span>
                  <span className="font-semibold">{t.rides} rides</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to="/admin/bikes" className="btn-secondary">+ Bike</Link>
            <Link to="/admin/stations" className="btn-secondary">+ Station</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, color, total }) {
  return (
    <div className="card">
      <div className="flex justify-between text-sm"><span className="text-slate-500">{label}</span><b>{value}</b></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
