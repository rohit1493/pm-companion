'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { analytics } from '@/lib/analytics'

type Mode = 'signin' | 'signup' | 'reset'
type State = 'idle' | 'loading' | 'error' | 'reset_sent'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setErrorMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setErrorMsg(error.message)
      setState('error')
      setGoogleLoading(false)
    } else {
      analytics.googleSignedIn()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (error) {
        setState('error')
        setErrorMsg(error.message)
      } else {
        setState('reset_sent')
      }
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setState('error')
        setErrorMsg(error.message)
      } else {
        // Auto sign-in after signup (email confirm disabled)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setState('error')
          setErrorMsg(signInError.message)
        } else {
          analytics.signedUp()
          router.push('/feed')
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setState('error')
        setErrorMsg(error.message)
      } else {
        analytics.signedIn()
        router.push('/feed')
      }
    }
  }

  const canSubmit = email.trim() && (mode === 'reset' || password) && state !== 'loading'

  const inputStyle: React.CSSProperties = {
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
  }

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
            Your PM path is waiting.
          </p>
        </div>

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
            {mode === 'signin' ? 'Sign in to PM Dojo' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </h1>
          <p style={{ fontSize: '14px', color: '#8b96a5', marginBottom: '28px' }}>
            {mode === 'signin'
              ? 'Welcome back. Sign in to pick up where you left off.'
              : mode === 'signup'
              ? 'One step left — create your account to save your path.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>

          {/* Google OAuth — shown for signin and signup, not reset */}
          {mode !== 'reset' && state !== 'reset_sent' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || state === 'loading'}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: '#1a2230',
                  border: '1.5px solid #2a3340',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  color: '#f6fafe',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'border-color 150ms ease, background 150ms ease',
                  opacity: googleLoading ? 0.7 : 1,
                  marginBottom: '20px',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#4a5568'
                }}
                onMouseLeave={(e) => {
                  if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3340'
                }}
              >
                {!googleLoading && (
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? 'Redirecting...' : `Continue with Google`}
              </button>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{ flex: 1, height: '1px', background: '#2a3340' }} />
                <span style={{ fontSize: '12px', color: '#6b7685', whiteSpace: 'nowrap' }}>or continue with email</span>
                <div style={{ flex: 1, height: '1px', background: '#2a3340' }} />
              </div>
            </>
          )}

          {state === 'reset_sent' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📬</div>
              <p style={{ fontSize: '14px', color: '#8b96a5', lineHeight: 1.6 }}>
                Password reset link sent to <strong style={{ color: '#f6fafe' }}>{email}</strong>.<br />
                Check your inbox and click the link.
              </p>
              <button
                onClick={() => { setMode('signin'); setState('idle'); setErrorMsg('') }}
                style={{
                  marginTop: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#ff6b35',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: 'underline',
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
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
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b35' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3340' }}
              />

              {mode !== 'reset' && (
                <>
                  <label htmlFor="password" style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#8b96a5',
                    marginBottom: '8px',
                  }}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
                    required
                    minLength={6}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b35' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3340' }}
                  />
                  {mode === 'signin' && (
                    <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
                      <button
                        type="button"
                        onClick={() => { setMode('reset'); setState('idle'); setErrorMsg('') }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7685',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: "'Inter', sans-serif",
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </>
              )}

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
                {state === 'loading'
                  ? (mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : 'Sending link...')
                  : (mode === 'signin' ? 'Sign in →' : mode === 'signup' ? 'Create account →' : 'Send reset link →')}
              </button>
            </form>
          )}

          {/* Toggle */}
          {state !== 'reset_sent' && (
            <p style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#6b7685',
            }}>
              {mode === 'signin' ? "Don't have an account? " : mode === 'signup' ? 'Already have an account? ' : 'Remember it? '}
              <button
                onClick={() => { setMode(mode === 'signup' ? 'signin' : mode === 'reset' ? 'signin' : 'signup'); setErrorMsg(''); setState('idle') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b35',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
