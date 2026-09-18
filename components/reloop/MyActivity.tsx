'use client'

import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type KeyboardEvent } from 'react'
import { rupee } from '../../lib/mock-data'
import { getMyActivity } from '../../lib/api'

export function MyActivity({
  onBack,
  onSelectSellingItem,
  onSelectBuyingListing,
}: {
  onBack: () => void
  onSelectSellingItem: (listingId: number) => void
  onSelectBuyingListing: (listingId: number) => void
}) {
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [sellSub, setSellSub] = useState<'active' | 'sold'>('active')
  const [buySub, setBuySub] = useState<'ongoing' | 'completed'>('ongoing')
  const [data, setData] = useState<any>({ selling: { active: [], sold: [] }, buying: { ongoing: [], completed: [] } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyActivity().then(d => { setData(d); setLoading(false) })
  }, [])

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

      {loading ? (
        <div className="empty"><h2>Loading…</h2></div>
      ) : tab === 'selling' ? (
        <>
          <div className="tabs" style={{ marginTop: 28, marginBottom: 24 }}>
            <button className={`tab ${sellSub === 'active' ? 'active' : ''}`} onClick={() => setSellSub('active')}>
              Active <span className="tab-badge">{data.selling.active.length}</span>
            </button>
            <button className={`tab ${sellSub === 'sold' ? 'active' : ''}`} onClick={() => setSellSub('sold')}>
              Sold <span className="tab-badge">{data.selling.sold.length}</span>
            </button>
          </div>
          <div className="activity-grid">
            {(sellSub === 'active' ? data.selling.active : data.selling.sold).map((item: any) => (
              <div
                className="activity-card" key={item.id} role="button" tabIndex={0}
                onClick={() => onSelectSellingItem(item.id)}
                onKeyDown={e => handleCardKeyDown(e, () => onSelectSellingItem(item.id))}
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
      ) : (
        <>
          <div className="tabs" style={{ marginTop: 28, marginBottom: 24 }}>
            <button className={`tab ${buySub === 'ongoing' ? 'active' : ''}`} onClick={() => setBuySub('ongoing')}>
              On going <span className="tab-badge">{data.buying.ongoing.length}</span>
            </button>
            <button className={`tab ${buySub === 'completed' ? 'active' : ''}`} onClick={() => setBuySub('completed')}>
              Completed <span className="tab-badge">{data.buying.completed.length}</span>
            </button>
          </div>
          <div className="activity-grid">
            {(buySub === 'ongoing' ? data.buying.ongoing : data.buying.completed).map((item: any) => (
              <div
                className="activity-card" key={item.id} role="button" tabIndex={0}
                onClick={() => onSelectBuyingListing(item.listingId)}
                onKeyDown={e => handleCardKeyDown(e, () => onSelectBuyingListing(item.listingId))}
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
    </div>
  )
}