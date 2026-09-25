'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ListFilter, Search, SlidersHorizontal } from 'lucide-react'
import type { Listing } from '../../lib/types'
import { getListings } from '../../lib/api'
import { ListingCard } from './ListingCard'

export function Browse({
  initialSearch,
  onSelectListing,
  onBack,
  coords,
}: {
  initialSearch?: string
  onSelectListing: (l: Listing) => void
  onBack: () => void
  coords: { lat: number; lng: number } | null
}) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch ?? '')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getListings(coords ?? undefined).then(data => {
      if (!cancelled) {
        setListings(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [coords])

  const filtered = listings.filter(
    item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="page">
      <div className="page-head">
        <button className="back" onClick={onBack}><ArrowLeft size={18} /></button>
        <div><p className="eyebrow">Marketplace</p><h1>Browse listings</h1></div>
      </div>
      <div className="browse-tools">
        <div className="searchbar compact">
          <Search size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings..." />
        </div>
        <button className="filter-button"><SlidersHorizontal size={17} /> Filters</button>
      </div>
      <div className="browse-meta">
        <span>{loading ? 'Loading…' : `${filtered.length} listings near you`}</span>
        <button><ListFilter size={15} /> Sort: Newest</button>
      </div>

      {loading ? (
        <div className="empty"><Search size={30} /><h2>Fetching listings…</h2></div>
      ) : filtered.length ? (
        <div className="listing-grid four">
          {filtered.map(item => (
            <ListingCard key={item.id} listing={item} onClick={() => onSelectListing(item)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={30} />
          <h2>No listings found</h2>
          <p>Try searching for something else.</p>
        </div>
      )}
    </div>
  )
}