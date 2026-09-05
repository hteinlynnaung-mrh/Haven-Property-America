import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';

export function OwnerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/api/owner/dashboard').then(setData);
  }, []);

  if (!data) return <p className="p-10 text-center text-ink/50">Loading dashboard…</p>;
  const { stats, recent } = data;

  const cards = [
    { label: 'Total Listings', value: stats.listings, href: '/owner/listings', hint: 'All properties' },
    { label: 'Active on Market', value: stats.active, href: '/owner/listings', hint: 'Available to buyers' },
    { label: 'New Inquiries', value: stats.pendingInquiries, href: '/owner/inquiries', hint: 'Awaiting your reply', highlight: stats.pendingInquiries > 0 },
    { label: 'All Inquiries', value: stats.totalInquiries, href: '/owner/inquiries', hint: 'Total messages received' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest">Owner Portal</p>
          <h1 className="font-serif text-4xl mt-1">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/owner/listings" className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-ink/80 hover:border-forest/40 transition-colors">
            Manage listings
          </Link>
          <Link to="/owner/inquiries" className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-ink/80 hover:border-forest/40 transition-colors">
            View inquiries
          </Link>
          <Link to="/owner/listings/new" className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors">
            + New listing
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className={`rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md ${
              c.highlight
                ? 'border-forest/30 bg-forest/5 hover:border-forest'
                : 'border-sand bg-white hover:border-forest/30'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-ink/50">{c.label}</p>
              {c.highlight && (
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
              )}
            </div>
            <p className="mt-2 font-serif text-4xl text-forest">{c.value}</p>
            <p className="mt-1 text-xs text-ink/40">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="font-serif text-2xl">Recent listings</h2>
            <p className="text-xs text-ink/50 mt-0.5">Quickly view or update your recently modified properties</p>
          </div>
          <Link to="/owner/listings" className="text-xs font-semibold uppercase tracking-wider text-forest hover:underline">
            View all listings →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand bg-white p-12 text-center">
            <p className="font-serif text-xl text-ink">No properties listed yet</p>
            <p className="text-xs text-ink/50 mt-1">Publish your first rental or home for sale.</p>
            <Link to="/owner/listings/new" className="mt-4 inline-block rounded-full bg-forest px-5 py-2 text-xs font-medium text-white">
              Create a listing
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-sand bg-white shadow-xs">
            {recent.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-4 border-b border-sand px-5 py-3.5 last:border-0 hover:bg-cream/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {l.imageUrls?.[0] ? (
                    <img src={l.imageUrls[0]} alt="" className="h-12 w-16 rounded-xl object-cover bg-sand shrink-0" />
                  ) : (
                    <div className="h-12 w-16 rounded-xl bg-sand flex items-center justify-center text-[10px] text-ink/40 shrink-0">No photo</div>
                  )}
                  <div>
                    <Link to={`/listings/${l.id}`} className="font-medium text-ink hover:text-forest transition-colors">
                      {l.title}
                    </Link>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {l.city}, {l.state} · <span className="capitalize">{l.listingType}</span> · <span className="capitalize font-medium text-ink/70">{l.status}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-serif text-lg text-forest font-medium">{formatPrice(l)}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/owner/listings/${l.id}/edit`}
                      className="rounded-lg border border-sand bg-white px-3 py-1 text-xs font-medium text-ink/70 hover:border-forest/40 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/listings/${l.id}`}
                      className="rounded-lg bg-forest/10 px-3 py-1 text-xs font-medium text-forest hover:bg-forest/20 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
