'use client'

import { useState } from 'react'
import { X, MapPin } from 'lucide-react'
import { LOCATION_RESULTS } from '../../lib/mock-data'

const DATE_OPTIONS = ['Sat, 13 Sep', 'Sun, 14 Sep', 'Mon, 15 Sep', 'Tue, 16 Sep']
const TIME_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM']

export function MeetupScheduler({
  listingTitle,
  otherName,
  onClose,
  onSend,
}: {
  listingTitle: string
  otherName: string
  onClose: () => void
  onSend: (date: string, time: string, place: string) => void
}) {
  const [date, setDate] = useState(DATE_OPTIONS[0])
  const [time, setTime] = useState(TIME_OPTIONS[1])
  const [spotIdx, setSpotIdx] = useState(0)
  const spot = LOCATION_RESULTS[spotIdx]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <h3>Propose a meetup</h3>
        <p style={{ marginTop: -8, marginBottom: 16, fontSize: 12, color: 'var(--muted)' }}>
          For {listingTitle}, with {otherName}
        </p>
        <div className="form-card" style={{ padding: 0, border: 0 }}>
          <label>
            Date
            <select value={date} onChange={e => setDate(e.target.value)}>
              {DATE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            Time
            <select value={time} onChange={e => setTime(e.target.value)}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Meetup spot
            <select value={spotIdx} onChange={e => setSpotIdx(Number(e.target.value))}>
              {LOCATION_RESULTS.map((loc, i) => (
                <option key={loc.name} value={i}>{loc.name} — {loc.addr}</option>
              ))}
            </select>
          </label>
          <div className="map-preview" style={{ height: 160 }}>
            <iframe
              title="Meetup spot preview"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${spot.lng - 0.02}%2C${spot.lat - 0.02}%2C${spot.lng + 0.02}%2C${spot.lat + 0.02}&layer=mapnik&marker=${spot.lat}%2C${spot.lng}`}
            />
          </div>
          <button
            className="primary-action"
            onClick={() => { onSend(date, time, `${spot.name}, ${spot.addr}`); onClose() }}
          >
            <MapPin size={15} style={{ marginRight: 6, verticalAlign: '-2px' }} />
            Send request
          </button>
        </div>
      </div>
    </div>
  )
}