# ReLoop

## What is this?

ReLoop is a marketplace for people to buy, sell, and pass on second-hand
items to others nearby — things like books, electronics, furniture,
appliances, or clothes that one person doesn't need anymore but someone
else in the same area would happily use.

It works like other local classifieds apps (OLX, Quikr, Facebook
Marketplace) in the basic idea — list something, someone nearby buys it —
but it's built around one core difference: **not every item deserves the
same amount of caution.**

## The core idea: not all trades are equally risky

Think about the difference between buying a used paperback book for ₹50
versus buying a second-hand refrigerator for ₹15,000. Most marketplace
apps treat both the exact same way: snap a photo, write a price, chat,
meet up, done. But those two trades really aren't the same:

- The book is cheap, the decision is quick, and if it turns out to be a
  bit worn, no big deal.
- The refrigerator is expensive, you'd want to actually inspect it, know
  its condition and age, and be a lot more careful before handing over
  that much money.

So instead of treating every category the same way, this app sorts
listings into two groups based on **how much the trade is really worth
being careful about** — not by what the item technically *is*:

- **Quick trades** — low-value, fast-decision items (clothes, books,
  kitchenware). Listing one of these is minimal: photo, price, done.
- **Careful trades** — higher-value items that genuinely benefit from
  more scrutiny (furniture, appliances, electronics, or anything
  expensive enough regardless of category). Listing one of these asks
  for a bit more: the item's condition, its age, and proof you actually
  own it.

The app figures out automatically which group a listing belongs to,
based on its category and price — the person listing it doesn't have to
decide that themselves.

## How trust works here

Most local marketplace apps rely on star ratings and reviews, which
don't do much to stop someone impersonating a legitimate seller or asking
for a fake "advance payment" before ever showing up. This app takes a
different approach: **everyone verifies who they really are, once, right
when they sign up** — similar to how some apps ask you to confirm your
identity using a government-issued ID. Once done, a visible "verified"
badge appears on that person's profile everywhere — their listings, their
chats, everything.

This means: by the time you're messaging someone or agreeing to meet
them, you already know they're a real, accountable person — not an
anonymous stranger with just a made-up username and a star rating.

## How does it actually work, step by step?

1. **You sign up and verify your identity.** This happens once, the
   first time you try to post a listing — not every single time.

2. **You list something you want to sell.** Title, category, price,
   description, photos. If it's a "careful trade" item (see above), you
   also add a bit more detail and proof of ownership.

3. **You can also share why you're giving it away.** Every listing has
   an optional space for a short story — not hidden behind the price,
   shown right alongside it. It's meant to keep this feeling more
   personal than a plain classified ad.

4. **You see listings from nearby, not the whole city.** By default, you
   see what's actually close to you, with an option to widen that to
   neighboring areas too — so the app stays genuinely local, not an
   endless citywide scroll.

5. **If someone's interested, they message the seller directly**, in a
   private conversation inside the app.

6. **They arrange a meetup** right inside that same conversation —
   proposing a time and place, and the other person accepting it.

7. **Once both people confirm the handoff actually happened**, the item
   is marked sold, and it comes off the marketplace.

8. **Everyone can see their own activity** — what they're selling, what
   they've shown interest in buying, and what they've completed before.

## What's not built yet (known limitations)

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