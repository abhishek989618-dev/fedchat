import {
  Check,
  MessageSquare,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, assetUrl } from '../../lib'
import './contacts.css'

type Contact = {
  contact_id: string
  user_id?: string
  username: string
  first_name: string
  last_name: string
  avatar?: string | null
  favorite?: boolean
}

type ContactRequest = {
  id: string
  sender_id: string
  username: string
  first_name: string
  last_name: string
  avatar?: string | null
}

type SearchResult = {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar?: string | null
}

type ContactTab =
  | 'all'
  | 'requests'
  | 'favorites'

function initials(
  first?: string,
  last?: string,
  username?: string,
) {
  const firstInitial =
    first?.trim()?.charAt(0) || ''

  const lastInitial =
    last?.trim()?.charAt(0) || ''

  if (
    firstInitial &&
    lastInitial
  ) {
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  if (firstInitial) {
    return firstInitial.toUpperCase()
  }

  if (username) {
    return username
      .slice(0, 2)
      .toUpperCase()
  }

  return 'FC'
}

function normalizeAvatar(
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

export function ContactsModule() {
  const [contacts, setContacts] =
    useState<Contact[] | null>(null)

  const [requests, setRequests] =
    useState<ContactRequest[]>([])

  const [error, setError] =
    useState<string | null>(null)

  const [query, setQuery] =
    useState('')

  const [results, setResults] =
    useState<SearchResult[]>([])

  const [sentTo, setSentTo] =
    useState<Record<string, boolean>>(
      {},
    )

  const [activeTab, setActiveTab] =
    useState<ContactTab>('all')

  const [loadingSearch, setLoadingSearch] =
    useState(false)

  const [sendingRequest, setSendingRequest] =
    useState<Record<string, boolean>>(
      {},
    )

  const [
    acceptingRequest,
    setAcceptingRequest,
  ] = useState<
    Record<string, boolean>
  >({})

  const [searchFocused, setSearchFocused] =
    useState(false)

  function load() {
    setError(null)

    void api
      .contacts()
      .then((response) => {
        setContacts(
          response.data.contacts || [],
        )
      })
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Failed to load contacts.',
        )
      })

    void api
      .contactRequests()
      .then((response) => {
        setRequests(
          response.data.requests || [],
        )
      })
      .catch(() => {
        setRequests([])
      })
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const trimmed =
      query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setLoadingSearch(false)
      return
    }

    let alive = true

    const timer =
      window.setTimeout(() => {
        setLoadingSearch(true)

        void api
          .searchUsers(trimmed)
          .then((response) => {
            if (!alive) {
              return
            }

            setResults(
              Array.isArray(
                response.data.users,
              )
                ? response.data.users
                : [],
            )
          })
          .catch(() => {
            if (alive) {
              setResults([])
            }
          })
          .finally(() => {
            if (alive) {
              setLoadingSearch(false)
            }
          })
      }, 300)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [query])

  async function sendRequest(
    userId: string,
  ) {
    try {
      setSendingRequest(
        (current) => ({
          ...current,
          [userId]: true,
        }),
      )

      await api.sendContactRequest(
        userId,
      )

      setSentTo(
        (current) => ({
          ...current,
          [userId]: true,
        }),
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to send contact request.',
      )
    } finally {
      setSendingRequest(
        (current) => ({
          ...current,
          [userId]: false,
        }),
      )
    }
  }

  async function accept(
    requestId: string,
  ) {
    try {
      setAcceptingRequest(
        (current) => ({
          ...current,
          [requestId]: true,
        }),
      )

      await api.acceptContactRequest(
        requestId,
      )

      load()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to accept contact request.',
      )
    } finally {
      setAcceptingRequest(
        (current) => ({
          ...current,
          [requestId]: false,
        }),
      )
    }
  }

  async function openChat(
    userId: string,
  ) {
    try {
      const result =
        await api.createDirectRoom(
          userId,
        )

      const roomId =
        result?.data?.room?.id

      if (!roomId) {
        throw new Error(
          'Conversation could not be created.',
        )
      }

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
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to start chat.',
      )
    }
  }

  const favoriteContacts =
    useMemo(() => {
      if (!contacts) {
        return []
      }

      return contacts.filter(
        (contact) =>
          Boolean(contact.favorite),
      )
    }, [contacts])

  const visibleContacts =
    activeTab === 'favorites'
      ? favoriteContacts
      : contacts || []

  const requestCount =
    requests.length

  return (
    <section className="contacts-page">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="contacts-header">
        <div className="contacts-heading">
          <span className="contacts-eyebrow">
            PEOPLE
          </span>

          <h1>Contacts</h1>

          <p>
            Manage the people you can
            chat with.
          </p>
        </div>

        <button
          type="button"
          className="contacts-add-button"
          onClick={() =>
            document
              .querySelector<HTMLInputElement>(
                '.contacts-search-input',
              )
              ?.focus()
          }
        >
          <Plus
            size={17}
            strokeWidth={2}
          />

          <span>
            Add contact
          </span>
        </button>
      </header>

      {/* ===================================================
          SEARCH
          =================================================== */}

      <div
        className={`contacts-search ${
          searchFocused
            ? 'focused'
            : ''
        }`}
      >
        <Search
          size={18}
          strokeWidth={1.9}
          className="contacts-search-icon"
        />

        <input
          className="contacts-search-input"
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          onFocus={() =>
            setSearchFocused(
              true,
            )
          }
          onBlur={() =>
            setSearchFocused(
              false,
            )
          }
          placeholder="Search people by name or username"
          aria-label="Search contacts"
        />

        {query && (
          <button
            type="button"
            className="contacts-search-clear"
            onClick={() =>
              setQuery('')
            }
            aria-label="Clear search"
          >
            <X
              size={15}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* ===================================================
          SEARCH RESULTS
          =================================================== */}

      {query.trim().length >= 2 && (
        <section className="contacts-search-results">
          <div className="contacts-section-heading">
            <div>
              <span>
                SEARCH RESULTS
              </span>

              <h2>
                People you may know
              </h2>
            </div>

            {loadingSearch && (
              <span className="contacts-loading-label">
                Searching…
              </span>
            )}
          </div>

          {!loadingSearch &&
            results.length ===
              0 && (
              <div className="contacts-empty">
                <div className="contacts-empty-icon">
                  <Search
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <strong>
                  No matches found
                </strong>

                <span>
                  Try another name,
                  username or email.
                </span>
              </div>
            )}

          {results.length > 0 && (
            <div className="contacts-person-list">
              {results.map(
                (user) => {
                  const name =
                    `${user.firstName || ''} ${
                      user.lastName || ''
                    }`.trim() ||
                    user.username ||
                    'User'

                  const avatar =
                    normalizeAvatar(
                      user.avatar,
                    )

                  const sent =
                    Boolean(
                      sentTo[
                        user.id
                      ],
                    )

                  const sending =
                    Boolean(
                      sendingRequest[
                        user.id
                      ],
                    )

                  return (
                    <div
                      className="contacts-person-card"
                      key={
                        user.id
                      }
                    >
                      <div className="contacts-person-main">
                        <div className="contacts-avatar">
                          {avatar ? (
                            <img
                              src={
                                avatar
                              }
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
                              user.firstName,
                              user.lastName,
                              user.username,
                            )
                          )}
                        </div>

                        <div className="contacts-person-copy">
                          <strong>
                            {name}
                          </strong>

                          <span>
                            @
                            {
                              user.username
                            }
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`contacts-request-button ${
                          sent
                            ? 'sent'
                            : ''
                        }`}
                        disabled={
                          sent ||
                          sending
                        }
                        onClick={() =>
                          void sendRequest(
                            user.id,
                          )
                        }
                      >
                        {sent ? (
                          <>
                            <Check
                              size={14}
                            />

                            <span>
                              Sent
                            </span>
                          </>
                        ) : sending ? (
                          'Sending…'
                        ) : (
                          <>
                            <UserPlus
                              size={14}
                            />

                            <span>
                              Add
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                },
              )}
            </div>
          )}
        </section>
      )}

      {/* ===================================================
          REQUESTS
          =================================================== */}

      {requests.length > 0 && (
        <section className="contacts-section">
          <div className="contacts-section-heading">
            <div>
              <span>
                PENDING
              </span>

              <h2>
                Contact requests
              </h2>
            </div>

            <span className="contacts-count-badge">
              {requestCount}
            </span>
          </div>

          <div className="contacts-person-list">
            {requests.map(
              (request) => {
                const avatar =
                  normalizeAvatar(
                    request.avatar,
                  )

                const accepting =
                  Boolean(
                    acceptingRequest[
                      request.id
                    ],
                  )

                return (
                  <div
                    className="contacts-person-card"
                    key={
                      request.id
                    }
                  >
                    <div className="contacts-person-main">
                      <div className="contacts-avatar">
                        {avatar ? (
                          <img
                            src={
                              avatar
                            }
                            alt=""
                          />
                        ) : (
                          initials(
                            request.first_name,
                            request.last_name,
                            request.username,
                          )
                        )}
                      </div>

                      <div className="contacts-person-copy">
                        <strong>
                          {
                            request.first_name
                          }{' '}
                          {
                            request.last_name
                          }
                        </strong>

                        <span>
                          @
                          {
                            request.username
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="contacts-accept-button"
                      disabled={
                        accepting
                      }
                      onClick={() =>
                        void accept(
                          request.id,
                        )
                      }
                    >
                      {accepting ? (
                        'Accepting…'
                      ) : (
                        <>
                          <Check
                            size={14}
                            strokeWidth={
                              2
                            }
                          />

                          <span>
                            Accept
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )
              },
            )}
          </div>
        </section>
      )}

      {/* ===================================================
          TABS
          =================================================== */}

      <section className="contacts-section contacts-directory">
        <div className="contacts-directory-header">
          <div className="contacts-section-heading">
            <div>
              <span>
                YOUR PEOPLE
              </span>

              <h2>
                {activeTab ===
                'favorites'
                  ? 'Favorites'
                  : 'Your contacts'}
              </h2>
            </div>

            {contacts &&
              contacts.length >
                0 && (
                <span className="contacts-count-badge">
                  {
                    visibleContacts.length
                  }
                </span>
              )}
          </div>

          <div className="contacts-tabs">
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
              All
            </button>

            <button
              type="button"
              className={
                activeTab ===
                'requests'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveTab(
                  'requests',
                )
              }
            >
              Requests

              {requestCount >
                0 && (
                <b>
                  {requestCount >
                  99
                    ? '99+'
                    : requestCount}
                </b>
              )}
            </button>

            <button
              type="button"
              className={
                activeTab ===
                'favorites'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveTab(
                  'favorites',
                )
              }
            >
              Favorites
            </button>
          </div>
        </div>

        {/* REQUEST TAB */}
        {activeTab ===
          'requests' && (
          <div className="contacts-request-tab">
            {requests.length ===
            0 ? (
              <div className="contacts-empty">
                <div className="contacts-empty-icon">
                  <UserPlus
                    size={20}
                  />
                </div>

                <strong>
                  No pending requests
                </strong>

                <span>
                  New contact requests
                  will appear here.
                </span>
              </div>
            ) : (
              requests.map(
                (request) => (
                  <div
                    className="contacts-person-card"
                    key={
                      request.id
                    }
                  >
                    <div className="contacts-person-main">
                      <div className="contacts-avatar">
                        {initials(
                          request.first_name,
                          request.last_name,
                          request.username,
                        )}
                      </div>

                      <div className="contacts-person-copy">
                        <strong>
                          {
                            request.first_name
                          }{' '}
                          {
                            request.last_name
                          }
                        </strong>

                        <span>
                          @
                          {
                            request.username
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="contacts-accept-button"
                      onClick={() =>
                        void accept(
                          request.id,
                        )
                      }
                    >
                      <Check
                        size={14}
                      />
                      Accept
                    </button>
                  </div>
                ),
              )
            )}
          </div>
        )}

        {/* NORMAL CONTACTS */}
        {activeTab !==
          'requests' && (
          <>
            {error && (
              <div className="contacts-alert">
                <strong>
                  Could not load
                  contacts
                </strong>

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={
                    load
                  }
                >
                  Retry
                </button>
              </div>
            )}

            {!error &&
              contacts ===
                null && (
                <div className="contacts-skeleton-list">
                  {[
                    1, 2, 3, 4,
                  ].map(
                    (item) => (
                      <div
                        className="contacts-skeleton"
                        key={
                          item
                        }
                      />
                    ),
                  )}
                </div>
              )}

            {!error &&
              contacts !==
                null &&
              visibleContacts.length ===
                0 && (
                <div className="contacts-empty">
                  <div className="contacts-empty-icon">
                    <Users
                      size={20}
                      strokeWidth={
                        1.8
                      }
                    />
                  </div>

                  <strong>
                    {activeTab ===
                    'favorites'
                      ? 'No favorites yet'
                      : 'No contacts yet'}
                  </strong>

                  <span>
                    {activeTab ===
                    'favorites'
                      ? 'Favorite contacts will appear here.'
                      : 'Search for people above to send a contact request.'}
                  </span>
                </div>
              )}

            {visibleContacts.length >
              0 && (
              <div className="contacts-person-list">
                {visibleContacts.map(
                  (contact) => {
                    const avatar =
                      normalizeAvatar(
                        contact.avatar,
                      )

                    return (
                      <div
                        className="contacts-person-card"
                        key={
                          contact.contact_id
                        }
                      >
                        <div className="contacts-person-main">
                          <div className="contacts-avatar large">
                            {avatar ? (
                              <img
                                src={
                                  avatar
                                }
                                alt=""
                              />
                            ) : (
                              initials(
                                contact.first_name,
                                contact.last_name,
                                contact.username,
                              )
                            )}

                            <span className="contacts-status-dot online" />
                          </div>

                          <div className="contacts-person-copy">
                            <strong>
                              {
                                contact.first_name
                              }{' '}
                              {
                                contact.last_name
                              }
                            </strong>

                            <span>
                              @
                              {
                                contact.username
                              }
                            </span>

                            <small>
                              <i />
                              Available
                              to chat
                            </small>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="contacts-chat-button"
                          onClick={() =>
                            void openChat(
                              contact.user_id ||
                                contact.contact_id,
                            )
                          }
                        >
                          <MessageSquare
                            size={15}
                            strokeWidth={
                              1.9
                            }
                          />

                          <span>
                            Chat
                          </span>
                        </button>
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  )
}

export default ContactsModule