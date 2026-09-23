'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { searchLocations } from '../../lib/api'

type LocResult = { name: string; addr: string; lat: number; lng: number }

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
  const [results, setResults] = useState<LocResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLoc, setSelectedLoc] = useState<LocResult | null>(null)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    if (!search || search.trim().length < 3) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const timeout = setTimeout(() => {
      searchLocations(search).then(data => {
        if (!cancelled) {
          setResults(data)
          setSearching(false)
        }
      }).catch(() => {
        if (!cancelled) setSearching(false)
      })
    }, 500) // debounce — waits for a pause in typing before hitting the backend

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [search])

  const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationError("Your browser doesn't support location detection. Try searching for your area instead.")
    return
  }
  setLocationError('')
  navigator.geolocation.getCurrentPosition(
    pos => {
      setSelectedLoc({
        name: 'Current location',
        addr: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      })
    },
    err => {
      const message =
        err.code === err.PERMISSION_DENIED
          ? 'Location access was denied. Try searching for your area instead.'
          : "Couldn't detect your location. Try searching for your area instead."
      setLocationError(message)
    }
  )
}

  if (!isOpen) return null

  const handleConfirm = () => {
    onSelectLocation(selectedLoc ? selectedLoc.name : 'your area')
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
            {searching && <p className="muted">Searching…</p>}
            {!searching && search.trim().length >= 3 && results.length === 0 && (
              <p className="muted">No matches found — try a nearby landmark or locality name.</p>
            )}
            {results.map(loc => (
              <button key={`${loc.lat}-${loc.lng}`} className="loc-result" onClick={() => setSelectedLoc(loc)}>
                <MapPin size={16} />
                <span><strong>{loc.name}</strong><small>{loc.addr}</small></span>
              </button>
            ))}
            <button className="use-current" onClick={useCurrentLocation}>
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