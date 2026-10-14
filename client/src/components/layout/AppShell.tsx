import { useState, type ReactNode } from 'react'
import {
  Bell,
  Building2,
  Contact,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
  CircleHelp,
} from 'lucide-react'
import { assetUrl } from '../../lib'
import './AppShell.css'

export type AppNavKey =
  | 'chats'
  | 'contacts'
  | 'status'
  | 'groups'
  | 'communities'
  | 'notifications'
  | 'billing'
  | 'settings'
  | 'help'
  | 'admin'

type AppShellProps = {
  activeNav: AppNavKey
  onNavigate: (key: AppNavKey) => void
  children: ReactNode

  siteSettings?: {
    name?: string
    tagline?: string
    logoUrl?: string | null
  }

  user?: {
    name?: string
    username?: string
    avatar?: string | null
    status?: 'online' | 'offline' | 'away'
  }

  unreadNotifications?: number
  unreadChats?: number

  /**
   * Admin Console is only rendered when this is true.
   * App.tsx should pass:
   * isPlatformAdmin={session?.user?.role === 'platform_admin'}
   */
  isPlatformAdmin?: boolean

  onLogout?: () => void
}

type NavItem = {
  key: AppNavKey
  label: string
  icon: React.ComponentType<{
    size?: number
    strokeWidth?: number
  }>
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'chats',
    label: 'Chats',
    icon: MessageSquare,
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: Contact,
  },
  {
    key: 'status',
    label: 'Status',
    icon: CircleHelp,
  },
  {
    key: 'groups',
    label: 'Groups',
    icon: Users,
  },
  {
    key: 'communities',
    label: 'Communities',
    icon: Building2,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
  },
]

const SECONDARY_ITEMS: NavItem[] = [
  {
    key: 'billing',
    label: 'Plans & Billing',
    icon: CreditCard,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
  },
  {
    key: 'help',
    label: 'Help & Legal',
    icon: FileText,
  },
]

export function AppShell({
  activeNav,
  onNavigate,
  children,
  siteSettings,
  user,
  unreadNotifications = 0,
  unreadChats = 0,
  isPlatformAdmin = false,
  onLogout,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false)

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false)

  const siteName =
    siteSettings?.name?.trim() || 'FedChat'

  const tagline =
    siteSettings?.tagline?.trim() ||
    'Private communication'

  const displayName =
    user?.name?.trim() || 'FedChat User'

  const resolvedAvatar =
    user?.avatar
      ? assetUrl(user.avatar)
      : ''

  const resolvedLogo =
    siteSettings?.logoUrl
      ? assetUrl(siteSettings.logoUrl)
      : ''

  const initial =
    displayName.charAt(0).toUpperCase() || 'F'

  const navigate = (key: AppNavKey) => {
    /*
     * UI-level protection:
     * Never allow a non-admin shell to navigate
     * to the admin section.
     */
    if (
      key === 'admin' &&
      !isPlatformAdmin
    ) {
      return
    }

    onNavigate(key)

    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
  }

  const handleLogout = () => {
    setAccountMenuOpen(false)
    setMobileMenuOpen(false)
    onLogout?.()
  }

  return (
    <div className="app-shell">
      {/* ===================================================
          MOBILE OVERLAY
          =================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="app-mobile-overlay"
          aria-label="Close navigation"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`app-sidebar ${
          mobileMenuOpen
            ? 'mobile-open'
            : ''
        }`}
      >
        <div className="app-sidebar-top">
          <div className="app-sidebar-header">
            {/* =============================================
                BRAND
                ============================================= */}

            <button
              type="button"
              className="app-brand"
              onClick={() =>
                navigate('chats')
              }
            >
              {resolvedLogo ? (
                <img
                  src={resolvedLogo}
                  alt={siteName}
                  className="app-brand-logo"
                />
              ) : (
                <span className="app-brand-mark">
                  {siteName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span className="app-brand-copy">
                <strong>
                  {siteName}
                </strong>

                <small>
                  {tagline}
                </small>
              </span>
            </button>

            {/* =============================================
                MOBILE CLOSE
                ============================================= */}

            <button
              type="button"
              className="app-sidebar-close"
              aria-label="Close navigation"
              onClick={() =>
                setMobileMenuOpen(
                  false,
                )
              }
            >
              <X
                size={19}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* ===============================================
              NAVIGATION
              =============================================== */}

          <nav
            className="app-nav"
            aria-label="Primary navigation"
          >
            <span className="app-nav-label">
              WORKSPACE
            </span>

            {NAV_ITEMS.map(
              (item) => {
                const active =
                  activeNav ===
                  item.key

                const Icon =
                  item.icon

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`app-nav-item ${
                      active
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      navigate(
                        item.key,
                      )
                    }
                  >
                    <span className="app-nav-icon">
                      <Icon
                        size={17}
                        strokeWidth={
                          active
                            ? 2.2
                            : 1.8
                        }
                      />
                    </span>

                    <span className="app-nav-text">
                      {item.label}
                    </span>

                    {/* CHAT BADGE */}

                    {item.key ===
                      'chats' &&
                      unreadChats >
                        0 && (
                        <span className="app-nav-badge">
                          {unreadChats >
                          99
                            ? '99+'
                            : unreadChats}
                        </span>
                      )}

                    {/* NOTIFICATION BADGE */}

                    {item.key ===
                      'notifications' &&
                      unreadNotifications >
                        0 && (
                        <span className="app-nav-badge">
                          {unreadNotifications >
                          99
                            ? '99+'
                            : unreadNotifications}
                        </span>
                      )}
                  </button>
                )
              },
            )}

            {/* =============================================
                SECONDARY
                ============================================= */}

            <span className="app-nav-label app-nav-label-secondary">
              MORE
            </span>

            {SECONDARY_ITEMS.map(
              (item) => {
                const active =
                  activeNav ===
                  item.key

                const Icon =
                  item.icon

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`app-nav-item ${
                      active
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      navigate(
                        item.key,
                      )
                    }
                  >
                    <span className="app-nav-icon">
                      <Icon
                        size={17}
                        strokeWidth={
                          active
                            ? 2.2
                            : 1.8
                        }
                      />
                    </span>

                    <span className="app-nav-text">
                      {item.label}
                    </span>
                  </button>
                )
              },
            )}

            {/* =============================================
                ADMIN CONSOLE
                ONLY PLATFORM ADMIN
                ============================================= */}

            {isPlatformAdmin && (
              <button
                type="button"
                className={`app-nav-item ${
                  activeNav ===
                  'admin'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  navigate(
                    'admin',
                  )
                }
              >
                <span className="app-nav-icon">
                  <ShieldCheck
                    size={17}
                    strokeWidth={
                      activeNav ===
                      'admin'
                        ? 2.2
                        : 1.8
                    }
                  />
                </span>

                <span className="app-nav-text">
                  Admin Console
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* =================================================
            ACCOUNT AREA
            ================================================= */}

        <div className="app-sidebar-user">
          <div className="app-account-wrapper">
            {/* ACCOUNT POPUP */}

            {accountMenuOpen && (
              <div className="app-account-menu">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      'settings',
                    )
                  }
                >
                  <Settings
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Account settings
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      'help',
                    )
                  }
                >
                  <FileText
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Help & Legal
                  </span>
                </button>

                <div className="app-account-divider" />

                <button
                  type="button"
                  className="danger"
                  onClick={
                    handleLogout
                  }
                >
                  <LogOut
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>
                    Logout
                  </span>
                </button>
              </div>
            )}

            {/* USER CARD */}

            <button
              type="button"
              className="app-user-card"
              onClick={() =>
                setAccountMenuOpen(
                  (current) =>
                    !current,
                )
              }
              aria-expanded={
                accountMenuOpen
              }
            >
              <span className="app-avatar">
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={`${displayName} avatar`}
                    onError={(
                      event,
                    ) => {
                      event.currentTarget.style.display =
                        'none'
                    }}
                  />
                ) : (
                  initial
                )}

                <span
                  className={`app-online-dot ${
                    user?.status ===
                    'online'
                      ? 'online'
                      : ''
                  }`}
                />
              </span>

              <span className="app-user-copy">
                <strong>
                  {displayName}
                </strong>

                <small>
                  {user?.username
                    ? `@${user.username}`
                    : 'Account'}
                </small>
              </span>

              <MoreVertical
                size={15}
                strokeWidth={1.8}
                className="app-user-menu"
              />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================
          MAIN
          =================================================== */}

      <div className="app-main">
        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              aria-expanded={
                mobileMenuOpen
              }
              onClick={() =>
                setMobileMenuOpen(
                  (current) =>
                    !current,
                )
              }
            >
              <Menu
                size={20}
                strokeWidth={2}
              />
            </button>

            <div className="mobile-page-brand">
              {resolvedLogo ? (
                <img
                  src={resolvedLogo}
                  alt={siteName}
                  className="mobile-page-logo"
                />
              ) : (
                <span className="app-brand-mark small">
                  {siteName
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <strong>
                {siteName}
              </strong>
            </div>
          </div>

          {/* ===============================================
              TOPBAR ACTIONS
              =============================================== */}

          <div className="app-topbar-actions">
            <button
              type="button"
              className="app-topbar-action"
              aria-label="Search"
            >
              <Search
                size={17}
                strokeWidth={1.9}
              />
            </button>

            <button
              type="button"
              className="app-topbar-action notification-action"
              onClick={() =>
                navigate(
                  'notifications',
                )
              }
              aria-label="Notifications"
            >
              <Bell
                size={17}
                strokeWidth={1.9}
              />

              {unreadNotifications >
                0 && (
                <span className="app-topbar-badge" />
              )}
            </button>

            <div className="app-topbar-account">
              {/* TOPBAR ACCOUNT MENU */}

              {accountMenuOpen && (
                <div className="app-topbar-account-menu">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        'settings',
                      )
                    }
                  >
                    <Settings
                      size={15}
                    />

                    <span>
                      Settings
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="danger"
                  >
                    <LogOut
                      size={15}
                    />

                    <span>
                      Logout
                    </span>
                  </button>
                </div>
              )}

              {/* TOPBAR AVATAR */}

              <button
                type="button"
                className="app-topbar-avatar"
                onClick={() =>
                  setAccountMenuOpen(
                    (current) =>
                      !current,
                  )
                }
                aria-label="Account menu"
                aria-expanded={
                  accountMenuOpen
                }
              >
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={`${displayName} avatar`}
                    onError={(
                      event,
                    ) => {
                      event.currentTarget.style.display =
                        'none'
                    }}
                  />
                ) : (
                  <User
                    size={15}
                    strokeWidth={1.8}
                  />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
            ================================================= */}

        <main className="app-content">
          {children}
        </main>

        {/* =================================================
            MOBILE NAVIGATION
            ================================================= */}

        <nav
          className="app-mobile-nav"
          aria-label="Mobile navigation"
        >
          {/* CHATS */}

          <button
            type="button"
            className={
              activeNav ===
              'chats'
                ? 'active'
                : ''
            }
            onClick={() =>
              navigate('chats')
            }
          >
            <MessageSquare
              size={18}
              strokeWidth={1.9}
            />

            <small>
              Chats
            </small>

            {unreadChats >
              0 && (
              <b>
                {unreadChats >
                9
                  ? '9+'
                  : unreadChats}
              </b>
            )}
          </button>

          {/* CONTACTS */}

          <button
            type="button"
            className={
              activeNav ===
              'contacts'
                ? 'active'
                : ''
            }
            onClick={() =>
              navigate(
                'contacts',
              )
            }
          >
            <Contact
              size={18}
              strokeWidth={1.9}
            />

            <small>
              Contacts
            </small>
          </button>

          {/* STATUS */}

          <button
            type="button"
            className={
              activeNav ===
              'status'
                ? 'active'
                : ''
            }
            onClick={() =>
              navigate('status')
            }
          >
            <CircleHelp
              size={18}
              strokeWidth={1.9}
            />

            <small>
              Status
            </small>
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className={
              activeNav ===
              'notifications'
                ? 'active'
                : ''
            }
            onClick={() =>
              navigate(
                'notifications',
              )
            }
          >
            <Bell
              size={18}
              strokeWidth={1.9}
            />

            <small>
              Alerts
            </small>

            {unreadNotifications >
              0 && <b />}
          </button>

          {/* PROFILE */}

          <button
            type="button"
            className={
              activeNav ===
              'settings'
                ? 'active'
                : ''
            }
            onClick={() =>
              navigate(
                'settings',
              )
            }
          >
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={`${displayName} avatar`}
                className="app-mobile-profile-image"
                onError={(
                  event,
                ) => {
                  event.currentTarget.style.display =
                    'none'
                }}
              />
            ) : (
              <User
                size={18}
                strokeWidth={1.9}
              />
            )}

            <small>
              Profile
            </small>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default AppShell