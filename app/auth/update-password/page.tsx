'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type State = 'idle' | 'loading' | 'error' | 'done'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      setState('error')
      return
    }
    setState('loading')
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setState('error')
      setErrorMsg(error.message)
    } else {
      setState('done')
      setTimeout(() => router.push('/feed'), 2000)
    }
  }

  const canSubmit = password.length >= 6 && confirm && state !== 'loading'

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
          {state === 'done' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <h2 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '22px',
                fontWeight: 400,
                color: '#f6fafe',
                marginBottom: '8px',
              }}>
                Password updated
              </h2>
              <p style={{ fontSize: '14px', color: '#8b96a5' }}>
                Redirecting you to the app…
              </p>
            </div>
          ) : (
            <>
              <h1 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '24px',
                fontWeight: 400,
                color: '#f6fafe',
                marginBottom: '8px',
              }}>
                Set new password
              </h1>
              <p style={{ fontSize: '14px', color: '#8b96a5', marginBottom: '28px' }}>
                Choose a new password for your account.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor="password" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#8b96a5',
                  marginBottom: '8px',
                }}>
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#ff6b35' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#2a3340' }}
                />

                <label htmlFor="confirm" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#8b96a5',
                  marginBottom: '8px',
                }}>
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
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
                  {state === 'loading' ? 'Updating...' : 'Update password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
