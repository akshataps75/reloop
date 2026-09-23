'use client'

import { CalendarClock } from 'lucide-react'
import type { Meetup } from '../../lib/types'

export function MeetupCard({
  meetup,
  myInitials,
  otherInitials,
  otherName,
  onAccept,
  onDecline,
  onConfirmDone,
  onSimulateThem,
}: {
  meetup: Meetup
  myInitials: string
  otherInitials: string
  otherName: string
  onAccept: () => void
  onDecline: () => void
  onConfirmDone: () => void
  onSimulateThem?: () => void
}) {
  if (meetup.status === 'none') return null

  if (meetup.status === 'declined') {
    return <div className="system-line">Meetup request declined</div>
  }

  if (meetup.status === 'pending') {
    const iRequested = meetup.requestedBy === 'me'
    return (
      <div className="meetup-card">
        <div className="head"><CalendarClock size={15} /> Meetup request</div>
        <div className="detail">{meetup.date}, {meetup.time} · {meetup.place}</div>
        {!iRequested && (
          <div className="meetup-actions">
            <button className="decline" onClick={onDecline}>Decline</button>
            <button className="accept" onClick={onAccept}>Accept</button>
          </div>
        )}
        {iRequested && <div className="detail" style={{ marginTop: 8 }}>Waiting for {otherName} to respond</div>}
      </div>
    )
  }

    // confirmed
  return (
    <div className="meetup-card">
      <div className="head"><CalendarClock size={15} /> Meetup confirmed</div>
      <div className="detail">{meetup.date}, {meetup.time} · {meetup.place}</div>
      <div className="code-card">
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Confirmation code</div>
        <div className="code">{meetup.code}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Share this in person at the meetup</div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="confirm-row">
          <span className="who"><span className="profile-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{myInitials}</span>You</span>
          <span className={`confirm-dot ${meetup.doneByMe ? 'done' : 'pending'}`}>{meetup.doneByMe ? '✓' : ''}</span>
        </div>
        <div className="confirm-row">
          <span className="who"><span className="profile-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{otherInitials}</span>{otherName}</span>
          <span className={`confirm-dot ${meetup.doneByThem ? 'done' : 'pending'}`}>{meetup.doneByThem ? '✓' : ''}</span>
        </div>
        {!meetup.doneByMe && (
          <button className="confirm-btn" onClick={onConfirmDone}>Confirm it happened</button>
        )}
        {meetup.doneByMe && !meetup.doneByThem && onSimulateThem && (
          <button
            onClick={onSimulateThem}
            style={{ width: '100%', marginTop: 6, background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 11, textDecoration: 'underline', padding: '4px 0' }}
          >
            Demo only — mark {otherName}'s side too
          </button>
        )}
      </div>
    </div>
  )
}
