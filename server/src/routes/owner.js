import { Router } from 'express';
import { db, mapInquiry, mapListing } from '../db.js';
import { requireAuth, requireOwner } from '../auth.js';

const AMENITY_SET = new Set([
  'parking',
  'pool',
  'gym',
  'garden',
  'ac',
  'elevator',
  'petFriendly',
  'balcony',
  'fireplace',
  'washerDryer',
  'security',
  'furnished',
]);

const LISTING_TYPES = new Set(['rent', 'sale']);
const PROPERTY_TYPES = new Set(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']);
const STATUSES = new Set(['available', 'pending', 'rented', 'sold', 'withdrawn']);

function listingPayload(body, user) {
  const errors = [];
  const title = body.title?.trim();
  const description = body.description?.trim();
  if (!title) errors.push('Title is required.');
  if (!description || description.length < 40) errors.push('Write a description of at least 40 characters.');
  if (!LISTING_TYPES.has(body.listingType)) errors.push('Listing type must be rent or sale.');
  if (!PROPERTY_TYPES.has(body.propertyType)) errors.push('Choose a valid property type.');
  const status = body.status || 'available';
  if (!STATUSES.has(status)) errors.push('Invalid status.');
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) errors.push('Enter a valid price.');
  if (!body.address?.trim()) errors.push('Address is required.');
  if (!body.city?.trim()) errors.push('City is required.');
  if (!body.state?.trim()) errors.push('State / region is required.');

  const amenities = Array.isArray(body.amenities)
    ? body.amenities.filter((a) => AMENITY_SET.has(a))
    : [];
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((u) => String(u).trim()).filter(Boolean).slice(0, 8)
    : [];

  return {
    errors,
    values: {
      title,
      description,
      listing_type: body.listingType,
      property_type: body.propertyType,
      status,
      price,
      currency: body.currency || 'USD',
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      postal_code: body.postalCode?.trim() || null,
      country: body.country?.trim() || 'USA',
      bedrooms: Number(body.bedrooms) || 0,
      bathrooms: Number(body.bathrooms) || 0,
      area_sqft: body.areaSqft ? Number(body.areaSqft) : null,
      year_built: body.yearBuilt ? Number(body.yearBuilt) : null,
      parking: Number(body.parking) || 0,
      furnished: body.furnished ? 1 : 0,
      amenities: JSON.stringify(amenities),
      image_urls: JSON.stringify(imageUrls),
      contact_name: body.contactName?.trim() || user.name,
      contact_phone: body.contactPhone?.trim() || user.phone,
      contact_email: body.contactEmail?.trim() || user.email,
      featured: body.featured ? 1 : 0,
    },
  };
}

export const ownerRouter = Router();
ownerRouter.use(requireOwner);

ownerRouter.get('/dashboard', (req, res) => {
  const ownerId = req.user.id;
  const listings = db.prepare('SELECT COUNT(*) AS n FROM listings WHERE owner_id = ?').get(ownerId).n;
  const active = db
    .prepare("SELECT COUNT(*) AS n FROM listings WHERE owner_id = ? AND status = 'available'")
    .get(ownerId).n;
  const pendingInquiries = db
    .prepare(
      `SELECT COUNT(*) AS n FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       WHERE l.owner_id = ? AND i.status = 'new'`
    )
    .get(ownerId).n;
  const totalInquiries = db
    .prepare(
      `SELECT COUNT(*) AS n FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       WHERE l.owner_id = ?`
    )
    .get(ownerId).n;

  const recent = db
    .prepare(
      `SELECT l.*, u.name AS owner_name FROM listings l
       JOIN users u ON u.id = l.owner_id
       WHERE l.owner_id = ?
       ORDER BY l.updated_at DESC LIMIT 5`
    )
    .all(ownerId);

  res.json({
    stats: { listings, active, pendingInquiries, totalInquiries },
    recent: recent.map((r) => mapListing(r)),
  });
});

ownerRouter.get('/listings', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, u.name AS owner_name FROM listings l
       JOIN users u ON u.id = l.owner_id
       WHERE l.owner_id = ?
       ORDER BY l.created_at DESC`
    )
    .all(req.user.id);
  res.json({ items: rows.map((r) => mapListing(r)) });
});

ownerRouter.get('/listings/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT l.*, u.name AS owner_name FROM listings l
       JOIN users u ON u.id = l.owner_id
       WHERE l.id = ? AND l.owner_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ listing: mapListing(row) });
});

ownerRouter.post('/listings', (req, res) => {
  const { errors, values } = listingPayload(req.body || {}, req.user);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const info = db
    .prepare(
      `INSERT INTO listings (
        owner_id, title, description, listing_type, property_type, status, price, currency,
        address, city, state, postal_code, country, bedrooms, bathrooms, area_sqft, year_built,
        parking, furnished, amenities, image_urls, contact_name, contact_phone, contact_email, featured
      ) VALUES (
        @owner_id, @title, @description, @listing_type, @property_type, @status, @price, @currency,
        @address, @city, @state, @postal_code, @country, @bedrooms, @bathrooms, @area_sqft, @year_built,
        @parking, @furnished, @amenities, @image_urls, @contact_name, @contact_phone, @contact_email, @featured
      )`
    )
    .run({ ...values, owner_id: req.user.id });

  const row = db
    .prepare(
      `SELECT l.*, u.name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json({ listing: mapListing(row) });
});

ownerRouter.put('/listings/:id', (req, res) => {
  const existing = db
    .prepare('SELECT id FROM listings WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found.' });

  const { errors, values } = listingPayload(req.body || {}, req.user);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  db.prepare(
    `UPDATE listings SET
      title=@title, description=@description, listing_type=@listing_type, property_type=@property_type,
      status=@status, price=@price, currency=@currency, address=@address, city=@city, state=@state,
      postal_code=@postal_code, country=@country, bedrooms=@bedrooms, bathrooms=@bathrooms,
      area_sqft=@area_sqft, year_built=@year_built, parking=@parking, furnished=@furnished,
      amenities=@amenities, image_urls=@image_urls, contact_name=@contact_name,
      contact_phone=@contact_phone, contact_email=@contact_email, featured=@featured,
      updated_at=datetime('now')
     WHERE id=@id AND owner_id=@owner_id`
  ).run({ ...values, id: existing.id, owner_id: req.user.id });

  const row = db
    .prepare(
      `SELECT l.*, u.name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = ?`
    )
    .get(existing.id);
  res.json({ listing: mapListing(row) });
});

ownerRouter.patch('/listings/:id/status', (req, res) => {
  const status = req.body?.status;
  if (!STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const existing = db
    .prepare('SELECT id FROM listings WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found.' });

  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, existing.id);
  const updated = db
    .prepare('SELECT l.*, u.name AS owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = ?')
    .get(existing.id);
  res.json({ listing: mapListing(updated) });
});

ownerRouter.delete('/listings/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM listings WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ ok: true });
});

ownerRouter.get('/inquiries', (req, res) => {
  const rows = db
    .prepare(
      `SELECT i.*, l.title AS listing_title, l.city AS listing_city, l.listing_type,
              l.price AS listing_price, l.image_urls
       FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       WHERE l.owner_id = ?
       ORDER BY i.created_at DESC`
    )
    .all(req.user.id);
  res.json({ items: rows.map(mapInquiry) });
});

ownerRouter.patch('/inquiries/:id', (req, res) => {
  const { status, reply } = req.body || {};
  if (status && !['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid inquiry status.' });
  }
  const row = db
    .prepare(
      `SELECT i.* FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       WHERE i.id = ? AND l.owner_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Inquiry not found.' });

  const nextStatus = reply ? 'replied' : (status || row.status);
  const nextReply = reply !== undefined ? (reply?.trim() || null) : row.owner_reply;
  const nextRepliedAt = reply ? new Date().toISOString() : row.replied_at;

  db.prepare(
    'UPDATE inquiries SET status = ?, owner_reply = ?, replied_at = ? WHERE id = ?'
  ).run(nextStatus, nextReply, nextRepliedAt, row.id);

  const updated = db
    .prepare(
      `SELECT i.*, l.title AS listing_title, l.city AS listing_city, l.listing_type,
              l.price AS listing_price, l.image_urls
       FROM inquiries i JOIN listings l ON l.id = i.listing_id WHERE i.id = ?`
    )
    .get(row.id);
  res.json({ inquiry: mapInquiry(updated) });
});

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/inquiries', (req, res) => {
  const rows = db
    .prepare(
      `SELECT i.*, l.title AS listing_title, l.city AS listing_city, l.listing_type,
              l.price AS listing_price, l.image_urls
       FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       WHERE i.buyer_id = ?
       ORDER BY i.created_at DESC`
    )
    .all(req.user.id);
  res.json({ items: rows.map(mapInquiry) });
});

meRouter.get('/saved', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM saved_listings s
       JOIN listings l ON l.id = s.listing_id
       JOIN users u ON u.id = l.owner_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`
    )
    .all(req.user.id);
  res.json({ items: rows.map((r) => mapListing(r, { saved: true })) });
});
