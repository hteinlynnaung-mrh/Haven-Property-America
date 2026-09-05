import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';

export function Register() {
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: params.get('role') === 'owner' ? 'owner' : 'buyer',
  });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: form });
      setUser(data.user);
      toast.push('Account created');
      navigate(data.user.role === 'owner' ? '/owner' : '/');
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-4xl">Join Haven</h1>
      <p className="mt-2 text-ink/60">Browse as a buyer, or list homes as an owner.</p>
      <form className="mt-8 space-y-3" onSubmit={submit}>
        <input
          className="w-full rounded-xl border border-sand bg-white px-4 py-3"
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
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
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-sand bg-white px-4 py-3"
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          {['buyer', 'owner'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              className={`rounded-xl border py-3 capitalize ${
                form.role === role ? 'border-forest bg-forest text-white' : 'border-sand bg-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <button disabled={busy} className="w-full rounded-full bg-ink py-3 font-medium text-white" type="submit">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already registered? <Link to="/login" className="text-forest">Sign in</Link>
      </p>
    </div>
  );
}
