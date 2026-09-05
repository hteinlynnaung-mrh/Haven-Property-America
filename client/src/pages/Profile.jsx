import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';

const field = 'w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-forest';

export function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileBusy, setProfileBusy] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileBusy(true);
    try {
      const data = await api('/api/auth/profile', {
        method: 'PATCH',
        body: { name: profileForm.name, phone: profileForm.phone },
      });
      setUser(data.user);
      toast.push('Profile updated successfully');
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.push('New passwords do not match', 'err');
    }
    setPasswordBusy(true);
    try {
      const data = await api('/api/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      toast.push(data.message || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setPasswordBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl">Account Settings</h1>
          <p className="mt-1 text-sm text-ink/60">Manage your profile details and security</p>
        </div>
        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
          {user.role} Account
        </span>
      </div>

      <div className="mt-8 space-y-8">
        {/* Profile Information */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl">Personal Information</h2>
          <p className="mt-1 text-xs text-ink/50">Your name and contact details used for listings and inquiries</p>

          <form className="mt-6 space-y-4" onSubmit={handleUpdateProfile}>
            <div>
              <label className="text-xs font-medium text-ink/70 mb-1 block">Email address</label>
              <input
                className={`${field} bg-sand/30 text-ink/60 cursor-not-allowed`}
                type="email"
                disabled
                value={user.email}
              />
              <span className="text-[11px] text-ink/40 mt-1 block">Email cannot be changed</span>
            </div>

            <div>
              <label className="text-xs font-medium text-ink/70 mb-1 block">Full name</label>
              <input
                className={field}
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink/70 mb-1 block">Phone number</label>
              <input
                className={field}
                placeholder="(555) 000-0000"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={profileBusy}
              className="rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors"
            >
              {profileBusy ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl">Security & Password</h2>
          <p className="mt-1 text-xs text-ink/50">Update your account password</p>

          <form className="mt-6 space-y-4" onSubmit={handleChangePassword}>
            <div>
              <label className="text-xs font-medium text-ink/70 mb-1 block">Current password</label>
              <input
                className={field}
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink/70 mb-1 block">New password</label>
                <input
                  className={field}
                  type="password"
                  required
                  minLength={8}
                  placeholder="8+ characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/70 mb-1 block">Confirm new password</label>
                <input
                  className={field}
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordBusy}
              className="rounded-full border border-forest px-6 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-white transition-colors"
            >
              {passwordBusy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
