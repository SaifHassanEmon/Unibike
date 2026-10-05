import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, fmtDate, taka } from '../../api';
import { Badge, Empty, Field, Modal, PageHeader, Spinner } from '../../components/ui';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [adjust, setAdjust] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api('/admin/users').then(setUsers).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const toggleBlock = async (u) => {
    if (!confirm(`${u.isBlocked ? 'Unblock' : 'Block'} ${u.name}?`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'PUT', body: { isBlocked: !u.isBlocked } });
      toast.success(u.isBlocked ? 'Student unblocked' : 'Student blocked');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveAdjust = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/admin/users/${adjust.id}`, { method: 'PUT', body: { walletAdjust: adjust.amount, reason: adjust.reason } });
      toast.success('Wallet adjusted');
      setAdjust(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shown = (users || []).filter((u) => `${u.name} ${u.email} ${u.studentId}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Students" subtitle={`${users?.length ?? 0} registered`} action={<input className="input w-64" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />} />

      {!users ? <Spinner /> : shown.length === 0 ? <Empty>No students found.</Empty> : (
        <div className="card overflow-x-auto !p-0">
          <table className="table">
            <thead><tr><th>Name</th><th>Student ID</th><th>Email</th><th>Balance</th><th>Status</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.studentId}</td>
                  <td>{u.email}</td>
                  <td className={u.walletBalance < 0 ? 'text-red-600' : ''}>{taka(u.walletBalance)}</td>
                  <td>
                    {u.isBlocked ? <Badge value="blocked" /> : u.activeRideId ? <Badge value="active">riding</Badge> : <Badge value="available">active</Badge>}
                  </td>
                  <td className="whitespace-nowrap text-xs">{fmtDate(u.createdAt)}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="btn-secondary !px-3 !py-1 mr-2" onClick={() => setAdjust({ ...u, amount: '', reason: '' })}>Wallet</button>
                    <button className={`${u.isBlocked ? 'btn-primary' : 'btn-danger'} !px-3 !py-1`} onClick={() => toggleBlock(u)}>
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!adjust} title={`Adjust wallet — ${adjust?.name}`} onClose={() => setAdjust(null)}>
        {adjust && (
          <form onSubmit={saveAdjust} className="space-y-4">
            <p className="text-sm text-slate-600">Current balance: <b>{taka(adjust.walletBalance)}</b></p>
            <Field label="Amount (use negative to deduct)">
              <input type="number" step="any" required className="input" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
            </Field>
            <Field label="Reason">
              <input className="input" placeholder="e.g. Refund for faulty bike" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
            </Field>
            <button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Apply'}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
