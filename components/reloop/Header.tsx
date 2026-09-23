'use client'

import { Bell, ChevronRight, MapPin } from 'lucide-react'
import { getStoredUser } from '@/lib/auth'

export function Header({
  location = 'Kothrud, Pune',
  onOpenLocation,
  onGoHome,
  onGoProfile,
  onNotify,
}: {
  location?: string
  onOpenLocation: () => void
  onGoHome: () => void
  onGoProfile: () => void
  onNotify: (message: string) => void
}) {
  const user = getStoredUser()

  return (
    <header className="topbar">
      <button className="brand" onClick={onGoHome}>
        <span className="brand-mark">↻</span>
        <span>ReLoop</span>
      </button>
      <button className="location" onClick={onOpenLocation}>
        <MapPin size={16} />
        <span>{location}</span>
        <ChevronRight size={15} />
      </button>
      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications" onClick={() => onNotify('You are all caught up')}>
          <Bell size={19} />
        </button>
        <button className="avatar" onClick={onGoProfile}>{user?.initials ?? '?'}</button>
      </div>
    </header>
  )
}