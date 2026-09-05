export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function formatPrice(listing) {
  const n = Number(listing.price).toLocaleString();
  return listing.listingType === 'rent' ? `$${n}/mo` : `$${n}`;
}

export function formatAddress(listing) {
  return `${listing.address}, ${listing.city}, ${listing.state} ${listing.postalCode || ''}`.trim();
}

export const AMENITY_LABELS = {
  parking: 'Parking',
  pool: 'Pool',
  gym: 'Gym',
  garden: 'Garden',
  ac: 'Air conditioning',
  elevator: 'Elevator',
  petFriendly: 'Pet friendly',
  balcony: 'Balcony',
  fireplace: 'Fireplace',
  washerDryer: 'Washer / dryer',
  security: 'Security',
  furnished: 'Furnished',
};
