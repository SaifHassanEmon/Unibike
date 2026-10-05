import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, taka } from '../../api';
import { Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

const EMPTY = { name: '', durationMinutes: 30, price: 20, overtimeRatePerMin: 1, isActive: true };

export default function AdminPlans() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api('/plans').then(setList).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, name, durationMinutes, price, overtimeRatePerMin, isActive } = form;
      await api(id ? `/plans/${id}` : '/plans', {
        method: id ? 'PUT' : 'POST',
        body: { name, durationMinutes, price, overtimeRatePerMin, isActive },
      });
      toast.success(id ? 'Plan updated' : 'Plan added');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete plan "${p.name}"?`)) return;
    try {
      await api(`/plans/${p.id}`, { method: 'DELETE' });
      toast.success('Plan deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Pricing Plans" subtitle="How much students pay and for how long" action={<button className="btn-primary" onClick={() => setForm(EMPTY)}>+ Add plan</button>} />

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No plans yet.</Empty> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <div key={p.id} className={`card ${p.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {!p.isActive && <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">Inactive</span>}
              </div>
              <p className="my-3 text-3xl font-bold text-brand-600">{taka(p.price)}</p>
              <p className="text-sm text-slate-600">⏱️ {p.durationMinutes} minutes</p>
              <p className="text-sm text-slate-600">⚠️ Overtime {taka(p.overtimeRatePerMin)}/min</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary flex-1 !py-1" onClick={() => setForm(p)}>Edit</button>
                <button className="btn-danger flex-1 !py-1" onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit plan' : 'Add plan'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Minutes"><input type="number" min={5} required className="input" value={form.durationMinutes} onChange={set('durationMinutes')} /></Field>
              <Field label="Price (৳)"><input type="number" min={0} step="any" required className="input" value={form.price} onChange={set('price')} /></Field>
              <Field label="Overtime ৳/min"><input type="number" min={0} step="any" required className="input" value={form.overtimeRatePerMin} onChange={set('overtimeRatePerMin')} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active (visible to students)
            </label>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
