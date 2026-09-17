'use client'

import { useState } from 'react'
import { Edit2, X } from 'lucide-react'

export type EditableProfile = { name: string; phone: string; address: string; initials: string }

export function EditProfileModal({
  profile,
  onClose,
  onEditAddress,
  onSave,
}: {
  profile: EditableProfile
  onClose: () => void
  onEditAddress: () => void
  onSave: (updated: EditableProfile) => void
}) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)

  const handleSave = () => {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || profile.initials
    onSave({ name, phone, address: profile.address, initials })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <h3 style={{ textAlign: 'center' }}>Edit profile</h3>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 20px' }}>
          <div style={{ position: 'relative' }}>
            <span className="large-avatar" style={{ width: 72, height: 72, fontSize: 22 }}>{profile.initials}</span>
            <button
              type="button"
              className="modal-close"
              style={{ position: 'absolute', bottom: -2, right: -2, top: 'auto', left: 'auto', width: 26, height: 26 }}
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>
          Full name
          <input value={name} onChange={e => setName(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 11, fontWeight: 400 }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>
          Phone number
          <input value={phone} onChange={e => setPhone(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 11, fontWeight: 400 }} />
        </label>

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>Address</span>
            <button type="button" onClick={onEditAddress} style={{ background: 'none', border: 0, color: 'var(--green)', fontWeight: 700, fontSize: 12 }}>Edit</button>
          </div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 11, fontSize: 13, color: 'var(--muted)', background: 'var(--background)' }}>
            {profile.address}
          </div>
        </div>

        <button className="primary-action full" onClick={handleSave}>Save changes</button>
      </div>
    </div>
  )
}