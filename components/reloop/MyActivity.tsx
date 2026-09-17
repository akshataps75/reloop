'use client'

import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import type { SellingListingItem } from '../../lib/types'
import { BUYING, SELLING, rupee } from '../../lib/mock-data'

export function MyActivity({
  onBack,
  onSelectSellingItem,
  onSelectBuyingListing,
}: {
  onBack: () => void
  onSelectSellingItem: (item: SellingListingItem) => void
  onSelectBuyingListing: (listingId: number) => void
}) {
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [sellSub, setSellSub] = useState<'active' | 'sold'>('active')
  const [buySub, setBuySub] = useState<'ongoing' | 'completed'>('ongoing')

  const handleCardKeyDown = (e: KeyboardEvent<HTMLDivElement>, onActivate: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
        <div><p className="eyebrow">Your space</p><h1>My activity</h1></div>
      </div>

      <div className="switcher">
        <button className={tab === 'selling' ? 'active' : ''} onClick={() => setTab('selling')}>Selling</button>
        <button className={tab === 'buying' ? 'active' : ''} onClick={() => setTab('buying')}>Buying</button>
      </div>

      {tab === 'selling' && (
        <>
          <div className="tabs" style={{ marginTop: 28, marginBottom: 24 }}>
            <button className={`tab ${sellSub === 'active' ? 'active' : ''}`} onClick={() => setSellSub('active')}>
              Active <span className="tab-badge">{SELLING.active.length}</span>
            </button>
            <button className={`tab ${sellSub === 'sold' ? 'active' : ''}`} onClick={() => setSellSub('sold')}>
              Sold <span className="tab-badge">{SELLING.sold.length}</span>
            </button>
          </div>
          <div className="activity-grid">
            {(sellSub === 'active' ? SELLING.active : SELLING.sold).map(item => (
              <div
                className="activity-card"
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSellingItem(item)}
                onKeyDown={e => handleCardKeyDown(e, () => onSelectSellingItem(item))}
              >
                <img className="activity-thumb" src={item.image} alt={item.title} />
                <div className="body">
                  <strong>{item.title}</strong>
                  <div className="price">{rupee(item.price)}</div>
                  <div className="sub">{item.sub}</div>
                </div>
                <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'buying' && (
        <>
          <div className="tabs" style={{ marginTop: 28, marginBottom: 24 }}>
            <button className={`tab ${buySub === 'ongoing' ? 'active' : ''}`} onClick={() => setBuySub('ongoing')}>
              On going <span className="tab-badge">{BUYING.ongoing.length}</span>
            </button>
            <button className={`tab ${buySub === 'completed' ? 'active' : ''}`} onClick={() => setBuySub('completed')}>
              Completed <span className="tab-badge">{BUYING.completed.length}</span>
            </button>
          </div>
          <div className="activity-grid">
            {(buySub === 'ongoing' ? BUYING.ongoing : BUYING.completed).map(item => (
              <div
                className="activity-card"
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBuyingListing(item.listingId)}
                onKeyDown={e => handleCardKeyDown(e, () => onSelectBuyingListing(item.listingId))}
              >
                <img className="activity-thumb" src={item.image} alt={item.title} />
                <div className="body">
                  <strong>
                    {item.title}
                    {item.pending && <span className="pill-pending">Meetup pending</span>}
                  </strong>
                  <div className="price">{rupee(item.price)}</div>
                  <div className="sub">{item.sub}</div>
                </div>
                <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}