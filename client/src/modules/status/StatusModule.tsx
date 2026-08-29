import {
  Bell,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  api,
  assetUrl,
  getSession,
} from '../../lib'

import type {
  StatusItem,
  Viewer,
} from '../../lib'

import './status.css'

function initials(
  first?: string,
  last?: string,
) {
  return (
    `${first?.trim()?.[0] || ''}${
      last?.trim()?.[0] || ''
    }`.toUpperCase() || '?'
  )
}

function timeAgo(
  iso?: string | null,
) {
  if (!iso) {
    return ''
  }

  const timestamp =
    new Date(iso).getTime()

  if (
    Number.isNaN(timestamp)
  ) {
    return ''
  }

  const diff = Math.max(
    0,
    Date.now() - timestamp,
  )

  const mins = Math.floor(
    diff / 60000,
  )

  if (mins < 1) {
    return 'Just now'
  }

  if (mins < 60) {
    return `${mins}m ago`
  }

  const hrs = Math.floor(
    mins / 60,
  )

  if (hrs < 24) {
    return `${hrs}h ago`
  }

  const days = Math.floor(
    hrs / 24,
  )

  return `${days}d ago`
}

function formatTime(
  iso?: string | null,
) {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}


function normalizeStatusMedia(
  value?: string | null,
) {
  if (!value) {
    return ''
  }

  return assetUrl(value)
}

function AuthenticatedStatusMedia({
  src,
  type,
  full = false,
}: {
  src: string
  type?: string | null
  full?: boolean
}) {
  const [blobUrl, setBlobUrl] =
    useState('')

  const [failed, setFailed] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let active = true
    let objectUrl = ''

    const token =
      getSession()?.accessToken

    setBlobUrl('')
    setFailed(false)
    setLoading(true)

    if (!src) {
      setLoading(false)
      return () => undefined
    }

    fetch(src, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
      .then(
        async (
          response,
        ) => {
          if (!response.ok) {
            throw new Error(
              'Unable to load status media',
            )
          }

          const blob =
            await response.blob()

          objectUrl =
            URL.createObjectURL(
              blob,
            )

          if (active) {
            setBlobUrl(
              objectUrl,
            )
            setLoading(false)
          }
        },
      )
      .catch(() => {
        if (active) {
          setFailed(true)
          setLoading(false)
        }
      })

    return () => {
      active = false

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl,
        )
      }
    }
  }, [src])

  const className =
    full
      ? 'status-view-media'
      : 'status-thumb-media'

  if (loading) {
    return (
      <div
        className={`${className} status-media-loading`}
      >
        <span className="status-media-spinner" />
      </div>
    )
  }

  if (failed) {
    return (
      <div
        className={`${className} status-media-failed`}
      >
        Media unavailable
      </div>
    )
  }

  if (!blobUrl) {
    return null
  }

  if (
    type?.startsWith(
      'video/',
    )
  ) {
    return (
      <video
        className={className}
        src={blobUrl}
        controls={full}
        playsInline
        preload="metadata"
      />
    )
  }

  return (
    <img
      className={className}
      src={blobUrl}
      alt="Status"
      loading="lazy"
    />
  )
}

type StatusModuleProps = {
  onBack?: () => void
}

export function StatusModule({
  onBack,
}: StatusModuleProps) {
  const me =
    getSession()?.user

  const [
    statuses,
    setStatuses,
  ] = useState<
    StatusItem[] | null
  >(null)
const [openStatusId, setOpenStatusId] =
  useState<string | null>(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    showCreate,
    setShowCreate,
  ] = useState(false)

  const [
    text,
    setText,
  ] = useState('')

  const [
    file,
    setFile,
  ] = useState<File | null>(
    null,
  )

  const [
    preview,
    setPreview,
  ] = useState('')

  const [
    creating,
    setCreating,
  ] = useState(false)

  const [, setOpenStoryUserId] = useState<string | null>(null)

const [
  openStoryIndex,
  setOpenStoryIndex,
] = useState(0)

const [
  storyQueue,
  setStoryQueue,
] = useState<StatusItem[]>([])

  const [
    viewers,
    setViewers,
  ] = useState<
    Viewer[] | null
  >(null)

  const [
    showViewers,
    setShowViewers,
  ] = useState(false)

  const [
    deleting,
    setDeleting,
  ] = useState(false)

  const fileRef =
    useRef<HTMLInputElement>(
      null,
    )

  /*
   * -------------------------------------------------------
   * LOAD STATUS
   * -------------------------------------------------------
   */

  async function load() {
    setError(null)

    try {
      const response =
        await api.statuses()

      setStatuses(
        response.data
          .statuses || [],
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Failed to load status updates.',
      )
    }
  }

  useEffect(() => {
    void load()

    const timer =
      window.setInterval(
        () => {
          void load()
        },
        30000,
      )

    return () =>
      window.clearInterval(
        timer,
      )
  }, [])

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview,
        )
      }
    }
  }, [preview])

  /*
   * -------------------------------------------------------
   * STATUS GROUPS
   * -------------------------------------------------------
   */

  type StatusUserGroup = {
  userId: string
  firstName: string
  lastName: string
  username?: string
  avatar?: string | null
  statuses: StatusItem[]
  latestCreatedAt?: string | null
  unread: boolean
}

function groupStatusesByUser(
  items: StatusItem[],
): StatusUserGroup[] {
  const groups = new Map<
    string,
    StatusUserGroup
  >()

  for (const status of items) {
    const userId =
      String(status.user_id)

    if (!userId) {
      continue
    }

    const existing =
      groups.get(userId)

    const unread =
      Number(
        status.view_count || 0,
      ) === 0

    if (!existing) {
      groups.set(userId, {
        userId,

        firstName:
          status.first_name || '',

        lastName:
          status.last_name || '',

        username:
          status.username || '',

        avatar:
          status.avatar || null,

        statuses: [status],

        latestCreatedAt:
          status.created_at,

        unread,
      })

      continue
    }

    existing.statuses.push(
      status,
    )

    if (unread) {
      existing.unread = true
    }

    if (
      status.created_at &&
      existing.latestCreatedAt &&
      new Date(
        status.created_at,
      ).getTime() >
        new Date(
          existing.latestCreatedAt,
        ).getTime()
    ) {
      existing.latestCreatedAt =
        status.created_at
    }
  }

  const result =
    Array.from(
      groups.values(),
    )

  /*
   * Oldest status first inside each
   * user's story sequence.
   */
  for (const group of result) {
    group.statuses.sort(
      (a, b) =>
        new Date(
          a.created_at || 0,
        ).getTime() -
        new Date(
          b.created_at || 0,
        ).getTime(),
    )
  }

  /*
   * Users with unread statuses first,
   * then newest story first.
   */
  result.sort(
    (a, b) => {
      if (
        a.unread !==
        b.unread
      ) {
        return a.unread
          ? -1
          : 1
      }

      return (
        new Date(
          b.latestCreatedAt ||
            0,
        ).getTime() -
        new Date(
          a.latestCreatedAt ||
            0,
        ).getTime()
      )
    },
  )

  return result
}

const myStatuses =
  useMemo(
    () =>
      (statuses || [])
        .filter(
          (status) =>
            String(
              status.user_id,
            ) ===
            String(me?.id),
        )
        .sort(
          (a, b) =>
            new Date(
              a.created_at || 0,
            ).getTime() -
            new Date(
              b.created_at || 0,
            ).getTime(),
        ),
    [statuses, me?.id],
  )

const otherStatuses =
  useMemo(
    () =>
      (statuses || []).filter(
        (status) =>
          String(
            status.user_id,
          ) !==
          String(me?.id),
      ),
    [statuses, me?.id],
  )

const groupedOtherStatuses =
  useMemo(
    () =>
      groupStatusesByUser(
        otherStatuses,
      ),
    [otherStatuses, me?.id],
  )

const recentStatusGroups =
  useMemo(
    () =>
      groupedOtherStatuses.filter(
        (group) =>
          group.unread,
      ),
    [groupedOtherStatuses],
  )

const viewedStatusGroups =
  useMemo(
    () =>
      groupedOtherStatuses.filter(
        (group) =>
          !group.unread,
      ),
    [groupedOtherStatuses],
  )
  const openStatus =
    useMemo(
      () =>
        statuses?.find(
          (status) =>
            status.id ===
            openStatusId,
        ) || null,
      [
        statuses,
        openStatusId,
      ],
    )

  /*
   * -------------------------------------------------------
   * FILE
   * -------------------------------------------------------
   */

  function chooseFile(
    next?: File,
  ) {
    if (!next) {
      return
    }

    const supported =
      /^(image\/(png|jpe?g|webp|gif)|video\/(mp4|webm|quicktime))$/.test(
        next.type,
      )

    if (!supported) {
      setError(
        'Status supports JPG, PNG, WEBP, GIF, MP4, WEBM or MOV files.',
      )
      return
    }

    if (
      next.size >
      25 * 1024 * 1024
    ) {
      setError(
        'Status media must be 25 MB or smaller.',
      )
      return
    }

    if (preview) {
      URL.revokeObjectURL(
        preview,
      )
    }

    setError(null)

    setFile(next)

    setPreview(
      URL.createObjectURL(
        next,
      ),
    )
  }

  function clearSelectedFile() {
    if (preview) {
      URL.revokeObjectURL(
        preview,
      )
    }

    setFile(null)
    setPreview('')
  }

  /*
   * -------------------------------------------------------
   * CREATE STATUS
   * -------------------------------------------------------
   */

  async function submit() {
    if (
      !text.trim() &&
      !file
    ) {
      return
    }

    setCreating(true)
    setError(null)

    try {
      let uploadedMediaUrl:
        | string
        | undefined

      let mediaType:
        | string
        | undefined

      if (file) {
        const response =
          await api.uploadMedia(
            file,
          )

        uploadedMediaUrl =
          `/api/v1/media/${response.data.media.id}`

        mediaType =
          response.data.media.mimeType
      }

      await api.createStatus({
        content:
          text.trim(),

        mediaUrl:
          uploadedMediaUrl,

        mediaType,

        expiresHours: 24,
      })

      setText('')
      clearSelectedFile()
      setShowCreate(false)

      await load()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to publish status.',
      )
    } finally {
      setCreating(false)
    }
  }

  /*
   * -------------------------------------------------------
   * OPEN STATUS
   * -------------------------------------------------------
   */

  // async function open(
  //   status: StatusItem,
  // ) {
  //   setOpenStatusId(
  //     status.id,
  //   )

  //   setViewers(null)
  //   setShowViewers(false)

  //   if (
  //     status.user_id ===
  //     me?.id
  //   ) {
  //     try {
  //       const response =
  //         await api.statusViews(
  //           status.id,
  //         )

  //       setViewers(
  //         response.data
  //           .views || [],
  //       )
  //     } catch {
  //       setViewers([])
  //     }

  //     return
  //   }

  //   await api
  //     .viewStatus(
  //       status.id,
  //     )
  //     .catch(
  //       () => undefined,
  //     )
  // }
  async function openStory(
  userId: string,
  storyStatuses: StatusItem[],
  startIndex = 0,
) {
  if (
    !storyStatuses.length
  ) {
    return
  }

  const safeIndex = Math.max(
    0,
    Math.min(
      startIndex,
      storyStatuses.length - 1,
    ),
  )

  const status =
    storyStatuses[safeIndex]

  setOpenStoryUserId(userId)
  setStoryQueue(storyStatuses)
  setOpenStoryIndex(safeIndex)
  setOpenStatusId(status.id)

  setViewers(null)
  setShowViewers(false)

  /*
   * Mark this individual status as
   * viewed when it belongs to another user.
   */
  if (
    String(status.user_id) !==
    String(me?.id)
  ) {
    await api
      .viewStatus(status.id)
      .catch(
        () => undefined,
      )

    /*
     * Refresh so the unread ring/list
     * state updates.
     */
    void load()
  } else {
    try {
      const response =
        await api.statusViews(
          status.id,
        )

      setViewers(
        response.data.views ||
          [],
      )
    } catch {
      setViewers([])
    }
  }
}

async function nextStory() {
  if (
    !storyQueue.length
  ) {
    return
  }

  const nextIndex =
    openStoryIndex + 1

  if (
    nextIndex >=
    storyQueue.length
  ) {
    closeViewer()
    return
  }

  const next =
    storyQueue[nextIndex]

  setOpenStoryIndex(
    nextIndex,
  )

  setOpenStatusId(
    next.id,
  )

  setViewers(null)
  setShowViewers(false)

  if (
    String(next.user_id) !==
    String(me?.id)
  ) {
    await api
      .viewStatus(next.id)
      .catch(
        () => undefined,
      )
  } else {
    try {
      const response =
        await api.statusViews(
          next.id,
        )

      setViewers(
        response.data.views ||
          [],
      )
    } catch {
      setViewers([])
    }
  }
}

async function previousStory() {
  if (
    !storyQueue.length
  ) {
    return
  }

  const previousIndex =
    openStoryIndex - 1

  if (
    previousIndex < 0
  ) {
    return
  }

  const previous =
    storyQueue[
      previousIndex
    ]

  setOpenStoryIndex(
    previousIndex,
  )

  setOpenStatusId(
    previous.id,
  )

  setViewers(null)
  setShowViewers(false)

  if (
    String(
      previous.user_id,
    ) !==
    String(me?.id)
  ) {
    await api
      .viewStatus(
        previous.id,
      )
      .catch(
        () => undefined,
      )
  }
}



  /*
   * -------------------------------------------------------
   * DELETE
   * -------------------------------------------------------
   */

  async function removeStatus(
    status: StatusItem,
  ) {
    if (
      !window.confirm(
        'Delete this status update?',
      )
    ) {
      return
    }

    setDeleting(true)

    try {
      await api.deleteStatus(
        status.id,
      )

      setOpenStatusId(null)

      await load()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to delete status.',
      )
    } finally {
      setDeleting(false)
    }
  }

  /*
   * -------------------------------------------------------
   * HELPERS
   * -------------------------------------------------------
   */

  function avatarUrl(
    value?: string | null,
  ) {
    if (!value) {
      return ''
    }

    try {
      return assetUrl(value)
    } catch {
      return value
    }
  }

  function renderStatusMedia(
    status: StatusItem,
    full = false,
  ) {
    const src =
      normalizeStatusMedia(
        status.media_url,
      )

    if (!src) {
      return null
    }

    return (
      <AuthenticatedStatusMedia
        src={src}
        type={
          status.media_type
        }
        full={full}
      />
    )
  }

  function closeViewer() {
  setOpenStatusId(null)
  setOpenStoryUserId(null)
  setOpenStoryIndex(0)
  setStoryQueue([])
  setShowViewers(false)
  setViewers(null)
}

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <section className="status-page">
      {/* ================================================
          PAGE HEADER
          ================================================ */}

      <header className="status-page-header">
        <div className="status-page-title-wrap">
          <button
  type="button"
  className="status-back-button"
  aria-label="Back to chats"
  onClick={() => onBack?.()}
>
  ‹
</button>

          <div>
            <span className="status-eyebrow">
              UPDATES
            </span>

            <h1>Status</h1>

            <p>
              Share moments with your
              contacts.
            </p>
          </div>
        </div>

        <div className="status-header-actions">
          <button
            type="button"
            className="status-header-icon"
            aria-label="Search status"
          >
            <Search
              size={17}
              strokeWidth={1.9}
            />
          </button>

          <button
            type="button"
            className="status-header-icon"
            aria-label="Status notifications"
          >
            <Bell
              size={17}
              strokeWidth={1.9}
            />
          </button>

          <button
            type="button"
            className="status-add-button"
            onClick={() =>
              setShowCreate(
                true,
              )
            }
          >
            <Plus
              size={17}
              strokeWidth={2}
            />

            <span>
              Add status
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div className="status-alert">
          <div>
            <strong>
              Status
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              void load()
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ================================================
          CREATE STATUS
          ================================================ */}

      {showCreate && (
        <div
          className="status-create-card"
          role="dialog"
          aria-modal="true"
          aria-label="Create status"
        >
          <div className="status-create-header">
            <div>
              <span>
                NEW UPDATE
              </span>

              <h2>
                Create status
              </h2>

              <p>
                Your update will disappear
                after 24 hours.
              </p>
            </div>

            <button
              type="button"
              className="status-close-button"
              aria-label="Close"
              onClick={() =>
                setShowCreate(
                  false,
                )
              }
            >
              <X
                size={17}
              />
            </button>
          </div>

          <textarea
            value={text}
            maxLength={700}
            onChange={(event) =>
              setText(
                event.target.value,
              )
            }
            placeholder="Share an update with your contacts…"
            rows={5}
          />

          <div className="status-create-actions">
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={(event) =>
                chooseFile(
                  event.target
                    .files?.[0],
                )
              }
            />

            <button
              type="button"
              className="status-secondary-button"
              onClick={() =>
                fileRef.current?.click()
              }
            >
              <Upload
                size={15}
              />

              <span>
                Photo / video
              </span>
            </button>

            <span className="status-character-count">
              {text.length}/700
            </span>

            <button
              type="button"
              className="status-primary-button"
              disabled={
                creating ||
                (!text.trim() &&
                  !file)
              }
              onClick={() =>
                void submit()
              }
            >
              {creating
                ? 'Posting…'
                : 'Post status'}
            </button>
          </div>

          {file && (
            <div className="status-upload">
              <div className="status-upload-preview">
                {preview &&
                  (file.type.startsWith(
                    'video/',
                  ) ? (
                    <video
                      src={preview}
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                    />
                  ))}
              </div>

              <div className="status-upload-info">
                <strong>
                  {file.name}
                </strong>

                <span>
                  {Math.round(
                    file.size / 1024,
                  )}{' '}
                  KB
                </span>
              </div>

              <button
                type="button"
                className="status-close-button"
                onClick={
                  clearSelectedFile
                }
                aria-label="Remove media"
              >
                <X
                  size={15}
                />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================
          LOADING
          ================================================ */}

      {!error &&
        statuses ===
          null && (
          <div className="status-loading-card">
            <span className="status-loader" />

            <div>
              <strong>
                Loading status
              </strong>

              <span>
                Checking recent updates…
              </span>
            </div>
          </div>
        )}

      {/* ================================================
          CONTENT
          ================================================ */}

      {statuses !== null && (
        <div className="status-content">
          {/* MY STATUS */}

          <section className="status-section">
            <div className="status-section-header">
              <div>
                <span>
                  YOUR STATUS
                </span>

                <h2>
                  My Status
                </h2>
              </div>
            </div>

            <button
              type="button"
              className="status-my-row"
              onClick={() => {
                if (myStatuses.length) {
  void openStory(
    String(me?.id),
    myStatuses,
    0,
  )
} else {
  setShowCreate(true)
}
              }}
            >
              <div className="status-avatar-wrap own">
                <div className="status-avatar large">
                  {me?.avatar ? (
                    <img
                      src={avatarUrl(
                        me.avatar,
                      )}
                      alt=""
                    />
                  ) : (
                    initials(
                      me?.firstName,
                      me?.lastName,
                    )
                  )}
                </div>

                <span className="status-add-badge">
                  <Plus
                    size={13}
                    strokeWidth={2.5}
                  />
                </span>
              </div>

              <div className="status-row-copy">
                <strong>
                  My Status
                </strong>

                <span>
                  {myStatuses.length
                    ? `${myStatuses.length} update${
                        myStatuses.length >
                        1
                          ? 's'
                          : ''
                      }`
                    : 'Tap to add status update'}
                </span>
              </div>

              <ChevronRight
                size={17}
                strokeWidth={1.8}
                className="status-row-chevron"
              />
            </button>
          </section>

          {/* RECENT UPDATES */}

          <section className="status-section">
            <div className="status-section-header">
              <div>
                <span>
                  RECENT UPDATES
                </span>

                <h2>
                  Recent Updates
                </h2>
              </div>

              {recentStatusGroups.length >
                0 && (
                <span className="status-section-count">
                  {
                    recentStatusGroups.length
                  }
                </span>
              )}
            </div>

            {recentStatusGroups.length ===
            0 ? (
              <div className="status-empty">
                <div className="status-empty-icon">
                  <Clock3
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>

                <strong>
                  No new updates
                </strong>

                <span>
                  New status updates
                  from your contacts
                  will appear here.
                </span>
              </div>
            ) : (
              <div className="status-list viewed">
  {viewedStatusGroups.map(
    (group) => {
      const avatar =
        avatarUrl(
          group.avatar,
        )

      return (
        <button
          type="button"
          key={group.userId}
          className="status-row viewed story-user-row"
          onClick={() =>
            void openStory(
              group.userId,
              group.statuses,
              0,
            )
          }
        >
          <div className="status-avatar-wrap">
            <div className="status-avatar">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                />
              ) : (
                initials(
                  group.firstName,
                  group.lastName,
                )
              )}
            </div>
          </div>

          <div className="status-row-copy">
            <strong>
              {group.firstName}{' '}
              {group.lastName}
            </strong>

            <span>
              {group.statuses.length}{' '}
              update
              {group.statuses.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>

          <time>
            {formatTime(
              group.latestCreatedAt,
            )}
          </time>

          <ChevronRight
            size={15}
            strokeWidth={1.8}
            className="status-row-chevron"
          />
        </button>
      )
    },
  )}
</div>
            )}
          </section>

          {/* VIEWED UPDATES */}

          <section className="status-section">
            <div className="status-section-header">
              <div>
                <span>
                  VIEWED
                </span>

                <h2>
                  Viewed Updates
                </h2>
              </div>

              {viewedStatusGroups.length >
                0 && (
                <span className="status-section-count muted">
                  {
                    viewedStatusGroups.length
                  }
                </span>
              )}
            </div>

            {viewedStatusGroups.length ===
            0 ? (
              <div className="status-empty compact">
                <div className="status-empty-icon">
                  <Clock3
                    size={17}
                    strokeWidth={1.8}
                  />
                </div>

                <strong>
                  No viewed updates
                </strong>

                <span>
                  Statuses you've already
                  opened will appear here.
                </span>
              </div>
            ) : (
              <div className="status-list viewed">
                {viewedStatusGroups.map((group) => {
                  const avatar = avatarUrl(group.avatar)
                  const latest = group.statuses[group.statuses.length - 1]

                  return (
                    <button
                      type="button"
                      key={group.userId}
                      className="status-row viewed"
                      onClick={() =>
                        void openStory(
                          group.userId,
                          group.statuses,
                          0,
                        )
                      }
                    >
                      <div className="status-avatar-wrap">
                        <div className="status-avatar">
                          {avatar ? (
                            <img src={avatar} alt="" />
                          ) : (
                            initials(
                              group.firstName,
                              group.lastName,
                            )
                          )}
                        </div>
                      </div>

                      <div className="status-row-copy">
                        <strong>
                          {`${group.firstName} ${group.lastName}`.trim() || group.username || 'User'}
                        </strong>

                        <span>
                          {latest?.content || 'Status update'}
                        </span>
                      </div>

                      <time>
                        {formatTime(
                          group.latestCreatedAt,
                        )}
                      </time>

                      <ChevronRight
                        size={15}
                        strokeWidth={1.8}
                        className="status-row-chevron"
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================================================
          VIEWER
          ================================================ */}

      {openStatus && (
        <div
          className="status-viewer-backdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewer()
            }
          }}
        >
          <section
            className="status-viewer"
            role="dialog"
            aria-modal="true"
          >
            <header className="status-viewer-header">
              <div className="status-viewer-user">
                <div className="status-avatar small">
                  {openStatus.avatar ? (
                    <img
                      src={avatarUrl(
                        openStatus.avatar,
                      )}
                      alt=""
                    />
                  ) : (
                    initials(
                      openStatus.first_name,
                      openStatus.last_name,
                    )
                  )}
                </div>

                <div>
                  <strong>
                    {openStatus.user_id ===
                    me?.id
                      ? 'Your status'
                      : `${openStatus.first_name} ${openStatus.last_name}`}
                  </strong>

                  <span>
                    {timeAgo(
                      openStatus.created_at,
                    )}
                  </span>
                </div>
              </div>

              <div className="status-viewer-actions">
                {openStatus.user_id ===
                  me?.id && (
                  <>
                    <button
                      type="button"
                      disabled={
                        deleting
                      }
                      onClick={() =>
                        void removeStatus(
                          openStatus,
                        )
                      }
                      aria-label="Delete status"
                      title="Delete status"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={
                    closeViewer
                  }
                  aria-label="Close status"
                  title="Close"
                >
                  <X
                    size={17}
                  />
                </button>
              </div>
            </header>

            <div className="status-viewer-body">
              <div className="status-story-progress">
  {storyQueue.map(
    (story, index) => (
      <span
        key={story.id}
        className={
          index <=
          openStoryIndex
            ? 'active'
            : ''
        }
      />
    ),
  )}
</div>
<button
  type="button"
  className="status-story-nav previous"
  onClick={() =>
    void previousStory()
  }
  disabled={
    openStoryIndex <= 0
  }
  aria-label="Previous status"
>
  ‹
</button>

<button
  type="button"
  className="status-story-nav next"
  onClick={() =>
    void nextStory()
  }
  disabled={
    openStoryIndex >=
    storyQueue.length - 1
  }
  aria-label="Next status"
>
  ›
</button>
              {renderStatusMedia(
                openStatus,
                true,
              )}

              {openStatus.content && (
                <div className="status-viewer-text">
                  {
                    openStatus.content
                  }
                </div>
              )}
            </div>

            {openStatus.user_id ===
              me?.id && (
              <footer className="status-viewer-footer">
                <button
                  type="button"
                  className="status-viewers-button"
                  onClick={() =>
                    setShowViewers(
                      (current) =>
                        !current,
                    )
                  }
                >
                  <Users
                    size={15}
                  />

                  <span>
                    Viewed by{' '}
                    {
                      openStatus.view_count
                    }
                  </span>

                  <ChevronRight
                    size={15}
                    className={
                      showViewers
                        ? 'rotated'
                        : ''
                    }
                  />
                </button>

                {showViewers && (
                  <div className="status-viewers-panel">
                    {viewers ===
                    null ? (
                      <span className="status-viewers-empty">
                        Loading viewers…
                      </span>
                    ) : viewers.length ===
                      0 ? (
                      <span className="status-viewers-empty">
                        No views yet.
                      </span>
                    ) : (
                      viewers.map(
                        (
                          viewer,
                        ) => (
                          <div
                            className="status-viewer-row"
                            key={
                              viewer.viewer_id
                            }
                          >
                            <div className="status-avatar small">
                              {initials(
                                viewer.first_name,
                                viewer.last_name,
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  viewer.first_name
                                }{' '}
                                {
                                  viewer.last_name
                                }
                              </strong>

                              <span>
                                @
                                {
                                  viewer.username
                                }
                              </span>
                            </div>

                            <time>
                              {timeAgo(
                                viewer.viewed_at,
                              )}
                            </time>
                          </div>
                        ),
                      )
                    )}
                  </div>
                )}
              </footer>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default StatusModule