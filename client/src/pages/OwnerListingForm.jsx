import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AMENITY_LABELS, api } from '../api.js';
import { useToast } from '../toast.jsx';

const field = 'w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm';
const amenityKeys = Object.keys(AMENITY_LABELS);

const blank = {
  title: '',
  description: '',
  listingType: 'rent',
  propertyType: 'house',
  status: 'available',
  price: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'USA',
  bedrooms: 2,
  bathrooms: 1,
  areaSqft: '',
  yearBuilt: '',
  parking: 1,
  furnished: false,
  amenities: [],
  imageUrls: ['', '', '', ''],
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export function OwnerListingForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/api/owner/listings/${id}`)
      .then(({ listing }) => {
        setForm({
          ...blank,
          ...listing,
          imageUrls: [...(listing.imageUrls || []), '', '', '', ''].slice(0, 8),
        });
      })
      .catch((e) => toast.push(e.message, 'err'));
  }, [editing, id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAmenity(key) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      price: Number(form.price),
      imageUrls: form.imageUrls.filter(Boolean),
    };
    try {
      if (editing) {
        await api(`/api/owner/listings/${id}`, { method: 'PUT', body: payload });
        toast.push('Listing updated');
      } else {
        await api('/api/owner/listings', { method: 'POST', body: payload });
        toast.push('Listing published');
      }
      navigate('/owner/listings');
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl">{editing ? 'Edit listing' : 'New listing'}</h1>
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <input className={field} required placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <textarea
          className={field}
          rows="6"
          required
          minLength={40}
          placeholder="Description (at least 40 characters)"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <select className={field} value={form.listingType} onChange={(e) => set('listingType', e.target.value)}>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
          <select className={field} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            {['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className={field} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {['available', 'pending', 'rented', 'sold', 'withdrawn'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={field} type="number" required placeholder="Price" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <input className={field} required placeholder="Street address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          <input className={field} required placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
          <input className={field} required placeholder="State / region" value={form.state} onChange={(e) => set('state', e.target.value)} />
          <input className={field} placeholder="Postal code" value={form.postalCode || ''} onChange={(e) => set('postalCode', e.target.value)} />
          <input className={field} placeholder="Country" value={form.country} onChange={(e) => set('country', e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Beds</label>
            <input className={field} type="number" min="0" placeholder="Beds" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Baths</label>
            <input className={field} type="number" min="0" step="0.5" placeholder="Baths" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Parking</label>
            <input className={field} type="number" min="0" placeholder="Parking spots" value={form.parking} onChange={(e) => set('parking', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Sqft</label>
            <input className={field} type="number" placeholder="Sqft" value={form.areaSqft || ''} onChange={(e) => set('areaSqft', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Year built</label>
            <input className={field} type="number" placeholder="Year" value={form.yearBuilt || ''} onChange={(e) => set('yearBuilt', e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm py-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.furnished} onChange={(e) => set('furnished', e.target.checked)} className="rounded text-forest" />
            Furnished
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} className="rounded text-forest" />
            Featured listing (spotlight on homepage)
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {amenityKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleAmenity(key)}
                className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                  form.amenities.includes(key) ? 'bg-forest text-white border-forest' : 'bg-white border-sand hover:border-forest/40'
                }`}
              >
                {AMENITY_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Photos (up to 8 image URLs)</p>
            {form.imageUrls.length < 8 && (
              <button
                type="button"
                onClick={() => set('imageUrls', [...form.imageUrls, ''])}
                className="text-xs font-medium text-forest hover:underline"
              >
                + Add photo URL
              </button>
            )}
          </div>
          <div className="space-y-2">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                {url ? (
                  <img
                    src={url}
                    alt=""
                    className="h-10 w-14 rounded-lg object-cover bg-sand shrink-0 border border-sand"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-10 w-14 rounded-lg bg-sand/60 flex items-center justify-center text-[10px] text-ink/30 shrink-0">
                    Photo {i + 1}
                  </div>
                )}
                <input
                  className={`${field} flex-1`}
                  placeholder={`https://images.unsplash.com/... or image URL`}
                  value={url}
                  onChange={(e) => {
                    const next = [...form.imageUrls];
                    next[i] = e.target.value;
                    set('imageUrls', next);
                  }}
                />
                {form.imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.imageUrls.filter((_, idx) => idx !== i);
                      set('imageUrls', next);
                    }}
                    className="p-2 text-ink/40 hover:text-red-700"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={field} placeholder="Contact name" value={form.contactName || ''} onChange={(e) => set('contactName', e.target.value)} />
          <input className={field} placeholder="Contact phone" value={form.contactPhone || ''} onChange={(e) => set('contactPhone', e.target.value)} />
          <input className={field} placeholder="Contact email" value={form.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} />
        </div>
        <button disabled={busy} className="rounded-full bg-forest px-6 py-3 text-white" type="submit">
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}
