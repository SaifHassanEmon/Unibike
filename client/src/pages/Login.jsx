import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthCard, { authErrorMessage } from '../components/AuthCard';
import { Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const me = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${me.name}!`);
      navigate(me.role === 'admin' ? '/admin' : '/stations');
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Log in"
      subtitle="Use your university account"
      footer={<>New here? <Link to="/register" className="font-medium text-brand-600">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthCard>
  );
}
