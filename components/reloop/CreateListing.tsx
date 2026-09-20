'use client'

import { useState } from 'react'
import { ArrowLeft, Camera, ChevronRight, ShieldCheck } from 'lucide-react'
import { THRESHOLDS, rupee } from '../../lib/mock-data'
import { createListing, uploadFiles } from '../../lib/api'
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
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setPhotos(prev => [...prev, ...files])
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    e.target.value = '' // lets the same file be re-picked later if removed and re-added
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]) // free the preview memory
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setDocFile(file)
  }

  const threshold = category ? THRESHOLDS[category] : Infinity
  const isClusterB = Boolean(category) && Number(price || 0) >= threshold

  const publish = async () => {
    setSubmitting(true)
    try {
      let imageUrls: string[] = []
      if (photos.length > 0) {
        setUploading(true)
        imageUrls = await uploadFiles(photos)
        setUploading(false)
      }

      let documentUrl: string | undefined
      if (docFile) {
        setUploading(true)
        const [uploadedDocUrl] = await uploadFiles([docFile])
        documentUrl = uploadedDocUrl
        setUploading(false)
      }

      await createListing({
        title: title || 'Untitled listing',
        category: category || 'Other',
        price: Number(price || 0),
        description,
        images: imageUrls,
        documentType: docType || undefined,
        documentUrl,
      })
      onCreated()
    } catch (err: any) {
      alert(err.message) // simple for now — can swap for inline error state if you want
    } finally {
      setSubmitting(false)
      setUploading(false)
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
          <input
            type="file"
            accept="image/*"
            multiple
            id="photo-input"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
          <label htmlFor="photo-input" className="chip" style={{ cursor: 'pointer' }}>
            Choose photos
          </label>
          {photoPreviews.length > 0 && (
            <div className="chip-row" style={{ marginTop: 12 }}>
              {photoPreviews.map((src, i) => (
                <div key={src} style={{ position: 'relative' }}>
                  <img src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: -6, right: -6, borderRadius: '50%', width: 20, height: 20, lineHeight: '20px', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
                <div className="upload-box small">
                  <Camera size={22} />
                  <strong>Upload {docType.toLowerCase()}</strong>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    id="doc-input"
                    style={{ display: 'none' }}
                    onChange={handleDocSelect}
                  />
                  <label htmlFor="doc-input" className="chip" style={{ cursor: 'pointer' }}>
                    {docFile ? docFile.name : 'Choose file'}
                  </label>
                </div>
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