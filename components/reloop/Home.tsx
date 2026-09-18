'use client'

import { ChevronRight, Search, ShieldCheck, Sparkles } from 'lucide-react'
import type { Listing } from '@/lib/types'
import { CATEGORIES, LISTINGS } from '@/lib/mock-data'
import { ListingCard } from './ListingCard'

export function Home({
  search,
  setSearch,
  onBrowse,
  onDetail,
  onCategory,
}: {
  search: string
  setSearch: (s: string) => void
  onBrowse: () => void
  onDetail: (l: Listing) => void
  onCategory: (c: string) => void
}) {
  return (
    <div className="page home-page">
      <section className="hero">
        <div>
          <h1>Good things<br /><em>find new homes.</em></h1>
          <p className="hero-copy">Buy, sell, and exchange with people around you. Better for your wallet, better for the planet.</p>
          <div className="searchbar">
            <Search size={19} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for anything..." />
            <button onClick={onBrowse}>Search</button>
          </div>
          <div className="quick-links">
            <span>Popular:</span>
            {['Books & Stationery', 'Electronics & Gadgets', 'Vehicles'].map(x => (
              <button key={x} onClick={() => onCategory(x)}>{x}</button>
            ))}
          </div>
        </div>
        <div className="hero-art">
          <div className="art-note">Pass it on</div>
          <div className="art-circle"><span>↗</span><strong>RE<br />USE</strong></div>
          <div className="art-caption">One person's unused<br />is another's perfect.</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Browse by</p><h2>What are you looking for?</h2></div>
          <button className="text-link" onClick={onBrowse}>View all <ChevronRight size={15} /></button>
        </div>
        <div className="category-grid">
          {CATEGORIES.map(([name, icon, count]) => (
            <button className="category-card" key={name} onClick={() => onCategory(name)}>
              <span className="category-icon">{icon}</span>
              <strong>{name}</strong>
              <small>{count}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Freshly listed</p><h2>Near you</h2></div>
          <button className="text-link" onClick={onBrowse}>See all <ChevronRight size={15} /></button>
        </div>
        <div className="listing-grid">
          {LISTINGS.slice(0, 3).map(l => <ListingCard listing={l} key={l.id} onClick={() => onDetail(l)} />)}
        </div>
      </section>

      <section className="trust-strip">
        <ShieldCheck size={26} />
        <div><strong>Built on trust</strong><span>Every member is verified through DigiLocker</span></div>
        <ChevronRight />
      </section>
    </div>
  )
}