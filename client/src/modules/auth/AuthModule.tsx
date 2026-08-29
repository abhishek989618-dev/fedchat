import { useMemo, useState } from 'react'
import { api, assetUrl, saveRememberedSession } from '../../lib'
import { useApplySiteSettings, useSiteSettings } from '../../hooks/useSiteSettings'
import './auth.css'

type Mode = 'login' | 'register'

const countryCodes = [
  ['IN', '+91', 'India'],
  ['US', '+1', 'United States'],
  ['GB', '+44', 'United Kingdom'],
  ['AE', '+971', 'UAE'],
  ['AU', '+61', 'Australia'],
  ['CA', '+1', 'Canada'],
  ['DE', '+49', 'Germany'],
  ['FR', '+33', 'France'],
  ['JP', '+81', 'Japan'],
  ['SG', '+65', 'Singapore'],
  ['SA', '+966', 'Saudi Arabia'],
  ['PK', '+92', 'Pakistan'],
]

type FormState = {
  email: string
  password: string
  username: string
  firstName: string
  lastName: string
  phone: string
  countryCode: string
}

const initialForm: FormState = {
  email: '',
  password: '',
  username: '',
  firstName: '',
  lastName: '',
  phone: '',
  countryCode: '+91',
}

export function AuthModule({ onLogin }: { onLogin: () => void }) {
  const { settings } = useSiteSettings()

  useApplySiteSettings(settings)

  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>(initialForm)
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const brandInitial = useMemo(
    () => settings.name.trim().charAt(0).toUpperCase() || 'F',
    [settings.name],
  )

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    if (error) setError('')
    if (success) setSuccess('')
  }

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (mode === 'login') {
      if (!form.email.trim()) {
        setError('Enter your email address or phone number.')
        return
      }

      if (!form.password) {
        setError('Enter your password.')
        return
      }
    }

    if (mode === 'register') {
      if (!form.firstName.trim()) {
        setError('Enter your first name.')
        return
      }

      if (!form.lastName.trim()) {
        setError('Enter your last name.')
        return
      }

      if (!form.username.trim()) {
        setError('Choose a username.')
        return
      }

      if (!form.email.trim()) {
        setError('Enter your email address.')
        return
      }

      if (!form.phone.trim()) {
        setError('Enter your phone number.')
        return
      }

      if (form.password.length < 8) {
        setError('Your password must contain at least 8 characters.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const rawIdentifier = form.email.trim()

        const identifier = rawIdentifier.includes('@')
          ? rawIdentifier
          : rawIdentifier.startsWith('+')
            ? rawIdentifier
            : `${form.countryCode}${rawIdentifier.replace(/^0+/, '')}`

        const response = await api.login(identifier, form.password)

        saveRememberedSession(response.data, remember)
        onLogin()

        return
      }

      const phone = `${form.countryCode}${form.phone.replace(/^0+/, '')}`

      await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone,
        password: form.password,
      })

      setForm((current) => ({
        ...current,
        password: '',
      }))

      setMode('login')
      setSuccess('Your account was created successfully. Please sign in.')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const logo = settings.logoUrl ? assetUrl(settings.logoUrl) : ''

  return (
    <main className="auth-page">
      <section className="auth-frame">
        {/* LEFT BRAND PANEL */}
        <aside className="auth-brand-panel">
          <div>
            <div className="auth-brand-lockup">
              {logo ? (
                <img
                  src={logo}
                  alt={settings.name}
                  className="auth-brand-logo"
                />
              ) : (
                <span className="auth-brand-mark">{brandInitial}</span>
              )}

              <div>
                <strong>{settings.name}</strong>
                <span>Private communication</span>
              </div>
            </div>

            <div className="auth-brand-content">
              <span className="auth-eyebrow">
                PRIVATE • REAL-TIME • SECURE
              </span>

              <h1>
                Stay connected.
                <br />
                Stay private.
              </h1>

              <p>
                {settings.description ||
                  'Secure real-time conversations, groups and communities in one simple workspace.'}
              </p>

              <div className="auth-feature-list">
                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Real-time messaging</strong>
                    <span>Messages appear instantly.</span>
                  </div>
                </div>

                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Private conversations</strong>
                    <span>Your conversations stay focused.</span>
                  </div>
                </div>

                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <div>
                    <strong>Groups & communities</strong>
                    <span>Connect with the people who matter.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>© {new Date().getFullYear()} {settings.name}</span>
            <span>Private conversations. Live communication.</span>
          </div>
        </aside>

        {/* RIGHT FORM */}
        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-mobile-brand">
              {logo ? (
                <img
                  src={logo}
                  alt={settings.name}
                  className="auth-brand-logo"
                />
              ) : (
                <span className="auth-brand-mark">{brandInitial}</span>
              )}

              <div>
                <strong>{settings.name}</strong>
                <span>{settings.tagline}</span>
              </div>
            </div>

            <div className="auth-heading">
              <span className="auth-heading-label">
                {mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
              </span>

              <h2>
                {mode === 'login'
                  ? 'Welcome back'
                  : 'Create your account'}
              </h2>

              <p>
                {mode === 'login'
                  ? 'Sign in to continue to your conversations.'
                  : 'Create your account and start connecting with your people.'}
              </p>
            </div>

            <div className="auth-mode-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => changeMode('register')}
              >
                Create account
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {mode === 'register' && (
                <>
                  <div className="auth-two-column">
                    <label className="auth-field">
                      <span>First name</span>
                      <input
                        type="text"
                        value={form.firstName}
                        placeholder="Abhishek"
                        autoComplete="given-name"
                        onChange={(event) =>
                          update('firstName', event.target.value)
                        }
                      />
                    </label>

                    <label className="auth-field">
                      <span>Last name</span>
                      <input
                        type="text"
                        value={form.lastName}
                        placeholder="Kumar"
                        autoComplete="family-name"
                        onChange={(event) =>
                          update('lastName', event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <label className="auth-field">
                    <span>Username</span>
                    <input
                      type="text"
                      value={form.username}
                      placeholder="abhishek_123"
                      autoComplete="username"
                      onChange={(event) =>
                        update('username', event.target.value)
                      }
                    />
                    <small>
                      Use 3–30 letters, numbers or underscores.
                    </small>
                  </label>
                </>
              )}

              <label className="auth-field">
                <span>
                  {mode === 'login'
                    ? 'Email or phone number'
                    : 'Email address'}
                </span>

                {mode === 'login' ? (
                  <div className="auth-phone-input">
                    <select
                      value={form.countryCode}
                      onChange={(event) =>
                        update('countryCode', event.target.value)
                      }
                      aria-label="Country code"
                    >
                      {countryCodes.map(([iso, code, country]) => (
                        <option
                          value={code}
                          key={`${iso}-${code}`}
                        >
                          {code} {country}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={form.email}
                      placeholder="you@example.com or 9876543210"
                      autoComplete="username"
                      onChange={(event) =>
                        update('email', event.target.value)
                      }
                    />
                  </div>
                ) : (
                  <input
                    type="email"
                    value={form.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    onChange={(event) =>
                      update('email', event.target.value)
                    }
                  />
                )}
              </label>

              {mode === 'register' && (
                <label className="auth-field">
                  <span>Phone number</span>

                  <div className="auth-phone-input">
                    <select
                      value={form.countryCode}
                      onChange={(event) =>
                        update('countryCode', event.target.value)
                      }
                      aria-label="Country code"
                    >
                      {countryCodes.map(([iso, code, country]) => (
                        <option
                          value={code}
                          key={`${iso}-${code}`}
                        >
                          {code} {country}
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      value={form.phone}
                      placeholder="9876543210"
                      autoComplete="tel"
                      onChange={(event) =>
                        update('phone', event.target.value)
                      }
                    />
                  </div>
                </label>
              )}

              <label className="auth-field">
                <div className="auth-field-label-row">
                  <span>Password</span>

                  {mode === 'login' && (
                    <button
                      type="button"
                      className="auth-inline-link"
                      onClick={() => {
                        setError('Password recovery will be connected next.')
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="auth-password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    placeholder="Enter your password"
                    autoComplete={
                      mode === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    onChange={(event) =>
                      update('password', event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    onClick={() =>
                      setShowPassword((visible) => !visible)
                    }
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {mode === 'register' && (
                  <small>
                    Use at least 8 characters.
                  </small>
                )}
              </label>

              {mode === 'login' && (
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) =>
                      setRemember(event.target.checked)
                    }
                  />

                  <span>Remember me on this device</span>
                </label>
              )}

              {error && (
                <div
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="auth-message auth-message-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-button"
                disabled={loading}
              >
                <span>
                  {loading
                    ? 'Please wait…'
                    : mode === 'login'
                      ? 'Sign in'
                      : 'Create account'}
                </span>

                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="auth-divider">
              <span>FedChat</span>
            </div>

            <p className="auth-bottom-text">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}

              {settings.registrationEnabled || mode === 'register' ? (
                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      mode === 'login' ? 'register' : 'login',
                    )
                  }
                >
                  {mode === 'login'
                    ? 'Create account'
                    : 'Sign in'}
                </button>
              ) : null}
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}