import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api, getSession } from '../../lib'

type Community = { id: string; name: string; description?: string | null; owner_id: string; member_count: number }
type Group = { id: string; name: string }
type Announcement = { id: string; title: string; content: string; created_at: string; first_name?: string; last_name?: string }

function initials(name: string) {
  return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
}

export function CommunitiesModule({ onNavigateToPlans }: { onNavigateToPlans?: () => void }) {
  const [communities, setCommunities] = useState<Community[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [postingAnn, setPostingAnn] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<{ message: string; needsSubscription: boolean } | null>(null)

  function load() {
    setError(null)
    api.communities().then((r) => {
      const list = r.data.communities || []
      setCommunities(list)
      if (list.length && !selected) setSelected(list[0].id)
    }).catch((e) => setError(e.message || 'Failed to load communities'))
  }
  useEffect(load, [])
  useEffect(() => { api.groups().then((r) => setMyGroups(r.data.groups || [])).catch(() => {}) }, [])

  useEffect(() => {
    if (!selected) { setGroups(null); return }
    api.communityGroups(selected).then((r) => setGroups(r.data.groups || [])).catch(() => setGroups([]))
    api.communityAnnouncements(selected).then((r) => setAnnouncements(r.data.announcements || [])).catch(() => setAnnouncements([]))
  }, [selected])

  async function postAnnouncement() {
    if (!selected || !annTitle.trim() || !annContent.trim()) return
    setPostingAnn(true)
    try {
      await api.postCommunityAnnouncement(selected, { title: annTitle.trim(), content: annContent.trim() })
      setAnnTitle('')
      setAnnContent('')
      const r = await api.communityAnnouncements(selected)
      setAnnouncements(r.data.announcements || [])
    } catch { /* ignore, form stays filled for retry */ }
    finally { setPostingAnn(false) }
  }

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.createCommunity({ name: trimmed })
      setName('')
      setShowCreate(false)
      load()
    } catch (e: any) {
      setCreateError({ message: e?.message || 'Failed to create community', needsSubscription: e?.code === 'GROUP_PERMISSION_REQUIRED' })
    } finally {
      setCreating(false)
    }
  }

  async function attach(roomId: string) {
    if (!selected) return
    try {
      await api.attachGroupToCommunity(selected, roomId)
      const r = await api.communityGroups(selected)
      setGroups(r.data.groups || [])
    } catch { /* ignore, list stays as-is */ }
  }

  const current = communities?.find((c) => c.id === selected)
  const attachable = myGroups.filter((g) => !groups?.some((cg) => cg.id === g.id))

  return (
    <div className="page-module">
      <div className="page-header">
        <div><h2>Communities</h2><p>Bring related groups together with one announcement space.</p></div>
        <button className="primary" onClick={() => setShowCreate((v) => !v)}><Icon name="plus" /> New community</button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>New community</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name" />
          <button className="primary" disabled={creating || !name.trim()} onClick={submit} style={{ marginTop: 8 }}>
            {creating ? 'Creating…' : 'Create'}
          </button>
          {createError && (
            <div className="notice" style={{ marginTop: 12 }}>
              <strong>{createError.needsSubscription ? 'Subscription required' : 'Could not create community'}</strong>
              <span>{createError.message}</span>
              {createError.needsSubscription && <button onClick={onNavigateToPlans}>View Plans</button>}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="notice">
          <strong>Could not load communities</strong>
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {!error && communities === null && <p>Loading communities…</p>}

      {!error && communities !== null && communities.length === 0 && (
        <div className="notice">
          <strong>No communities yet</strong>
          <span>Create a community to organize related groups together.</span>
        </div>
      )}

      {!error && current && (
        <div className="community-layout">
          <div className="community-main">
            <div className="community-banner">
              <div className="group-avatar large">{initials(current.name)}</div>
              <div><h3>{current.name}</h3><p>{groups?.length ?? 0} groups · {current.member_count} members</p></div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <strong>Announcements</strong>
              {announcements === null && <p>Loading…</p>}
              {announcements !== null && announcements.length === 0 && <p>No announcements yet.</p>}
              {announcements?.map((a) => (
                <div className="table-row" key={a.id}>
                  <div><strong>{a.title}</strong><p>{a.content}</p><small>{a.first_name} {a.last_name} · {new Date(a.created_at).toLocaleString()}</small></div>
                </div>
              ))}
              {current.owner_id === getSession()?.user.id && (
                <div style={{ marginTop: 12 }}>
                  <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Announcement title" />
                  <input value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="What's the update?" style={{ marginTop: 8 }} />
                  <button className="primary" disabled={postingAnn || !annTitle.trim() || !annContent.trim()} onClick={postAnnouncement} style={{ marginTop: 8 }}>
                    {postingAnn ? 'Posting…' : 'Post announcement'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}><strong>Groups</strong></div>
            {groups === null && <p>Loading groups…</p>}
            {groups !== null && groups.length === 0 && <p>No groups attached yet.</p>}
            {groups?.map((g) => (
              <div className="group-line" key={g.id}>
                <div className="group-avatar">{g.name[0]}</div>
                <div><strong>{g.name}</strong><small>Group managed by admins</small></div>
                <button className='primary' onClick={() => window.dispatchEvent(new CustomEvent('fedchat:open-room', { detail: { roomId: g.id } }))}>Open chat</button>
              </div>
            ))}
            {attachable.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Attach a group</strong>
                {attachable.map((g) => (
                  <div className="group-line" key={g.id}>
                    <div className="group-avatar">{g.name[0]}</div>
                    <div><strong>{g.name}</strong></div>
                    <button onClick={() => attach(g.id)}>Attach</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <aside className="side-card">
            <h3>Communities</h3>
            {communities !== null && communities.map((c) => (
              <button key={c.id} className="setting-row" onClick={() => setSelected(c.id)} style={{ textAlign: 'left' }}>
                <strong>{c.name}</strong>
              </button>
            ))}
          </aside>
        </div>
      )}
    </div>
  )
}
