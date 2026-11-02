import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const demo = (email, password) => setForm({ ...form, email, password });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-serif text-xl font-semibold"><HeartPulse /> MediAssist</div>
        <div>
          <h1 className="max-w-md font-serif text-4xl font-semibold leading-tight">
            Clear answers about your health, grounded in vetted sources.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Ask about symptoms, first aid and healthy habits. Every answer shows which knowledge-base entries it drew on.
          </p>
        </div>
        <p className="text-sm text-brand-100">For information only. MediAssist does not replace a doctor.</p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="font-serif text-2xl font-semibold">{isLogin ? 'Log in' : 'Create your account'}</h2>

          {!isLogin && (
            <label className="block text-sm font-medium">Full name
              <input className="field mt-1" value={form.name} onChange={set('name')} required />
            </label>
          )}
          <label className="block text-sm font-medium">Email
            <input type="email" className="field mt-1" value={form.email} onChange={set('email')} required />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" className="field mt-1" value={form.password} onChange={set('password')} minLength={8} required />
          </label>

          {error && <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-alert">{error}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>

          <p className="text-sm text-ink/70">
            {isLogin ? 'New here? ' : 'Already registered? '}
            <Link className="font-semibold text-brand-600 hover:underline" to={isLogin ? '/register' : '/login'}>
              {isLogin ? 'Create an account' : 'Log in'}
            </Link>
          </p>

          {isLogin && (
            <div className="rounded-lg border border-dashed border-ink/20 p-3 text-xs text-ink/70">
              <p className="mb-2 font-semibold">Demo accounts (click to fill)</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost !px-2 !py-1 border border-ink/10" onClick={() => demo('patient@healthchat.dev', 'Patient@12345')}>Patient</button>
                <button type="button" className="btn-ghost !px-2 !py-1 border border-ink/10" onClick={() => demo('doctor@healthchat.dev', 'Doctor@12345')}>Doctor</button>
                <button type="button" className="btn-ghost !px-2 !py-1 border border-ink/10" onClick={() => demo('admin@healthchat.dev', 'Admin@12345')}>Admin</button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
