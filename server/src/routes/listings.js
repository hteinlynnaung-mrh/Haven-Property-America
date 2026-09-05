import { Router } from 'express';
import { db, mapListing } from '../db.js';
import { optionalAuth, requireAuth } from '../auth.js';

export const listingsRouter = Router();

const SORTS = {
  newest: 'l.created_at DESC',
  price_asc: 'l.price ASC',
  price_desc: 'l.price DESC',
  beds: 'l.bedrooms DESC',
};

listingsRouter.get('/', (req, res) => {
  const {
    q,
    listingType,
    propertyType,
    city,
    minPrice,
    maxPrice,
    minBeds,
    minBaths,
    furnished,
    status,
    sort = 'newest',
    page = '1',
    pageSize = '12',
  } = req.query;

  const where = [];
  const params = {};

  if (status) {
    where.push('l.status = @status');
    params.status = status;
  } else {
    where.push("l.status = 'available'");
  }

  if (listingType && ['rent', 'sale'].includes(listingType)) {
    where.push('l.listing_type = @listingType');
    params.listingType = listingType;
  }
  if (propertyType) {
    where.push('l.property_type = @propertyType');
    params.propertyType = propertyType;
  }
  if (city) {
    where.push('l.city = @city');
    params.city = city;
  }
  if (minPrice) {
    where.push('l.price >= @minPrice');
    params.minPrice = Number(minPrice);
  }
  if (maxPrice) {
    where.push('l.price <= @maxPrice');
    params.maxPrice = Number(maxPrice);
  }
  if (minBeds) {
    where.push('l.bedrooms >= @minBeds');
    params.minBeds = Number(minBeds);
  }
  if (minBaths) {
    where.push('l.bathrooms >= @minBaths');
    params.minBaths = Number(minBaths);
  }
  if (furnished === 'true' || furnished === '1') {
    where.push('l.furnished = 1');
  }
  if (q?.trim()) {
    where.push(
      '(l.title LIKE @q OR l.address LIKE @q OR l.description LIKE @q OR l.city LIKE @q)'
    );
    params.q = `%${q.trim()}%`;
  }

  const order = SORTS[sort] || SORTS.newest;
  const size = Math.min(Math.max(Number(pageSize) || 12, 1), 48);
  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * size;
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM listings l ${clause}`).get(params).n;
  const rows = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM listings l
       JOIN users u ON u.id = l.owner_id
       ${clause}
       ORDER BY ${order}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: size, offset });

  res.json({
    items: rows.map((r) => mapListing(r)),
    total,
    page: pageNum,
    pageSize: size,
    pages: Math.ceil(total / size),
  });
});

listingsRouter.get('/featured', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM listings l
       JOIN users u ON u.id = l.owner_id
       WHERE l.featured = 1 AND l.status = 'available'
       ORDER BY l.created_at DESC
       LIMIT 12`
    )
    .all();
  res.json({ items: rows.map((r) => mapListing(r)) });
});

listingsRouter.get('/meta', (_req, res) => {
  const cities = db
    .prepare(
      `SELECT city, COUNT(*) AS count FROM listings WHERE status = 'available' GROUP BY city ORDER BY city`
    )
    .all();
  res.json({
    cities,
    propertyTypes: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'],
    listingTypes: ['rent', 'sale'],
  });
});

listingsRouter.get('/:id', optionalAuth, (req, res) => {
  const row = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM listings l
       JOIN users u ON u.id = l.owner_id
       WHERE l.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Listing not found.' });

  let saved = false;
  if (req.user) {
    saved = Boolean(
      db
        .prepare('SELECT 1 FROM saved_listings WHERE user_id = ? AND listing_id = ?')
        .get(req.user.id, row.id)
    );
  }
  res.json({ listing: mapListing(row, { saved }) });
});

listingsRouter.post('/:id/inquiries', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });

  const { name, email, phone, message } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

  const info = db
    .prepare(
      `INSERT INTO inquiries (listing_id, buyer_id, name, email, phone, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      listing.id,
      req.user.id,
      (name || req.user.name).trim(),
      (email || req.user.email).trim(),
      (phone || req.user.phone || '').trim() || null,
      message.trim()
    );

  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ inquiry });
});

listingsRouter.post('/:id/save', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  db.prepare('INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)').run(
    req.user.id,
    listing.id
  );
  res.json({ saved: true });
});

listingsRouter.delete('/:id/save', requireAuth, (req, res) => {
  db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(
    req.user.id,
    req.params.id
  );
  res.json({ saved: false });
});
