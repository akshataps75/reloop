// backend/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const PUNE_AREAS = [
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Baner', lat: 18.5590, lng: 73.7868 },
  { name: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { name: 'Hinjewadi', lat: 18.5912, lng: 73.7389 },
];

const USERS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', initials: 'AS', phone: '9876543210', address: 'Kothrud, Pune 411038', area: 'Kothrud' },
  { name: 'Srishti Singh', email: 'srishti.singh@example.com', initials: 'SS', phone: '9876543211', address: 'Baner, Pune 411045', area: 'Baner' },
  { name: 'Arjun Nair', email: 'arjun.nair@example.com', initials: 'AN', phone: '9876543212', address: 'Viman Nagar, Pune 411014', area: 'Viman Nagar' },
  { name: 'Meera Iyer', email: 'meera.iyer@example.com', initials: 'MI', phone: '9876543213', address: 'Hinjewadi, Pune 411057', area: 'Hinjewadi' },
];

const DUMMY_PASSWORD = 'password123'; // same for every seed user, for easy local login

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('TRUNCATE meetups, chat_messages, chat_threads, listing_interests, listings, users RESTART IDENTITY CASCADE');

    console.log('Inserting users...');
    const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 10);
    const userIds = {}; // name -> id

    for (const u of USERS) {
      const area = PUNE_AREAS.find(a => a.name === u.area);
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, initials, verified, phone_number, address, location)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
         RETURNING id`,
        [u.name, u.email, passwordHash, u.initials, u.phone, u.address, area.lng, area.lat]
      );
      userIds[u.name] = res.rows[0].id;
    }

    console.log('Inserting listings...');
    const LISTINGS = [
      { title: 'Running shoes, UK 8', category: 'Sports & Fitness', price: 1200, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', seller: 'Aarav Sharma', description: 'Grey mesh running shoes, worn a handful of times. True to size.' },
      { title: 'Dumbbells set (2x5kg)', category: 'Sports & Fitness', price: 4500, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', seller: 'Aarav Sharma', description: 'Rubber-coated hex dumbbells, barely used, no rust.', condition: 'Minor surface scuffs, grips fully intact, no rust or cracks.', cluster: 'B', documentType: 'Receipt', documentUrl: '/mock-documents/receipt.pdf' },
      { title: 'Honda Activa 5G, 2021', category: 'Vehicles', price: 42000, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', seller: 'Srishti Singh', description: 'Single owner, regularly serviced, comes with helmet.', condition: 'Small scratch on left panel, engine and brakes in great condition, RC and insurance up to date.', cluster: 'B', documentType: 'Insurance', documentUrl: '/mock-documents/insurance.pdf' },
      { title: 'Study table with drawer', category: 'Furniture & Home', price: 1800, image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80', seller: 'Srishti Singh', description: 'Compact wooden study table, good for hostel rooms.' },
      { title: 'Badminton racket pair', category: 'Sports & Fitness', price: 650, image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800&q=80', seller: 'Arjun Nair', description: 'Yonex-style rackets with cover, light use.' },
      { title: 'Sony WH-1000XM4 headphones', category: 'Electronics & Gadgets', price: 9500, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', seller: 'Arjun Nair', description: 'Noise-cancelling, comes with original case and cable.', condition: 'Light wear on ear cushions, battery health still strong, box and cable included.', cluster: 'B', documentType: 'Warranty', documentUrl: '/mock-documents/warranty-card.pdf' },
      { title: 'Data Structures textbook', category: 'Books & Stationery', price: 300, image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80', seller: 'Meera Iyer', description: 'Used for one semester, all pages intact, minor highlighting.' },
      { title: 'Acoustic guitar', category: 'Musical Instruments', price: 5500, image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', seller: 'Meera Iyer', description: 'Yamaha F310, great for beginners, comes with a soft case.', condition: 'A few small dings on the body, strings replaced recently, neck is straight with no warping.', cluster: 'B', documentType: 'Not applicable', documentUrl: null },
    ];

    const listingIds = []; // parallel to LISTINGS, by index

    for (const l of LISTINGS) {
      const area = PUNE_AREAS.find(a => a.name === USERS.find(u => u.name === l.seller).area);
      const res = await client.query(
        `INSERT INTO listings (seller_id, title, category, price, image, description, condition, cluster, document_type, document_url, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326)::geography)
         RETURNING id`,
        [
          userIds[l.seller], l.title, l.category, l.price, l.image,
          l.description, l.condition || null,
          l.cluster || 'A', l.documentType || null, l.documentUrl || null,
          area.lng, area.lat,
        ]
      );
      listingIds.push(res.rows[0].id);
    }

    console.log('Inserting a chat thread + messages...');
    // Arjun (buyer) messaging Srishti (seller) about the Activa (listing idx 2)
    const threadRes = await client.query(
      `INSERT INTO chat_threads (listing_id, seller_id, buyer_id) VALUES ($1, $2, $3) RETURNING id`,
      [listingIds[2], userIds['Srishti Singh'], userIds['Arjun Nair']]
    );
    const threadId = threadRes.rows[0].id;

    await client.query(
      `INSERT INTO chat_messages (thread_id, sender_id, text, status) VALUES
        ($1, $2, 'Hi! Is this still available?', 'read'),
        ($1, $3, 'Hey, yes it is. Would you like to see it this weekend?', 'read')`,
      [threadId, userIds['Arjun Nair'], userIds['Srishti Singh']]
    );

    console.log('Inserting a pending meetup...');
    await client.query(
      `INSERT INTO meetups (thread_id, status, date, time, place, requested_by_user_id)
       VALUES ($1, 'pending', CURRENT_DATE + INTERVAL '3 days', '10:00', 'Baner Road cafe', $2)`,
      [threadId, userIds['Srishti Singh']]
    );

    console.log('Seed complete.');
    console.log(`Login with any seeded email (e.g. aarav.sharma@example.com) / password: ${DUMMY_PASSWORD}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});