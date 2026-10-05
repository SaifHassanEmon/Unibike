import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate, taka } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Empty, Field, PageHeader, Spinner } from '../../components/ui';

const QUICK = [50, 100, 200, 500];
const METHODS = ['bKash', 'Nagad', 'Card'];

export default function Wallet() {
  const { refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState(METHODS[0]);
  const [busy, setBusy] = useState(false);

  const load = () => api('/wallet').then(setData).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const topup = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/wallet/topup', { method: 'POST', body: { amount: Number(amount), method } });
      toast.success(`${taka(amount)} added to your wallet`);
      await Promise.all([load(), refreshProfile()]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader title="Wallet" subtitle="Top up to pay for rides" />
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="card bg-gradient-to-br from-brand-600 to-emerald-800 text-white">
          <p className="text-sm opacity-80">Current balance</p>
          <p className="my-2 text-4xl font-bold">{taka(data.balance)}</p>
          {data.balance < 0 && <p className="text-sm text-amber-200">Your balance is negative due to overtime. Please top up.</p>}
        </div>
        <form onSubmit={topup} className="card space-y-4">
          <h3 className="font-semibold">Add money</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(q)}
                className={`btn ${Number(amount) === q ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white'}`}
              >
                {taka(q)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (৳10 – ৳5000)">
              <input type="number" min={10} max={5000} required className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Method">
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Processing…' : `Top up ${taka(amount)}`}</button>
          <p className="text-xs text-slate-400">Demo mode: payments are simulated.</p>
        </form>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Transactions</h2>
      {data.transactions.length === 0 ? (
        <Empty>No transactions yet.</Empty>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  <td><Badge value={t.type} /></td>
                  <td>{t.description}</td>
                  <td className={`text-right font-medium ${t.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {t.amount > 0 ? '+' : '−'}{taka(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
