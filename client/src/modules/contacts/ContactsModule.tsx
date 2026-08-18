import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../lib'

type Contact = { contact_id: string; user_id?: string; username: string; first_name: string; last_name: string; avatar?: string | null; favorite?: boolean }
type ContactRequest = { id: string; sender_id: string; username: string; first_name: string; last_name: string }
type SearchResult = { id: string; username: string; firstName: string; lastName: string }

function initials(a: string, b: string) {
  return `${a?.[0] || ''}${b?.[0] || ''}`.toUpperCase()
}

export function ContactsModule() {
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [sentTo, setSentTo] = useState<Record<string, boolean>>({})

  function load() {
    setError(null)
    api.contacts().then((r) => setContacts(r.data.contacts || [])).catch((e) => setError(e.message || 'Failed to load contacts'))
    api.contactRequests().then((r) => setRequests(r.data.requests || [])).catch(() => {})
  }
  useEffect(load, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); return }
    const timer = setTimeout(() => {
      api.searchUsers(trimmed).then((r) => setResults(r.data.users || [])).catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function sendRequest(userId: string) {
    try {
      await api.sendContactRequest(userId)
      setSentTo((prev) => ({ ...prev, [userId]: true }))
    } catch { /* ignore, button stays available for retry */ }
  }

  async function accept(id: string) {
    try {
      await api.acceptContactRequest(id)
      load()
    } catch { /* ignore */ }
  }

  async function openChat(userId: string) {
    try {
      const result = await api.createDirectRoom(userId)
      const roomId = result?.data?.room?.id
      if (!roomId) throw new Error('Conversation could not be created')
      window.dispatchEvent(new CustomEvent('fedchat:open-room', { detail: { roomId } }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to start chat')
    }
  }

  return (
    <div className="page-module">
      <div className="page-header">
        <div><h2>Contacts</h2><p>Manage people you chat with.</p></div>
      </div>

      <div className="search wide">
        <Icon name="search" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people by name or username" />
      </div>

      {results.length > 0 && (
        <div className="contact-grid" style={{ marginTop: 12 }}>
          {results.map((u) => (
            <div className="contact-card" key={u.id}>
              <div className="avatar">{initials(u.firstName, u.lastName)}</div>
              <div><strong>{u.firstName} {u.lastName}</strong><small>@{u.username}</small></div>
              <button className="icon-btn" disabled={!!sentTo[u.id]} onClick={() => sendRequest(u.id)}>
                {sentTo[u.id] ? 'Sent' : <Icon name="plus" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Contact requests</h3>
          <div className="contact-grid">
            {requests.map((r) => (
              <div className="contact-card" key={r.id}>
                <div className="avatar">{initials(r.first_name, r.last_name)}</div>
                <div><strong>{r.first_name} {r.last_name}</strong><small>@{r.username}</small></div>
                <button className="icon-btn" onClick={() => accept(r.id)}>Accept</button>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ marginTop: 20 }}>Your contacts</h3>
      {error && (
        <div className="notice">
          <strong>Could not load contacts</strong>
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}
      {!error && contacts === null && <p>Loading contacts…</p>}
      {!error && contacts !== null && contacts.length === 0 && (
        <div className="notice">
          <strong>No contacts yet</strong>
          <span>Search for people above to send a contact request.</span>
        </div>
      )}
      {!error && contacts !== null && contacts.length > 0 && (
        <div className="contact-grid">
          {contacts.map((c) => (
            <div className="contact-card" key={c.contact_id}>
              <div className="avatar">{initials(c.first_name, c.last_name)}</div>
              <div><strong>{c.first_name} {c.last_name}</strong><small>@{c.username}</small></div>
              <button className="icon-btn" onClick={() => void openChat(c.user_id || c.contact_id)}>Chat</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
