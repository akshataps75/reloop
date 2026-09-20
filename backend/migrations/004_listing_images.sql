-- Add support for multiple listing photos.
-- `image` stays as the single cover photo for backward compatibility
-- (ListingCard, seller profiles, etc. keep working unchanged).
-- `images` holds the full ordered list; images[1] should match `image`.
ALTER TABLE listings ADD COLUMN images TEXT[] NOT NULL DEFAULT '{}';

-- Backfill existing rows so `images` isn't empty for listings created
-- before this migration (keeps old seeded/demo data consistent).
UPDATE listings SET images = ARRAY[image] WHERE image IS NOT NULL AND images = '{}';