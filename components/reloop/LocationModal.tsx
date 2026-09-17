'use client'

import { useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { LOCATION_RESULTS } from '../../lib/mock-data'

export function LocationModal({
  isOpen,
  onClose,
  onSelectLocation,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectLocation: (locName: string) => void
}) {
  const [search, setSearch] = useState('')
  const [selectedLoc, setSelectedLoc] = useState<(typeof LOCATION_RESULTS)[0] | null>(null)

  if (!isOpen) return null

  const filtered = LOCATION_RESULTS.filter(
    loc =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.addr.toLowerCase().includes(search.toLowerCase()),
  )

  const handleConfirm = () => {
    onSelectLocation(selectedLoc ? `${selectedLoc.name}, Pune` : 'Baner, Pune')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <h3>Set your location</h3>

        {!selectedLoc ? (
          <>
            <div className="modal-search">
              <Search size={16} />
              <input placeholder="Search area or society" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filtered.map(loc => (
              <button key={loc.name} className="loc-result" onClick={() => setSelectedLoc(loc)}>
                <MapPin size={16} />
                <span><strong>{loc.name}</strong><small>{loc.addr}</small></span>
              </button>
            ))}
            <button className="use-current" onClick={() => setSelectedLoc(LOCATION_RESULTS[1])}>
              <MapPin size={16} /> Use current location
            </button>
          </>
        ) : (
          <>
            <div className="map-preview">
              <iframe
                title="Map preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLoc.lng - 0.02}%2C${selectedLoc.lat - 0.02}%2C${selectedLoc.lng + 0.02}%2C${selectedLoc.lat + 0.02}&layer=mapnik&marker=${selectedLoc.lat}%2C${selectedLoc.lng}`}
              />
              <button className="change-area" onClick={() => setSelectedLoc(null)}>Change area</button>
            </div>
            <div className="loc-result" style={{ cursor: 'default' }}>
              <MapPin size={16} />
              <span><strong>{selectedLoc.name}</strong><small>{selectedLoc.addr}</small></span>
            </div>
            <button className="use-current" onClick={handleConfirm}>Confirm location</button>
          </>
        )}
      </div>
    </div>
  )
}