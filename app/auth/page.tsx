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
      background: '#0b0f14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '22px',
            color: '#f6fafe',
            marginBottom: '8px',
          }}>
            PM Dojo
          </p>
          <p style={{ fontSize: '14px', color: '#6b7685' }}>
            Your personalised PM learning path
          </p>
        </div>

        {state === 'done' ? (
          <div style={{
            background: '#121821',
            border: '1px solid #2a3340',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
            <h2 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '22px',
              fontWeight: 400,
              color: '#f6fafe',
              marginBottom: '10px',
            }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: '14px', color: '#8b96a5', lineHeight: 1.6 }}>
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <div style={{
            background: '#121821',
            border: '1px solid #2a3340',
            borderRadius: '16px',
            padding: '40px 32px',
          }}>
            <h1 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '24px',
              fontWeight: 400,
              color: '#f6fafe',
              marginBottom: '8px',
            }}>
              Sign in to PM Dojo
            </h1>
            <p style={{ fontSize: '14px', color: '#8b96a5', marginBottom: '28px' }}>
              Enter your email and we&apos;ll send you a magic link.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#8b96a5',
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
                  border: '1.5px solid #2a3340',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#f6fafe',
                  background: '#0b0f14',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b35' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3340' }}
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
                  background: canSubmit ? '#ff6b35' : '#2a3340',
                  color: canSubmit ? 'white' : '#6b7685',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 150ms ease',
                  outline: 'none',
                  opacity: state === 'loading' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = '#e05a28'
                }}
                onMouseLeave={(e) => {
                  if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = '#ff6b35'
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
