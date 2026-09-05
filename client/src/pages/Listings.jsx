import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { EmptyState, ListingCard } from '../ListingCard.jsx';

const input = 'w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm';

export function Listings() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [meta, setMeta] = useState({ cities: [], propertyTypes: [] });
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const [keyword, setKeyword] = useState(query.q || '');
  const [minPrice, setMinPrice] = useState(query.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(query.maxPrice || '');

  useEffect(() => {
    setKeyword(query.q || '');
    setMinPrice(query.minPrice || '');
    setMaxPrice(query.maxPrice || '');
  }, [query.q, query.minPrice, query.maxPrice]);

  useEffect(() => {
    api('/api/listings/meta').then(setMeta);
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams(params);
    if (!qs.get('page')) qs.set('page', '1');
    api(`/api/listings?${qs.toString()}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params]);

  function set(key, value) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  }

  function clearAllFilters() {
    setParams(new URLSearchParams());
  }

  const hasActiveFilters = Array.from(params.keys()).some((k) => k !== 'page' && k !== 'sort');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Browse listings</h1>
          <p className="mt-1 text-ink/60">{data.total} homes matching your filters</p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-full border border-sand bg-white px-4 py-1.5 text-xs font-medium text-ink/70 hover:border-forest hover:text-forest transition-colors"
          >
            Clear all filters ✕
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-sand bg-white p-4 md:grid-cols-4 lg:grid-cols-6">
        <input
          className={`${input} md:col-span-2`}
          placeholder="Keyword or address"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onBlur={() => set('q', keyword)}
          onKeyDown={(e) => e.key === 'Enter' && set('q', keyword)}
        />
        <select className={input} value={query.listingType || ''} onChange={(e) => set('listingType', e.target.value)}>
          <option value="">Rent or sale</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
        <select className={input} value={query.propertyType || ''} onChange={(e) => set('propertyType', e.target.value)}>
          <option value="">Any type</option>
          {meta.propertyTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select className={input} value={query.city || ''} onChange={(e) => set('city', e.target.value)}>
          <option value="">Any city</option>
          {meta.cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
            </option>
          ))}
        </select>
        <select className={input} value={query.minBeds || ''} onChange={(e) => set('minBeds', e.target.value)}>
          <option value="">Beds</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+ beds
            </option>
          ))}
        </select>
        <select className={input} value={query.minBaths || ''} onChange={(e) => set('minBaths', e.target.value)}>
          <option value="">Baths</option>
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n}+ baths
            </option>
          ))}
        </select>
        <input
          className={input}
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={() => set('minPrice', minPrice)}
          onKeyDown={(e) => e.key === 'Enter' && set('minPrice', minPrice)}
        />
        <input
          className={input}
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onBlur={() => set('maxPrice', maxPrice)}
          onKeyDown={(e) => e.key === 'Enter' && set('maxPrice', maxPrice)}
        />
        <select className={input} value={query.furnished || ''} onChange={(e) => set('furnished', e.target.value)}>
          <option value="">Furnished?</option>
          <option value="true">Furnished only</option>
        </select>
        <select className={input} value={query.sort || 'newest'} onChange={(e) => set('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="beds">Most bedrooms</option>
        </select>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-ink/50">Loading…</p>
        ) : data.items.length === 0 ? (
          <EmptyState title="No listings match" body="Try clearing a filter or searching another city." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      {data.pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('page', String(p));
                setParams(next);
              }}
              className={`h-10 w-10 rounded-full text-sm ${
                data.page === p ? 'bg-forest text-white' : 'bg-white border border-sand'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
