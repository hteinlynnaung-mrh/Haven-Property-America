import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { ListingCard, EmptyState } from '../ListingCard.jsx';

export function Home() {
  const [featured, setFeatured] = useState([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api('/api/listings/featured'), api('/api/listings/meta')])
      .then(([f, m]) => {
        setFeatured(f.items);
        setCities(m.cities);
      })
      .finally(() => setLoading(false));
  }, []);

  function search(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    navigate(`/listings?${params.toString()}`);
  }

  return (
    <div>
      <section className="bg-forest text-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm uppercase tracking-[0.2em] text-cream/70">Classifieds for real homes</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight md:text-6xl">
            Find a place to rent or buy — straight from the owner.
          </h1>
          <form onSubmit={search} className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 text-ink shadow-lg md:flex-row">
            <input
              className="flex-1 rounded-xl px-4 py-3 outline-none"
              placeholder="Search neighborhood, address, or keyword"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="rounded-xl bg-cream px-4 py-3" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-ink px-6 py-3 font-medium text-white" type="submit">
              Search
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/listings?listingType=rent" className="rounded-full border border-cream/40 px-4 py-1.5 text-sm">
              Browse rentals
            </Link>
            <Link to="/listings?listingType=sale" className="rounded-full border border-cream/40 px-4 py-1.5 text-sm">
              Homes for sale
            </Link>
            <Link to="/register?role=owner" className="rounded-full bg-cream/15 px-4 py-1.5 text-sm">
              List your property
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl">Featured listings</h2>
            <p className="text-ink/60">Hand-picked rentals and homes on the market now.</p>
          </div>
          <Link to="/listings" className="text-sm font-medium text-forest">
            View all
          </Link>
        </div>
        {loading ? (
          <p className="text-ink/50">Loading listings…</p>
        ) : featured.length === 0 ? (
          <EmptyState title="No featured homes yet" body="Run the seed script to load sample listings." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
