import { useEffect, useRef, useState } from 'react'
import { api, saveSession } from '../../lib'
import { useSiteSettings, useApplySiteSettings } from '../../hooks/useSiteSettings'

export function JoinGroupPage({ token, onJoined }: { token: string; onJoined: () => void }) {
  const { settings } = useSiteSettings()
  useApplySiteSettings(settings)
  const [status, setStatus] = useState<'joining' | 'joined' | 'error'>('joining')
  const [error, setError] = useState('')
  const attempted = useRef(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string; expiresAt: string } | null>(null)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    api.joinGroupAsGuest(token)
      .then((r) => {
        const { guest, accessToken, refreshToken } = r.data
        saveSession({
          accessToken,
          refreshToken,
          user: { id: guest.id, email: guest.email, username: guest.username, firstName: 'Guest', lastName: 'User', role: 'guest', guestExpiresAt: guest.expiresAt },
        })
        setCredentials({ username: guest.username, password: guest.password, expiresAt: guest.expiresAt })
        setStatus('joined')
      })
      .catch((e) => { setError(e?.message || 'This invite link is invalid or has expired.'); setStatus('error') })
  }, [token])

  if (status === 'joining') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark">{settings.name.slice(0, 1).toUpperCase()}</span><div><strong>{settings.name}</strong><span>Joining group…</span></div></div>
          <p>Setting up your temporary guest account…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark">{settings.name.slice(0, 1).toUpperCase()}</span><div><strong>{settings.name}</strong><span>Invite link</span></div></div>
          <h1>Could not join</h1>
          <div className="error">{error}</div>
          <a className="link-button" href="/">Go to FedChat</a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand"><span className="brand-mark">{settings.name.slice(0, 1).toUpperCase()}</span><div><strong>{settings.name}</strong><span>You're in!</span></div></div>
        <h1>Welcome</h1>
        <p>You've joined the group as a guest. This account expires on <strong>{new Date(credentials!.expiresAt).toLocaleString()}</strong> — create a free account before then to keep your access.</p>
        <div className="notice">
          <strong>Your temporary sign-in</strong>
          <span>Username: {credentials!.username}<br />Password: {credentials!.password}</span>
        </div>
        <button className="primary auth-submit" onClick={onJoined}>Continue to chat</button>
      </div>
    </div>
  )
}
