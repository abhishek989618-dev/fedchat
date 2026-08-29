import {
  ChevronRight,
  Globe,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Icon } from '../../components/ui/Icon'
import { ImageCropper } from '../../components/ui/ImageCropper'
import { api, assetUrl } from '../../lib'

import './groups.css'

/* =========================================================
   TYPES
   ========================================================= */

type Group = {
  id: string
  name: string
  description?: string | null
  avatar?: string | null
  bannerUrl?: string | null
  isPrivate?: boolean
  _count?: {
    members: number
  }
}

type GroupMember = {
  userId: string
  user?: {
    id?: string
    username?: string
    firstName?: string
    lastName?: string
    avatar?: string | null
  }
}

type Contact = {
  user_id?: string
  contact_id?: string
  username?: string
  first_name?: string
  last_name?: string
  avatar?: string | null
}

type GroupTab =
  | 'all'
  | 'mine'
  | 'joined'

/* =========================================================
   HELPERS
   ========================================================= */

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GR'
  )
}

function safeAssetUrl(
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

/* =========================================================
   GROUP IMAGE
   ========================================================= */

function GroupImage({
  group,
  large = false,
}: {
  group: Group
  large?: boolean
}) {
  const src = safeAssetUrl(
    group.avatar,
  )

  return (
    <div
      className={
        large
          ? 'group-avatar large group-avatar-media'
          : 'group-avatar group-avatar-media'
      }
    >
      {src ? (
        <img
          src={src}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display =
              'none'
          }}
        />
      ) : (
        initials(group.name)
      )}
    </div>
  )
}

/* =========================================================
   GROUP DETAIL / MANAGEMENT
   ========================================================= */

function GroupDetail({
  group: initialGroup,
  onClose,
}: {
  group: Group
  onClose: () => void
}) {
  const [group, setGroup] =
    useState<Group>(
      initialGroup,
    )

  const [name, setName] =
    useState(
      initialGroup.name,
    )

  const [description, setDescription] =
    useState(
      initialGroup.description ||
        '',
    )

  const [inviteLink, setInviteLink] =
    useState<string | null>(
      null,
    )

  const [inviteError, setInviteError] =
    useState<string | null>(
      null,
    )

  const [importResult, setImportResult] =
    useState<{
      count: number
    } | null>(null)

  const [importError, setImportError] =
    useState<string | null>(
      null,
    )

  const [busy, setBusy] =
    useState(false)

  const [members, setMembers] =
    useState<GroupMember[]>(
      [],
    )

  const [contacts, setContacts] =
    useState<Contact[]>(
      [],
    )

  const [adding, setAdding] =
    useState<string | null>(
      null,
    )

  const [memberMessage, setMemberMessage] =
    useState('')

  const [saved, setSaved] =
    useState(false)

  const [cropFile, setCropFile] =
    useState<{
      kind:
        | 'avatar'
        | 'banner'
      file: File
    } | null>(null)

  const avatarInput =
    useRef<HTMLInputElement>(
      null,
    )

  const bannerInput =
    useRef<HTMLInputElement>(
      null,
    )

  const fileRef =
    useRef<HTMLInputElement>(
      null,
    )

  /* =======================================================
     LOAD MEMBERS / CONTACTS
     ======================================================= */

  useEffect(() => {
    let alive = true

    void api
      .groupMembers(group.id)
      .then((response) => {
        if (!alive) return

        setMembers(
          Array.isArray(
            response?.data?.members,
          )
            ? (response.data.members as GroupMember[])
            : [],
        )
      })
      .catch(() => {
        if (alive) {
          setMembers([])
        }
      })

    void api
      .contacts()
      .then((response) => {
        if (!alive) return

        setContacts(
          Array.isArray(
            response?.data
              ?.contacts,
          )
            ? (response.data.contacts as Contact[])
            : [],
        )
      })
      .catch(() => {
        if (alive) {
          setContacts([])
        }
      })

    return () => {
      alive = false
    }
  }, [group.id])

  /* =======================================================
     ADD MEMBER
     ======================================================= */

  async function addMember(
    userId: string,
  ) {
    setAdding(userId)
    setMemberMessage('')

    try {
      await api.addGroupMember(
        group.id,
        userId,
      )

      const response =
        await api.groupMembers(
          group.id,
        )

      setMembers(
        Array.isArray(
          response?.data?.members,
        )
          ? (response.data.members as GroupMember[])
          : [],
      )

      setMemberMessage(
        'Member added successfully.',
      )
    } catch (error) {
      setMemberMessage(
        error instanceof Error
          ? error.message
          : 'Only active paid FULL users can be added.',
      )
    } finally {
      setAdding(null)
    }
  }

  /* =======================================================
     SAVE GROUP DETAILS
     ======================================================= */

  async function saveDetails() {
    setBusy(true)
    setSaved(false)
    setMemberMessage('')

    try {
      const response =
        await api.updateGroup(
          group.id,
          {
            name:
              name.trim(),
            description:
              description.trim(),
          },
        )

      const updatedGroup =
        response?.data?.group

      if (updatedGroup) {
        setGroup(
          (current) => ({
            ...current,
            ...(updatedGroup as Partial<Group>),
          }),
        )
      } else {
        setGroup(
          (current) => ({
            ...current,
            name:
              name.trim(),
            description:
              description.trim(),
          }),
        )
      }

      setSaved(true)
    } catch (error) {
      setMemberMessage(
        error instanceof Error
          ? error.message
          : 'Could not save group details.',
      )
    } finally {
      setBusy(false)
    }
  }

  /* =======================================================
     UPLOAD GROUP MEDIA
     ======================================================= */

  async function uploadGroupMedia(
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
      setMemberMessage(
        'Please choose an image.',
      )
      return
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMemberMessage(
        'Image must be 10MB or smaller.',
      )
      return
    }

    setBusy(true)
    setMemberMessage('')

    try {
      const response =
        await api.uploadGroupMedia(
          group.id,
          kind,
          file,
        )

      const updatedGroup =
        response?.data?.group

      if (updatedGroup) {
        setGroup(
          (current) => ({
            ...current,
            ...(updatedGroup as Partial<Group>),
          }),
        )
      }
    } catch (error) {
      setMemberMessage(
        error instanceof Error
          ? error.message
          : 'Could not upload group image.',
      )
    } finally {
      setBusy(false)
    }
  }

  function chooseMedia(
    kind:
      | 'avatar'
      | 'banner',
    file?: File,
  ) {
    if (!file) {
      return
    }

    setCropFile({
      kind,
      file,
    })
  }

  /* =======================================================
     INVITE
     ======================================================= */

  async function createInvite() {
    setBusy(true)
    setInviteError(null)

    try {
      const response =
        await api.createGroupInvite(
          group.id,
        )

      const joinPath =
        response?.data?.joinPath

      if (!joinPath) {
        throw new Error(
          'The server did not return an invite path.',
        )
      }

      setInviteLink(
        `${window.location.origin}${joinPath}`,
      )
    } catch (error) {
      setInviteError(
        error instanceof Error
          ? error.message
          : 'Failed to create invite link.',
      )
    } finally {
      setBusy(false)
    }
  }

  /* =======================================================
     IMPORT MEMBERS
     ======================================================= */

  async function onFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setBusy(true)
    setImportError(null)
    setImportResult(null)

    try {
      const response =
        await api.importGroupMembers(
          group.id,
          file,
        )

      setImportResult({
        count:
          Number(
            response?.data
              ?.count ?? 0,
          ),
      })

      const membersResponse =
        await api.groupMembers(
          group.id,
        )

      setMembers(
        Array.isArray(
          membersResponse?.data
            ?.members,
        )
          ? (membersResponse.data.members as GroupMember[])
          : [],
      )
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : 'Import failed.',
      )
    } finally {
      setBusy(false)

      if (fileRef.current) {
        fileRef.current.value =
          ''
      }
    }
  }

  const banner = safeAssetUrl(
    group.bannerUrl,
  )

  const copyInvite = async () => {
    if (!inviteLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        inviteLink,
      )

      setMemberMessage(
        'Invite link copied.',
      )
    } catch {
      setMemberMessage(
        'Could not copy invite link.',
      )
    }
  }

  /* =======================================================
     RENDER DETAIL
     ======================================================= */

  return (
    <div className="group-manage-shell">
      {/* ===================================================
          MANAGEMENT HEADER
          =================================================== */}

      <div className="group-manage-top">
        <div>
          <span className="eyebrow">
            GROUP MANAGEMENT
          </span>

          <h3>
            {group.name}
          </h3>

          <p>
            Customize the group,
            invite members and
            manage access.
          </p>
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close group management"
        >
          <Icon name="arrow" />
        </button>
      </div>

      {/* ===================================================
          HERO
          =================================================== */}

      <section className="group-hero-card">
        <div
          className="group-banner"
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
            <div className="group-banner-empty">
              Add a group banner
            </div>
          )}

          <button
            type="button"
            className="banner-edit"
            disabled={busy}
            onClick={() =>
              bannerInput.current?.click()
            }
          >
            <Icon name="edit" />
            <span>
              Change banner
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

        <div className="group-hero-body">
          <button
            type="button"
            className="group-icon-button"
            onClick={() =>
              avatarInput.current?.click()
            }
            aria-label="Change group icon"
            disabled={busy}
          >
            <GroupImage
              group={group}
              large
            />

            <span className="profile-avatar-camera">
              <Icon name="edit" />
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

          <div>
            <strong>
              {group.name}
            </strong>

            <span>
              {members.length}{' '}
              members ·{' '}
              {group.isPrivate
                ? 'Private'
                : 'Public invite'}
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================
          GROUP DETAILS
          =================================================== */}

      <section className="profile-form-card">
        <div className="profile-section-title">
          <div>
            <strong>
              Group details
            </strong>

            <span>
              Update the name and
              description shown in chat.
            </span>
          </div>
        </div>

        <div className="profile-form-grid">
          <label>
            <span>
              Group name
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              maxLength={100}
            />
          </label>

          <label className="full">
            <span>
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value.slice(
                    0,
                    500,
                  ),
                )
              }
              rows={4}
              maxLength={500}
            />
          </label>
        </div>

        <div className="profile-form-actions">
          <button
            type="button"
            className="primary"
            onClick={() =>
              void saveDetails()
            }
            disabled={busy}
          >
            {busy
              ? 'Saving…'
              : 'Save group details'}
          </button>
        </div>

        {saved && (
          <div className="profile-save-note">
            ✓ Group details saved
          </div>
        )}
      </section>

      {/* ===================================================
          MEMBERS
          =================================================== */}

      <section className="card">
        <div className="table-head">
          <strong>
            Members
          </strong>

          <span>
            {members.length}{' '}
            member
            {members.length ===
            1
              ? ''
              : 's'}
            . Only active paid FULL
            users can be added.
          </span>
        </div>

        {members.length > 0 && (
          <div
            className="contact-grid"
            style={{
              marginTop: 8,
            }}
          >
            {members.map(
              (member) => {
                const memberName =
                  `${member.user?.firstName || ''} ${
                    member.user?.lastName || ''
                  }`.trim() ||
                  member.user?.username ||
                  'Member'

                const avatar =
                  safeAssetUrl(
                    member.user
                      ?.avatar,
                  )

                return (
                  <div
                    className="contact-card"
                    key={
                      String(
                        member.userId,
                      )
                    }
                  >
                    <div className="avatar">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                        />
                      ) : (
                        initials(
                          memberName,
                        )
                      )}
                    </div>

                    <div>
                      <strong>
                        {memberName}
                      </strong>

                      <small>
                        @
                        {
                          member.user
                            ?.username
                        }
                      </small>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}

        {contacts.length > 0 && (
          <div
            className="group-add-members"
            style={{
              marginTop: 16,
            }}
          >
            <strong>
              Add from contacts
            </strong>

            <div
              style={{
                marginTop: 8,
              }}
            >
              {contacts.map(
                (contact) => {
                  const userId =
                    String(
                      contact.user_id ||
                        contact.contact_id ||
                        '',
                    )

                  if (!userId) {
                    return null
                  }

                  const alreadyMember =
                    members.some(
                      (
                        member,
                      ) =>
                        String(
                          member.userId,
                        ) ===
                        userId,
                    )

                  if (
                    alreadyMember
                  ) {
                    return null
                  }

                  const fullName =
                    `${contact.first_name || ''} ${
                      contact.last_name || ''
                    }`.trim() ||
                    contact.username ||
                    'Contact'

                  const avatar =
                    safeAssetUrl(
                      contact.avatar,
                    )

                  const isAdding =
                    adding ===
                    userId

                  return (
                    <div
                      className="group-line"
                      key={userId}
                    >
                      <div className="avatar">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt=""
                          />
                        ) : (
                          initials(
                            fullName,
                          )
                        )}
                      </div>

                      <div>
                        <strong>
                          {fullName}
                        </strong>

                        <small>
                          @
                          {
                            contact.username
                          }
                        </small>
                      </div>

                      <button
                        type="button"
                        className="primary"
                        disabled={
                          isAdding ||
                          busy
                        }
                        onClick={() =>
                          void addMember(
                            userId,
                          )
                        }
                      >
                        {isAdding
                          ? 'Adding…'
                          : 'Add'}
                      </button>
                    </div>
                  )
                },
              )}
            </div>
          </div>
        )}

        {memberMessage && (
          <div
            className="notice"
            style={{
              marginTop: 12,
            }}
          >
            <strong>
              Group update
            </strong>

            <span>
              {memberMessage}
            </span>
          </div>
        )}
      </section>

      {/* ===================================================
          PUBLIC INVITE
          =================================================== */}

      <section className="card">
        <div className="table-head">
          <strong>
            Public guest link
          </strong>
        </div>

        <p className="muted">
          Guests can join through
          the public link as
          read-only users.
        </p>

        <button
          type="button"
          className="primary"
          onClick={() =>
            void createInvite()
          }
          disabled={busy}
        >
          {busy
            ? 'Working…'
            : 'Generate invite link'}
        </button>

        {inviteError && (
          <div
            className="notice"
            style={{
              marginTop: 10,
            }}
          >
            <strong>
              Could not create invite
            </strong>

            <span>
              {inviteError}
            </span>
          </div>
        )}

        {inviteLink && (
          <div className="invite-box">
            <code>
              {inviteLink}
            </code>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                void copyInvite()
              }
            >
              Copy
            </button>
          </div>
        )}
      </section>

      {/* ===================================================
          BULK IMPORT
          =================================================== */}

      <section className="card">
        <div className="table-head">
          <strong>
            Bulk member import
          </strong>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) =>
            void onFile(event)
          }
          disabled={busy}
        />

        {importResult && (
          <p>
            Imported{' '}
            {importResult.count}{' '}
            member
            {importResult.count ===
            1
              ? ''
              : 's'}.
          </p>
        )}

        {importError && (
          <div className="notice">
            <strong>
              Import failed
            </strong>

            <span>
              {importError}
            </span>
          </div>
        )}
      </section>

      {/* ===================================================
          IMAGE CROPPER
          =================================================== */}

      {cropFile && (
        <ImageCropper
          file={cropFile.file}
          aspect={
            cropFile.kind ===
            'avatar'
              ? 1
              : 16 / 6
          }
          title={
            cropFile.kind ===
            'avatar'
              ? 'Crop group icon'
              : 'Crop group banner'
          }
          onCancel={() =>
            setCropFile(null)
          }
          onConfirm={(croppedFile) => {
            const kind =
              cropFile.kind

            setCropFile(null)

            void uploadGroupMedia(
              kind,
              croppedFile,
            )
          }}
        />
      )}
    </div>
  )
}

/* =========================================================
   GROUPS MODULE
   ========================================================= */

export function GroupsModule({
  initialGroupId = '',
  onNavigateToPlans,
  onOpenChat,
}: {
  initialGroupId?: string
  onNavigateToPlans?: () => void
  onOpenChat?: (
    roomId: string,
  ) => void
}) {
  const [groups, setGroups] =
    useState<Group[] | null>(
      null,
    )

  const [openGroup, setOpenGroup] =
    useState<Group | null>(
      null,
    )

  const [error, setError] =
    useState('')

  const [query, setQuery] =
    useState('')

  const [activeTab, setActiveTab] =
    useState<GroupTab>(
      'all',
    )

  const [name, setName] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [isPrivate, setIsPrivate] =
    useState(false)

  const [creating, setCreating] =
    useState(false)

  /* =======================================================
     LOAD GROUPS
     ======================================================= */

  async function load() {
    setError('')

    try {
      const response =
        await api.groups()

      const rawGroups =
        Array.isArray(
          response?.data?.groups,
        )
          ? response.data.groups
          : []

      setGroups(
        rawGroups as Group[],
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to load groups.',
      )
    }
  }

  useEffect(() => {
    void load()
  }, [])

  /* =======================================================
     OPEN GROUP FROM INITIAL ID
     ======================================================= */

  useEffect(() => {
    if (
      !initialGroupId ||
      !groups
    ) {
      return
    }

    const target =
      groups.find(
        (group) =>
          String(group.id) ===
          String(initialGroupId),
      )

    if (target) {
      setOpenGroup(target)
    }
  }, [
    groups,
    initialGroupId,
  ])

  /* =======================================================
     FILTER GROUPS
     ======================================================= */

  const filteredGroups =
    useMemo(() => {
      if (!groups) {
        return []
      }

      const normalizedQuery =
        query
          .trim()
          .toLowerCase()

      let result =
        [...groups]

      /*
       * At the moment your Group response does not
       * expose a reliable owner/member role, so these
       * tabs use the same server collection.
       *
       * When the backend exposes a `role` field we can
       * make these exact OWNER/ADMIN/MEMBER filters.
       */
      if (
        activeTab === 'mine'
      ) {
        result = [...groups]
      }

      if (
        activeTab === 'joined'
      ) {
        result = [...groups]
      }

      if (
        normalizedQuery
      ) {
        result =
          result.filter(
            (group) =>
              group.name
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ) ||
              (
                group.description ||
                ''
              )
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ),
          )
      }

      return result
    }, [
      groups,
      query,
      activeTab,
    ])

  /* =======================================================
     CREATE GROUP
     ======================================================= */

  async function create() {
    const trimmedName =
      name.trim()

    if (!trimmedName) {
      return
    }

    setCreating(true)
    setError('')

    try {
      await api.createGroup({
        name: trimmedName,

        description:
          description.trim(),

        isPrivate,
      })

      setName('')
      setDescription('')
      setIsPrivate(false)

      await load()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to create group.',
      )
    } finally {
      setCreating(false)
    }
  }

  /* =======================================================
     OPEN CHAT
     ======================================================= */

  function openChat(
    groupId: string,
  ) {
    if (onOpenChat) {
      onOpenChat(groupId)
      return
    }

    window.dispatchEvent(
      new CustomEvent(
        'fedchat:open-room',
        {
          detail: {
            roomId: groupId,
          },
        },
      ),
    )
  }

  /* =======================================================
     CLEAR CREATE FORM
     ======================================================= */

  function clearCreateForm() {
    setName('')
    setDescription('')
    setIsPrivate(false)
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="groups-page">
      {/* =================================================
          HEADER
          ================================================= */}

      <header className="groups-header">
        <div>
          <span className="groups-eyebrow">
            WORKSPACE
          </span>

          <h1>
            Groups
          </h1>

          <p>
            Build focused
            conversations,
            customize group
            identity and manage
            members.
          </p>
        </div>

        <button
          type="button"
          className="groups-create-button"
          onClick={() => {
            document
              .querySelector(
                '.groups-create-panel',
              )
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
          }}
        >
          <Plus
            size={17}
            strokeWidth={2}
          />

          <span>
            Create group
          </span>
        </button>
      </header>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="groups-alert">
          <div>
            <strong>
              Groups
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

      {/* =================================================
          SEARCH
          ================================================= */}

      <div className="groups-toolbar">
        <div className="groups-search">
          <Search
            size={18}
            strokeWidth={1.9}
          />

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Search groups"
            aria-label="Search groups"
          />
        </div>
      </div>

      {/* =================================================
          TABS
          ================================================= */}

      <div className="groups-tabs">
        <button
          type="button"
          className={
            activeTab ===
            'all'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('all')
          }
        >
          All groups
        </button>

        <button
          type="button"
          className={
            activeTab ===
            'mine'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('mine')
          }
        >
          My groups
        </button>

        <button
          type="button"
          className={
            activeTab ===
            'joined'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'joined',
            )
          }
        >
          Joined
        </button>

        {onNavigateToPlans && (
          <button
            type="button"
            onClick={
              onNavigateToPlans
            }
          >
            Plans
          </button>
        )}
      </div>

      {/* =================================================
          CREATE GROUP
          ================================================= */}

      <section className="groups-create-panel">
        <div className="groups-create-top">
          <div>
            <span>
              NEW GROUP
            </span>

            <h3>
              Create a group
            </h3>

            <p>
              Start a focused
              conversation for
              your team or
              community.
            </p>
          </div>

          <div className="group-avatar">
            <Plus
              size={18}
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="groups-create-form">
          <label className="groups-field">
            <span>
              Group name
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="e.g. FedChat Developers"
              maxLength={100}
            />
          </label>

          <label className="groups-field">
            <span>
              Visibility
            </span>

            <select
              value={
                isPrivate
                  ? 'private'
                  : 'public'
              }
              onChange={(event) =>
                setIsPrivate(
                  event.target
                    .value ===
                    'private',
                )
              }
            >
              <option value="public">
                Public
              </option>

              <option value="private">
                Private
              </option>
            </select>
          </label>

          <label className="groups-field full">
            <span>
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="What is this group about?"
              rows={3}
              maxLength={500}
            />
          </label>
        </div>

        <div className="groups-create-footer">
          <button
            type="button"
            className="groups-cancel-button"
            onClick={
              clearCreateForm
            }
          >
            Clear
          </button>

          <button
            type="button"
            className="groups-submit-button"
            disabled={
              creating ||
              !name.trim()
            }
            onClick={() =>
              void create()
            }
          >
            {creating
              ? 'Creating…'
              : 'Create group'}
          </button>
        </div>
      </section>

      {/* =================================================
          GROUP LIST
          ================================================= */}

      <section className="groups-section">
        <div className="groups-section-header">
          <div>
            <span>
              YOUR GROUPS
            </span>

            <h2>
              Groups
            </h2>
          </div>

          {groups && (
            <span className="groups-count">
              {
                filteredGroups.length
              }
            </span>
          )}
        </div>

        {/* LOADING */}

        {!error &&
          groups ===
            null && (
          <div className="groups-loading">
            <span className="groups-loading-spinner" />

            <div>
              <strong>
                Loading groups
              </strong>

              <span>
                Fetching your
                conversations…
              </span>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!error &&
          groups !==
            null &&
          filteredGroups.length ===
            0 && (
          <div className="groups-empty">
            <div className="groups-empty-icon">
              <Users
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <strong>
              {query.trim()
                ? 'No matching groups'
                : 'No groups yet'}
            </strong>

            <span>
              {query.trim()
                ? 'Try a different group name or description.'
                : 'Create your first group above to start chatting with multiple people.'}
            </span>

            {!query.trim() && (
              <button
                type="button"
                className="groups-create-button"
                onClick={() => {
                  document
                    .querySelector(
                      '.groups-create-panel',
                    )
                    ?.scrollIntoView({
                      behavior:
                        'smooth',
                      block:
                        'center',
                    })
                }}
              >
                <Plus
                  size={15}
                />

                <span>
                  Create group
                </span>
              </button>
            )}
          </div>
        )}

        {/* GROUPS */}

        {groups !==
          null &&
          filteredGroups.length >
            0 && (
            <div className="groups-list">
              {filteredGroups.map(
                (group) => {
                  const avatar =
                    safeAssetUrl(
                      group.avatar,
                    )

                  const memberCount =
                    group._count
                      ?.members ??
                    0

                  return (
                    <div
                      key={
                        group.id
                      }
                      className="group-row"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setOpenGroup(
                          group,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key ===
                            ' '
                        ) {
                          event.preventDefault()

                          setOpenGroup(
                            group,
                          )
                        }
                      }}
                    >
                      {/* GROUP AVATAR */}

                      <div className="group-avatar-wrap">
                        <div className="group-avatar">
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

                        <span className="group-active-dot" />
                      </div>

                      {/* CONTENT */}

                      <div className="group-copy">
                        <div className="group-name-line">
                          <strong className="group-name">
                            {
                              group.name
                            }
                          </strong>

                          <span className="group-privacy">
                            {group.isPrivate ? (
                              <>
                                <Lock
                                  size={
                                    8
                                  }
                                />

                                Private
                              </>
                            ) : (
                              <>
                                <Globe
                                  size={
                                    8
                                  }
                                />

                                Public
                              </>
                            )}
                          </span>
                        </div>

                        <span className="group-description">
                          {group.description ||
                            'Group conversation'}
                        </span>

                        <div className="group-meta">
                          <span className="group-meta-item">
                            <Users
                              size={
                                11
                              }
                            />

                            {
                              memberCount
                            }{' '}
                            members
                          </span>

                          <span className="group-meta-item">
                            {group.isPrivate
                              ? 'Private group'
                              : 'Public invite'}
                          </span>
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="group-row-right">
                        <button
                          type="button"
                          className="group-quick-chat"
                          onClick={(
                            event,
                          ) => {
                            event.stopPropagation()

                            openChat(
                              group.id,
                            )
                          }}
                          aria-label={`Open ${group.name} chat`}
                          title="Open chat"
                        >
                          <MessageSquare
                            size={
                              14
                            }
                            strokeWidth={
                              1.9
                            }
                          />
                        </button>

                        <ChevronRight
                          size={16}
                          className="group-chevron"
                          strokeWidth={
                            1.8
                          }
                        />
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          )}
      </section>

      {/* =================================================
          GROUP DETAIL
          ================================================= */}

      {openGroup && (
        <div
          className="groups-detail-overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpenGroup(
                null,
              )
            }
          }}
        >
          <div className="groups-detail-container">
            <GroupDetail
              group={openGroup}
              onClose={() =>
                setOpenGroup(
                  null,
                )
              }
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default GroupsModule