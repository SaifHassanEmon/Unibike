import { auth } from './firebase';

/** Calls the UniBike API with the current user's Firebase ID token. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const taka = (n) => `৳${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const fmtDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '—';
  const mins = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};
