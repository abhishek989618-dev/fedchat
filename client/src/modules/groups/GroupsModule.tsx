import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { ImageCropper } from '../../components/ui/ImageCropper'
import { api, assetUrl } from '../../lib'

type Group = {
  id: string
  name: string
  description?: string | null
  avatar?: string | null
  bannerUrl?: string | null
  isPrivate?: boolean
  _count?: { members: number }
}

function initials(name: string) {
  return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
}

function GroupImage({ group, large = false }: { group: Group; large?: boolean }) {
  const src = assetUrl(group.avatar)
  return <div className={large ? 'group-avatar large group-avatar-media' : 'group-avatar group-avatar-media'}>{src ? <img src={src} alt="" /> : initials(group.name)}</div>
}

function GroupDetail({ group: initialGroup, onClose }: { group: Group; onClose: () => void }) {
  const [group, setGroup] = useState<Group>(initialGroup)
  const [name, setName] = useState(initialGroup.name)
  const [description, setDescription] = useState(initialGroup.description || '')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ count: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [memberMessage, setMemberMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const [cropFile, setCropFile] = useState<{kind:'avatar'|'banner';file:File}|null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void api.groupMembers(group.id).then(r => setMembers(r.data.members || [])).catch(() => setMembers([]))
    void api.contacts().then(r => setContacts(r.data.contacts || [])).catch(() => setContacts([]))
  }, [group.id])

  async function addMember(userId: string) {
    setAdding(userId); setMemberMessage('')
    try { await api.addGroupMember(group.id, userId); const r = await api.groupMembers(group.id); setMembers(r.data.members || []); setMemberMessage('Member added.') }
    catch (e:any) { setMemberMessage(e?.message || 'Only active paid FULL users can be added.') }
    finally { setAdding(null) }
  }

  async function saveDetails() {
    setBusy(true); setSaved(false)
    try { const r = await api.updateGroup(group.id, { name, description }); setGroup((g)=>({...g,...r.data.group})); setSaved(true) }
    catch (e:any) { setMemberMessage(e?.message || 'Could not save group details') }
    finally { setBusy(false) }
  }

  async function upload(kind:'avatar'|'banner', file:File) {
    if (!file.type.startsWith('image/')) { setMemberMessage('Please choose an image.'); return }
    if (file.size > 10 * 1024 * 1024) { setMemberMessage('Image must be 10MB or smaller.'); return }
    setBusy(true); setMemberMessage('')
    try { const r=await api.uploadGroupMedia(group.id,kind,file); setGroup((g)=>({...g,...r.data.group})); }
    catch(e:any){ setMemberMessage(e?.message || 'Could not upload group image') }
    finally { setBusy(false) }
  }

  function chooseMedia(kind:'avatar'|'banner', file?:File) { if(file) setCropFile({kind,file}) }

  async function createInvite() {
    setBusy(true); setInviteError(null)
    try { const r = await api.createGroupInvite(group.id); setInviteLink(`${window.location.origin}${r.data.joinPath}`) }
    catch (e: any) { setInviteError(e?.message || 'Failed to create invite link') }
    finally { setBusy(false) }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setImportError(null); setImportResult(null)
    try { const r = await api.importGroupMembers(group.id, file); setImportResult({ count: r.data.count }) }
    catch (err: any) { setImportError(err?.message || 'Import failed') }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const banner = assetUrl(group.bannerUrl)
  
  return <div className="group-manage-shell">
    <div className="group-manage-top"><div><span className="eyebrow">GROUP MANAGEMENT</span><h3>{group.name}</h3><p>Customize the group, invite members and manage access.</p></div><button className="icon-btn" onClick={onClose}><Icon name="arrow" /></button></div>
    <section className="group-hero-card">
      <div className="group-banner" style={banner ? {backgroundImage:`url(${banner})`} : undefined}>
        {!banner && <div className="group-banner-empty">Add a group banner</div>}
        <button className="banner-edit" disabled={busy} onClick={()=>bannerInput.current?.click()}><Icon name="edit"/> Change banner</button>
        <input ref={bannerInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const f=e.target.files?.[0]; chooseMedia('banner',f);e.currentTarget.value=''}}/>
      </div>
      <div className="group-hero-body">
        <button className="group-icon-button" onClick={()=>avatarInput.current?.click()} aria-label="Change group icon" disabled={busy}><GroupImage group={group} large/><span className="profile-avatar-camera"><Icon name="edit"/></span></button>
        <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e=>{const f=e.target.files?.[0];chooseMedia('avatar',f);e.currentTarget.value=''}}/>
        <div><strong>{group.name}</strong><span>{members.length} members · {group.isPrivate ? 'Private' : 'Public invite'}</span></div>
      </div>
    </section>

    <section className="profile-form-card">
      <div className="profile-section-title"><div><strong>Group details</strong><span>Update the name and description shown in chat.</span></div></div>
      <div className="profile-form-grid"><label><span>Group name</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={100}/></label><label className="full"><span>Description</span><textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,500))} rows={4} maxLength={500}/></label></div>
      <div className="profile-form-actions"><button className="primary" onClick={()=>void saveDetails()} disabled={busy}>{busy?'Saving…':'Save group details'}</button></div>
      {saved && <div className="profile-save-note">✓ Group details saved</div>}
    </section>

    <section className="card"><div className="table-head"><strong>Members</strong><span>{members.length} member(s). Only active paid FULL users can be added.</span></div>
      {members.length > 0 && <div className="contact-grid" style={{marginTop:8}}>{members.map((m:any)=><div className="contact-card" key={m.userId}><div className="avatar">{m.user?.avatar ? <img src={assetUrl(m.user.avatar)} alt=""/> : initials(`${m.user?.firstName||''} ${m.user?.lastName||''}`)}</div><div><strong>{m.user?.firstName} {m.user?.lastName}</strong><small>@{m.user?.username}</small></div></div>)}</div>}
      {contacts.length > 0 && <div style={{marginTop:12}}><strong>Add from contacts</strong>{contacts.map((c:any)=>members.some((m:any)=>String(m.userId)===String(c.user_id||c.contact_id)) ? null : <div className="group-line" key={c.user_id||c.contact_id}><div className="avatar">{c.avatar ? <img src={assetUrl(c.avatar)} alt=""/> : initials(`${c.first_name} ${c.last_name}`)}</div><div><strong>{c.first_name} {c.last_name}</strong><small>@{c.username}</small></div><button className='primary' disabled={adding===(c.user_id||c.contact_id)} onClick={()=>void addMember(c.user_id||c.contact_id)}>{adding===(c.user_id||c.contact_id)?'Adding…':'Add'}</button></div>)}</div>}
      {memberMessage && <div className="notice" style={{marginTop:12}}><strong>Group update</strong><span>{memberMessage}</span></div>}
    </section>

    <section className="card"><div className="table-head"><strong>Public guest link</strong></div><p className="muted">Guests can join through the public link as read-only users.</p><button className="primary" onClick={()=>void createInvite()} disabled={busy}>{busy?'Working…':'Generate invite link'}</button>{inviteError&&<div className="notice" style={{marginTop:10}}><strong>Could not create invite</strong><span>{inviteError}</span></div>}{inviteLink&&<div className="invite-box"><code>{inviteLink}</code><button className="secondary" onClick={()=>void navigator.clipboard?.writeText(inviteLink)}>Copy</button></div>}</section>

    <section className="card"><div className="table-head"><strong>Bulk member import</strong></div><input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} />{importResult&&<p>Imported {importResult.count} member(s).</p>}{importError&&<div className="notice"><strong>Import failed</strong><span>{importError}</span></div>}</section>

    {cropFile && <ImageCropper file={cropFile.file} aspect={cropFile.kind==='avatar'?1:16/6} title={cropFile.kind==='avatar'?'Crop group icon':'Crop group banner'} onCancel={()=>setCropFile(null)} onConfirm={(f)=>{const kind=cropFile.kind;setCropFile(null);void upload(kind,f)}}/>}
  </div>
}

export function GroupsModule({ initialGroupId = '', onNavigateToPlans, onOpenChat }: { initialGroupId?: string; onNavigateToPlans?: () => void; onOpenChat?: (roomId: string) => void }) {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [openGroup, setOpenGroup] = useState<Group | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  async function load() { setError(''); try { const r=await api.groups(); setGroups(r.data.groups as Group[]) } catch(e:any){setError(e?.message||'Unable to load groups')} }
  useEffect(()=>{void load()},[])
  useEffect(()=>{
    if (!initialGroupId || !groups) return
    const target = groups.find((item) => item.id === initialGroupId)
    if (target) setOpenGroup(target)
  }, [groups, initialGroupId])
  async function create() { if(!name.trim()) return; setCreating(true); try{await api.createGroup({name:name.trim(),description:description.trim(),isPrivate});setName('');setDescription('');setIsPrivate(false);await load()}catch(e:any){setError(e?.message||'Unable to create group')}finally{setCreating(false)} }
  return <div className="page-module"><div className="page-header"><div><h2>Groups</h2><p>Build focused conversations, customize the group identity and manage members.</p></div></div>
    <div className="card create-group-card"><strong>Create a group</strong><div className="create-group-grid"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Group name"/><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short description"/><label className="check-row"><input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)}/> Private group</label><button className="primary" onClick={()=>void create()} disabled={creating||!name.trim()}>{creating?'Creating…':'Create group'}</button>{onNavigateToPlans&&<button className="secondary" type="button" onClick={onNavigateToPlans}>View plans</button>}</div></div>
    {openGroup&&<GroupDetail group={openGroup} onClose={()=>setOpenGroup(null)}/>} {error&&<div className="notice"><strong>Could not load groups</strong><span>{error}</span><button onClick={()=>void load()}>Retry</button></div>}
    {!error&&groups===null&&<p>Loading groups…</p>} {!error&&groups!==null&&groups.length===0&&<div className="notice"><strong>No groups yet</strong><span>Create a group to start messaging multiple people at once.</span></div>}
    {!error&&groups!==null&&groups.length>0&&<div className="card-grid">{groups.map(g=><div className="feature-card" key={g.id}><div className="group-card-visual" style={g.bannerUrl?{backgroundImage:`url(${assetUrl(g.bannerUrl)})`}:undefined}><GroupImage group={g}/></div><h3>{g.name}</h3><p>{g._count?.members??0} members · {g.isPrivate?'Private':'Public invite'}</p><div className="card-actions"><button className='primary' onClick={()=>onOpenChat?.(g.id)}>Open chat</button><button className='primary' onClick={()=>setOpenGroup(g)}>Manage</button></div></div>)}</div>}
  </div>
}
