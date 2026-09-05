import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';

const link = 'text-sm font-medium text-ink/70 hover:text-forest transition-colors';
const active = 'text-forest font-semibold';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const currentListingType = searchParams.get('listingType');
  const isBrowse = location.pathname === '/listings' && !currentListingType;
  const isRent = location.pathname === '/listings' && currentListingType === 'rent';
  const isSale = location.pathname === '/listings' && currentListingType === 'sale';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-sand bg-cream/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <NavLink to="/" className="font-serif text-2xl font-semibold text-forest">
            Haven
          </NavLink>
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/listings" className={isBrowse ? `${link} ${active}` : link}>
              Browse
            </NavLink>
            <NavLink to="/listings?listingType=rent" className={isRent ? `${link} ${active}` : link}>
              Rent
            </NavLink>
            <NavLink to="/listings?listingType=sale" className={isSale ? `${link} ${active}` : link}>
              Buy
            </NavLink>
            {user && (
              <NavLink to="/saved" className={({ isActive }) => (isActive ? `${link} ${active}` : link)}>
                Saved
              </NavLink>
            )}
            {user && (
              <NavLink to="/inquiries" className={({ isActive }) => (isActive ? `${link} ${active}` : link)}>
                Inquiries
              </NavLink>
            )}
            {user?.role === 'owner' && (
              <NavLink to="/owner" className={({ isActive }) => (isActive ? `${link} ${active}` : link)}>
                Owner
              </NavLink>
            )}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 rounded-full border border-sand bg-white px-3 py-1 hover:border-forest/40 transition-colors"
                >
                  <span className="text-sm font-medium text-ink">{user.name}</span>
                  <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest">
                    {user.role}
                  </span>
                </NavLink>
                <button
                  className="rounded-full border border-forest/20 px-4 py-1.5 text-xs font-medium text-ink/80 hover:border-forest hover:text-forest transition-colors"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="text-sm font-medium">
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-full bg-forest px-4 py-1.5 text-sm font-medium text-white"
                >
                  Join
                </NavLink>
              </>
            )}
          </div>
          <button className="md:hidden text-sm" onClick={() => setOpen((v) => !v)} type="button">
            Menu
          </button>
        </div>
        {open && (
          <div className="flex flex-col gap-3 border-t border-sand px-4 py-4 md:hidden">
            <NavLink to="/listings" onClick={() => setOpen(false)}>
              Browse
            </NavLink>
            <NavLink to="/listings?listingType=rent" onClick={() => setOpen(false)}>
              Rent
            </NavLink>
            <NavLink to="/listings?listingType=sale" onClick={() => setOpen(false)}>
              Buy
            </NavLink>
            {user && (
              <NavLink to="/saved" onClick={() => setOpen(false)}>
                Saved
              </NavLink>
            )}
            {user && (
              <NavLink to="/inquiries" onClick={() => setOpen(false)}>
                Inquiries
              </NavLink>
            )}
            {user?.role === 'owner' && (
              <NavLink to="/owner" onClick={() => setOpen(false)}>
                Owner dashboard
              </NavLink>
            )}
            {user && (
              <NavLink to="/profile" onClick={() => setOpen(false)}>
                Account settings
              </NavLink>
            )}
            {user ? (
              <button
                className="text-left"
                onClick={async () => {
                  await logout();
                  setOpen(false);
                  navigate('/');
                }}
              >
                Sign out
              </button>
            ) : (
              <NavLink to="/login" onClick={() => setOpen(false)}>
                Sign in
              </NavLink>
            )}
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-sand py-8 text-center text-sm text-ink/50">
        Haven classifieds · Rent and buy homes from the people who own them
      </footer>
    </div>
  );
}
