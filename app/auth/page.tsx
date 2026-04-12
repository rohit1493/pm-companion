'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type Mode = 'signin' | 'signup'
type State = 'idle' | 'loading' | 'error'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()

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
          router.push('/onboarding')
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
        router.push('/feed')
      }
    }
  }

  const canSubmit = email.trim() && password && state !== 'loading'

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
            Your personalised PM learning path
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
            {mode === 'signin' ? 'Sign in to PM Dojo' : 'Create your account'}
          </h1>
          <p style={{ fontSize: '14px', color: '#8b96a5', marginBottom: '28px' }}>
            {mode === 'signin'
              ? 'Welcome back. Enter your credentials to continue.'
              : 'Start your personalised PM learning journey.'}
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
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b35' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3340' }}
            />

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
              placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
              required
              minLength={6}
              style={inputStyle}
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
              {state === 'loading'
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          {/* Toggle */}
          <p style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#6b7685',
          }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(''); setState('idle') }}
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
        </div>
      </div>
    </div>
  )
}
