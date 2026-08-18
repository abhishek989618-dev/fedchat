import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api, assetUrl, getSession } from '../../lib'
import type { StatusItem, Viewer } from '../../lib'

function initials(a?: string, b?: string) { return `${a?.[0] || ''}${b?.[0] || ''}`.toUpperCase() || '?' }
function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
function mediaUrl(value?: string | null) {
  if (!value) return ''
  return assetUrl(value)
}

function AuthenticatedStatusMedia({ src, type, full = false }: { src: string; type?: string | null; full?: boolean }) {
  const [blobUrl, setBlobUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const token = getSession()?.accessToken
    setBlobUrl('')
    setFailed(false)
    if (!src) return () => undefined

    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load status media')
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (active) setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  const className = full ? 'status-view-media' : 'status-thumb-media'
  if (failed) return <div className={className} style={{display:'grid',placeItems:'center',padding:20}}>Media unavailable</div>
  if (!blobUrl) return <div className={className} style={{display:'grid',placeItems:'center',padding:20}}>Loading media…</div>
  if (type?.startsWith('video/')) return <video className={className} src={blobUrl} controls playsInline preload="metadata" />
  return <img className={className} src={blobUrl} alt="Status" loading="lazy" />
}

export function StatusModule() {
  const me = getSession()?.user
  const [statuses, setStatuses] = useState<StatusItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [viewers, setViewers] = useState<Viewer[] | null>(null)
  const [showViewers, setShowViewers] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setError(null)
    try { const r = await api.statuses(); setStatuses(r.data.statuses || []) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load status updates') }
  }
  useEffect(() => { load(); const timer=window.setInterval(load, 30000); return ()=>window.clearInterval(timer) }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const myStatuses = useMemo(() => (statuses || []).filter((s) => s.user_id === me?.id), [statuses, me?.id])
  const others = useMemo(() => (statuses || []).filter((s) => s.user_id !== me?.id), [statuses, me?.id])
  const ordered = useMemo(() => [...myStatuses, ...others], [myStatuses, others])
  const open = openIndex == null ? null : ordered[openIndex] || null

  function chooseFile(next: File | undefined) {
    if (!next) return
    if (!/^image\/(png|jpe?g|webp|gif)|video\/(mp4|webm|quicktime)$/.test(next.type)) { setError('Status supports JPG, PNG, WEBP, GIF, MP4, WEBM or MOV files.'); return }
    if (next.size > 25*1024*1024) { setError('Status media must be 25 MB or smaller.'); return }
    if (preview) URL.revokeObjectURL(preview)
    setError(null); setFile(next); setPreview(URL.createObjectURL(next))
  }

  async function submit() {
    if (!text.trim() && !file) return
    setCreating(true); setError(null)
    try {
      let mediaUrl: string | undefined, mediaType: string | undefined
      if (file) {
        const r = await api.uploadMedia(file)
        mediaUrl = `/api/v1/media/${r.data.media.id}`
        mediaType = r.data.media.mimeType
      }
      await api.createStatus({ content: text.trim(), mediaUrl, mediaType, expiresHours: 24 })
      setText(''); setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(''); setShowCreate(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to publish status') }
    finally { setCreating(false) }
  }

  async function openStatus(s: StatusItem) {
    const idx = ordered.findIndex(x => x.id === s.id)
    setOpenIndex(idx >= 0 ? idx : null); setViewers(null); setShowViewers(false)
    if (s.user_id === me?.id) {
      api.statusViews(s.id).then((r) => setViewers(r.data.views || [])).catch(() => setViewers([]))
    } else api.viewStatus(s.id).catch(() => {})
  }

  async function removeStatus(s: StatusItem) {
    if (!window.confirm('Delete this status update?')) return
    setDeleting(true)
    try { await api.deleteStatus(s.id); setOpenIndex(null); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete status') }
    finally { setDeleting(false) }
  }

  function renderMedia(s: StatusItem, full=false) {
    const src=mediaUrl(s.media_url)
    if (!src) return null
    return <AuthenticatedStatusMedia src={src} type={s.media_type} full={full} />
  }

  return (
    <div className="page-module status-module">
      <div className="page-header">
        <div><h2>Status</h2><p>Share text, photos and videos that disappear after 24 hours.</p></div>
        <button className="primary" onClick={() => setShowCreate(v => !v)}><Icon name="plus" /> Add status</button>
      </div>

      {error && <div className="notice status-error"><strong>Status</strong><span>{error}</span><button onClick={load}>Retry</button></div>}

      {showCreate && <div className="card status-composer">
        <div className="status-composer-head"><div><strong>New status</strong><span>Visible for 24 hours</span></div><button className="icon-btn" onClick={()=>setShowCreate(false)}>×</button></div>
        <textarea value={text} onChange={e=>setText(e.target.value.slice(0,700))} placeholder="Share an update with your contacts…" rows={4} />
        <div className="status-composer-actions">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime" hidden onChange={e=>chooseFile(e.target.files?.[0])} />
          <button className="secondary" onClick={()=>fileRef.current?.click()}><Icon name="paperclip" /> Photo / video</button>
          <span>{text.length}/700</span>
          <button className="primary" disabled={creating || (!text.trim() && !file)} onClick={submit}>{creating ? 'Posting…' : 'Post status'}</button>
        </div>
        {file && <div className="status-upload-preview">{preview && (file.type.startsWith('video/') ? <video src={preview} controls playsInline /> : <img src={preview} alt="Preview" />)}<div><strong>{file.name}</strong><span>{Math.round(file.size/1024)} KB</span></div><button className="icon-btn" onClick={()=>{setFile(null);URL.revokeObjectURL(preview);setPreview('')}}>×</button></div>}
      </div>}

      {!error && statuses === null && <div className="card status-loading"><span className="status-spinner" /> Loading status updates…</div>}

      {statuses !== null && <div className="status-grid">
        <button className="status-card create" onClick={()=>setShowCreate(true)}>
          <div className="status-avatar status-avatar-add"><span>{initials(me?.firstName, me?.lastName)}</span><b>+</b></div>
          <strong>My status</strong><span>{myStatuses.length ? `${myStatuses.length} update${myStatuses.length>1?'s':''}` : 'Share an update'}</span>
        </button>
        {others.map(s => <button className="status-card status-card-media" key={s.id} onClick={()=>openStatus(s)}>
          <div className="status-ring"><div className="status-avatar">{s.avatar ? <img src={assetUrl(s.avatar)} alt="" /> : initials(s.first_name,s.last_name)}</div></div>
          <strong>{s.first_name} {s.last_name}</strong><span>{timeAgo(s.created_at)}</span>{s.media_url && <small>{s.media_type?.startsWith('video/')?'Video':'Photo'}</small>}
        </button>)}
      </div>}

      {open && <div className="status-viewer-backdrop" onClick={()=>setOpenIndex(null)}>
        <div className="status-viewer" onClick={e=>e.stopPropagation()}>
          <div className="status-viewer-head"><div className="status-avatar small">{open.avatar ? <img src={assetUrl(open.avatar)} alt=""/> : initials(open.first_name,open.last_name)}</div><div><strong>{open.user_id===me?.id?'Your status':`${open.first_name} ${open.last_name}`}</strong><span>{timeAgo(open.created_at)}</span></div><div className="status-viewer-actions"><button className="icon-btn" onClick={()=>setOpenIndex(null)}>×</button>{open.user_id===me?.id && <button className="icon-btn" title="Delete" disabled={deleting} onClick={()=>removeStatus(open)}>⌫</button>}</div></div>
          <div className="status-viewer-body">{renderMedia(open,true)}{open.content && <div className="status-viewer-text">{open.content}</div>}</div>
          {open.user_id===me?.id && <div className="status-viewer-footer"><button className="secondary" onClick={()=>setShowViewers(v=>!v)}>Viewed by {open.view_count || 0}</button>{showViewers && <div className="status-viewers">{viewers===null?<span>Loading viewers…</span>:viewers.length===0?<span>No views yet.</span>:viewers.map(v=><div className="status-viewer-row" key={v.viewer_id}><div className="avatar small">{initials(v.first_name,v.last_name)}</div><div><strong>{v.first_name} {v.last_name}</strong><small>@{v.username}</small></div><time>{timeAgo(v.viewed_at)}</time></div>)}</div>}</div>}
        </div>
      </div>}
    </div>
  )
}
