'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronRight, Clock3, LogOut, ShieldCheck } from 'lucide-react'
import { getStoredUser, clearAuth } from '../../lib/auth'
import { getMyActivity } from '../../lib/api'

export function Profile({
  onBack,
  onActivity,
  onEdit,
  onLogout,
}: {
  onBack: () => void
  onActivity: () => void
  onEdit: () => void
  onLogout: () => void
}) {
  const user = getStoredUser()
  const [listingsCount, setListingsCount] = useState<number | null>(null)
  const [exchangesCount, setExchangesCount] = useState<number | null>(null)

  useEffect(() => {
    getMyActivity()
      .then(activity => {
        setListingsCount(activity.selling.active.length + activity.selling.sold.length)
        setExchangesCount(activity.selling.sold.length)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page profile-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <div className="profile-hero">
        <span className="large-avatar">{user?.initials ?? '?'}</span>
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>{user?.name ?? 'Loading…'}</h1>
          {user?.phone_number && <p className="muted" style={{ textAlign: 'left' }}>{user.phone_number}</p>}
          {user?.verified && (
            <span className="verified-line"><ShieldCheck size={15} /> Verified with DigiLocker</span>
          )}
        </div>
        <button className="secondary-action" onClick={onEdit}>Edit profile</button>
      </div>
      <div className="profile-stats">
        <div><strong>{listingsCount ?? '—'}</strong><span>Listings</span></div>
        <div><strong>{exchangesCount ?? '—'}</strong><span>Successful exchanges</span></div>
      </div>
      <div className="profile-menu">
        <button onClick={onActivity}>
          <Clock3 />
          <span><strong>My activity</strong><small>Your selling and buying, in one place</small></span>
          <ChevronRight />
        </button>
        <button
          onClick={() => {
            clearAuth()
            onLogout()
          }}
        >
          <LogOut />
          <span><strong>Log out</strong><small>Sign out of your ReLoop account</small></span>
          <ChevronRight />
        </button>
      </div>
    </div>
  )
} 