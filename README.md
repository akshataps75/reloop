- [x] **1. Data layer first**
Turn `lib/types.ts` into your Postgres schema — it's basically already an ER diagram in disguise: `users`, `listings` (with `cluster` enum, `document_type`, `document_url`), `listings_interests`, `chat_threads`/`messages`, `meetups`. Add PostGIS: a `geography(Point)` column on `listings` (and `users` for their base location) plus a GIST index, so your "search radius" filter becomes a `ST_DWithin` query instead of app-side math.

- [x] **2. Auth**
JWT issued at signup/login as you'd decided — straightforward Express middleware. Keep the mock DigiLocker gate as a separate flag on the user (`verified: boolean`) that gets flipped by a mock OAuth callback route, not baked into the JWT itself.

**3. API surface, roughly matching your screens**
- `POST /auth/signup`, `/auth/login`
- `GET /listings?lat&lng&radius&search` — the PostGIS query
- `POST /listings` (gated: checks `verified`, auto-assigns cluster from price/category thresholds server-side)
- `GET /listings/:id`, `GET /users/:id` (seller profile — active + sold, respecting the "sold items greyed out but visible" rule)
- `POST /listings/:id/interest`, `GET /me/activity` (selling/buying, ongoing/completed)
- `GET/POST /threads`, `/threads/:id/messages` — gate thread creation behind an existing interest record
- `POST /meetups`, `/meetups/:id/accept` → generates the confirmation code

**4. Swap the frontend over incrementally**
`lib/api.ts` already exists as a thin layer (Messaging uses it) — extend that pattern everywhere: replace direct `mock-data.ts` imports in each component with calls through `lib/api.ts`, screen by screen, so the UI never has to change, only its data source. Keep `mock-data.ts` around as fallback/seed data for your dev DB.

**5. Order of attack**
Auth → listings CRUD + PostGIS search → interest/messaging → meetup/confirmation code. Leave payment-hold/escrow out per your scoped-down plan.
