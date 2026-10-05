import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthCard, { authErrorMessage } from '../components/AuthCard';
import { Field } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        studentId: form.studentId.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created! Top up your wallet to start riding.');
      navigate('/wallet');
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Students only — use your university email"
      footer={<>Already registered? <Link to="/login" className="font-medium text-brand-600">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input required className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Student ID"><input required className="input" value={form.studentId} onChange={set('studentId')} /></Field>
        <Field label="University email"><input type="email" required className="input" value={form.email} onChange={set('email')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password"><input type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} /></Field>
          <Field label="Confirm"><input type="password" required minLength={6} className="input" value={form.confirm} onChange={set('confirm')} /></Field>
        </div>
        <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
    </AuthCard>
  );
}
