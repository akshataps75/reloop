// backend/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const PUNE_AREAS = [
  { name: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Baner', lat: 18.5590, lng: 73.7868 },
  { name: 'Pashan', lat: 18.5412, lng: 73.7925 },
  { name: 'Bavdhan', lat: 18.5158, lng: 73.7813 },
];

const USERS = [
  { name: 'Akshata Shrivastava', email: 'akshata@example.com', initials: 'AS', role: 'Student · MCA · Pune', area: 'Bavdhan' },
  { name: 'Aarav M.', email: 'aarav@example.com', initials: 'AM', role: 'Student · Pune', area: 'Kothrud' },
  { name: 'Ishita R.', email: 'ishita@example.com', initials: 'IR', role: 'Student · Pune', area: 'Baner' },
  { name: 'Kabir S.', email: 'kabir@example.com', initials: 'KS', role: 'Student · Pune', area: 'Pashan' },
  { name: 'Naina P.', email: 'naina@example.com', initials: 'NP', role: 'Student · Pune', area: 'Baner' },
  { name: 'Rohan K.', email: 'rohan@example.com', initials: 'RK', role: 'Student · Pune', area: 'Kothrud' },
  { name: 'Meera J.', email: 'meera@example.com', initials: 'MJ', role: 'Student · Pune', area: 'Bavdhan' },
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
        `INSERT INTO users (name, email, password_hash, initials, role, verified, location)
         VALUES ($1, $2, $3, $4, $5, TRUE, ST_SetSRID(ST_MakePoint($6, $7), 4326))
         RETURNING id`,
        [u.name, u.email, passwordHash, u.initials, u.role, area.lng, area.lat]
      );
      userIds[u.name] = res.rows[0].id;
    }

    console.log('Inserting listings...');
    const LISTINGS = [
      { title: 'Engineering Mechanics', category: 'Books & Stationery', price: 350, image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80', seller: 'Aarav M.', condition: 'Used, all pages intact' },
      { title: 'Mechanical Keyboard', category: 'Electronics & Gadgets', price: 2200, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', seller: 'Ishita R.', condition: 'Gently used', cluster: 'B', documentType: 'Warranty card', documentUrl: '/mock-documents/warranty-card.pdf' },
      { title: 'Study Table', category: 'Furniture & Home', price: 1800, image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80', seller: 'Kabir S.', condition: 'Good condition' },
      { title: 'Firefox Road Bike', category: 'Vehicles', price: 8500, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80', seller: 'Naina P.', condition: 'Well maintained' },
      { title: 'Calculus — Thomas', category: 'Books & Stationery', price: 280, image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=800&q=80', seller: 'Rohan K.', condition: 'Used' },
      { title: 'Ikea Floor Lamp', category: 'Furniture & Home', price: 900, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', seller: 'Meera J.', condition: 'Like new' },
    ];

    const listingIds = []; // parallel to LISTINGS, by index

    for (const l of LISTINGS) {
      const area = PUNE_AREAS.find(a => a.name === USERS.find(u => u.name === l.seller).area);
      const res = await client.query(
        `INSERT INTO listings (seller_id, title, category, price, image, description, condition, cluster, document_type, document_url, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326))
         RETURNING id`,
        [
          userIds[l.seller], l.title, l.category, l.price, l.image,
          `${l.title} — good condition, priced to move.`, l.condition,
          l.cluster || 'A', l.documentType || null, l.documentUrl || null,
          area.lng, area.lat,
        ]
      );
      listingIds.push(res.rows[0].id);
    }

    console.log('Inserting chat threads + messages...');
    // Thread: Akshata (seller of keyboard, idx 1) <-> Ishita is actually the seller here per mock data,
    // so this thread is buyer Akshata messaging seller Ishita about listing 2 (Mechanical Keyboard)
    const threadRes = await client.query(
      `INSERT INTO chat_threads (listing_id, seller_id, buyer_id) VALUES ($1, $2, $3) RETURNING id`,
      [listingIds[1], userIds['Ishita R.'], userIds['Akshata Shrivastava']]
    );
    const threadId = threadRes.rows[0].id;

    await client.query(
      `INSERT INTO chat_messages (thread_id, sender_id, text, status) VALUES
        ($1, $2, 'Hi! Is this still available?', 'read'),
        ($1, $3, 'Hey, yes it is. Would you like to see it this weekend?', 'read')`,
      [threadId, userIds['Akshata Shrivastava'], userIds['Ishita R.']]
    );

    console.log('Inserting a pending meetup...');
    await client.query(
      `INSERT INTO meetups (thread_id, status, date, time, place, requested_by_user_id)
       VALUES ($1, 'pending', CURRENT_DATE + INTERVAL '3 days', '10:00', 'Baner Road cafe', $2)`,
      [threadId, userIds['Ishita R.']]
    );

    console.log('Seed complete.');
    console.log(`Login with any seeded email (e.g. akshata@example.com) / password: ${DUMMY_PASSWORD}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});