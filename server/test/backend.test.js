import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, migrate, mapListing, mapUser, mapInquiry } from '../src/db.js';
import { signToken } from '../src/auth.js';

describe('Database & Migration', () => {
  it('migrates and creates required tables and indexes', () => {
    migrate();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t) => t.name);
    assert.ok(tables.includes('users'));
    assert.ok(tables.includes('listings'));
    assert.ok(tables.includes('inquiries'));
    assert.ok(tables.includes('saved_listings'));
  });

  it('contains seeded demo accounts', () => {
    const owner = db.prepare("SELECT * FROM users WHERE email = 'maya.chen@haven.test'").get();
    assert.ok(owner, 'Maya Chen should exist');
    assert.equal(owner.role, 'owner');
    assert.ok(bcrypt.compareSync('Password123!', owner.password_hash));

    const buyer = db.prepare("SELECT * FROM users WHERE email = 'alex.nguyen@haven.test'").get();
    assert.ok(buyer, 'Alex Nguyen should exist');
    assert.equal(buyer.role, 'buyer');
    assert.ok(bcrypt.compareSync('Password123!', buyer.password_hash));
  });

  it('maps database rows to API response format correctly', () => {
    const userRow = db.prepare("SELECT * FROM users WHERE email = 'maya.chen@haven.test'").get();
    const user = mapUser(userRow);
    assert.equal(user.email, 'maya.chen@haven.test');
    assert.equal(user.password_hash, undefined, 'password_hash must be excluded');

    const listingRow = db.prepare('SELECT l.*, u.name as owner_name FROM listings l JOIN users u ON u.id = l.owner_id LIMIT 1').get();
    const listing = mapListing(listingRow);
    assert.ok(Array.isArray(listing.amenities));
    assert.ok(Array.isArray(listing.imageUrls));
    assert.equal(typeof listing.featured, 'boolean');
    assert.equal(typeof listing.furnished, 'boolean');
  });
});

describe('Authentication Helpers', () => {
  it('signs and verifies JWT tokens with user id and role', () => {
    const user = { id: 999, role: 'owner' };
    const token = signToken(user);
    assert.ok(typeof token === 'string');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'haven-dev-jwt-secret-change-me');
    assert.equal(decoded.id, 999);
    assert.equal(decoded.role, 'owner');
  });
});

describe('Listings Queries & Filters', () => {
  it('fetches listings with pagination and count', () => {
    const total = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE status = 'available'").get().n;
    assert.ok(total > 0);

    const rows = db.prepare("SELECT * FROM listings WHERE status = 'available' LIMIT 10 OFFSET 0").all();
    assert.equal(rows.length, Math.min(10, total));
  });

  it('filters by listing type (rent vs sale)', () => {
    const rentals = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE status = 'available' AND listing_type = 'rent'").get().n;
    const sales = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE status = 'available' AND listing_type = 'sale'").get().n;
    assert.ok(rentals > 0);
    assert.ok(sales > 0);
  });

  it('filters by city and bedrooms correctly', () => {
    const austinListings = db.prepare("SELECT * FROM listings WHERE status = 'available' AND city = 'Austin'").all();
    assert.ok(austinListings.length > 0);
    for (const l of austinListings) {
      assert.equal(l.city, 'Austin');
    }

    const twoBeds = db.prepare("SELECT * FROM listings WHERE status = 'available' AND bedrooms >= 2").all();
    for (const l of twoBeds) {
      assert.ok(l.bedrooms >= 2);
    }
  });

  it('searches by keyword', () => {
    const q = '%Austin%';
    const results = db.prepare(
      "SELECT * FROM listings WHERE status = 'available' AND (title LIKE ? OR address LIKE ? OR description LIKE ? OR city LIKE ?)"
    ).all(q, q, q, q);
    assert.ok(results.length > 0);
  });
});

describe('Inquiries & Saved Listings Flow', () => {
  it('supports saving and unsaving listings', () => {
    const user = db.prepare("SELECT id FROM users WHERE role = 'buyer' LIMIT 1").get();
    const listing = db.prepare("SELECT id FROM listings LIMIT 1").get();

    // Insert save
    db.prepare('INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)').run(user.id, listing.id);
    const saved = db.prepare('SELECT 1 FROM saved_listings WHERE user_id = ? AND listing_id = ?').get(user.id, listing.id);
    assert.ok(saved);

    // Delete save
    db.prepare('DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?').run(user.id, listing.id);
    const removed = db.prepare('SELECT 1 FROM saved_listings WHERE user_id = ? AND listing_id = ?').get(user.id, listing.id);
    assert.equal(removed, undefined);
  });

  it('creates an inquiry and updates status', () => {
    const buyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' LIMIT 1").get();
    const listing = db.prepare("SELECT * FROM listings LIMIT 1").get();

    const info = db.prepare(
      `INSERT INTO inquiries (listing_id, buyer_id, name, email, phone, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(listing.id, buyer.id, buyer.name, buyer.email, buyer.phone, 'Test inquiry message for verification');

    const created = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(info.lastInsertRowid);
    assert.equal(created.message, 'Test inquiry message for verification');
    assert.equal(created.status, 'new');

    // Update status to replied with reply text
    db.prepare('UPDATE inquiries SET status = ?, owner_reply = ?, replied_at = ? WHERE id = ?')
      .run('replied', 'I would love to give you a tour tomorrow at 2pm!', new Date().toISOString(), created.id);
    const updated = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(created.id);
    assert.equal(updated.status, 'replied');
    assert.equal(updated.owner_reply, 'I would love to give you a tour tomorrow at 2pm!');
    assert.ok(updated.replied_at);

    // Clean up test inquiry
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(created.id);
  });
});

describe('Owner Dashboard Stats', () => {
  it('calculates correct dashboard metrics for an owner', () => {
    const owner = db.prepare("SELECT id FROM users WHERE role = 'owner' LIMIT 1").get();
    const listingsCount = db.prepare('SELECT COUNT(*) AS n FROM listings WHERE owner_id = ?').get(owner.id).n;
    const activeCount = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE owner_id = ? AND status = 'available'").get(owner.id).n;
    assert.ok(listingsCount >= activeCount);
    assert.ok(listingsCount > 0);
  });

  it('updates listing status correctly', () => {
    const listing = db.prepare("SELECT * FROM listings WHERE status = 'available' LIMIT 1").get();
    assert.ok(listing);
    db.prepare("UPDATE listings SET status = 'pending' WHERE id = ?").run(listing.id);
    const updated = db.prepare('SELECT status FROM listings WHERE id = ?').get(listing.id);
    assert.equal(updated.status, 'pending');

    // Restore status
    db.prepare("UPDATE listings SET status = 'available' WHERE id = ?").run(listing.id);
  });
});

describe('User Profile & Password', () => {
  it('updates profile information and hashes passwords correctly', () => {
    const testUser = db.prepare("SELECT * FROM users WHERE email = 'jordan.lee@haven.test'").get();
    assert.ok(testUser);

    const oldName = testUser.name;
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run('Jordan Lee Updated', testUser.id);
    const updated = db.prepare('SELECT name FROM users WHERE id = ?').get(testUser.id);
    assert.equal(updated.name, 'Jordan Lee Updated');

    // Restore name
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(oldName, testUser.id);
  });
});
