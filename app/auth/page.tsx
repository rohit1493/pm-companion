'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Mode = 'signin' | 'signup'
type State = 'idle' | 'loading' | 'done' | 'error'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })
      if (error) {
        setState('error')
        setErrorMsg(error.message)
      } else {
        window.location.href = '/feed'
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
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
  }

  const canSubmit = email.trim() && password.trim() && state !== 'loading'

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

        {state === 'done' && mode === 'signup' ? (
          /* Signup success */
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '22px',
              fontWeight: 400,
              color: '#1E293B',
              marginBottom: '10px',
            }}>
              Account created!
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              You can now sign in with your email and password.
            </p>
            <button
              onClick={() => { setMode('signin'); setState('idle') }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              Sign in →
            </button>
          </div>
        ) : (
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '40px 32px',
          }}>
            {/* Mode toggle */}
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '28px',
            }}>
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setState('idle'); setErrorMsg('') }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? '#1E293B' : '#94A3B8',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 150ms ease',
                  }}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '24px',
              fontWeight: 400,
              color: '#1E293B',
              marginBottom: '8px',
            }}>
              {mode === 'signin' ? 'Welcome back' : 'Get started'}
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
              {mode === 'signin'
                ? 'Sign in to continue your learning path.'
                : 'Create your account to save your progress.'}
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
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0' }}
              />

              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#475569',
                marginBottom: '8px',
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
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
                {state === 'loading'
                  ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'signin' ? 'Sign in →' : 'Create account →')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
