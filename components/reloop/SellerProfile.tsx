'use client'

import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { SellerProfile as SellerProfileType } from '../../lib/types'
import { rupee } from '../../lib/mock-data'

export function SellerProfile({
  seller,
  onBack,
  onSelectListing,
}: {
  seller: SellerProfileType
  onBack: () => void
  onSelectListing: (listingId: number) => void
}) {
  return (
    <div className="page profile-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <div className="profile-hero">
        <span className="large-avatar">{seller.initials}</span>
        <div>
          <p className="eyebrow">Seller profile</p>
          <h1>{seller.name}</h1>
          <p className="muted">{seller.role}</p>
          {seller.verified && (
            <span className="verified-line"><ShieldCheck size={15} /> Verified with DigiLocker</span>
          )}
        </div>
      </div>
      <div className="profile-stats">
        <div><strong>{seller.stats.listings}</strong><span>Listings</span></div>
        <div><strong>{seller.stats.exchanges}</strong><span>Successful exchanges</span></div>
      </div>

      <div className="section">
        <div className="section-heading">
          <h2>Listings by {seller.name}</h2>
        </div>
        <div className="seller-listing-grid">
          {seller.listings.map(item => {
            const isSold = item.status === 'sold'
            return (
              <button
                key={item.id}
                className={`seller-item-card ${isSold ? 'is-sold' : ''}`}
                onClick={() => { if (!isSold) onSelectListing(item.id) }}
                aria-disabled={isSold}
              >
                <div className="seller-item-thumb">
                  <img src={item.image || '/placeholder.svg'} alt={item.title} />
                  {isSold && (
                    <div className="sold-overlay">
                      <span className="sold-tag">SOLD</span>
                    </div>
                  )}
                </div>
                <div className="seller-item-body">
                  <strong>{item.title}</strong>
                  <div className="price">{rupee(item.price)}</div>
                  {isSold && item.soldOn && <div className="sub">Sold on {item.soldOn}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}