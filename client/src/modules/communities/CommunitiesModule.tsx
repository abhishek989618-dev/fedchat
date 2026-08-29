import {
  Bell,
  ChevronRight,
  Globe2,
  Megaphone,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api, getSession } from '../../lib'

import './communities.css'

/* =========================================================
   TYPES
   ========================================================= */

type Community = {
  id: string
  name: string
  description?: string | null
  owner_id: string
  member_count: number
}

type Group = {
  id: string
  name: string
}

type Announcement = {
  id: string
  title: string
  content: string
  created_at: string
  first_name?: string
  last_name?: string
}

/* =========================================================
   HELPERS
   ========================================================= */

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CM'
  )
}


function formatAnnouncementDate(
  value: string,
) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/* =========================================================
   COMMUNITY AVATAR
   ========================================================= */

function CommunityAvatar({
  community,
  large = false,
}: {
  community: Community
  large?: boolean
}) {
  return (
    <div
      className={
        large
          ? 'community-avatar large'
          : 'community-avatar'
      }
    >
      {initials(community.name)}
    </div>
  )
}

/* =========================================================
   MAIN MODULE
   ========================================================= */

export function CommunitiesModule({
  onNavigateToPlans,
}: {
  onNavigateToPlans?: () => void
}) {
  const [communities, setCommunities] =
    useState<Community[] | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [selected, setSelected] =
    useState<string | null>(null)

  const [groups, setGroups] =
    useState<Group[] | null>(null)

  const [myGroups, setMyGroups] =
    useState<Group[]>([])

  const [announcements, setAnnouncements] =
    useState<Announcement[] | null>(
      null,
    )

  const [annTitle, setAnnTitle] =
    useState('')

  const [annContent, setAnnContent] =
    useState('')

  const [postingAnn, setPostingAnn] =
    useState(false)

  const [showCreate, setShowCreate] =
    useState(false)

  const [name, setName] =
    useState('')

  const [creating, setCreating] =
    useState(false)

  const [createError, setCreateError] =
    useState<{
      message: string
      needsSubscription: boolean
    } | null>(null)

  const [search, setSearch] =
    useState('')

  const [mobileListOpen, setMobileListOpen] =
    useState(false)

  /* =======================================================
     LOAD COMMUNITIES
     ======================================================= */

  async function loadCommunities() {
    setError(null)

    try {
      const response =
        await api.communities()

      const list =
        Array.isArray(
          response?.data?.communities,
        )
          ? (response.data.communities as Community[])
          : []

      setCommunities(list)

      setSelected((current) => {
        if (
          current &&
          list.some(
            (community) =>
              community.id ===
              current,
          )
        ) {
          return current
        }

        return list.length > 0
          ? list[0].id
          : null
      })
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load communities.',
      )
    }
  }

  useEffect(() => {
    void loadCommunities()
  }, [])

  /* =======================================================
     LOAD AVAILABLE GROUPS
     ======================================================= */

  useEffect(() => {
    let alive = true

    void api
      .groups()
      .then((response) => {
        if (!alive) {
          return
        }

        setMyGroups(
          Array.isArray(
            response?.data?.groups,
          )
            ? (response.data.groups as Group[])
            : [],
        )
      })
      .catch(() => {
        if (alive) {
          setMyGroups([])
        }
      })

    return () => {
      alive = false
    }
  }, [])

  /* =======================================================
     LOAD SELECTED COMMUNITY
     ======================================================= */

  useEffect(() => {
    if (!selected) {
      setGroups(null)
      setAnnouncements(null)
      return
    }

    let alive = true

    setGroups(null)
    setAnnouncements(null)

    void api
      .communityGroups(selected)
      .then((response) => {
        if (!alive) {
          return
        }

        setGroups(
          Array.isArray(
            response?.data?.groups,
          )
            ? (response.data.groups as Group[])
            : [],
        )
      })
      .catch(() => {
        if (alive) {
          setGroups([])
        }
      })

    void api
      .communityAnnouncements(selected)
      .then((response) => {
        if (!alive) {
          return
        }

        setAnnouncements(
          Array.isArray(
            response?.data
              ?.announcements,
          )
            ? (response.data.announcements as Announcement[])
            : [],
        )
      })
      .catch(() => {
        if (alive) {
          setAnnouncements([])
        }
      })

    return () => {
      alive = false
    }
  }, [selected])

  /* =======================================================
     FILTER COMMUNITIES
     ======================================================= */

  const filteredCommunities =
    useMemo(() => {
      if (!communities) {
        return []
      }

      const term =
        search.trim().toLowerCase()

      if (!term) {
        return communities
      }

      return communities.filter(
        (community) =>
          community.name
            .toLowerCase()
            .includes(term) ||
          (
            community.description ||
            ''
          )
            .toLowerCase()
            .includes(term),
      )
    }, [
      communities,
      search,
    ])

  /* =======================================================
     CURRENT COMMUNITY
     ======================================================= */

  const current =
    communities?.find(
      (community) =>
        community.id === selected,
    )

  /* =======================================================
     ATTACHABLE GROUPS
     ======================================================= */

  const attachable =
    useMemo(() => {
      if (!groups) {
        return myGroups
      }

      const attachedIds =
        new Set(
          groups.map(
            (group) =>
              String(group.id),
          ),
        )

      return myGroups.filter(
        (group) =>
          !attachedIds.has(
            String(group.id),
          ),
      )
    }, [
      myGroups,
      groups,
    ])

  /* =======================================================
     SELECT COMMUNITY
     ======================================================= */

  function selectCommunity(
    communityId: string,
  ) {
    setSelected(communityId)
    setMobileListOpen(false)
  }

  /* =======================================================
     OPEN GROUP CHAT
     ======================================================= */

  function openGroupChat(
    roomId: string,
  ) {
    window.dispatchEvent(
      new CustomEvent(
        'fedchat:open-room',
        {
          detail: {
            roomId,
          },
        },
      ),
    )
  }

  /* =======================================================
     POST ANNOUNCEMENT
     ======================================================= */

  async function postAnnouncement() {
    if (
      !selected ||
      !annTitle.trim() ||
      !annContent.trim()
    ) {
      return
    }

    setPostingAnn(true)

    try {
      await api.postCommunityAnnouncement(
        selected,
        {
          title:
            annTitle.trim(),
          content:
            annContent.trim(),
        },
      )

      setAnnTitle('')
      setAnnContent('')

      const response =
        await api.communityAnnouncements(
          selected,
        )

      setAnnouncements(
        Array.isArray(
          response?.data
            ?.announcements,
        )
          ? (response.data.announcements as Announcement[])
          : [],
      )
    } catch {
      /*
       * Keep form values so the user
       * can retry.
       */
    } finally {
      setPostingAnn(false)
    }
  }

  /* =======================================================
     CREATE COMMUNITY
     ======================================================= */

  async function submit() {
    const trimmed =
      name.trim()

    if (!trimmed) {
      return
    }

    setCreating(true)
    setCreateError(null)

    try {
      await api.createCommunity({
        name: trimmed,
      })

      setName('')
      setShowCreate(false)

      await loadCommunities()
    } catch (reason: unknown) {
      const errorValue =
        reason as {
          message?: string
          code?: string
        }

      setCreateError({
        message:
          errorValue?.message ||
          'Failed to create community.',

        needsSubscription:
          errorValue?.code ===
          'GROUP_PERMISSION_REQUIRED',
      })
    } finally {
      setCreating(false)
    }
  }

  /* =======================================================
     ATTACH GROUP
     ======================================================= */

  async function attach(
    roomId: string,
  ) {
    if (!selected) {
      return
    }

    try {
      await api.attachGroupToCommunity(
        selected,
        roomId,
      )

      const response =
        await api.communityGroups(
          selected,
        )

      setGroups(
        Array.isArray(
          response?.data?.groups,
        )
          ? (response.data.groups as Group[])
          : [],
      )
    } catch {
      /*
       * Keep current list unchanged.
       */
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="communities-page">
      {/* =================================================
          HEADER
          ================================================= */}

      <header className="communities-header">
        <div className="communities-header-copy">
          <span className="communities-eyebrow">
            GROUPS &amp; COMMUNITIES
          </span>

          <h1>
            Communities
          </h1>

          <p>
            Bring related groups together
            with one announcement space.
          </p>
        </div>

        <div className="communities-header-actions">
          <button
            type="button"
            className="communities-header-icon"
            aria-label="Community notifications"
          >
            <Bell
              size={17}
              strokeWidth={1.9}
            />
          </button>

          <button
            type="button"
            className="communities-create-button"
            onClick={() =>
              setShowCreate(
                (currentValue) =>
                  !currentValue,
              )
            }
          >
            <Plus
              size={17}
              strokeWidth={2}
            />

            <span>
              New community
            </span>
          </button>
        </div>
      </header>

      {/* =================================================
          SEARCH
          ================================================= */}

      <div className="communities-toolbar">
        <button
          type="button"
          className="communities-mobile-list-button"
          onClick={() =>
            setMobileListOpen(
              true,
            )
          }
          aria-label="Show communities"
        >
          <Users
            size={16}
          />
        </button>

        <div className="communities-search">
          <Search
            size={18}
            strokeWidth={1.9}
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search communities"
            aria-label="Search communities"
          />

          {search && (
            <button
              type="button"
              className="communities-search-clear"
              onClick={() =>
                setSearch('')
              }
              aria-label="Clear search"
            >
              <X
                size={14}
              />
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          CREATE COMMUNITY
          ================================================= */}

      {showCreate && (
        <section className="communities-create-panel">
          <div className="communities-create-top">
            <div>
              <span>
                NEW COMMUNITY
              </span>

              <h3>
                Create a community
              </h3>

              <p>
                Organize related groups
                around one shared space.
              </p>
            </div>

            <button
              type="button"
              className="communities-close-button"
              onClick={() =>
                setShowCreate(false)
              }
              aria-label="Close create community"
            >
              <X
                size={17}
              />
            </button>
          </div>

          <div className="communities-create-form">
            <label>
              <span>
                Community name
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                placeholder="e.g. FedChat Community"
                maxLength={100}
                autoFocus
              />
            </label>

            <div className="communities-create-actions">
              <button
                type="button"
                className="communities-secondary-button"
                onClick={() => {
                  setName('')
                  setCreateError(null)
                }}
              >
                Clear
              </button>

              <button
                type="button"
                className="communities-primary-button"
                disabled={
                  creating ||
                  !name.trim()
                }
                onClick={() =>
                  void submit()
                }
              >
                {creating
                  ? 'Creating…'
                  : 'Create community'}
              </button>
            </div>
          </div>

          {createError && (
            <div className="communities-create-error">
              <div>
                <strong>
                  {createError.needsSubscription
                    ? 'Subscription required'
                    : 'Could not create community'}
                </strong>

                <span>
                  {
                    createError.message
                  }
                </span>
              </div>

              {createError.needsSubscription &&
                onNavigateToPlans && (
                  <button
                    type="button"
                    onClick={
                      onNavigateToPlans
                    }
                  >
                    View plans
                  </button>
                )}
            </div>
          )}
        </section>
      )}

      {/* =================================================
          GLOBAL ERROR
          ================================================= */}

      {error && (
        <div className="communities-alert">
          <div>
            <strong>
              Could not load communities
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadCommunities()
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          MAIN LAYOUT
          ================================================= */}

      {!error &&
        communities ===
          null && (
          <div className="communities-loading">
            <span className="communities-loader" />

            <div>
              <strong>
                Loading communities
              </strong>

              <span>
                Fetching your
                communities…
              </span>
            </div>
          </div>
        )}

      {!error &&
        communities !== null &&
        communities.length ===
          0 && (
          <div className="communities-empty">
            <div className="communities-empty-icon">
              <Users
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <strong>
              No communities yet
            </strong>

            <span>
              Create a community to
              organize related groups
              together.
            </span>

            <button
              type="button"
              className="communities-create-button"
              onClick={() =>
                setShowCreate(true)
              }
            >
              <Plus
                size={15}
              />

              <span>
                Create community
              </span>
            </button>
          </div>
        )}

      {!error &&
        communities !== null &&
        communities.length > 0 && (
          <div className="communities-layout">
            {/* ===========================================
                COMMUNITY LIST
                =========================================== */}

            <aside className="communities-sidebar">
              <div className="communities-sidebar-header">
                <div>
                  <span>
                    YOUR COMMUNITIES
                  </span>

                  <h2>
                    Communities
                  </h2>
                </div>

                <span className="communities-sidebar-count">
                  {
                    filteredCommunities.length
                  }
                </span>
              </div>

              <div className="communities-sidebar-list">
                {filteredCommunities.length ===
                0 ? (
                  <div className="communities-sidebar-empty">
                    No matching
                    communities.
                  </div>
                ) : (
                  filteredCommunities.map(
                    (community) => {
                      const active =
                        community.id ===
                        selected

                      return (
                        <button
                          type="button"
                          key={
                            community.id
                          }
                          className={`community-sidebar-row ${
                            active
                              ? 'active'
                              : ''
                          }`}
                          onClick={() =>
                            selectCommunity(
                              community.id,
                            )
                          }
                        >
                          <CommunityAvatar
                            community={
                              community
                            }
                          />

                          <div>
                            <strong>
                              {
                                community.name
                              }
                            </strong>

                            <span>
                              {
                                community.member_count
                              }{' '}
                              members
                            </span>
                          </div>

                          <ChevronRight
                            size={
                              15
                            }
                            strokeWidth={
                              1.8
                            }
                          />
                        </button>
                      )
                    },
                  )
                )}
              </div>
            </aside>

            {/* =========================================
                MAIN COMMUNITY
                ========================================= */}

            {current && (
              <main className="community-main">
                {/* =======================================
                    COMMUNITY HERO
                    ======================================= */}

                <section className="community-hero-card">
                  <div className="community-hero-banner">
                    <div className="community-banner-badge">
                      <Globe2
                        size={
                          12
                        }
                        strokeWidth={
                          1.9
                        }
                      />

                      Community
                    </div>
                  </div>

                  <div className="community-hero-body">
                    <div className="community-hero-avatar-wrap">
                      <CommunityAvatar
                        community={
                          current
                        }
                        large
                      />
                    </div>

                    <div className="community-hero-copy">
                      <div className="community-title-line">
                        <h3>
                          {
                            current.name
                          }
                        </h3>

                        <span className="community-status-badge">
                          Active
                        </span>
                      </div>

                      <p>
                        {current.description ||
                          'Bring related groups together with one shared community space.'}
                      </p>

                      <div className="community-hero-meta">
                        <span>
                          <Users
                            size={
                              13
                            }
                          />

                          {
                            groups?.length ??
                            0
                          }{' '}
                          groups
                        </span>

                        <span>
                          <Users
                            size={
                              13
                            }
                          />

                          {
                            current.member_count
                          }{' '}
                          members
                        </span>

                        <span>
                          <Globe2
                            size={
                              13
                            }
                          />

                          Community
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* =======================================
                    ANNOUNCEMENTS
                    ======================================= */}

                <section className="community-content-card">
                  <div className="community-content-header">
                    <div>
                      <span>
                        COMMUNITY UPDATES
                      </span>

                      <h2>
                        Announcements
                      </h2>
                    </div>

                    <div className="community-content-icon">
                      <Megaphone
                        size={
                          17
                        }
                        strokeWidth={
                          1.8
                        }
                      />
                    </div>
                  </div>

                  {announcements ===
                    null && (
                    <div className="community-inline-loading">
                      Loading
                      announcements…
                    </div>
                  )}

                  {announcements !==
                    null &&
                    announcements.length ===
                      0 && (
                      <div className="community-inline-empty">
                        <div className="community-inline-empty-icon">
                          <Megaphone
                            size={
                              18
                            }
                          />
                        </div>

                        <strong>
                          No announcements yet
                        </strong>

                        <span>
                          Community
                          updates will
                          appear here.
                        </span>
                      </div>
                    )}

                  {announcements &&
                    announcements.length >
                      0 && (
                      <div className="announcements-list">
                        {announcements.map(
                          (announcement) => (
                            <article
                              className="announcement-card"
                              key={
                                announcement.id
                              }
                            >
                              <div className="announcement-icon">
                                <Megaphone
                                  size={
                                    15
                                  }
                                />
                              </div>

                              <div className="announcement-copy">
                                <h3>
                                  {
                                    announcement.title
                                  }
                                </h3>

                                <p>
                                  {
                                    announcement.content
                                  }
                                </p>

                                <span>
                                  {`${announcement.first_name || ''} ${
                                    announcement.last_name || ''
                                  }`.trim() ||
                                    'Community admin'}

                                  {' · '}

                                  {formatAnnouncementDate(
                                    announcement.created_at,
                                  )}
                                </span>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    )}

                  {/* OWNER ANNOUNCEMENT FORM */}

                  {current.owner_id ===
                    getSession()?.user
                      .id && (
                    <div className="announcement-composer">
                      <div className="announcement-composer-title">
                        <div>
                          <strong>
                            Publish an announcement
                          </strong>

                          <span>
                            Visible to members
                            of this community.
                          </span>
                        </div>
                      </div>

                      <input
                        value={annTitle}
                        onChange={(
                          event,
                        ) =>
                          setAnnTitle(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Announcement title"
                        maxLength={160}
                      />

                      <textarea
                        value={
                          annContent
                        }
                        onChange={(
                          event,
                        ) =>
                          setAnnContent(
                            event.target
                              .value,
                          )
                        }
                        placeholder="What's the update?"
                        rows={4}
                        maxLength={2000}
                      />

                      <div className="announcement-composer-footer">
                        <span>
                          {annContent.length}
                          /2000
                        </span>

                        <button
                          type="button"
                          className="communities-primary-button"
                          disabled={
                            postingAnn ||
                            !annTitle.trim() ||
                            !annContent.trim()
                          }
                          onClick={() =>
                            void postAnnouncement()
                          }
                        >
                          {postingAnn
                            ? 'Posting…'
                            : 'Post announcement'}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* =======================================
                    GROUPS
                    ======================================= */}

                <section className="community-content-card">
                  <div className="community-content-header">
                    <div>
                      <span>
                        CONNECTED GROUPS
                      </span>

                      <h2>
                        Groups
                      </h2>
                    </div>

                    {groups !==
                      null && (
                      <span className="community-content-count">
                        {
                          groups.length
                        }
                      </span>
                    )}
                  </div>

                  {groups ===
                    null && (
                    <div className="community-inline-loading">
                      Loading groups…
                    </div>
                  )}

                  {groups !==
                    null &&
                    groups.length ===
                      0 && (
                    <div className="community-inline-empty">
                      <div className="community-inline-empty-icon">
                        <Users
                          size={
                            18
                          }
                        />
                      </div>

                      <strong>
                        No groups attached
                      </strong>

                      <span>
                        Attach one of your
                        groups below to
                        start organizing
                        conversations.
                      </span>
                    </div>
                  )}

                  {groups &&
                    groups.length >
                      0 && (
                      <div className="community-group-list">
                        {groups.map(
                          (group) => (
                            <div
                              className="community-group-row"
                              key={
                                group.id
                              }
                            >
                              <div className="community-group-avatar">
                                {initials(
                                  group.name,
                                )}
                              </div>

                              <div className="community-group-copy">
                                <strong>
                                  {
                                    group.name
                                  }
                                </strong>

                                <span>
                                  Group managed by
                                  admins
                                </span>
                              </div>

                              <button
                                type="button"
                                className="community-group-chat"
                                onClick={() =>
                                  openGroupChat(
                                    group.id,
                                  )
                                }
                              >
                                <span>
                                  Open chat
                                </span>

                                <ChevronRight
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </section>

                {/* =======================================
                    ATTACH GROUP
                    ======================================= */}

                {attachable.length >
                  0 && (
                  <section className="community-content-card">
                    <div className="community-content-header">
                      <div>
                        <span>
                          YOUR GROUPS
                        </span>

                        <h2>
                          Attach a group
                        </h2>
                      </div>
                    </div>

                    <div className="community-group-list">
                      {attachable.map(
                        (group) => (
                          <div
                            className="community-group-row attach-row"
                            key={
                              group.id
                            }
                          >
                            <div className="community-group-avatar">
                              {initials(
                                group.name,
                              )}
                            </div>

                            <div className="community-group-copy">
                              <strong>
                                {
                                  group.name
                                }
                              </strong>

                              <span>
                                Available from
                                your groups
                              </span>
                            </div>

                            <button
                              type="button"
                              className="community-attach-button"
                              onClick={() =>
                                void attach(
                                  group.id,
                                )
                              }
                            >
                              <Plus
                                size={
                                  13
                                }
                              />

                              <span>
                                Attach
                              </span>
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                )}
              </main>
            )}
          </div>
        )}

      {/* =================================================
          MOBILE COMMUNITY LIST
          ================================================= */}

      {mobileListOpen && (
        <div
          className="communities-mobile-overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setMobileListOpen(
                false,
              )
            }
          }}
        >
          <aside className="communities-mobile-panel">
            <div className="communities-mobile-panel-header">
              <div>
                <span className="rem">
                  YOUR COMMUNITIES
                </span>

                <h3>
                  Communities
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileListOpen(
                    false,
                  )
                }
                aria-label="Close communities"
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div className="communities-mobile-panel-list">
              {filteredCommunities.map(
                (community) => (
                  <button
                    type="button"
                    key={
                      community.id
                    }
                    className={`community-sidebar-row ${
                      community.id ===
                      selected
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      selectCommunity(
                        community.id,
                      )
                    }
                  >
                    <CommunityAvatar
                      community={
                        community
                      }
                    />

                    <div>
                      <strong>
                        {
                          community.name
                        }
                      </strong>

                      <span>
                        {
                          community.member_count
                        }{' '}
                        members
                      </span>
                    </div>

                    <ChevronRight
                      size={
                        15
                      }
                    />
                  </button>
                ),
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CommunitiesModule