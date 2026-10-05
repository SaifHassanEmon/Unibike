import { Link } from 'react-router-dom';

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Incorrect email or password',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect email or password',
  'auth/email-already-in-use': 'This email is already registered',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/invalid-email': 'Invalid email address',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/configuration-not-found': 'Enable Email/Password sign-in in Firebase Console > Authentication',
};

export const authErrorMessage = (err) => FIREBASE_ERRORS[err.code] || err.message;

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center text-3xl font-bold">
          🚲 Uni<span className="text-brand-600">Bike</span>
        </Link>
        <div className="card p-8">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mb-6 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
      </div>
    </div>
  );
}
