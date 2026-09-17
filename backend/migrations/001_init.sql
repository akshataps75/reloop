-- Enable PostGIS (safe to re-run, no-op if already on)
CREATE EXTENSION IF NOT EXISTS postgis;

-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  initials      TEXT NOT NULL,
  role          TEXT,                      -- e.g. "MCA Student" — free text, from SellerProfile.role
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  location      GEOGRAPHY(Point, 4326),    -- user's base location, nullable until they set it
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_location_idx ON users USING GIST (location);

-- LISTINGS
CREATE TABLE listings (
  id            SERIAL PRIMARY KEY,
  seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  image         TEXT,
  description   TEXT,
  condition     TEXT,
  cluster       TEXT NOT NULL DEFAULT 'A' CHECK (cluster IN ('A', 'B')),  -- clusterB -> cluster
  document_type TEXT,                       -- what kind of doc, if any
  document_url  TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  location      GEOGRAPHY(Point, 4326),      -- listing's location, for distance search
  sold_on       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX listings_location_idx ON listings USING GIST (location);
CREATE INDEX listings_seller_idx ON listings (seller_id);

-- LISTING INTERESTS (buyers interested in a listing — "InterestedBuyer")
CREATE TABLE listing_interests (
  id            SERIAL PRIMARY KEY,
  listing_id    INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interested_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);

-- CHAT THREADS
CREATE TABLE chat_threads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)   -- one thread per buyer per listing
);

-- CHAT MESSAGES
CREATE TABLE chat_messages (
  id          SERIAL PRIMARY KEY,
  thread_id   UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_thread_idx ON chat_messages (thread_id);

-- MEETUPS
CREATE TABLE meetups (
  id            SERIAL PRIMARY KEY,
  thread_id     UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none','pending','confirmed','declined')),
  date          DATE,
  time          TIME,
  place         TEXT,
  code          TEXT,
  requested_by_user_id UUID REFERENCES users(id),
  done_by_seller BOOLEAN NOT NULL DEFAULT FALSE,
  done_by_buyer  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX meetups_thread_idx ON meetups (thread_id);