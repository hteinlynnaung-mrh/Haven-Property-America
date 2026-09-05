import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || './data/property.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('buyer', 'owner')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      listing_type TEXT NOT NULL CHECK(listing_type IN ('rent', 'sale')),
      property_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('available', 'pending', 'rented', 'sold', 'withdrawn')),
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'USD',
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT,
      country TEXT DEFAULT 'USA',
      bedrooms INTEGER DEFAULT 0,
      bathrooms REAL DEFAULT 0,
      area_sqft INTEGER,
      year_built INTEGER,
      parking INTEGER DEFAULT 0,
      furnished INTEGER DEFAULT 0,
      amenities TEXT DEFAULT '[]',
      image_urls TEXT DEFAULT '[]',
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_listings (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, listing_id)
    );

    CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
    CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type);
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
    CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at);
    CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_listing ON inquiries(listing_id);
    CREATE INDEX IF NOT EXISTS idx_inquiries_buyer ON inquiries(buyer_id);
  `);

  try {
    db.exec('ALTER TABLE inquiries ADD COLUMN owner_reply TEXT');
  } catch {}
  try {
    db.exec('ALTER TABLE inquiries ADD COLUMN replied_at TEXT');
  } catch {}
}

export function parseJson(value, fallback) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

export function mapListing(row, extras = {}) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    listingType: row.listing_type,
    propertyType: row.property_type,
    status: row.status,
    price: row.price,
    currency: row.currency,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqft: row.area_sqft,
    yearBuilt: row.year_built,
    parking: row.parking,
    furnished: Boolean(row.furnished),
    amenities: parseJson(row.amenities, []),
    imageUrls: parseJson(row.image_urls, []),
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerName: row.owner_name,
    ...extras,
  };
}

export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapInquiry(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    ownerReply: row.owner_reply || null,
    repliedAt: row.replied_at || null,
    createdAt: row.created_at,
    listingTitle: row.listing_title,
    listingCity: row.listing_city,
    listingType: row.listing_type,
    listingPrice: row.listing_price,
    listingImage: parseJson(row.image_urls, [])[0] || null,
  };
}
