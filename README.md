# ReLoop

ReLoop is a local marketplace for passing on second-hand items such as books, electronics, furniture to someone nearby who'll actually use it. Same basic idea as OLX or Facebook Marketplace, but built around one key difference: **not every trade deserves the same amount of caution.**  

A used paperback or a second-hand refrigerator aren't the same kind of decision. One is a quick low stake's buy and the other is worth inspecting carefully before handing over real money. ReLoop auto-sorts every listing into one of the two tiers based on category + price, and not just category:  
- **Quick trades (Cluster A):** Cheap, fast decision items. Upload a photo, price and done
- **Careful trades (Cluster B):** High value items. Also asks for condition notes and proof of ownership before it goes live.

The threshold logic runs server-side, so it can't be bypassed by manipulated client.  

**Trust** works the same way, upfront. Every user verifies their identity once (simulated DigiLocker verification) and a 'verified' badge follows them everywhere after. So by the time you are messaging someone, you already know they are accountable, not an anonymous username.

**Flow**:  
Sign up → Browser and search listings freely → First time you list an item / click "I'm interested" listed item → Verify (one time) → List an item / message seller → Chat or negotitate if needed → Mutually agree on a meet → Both sides confirm the handoff → Listing marked sold  

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React 19, TypeScript), Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL + PostGIS (geospatial queries: distance, radius search) |
| File storage | Supabase Storage (listing photos, ownership documents) |
| Auth | JWT (bcrypt-hashed passwords, 7-day tokens) |
| Geocoding | Nominatim (OpenStreetMap), proxied through the backend |

The frontend and backend are two separate apps in this repo. The frontend is a Next.js client that talks to Express API over plain REST.

## Architecture
```
┌───────────────────────────┐    REST (JSON)       ┌──────────────────┐
│  Next.js client           │ ──────────────────▶ │   Express API     │
│  (app/, components/, lib/)│                     │  (backend/routes/) │
└───────────────────────────┘ ◀────────────────── └───────────────────┘
                                                        │
                          ┌─────────────────────────────┼─────────────────────────────┐
                          ▼                             ▼                             ▼
                 PostgreSQL + PostGIS          Supabase Storage              Nominatim (OSM)
                 (users, listings, chat,       (listing photos,              (pincode/locality
                  meetups, interests)           ownership docs)               → lat/lng)
```

## Setup Instructions:
**Prerequisites:** Node.js 18+, a PostgreSQL database with the PostGIS extension available (a free Supabase project works well and also covers file storage), and a Supabase Storage bucket named listing-images (set to public).

1. Clone and install both apps:
```
git clone <this-repo-url>
cd <repo-folder>

# frontend
npm install

# backend
cd backend
npm install
```

2. Setup the database
```
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
psql "$DATABASE_URL" -f backend/migrations/002_add_profile_fields.sql
psql "$DATABASE_URL" -f backend/migrations/003_meetup_unique.sql
psql "$DATABASE_URL" -f backend/migrations/004_listing_images.sql
psql "$DATABASE_URL" -f backend/migrations/005_remove_role.sql
```

3. Enviornment variables:
backend/.env:
```
DATABASE_URL=postgresql://...
JWT_SECRET=<any long random string>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
```
.env.local:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. Seed demo data (Optional but recommended):
To populate a handful of demo users, listings
```
cd backend
npm run seed
```

## Technical decisions
- **PostGIS over storing plain lat/lng floats.** Computing "how far is
  this listing from me" and "what's within 5km" as raw floating-point
  math is easy to get subtly wrong (the Earth isn't flat). PostGIS's
  `geography` type handles the math correctly and lets Postgres do the
  filtering, instead of pulling every row back and computing distance
  in JavaScript.
- **Cluster assignment is server-side, not just a frontend hint.** The
  frontend shows a live "this will be Cluster B" preview as you type a
  price, but the backend independently re-runs the same threshold logic
  on submission — the frontend hint is a convenience, not a trust
  boundary a malicious client could bypass.
- **Images never touch the Express server's filesystem.** Multer holds
  uploads in memory only long enough to forward them to Supabase
  Storage. This keeps the API server stateless — it can be restarted or
  redeployed without needing to worry about a local uploads folder.
- **Verification is a one-time gate, not per-listing.** Once a user
  verifies, every future listing and every future "I'm interested"
  click skips that step. This was a deliberate trade-off: stronger
  friction once, rather than repeated friction that trains people to
  click through it mindlessly.
- **JWT over server-side sessions.** No session store to manage; the
  trade-off is that a token can't be immediately revoked before its
  7-day expiry (acceptable for a student project's threat model, but
  called out here as a real limitation, not an oversight).

## Limitations: 
This is a mini-project built by one person in a semester, so a few
things from the original vision are intentionally simplified, descoped,
or left for later:

- **No real payment handling.** The app helps people agree on a trade and
  arrange to meet — actual payment happens directly between the two
  people (cash, UPI, etc.), outside the app. A more complete version of
  this idea would hold payment in escrow until both sides confirm the
  handoff, and auto-refund if that confirmation never happens — but
  that requires integrating a real payment gateway, which was descoped
  for this build.
- **Identity verification is simulated**, not connected to a real
  government verification service (which isn't accessible to an
  individual student project). It mimics the same steps a real identity
  check would use, just against fake/mock data — clearly labeled as a
  simulation, not a real check.
- **Location search isn't very precise yet.** It relies on a free,
  open-source map lookup, which handles well-known areas and landmarks
  reasonably well, but doesn't reliably find an exact small residential
  building or society by name the way Google Maps would. A paid location
  service would fix this, at a real ongoing cost.