import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Globe2,
  Lock,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  assetUrl,
} from '../lib'

import {
  useApplySiteSettings,
  useSiteSettings,
} from '../hooks/useSiteSettings'

import './public-home.css'

/* =========================================================
   TYPES
   ========================================================= */

type PublicGroup = {
  id: string
  name: string
  description?: string | null
  avatar?: string | null
  bannerUrl?: string | null
  memberCount?: number
  member_count?: number
  isPublic?: boolean
  is_public?: boolean
  accessLevel?: string
  access_level?: string
  planName?: string | null
  plan_name?: string | null
  joinPath?: string
  join_path?: string
  inviteLink?: string
  invite_link?: string
}

/* =========================================================
   HELPERS
   ========================================================= */

function initials(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map(
        (part) =>
          part.charAt(0),
      )
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'G'
  )
}

function memberCount(
  group: PublicGroup,
) {
  return Number(
    group.memberCount ??
      group.member_count ??
      0,
  )
}

function groupAccess(
  group: PublicGroup,
) {
  return String(
    group.accessLevel ??
      group.access_level ??
      'FULL',
  ).toUpperCase()
}

function groupPlan(
  group: PublicGroup,
) {
  return (
    group.planName ??
    group.plan_name ??
    ''
  )
}

/* =========================================================
   BRAND
   ========================================================= */

function Brand({
  name,
  logoUrl,
  tagline,
  onClick,
}: {
  name: string
  logoUrl?: string | null
  tagline: string
  onClick?: () => void
}) {
  const logo = logoUrl
    ? assetUrl(logoUrl)
    : ''

  return (
    <button
      type="button"
      className="public-brand"
      onClick={onClick}
      aria-label={`${name} home`}
    >
      <span className="public-brand-mark">
        {logo ? (
          <img
            src={logo}
            alt={name}
            onError={(
              event,
            ) => {
              event.currentTarget.style.display =
                'none'
            }}
          />
        ) : (
          name
            .charAt(0)
            .toUpperCase() || 'F'
        )}
      </span>

      <span className="public-brand-copy">
        <strong>
          {name}
        </strong>

        <small>
          {tagline}
        </small>
      </span>
    </button>
  )
}

/* =========================================================
   PUBLIC GROUP CARD
   ========================================================= */

function PublicGroupCard({
  group,
  onCopy,
  copied,
}: {
  group: PublicGroup
  onCopy: (
    group: PublicGroup,
  ) => void
  copied: boolean
}) {
  const banner = group.bannerUrl
    ? assetUrl(
        group.bannerUrl,
      )
    : ''

  const avatar = group.avatar
    ? assetUrl(
        group.avatar,
      )
    : ''

  const count =
    memberCount(group)

  const access =
    groupAccess(group)

  const plan =
    groupPlan(group)

  const rawJoin =
    group.joinPath ||
    group.join_path ||
    group.inviteLink ||
    group.invite_link ||
    ''

  const joinLink =
    rawJoin.startsWith(
      'http',
    )
      ? rawJoin
      : rawJoin
        ? `${window.location.origin}${rawJoin.startsWith('/') ? '' : '/'}${rawJoin}`
        : ''

  return (
    <article className="public-group-card">
      <div
        className="public-group-banner"
        style={
          banner
            ? {
                backgroundImage: `url(${banner})`,
              }
            : undefined
        }
      >
        {!banner && (
          <div className="public-group-banner-pattern">
            <span />
            <span />
            <span />
          </div>
        )}

        <div className="public-group-badge">
          <Globe2
            size={11}
          />

          Public
        </div>
      </div>

      <div className="public-group-content">
        <div className="public-group-avatar">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              onError={(
                event,
              ) => {
                event.currentTarget.style.display =
                  'none'
              }}
            />
          ) : (
            initials(
              group.name,
            )
          )}
        </div>

        <div className="public-group-heading">
          <div>
            <h3>
              {group.name}
            </h3>

            <span>
              <Users
                size={11}
              />

              {count.toLocaleString(
                'en-IN',
              )}{' '}
              members
            </span>
          </div>
        </div>

        <p className="public-group-description">
          {group.description ||
            'Join this public group and connect with the community.'}
        </p>

        <div className="public-group-meta">
          <span>
            <ShieldCheck
              size={11}
            />

            {access ===
            'FULL'
              ? 'Professional'
              : access}
          </span>

          {plan && (
            <span>
              {plan}
            </span>
          )}
        </div>

        <div className="public-group-actions">
          {joinLink ? (
            <a
              className="public-group-join"
              href={joinLink}
            >
              Join group
              <ArrowRight
                size={13}
              />
            </a>
          ) : (
            <button
              type="button"
              className="public-group-join disabled"
              disabled
            >
              Join unavailable
            </button>
          )}

          <button
            type="button"
            className="public-group-copy"
            disabled={!joinLink}
            onClick={() =>
              onCopy(group)
            }
            title="Copy join link"
            aria-label="Copy join link"
          >
            {copied ? (
              <Check
                size={14}
              />
            ) : (
              <Copy
                size={14}
              />
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

/* =========================================================
   PUBLIC GROUPS
   ========================================================= */

function PublicGroups({
  siteName,
}: {
  siteName: string
}) {
  const [
    groups,
    setGroups,
  ] = useState<
    PublicGroup[] | null
  >(null)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    copiedId,
    setCopiedId,
  ] = useState<
    string | null
  >(null)

  const [
    error,
    setError,
  ] = useState('')

 useEffect(() => {
  let mounted = true

  async function load() {
    try {
      const apiBase =
        import.meta.env.VITE_API_URL ||
        'http://localhost:4000/api/v1'

      const response = await fetch(
        `${apiBase}/public/groups`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error(
          `Public groups request failed (${response.status})`,
        )
      }

      const data = await response.json()

      if (!mounted) return

      const list = Array.isArray(data?.data?.groups)
        ? data.data.groups
        : Array.isArray(data?.groups)
          ? data.groups
          : Array.isArray(data)
            ? data
            : []

      setGroups(
        list.filter(
          (group: PublicGroup) =>
            group.isPublic !== false &&
            group.is_public !== false,
        ),
      )
    } catch (error) {
      if (!mounted) return

      setGroups([])

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load public groups.',
      )
    }
  }

  void load()

  return () => {
    mounted = false
  }
}, [])
  const filtered =
    useMemo(() => {
      if (!groups) {
        return []
      }

      const value =
        search
          .trim()
          .toLowerCase()

      if (!value) {
        return groups
      }

      return groups.filter(
        (group) =>
          group.name
            .toLowerCase()
            .includes(
              value,
            ) ||
          String(
            group.description ||
              '',
          )
            .toLowerCase()
            .includes(
              value,
            ),
      )
    }, [
      groups,
      search,
    ])

  async function copyJoinLink(
    group: PublicGroup,
  ) {
    const raw =
      group.joinPath ||
      group.join_path ||
      group.inviteLink ||
      group.invite_link ||
      ''

    if (!raw) {
      return
    }

    const link =
      raw.startsWith(
        'http',
      )
        ? raw
        : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`

    try {
      await navigator.clipboard.writeText(
        link,
      )

      setCopiedId(
        group.id,
      )

      window.setTimeout(
        () => {
          setCopiedId(
            (
              current,
            ) =>
              current ===
              group.id
                ? null
                : current,
          )
        },
        1500,
      )
    } catch {
      // Clipboard may be unavailable.
    }
  }

  return (
    <section
      id="groups"
      className="public-section public-groups-section"
    >
      <div className="public-groups-section-top">
        <div className="public-section-heading">
          <span>
            DISCOVER &amp; JOIN
          </span>

          <h2>
            Public groups
          </h2>

          <p>
            Discover public communities on{' '}
            {siteName} and join the
            conversation.
          </p>
        </div>

        <div className="public-groups-search">
          <SearchIcon />

          <input
            value={search}
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search public groups"
            aria-label="Search public groups"
          />
        </div>
      </div>

      {error && (
        <div className="public-groups-message error">
          <AlertCircleIcon />

          <div>
            <strong>
              Public groups are temporarily unavailable
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {groups ===
        null && (
        <div className="public-groups-loading">
          <div className="public-loading-spinner" />

          <div>
            <strong>
              Finding public groups
            </strong>

            <span>
              Loading communities available for
              public discovery…
            </span>
          </div>
        </div>
      )}

      {groups !==
        null &&
        groups.length ===
          0 && (
          <div className="public-groups-empty">
            <div className="public-empty-icon">
              <Users
                size={22}
              />
            </div>

            <strong>
              No public groups yet
            </strong>

            <span>
              Public groups configured for discovery
              will appear here.
            </span>
          </div>
        )}

      {groups !==
        null &&
        groups.length >
          0 &&
        filtered.length ===
          0 && (
          <div className="public-groups-empty">
            <div className="public-empty-icon">
              <Search
                size={21}
              />
            </div>

            <strong>
              No matching groups
            </strong>

            <span>
              Try another search term.
            </span>
          </div>
        )}

      {filtered.length >
        0 && (
        <div className="public-groups-grid">
          {filtered.map(
            (group) => (
              <PublicGroupCard
                key={
                  group.id
                }
                group={
                  group
                }
                copied={
                  copiedId ===
                  group.id
                }
                onCopy={
                  copyJoinLink
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  )
}

/* =========================================================
   ICON HELPERS
   ========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 4 4" />
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v5" />

      <path d="M12 16h.01" />
    </svg>
  )
}

/* =========================================================
   FEATURE
   ========================================================= */

function FeatureCard({
  icon,
  title,
  text,
  number,
}: {
  icon: React.ReactNode
  title: string
  text: string
  number: string
}) {
  return (
    <article className="public-feature-card">
      <div className="public-feature-top">
        <div className="public-feature-icon">
          {icon}
        </div>

        <span>
          {number}
        </span>
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>
    </article>
  )
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export function PublicHomePage({
  onLogin,
}: {
  onLogin: () => void
}) {
  const {
    settings,
  } = useSiteSettings()

  useApplySiteSettings(
    settings,
  )

  const siteName =
    settings.name?.trim() ||
    'FedChat'

  const tagline =
    settings.tagline?.trim() ||
    'Private conversations, live.'

  const description =
    settings.description?.trim() ||
    'Connect with people, build groups and communities, and keep your conversations moving in real time.'

  const logoUrl =
    settings.logoUrl ||
    ''

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  /* =======================================================
     CLOSE MOBILE MENU
     ======================================================= */

  function closeMobileMenu() {
    setMobileMenuOpen(
      false,
    )
  }

  return (
    <div className="public-home">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="public-header">
        <div className="public-header-inner">
          <Brand
            name={
              siteName
            }
            logoUrl={
              logoUrl
            }
            tagline={
              tagline
            }
            onClick={() =>
              window.scrollTo(
                {
                  top: 0,
                  behavior:
                    'smooth',
                },
              )
            }
          />

          <nav
            className={
              mobileMenuOpen
                ? 'public-main-nav mobile-open'
                : 'public-main-nav'
            }
          >
            <a
              href="#features"
              onClick={
                closeMobileMenu
              }
            >
              Features
            </a>

            <a
              href="#groups"
              onClick={
                closeMobileMenu
              }
            >
              Public Groups
            </a>

            <a
              href="#how-it-works"
              onClick={
                closeMobileMenu
              }
            >
              How it works
            </a>

            <a
              href="#about"
              onClick={
                closeMobileMenu
              }
            >
              About
            </a>
          </nav>

          <div className="public-header-actions">
            <button
              type="button"
              className="public-sign-in"
              onClick={
                onLogin
              }
            >
              Sign in
            </button>

            <button
              type="button"
              className="public-header-cta"
              onClick={
                onLogin
              }
            >
              Get started
              <ArrowRight
                size={13}
              />
            </button>
          </div>

          <button
            type="button"
            className="public-mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (
                  current,
                ) => !current,
              )
            }
            aria-label="Toggle navigation"
            aria-expanded={
              mobileMenuOpen
            }
          >
            {mobileMenuOpen ? (
              <X
                size={19}
              />
            ) : (
              <Menu
                size={19}
              />
            )}
          </button>
        </div>
      </header>

      {/* ===================================================
          HERO
          =================================================== */}

      <main>
        <section className="public-hero">
          <div className="public-hero-orb public-hero-orb-one" />
          <div className="public-hero-orb public-hero-orb-two" />

          <div className="public-hero-inner">
            <div className="public-hero-copy">
              <div className="public-hero-eyebrow">
                <span>
                  <span className="public-live-dot" />
                  REALTIME COMMUNICATION
                </span>
              </div>

              <h1>
                Connect.
                <br />
                <span>
                  Chat.
                </span>
                <br />
                Build communities.
              </h1>

              <p>
                {description}
              </p>

              <div className="public-hero-actions">
                <button
                  type="button"
                  className="public-primary-button"
                  onClick={
                    onLogin
                  }
                >
                  Start chatting
                  <ArrowRight
                    size={15}
                  />
                </button>

                <a
                  className="public-secondary-button"
                  href="#groups"
                >
                  Explore public groups
                  <ChevronRight
                    size={14}
                  />
                </a>
              </div>

              <div className="public-hero-trust">
                <span>
                  <CheckCircle2
                    size={12}
                  />
                  Realtime
                </span>

                <span>
                  <CheckCircle2
                    size={12}
                  />
                  Groups
                </span>

                <span>
                  <CheckCircle2
                    size={12}
                  />
                  Communities
                </span>

                <span>
                  <ShieldCheck
                    size={12}
                  />
                  Protected access
                </span>
              </div>
            </div>

            {/* =============================================
                APP MOCKUP
                ============================================= */}

            <div className="public-hero-visual">
              <div className="public-floating-bubble public-floating-bubble-top">
                <div className="public-floating-icon">
                  <Zap
                    size={13}
                  />
                </div>

                <div>
                  <strong>
                    Live messaging
                  </strong>

                  <span>
                    Messages appear instantly
                  </span>
                </div>
              </div>

              <div className="public-app-window">
                <div className="public-app-topbar">
                  <div className="public-app-dots">
                    <span />
                    <span />
                    <span />
                  </div>

                  <strong>
                    {siteName}
                  </strong>

                  <span className="public-app-live">
                    <i />
                    Live
                  </span>
                </div>

                <div className="public-app-body">
                  <aside className="public-app-sidebar">
                    <div className="public-app-logo">
                      {logoUrl ? (
                        <img
                          src={assetUrl(
                            logoUrl,
                          )}
                          alt=""
                        />
                      ) : (
                        siteName
                          .charAt(
                            0,
                          )
                          .toUpperCase()
                      )}
                    </div>

                    <div className="public-app-nav active">
                      <MessageCircle
                        size={11}
                      />
                      Chats
                    </div>

                    <div className="public-app-nav">
                      <Users
                        size={11}
                      />
                      Groups
                    </div>

                    <div className="public-app-nav">
                      <Globe2
                        size={11}
                      />
                      Communities
                    </div>

                    <div className="public-app-nav">
                      <ShieldCheck
                        size={11}
                      />
                      Settings
                    </div>
                  </aside>

                  <div className="public-app-chat">
                    <div className="public-app-chat-header">
                      <div className="public-preview-avatar">
                        AK
                      </div>

                      <div>
                        <strong>
                          Amit Kumar
                        </strong>

                        <span>
                          <i />
                          Online now
                        </span>
                      </div>
                    </div>

                    <div className="public-app-messages">
                      <div className="public-preview-message incoming">
                        Hey, are you available?
                      </div>

                      <div className="public-preview-time incoming-time">
                        10:28 AM
                      </div>

                      <div className="public-preview-message outgoing">
                        Yes, I'm here.
                      </div>

                      <div className="public-preview-time outgoing-time">
                        10:29 AM
                      </div>

                      <div className="public-preview-message incoming">
                        Let's discuss the project.
                      </div>

                      <div className="public-preview-message outgoing">
                        Sure. I'll send the latest files.
                      </div>
                    </div>

                    <div className="public-app-composer">
                      <span>
                        Message Amit…
                      </span>

                      <div>
                        <ArrowRight
                          size={11}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="public-floating-bubble public-floating-bubble-bottom">
                <div className="public-floating-icon">
                  <Users
                    size={13}
                  />
                </div>

                <div>
                  <strong>
                    Community ready
                  </strong>

                  <span>
                    Groups + announcements
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            TRUST STRIP
            ================================================= */}

        <section className="public-trust-strip">
          <div>
            <Zap size={15} />
            <span>
              Fast realtime communication
            </span>
          </div>

          <div>
            <Users size={15} />
            <span>
              Organized groups
            </span>
          </div>

          <div>
            <Globe2 size={15} />
            <span>
              Public communities
            </span>
          </div>

          <div>
            <ShieldCheck
              size={15}
            />
            <span>
              Controlled access
            </span>
          </div>
        </section>

        {/* =================================================
            FEATURES
            ================================================= */}

        <section
          id="features"
          className="public-section"
        >
          <div className="public-section-heading">
            <span>
              BUILT FOR CONVERSATIONS
            </span>

            <h2>
              Everything you need in one workspace.
            </h2>

            <p>
              {siteName} brings direct communication,
              group collaboration and communities
              together without unnecessary clutter.
            </p>
          </div>

          <div className="public-feature-grid">
            <FeatureCard
              number="01"
              icon={
                <MessageCircle
                  size={18}
                />
              }
              title="Realtime chats"
              text="Send messages and keep conversations synchronized as they happen."
            />

            <FeatureCard
              number="02"
              icon={
                <Users
                  size={18}
                />
              }
              title="Focused groups"
              text="Create organized group spaces for teams, projects and communities."
            />

            <FeatureCard
              number="03"
              icon={
                <Globe2
                  size={18}
                />
              }
              title="Communities"
              text="Connect related groups through announcements and shared community spaces."
            />

            <FeatureCard
              number="04"
              icon={
                <ShieldCheck
                  size={18}
                />
              }
              title="Controlled access"
              text="Roles, plans and guest access help keep your communication organized."
            />
          </div>
        </section>

        {/* =================================================
            PUBLIC GROUPS
            ================================================= */}

        <PublicGroups
          siteName={
            siteName
          }
        />

        {/* =================================================
            HOW IT WORKS
            ================================================= */}

        <section
          id="how-it-works"
          className="public-section"
        >
          <div className="public-section-heading">
            <span>
              SIMPLE TO GET STARTED
            </span>

            <h2>
              From sign-up to conversation in minutes.
            </h2>

            <p>
              A straightforward experience whether
              you're starting a private chat or joining
              a public group.
            </p>
          </div>

          <div className="public-process">
            <div className="public-process-line" />

            <div className="public-process-card">
              <span>
                01
              </span>

              <div className="public-process-icon">
                <Lock
                  size={17}
                />
              </div>

              <h3>
                Create your account
              </h3>

              <p>
                Sign up and create your profile so
                people can find and message you.
              </p>
            </div>

            <div className="public-process-card">
              <span>
                02
              </span>

              <div className="public-process-icon">
                <Users
                  size={17}
                />
              </div>

              <h3>
                Find people or groups
              </h3>

              <p>
                Connect with contacts or discover
                groups open for public participation.
              </p>
            </div>

            <div className="public-process-card">
              <span>
                03
              </span>

              <div className="public-process-icon">
                <MessageCircle
                  size={17}
                />
              </div>

              <h3>
                Start chatting
              </h3>

              <p>
                Send realtime messages and stay in sync
                with your conversations.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            PUBLIC CTA
            ================================================= */}

        <section className="public-final-cta">
          <div className="public-final-cta-glow" />

          <div className="public-final-cta-content">
            <span>
              READY TO CONNECT?
            </span>

            <h2>
              Your conversations
              <br />
              start here.
            </h2>

            <p>
              Join {siteName} and bring your people,
              conversations and communities together.
            </p>

            <button
              type="button"
              className="public-final-button"
              onClick={
                onLogin
              }
            >
              Enter {siteName}

              <ArrowRight
                size={15}
              />
            </button>
          </div>

          <div className="public-final-cta-art">
            <div className="public-final-card card-one">
              <MessageCircle
                size={14}
              />

              <span>
                Live messages
              </span>
            </div>

            <div className="public-final-card card-two">
              <Users
                size={14}
              />

              <span>
                Group conversations
              </span>
            </div>

            <div className="public-final-card card-three">
              <Globe2
                size={14}
              />

              <span>
                Communities
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            ABOUT
            ================================================= */}

        <section
          id="about"
          className="public-about-section"
        >
          <div>
            <span>
              ABOUT {siteName.toUpperCase()}
            </span>

            <h2>
              Communication designed around people.
            </h2>

            <p>
              {description}
            </p>
          </div>

          <div className="public-about-points">
            <div>
              <CheckCircle2
                size={14}
              />

              <span>
                Direct conversations
              </span>
            </div>

            <div>
              <CheckCircle2
                size={14}
              />

              <span>
                Group collaboration
              </span>
            </div>

            <div>
              <CheckCircle2
                size={14}
              />

              <span>
                Community spaces
              </span>
            </div>

            <div>
              <CheckCircle2
                size={14}
              />

              <span>
                Guest access
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div>
            <Brand
              name={
                siteName
              }
              logoUrl={
                logoUrl
              }
              tagline={
                tagline
              }
            />

            <p>
              {description}
            </p>
          </div>

          <div className="public-footer-links">
            <div>
              <strong>
                Explore
              </strong>

              <a href="#features">
                Features
              </a>

              <a href="#groups">
                Public Groups
              </a>

              <a href="#how-it-works">
                How it works
              </a>
            </div>

            <div>
              <strong>
                Legal
              </strong>

              <a href="/privacy">
                Privacy
              </a>

              <a href="/terms">
                Terms
              </a>

              <button
                type="button"
                onClick={
                  onLogin
                }
              >
                Sign in
              </button>
            </div>

            <div>
              <strong>
                Support
              </strong>

              <a href="/support">
                Help center
              </a>

              <a href="/contact">
                Contact us
              </a>
            </div>
          </div>
        </div>

        <div className="public-footer-bottom">
          <span>
            © {new Date().getFullYear()}{' '}
            {siteName}. All rights reserved.
          </span>

          <span>
            <ShieldCheck
              size={11}
            />
            Built for private communication
          </span>
        </div>
      </footer>

      {/* =================================================
          MOBILE QUICK CTA
          ================================================= */}

      <div className="public-mobile-bottom-cta">
        <button
          type="button"
          onClick={
            onLogin
          }
        >
          Get started
          <ArrowRight
            size={14}
          />
        </button>
      </div>
    </div>
  )
}

export default PublicHomePage