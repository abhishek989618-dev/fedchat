import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../../lib'
import type { Socket } from 'socket.io-client'

import './notifications.css'

/* =========================================================
   TYPES
   ========================================================= */

type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

type NotificationFilter =
  | 'all'
  | 'unread'

/* =========================================================
   TIME
   ========================================================= */

function timeAgo(
  iso: string,
) {
  const timestamp =
    new Date(iso).getTime()

  if (
    Number.isNaN(timestamp)
  ) {
    return ''
  }

  const diff =
    Math.max(
      0,
      Date.now() - timestamp,
    )

  const seconds =
    Math.floor(
      diff / 1000,
    )

  if (seconds < 30) {
    return 'Just now'
  }

  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes =
    Math.floor(
      seconds / 60,
    )

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours =
    Math.floor(
      minutes / 60,
    )

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days =
    Math.floor(
      hours / 24,
    )

  if (days < 7) {
    return `${days}d ago`
  }

  const weeks =
    Math.floor(
      days / 7,
    )

  if (weeks < 5) {
    return `${weeks}w ago`
  }

  return new Date(
    iso,
  ).toLocaleDateString(
    [],
    {
      day: 'numeric',
      month: 'short',
      year:
        new Date(
          iso,
        ).getFullYear() !==
        new Date().getFullYear()
          ? 'numeric'
          : undefined,
    },
  )
}

/* =========================================================
   NOTIFICATION TYPE
   ========================================================= */

function normalizeType(
  type: string,
) {
  return String(
    type || '',
  ).toLowerCase()
}

function NotificationTypeIcon({
  type,
}: {
  type: string
}) {
  const normalized =
    normalizeType(type)

  if (
    normalized.includes(
      'message',
    ) ||
    normalized.includes(
      'chat',
    )
  ) {
    return (
      <MessageCircle
        size={18}
        strokeWidth={1.9}
      />
    )
  }

  if (
    normalized.includes(
      'group',
    ) ||
    normalized.includes(
      'community',
    ) ||
    normalized.includes(
      'member',
    ) ||
    normalized.includes(
      'contact',
    )
  ) {
    return (
      <Users
        size={18}
        strokeWidth={1.9}
      />
    )
  }

  if (
    normalized.includes(
      'request',
    ) ||
    normalized.includes(
      'invite',
    ) ||
    normalized.includes(
      'friend',
    )
  ) {
    return (
      <UserPlus
        size={18}
        strokeWidth={1.9}
      />
    )
  }

  if (
    normalized.includes(
      'security',
    ) ||
    normalized.includes(
      'warning',
    ) ||
    normalized.includes(
      'alert',
    )
  ) {
    return (
      <ShieldAlert
        size={18}
        strokeWidth={1.9}
      />
    )
  }

  if (
    normalized.includes(
      'error',
    ) ||
    normalized.includes(
      'failed',
    )
  ) {
    return (
      <AlertCircle
        size={18}
        strokeWidth={1.9}
      />
    )
  }

  return (
    <Bell
      size={18}
      strokeWidth={1.9}
    />
  )
}

/* =========================================================
   MAIN MODULE
   ========================================================= */

export function NotificationsModule({
  socket,
}: {
  socket?: Socket | null
}) {
  const [
    items,
    setItems,
  ] = useState<
    NotificationItem[] | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    filter,
    setFilter,
  ] =
    useState<NotificationFilter>(
      'all',
    )

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    deleting,
    setDeleting,
  ] = useState<
    Record<string, boolean>
  >({})

  const [
    marking,
    setMarking,
  ] = useState<
    Record<string, boolean>
  >({})

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false)

  const [
    actionError,
    setActionError,
  ] = useState<
    string | null
  >(null)

  /* =======================================================
     LOAD
     ======================================================= */

  async function load(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true)
    }

    setError(null)

    try {
      const response =
        await api.notificationsList()

      const list =
        Array.isArray(
          response?.data,
        )
          ? response.data
          : []

      setItems(
        list as NotificationItem[],
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load notifications.',
      )
    } finally {
      if (showRefresh) {
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    void load()
  }, [])

  /* =======================================================
     REALTIME SOCKET
     ======================================================= */

  useEffect(() => {
    if (!socket) {
      return
    }

    const onNew = (
      notification: NotificationItem,
    ) => {
      setItems((previous) => {
        const current =
          previous || []

        const alreadyExists =
          current.some(
            (item) =>
              item.id ===
              notification.id,
          )

        if (
          alreadyExists
        ) {
          return current
        }

        return [
          notification,
          ...current,
        ]
      })
    }

    socket.on(
      'notification:new',
      onNew,
    )

    return () => {
      socket.off(
        'notification:new',
        onNew,
      )
    }
  }, [socket])

  /* =======================================================
     MARK ONE
     ======================================================= */

  async function markOne(
    id: string,
  ) {
    setActionError(null)

    setMarking(
      (current) => ({
        ...current,
        [id]: true,
      }),
    )

    try {
      await api.markNotificationRead(
        id,
      )

      setItems(
        (previous) =>
          previous?.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item,
          ) || null,
      )
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : 'Unable to mark notification as read.',
      )
    } finally {
      setMarking(
        (current) => ({
          ...current,
          [id]: false,
        }),
      )
    }
  }

  /* =======================================================
     MARK ALL
     ======================================================= */

  async function markAll() {
    const hasUnread =
      (items || []).some(
        (item) =>
          !item.isRead,
      )

    if (
      !hasUnread ||
      markingAll
    ) {
      return
    }

    setActionError(null)
    setMarkingAll(true)

    try {
      await api.markAllNotificationsRead()

      setItems(
        (previous) =>
          previous?.map(
            (item) => ({
              ...item,
              isRead: true,
            }),
          ) || null,
      )
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : 'Unable to mark all notifications as read.',
      )
    } finally {
      setMarkingAll(false)
    }
  }

  /* =======================================================
     DELETE
     ======================================================= */

  async function remove(
    id: string,
  ) {
    setActionError(null)

    setDeleting(
      (current) => ({
        ...current,
        [id]: true,
      }),
    )

    try {
      await api.deleteNotification(
        id,
      )

      setItems(
        (previous) =>
          previous?.filter(
            (item) =>
              item.id !== id,
          ) || null,
      )
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : 'Unable to delete notification.',
      )
    } finally {
      setDeleting(
        (current) => ({
          ...current,
          [id]: false,
        }),
      )
    }
  }

  /* =======================================================
     COUNTS
     ======================================================= */

  const unread =
    useMemo(
      () =>
        items?.filter(
          (item) =>
            !item.isRead,
        ).length ?? 0,
      [items],
    )

  const total =
    items?.length ?? 0

  /* =======================================================
     FILTERED LIST
     ======================================================= */

  const filteredItems =
    useMemo(() => {
      if (!items) {
        return []
      }

      const normalizedSearch =
        search.trim().toLowerCase()

      return items.filter(
        (item) => {
          if (
            filter ===
              'unread' &&
            item.isRead
          ) {
            return false
          }

          if (
            !normalizedSearch
          ) {
            return true
          }

          const searchable =
            [
              item.title,
              item.message,
              item.type,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()

          return searchable.includes(
            normalizedSearch,
          )
        },
      )
    }, [
      items,
      filter,
      search,
    ])

  /* =======================================================
     CLEAR SEARCH
     ======================================================= */

  function clearSearch() {
    setSearch('')
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="notifications-page">
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <header className="notifications-header">
        <div className="notifications-header-copy">
          <span className="notifications-eyebrow">
            ACTIVITY
          </span>

          <h1>
            Notifications
          </h1>

          <p>
            Stay up to date with your
            chats and account activity.
            {unread > 0 &&
              ` ${unread} unread.`}
          </p>
        </div>

        <div className="notifications-header-actions">
          <button
            type="button"
            className="notifications-icon-button"
            onClick={() =>
              void load(true)
            }
            disabled={
              refreshing
            }
            aria-label="Refresh notifications"
            title="Refresh"
          >
            <RefreshCw
              size={17}
              strokeWidth={1.9}
              className={
                refreshing
                  ? 'is-spinning'
                  : ''
              }
            />
          </button>

          <button
            type="button"
            className="notifications-mark-all"
            onClick={() =>
              void markAll()
            }
            disabled={
              unread === 0 ||
              markingAll
            }
          >
            {markingAll ? (
              'Updating…'
            ) : (
              <>
                <CheckCheck
                  size={16}
                  strokeWidth={
                    1.9
                  }
                />

                <span>
                  Mark all read
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="notifications-alert">
          <div>
            <strong>
              Could not load notifications
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void load(true)
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          ACTION ERROR
          ================================================= */}

      {actionError && (
        <div className="notifications-action-alert">
          <span>
            {actionError}
          </span>

          <button
            type="button"
            onClick={() =>
              setActionError(null)
            }
            aria-label="Dismiss"
          >
            <X
              size={14}
            />
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* =============================================
              SEARCH
              ============================================= */}

          <div className="notifications-toolbar">
            <div className="notifications-search">
              <Search
                size={18}
                strokeWidth={1.9}
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search notifications"
                aria-label="Search notifications"
              />

              {search && (
                <button
                  type="button"
                  className="notifications-search-clear"
                  onClick={
                    clearSearch
                  }
                  aria-label="Clear notification search"
                >
                  <X
                    size={14}
                  />
                </button>
              )}
            </div>
          </div>

          {/* =============================================
              FILTER TABS
              ============================================= */}

          <div className="notifications-filter-bar">
            <div className="notifications-filters">
              <button
                type="button"
                className={
                  filter ===
                  'all'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFilter(
                    'all',
                  )
                }
              >
                All

                {total >
                  0 && (
                  <span>
                    {total >
                    99
                      ? '99+'
                      : total}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={
                  filter ===
                  'unread'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFilter(
                    'unread',
                  )
                }
              >
                Unread

                {unread >
                  0 && (
                  <span>
                    {unread >
                    99
                      ? '99+'
                      : unread}
                  </span>
                )}
              </button>
            </div>

            <div className="notifications-filter-summary">
              <span>
                {filter ===
                'unread'
                  ? `${unread} unread`
                  : `${total} notification${
                      total ===
                      1
                        ? ''
                        : 's'
                    }`}
              </span>
            </div>
          </div>

          {/* =============================================
              LOADING
              ============================================= */}

          {items ===
            null && (
            <div className="notifications-loading">
              <div className="notifications-loading-icon">
                <span />
              </div>

              <div>
                <strong>
                  Loading notifications
                </strong>

                <span>
                  Checking your latest
                  activity…
                </span>
              </div>
            </div>
          )}

          {/* =============================================
              EMPTY
              ============================================= */}

          {items !== null &&
            filteredItems.length ===
              0 && (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  <Bell
                    size={23}
                    strokeWidth={
                      1.7
                    }
                  />
                </div>

                <strong>
                  {search.trim()
                    ? 'No matching notifications'
                    : filter ===
                        'unread'
                      ? 'You are all caught up'
                      : 'No notifications yet'}
                </strong>

                <span>
                  {search.trim()
                    ? 'Try a different search term.'
                    : filter ===
                        'unread'
                      ? 'There are no unread notifications right now.'
                      : 'New messages, requests and account activity will appear here.'}
                </span>

                {search.trim() && (
                  <button
                    type="button"
                    className="notifications-empty-button"
                    onClick={
                      clearSearch
                    }
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

          {/* =============================================
              LIST
              ============================================= */}

          {items !== null &&
            filteredItems.length >
              0 && (
              <section className="notifications-list-card">
                <div className="notifications-list-header">
                  <div>
                    <span>
                      RECENT ACTIVITY
                    </span>

                    <h2>
                      Your notifications
                    </h2>
                  </div>

                  {unread >
                    0 && (
                    <div className="notifications-unread-badge">
                      <span />
                      {unread}{' '}
                      unread
                    </div>
                  )}
                </div>

                <div className="notifications-list">
                  {filteredItems.map(
                    (notification) => {
                      const busyDelete =
                        Boolean(
                          deleting[
                            notification.id
                          ],
                        )

                      const busyMark =
                        Boolean(
                          marking[
                            notification.id
                          ],
                        )

                      return (
                        <article
                          key={
                            notification.id
                          }
                          className={`notification-item ${
                            notification.isRead
                              ? 'is-read'
                              : 'is-unread'
                          } ${
                            busyDelete
                              ? 'is-deleting'
                              : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="notification-main"
                            onClick={() => {
                              if (
                                !notification.isRead &&
                                !busyMark
                              ) {
                                void markOne(
                                  notification.id,
                                )
                              }
                            }}
                            aria-label={
                              notification.isRead
                                ? notification.title
                                : `Mark ${notification.title} as read`
                            }
                          >
                            <div
                              className={`notification-type-icon type-${normalizeType(
                                notification.type,
                              )}`}
                            >
                              <NotificationTypeIcon
                                type={
                                  notification.type
                                }
                              />
                            </div>

                            <div className="notification-content">
                              <div className="notification-title-row">
                                <strong>
                                  {
                                    notification.title
                                  }
                                </strong>

                                {!notification.isRead && (
                                  <span className="notification-unread-dot" />
                                )}
                              </div>

                              <p>
                                {
                                  notification.message
                                }
                              </p>

                              <div className="notification-meta">
                                <Clock3
                                  size={
                                    11
                                  }
                                  strokeWidth={
                                    1.8
                                  }
                                />

                                <time
                                  dateTime={
                                    notification.createdAt
                                  }
                                >
                                  {timeAgo(
                                    notification.createdAt,
                                  )}
                                </time>

                                {notification.type && (
                                  <>
                                    <span className="notification-meta-separator">
                                      ·
                                    </span>

                                    <span>
                                      {
                                        notification.type
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <ChevronRight
                              size={
                                16
                              }
                              strokeWidth={
                                1.7
                              }
                              className="notification-chevron"
                            />
                          </button>

                          <div className="notification-actions">
                            {!notification.isRead && (
                              <button
                                type="button"
                                className="notification-action-button mark"
                                onClick={() =>
                                  void markOne(
                                    notification.id,
                                  )
                                }
                                disabled={
                                  busyMark ||
                                  busyDelete
                                }
                                aria-label="Mark as read"
                                title="Mark as read"
                              >
                                {busyMark ? (
                                  <RefreshCw
                                    size={
                                      14
                                    }
                                    className="is-spinning"
                                  />
                                ) : (
                                  <Check
                                    size={
                                      15
                                    }
                                  />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              className="notification-action-button delete"
                              onClick={() =>
                                void remove(
                                  notification.id,
                                )
                              }
                              disabled={
                                busyDelete ||
                                busyMark
                              }
                              aria-label="Delete notification"
                              title="Delete"
                            >
                              {busyDelete ? (
                                <RefreshCw
                                  size={
                                    14
                                  }
                                  className="is-spinning"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              )}
                            </button>
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              </section>
            )}
        </>
      )}

      {/* ================================================
          BOTTOM INFORMATION
          ================================================ */}

      {items !== null &&
        items.length >
          0 && (
          <footer className="notifications-footer">
            <div className="notifications-footer-icon">
              <Settings2
                size={14}
              />
            </div>

            <span>
              Notifications update in real
              time while you're connected.
            </span>
          </footer>
        )}
    </section>
  )
}

export default NotificationsModule