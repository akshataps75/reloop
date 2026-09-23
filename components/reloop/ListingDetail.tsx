'use client'

import { useState } from 'react'
import { ArrowLeft, Check, ChevronRight, FileText, MapPin, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Listing } from '@/lib/types'
import { rupee } from '@/lib/mock-data'

export function ListingDetail({
  listing,
  interested,
  onInterested,
  onBack,
  onMessage,
  onSellerProfile,
}: {
  listing: Listing
  interested: boolean
  onInterested: () => void
  onBack: () => void
  onMessage: () => void
  onSellerProfile: () => void
}) {
  const gallery = listing.images && listing.images.length > 0 ? listing.images : [listing.image || '/placeholder.svg']
  const [activeImage, setActiveImage] = useState(0)
  return (
    <div className="page detail-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back to listings</button>
      <div className="detail-layout">
        <div className="detail-visual">
          <img src={gallery[activeImage]} alt={listing.title} />
          <span className="detail-badge">NEW</span>
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={i === activeImage ? 'active' : ''}
                  style={{ padding: 0, border: i === activeImage ? '2px solid currentColor' : '2px solid transparent', borderRadius: 8, overflow: 'hidden' }}
                >
                  <img src={src} alt="" style={{ width: 56, height: 56, objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{listing.category} · Listed {listing.time}</p>
          <h1>{listing.title}</h1>
          <div className="detail-price">{rupee(listing.price)}</div>
          <p className="detail-description">
            {listing.description ?? 'Gently used and well cared for. Happy to share more photos or answer any questions. Open to a quick meetup nearby.'}
          </p>
          <div className="detail-location">
            <MapPin size={17} />
            <span><strong>{listing.distance}</strong></span>
          </div>
          <div className="seller-panel" onClick={onSellerProfile}>
            <span className="profile-avatar">{listing.initials}</span>
            <div>
              <strong>{listing.seller}</strong>
              {listing.sellerVerified && <span><ShieldCheck size={14} /> Verified member</span>}
            </div>
            <ChevronRight />
          </div>
          <div className="detail-actions">
            <button className={`primary-action ${interested ? 'disabled' : ''}`} disabled={interested} onClick={onInterested}>
              {interested ? <><Check size={18} /> Interest sent</> : "I'm interested"}
            </button>
            {interested && (
              <button className="secondary-action" onClick={onMessage}>
                <MessageCircle size={18} /> Message
              </button>
            )}
          </div>
          {interested && listing.clusterB && listing.documentUrl && (
            <a className="document-link" href={listing.documentUrl} target="_blank" rel="noreferrer">
              <FileText size={16} />
              <span>View ownership document<small>Opens the seller's uploaded document (PDF)</small></span>
            </a>
          )}
          <div className="safety-note">
            <ShieldCheck size={18} />
            <span><strong>Meet safely</strong><small>Keep conversations in ReLoop and meet in a public place.</small></span>
          </div>
        </div>
      </div>
    </div>
  )
}