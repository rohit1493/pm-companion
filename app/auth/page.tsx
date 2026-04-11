'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setState('error')
      setErrorMsg(error.message)
    } else {
      setState('done')
    }
  }

  const canSubmit = email.trim() && state !== 'loading'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '22px',
            color: '#1E293B',
            marginBottom: '8px',
          }}>
            PM Dojo
          </p>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            Your personalised PM learning path
          </p>
        </div>

        {state === 'done' ? (
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '22px',
              fontWeight: 400,
              color: '#1E293B',
              marginBottom: '10px',
            }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '40px 32px',
          }}>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '24px',
              fontWeight: 400,
              color: '#1E293B',
              marginBottom: '8px',
            }}>
              Sign in to PM Dojo
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
              Enter your email and we&apos;ll send you a magic link.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#475569',
                marginBottom: '8px',
              }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#1E293B',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0' }}
              />

              {state === 'error' && (
                <p style={{
                  fontSize: '13px',
                  color: '#EF4444',
                  marginBottom: '12px',
                }} role="alert">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: canSubmit ? '#4F46E5' : '#E2E8F0',
                  color: canSubmit ? 'white' : '#94A3B8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 150ms ease',
                  outline: 'none',
                  opacity: state === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = '#3730A3'
                }}
                onMouseLeave={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'
                }}
              >
                {state === 'loading' ? 'Sending link...' : 'Send magic link →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
