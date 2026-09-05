import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { EmptyState } from '../ListingCard.jsx';

const STATUS_STYLES = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  read: 'bg-blue-50 text-blue-700 border-blue-200',
  replied: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function BuyerInquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/me/inquiries')
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-4xl">Your inquiries</h1>
          <p className="mt-1 text-sm text-ink/60">Messages and tour requests sent to property owners</p>
        </div>
        {items.length > 0 && <span className="text-sm text-ink/50">{items.length} total</span>}
      </div>
      {loading ? (
        <p className="mt-6 text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 space-y-4 text-center">
          <EmptyState title="No messages yet" body="Browse listings and send an inquiry or request a tour." />
          <Link to="/listings" className="inline-block rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors">
            Find a home
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((i) => (
            <li key={i.id} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                {i.listingImage && (
                  <Link to={`/listings/${i.listingId}`} className="shrink-0 overflow-hidden rounded-xl bg-sand">
                    <img src={i.listingImage} alt="" className="h-18 w-24 object-cover hover:scale-105 transition-transform" />
                  </Link>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/listings/${i.listingId}`} className="font-medium hover:text-forest transition-colors">
                        {i.listingTitle}
                      </Link>
                      <p className="text-sm text-ink/60">
                        {i.listingCity} · <span className="capitalize">{i.listingType}</span> · {formatPrice({ price: i.listingPrice, listingType: i.listingType })}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[i.status] || 'bg-sand text-ink/70'}`}>
                      {i.status}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl bg-cream/50 p-3 text-sm leading-relaxed text-ink/90">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-1">Your message</p>
                    {i.message}
                  </div>
                  {i.ownerReply && (
                    <div className="mt-3 rounded-xl bg-forest/5 border border-forest/20 p-3 text-sm leading-relaxed text-ink/90">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-forest mb-1">
                        <span>Owner's Response</span>
                        <span className="text-ink/40 font-normal">{i.repliedAt ? new Date(i.repliedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-ink font-medium">{i.ownerReply}</p>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-ink/40">Sent {i.createdAt}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
