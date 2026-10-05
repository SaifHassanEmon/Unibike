import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, fmtDate, fmtDuration, taka } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Empty, Field, PageHeader, Spinner } from '../../components/ui';

const pad = (n) => String(n).padStart(2, '0');
const formatClock = (ms) => {
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export default function ActiveRide() {
  const { refreshProfile } = useAuth();
  const [ride, setRide] = useState(undefined);
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState('');
  const [now, setNow] = useState(Date.now());
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/rides/active'), api('/stations')])
      .then(([r, s]) => {
        setRide(r);
        setStations(s);
        const firstFree = s.find((st) => st.bikeCount < st.capacity);
        if (firstFree) setStationId(firstFree.id);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const endRide = async () => {
    setBusy(true);
    try {
      const result = await api(`/rides/${ride.id}/end`, { method: 'POST', body: { stationId } });
      setSummary(result);
      setRide(null);
      await refreshProfile();
      toast.success('Ride completed. Thanks for riding!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (ride === undefined) return <Spinner />;

  if (summary) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Ride summary" />
        <div className="card space-y-3">
          <div className="text-center text-5xl">✅</div>
          <Row label="Bike" value={summary.bikeCode} />
          <Row label="Plan" value={summary.planName} />
          <Row label="From → To" value={`${summary.startStationName} → ${summary.endStationName}`} />
          <Row label="Duration" value={fmtDuration(summary.startTime, summary.endTime)} />
          <Row label="Plan cost" value={taka(summary.baseCost)} />
          <Row label={`Overtime (${summary.overtimeMinutes} min)`} value={taka(summary.overtimeCost)} danger={summary.overtimeCost > 0} />
          <div className="border-t pt-3"><Row label={<b>Total</b>} value={<b>{taka(summary.totalCost)}</b>} /></div>
          <Link to="/stations" className="btn-primary w-full">Back to stations</Link>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <>
        <PageHeader title="My Ride" />
        <Empty>
          You have no active ride. <Link to="/stations" className="font-medium text-brand-600">Find a bike →</Link>
        </Empty>
      </>
    );
  }

  const start = new Date(ride.startTime).getTime();
  const end = new Date(ride.expectedEndTime).getTime();
  const remaining = end - now;
  const overtime = remaining < 0;
  const progress = Math.min(100, ((now - start) / (end - start)) * 100);
  const overMins = overtime ? Math.ceil(-remaining / 60000) : 0;
  const nearlyUp = !overtime && remaining < 5 * 60000;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Ride" subtitle={`Started ${fmtDate(ride.startTime)} from ${ride.startStationName}`} />

      <div className={`card mb-6 text-center ${overtime ? 'border-red-300 bg-red-50' : nearlyUp ? 'border-amber-300 bg-amber-50' : ''}`}>
        <p className="text-sm text-slate-500">{overtime ? 'Overtime' : 'Time remaining'}</p>
        <p className={`my-2 font-mono text-6xl font-bold ${overtime ? 'text-red-600' : nearlyUp ? 'text-amber-600' : 'text-slate-900'}`}>
          {overtime && '+'}
          {formatClock(remaining)}
        </p>
        <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full ${overtime ? 'bg-red-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }} />
        </div>
        {overtime && (
          <p className="mt-3 text-sm text-red-700">
            You are {overMins} min over. Extra charge so far: <b>{taka(overMins * ride.overtimeRatePerMin)}</b>
          </p>
        )}
        {nearlyUp && <p className="mt-3 text-sm text-amber-700">⚠️ Less than 5 minutes left. Head to a station!</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Info label="Bike" value={ride.bikeCode} />
        <Info label="Plan" value={ride.planName} />
        <Info label="Paid" value={taka(ride.baseCost)} />
        <Info label="Overtime rate" value={`${taka(ride.overtimeRatePerMin)}/min`} />
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold">Return bike</h3>
        <Field label="Return station">
          <select className="input" value={stationId} onChange={(e) => setStationId(e.target.value)}>
            {stations.map((s) => (
              <option key={s.id} value={s.id} disabled={s.bikeCount >= s.capacity}>
                {s.name} — {s.capacity - s.bikeCount} free docks{s.bikeCount >= s.capacity ? ' (full)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <button disabled={busy || !stationId} onClick={endRide} className="btn-primary mt-4 w-full">
          {busy ? 'Ending…' : 'End ride & return bike'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={danger ? 'text-red-600' : ''}>{value}</span>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="card !p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
