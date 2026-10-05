import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api';
import { Badge, Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

export default function AdminBikes() {
  const [bikes, setBikes] = useState(null);
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState({ status: '', station: '', q: '' });
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api('/bikes'), api('/stations')])
      .then(([b, s]) => { setBikes(b); setStations(s); })
      .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const openNew = () => setForm({ bikeCode: '', model: '', status: 'available', currentStation: stations[0]?.id || '' });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, bikeCode, model, status, currentStation } = form;
      await api(id ? `/bikes/${id}` : '/bikes', { method: id ? 'PUT' : 'POST', body: { bikeCode, model, status, currentStation } });
      toast.success(id ? 'Bike updated' : 'Bike added');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    if (!confirm(`Delete bike ${b.bikeCode}?`)) return;
    try {
      await api(`/bikes/${b.id}`, { method: 'DELETE' });
      toast.success('Bike deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const shown = (bikes || []).filter(
    (b) =>
      (!filter.status || b.status === filter.status) &&
      (!filter.station || b.currentStation === filter.station) &&
      `${b.bikeCode} ${b.model}`.toLowerCase().includes(filter.q.toLowerCase())
  );
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Bikes" subtitle={`${bikes?.length ?? 0} bikes in the fleet`} action={<button className="btn-primary" onClick={openNew} disabled={!stations.length}>+ Add bike</button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search code or model…" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select className="input max-w-[12rem]" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="in_use">In use</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="input max-w-[14rem]" value={filter.station} onChange={(e) => setFilter({ ...filter, station: e.target.value })}>
          <option value="">All stations</option>
          {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!bikes ? <Spinner /> : shown.length === 0 ? <Empty>No bikes match.</Empty> : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead><tr><th>Code</th><th>Model</th><th>Status</th><th>Station</th><th></th></tr></thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <td className="font-medium">{b.bikeCode}</td>
                  <td>{b.model || '—'}</td>
                  <td><Badge value={b.status} /></td>
                  <td>{b.stationName || <span className="text-blue-600">On a ride</span>}</td>
                  <td className="whitespace-nowrap text-right">
                    <button disabled={b.status === 'in_use'} className="btn-secondary !px-3 !py-1 mr-2" onClick={() => setForm(b)}>Edit</button>
                    <button disabled={b.status === 'in_use'} className="btn-danger !px-3 !py-1" onClick={() => remove(b)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} title={form?.id ? `Edit ${form.bikeCode}` : 'Add bike'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Bike code"><input required placeholder="UB-101" className="input uppercase" value={form.bikeCode} onChange={set('bikeCode')} /></Field>
            <Field label="Model"><input className="input" value={form.model} onChange={set('model')} /></Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={set('status')}>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </Field>
            <Field label="Station">
              <select required className="input" value={form.currentStation || ''} onChange={set('currentStation')}>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.bikeCount}/{s.capacity})</option>
                ))}
              </select>
            </Field>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
