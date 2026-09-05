import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, mapUser } from '../db.js';
import { requireAuth, setAuthCookie, clearAuthCookie, signToken } from '../auth.js';

const emailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const { email, password, name, phone, role } = req.body || {};
  if (!emailOk(email || '')) return res.status(400).json({ error: 'Enter a valid email.' });
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!['buyer', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Choose a role: buyer or owner.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(String(email).toLowerCase().trim(), passwordHash, name.trim(), phone?.trim() || null, role);

  const user = mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase().trim());
  if (!row || !bcrypt.compareSync(password || '', row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const user = mapUser(row);
  setAuthCookie(res, signToken(user));
  res.json({ user });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.patch('/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?')
    .run(name.trim(), phone?.trim() || null, req.user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: mapUser(updated) });
});

authRouter.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!row || !bcrypt.compareSync(currentPassword || '', row.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  res.json({ ok: true, message: 'Password updated successfully.' });
});
