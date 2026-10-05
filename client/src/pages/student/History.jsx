import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate, fmtDuration, taka } from '../../api';
import { Badge, Empty, PageHeader, Spinner } from '../../components/ui';

export default function History() {
  const [rides, setRides] = useState(null);

  useEffect(() => {
    api('/rides/me').then(setRides).catch((e) => toast.error(e.message));
  }, []);

  const completed = (rides || []).filter((r) => r.status === 'completed');
  const totalSpent = completed.reduce((s, r) => s + r.totalCost, 0);

  return (
    <>
      <PageHeader
        title="Ride History"
        subtitle={rides ? `${completed.length} completed rides · ${taka(totalSpent)} spent` : ''}
      />
      {!rides ? (
        <Spinner />
      ) : rides.length === 0 ? (
        <Empty>You haven't taken any rides yet.</Empty>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Bike</th><th>Plan</th><th>From → To</th><th>Duration</th><th>Overtime</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{fmtDate(r.startTime)}</td>
                  <td>{r.bikeCode}</td>
                  <td>{r.planName}</td>
                  <td>{r.startStationName} → {r.endStationName || '…'}</td>
                  <td>{fmtDuration(r.startTime, r.endTime)}</td>
                  <td className={r.overtimeCost > 0 ? 'text-red-600' : ''}>{r.overtimeCost > 0 ? `${r.overtimeMinutes}m · ${taka(r.overtimeCost)}` : '—'}</td>
                  <td className="font-medium">{taka(r.totalCost)}</td>
                  <td><Badge value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
