import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { EmptyState, ListingCard } from '../ListingCard.jsx';
import { useToast } from '../toast.jsx';

export function Saved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api('/api/me/saved')
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id) {
    try {
      await api(`/api/listings/${id}/save`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.push('Removed from saved');
    } catch (err) {
      toast.push(err.message, 'err');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-4xl">Saved listings</h1>
          <p className="mt-1 text-sm text-ink/60">Homes you have bookmarked to revisit</p>
        </div>
        {items.length > 0 && (
          <span className="text-sm text-ink/50">{items.length} saved</span>
        )}
      </div>
      {loading ? (
        <p className="mt-6 text-ink/50">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 space-y-4 text-center">
          <EmptyState title="Nothing saved yet" body="Browse properties and tap the save button to keep your favorites here." />
          <Link to="/listings" className="inline-block rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors">
            Browse available homes
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
