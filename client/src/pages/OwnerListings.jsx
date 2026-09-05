import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useToast } from '../toast.jsx';
import { EmptyState } from '../ListingCard.jsx';

export function OwnerListings() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  function load() {
    api('/api/owner/listings').then((d) => setItems(d.items));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api(`/api/owner/listings/${id}`, { method: 'DELETE' });
      toast.push('Listing deleted');
      load();
    } catch (err) {
      toast.push(err.message, 'err');
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      await api(`/api/owner/listings/${id}/status`, { method: 'PATCH', body: { status: newStatus } });
      toast.push(`Status updated to ${newStatus}`);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
    } catch (err) {
      toast.push(err.message, 'err');
    }
  }

  const filtered = items.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: items.length,
    available: items.filter((i) => i.status === 'available').length,
    pending: items.filter((i) => i.status === 'pending').length,
    rented: items.filter((i) => i.status === 'rented').length,
    sold: items.filter((i) => i.status === 'sold').length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Your listings</h1>
          <p className="mt-1 text-sm text-ink/60">Manage your real estate listings, status, and pricing</p>
        </div>
        <Link to="/owner/listings/new" className="rounded-full bg-forest px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors">
          + Add new listing
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-sand pb-4">
        <div className="flex flex-wrap gap-1.5">
          {['all', 'available', 'pending', 'rented', 'sold'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === st ? 'bg-forest text-white' : 'border border-sand bg-white text-ink/70 hover:border-forest/40'
              }`}
            >
              {st} ({counts[st] ?? items.filter((x) => x.status === st).length})
            </button>
          ))}
        </div>
        <input
          className="rounded-xl border border-sand bg-white px-3 py-1.5 text-xs outline-none placeholder:text-ink/40 w-48"
          placeholder="Filter by title or city…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No listings match"
            body={items.length === 0 ? 'Create your first rent or sale listing.' : 'Try changing your status or search filter.'}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-sand bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream/70 text-xs uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Quick Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-sand hover:bg-cream/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.imageUrls?.[0] ? (
                        <img src={l.imageUrls[0]} alt="" className="h-10 w-14 rounded-lg object-cover bg-sand shrink-0" />
                      ) : (
                        <div className="h-10 w-14 rounded-lg bg-sand flex items-center justify-center text-[10px] text-ink/40 shrink-0">No img</div>
                      )}
                      <div>
                        <p className="font-medium text-ink line-clamp-1">{l.title}</p>
                        <p className="text-xs text-ink/50">{l.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink/80">
                    <span className="font-medium">{l.listingType}</span> · {l.propertyType}
                  </td>
                  <td className="px-4 py-3 text-ink/80">{l.city}, {l.state}</td>
                  <td className="px-4 py-3 font-medium text-forest">{formatPrice(l)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      className="rounded-lg border border-sand bg-cream/40 px-2 py-1 text-xs font-medium capitalize outline-none cursor-pointer hover:border-forest/40"
                    >
                      {['available', 'pending', 'rented', 'sold', 'withdrawn'].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link to={`/listings/${l.id}`} className="mr-3 text-xs font-medium text-forest hover:underline">
                      View
                    </Link>
                    <Link to={`/owner/listings/${l.id}/edit`} className="mr-3 text-xs font-medium text-ink/70 hover:text-ink hover:underline">
                      Edit
                    </Link>
                    <button type="button" className="text-xs font-medium text-red-700 hover:text-red-900" onClick={() => remove(l.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
