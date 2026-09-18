'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import type { InterestedBuyer, Listing } from '../../lib/types'
import { rupee } from '../../lib/mock-data'
import { getListingById, getInterestedBuyers } from '../../lib/api'

export function SellingListingDetail({
  listingId,
  onBack,
  onMessageBuyer,
}: {
  listingId: number
  onBack: () => void
  onMessageBuyer: (threadId: string) => void
}) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [buyers, setBuyers] = useState<InterestedBuyer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getListingById(listingId).then(async l => {
      if (!l || cancelled) return
      setListing(l)
      if (l.status !== 'sold') {
        const b = await getInterestedBuyers(listingId).catch(() => [])
        if (!cancelled) setBuyers(b)
      }
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [listingId])

  if (loading || !listing) {
    return <div className="page detail-page"><div className="empty"><h2>Loading…</h2></div></div>
  }

  const isSold = listing.status === 'sold'

  return (
    <div className="page detail-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back to activity</button>
      <div className="detail-layout">
        <div className="detail-visual">
          <img src={listing.image || '/placeholder.svg'} alt={listing.title} />
          {isSold && <span className="detail-badge">SOLD</span>}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{listing.category}</p>
          <h1>{listing.title}</h1>
          <div className="detail-price">{rupee(listing.price)}</div>
          <p className="detail-description">{listing.description}</p>

          {!isSold && (
            <div className="section" style={{ padding: '24px 0 0' }}>
              <div className="section-heading"><h2 style={{ fontSize: 20 }}>Interested buyers</h2></div>
              {buyers.length === 0 ? (
                <p className="muted" style={{ marginTop: 14 }}>No one has shown interest yet.</p>
              ) : (
                <div className="buyer-list">
                  {buyers.map(buyer => (
                    <div className="buyer-row" key={buyer.threadId}>
                      <span className="profile-avatar">{buyer.initials}</span>
                      <div>
                        <strong>{buyer.name}</strong>
                        <small>Showed interest on {buyer.interestedOn}</small>
                      </div>
                      <button className="secondary-action" onClick={() => onMessageBuyer(buyer.threadId)}>
                        <MessageCircle size={16} /> Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSold && (
            <div className="section" style={{ padding: '24px 0 0' }}>
              <div className="section-heading"><h2 style={{ fontSize: 20 }}>Sold</h2></div>
              <p className="muted" style={{ marginTop: 14 }}>
                {listing.soldOn ? `Marked as sold on ${new Date(listing.soldOn).toLocaleDateString()}.` : 'This item has been marked as sold.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}