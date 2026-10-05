import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api';
import { Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

const EMPTY = { name: '', location: '', lat: '', lng: '', capacity: 10 };

export default function AdminStations() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null); // null = closed
  const [busy, setBusy] = useState(false);

  const load = () => api('/stations').then(setList).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, ...body } = form;
      await api(id ? `/stations/${id}` : '/stations', { method: id ? 'PUT' : 'POST', body });
      toast.success(id ? 'Station updated' : 'Station added');
      setForm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete station "${s.name}"?`)) return;
    try {
      await api(`/stations/${s.id}`, { method: 'DELETE' });
      toast.success('Station deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Stations" subtitle="Manage bike stations on campus" action={<button className="btn-primary" onClick={() => setForm(EMPTY)}>+ Add station</button>} />

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No stations yet.</Empty> : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead><tr><th>Name</th><th>Location</th><th>Coordinates</th><th>Bikes / Capacity</th><th>Available</th><th></th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.location || '—'}</td>
                  <td className="text-xs text-slate-500">{s.lat != null ? `${s.lat}, ${s.lng}` : '—'}</td>
                  <td>{s.bikeCount} / {s.capacity}</td>
                  <td>{s.availableCount}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="btn-secondary !px-3 !py-1 mr-2" onClick={() => setForm({ ...EMPTY, ...s, lat: s.lat ?? '', lng: s.lng ?? '' })}>Edit</button>
                    <button className="btn-danger !px-3 !py-1" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit station' : 'Add station'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
            <Field label="Location / landmark"><input className="input" value={form.location} onChange={set('location')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude"><input type="number" step="any" className="input" value={form.lat} onChange={set('lat')} /></Field>
              <Field label="Longitude"><input type="number" step="any" className="input" value={form.lng} onChange={set('lng')} /></Field>
            </div>
            <Field label="Capacity (docks)"><input type="number" min={1} required className="input" value={form.capacity} onChange={set('capacity')} /></Field>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
