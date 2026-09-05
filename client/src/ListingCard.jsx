import { Link } from 'react-router-dom';
import { formatPrice } from './api.js';

export function ListingCard({ listing, onRemove }) {
  const img = listing.imageUrls?.[0];
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/listings/${listing.id}`} className="block relative aspect-[4/3] overflow-hidden bg-sand">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink/40">No photo</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-forest shadow-sm backdrop-blur">
            {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
          </span>
          {listing.featured ? (
            <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cream shadow-sm">
              Featured
            </span>
          ) : null}
          {listing.status && listing.status !== 'available' ? (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {listing.status}
            </span>
          ) : null}
        </div>
      </Link>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(listing.id);
          }}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink/70 hover:text-red-700 hover:bg-white shadow-sm transition-colors"
          title="Remove from saved"
        >
          <svg className="h-4 w-4 fill-current text-red-600" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      )}
      <Link to={`/listings/${listing.id}`} className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-1">
          <p className="font-serif text-xl font-medium text-forest">{formatPrice(listing)}</p>
          <h3 className="line-clamp-2 font-medium leading-snug text-ink group-hover:text-forest transition-colors">
            {listing.title}
          </h3>
          <p className="text-sm text-ink/60">
            {listing.city}, {listing.state}
          </p>
        </div>
        <p className="mt-3 text-sm text-ink/70">
          {listing.bedrooms} bd · {listing.bathrooms} ba · {listing.areaSqft ? `${listing.areaSqft.toLocaleString()} sqft` : 'N/A'}
        </p>
      </Link>
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-forest/20 bg-white px-6 py-16 text-center">
      <p className="font-serif text-2xl text-forest">{title}</p>
      {body && <p className="mt-2 text-ink/60">{body}</p>}
    </div>
  );
}
