import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate } from '../../api';
import { Badge, Empty, Field, PageHeader } from '../../components/ui';

const CATEGORIES = [
  ['flat_tire', 'Flat tire'],
  ['brakes', 'Brakes'],
  ['chain', 'Chain / gears'],
  ['seat', 'Seat / handlebar'],
  ['lock', 'Lock'],
  ['other', 'Other'],
];
const catLabel = Object.fromEntries(CATEGORIES);

export default function ReportIssue() {
  const [form, setForm] = useState({ bikeCode: '', category: 'flat_tire', description: '' });
  const [issues, setIssues] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => api('/issues/me').then(setIssues).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/issues', { method: 'POST', body: form });
      toast.success('Issue reported. Thank you!');
      setForm({ bikeCode: '', category: 'flat_tire', description: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Report an Issue" subtitle="Help us keep bikes in good shape" />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="card space-y-4 lg:col-span-2">
          <Field label="Bike code">
            <input required placeholder="e.g. UB-001" className="input uppercase" value={form.bikeCode} onChange={(e) => setForm({ ...form, bikeCode: e.target.value })} />
          </Field>
          <Field label="Problem">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea required rows={4} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Sending…' : 'Submit report'}</button>
        </form>

        <div className="lg:col-span-3">
          <h3 className="mb-3 font-semibold">My reports</h3>
          {issues.length === 0 ? (
            <Empty>No reports yet.</Empty>
          ) : (
            <div className="space-y-3">
              {issues.map((i) => (
                <div key={i.id} className="card !p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{i.bikeCode} · {catLabel[i.category] || i.category}</p>
                    <Badge value={i.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{i.description}</p>
                  {i.adminNote && <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700">Admin: {i.adminNote}</p>}
                  <p className="mt-2 text-xs text-slate-400">{fmtDate(i.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
