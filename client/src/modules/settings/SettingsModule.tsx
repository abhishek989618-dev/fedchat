import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe2,
  ImagePlus,
  KeyRound,
  LockKeyhole,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { ImageCropper } from '../../components/ui/ImageCropper'
import {
  api,
  assetUrl,
  getSession,
  saveSession,
  type User,
} from '../../lib'

import './settings.css'

/* =========================================================
   TYPES
   ========================================================= */

type SettingsPanel =
  | 'Profile'
  | 'Security'
  | 'Preferences'
  | null

type ComingSoonSetting =
  | 'Privacy'
  | 'Notifications'
  | 'Chats'
  | 'Storage & data'

/* =========================================================
   SECONDARY SETTINGS
   ========================================================= */

const other: Array<
  [
    ComingSoonSetting,
    string,
  ]
> = [
  [
    'Privacy',
    'Last seen, profile photo, status and blocked users',
  ],
  [
    'Notifications',
    'Message, group and system notification preferences',
  ],
  [
    'Chats',
    'Theme, wallpaper, enter key and media visibility',
  ],
  [
    'Storage & data',
    'Network usage, auto-download and storage',
  ],
]

/* =========================================================
   HELPERS
   ========================================================= */

function fullName(user?: Partial<User>) {
  return (
    `${user?.firstName || ''} ${
      user?.lastName || ''
    }`.trim() ||
    user?.username ||
    'FedChat User'
  )
}

function initials(user?: Partial<User>) {
  const value = fullName(user)

  return (
    value
      .split(/\s+/)
      .map(
        (part) =>
          part.charAt(0),
      )
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  )
}

/* =========================================================
   PROFILE PANEL
   ========================================================= */

function ProfilePanel({
  onClose,
}: {
  onClose: () => void
}) {
  const session = getSession()

  const [user, setUser] =
    useState<User>(
      session?.user ||
        ({} as User),
    )

  const [
    firstName,
    setFirstName,
  ] = useState(
    user.firstName || '',
  )

  const [
    lastName,
    setLastName,
  ] = useState(
    user.lastName || '',
  )

  const [
    username,
    setUsername,
  ] = useState(
    user.username || '',
  )

  const [bio, setBio] =
    useState(
      user.bio || '',
    )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    uploading,
    setUploading,
  ] = useState<
    'avatar' | 'banner' | null
  >(null)

  const [
    cropFile,
    setCropFile,
  ] = useState<{
    kind:
      | 'avatar'
      | 'banner'
    file: File
  } | null>(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const avatarInput =
    useRef<HTMLInputElement | null>(
      null,
    )

  const bannerInput =
    useRef<HTMLInputElement | null>(
      null,
    )

  /* =======================================================
     SYNC SESSION
     ======================================================= */

  const syncSession = (
    updated: User,
  ) => {
    setUser(updated)

    if (session) {
      saveSession({
        ...session,

        user: {
          ...session.user,
          ...updated,
        },
      })
    }
  }

  /* =======================================================
     SAVE PROFILE
     ======================================================= */

  async function saveProfile() {
    const trimmedFirstName =
      firstName.trim()

    const trimmedLastName =
      lastName.trim()

    const trimmedUsername =
      username.trim()

    if (!trimmedFirstName) {
      setError(
        'First name is required.',
      )
      return
    }

    if (!trimmedUsername) {
      setError(
        'Username is required.',
      )
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response =
        await api.updateProfile({
          firstName:
            trimmedFirstName,

          lastName:
            trimmedLastName,

          username:
            trimmedUsername,

          bio: bio.trim(),
        })

      syncSession({
        ...user,
        ...(response.data.user as User),
      })

      setSaved(true)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to save profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  /* =======================================================
     UPLOAD PROFILE MEDIA
     ======================================================= */

  async function upload(
    kind:
      | 'avatar'
      | 'banner',
    file: File,
  ) {
    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      setError(
        'Please select an image file.',
      )
      return
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        'Image must be 10MB or smaller.',
      )
      return
    }

    setUploading(kind)
    setError(null)

    try {
      const response =
        await api.uploadProfileMedia(
          kind,
          file,
        )

      syncSession({
        ...user,
        ...(response.data
          .user as User),
      })

      setSaved(false)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : `Could not update ${kind}.`,
      )
    } finally {
      setUploading(null)
    }
  }

  /* =======================================================
     CHOOSE MEDIA
     ======================================================= */

  function chooseMedia(
    kind:
      | 'avatar'
      | 'banner',
    file?: File,
  ) {
    if (!file) {
      return
    }

    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      setError(
        'Please select an image file.',
      )
      return
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        'Image must be 10MB or smaller.',
      )
      return
    }

    setError(null)

    setCropFile({
      kind,
      file,
    })
  }

  const banner =
    assetUrl(user.bannerUrl)

  const avatar =
    assetUrl(user.avatar)

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="settings-panel settings-profile-panel">
      <div className="settings-panel-header">
        <div className="settings-panel-heading">
          <button
            type="button"
            className="settings-back-button"
            onClick={onClose}
            aria-label="Back to settings"
          >
            <ArrowLeft
              size={17}
            />
          </button>

          <div>
            <span>
              ACCOUNT
            </span>

            <h2>
              Profile
            </h2>

            <p>
              Personalize how you
              appear across FedChat.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          PROFILE HERO
          =================================================== */}

      <section className="settings-profile-hero">
        <div
          className="settings-profile-banner"
          style={
            banner
              ? {
                  backgroundImage:
                    `url("${banner}")`,
                }
              : undefined
          }
        >
          {!banner && (
            <div className="settings-banner-placeholder">
              <ImagePlus
                size={22}
                strokeWidth={
                  1.6
                }
              />

              <span>
                Add a cover banner
              </span>
            </div>
          )}

          <button
            type="button"
            className="settings-banner-button"
            disabled={
              uploading ===
              'banner'
            }
            onClick={() =>
              bannerInput.current?.click()
            }
          >
            <ImagePlus
              size={14}
              strokeWidth={
                1.8
              }
            />

            <span>
              {uploading ===
              'banner'
                ? 'Uploading…'
                : 'Change cover'}
            </span>
          </button>

          <input
            ref={bannerInput}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => {
              const file =
                event.target.files?.[0]

              chooseMedia(
                'banner',
                file,
              )

              event.currentTarget.value =
                ''
            }}
          />
        </div>

        <div className="settings-profile-hero-body">
          <button
            type="button"
            className="settings-avatar-button"
            disabled={
              uploading ===
              'avatar'
            }
            onClick={() =>
              avatarInput.current?.click()
            }
            aria-label="Change profile picture"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
              />
            ) : (
              <span>
                {initials(user)}
              </span>
            )}

            <span className="settings-avatar-camera">
              <ImagePlus
                size={12}
                strokeWidth={
                  2
                }
              />
            </span>
          </button>

          <input
            ref={avatarInput}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => {
              const file =
                event.target.files?.[0]

              chooseMedia(
                'avatar',
                file,
              )

              event.currentTarget.value =
                ''
            }}
          />

          <div className="settings-profile-identity">
            <div className="settings-profile-name-row">
              <strong>
                {fullName(user)}
              </strong>

              <span className="settings-online-badge">
                Online
              </span>
            </div>

            <span>
              @{user.username ||
                'username'}
            </span>

            <small>
              {uploading ===
              'avatar'
                ? 'Updating profile photo…'
                : 'Use a clear photo so contacts can recognize you.'}
            </small>
          </div>
        </div>
      </section>

      {/* ===================================================
          PROFILE FORM
          =================================================== */}

      <section className="settings-content-card">
        <div className="settings-card-heading">
          <div>
            <span>
              PROFILE INFORMATION
            </span>

            <h3>
              Profile details
            </h3>

            <p>
              Your name, username and
              bio are visible on your
              profile.
            </p>
          </div>

          <div className="settings-card-icon">
            <UserRound
              size={17}
              strokeWidth={
                1.8
              }
            />
          </div>
        </div>

        <div className="settings-form-grid">
          <label>
            <span>
              First name
            </span>

            <input
              value={firstName}
              onChange={(
                event,
              ) =>
                setFirstName(
                  event.target
                    .value,
                )
              }
              placeholder="First name"
              maxLength={80}
            />
          </label>

          <label>
            <span>
              Last name
            </span>

            <input
              value={lastName}
              onChange={(
                event,
              ) =>
                setLastName(
                  event.target
                    .value,
                )
              }
              placeholder="Last name"
              maxLength={80}
            />
          </label>

          <label>
            <span>
              Username
            </span>

            <div className="settings-input-prefix">
              <span>
                @
              </span>

              <input
                value={
                  username
                }
                onChange={(
                  event,
                ) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                placeholder="Username"
                maxLength={50}
              />
            </div>
          </label>

          <label className="full">
            <span>
              Bio
              <em>
                {
                  bio.length
                }
                /500
              </em>
            </span>

            <textarea
              value={bio}
              onChange={(
                event,
              ) =>
                setBio(
                  event.target.value.slice(
                    0,
                    500,
                  ),
                )
              }
              placeholder="Tell people a little about yourself…"
              rows={4}
            />
          </label>
        </div>

        {error && (
          <div className="settings-error">
            <ShieldCheck
              size={15}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {saved && !error && (
          <div className="settings-success">
            <ShieldCheck
              size={14}
            />

            <span>
              Profile changes saved
              successfully.
            </span>
          </div>
        )}

        <div className="settings-form-actions">
          <button
            type="button"
            className="settings-primary-button"
            disabled={
              saving ||
              !!uploading
            }
            onClick={() =>
              void saveProfile()
            }
          >
            {saving
              ? 'Saving…'
              : 'Save profile'}
          </button>
        </div>
      </section>

      {/* ===================================================
          CROPPER
          =================================================== */}

      {cropFile && (
        <ImageCropper
          file={
            cropFile.file
          }
          aspect={
            cropFile.kind ===
            'avatar'
              ? 1
              : 16 / 6
          }
          title={
            cropFile.kind ===
            'avatar'
              ? 'Crop profile picture'
              : 'Crop profile banner'
          }
          onCancel={() =>
            setCropFile(null)
          }
          onConfirm={(
            file,
          ) => {
            const kind =
              cropFile.kind

            setCropFile(null)

            void upload(
              kind,
              file,
            )
          }}
        />
      )}
    </div>
  )
}

/* =========================================================
   SECURITY PANEL
   ========================================================= */

function SecurityPanel({
  onClose,
}: {
  onClose: () => void
}) {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('')

  const [
    newPassword,
    setNewPassword,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const passwordStrong =
    newPassword.length >= 8

  async function save() {
    if (
      !currentPassword
    ) {
      setError(
        'Enter your current password.',
      )
      return
    }

    if (
      newPassword.length <
      8
    ) {
      setError(
        'New password must be at least 8 characters.',
      )
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setSaved(true)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to change password.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div className="settings-panel-heading">
          <button
            type="button"
            className="settings-back-button"
            onClick={onClose}
            aria-label="Back to settings"
          >
            <ArrowLeft
              size={17}
            />
          </button>

          <div>
            <span>
              ACCOUNT
            </span>

            <h2>
              Security
            </h2>

            <p>
              Protect your account and
              keep your password up to
              date.
            </p>
          </div>
        </div>
      </div>

      <section className="settings-content-card settings-security-card">
        <div className="settings-card-heading">
          <div>
            <span>
              PASSWORD
            </span>

            <h3>
              Change password
            </h3>

            <p>
              Use a strong password you
              don't use on other services.
            </p>
          </div>

          <div className="settings-card-icon">
            <LockKeyhole
              size={17}
              strokeWidth={
                1.8
              }
            />
          </div>
        </div>

        <div className="settings-security-notice">
          <ShieldCheck
            size={17}
          />

          <div>
            <strong>
              Keep your account secure
            </strong>

            <span>
              Your new password should
              contain at least 8
              characters.
            </span>
          </div>
        </div>

        <div className="settings-form-stack">
          <label>
            <span>
              Current password
            </span>

            <div className="settings-input-icon">
              <KeyRound
                size={15}
              />

              <input
                type="password"
                value={
                  currentPassword
                }
                onChange={(
                  event,
                ) =>
                  setCurrentPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
          </label>

          <label>
            <span>
              New password
            </span>

            <div className="settings-input-icon">
              <KeyRound
                size={15}
              />

              <input
                type="password"
                value={
                  newPassword
                }
                onChange={(
                  event,
                ) =>
                  setNewPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>
          </label>
        </div>

        {newPassword && (
          <div
            className={
              passwordStrong
                ? 'settings-password-strength strong'
                : 'settings-password-strength'
            }
          >
            <span className="settings-strength-bar" />
            <span className="settings-strength-bar" />
            <span className="settings-strength-bar" />
            <span>
              {passwordStrong
                ? 'Password length looks good'
                : 'Use at least 8 characters'}
            </span>
          </div>
        )}

        {error && (
          <div className="settings-error">
            <ShieldCheck
              size={15}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {saved && !error && (
          <div className="settings-success">
            <ShieldCheck
              size={14}
            />

            <span>
              Password updated
              successfully.
            </span>
          </div>
        )}

        <div className="settings-form-actions">
          <button
            type="button"
            className="settings-primary-button"
            disabled={
              saving ||
              !currentPassword ||
              newPassword.length <
                8
            }
            onClick={() =>
              void save()
            }
          >
            {saving
              ? 'Updating…'
              : 'Update password'}
          </button>
        </div>
      </section>
    </div>
  )
}

/* =========================================================
   PREFERENCES PANEL
   ========================================================= */

function PreferencesPanel() {
  const [
    theme,
    setTheme,
  ] =
    useState<
      'light' | 'dark'
    >('light')

  const [
    language,
    setLanguage,
  ] = useState('en')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let mounted = true

    void api
      .getUserPreferences()
      .then((response) => {
        if (!mounted) {
          return
        }

        const preferences =
          response.data
            .preferences ||
          {}

        const nextTheme =
          preferences.theme ===
          'dark'
            ? 'dark'
            : 'light'

        const nextLanguage =
          preferences.language ||
          'en'

        setTheme(nextTheme)
        setLanguage(
          nextLanguage,
        )

        document.documentElement.dataset.userTheme =
          nextTheme

        document.documentElement.lang =
          nextLanguage
      })
      .catch(() => {
        /*
         * Keep defaults when preferences cannot be loaded.
         */
      })

    return () => {
      mounted = false
    }
  }, [])

  async function save(
    nextTheme = theme,
    nextLanguage = language,
  ) {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      await api.updateUserPreferences(
        {
          theme:
            nextTheme,

          language:
            nextLanguage,
        },
      )

      document.documentElement.dataset.userTheme =
        nextTheme

      document.documentElement.lang =
        nextLanguage

      setTheme(nextTheme)
      setLanguage(
        nextLanguage,
      )

      setSaved(true)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to save preferences.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div className="settings-panel-heading">
          <div className="settings-heading-spacer" />

          <div>
            <span>
              EXPERIENCE
            </span>

            <h2>
              Appearance &amp;
              language
            </h2>

            <p>
              Customize how FedChat looks
              and behaves for your account.
            </p>
          </div>
        </div>
      </div>

      <section className="settings-content-card">
        <div className="settings-card-heading">
          <div>
            <span>
              PERSONALIZATION
            </span>

            <h3>
              My preferences
            </h3>

            <p>
              These settings affect only
              your account.
            </p>
          </div>

          <div className="settings-card-icon">
            <Palette
              size={17}
              strokeWidth={
                1.8
              }
            />
          </div>
        </div>

        {/* THEME */}

        <div className="settings-preference-item">
          <div className="settings-preference-icon">
            {theme ===
            'dark' ? (
              <Moon
                size={17}
                strokeWidth={
                  1.8
                }
              />
            ) : (
              <Sun
                size={17}
                strokeWidth={
                  1.8
                }
              />
            )}
          </div>

          <div className="settings-preference-copy">
            <strong>
              Theme
            </strong>

            <span>
              {theme ===
              'dark'
                ? 'Dark mode is enabled.'
                : 'Light mode is enabled.'}
            </span>
          </div>

          <button
            type="button"
            className={`settings-theme-switch ${
              theme ===
              'dark'
                ? 'dark'
                : ''
            }`}
            aria-pressed={
              theme ===
              'dark'
            }
            onClick={() => {
              const next =
                theme ===
                'dark'
                  ? 'light'
                  : 'dark'

              setTheme(next)

              void save(
                next,
                language,
              )
            }}
            disabled={
              saving
            }
          >
            <span />
          </button>
        </div>

        {/* THEME OPTIONS */}

        <div className="settings-theme-options">
          <button
            type="button"
            className={
              theme ===
              'light'
                ? 'selected'
                : ''
            }
            onClick={() => {
              setTheme('light')

              void save(
                'light',
                language,
              )
            }}
            disabled={
              saving
            }
          >
            <span className="settings-theme-option-icon light">
              <Sun
                size={16}
              />
            </span>

            <span>
              <strong>
                Light
              </strong>

              <small>
                Clean bright interface
              </small>
            </span>

            {theme ===
              'light' && (
              <ShieldCheck
                size={15}
              />
            )}
          </button>

          <button
            type="button"
            className={
              theme ===
              'dark'
                ? 'selected'
                : ''
            }
            onClick={() => {
              setTheme('dark')

              void save(
                'dark',
                language,
              )
            }}
            disabled={
              saving
            }
          >
            <span className="settings-theme-option-icon dark">
              <Moon
                size={16}
              />
            </span>

            <span>
              <strong>
                Dark
              </strong>

              <small>
                Easier on the eyes at night
              </small>
            </span>

            {theme ===
              'dark' && (
              <ShieldCheck
                size={15}
              />
            )}
          </button>
        </div>

        {/* LANGUAGE */}

        <div className="settings-preference-item language">
          <div className="settings-preference-icon">
            <Globe2
              size={17}
              strokeWidth={
                1.8
              }
            />
          </div>

          <div className="settings-preference-copy">
            <strong>
              My language
            </strong>

            <span>
              Choose the language used
              throughout FedChat.
            </span>
          </div>

          <select
            value={language}
            onChange={(event) => {
              setLanguage(
                event.target
                  .value,
              )
            }}
            disabled={saving}
          >
            <option value="en">
              English
            </option>

            <option value="hi">
              हिन्दी (Hindi)
            </option>
          </select>
        </div>

        {error && (
          <div className="settings-error">
            <ShieldCheck
              size={15}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {saved && !error && (
          <div className="settings-success">
            <ShieldCheck
              size={14}
            />

            <span>
              Preferences saved.
            </span>
          </div>
        )}

        <div className="settings-form-actions">
          <button
            type="button"
            className="settings-primary-button"
            disabled={saving}
            onClick={() =>
              void save()
            }
          >
            {saving
              ? 'Saving…'
              : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  )
}

/* =========================================================
   SETTINGS ROW ICON
   ========================================================= */

function SettingIcon({
  type,
}: {
  type:
    | 'profile'
    | 'security'
    | 'preferences'
    | 'privacy'
    | 'notifications'
    | 'chats'
    | 'storage'
}) {
  switch (type) {
    case 'profile':
      return (
        <UserRound
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'security':
      return (
        <LockKeyhole
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'preferences':
      return (
        <Palette
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'privacy':
      return (
        <ShieldCheck
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'notifications':
      return (
        <Bell
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'chats':
      return (
        <Users
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    case 'storage':
      return (
        <Globe2
          size={18}
          strokeWidth={
            1.8
          }
        />
      )

    default:
      return (
        <Palette
          size={18}
        />
      )
  }
}

/* =========================================================
   SETTINGS MODULE
   ========================================================= */

export function SettingsModule() {
  const [
    panel,
    setPanel,
  ] =
    useState<SettingsPanel>(
      null,
    )

  return (
    <section className="settings-page">
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <header className="settings-page-header">
        <div className="settings-page-header-copy">
          <span>
            ACCOUNT CONTROL
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Control your FedChat experience,
            profile and account preferences.
          </p>
        </div>

        <div className="settings-page-badge">
          <ShieldCheck
            size={14}
          />

          <span>
            ACCOUNT
          </span>
        </div>
      </header>

      {/* =================================================
          PROFILE SUMMARY
          ================================================= */}

      {!panel && (
        <>
          <section className="settings-account-summary">
            <div className="settings-summary-avatar">
              {assetUrl(
                getSession()
                  ?.user
                  ?.avatar,
              ) ? (
                <img
                  src={assetUrl(
                    getSession()
                      ?.user
                      ?.avatar,
                  )}
                  alt=""
                />
              ) : (
                initials(
                  getSession()
                    ?.user,
                )
              )}
            </div>

            <div className="settings-summary-copy">
              <div>
                <strong>
                  {fullName(
                    getSession()
                      ?.user,
                  )}
                </strong>

                <span className="settings-summary-online">
                  Online
                </span>
              </div>

              <span>
                @
                {getSession()
                  ?.user
                  ?.username ||
                  'username'}
              </span>
            </div>

            <button
              type="button"
              className="settings-summary-edit"
              onClick={() =>
                setPanel(
                  'Profile',
                )
              }
            >
              Edit profile
              <ChevronRight
                size={14}
              />
            </button>
          </section>

          {/* =================================================
              SETTINGS GROUPS
              ================================================= */}

          <div className="settings-content-layout">
            {/* ACCOUNT */}

            <section className="settings-group">
              <div className="settings-group-heading">
                <span>
                  ACCOUNT
                </span>

                <h2>
                  Account settings
                </h2>
              </div>

              <div className="settings-list">
                <button
                  type="button"
                  className="settings-row"
                  onClick={() =>
                    setPanel(
                      'Profile',
                    )
                  }
                >
                  <div className="settings-row-icon">
                    <SettingIcon
                      type="profile"
                    />
                  </div>

                  <div className="settings-row-copy">
                    <strong>
                      Profile
                    </strong>

                    <span>
                      Profile photo, cover
                      banner, name, username
                      and bio
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className="settings-row-arrow"
                  />
                </button>

                <button
                  type="button"
                  className="settings-row"
                  onClick={() =>
                    setPanel(
                      'Security',
                    )
                  }
                >
                  <div className="settings-row-icon security">
                    <SettingIcon
                      type="security"
                    />
                  </div>

                  <div className="settings-row-copy">
                    <strong>
                      Security
                    </strong>

                    <span>
                      Change your password
                      and secure your account
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className="settings-row-arrow"
                  />
                </button>

                <button
                  type="button"
                  className="settings-row"
                  onClick={() =>
                    setPanel(
                      'Preferences',
                    )
                  }
                >
                  <div className="settings-row-icon appearance">
                    <SettingIcon
                      type="preferences"
                    />
                  </div>

                  <div className="settings-row-copy">
                    <strong>
                      Appearance &amp;
                      language
                    </strong>

                    <span>
                      Light/dark theme and
                      interface language
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className="settings-row-arrow"
                  />
                </button>
              </div>
            </section>

            {/* COMMUNICATION */}

            <section className="settings-group">
              <div className="settings-group-heading">
                <span>
                  COMMUNICATION
                </span>

                <h2>
                  Experience
                </h2>
              </div>

              <div className="settings-list">
                {other.map(
                  (
                    [
                      title,
                      description,
                    ],
                  ) => {
                    let type:
                      | Parameters<
                          typeof SettingIcon
                        >[0]['type']

                    switch (
                      title
                    ) {
                      case 'Privacy':
                        type =
                          'privacy'
                        break

                      case 'Notifications':
                        type =
                          'notifications'
                        break

                      case 'Chats':
                        type =
                          'chats'
                        break

                      default:
                        type =
                          'storage'
                    }

                    return (
                      <button
                        type="button"
                        className="settings-row disabled"
                        key={title}
                        disabled
                      >
                        <div className="settings-row-icon">
                          <SettingIcon
                            type={
                              type
                            }
                          />
                        </div>

                        <div className="settings-row-copy">
                          <div className="settings-row-title-line">
                            <strong>
                              {title}
                            </strong>

                            <span className="settings-coming-soon">
                              Soon
                            </span>
                          </div>

                          <span>
                            {
                              description
                            }
                          </span>
                        </div>

                        <ChevronRight
                          size={
                            16
                          }
                          className="settings-row-arrow"
                        />
                      </button>
                    )
                  },
                )}
              </div>
            </section>
          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

          <footer className="settings-page-footer">
            <ShieldCheck
              size={14}
            />

            <span>
              Your personal preferences are
              saved to your FedChat account.
            </span>
          </footer>
        </>
      )}

      {/* =================================================
          DETAIL PANELS
          ================================================= */}

      {panel ===
        'Profile' && (
        <ProfilePanel
          onClose={() =>
            setPanel(null)
          }
        />
      )}

      {panel ===
        'Security' && (
        <SecurityPanel
          onClose={() =>
            setPanel(null)
          }
        />
      )}

      {panel ===
        'Preferences' && (
        <PreferencesPanel />
      )}

      {/* =================================================
          MOBILE CLOSE ACTION FOR DETAIL PANELS
          ================================================= */}

      {panel && (
        <button
          type="button"
          className="settings-floating-close"
          onClick={() =>
            setPanel(null)
          }
          aria-label="Close settings panel"
        >
          <X
            size={17}
          />
        </button>
      )}
    </section>
  )
}

export default SettingsModule