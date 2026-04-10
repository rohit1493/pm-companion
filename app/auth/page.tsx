'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type State = 'idle' | 'loading' | 'sent' | 'error'

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
      setState('sent')
    }
  }

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
            PM Companion
          </p>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            Your goal-anchored PM learning path
          </p>
        </div>

        {state === 'sent' ? (
          /* Success state */
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
              We sent a magic link to<br />
              <strong style={{ color: '#1E293B' }}>{email}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '16px' }}>
              Click the link to sign in. No password needed.
            </p>
            <p style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '10px', lineHeight: 1.5 }}>
              Can't find it? Check your <strong style={{ color: '#94A3B8' }}>spam or junk folder</strong>.
            </p>
            <button
              onClick={() => { setState('idle'); setEmail('') }}
              style={{
                marginTop: '24px',
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Form state */
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
              Sign in
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
              We&apos;ll send you a magic link — no password needed.
            </p>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#475569',
                  marginBottom: '8px',
                }}
              >
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
                disabled={state === 'loading' || !email.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: email.trim() ? '#4F46E5' : '#E2E8F0',
                  color: email.trim() ? 'white' : '#94A3B8',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: email.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 150ms ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (email.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#3730A3'
                }}
                onMouseLeave={(e) => {
                  if (email.trim()) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5'
                }}
              >
                {state === 'loading' ? 'Sending...' : 'Send magic link →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
