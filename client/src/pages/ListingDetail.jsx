import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AMENITY_LABELS, api, formatAddress, formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../toast.jsx';
import { ListingCard } from '../ListingCard.jsx';

export function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [lightbox, setLightbox] = useState(false);

  // Mortgage Calculator State (for sale)
  const [downPercent, setDownPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);

  useEffect(() => {
    api(`/api/listings/${id}`)
      .then((d) => {
        setListing(d.listing);
        setForm((f) => ({
          ...f,
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
        }));

        // Fetch similar listings in same city/type
        api(`/api/listings?city=${encodeURIComponent(d.listing.city)}&listingType=${d.listing.listingType}&pageSize=4`)
          .then((res) => {
            setSimilar((res.items || []).filter((item) => item.id !== d.listing.id).slice(0, 3));
          })
          .catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, [id, user]);

  const mortgageCalc = useMemo(() => {
    if (!listing || listing.listingType !== 'sale') return null;
    const price = Number(listing.price) || 0;
    const downAmount = Math.round(price * (downPercent / 100));
    const loanAmount = Math.max(price - downAmount, 0);
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTermYears * 12;
    const monthlyPrincipalInterest =
      monthlyRate > 0 && loanAmount > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
          (Math.pow(1 + monthlyRate, totalMonths) - 1)
        : loanAmount / (totalMonths || 1);
    const monthlyTax = Math.round((price * 0.012) / 12);
    const monthlyInsurance = 110;
    const totalMonthly = Math.round(monthlyPrincipalInterest + monthlyTax + monthlyInsurance);

    return {
      downAmount,
      loanAmount,
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest),
      monthlyTax,
      monthlyInsurance,
      totalMonthly,
    };
  }, [listing, downPercent, loanTermYears, interestRate]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Listing not found</h1>
        <p className="mt-2 text-ink/60">{error}</p>
        <Link to="/listings" className="mt-6 inline-block text-forest">
          Back to listings
        </Link>
      </div>
    );
  }
  if (!listing) return <p className="p-10 text-center text-ink/50">Loading listing…</p>;

  const images = listing.imageUrls || [];
  const pricePerSqft = listing.areaSqft ? Math.round(listing.price / listing.areaSqft) : null;

  async function toggleSave() {
    if (!user) return navigate('/login', { state: { from: `/listings/${listing.id}` } });
    if (listing.saved) {
      await api(`/api/listings/${listing.id}/save`, { method: 'DELETE' });
      setListing({ ...listing, saved: false });
      toast.push('Removed from saved');
    } else {
      await api(`/api/listings/${listing.id}/save`, { method: 'POST' });
      setListing({ ...listing, saved: true });
      toast.push('Saved to your list');
    }
  }

  function shareListing() {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.push('Listing link copied to clipboard!');
    }
  }

  async function inquire(e) {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: `/listings/${listing.id}` } });
    setSending(true);
    try {
      await api(`/api/listings/${listing.id}/inquiries`, { method: 'POST', body: form });
      toast.push('Inquiry sent to the owner');
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-3">
          <div
            className="group relative overflow-hidden rounded-2xl bg-sand cursor-pointer"
            onClick={() => images.length > 0 && setLightbox(true)}
          >
            {images[idx] ? (
              <img src={images[idx]} alt="" className="aspect-[16/10] w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center text-sm text-ink/40">No photo</div>
            )}
            {images.length > 0 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-white backdrop-blur">
                Click to view full photo ({idx + 1}/{images.length})
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button key={src + i} type="button" onClick={() => setIdx(i)} className="shrink-0">
                <img
                  src={src}
                  alt=""
                  className={`h-16 w-24 rounded-lg object-cover transition-all ${
                    i === idx ? 'ring-2 ring-forest scale-[1.03]' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Listing Header & Contact */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold uppercase text-forest">
              {listing.listingType === 'rent' ? 'For rent' : 'For sale'} · {listing.propertyType}
            </span>
            {listing.featured ? (
              <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-cream">
                Featured
              </span>
            ) : null}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl leading-tight">{listing.title}</h1>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-medium text-forest">{formatPrice(listing)}</p>
            {pricePerSqft && (
              <span className="text-sm font-normal text-ink/50">
                ${pricePerSqft.toLocaleString()}/sqft
              </span>
            )}
          </div>

          <p className="text-ink/70">{formatAddress(listing)}</p>
          <p className="text-sm text-ink/80">
            {listing.bedrooms} beds · {listing.bathrooms} baths · {listing.areaSqft?.toLocaleString()} sqft · Built{' '}
            {listing.yearBuilt || 'N/A'} {listing.parking ? `· ${listing.parking} parking` : ''}
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={toggleSave}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                listing.saved
                  ? 'border-forest bg-forest text-white'
                  : 'border-forest/30 bg-white text-forest hover:border-forest'
              }`}
            >
              {listing.saved ? '♥ Saved to list' : '♡ Save listing'}
            </button>
            <button
              type="button"
              onClick={shareListing}
              className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-ink/70 hover:border-forest/40 transition-colors"
            >
              Share ↗
            </button>
            {listing.status !== 'available' && (
              <span className="self-center rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink/70">
                {listing.status}
              </span>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 border border-sand shadow-sm">
            <p className="font-medium text-lg">Inquire directly with owner</p>
            <p className="text-xs text-ink/60 mt-0.5">
              Listed by {listing.contactName || listing.ownerName} {listing.contactEmail ? `· ${listing.contactEmail}` : ''}
            </p>
            <form className="mt-3 space-y-2" onSubmit={inquire}>
              <input
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm outline-none focus:border-forest"
                placeholder="Your name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm outline-none focus:border-forest"
                placeholder="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm outline-none focus:border-forest"
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <textarea
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm outline-none focus:border-forest"
                rows="3"
                required
                placeholder="I am interested in this home and would like to schedule a tour…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button
                disabled={sending}
                className="w-full rounded-full bg-forest py-2.5 text-sm font-medium text-white shadow-sm hover:bg-moss transition-colors disabled:opacity-50"
                type="submit"
              >
                {sending ? 'Sending…' : 'Send inquiry to owner'}
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Detail Sections: Description & Location */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="font-serif text-2xl">About this home</h2>
            <p className="mt-3 leading-relaxed text-ink/80 whitespace-pre-line">{listing.description}</p>
          </div>

          <div>
            <h3 className="font-medium text-lg">Property Amenities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(listing.amenities || []).map((a) => (
                <span key={a} className="rounded-full bg-white border border-sand px-3.5 py-1 text-sm text-ink/80 shadow-xs">
                  ✓ {AMENITY_LABELS[a] || a}
                </span>
              ))}
              {listing.furnished && (
                <span className="rounded-full bg-white border border-sand px-3.5 py-1 text-sm text-ink/80 shadow-xs">
                  ✓ Furnished
                </span>
              )}
            </div>
          </div>

          {/* Affordability & Mortgage Calculator */}
          {listing.listingType === 'sale' && mortgageCalc && (
            <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-sand pb-4">
                <div>
                  <h3 className="font-serif text-2xl">Estimated Monthly Payment</h3>
                  <p className="text-xs text-ink/50">Principal, interest, taxes & insurance</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl font-semibold text-forest">
                    ${mortgageCalc.totalMonthly.toLocaleString()}
                    <span className="text-sm font-sans font-normal text-ink/50">/mo</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-ink/70 block mb-1">
                    Down Payment: {downPercent}% (${mortgageCalc.downAmount.toLocaleString()})
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    className="w-full accent-forest"
                    value={downPercent}
                    onChange={(e) => setDownPercent(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink/70 block mb-1">Loan Term</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[30, 15].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setLoanTermYears(term)}
                        className={`rounded-xl border py-1.5 text-xs font-medium transition-colors ${
                          loanTermYears === term
                            ? 'border-forest bg-forest text-white'
                            : 'border-sand bg-white text-ink/70 hover:border-forest/40'
                        }`}
                      >
                        {term} years
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink/70 block mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="15"
                    className="w-full rounded-xl border border-sand bg-white px-3 py-1.5 text-xs outline-none focus:border-forest"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3 rounded-xl bg-cream/40 p-4 text-xs text-ink/70">
                <div>
                  <span className="text-ink/40 block">Principal & Interest:</span>
                  <span className="font-semibold text-ink text-sm">${mortgageCalc.monthlyPrincipalInterest.toLocaleString()}/mo</span>
                </div>
                <div>
                  <span className="text-ink/40 block">Est. Property Taxes:</span>
                  <span className="font-semibold text-ink text-sm">${mortgageCalc.monthlyTax.toLocaleString()}/mo</span>
                </div>
                <div>
                  <span className="text-ink/40 block">Est. Homeowners Insurance:</span>
                  <span className="font-semibold text-ink text-sm">${mortgageCalc.monthlyInsurance}/mo</span>
                </div>
              </div>
            </div>
          )}

          {listing.listingType === 'rent' && (
            <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
              <h3 className="font-serif text-2xl">Rental Move-in Breakdown</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-cream/40 p-3">
                  <p className="text-xs text-ink/50">Monthly Rent</p>
                  <p className="text-lg font-semibold text-forest mt-0.5">${Number(listing.price).toLocaleString()}/mo</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3">
                  <p className="text-xs text-ink/50">Security Deposit</p>
                  <p className="text-lg font-semibold text-ink mt-0.5">${Number(listing.price).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3">
                  <p className="text-xs text-ink/50">Est. Total Move-In</p>
                  <p className="text-lg font-semibold text-forest mt-0.5">${(Number(listing.price) * 2).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <h3 className="font-medium text-lg">Location</h3>
            <p className="mt-2 text-sm text-ink/70">{formatAddress(listing)}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(listing))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-forest/10 border border-forest/20 p-3 text-sm font-medium text-forest hover:bg-forest/20 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps ↗
            </a>
          </div>

          <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <h3 className="font-medium text-lg">Owner Direct Advantage</h3>
            <ul className="mt-3 space-y-2 text-xs text-ink/70 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-forest font-bold">✓</span> No agent fees or broker commissions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest font-bold">✓</span> Direct communication with the landlord / homeowner
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest font-bold">✓</span> Faster tour scheduling and response times
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similar.length > 0 && (
        <div className="mt-16 border-t border-sand pt-10">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <h2 className="font-serif text-3xl">Similar homes in {listing.city}</h2>
              <p className="text-sm text-ink/60 mt-1">Other available {listing.listingType} properties you might like</p>
            </div>
            <Link to={`/listings?city=${encodeURIComponent(listing.city)}&listingType=${listing.listingType}`} className="text-sm font-medium text-forest hover:underline">
              View all in {listing.city} →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <ListingCard key={s.id} listing={s} />
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-h-screen max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={images[idx]} alt="" className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-lg font-bold text-white/80 hover:text-white"
            >
              ✕ Close
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/90"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => setIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-black/90"
                >
                  ▶
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
