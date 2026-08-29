import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  // Check,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { api, saveSession } from '../../lib'
import {
  useSiteSettings,
  useApplySiteSettings,
} from '../../hooks/useSiteSettings'
import './guest.css'

export function JoinGroupPage({
  token,
  onJoined,
}: {
  token: string
  onJoined: () => void
}) {
  const { settings } = useSiteSettings()

  useApplySiteSettings(settings)

  const [status, setStatus] = useState<
    'joining' | 'joined' | 'error'
  >('joining')

  const [error, setError] = useState('')

  const attempted = useRef(false)

  const [
    credentials,
    setCredentials,
  ] = useState<{
    username: string
    password: string
    expiresAt: string
  } | null>(null)

  /* =========================================================
     ORIGINAL LOGIC - UNCHANGED
     ========================================================= */

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    api.joinGroupAsGuest(token)
      .then((r) => {
        const {
          guest,
          accessToken,
          refreshToken,
        } = r.data

        saveSession({
          accessToken,
          refreshToken,
          user: {
            id: guest.id,
            email: guest.email,
            username: guest.username,
            firstName: 'Guest',
            lastName: 'User',
            role: 'guest',
            guestExpiresAt:
              guest.expiresAt,
          },
        })

        setCredentials({
          username: guest.username,
          password: guest.password,
          expiresAt: guest.expiresAt,
        })

        setStatus('joined')
      })
      .catch((e) => {
        setError(
          e?.message ||
            'This invite link is invalid or has expired.',
        )

        setStatus('error')
      })
  }, [token])

  /* =========================================================
     UI ONLY
     ========================================================= */

  const siteName =
    settings.name || 'FedChat'

  const brandLetter =
    siteName
      .slice(0, 1)
      .toUpperCase()

  /* =========================================================
     JOINING
     ========================================================= */

  if (status === 'joining') {
    return (
      <div className="guest-page">
        <div className="guest-bg guest-bg-one" />
        <div className="guest-bg guest-bg-two" />

        <div className="guest-container">
          <div className="guest-card guest-loading-card">

            <div className="guest-brand">
              <span className="guest-brand-mark">
                {brandLetter}
              </span>

              <div>
                <strong>
                  {siteName}
                </strong>

                <span>
                  Guest access
                </span>
              </div>
            </div>

            <div className="guest-loading-area">

              <div className="guest-loading-icon">
                <LoaderCircle
                  size={30}
                  strokeWidth={1.8}
                />
              </div>

              <span className="guest-eyebrow">
                INVITATION
              </span>

              <h1>
                Joining your group
              </h1>

              <p>
                Setting up your temporary guest
                account and preparing your group
                access.
              </p>

              <div className="guest-progress">
                <span />
              </div>

              <small>
                Please wait…
              </small>
            </div>

            <div className="guest-security-footer">
              <ShieldCheck
                size={14}
              />

              <span>
                Secure temporary guest access
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (status === 'error') {
    return (
      <div className="guest-page">
        <div className="guest-bg guest-bg-one" />
        <div className="guest-bg guest-bg-two" />

        <div className="guest-container">
          <div className="guest-card guest-error-card">

            <div className="guest-brand">
              <span className="guest-brand-mark">
                {brandLetter}
              </span>

              <div>
                <strong>
                  {siteName}
                </strong>

                <span>
                  Invite link
                </span>
              </div>
            </div>

            <div className="guest-error-icon">
              <AlertCircle
                size={29}
                strokeWidth={1.8}
              />
            </div>

            <div className="guest-state-copy">
              <span className="guest-eyebrow error">
                INVITATION UNAVAILABLE
              </span>

              <h1>
                Could not join
              </h1>

              <p>
                {error}
              </p>
            </div>

            <div className="guest-error-box">
              <AlertCircle
                size={15}
                strokeWidth={1.8}
              />

              <div>
                <strong>
                  This invite is unavailable
                </strong>

                <span>
                  The invitation may have expired
                  or is no longer valid. Ask the
                  group administrator for a new
                  invite.
                </span>
              </div>
            </div>

            <a
              href="/"
              className="guest-primary-button"
            >
              <span>
                Go to {siteName}
              </span>

              <ArrowRight
                size={16}
              />
            </a>

            <div className="guest-bottom-note">
              <ShieldCheck
                size={13}
              />

              <span>
                Secure access by {siteName}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* =========================================================
     JOINED
     ========================================================= */

  return (
    <div className="guest-page">
      <div className="guest-bg guest-bg-one" />
      <div className="guest-bg guest-bg-two" />

      <div className="guest-container">

        <div className="guest-card guest-success-card">

          <div className="guest-brand">
            <span className="guest-brand-mark">
              {brandLetter}
            </span>

            <div>
              <strong>
                {siteName}
              </strong>

              <span>
                Guest access
              </span>
            </div>
          </div>

          {/* SUCCESS */}

          <div className="guest-success-icon">
            <CheckCircle2
              size={30}
              strokeWidth={1.9}
            />
          </div>

          <div className="guest-state-copy">
            <span className="guest-eyebrow success">
              ACCESS GRANTED
            </span>

            <h1>
              Welcome
            </h1>

            <p>
              You've joined the group as a
              guest. Your temporary account is
              ready.
            </p>
          </div>

          {/* EXPIRY */}

          <div className="guest-expiry-card">
            <div className="guest-expiry-icon">
              <Clock3
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <span>
                Guest account expires
              </span>

              <strong>
                {new Date(
                  credentials!.expiresAt,
                ).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* CREDENTIALS */}

          <div className="guest-credentials">

            <div className="guest-section-heading">
              <div>
                <span>
                  TEMPORARY ACCOUNT
                </span>

                <h2>
                  Your sign-in details
                </h2>
              </div>

              <div className="guest-section-icon">
                <KeyRound
                  size={16}
                />
              </div>
            </div>

            <div className="guest-credential-row">

              <div className="guest-credential-icon">
                <UserRound
                  size={16}
                />
              </div>

              <div className="guest-credential-content">
                <span>
                  Username
                </span>

                <strong>
                  {credentials!.username}
                </strong>
              </div>

              <button
                type="button"
                className="guest-copy-button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    credentials!.username,
                  )
                }
                aria-label="Copy username"
              >
                <Copy
                  size={15}
                />
              </button>
            </div>

            <div className="guest-credential-row">

              <div className="guest-credential-icon">
                <KeyRound
                  size={16}
                />
              </div>

              <div className="guest-credential-content">
                <span>
                  Temporary password
                </span>

                <strong>
                  {credentials!.password}
                </strong>
              </div>

              <button
                type="button"
                className="guest-copy-button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    credentials!.password,
                  )
                }
                aria-label="Copy password"
              >
                <Copy
                  size={15}
                />
              </button>
            </div>
          </div>

          {/* EXPIRY NOTICE */}

          <div className="guest-expiry-note">
            <Clock3
              size={14}
              strokeWidth={1.8}
            />

            <span>
              This is a temporary guest account.
              Create a free account before it
              expires to keep your access.
            </span>
          </div>

          {/* CONTINUE */}

          <button
            type="button"
            className="guest-primary-button"
            onClick={onJoined}
          >
            <LogIn
              size={16}
              strokeWidth={1.9}
            />

            <span>
              Continue to chat
            </span>

            <ArrowRight
              size={16}
            />
          </button>

          {/* FOOTER */}

          <div className="guest-bottom-note">
            <ShieldCheck
              size={13}
            />

            <span>
              Your temporary session is protected
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default JoinGroupPage