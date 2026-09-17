'use client'

import { MapPin, ShieldCheck } from 'lucide-react'
import type { Listing } from '../../lib/types'
import { rupee } from '../../lib/mock-data'

export function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  return (
    <button className="listing-card" onClick={onClick}>
      <div className="listing-image">
        <img src={listing.image || '/placeholder.svg'} alt={listing.title} />
        <span className="badge-new">NEW</span>
      </div>
      <div className="listing-info">
        <div className="listing-title">
          <strong>{listing.title}</strong>
          <b>{rupee(listing.price)}</b>
        </div>
        <div className="muted">
          <MapPin size={13} /> {listing.distance} <span>·</span> {listing.time}
        </div>
        <div className="seller">
          <span className="mini-avatar">{listing.initials}</span>
          <span>{listing.seller}</span>
          <ShieldCheck size={14} />
        </div>
      </div>
    </button>
  )
}