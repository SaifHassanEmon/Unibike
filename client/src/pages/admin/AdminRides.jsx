import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate, fmtDuration, taka } from '../../api';
import { Badge, Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

export default function AdminRides() {
  const [rides, setRides] = useState(null);
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState('');
  const [forceEnd, setForceEnd] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api(`/rides${status ? `?status=${status}` : ''}`), api('/stations')])
      .then(([r, s]) => { setRides(r); setStations(s); })
      .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const doForceEnd = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/rides/${forceEnd.id}/end`, { method: 'POST', body: { stationId: forceEnd.stationId } });
      toast.success('Ride ended');
      setForceEnd(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const isOverdue = (r) => r.status === 'active' && new Date(r.expectedEndTime) < new Date();

  return (
    <>
      <PageHeader
        title="Rides"
        subtitle="Monitor active and past rides"
        action={
          <select className="input w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All rides</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        }
      />

      {!rides ? <Spinner /> : rides.length === 0 ? <Empty>No rides.</Empty> : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead><tr><th>Started</th><th>Student</th><th>Bike</th><th>Plan</th><th>Route</th><th>Duration</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id} className={isOverdue(r) ? 'bg-red-50' : ''}>
                  <td className="whitespace-nowrap text-xs">{fmtDate(r.startTime)}</td>
                  <td>
                    <p className="font-medium">{r.userName}</p>
                    <p className="text-xs text-slate-500">{r.userEmail}</p>
                  </td>
                  <td>{r.bikeCode}</td>
                  <td>{r.planName}</td>
                  <td className="text-xs">{r.startStationName} → {r.endStationName || '…'}</td>
                  <td>{r.endTime ? fmtDuration(r.startTime, r.endTime) : <span className="text-xs">due {fmtDate(r.expectedEndTime)}</span>}</td>
                  <td>{taka(r.totalCost)}{r.overtimeCost > 0 && <span className="block text-xs text-red-600">+{taka(r.overtimeCost)} OT</span>}</td>
                  <td>
                    <Badge value={r.status} />
                    {isOverdue(r) && <span className="ml-1 text-xs font-semibold text-red-600">OVERDUE</span>}
                    {r.forceEnded && <span className="block text-xs text-slate-500">force-ended</span>}
                  </td>
                  <td>
                    {r.status === 'active' && (
                      <button className="btn-danger !px-3 !py-1" onClick={() => setForceEnd({ ...r, stationId: stations.find((s) => s.bikeCount < s.capacity)?.id || '' })}>
                        End
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!forceEnd} title={`Force-end ride — ${forceEnd?.bikeCode}`} onClose={() => setForceEnd(null)}>
        {forceEnd && (
          <form onSubmit={doForceEnd} className="space-y-4">
            <p className="text-sm text-slate-600">The student will be charged any overtime up to now.</p>
            <Field label="Bike returned to">
              <select required className="input" value={forceEnd.stationId} onChange={(e) => setForceEnd({ ...forceEnd, stationId: e.target.value })}>
                {stations.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.bikeCount >= s.capacity}>{s.name} ({s.bikeCount}/{s.capacity})</option>
                ))}
              </select>
            </Field>
            <button disabled={busy} className="btn-danger w-full">{busy ? 'Ending…' : 'End ride'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
