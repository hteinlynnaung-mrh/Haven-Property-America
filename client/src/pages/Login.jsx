import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';

export function Login() {
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: form });
      setUser(data.user);
      toast.push(`Welcome back, ${data.user.name}`);
      const dest = location.state?.from || (data.user.role === 'owner' ? '/owner' : '/');
      navigate(dest);
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(email) {
    setBusy(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password: 'Password123!' } });
      setUser(data.user);
      toast.push(`Welcome, ${data.user.name}`);
      const dest = location.state?.from || (data.user.role === 'owner' ? '/owner' : '/');
      navigate(dest);
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-4xl">Sign in</h1>
      <p className="mt-2 text-sm text-ink/60">
        Sign in to manage listings, track inquiries, and save properties.
      </p>

      <div className="mt-6 rounded-2xl border border-sand bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-forest">Quick Demo Sign In</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => demoLogin('maya.chen@haven.test')}
            className="rounded-xl border border-forest/20 bg-white px-3 py-2 text-left text-xs hover:border-forest hover:bg-forest/5 transition-colors"
          >
            <span className="font-medium text-forest block">Maya Chen</span>
            <span className="text-ink/60">Owner account</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => demoLogin('alex.nguyen@haven.test')}
            className="rounded-xl border border-forest/20 bg-white px-3 py-2 text-left text-xs hover:border-forest hover:bg-forest/5 transition-colors"
          >
            <span className="font-medium text-forest block">Alex Nguyen</span>
            <span className="text-ink/60">Buyer account</span>
          </button>
        </div>
      </div>

      <div className="relative my-6 text-center text-xs text-ink/40">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sand"></div></div>
        <span className="relative bg-cream px-3">or enter email & password</span>
      </div>

      <form className="space-y-3" onSubmit={submit}>
        <input
          className="w-full rounded-xl border border-sand bg-white px-4 py-3"
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-sand bg-white px-4 py-3"
          type="password"
          required
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button disabled={busy} className="w-full rounded-full bg-forest py-3 font-medium text-white shadow-sm hover:bg-moss transition-colors" type="submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link to="/register" className="text-forest underline">Create an account</Link>
      </p>
    </div>
  );
}
