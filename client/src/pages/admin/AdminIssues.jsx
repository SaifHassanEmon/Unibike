import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate } from '../../api';
import { Badge, Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

export default function AdminIssues() {
  const [issues, setIssues] = useState(null);
  const [filter, setFilter] = useState('unresolved');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api('/issues').then(setIssues).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/issues/${edit.id}`, {
        method: 'PUT',
        body: { status: edit.status, adminNote: edit.adminNote || '', sendToMaintenance: edit.sendToMaintenance },
      });
      toast.success('Issue updated');
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shown = (issues || []).filter((i) => (filter === 'all' ? true : filter === 'unresolved' ? i.status !== 'resolved' : i.status === filter));

  return (
    <>
      <PageHeader
        title="Issue Reports"
        subtitle="Problems reported by students"
        action={
          <select className="input w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="unresolved">Unresolved</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        }
      />

      {!issues ? <Spinner /> : shown.length === 0 ? <Empty>No issues 🎉</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((i) => (
            <div key={i.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">🚲 {i.bikeCode} <span className="font-normal text-slate-500">· {i.category.replace('_', ' ')}</span></p>
                <Badge value={i.status} />
              </div>
              <p className="text-sm text-slate-700">{i.description}</p>
              {i.adminNote && <p className="mt-2 rounded bg-slate-50 p-2 text-sm">Note: {i.adminNote}</p>}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">by {i.userName} · {fmtDate(i.createdAt)}</p>
                <button className="btn-secondary !px-3 !py-1" onClick={() => setEdit({ ...i, sendToMaintenance: false })}>Manage</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} title={`Issue — ${edit?.bikeCode}`} onClose={() => setEdit(null)}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Status">
              <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </Field>
            <Field label="Note to student">
              <textarea rows={3} className="input" value={edit.adminNote || ''} onChange={(e) => setEdit({ ...edit, adminNote: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.sendToMaintenance} onChange={(e) => setEdit({ ...edit, sendToMaintenance: e.target.checked })} />
              Mark bike {edit.bikeCode} as under maintenance
            </label>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
