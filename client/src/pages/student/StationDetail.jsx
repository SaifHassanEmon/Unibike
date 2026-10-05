import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, taka } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Empty, Modal, PageHeader, Spinner } from '../../components/ui';

export default function StationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [station, setStation] = useState(null);
  const [plans, setPlans] = useState([]);
  const [bike, setBike] = useState(null);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api(`/stations/${id}`), api('/plans')])
      .then(([s, p]) => {
        setStation(s);
        setPlans(p);
        if (p[0]) setPlanId(p[0].id);
      })
      .catch((e) => toast.error(e.message));
  }, [id]);

  const plan = plans.find((p) => p.id === planId);

  const rent = async () => {
    setBusy(true);
    try {
      await api('/rides/start', { method: 'POST', body: { bikeId: bike.id, planId } });
      await refreshProfile();
      toast.success(`Ride started on ${bike.bikeCode}. Enjoy!`);
      navigate('/ride');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!station) return <Spinner />;

  return (
    <>
      <Link to="/stations" className="mb-3 inline-block text-sm text-brand-600">← All stations</Link>
      <PageHeader title={`📍 ${station.name}`} subtitle={station.location} />

      {profile.activeRideId && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          You already have an active ride. <Link to="/ride" className="font-semibold underline">End it</Link> before renting another bike.
        </div>
      )}

      {station.bikes.length === 0 ? (
        <Empty>No bikes at this station right now.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {station.bikes.map((b) => (
            <div key={b.id} className="card flex flex-col">
              <div className="mb-2 text-4xl">🚲</div>
              <p className="font-semibold">{b.bikeCode}</p>
              <p className="mb-3 text-sm text-slate-500">{b.model || 'Standard'}</p>
              <div className="mt-auto flex items-center justify-between">
                <Badge value={b.status} />
                <button
                  disabled={b.status !== 'available' || !!profile.activeRideId}
                  onClick={() => setBike(b)}
                  className="btn-primary !px-3 !py-1.5"
                >
                  Rent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!bike} title={`Rent ${bike?.bikeCode}`} onClose={() => setBike(null)}>
        {plans.length === 0 ? (
          <p className="text-sm text-slate-600">No pricing plans available. Please contact the admin.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">Choose a plan:</p>
            <div className="space-y-2">
              {plans.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                    planId === p.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" checked={planId === p.id} onChange={() => setPlanId(p.id)} />
                    <span>
                      <span className="block font-medium">{p.name}</span>
                      <span className="text-xs text-slate-500">
                        {p.durationMinutes} min · overtime {taka(p.overtimeRatePerMin)}/min
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold">{taka(p.price)}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              Wallet balance: <b>{taka(profile.walletBalance)}</b>
              {plan && profile.walletBalance < plan.price && (
                <p className="mt-1 text-red-600">
                  Not enough balance. <Link to="/wallet" className="underline">Top up</Link>
                </p>
              )}
            </div>
            <button
              disabled={busy || !plan || profile.walletBalance < plan.price}
              onClick={rent}
              className="btn-primary mt-4 w-full"
            >
              {busy ? 'Starting…' : `Pay ${taka(plan?.price)} & start ride`}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}
