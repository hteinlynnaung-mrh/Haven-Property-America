import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db, migrate } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(rand, arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

const PHOTOS = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b26d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7a779f0?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1400&q=80',
];

const CITIES = [
  { city: 'Austin', state: 'TX', zips: ['78701', '78702', '78703', '78704', '78745'], hoods: ['South Congress', 'East Austin', 'Zilker', 'Mueller', 'Clarksville'] },
  { city: 'Denver', state: 'CO', zips: ['80202', '80203', '80205', '80206', '80211'], hoods: ['RiNo', 'Highlands', 'Cherry Creek', 'Capitol Hill', 'LoDo'] },
  { city: 'Seattle', state: 'WA', zips: ['98101', '98102', '98103', '98109', '98122'], hoods: ['Capitol Hill', 'Ballard', 'Fremont', 'Queen Anne', 'Wallingford'] },
  { city: 'Miami', state: 'FL', zips: ['33131', '33132', '33139', '33133', '33129'], hoods: ['Brickell', 'Wynwood', 'Coconut Grove', 'Coral Gables', 'Little Havana'] },
  { city: 'Chicago', state: 'IL', zips: ['60601', '60610', '60614', '60622', '60640'], hoods: ['Lincoln Park', 'Wicker Park', 'River North', 'Lakeview', 'West Loop'] },
  { city: 'Portland', state: 'OR', zips: ['97201', '97209', '97210', '97214', '97217'], hoods: ['Pearl District', 'Alberta', 'Hawthorne', 'Nob Hill', 'Sellwood'] },
  { city: 'Nashville', state: 'TN', zips: ['37201', '37203', '37206', '37212', '37215'], hoods: ['East Nashville', 'The Gulch', 'Green Hills', '12 South', 'Germantown'] },
  { city: 'Raleigh', state: 'NC', zips: ['27601', '27603', '27607', '27609', '27615'], hoods: ['Downtown', 'Five Points', 'North Hills', 'Cameron Village', 'Oakwood'] },
];

const STREETS = [
  'Oak', 'Maple', 'Cedar', 'Pine', 'Willow', 'Magnolia', 'Sunset', 'Lake', 'River', 'Hillcrest',
  'Market', 'Union', 'Pearl', 'Grove', 'Park', 'Garden', 'Harbor', 'Ridge', 'Valley', 'Summit',
];
const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct', 'Pl'];

const AMENITIES = ['parking', 'pool', 'gym', 'garden', 'ac', 'elevator', 'petFriendly', 'balcony', 'fireplace', 'washerDryer', 'security', 'furnished'];

const OWNERS = [
  { email: 'maya.chen@haven.test', name: 'Maya Chen', phone: '512-555-0142' },
  { email: 'james.okonkwo@haven.test', name: 'James Okonkwo', phone: '303-555-0198' },
  { email: 'sofia.alvarez@haven.test', name: 'Sofia Alvarez', phone: '206-555-0114' },
  { email: 'daniel.park@haven.test', name: 'Daniel Park', phone: '305-555-0177' },
  { email: 'priya.shah@haven.test', name: 'Priya Shah', phone: '312-555-0160' },
  { email: 'liam.obrien@haven.test', name: 'Liam OBrien', phone: '503-555-0133' },
  { email: 'hannah.brooks@haven.test', name: 'Hannah Brooks', phone: '615-555-0181' },
  { email: 'carlos.mendes@haven.test', name: 'Carlos Mendes', phone: '919-555-0129' },
];

const BUYERS = [
  { email: 'alex.nguyen@haven.test', name: 'Alex Nguyen', phone: '415-555-0101' },
  { email: 'jordan.lee@haven.test', name: 'Jordan Lee', phone: '212-555-0102' },
  { email: 'samira.hassan@haven.test', name: 'Samira Hassan', phone: '617-555-0103' },
  { email: 'noah.kim@haven.test', name: 'Noah Kim', phone: '408-555-0104' },
  { email: 'elena.rossi@haven.test', name: 'Elena Rossi', phone: '718-555-0105' },
  { email: 'marcus.bennett@haven.test', name: 'Marcus Bennett', phone: '404-555-0106' },
  { email: 'yuki.tanaka@haven.test', name: 'Yuki Tanaka', phone: '503-555-0107' },
  { email: 'fatima.diallo@haven.test', name: 'Fatima Diallo', phone: '713-555-0108' },
  { email: 'owen.clarke@haven.test', name: 'Owen Clarke', phone: '303-555-0109' },
  { email: 'isla.patel@haven.test', name: 'Isla Patel', phone: '206-555-0110' },
  { email: 'diego.santos@haven.test', name: 'Diego Santos', phone: '305-555-0111' },
  { email: 'amelia.ward@haven.test', name: 'Amelia Ward', phone: '919-555-0112' },
];

const MESSAGES = [
  'Hi, I would like to schedule a viewing this weekend. Is Saturday afternoon possible?',
  'Is the listed price negotiable? We are pre-approved and can close quickly.',
  'Does the rent include utilities and parking? Also curious about the pet policy.',
  'We loved the photos. Can you confirm the move-in date and application requirements?',
  'Interested in a second look with our inspector. Please share available times next week.',
  'Is this still available? We are relocating for work and need something by the first of the month.',
  'Could you send the HOA documents and last two years of meeting notes?',
  'We have a small dog. Would that be allowed, and is there a nearby park?',
];

function describe({ listingType, propertyType, hood, city, beds, baths, area, year, furnished, price }) {
  const use = listingType === 'rent' ? 'for rent' : 'for sale';
  const furn = furnished
    ? 'It is offered furnished, so you can move in with little more than a suitcase.'
    : 'The home is unfurnished, giving you a blank canvas for your own style.';
  const bedLine =
    propertyType === 'land'
      ? 'This lot is ready for a custom build, with utilities nearby and flexible zoning guidance from the seller.'
      : propertyType === 'commercial'
        ? 'Flexible floorplate suits a boutique office, studio, or storefront with strong foot traffic nearby.'
        : `Inside you will find ${beds} bedroom${beds === 1 ? '' : 's'} and ${baths} bath${baths === 1 ? '' : 's'} across ${area.toLocaleString()} sq ft.`;
  return `A ${propertyType} ${use} in ${hood}, ${city}. ${bedLine} Built in ${year}, the property sits on a quiet block with easy access to cafes, transit, and weekend markets. ${furn} Natural light runs through the main living spaces, and recent updates keep maintenance low. Listed at ${listingType === 'rent' ? `$${price.toLocaleString()}/month` : `$${price.toLocaleString()}`}, this is a strong fit for anyone who wants neighborhood character without sacrificing convenience. Contact the owner to tour, request disclosures, or discuss timing.`;
}

function titleFor({ propertyType, hood, listingType, beds }) {
  const vibe = ['Sunlit', 'Quiet', 'Modern', 'Classic', 'Updated', 'Bright', 'Corner', 'Garden'][
    beds % 8
  ];
  const kind =
    propertyType === 'house'
      ? `${beds}-Bed House`
      : propertyType === 'apartment'
        ? `${beds}-Bed Apartment`
        : propertyType === 'condo'
          ? `${beds}-Bed Condo`
          : propertyType === 'townhouse'
            ? `${beds}-Bed Townhouse`
            : propertyType === 'land'
              ? 'Buildable Lot'
              : 'Commercial Space';
  return `${vibe} ${kind} in ${hood} · ${listingType === 'rent' ? 'For Rent' : 'For Sale'}`;
}

function prices(listingType, propertyType, rand) {
  if (propertyType === 'land') {
    return listingType === 'sale' ? 120000 + Math.floor(rand() * 480000) : 1800 + Math.floor(rand() * 2200);
  }
  if (propertyType === 'commercial') {
    return listingType === 'sale' ? 400000 + Math.floor(rand() * 1600000) : 3500 + Math.floor(rand() * 9000);
  }
  if (listingType === 'rent') {
    const base = { apartment: 1400, condo: 1800, townhouse: 2200, house: 2600 }[propertyType] || 1600;
    return base + Math.floor(rand() * 2800);
  }
  const base = { apartment: 280000, condo: 360000, townhouse: 420000, house: 480000 }[propertyType] || 350000;
  return base + Math.floor(rand() * 900000);
}

function seed() {
  const dbFile = path.resolve(__dirname, '..', process.env.DATABASE_PATH || './data/property.db');
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });

  db.exec(`
    DROP TABLE IF EXISTS saved_listings;
    DROP TABLE IF EXISTS inquiries;
    DROP TABLE IF EXISTS listings;
    DROP TABLE IF EXISTS users;
  `);
  migrate();

  const rand = rng(20260905);
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`
  );
  const ownerIds = OWNERS.map((o) => insertUser.run(o.email, passwordHash, o.name, o.phone, 'owner').lastInsertRowid);
  const buyerIds = BUYERS.map((b) => insertUser.run(b.email, passwordHash, b.name, b.phone, 'buyer').lastInsertRowid);

  const insertListing = db.prepare(`
    INSERT INTO listings (
      owner_id, title, description, listing_type, property_type, status, price, currency,
      address, city, state, postal_code, country, bedrooms, bathrooms, area_sqft, year_built,
      parking, furnished, amenities, image_urls, contact_name, contact_phone, contact_email,
      featured, created_at
    ) VALUES (
      @owner_id, @title, @description, @listing_type, @property_type, @status, @price, 'USD',
      @address, @city, @state, @postal_code, 'USA', @bedrooms, @bathrooms, @area_sqft, @year_built,
      @parking, @furnished, @amenities, @image_urls, @contact_name, @contact_phone, @contact_email,
      @featured, @created_at
    )
  `);

  const typesCycle = [
    'house', 'apartment', 'condo', 'townhouse', 'house', 'apartment',
    'condo', 'townhouse', 'land', 'commercial', 'house', 'apartment',
  ];
  const listingIds = [];

  const tx = db.transaction(() => {
    for (let i = 0; i < 108; i++) {
      const loc = CITIES[i % CITIES.length];
      const ownerIndex = i % OWNERS.length;
      const owner = OWNERS[ownerIndex];
      const listingType = i % 20 < 11 ? 'rent' : 'sale'; // ~55% rent
      const propertyType = typesCycle[i % typesCycle.length];
      const hood = loc.hoods[i % loc.hoods.length];
      const beds = propertyType === 'land' || propertyType === 'commercial' ? 0 : 1 + (i % 5);
      const baths = propertyType === 'land' ? 0 : propertyType === 'commercial' ? 2 : 1 + (i % 3) * 0.5;
      const area =
        propertyType === 'land'
          ? 4000 + (i % 12) * 800
          : propertyType === 'commercial'
            ? 900 + (i % 10) * 250
            : 650 + beds * 320 + (i % 7) * 40;
      const year = 1968 + (i % 55);
      const furnished = listingType === 'rent' && i % 3 === 0 ? 1 : 0;
      const price = prices(listingType, propertyType, rand);
      const statusPool = ['available', 'available', 'available', 'available', 'available', 'pending', 'available'];
      let status = statusPool[i % statusPool.length];
      if (i % 23 === 0) status = listingType === 'rent' ? 'rented' : 'sold';
      if (i % 41 === 0) status = 'withdrawn';
      const featured = status === 'available' && i % 9 === 0 ? 1 : 0;
      const photos = [];
      for (let p = 0; p < 5; p++) photos.push(PHOTOS[(i + p * 3) % PHOTOS.length]);
      const amenityCount = 3 + (i % 5);
      const amenities = pickN(rand, AMENITIES, amenityCount);
      if (furnished) amenities.push('furnished');
      const number = 100 + ((i * 17) % 8900);
      const street = `${pick(rand, STREETS)} ${pick(rand, STREET_TYPES)}`;
      const daysAgo = i % 40;
      const created = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 19).replace('T', ' ');

      const info = insertListing.run({
        owner_id: ownerIds[ownerIndex],
        title: titleFor({ propertyType, hood, listingType, beds }),
        description: describe({
          listingType,
          propertyType,
          hood,
          city: loc.city,
          beds,
          baths,
          area,
          year,
          furnished,
          price,
        }),
        listing_type: listingType,
        property_type: propertyType,
        status,
        price,
        address: `${number} ${street}`,
        city: loc.city,
        state: loc.state,
        postal_code: loc.zips[i % loc.zips.length],
        bedrooms: beds,
        bathrooms: baths,
        area_sqft: area,
        year_built: year,
        parking: i % 4 === 0 ? 2 : i % 2,
        furnished,
        amenities: JSON.stringify([...new Set(amenities)]),
        image_urls: JSON.stringify(photos),
        contact_name: owner.name,
        contact_phone: owner.phone,
        contact_email: owner.email,
        featured,
        created_at: created,
      });
      listingIds.push(info.lastInsertRowid);
    }

    const insertInquiry = db.prepare(
      `INSERT INTO inquiries (listing_id, buyer_id, name, email, phone, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < 48; i++) {
      const listingId = listingIds[i % listingIds.length];
      const buyer = BUYERS[i % BUYERS.length];
      const buyerId = buyerIds[i % buyerIds.length];
      const status = ['new', 'new', 'read', 'replied'][i % 4];
      const created = new Date(Date.now() - (i % 18) * 3600000 * 6)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      insertInquiry.run(
        listingId,
        buyerId,
        buyer.name,
        buyer.email,
        buyer.phone,
        MESSAGES[i % MESSAGES.length],
        status,
        created
      );
    }

    const insertSaved = db.prepare(
      `INSERT OR IGNORE INTO saved_listings (user_id, listing_id) VALUES (?, ?)`
    );
    for (let i = 0; i < 36; i++) {
      insertSaved.run(buyerIds[i % buyerIds.length], listingIds[(i * 3) % listingIds.length]);
    }
  });

  tx();

  const counts = {
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    listings: db.prepare('SELECT COUNT(*) AS n FROM listings').get().n,
    rent: db.prepare("SELECT COUNT(*) AS n FROM listings WHERE listing_type = 'rent'").get().n,
    sale: db.prepare("SELECT COUNT(*) AS n FROM listings WHERE listing_type = 'sale'").get().n,
    inquiries: db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,
    saved: db.prepare('SELECT COUNT(*) AS n FROM saved_listings').get().n,
    featured: db.prepare('SELECT COUNT(*) AS n FROM listings WHERE featured = 1').get().n,
  };
  console.log('Seed complete:', counts);
  console.log('Demo password for all accounts: Password123!');
  console.log('Owner login:', OWNERS[0].email);
  console.log('Buyer login:', BUYERS[0].email);
}

seed();
