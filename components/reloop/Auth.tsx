'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { saveAuth, getToken, type AuthUser } from '../../lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function Auth({ onAuthed }: { onAuthed: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [step, setStep] = useState<1 | 2>(1)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [pincode, setPincode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signedUpUser, setSignedUpUser] = useState<AuthUser | null>(null)

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      saveAuth(data.token, data.user)

      if (mode === 'login') {
        onAuthed(data.user)
      } else {
        setSignedUpUser(data.user)
        setStep(2)
      }
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? "Can't reach the server — is it running?" : err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ phone, address: pincode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      saveAuth(getToken()!, data.user)
      onAuthed(data.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const skipProfile = () => {
    if (signedUpUser) onAuthed(signedUpUser)
  }

  return (
    <div className="auth-shell">
      <div className="auth-panel-left">
        <div className="auth-mark-ghost">↻</div>
        <div className="auth-ring auth-ring-1" />
        <div className="auth-ring auth-ring-2" />
        <div className="auth-ring auth-ring-3" />

        <div className="auth-brand">
          <span className="brand-mark">↻</span> ReLoop
        </div>
        <div className="auth-copy">
          <h1>Good things<br /><em>deserve a second home.</em></h1>
          <p>Buy, sell and swap with people nearby — no listing goes to waste.</p>
        </div>
        <div />
      </div>

      <div className="auth-panel-right">
        {mode === 'signup' && step === 2 ? (
          <form className="auth-form" onSubmit={submitProfile}>
            <span className="auth-step-label">Step 2 of 2</span>
            <h2>Set up your profile</h2>
            <p className="muted">A couple of details to help nearby buyers and sellers find you.</p>

            <label>Phone number
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your phone number" autoComplete="off" />
            </label>
            <label>Pincode / Address
              <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Enter your pincode" autoComplete="off" />
            </label>

            {error && <div className="threshold-note">{error}</div>}

            <button className="primary-action full" disabled={loading}>
              {loading && <Loader2 size={16} className="spinner" />} Finish
            </button>
            <div className="auth-switch">
              <button type="button" onClick={skipProfile}>Skip for now</button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitAccount}>
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="muted">
              {mode === 'login' ? 'Log in to continue to ReLoop.' : 'Join your neighborhood marketplace.'}
            </p>

            {mode === 'signup' && (
              <label>Name
                <input value={name} onChange={e => setName(e.target.value)} required autoComplete="off" />
              </label>
            )}
            <label>Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" />
            </label>
            <label>
              <div className="auth-row-between">
                Password
                {mode === 'login' && (
                  <button type="button" className="auth-forgot" onClick={() => alert('Password reset isn\'t wired up yet.')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="off" />
            </label>

            {error && <div className="threshold-note">{error}</div>}

            <button className="primary-action full" disabled={loading}>
              {loading && <Loader2 size={16} className="spinner" />} {mode === 'login' ? 'Log in' : 'Continue'}
            </button>

            <div className="auth-switch">
              {mode === 'login' ? "New here? " : 'Have an account? '}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}