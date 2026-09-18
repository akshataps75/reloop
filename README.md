## Status

Backend is fully built and tested against Supabase: auth, mock DigiLocker verification gate,
listings CRUD + PostGIS radius search + cluster A/B auto-assignment, interest tracking,
chat threads/messages, meetup propose/accept/decline/confirm-done (auto-marks listing sold
when both sides confirm). All migrations (001–003) applied.

Frontend UI is fully built but still runs entirely on `lib/mock-data.ts` — `lib/api.ts`'s
functions don't call the Express API yet. That's the main remaining work.

## Known backend gaps to close first

- [ ] `routes/meetups.js` returns raw `requested_by_user_id` — translate to `requestedBy: 'me'|'them'`
      per-viewer (same pattern `routes/threads.js` already uses for `role`/`name`), since
      `MeetupCard.tsx` expects the `'me'|'them'` shape directly.
- [ ] No image upload/storage — listings only accept an `image` URL string. Needs a plan
      (Supabase Storage bucket is the obvious fit given the rest of the stack) before the
      Create Listing screen can attach real photos.

## Remaining steps, in order

- [ ] **1. Seed script**
Write `backend/seed.js` (or `migrations/004_seed.sql`) that inserts a handful of real users +
listings into Supabase, sourced from `lib/mock-data.ts`'s `LISTINGS`/`SELLING`/`SELLERS` arrays.
Needed before any frontend wiring is testable against real data.

- [ ] **2. Auth wiring**
Locate/build the login + signup screens (not yet reviewed). Wire them to
`POST /api/auth/signup` / `/login`, store the returned JWT (localStorage is fine for now),
and attach `Authorization: Bearer <token>` to every authed call `lib/api.ts` makes from here on.

- [ ] **3. Swap `lib/api.ts` over, function by function**
Keep the existing function signatures so components don't need to change — only the
implementation, mock arrays → real `fetch` calls:
  - `getListings` → `GET /api/listings?lat&lng&radius&search&category`
  - `getListingById` → `GET /api/listings/:id`
  - `createListing` → `POST /api/listings`
  - `getChatThreads` → `GET /api/threads`
  - `getChatMessages` → `GET /api/threads/:id/messages`
  - `sendMessage` → `POST /api/threads/:id/messages`
  - new: `expressInterest` → `POST /api/listings/:id/interest`
  - new: `getSellerProfile` → `GET /api/users/:id`
  - new: `getMyActivity` → `GET /api/me/activity`
  - new: `getMeetup` / `proposeMeetup` / `acceptMeetup` / `declineMeetup` / `confirmMeetupDone`
    → the five `GET/POST /api/threads/:id/meetup(...)` endpoints — `Messaging.tsx`'s handlers
    currently only touch local state and need to call these instead.

- [ ] **4. Pincode-based location**
`LocationModal.tsx` currently uses a hardcoded `LOCATION_RESULTS` array (4 fixed Pune areas).
Replace with real pincode entry + geocoding (India Post pincode API or similar) so `lat`/`lng`
resolve dynamically instead of being pre-baked.

- [ ] **5. Image upload**
Once a storage approach is picked (see gap above), wire the Create Listing form to actually
upload a file and pass the resulting URL to `createListing`.

Leave payment-hold/escrow out, per the original scoped-down plan.