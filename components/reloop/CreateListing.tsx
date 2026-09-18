'use client'

import { useState } from 'react'
import { ArrowLeft, Camera, ChevronRight, ShieldCheck } from 'lucide-react'
import { THRESHOLDS, rupee } from '../../lib/mock-data'
import { createListing } from '../../lib/api'
import { DigiLockerGate } from './DigiLockerGate'

export function CreateListing({
  onBack,
  onCreated,
  everVerified,
  onVerified,
}: {
  onBack: () => void
  onCreated: () => void
  everVerified: boolean
  onVerified: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [docType, setDocType] = useState('')
  const [gateOpen, setGateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const threshold = category ? THRESHOLDS[category] : Infinity
  const isClusterB = Boolean(category) && Number(price || 0) >= threshold

  const publish = async () => {
  setSubmitting(true)
  try {
    await createListing({
      title: title || 'Untitled listing',
      category: category || 'Other',
      price: Number(price || 0),
      description,
    })
    onCreated()
  } catch (err: any) {
    alert(err.message) // simple for now — can swap for inline error state if you want
  } finally {
    setSubmitting(false)
  }
}

  const attemptPublish = () => {
    if (!everVerified) {
      setGateOpen(true)
      return
    }
    publish()
  }

  return (
    <div className="page create">
      <div className="page-head">
        <button className="back" onClick={onBack}><ArrowLeft size={18} /></button>
        <div><p className="eyebrow">Pass it on</p><h1>Create a listing</h1></div>
      </div>
      <div className="create-layout">
        <div className="upload-box">
          <Camera size={28} />
          <strong>Add photos</strong>
          <small>Clear photos help things find a new home</small>
          <button type="button">Choose photos</button>
        </div>
        <div className="form-card">
          <label>What are you listing?
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wireless headphones" />
          </label>
          <label>Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Choose a category</option>
              {Object.keys(THRESHOLDS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="form-row">
            <label>Price<input value={price} onChange={e => setPrice(e.target.value)} placeholder="₹ 0" /></label>
          </div>
          <label>Description
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people a little about it..." />
          </label>

          {isClusterB && (
            <div className="verify-section">
              <div className="threshold-note">
                <ShieldCheck size={17} />
                <span>This item's price crosses the verification threshold for {category} ({rupee(threshold)}+). A few extra details are needed before it goes live.</span>
              </div>
              <label>Condition notes<textarea placeholder="Describe scratches, functional issues, service history..." /></label>
              <div className="upload-box small"><Camera size={22} /><strong>Functional-proof photo or video</strong></div>
              <label>Ownership document type
                <div className="chip-row">
                  {['Warranty', 'Insurance', 'Receipt', 'Service record', 'Not applicable'].map(d => (
                    <button
                      type="button"
                      key={d}
                      className={`chip ${docType === d ? 'selected' : ''}`}
                      onClick={() => setDocType(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </label>
              {docType && docType !== 'Not applicable' && (
                <div className="upload-box small"><Camera size={22} /><strong>Upload {docType.toLowerCase()}</strong></div>
              )}
            </div>
          )}

          <button className="primary-action full" onClick={attemptPublish} disabled={submitting}>
            {submitting ? 'Publishing…' : <>Publish listing <ChevronRight size={17} /></>}
          </button>
          {!everVerified && (
            <p className="muted" style={{ marginTop: -8 }}>
              You'll verify your identity with DigiLocker the first time you publish — one time only.
            </p>
          )}
        </div>
      </div>

      {gateOpen && (
        <DigiLockerGate
          onClose={() => setGateOpen(false)}
          onDone={async () => {
            onVerified()
            setGateOpen(false)
            await publish()
          }}
        />
      )}
    </div>
  )
}