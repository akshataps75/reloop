'use client'

import { ArrowLeft, ChevronRight, Clock3, ShieldCheck } from 'lucide-react'
import { CURRENT_USER } from '../../lib/mock-data'

export function Profile({
  onBack,
  onActivity,
  onEdit,
}: {
  onBack: () => void
  onActivity: () => void
  onEdit: () => void
}) {
  return (
    <div className="page profile-page">
      <button className="back" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <div className="profile-hero">
        <span className="large-avatar">{CURRENT_USER.initials}</span>
        <div>
          <p className="eyebrow">Your profile</p>
          <h1>{CURRENT_USER.name}</h1>
          <p className="muted">{CURRENT_USER.role}</p>
          {CURRENT_USER.verified && (
            <span className="verified-line"><ShieldCheck size={15} /> Verified with DigiLocker</span>
          )}
        </div>
        <button className="secondary-action" onClick={onEdit}>Edit profile</button>
      </div>
      <div className="profile-stats">
        <div><strong>{CURRENT_USER.stats.listings}</strong><span>Listings</span></div>
        <div><strong>{CURRENT_USER.stats.exchanges}</strong><span>Successful exchanges</span></div>
        <div><strong>{CURRENT_USER.stats.rating}</strong><span>Community rating</span></div>
      </div>
      <div className="profile-menu">
        <button onClick={onActivity}>
          <Clock3 />
          <span><strong>My activity</strong><small>Your selling and buying, in one place</small></span>
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}