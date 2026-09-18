'use client'

import { useState } from 'react'
import { Check, Loader2, ShieldCheck, X } from 'lucide-react'
import { startVerification, completeVerification } from '../../lib/api'

export function DigiLockerGate({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [stage, setStage] = useState<'intro' | 'loading' | 'success' | 'error'>('intro')
  const [error, setError] = useState('')

  const runVerification = async () => {
    setStage('loading')
    try {
      await startVerification()
      await completeVerification()
      setStage('success')
    } catch (err: any) {
      setError(err.message)
      setStage('error')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box dg-modal">
        {stage !== 'success' && (
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        )}

        {stage === 'intro' && (
          <>
            <div className="dg-icon"><ShieldCheck size={28} /></div>
            <h3>Verify your identity to continue</h3>
            <p>To keep ReLoop trustworthy, we verify sellers the first time they list an item — a one-time check via DigiLocker.</p>
            <div className="dg-steps">
              <div><Check size={14} /> Sign in with your DigiLocker account</div>
              <div><Check size={14} /> Confirm the details we pull are yours</div>
              <div><Check size={14} /> Come back here — no extra steps</div>
            </div>
            <button className="primary-action full" onClick={runVerification}>
              Continue with DigiLocker
            </button>
          </>
        )}

        {stage === 'loading' && (
          <>
            <div className="dg-icon"><ShieldCheck size={28} /></div>
            <h3>Verifying with DigiLocker…</h3>
            <p>This is a mock step — a real integration would redirect to DigiLocker's OAuth screen here.</p>
            <button className="primary-action full disabled" disabled>
              <Loader2 size={16} className="spinner" /> Verifying
            </button>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="dg-icon"><X size={28} /></div>
            <h3>Verification failed</h3>
            <p className="threshold-note">{error}</p>
            <button className="primary-action full" onClick={runVerification}>Try again</button>
          </>
        )}

        {stage === 'success' && (
          <>
            <div className="dg-icon"><Check size={28} /></div>
            <h3>You're verified</h3>
            <p>Your profile now shows an Identity verified badge. Continuing to publish your listing.</p>
            <button className="primary-action full" onClick={onDone}>Continue</button>
          </>
        )}
      </div>
    </div>
  )
}