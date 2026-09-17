'use client'

import { ArrowLeft, MessageCircle } from 'lucide-react'
import type { SellingListingItem } from '../../lib/types'
import { rupee } from '../../lib/mock-data'

export function SellingListingDetail({
  item,
  onBack,
  onMessageBuyer,
}: {
  item: SellingListingItem
  onBack: () => void
  onMessageBuyer: (threadId: string) => void
}) {
  return (
    <div className="page detail-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back to activity</button>
      <div className="detail-layout">
        <div className="detail-visual">
          <img src={item.image || '/placeholder.svg'} alt={item.title} />
          {item.status === 'sold' && <span className="detail-badge">SOLD</span>}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{item.category} · {item.condition}</p>
          <h1>{item.title}</h1>
          <div className="detail-price">{rupee(item.price)}</div>
          <p className="detail-description">{item.description}</p>

          {item.status === 'active' && (
            <div className="section" style={{ padding: '24px 0 0' }}>
              <div className="section-heading"><h2 style={{ fontSize: 20 }}>Interested buyers</h2></div>
              {item.interestedBuyers.length === 0 ? (
                <p className="muted" style={{ marginTop: 14 }}>No one has shown interest yet.</p>
              ) : (
                <div className="buyer-list">
                  {item.interestedBuyers.map(buyer => (
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

          {item.status === 'sold' && item.buyer && (
            <div className="section" style={{ padding: '24px 0 0' }}>
              <div className="section-heading"><h2 style={{ fontSize: 20 }}>Sold to</h2></div>
              <div className="buyer-list">
                <div className="buyer-row">
                  <span className="profile-avatar">{item.buyer.initials}</span>
                  <div>
                    <strong>{item.buyer.name}</strong>
                    <small>Interested on {item.buyer.interestedOn} · Bought on {item.buyer.boughtOn}</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}