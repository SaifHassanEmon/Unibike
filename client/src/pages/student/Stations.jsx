import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Empty, PageHeader, Spinner } from '../../components/ui';

export default function Stations() {
  const { profile } = useAuth();
  const [stations, setStations] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api('/stations').then(setStations).catch((e) => toast.error(e.message));
  }, []);

  const filtered = (stations || []).filter((s) =>
    `${s.name} ${s.location}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Stations"
        subtitle="Choose a station to see available bikes"
        action={<input className="input w-64" placeholder="Search stations…" value={search} onChange={(e) => setSearch(e.target.value)} />}
      />

      {profile.activeRideId && (
        <Link to="/ride" className="mb-6 flex items-center justify-between rounded-xl bg-blue-600 p-4 text-white shadow hover:bg-blue-700">
          <span>🚲 You have an active ride in progress.</span>
          <span className="font-semibold">View ride →</span>
        </Link>
      )}

      {!stations ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty>No stations found.</Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.id} to={`/stations/${s.id}`} className="card group transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-brand-600">📍 {s.name}</h3>
                  <p className="text-sm text-slate-500">{s.location || '—'}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    s.availableCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {s.availableCount} available
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, (s.bikeCount / s.capacity) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {s.bikeCount} / {s.capacity} docks occupied · {s.capacity - s.bikeCount} free
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
