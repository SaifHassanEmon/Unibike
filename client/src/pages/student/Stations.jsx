import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Empty, PageHeader, Spinner } from '../../components/ui';
import CampusMap from '../../components/CampusMap';

export default function Stations() {
  const { profile } = useAuth();
  const [stations, setStations] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'map' | 'cards'

  useEffect(() => {
    api('/stations').then(setStations).catch((e) => toast.error(e.message));
  }, []);

  const filtered = (stations || []).filter((s) =>
    `${s.name} ${s.location}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Daffodil Smart City — Stations"
        subtitle="Explore DIU campus stations and find available bikes"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('both')}
                className={`rounded px-2.5 py-1 ${viewMode === 'both' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`rounded px-2.5 py-1 ${viewMode === 'map' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Map Only
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded px-2.5 py-1 ${viewMode === 'cards' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                List Only
              </button>
            </div>
            <input
              className="input w-56"
              placeholder="Search stations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      />

      {profile.activeRideId && (
        <Link to="/ride" className="mb-6 flex items-center justify-between rounded-xl bg-blue-600 p-4 text-white shadow hover:bg-blue-700">
          <span>🚲 You have an active ride in progress.</span>
          <span className="font-semibold">View ride →</span>
        </Link>
      )}

      {/* Campus Map */}
      {(viewMode === 'both' || viewMode === 'map') && stations && (
        <div className="mb-8">
          <CampusMap stations={filtered} />
        </div>
      )}

      {/* Stations Cards List */}
      {(viewMode === 'both' || viewMode === 'cards') && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Station Docks ({filtered.length})</h2>
          </div>

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
                      <p className="text-sm text-slate-500">{s.location || 'Daffodil Smart City'}</p>
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
      )}
    </>
  );
}
