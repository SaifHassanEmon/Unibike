import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '📍', title: 'Find a station', text: 'See every campus station and how many bikes are available right now.' },
  { icon: '⏱️', title: 'Pick a plan', text: 'Choose 30 minutes, an hour or more. Pay upfront from your wallet.' },
  { icon: '🔁', title: 'Return anywhere', text: 'Drop the bike at any station with free space when you are done.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="text-2xl font-bold">🚲 Uni<span className="text-brand-600">Bike</span></div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary">Login</Link>
          <Link to="/register" className="btn-primary">Sign up</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
          Ride across campus, <span className="text-brand-600">anytime.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          UniBike is the university bicycle sharing system. Borrow a bike from any station, ride to class, and return
          it when you are done. Simple, affordable, and green.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">Get started</Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">I have an account</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card text-center">
            <div className="mb-3 text-4xl">{f.icon}</div>
            <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
