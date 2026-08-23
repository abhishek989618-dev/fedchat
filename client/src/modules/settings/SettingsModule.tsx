import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { ImageCropper } from '../../components/ui/ImageCropper'
import { api, assetUrl, getSession, saveSession, type User } from '../../lib'

const other: [string, string][] = [
  ['Privacy', 'Last seen, profile photo, status and blocked users'],
  ['Notifications', 'Message, group and system notification preferences'],
  ['Chats', 'Theme, wallpaper, enter key and media visibility'],
  ['Storage & data', 'Network usage, auto-download and storage'],
  ['Appearance', 'Light/dark theme and interface density'],
]

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const session = getSession()
  const [user, setUser] = useState<User>(session?.user || {} as User)
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null)
  const [cropFile, setCropFile] = useState<{kind:'avatar'|'banner'; file:File} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const avatarInput = useRef<HTMLInputElement | null>(null)
  const bannerInput = useRef<HTMLInputElement | null>(null)

  const syncSession = (updated: User) => {
    setUser(updated)
    if (session) saveSession({ ...session, user: { ...session.user, ...updated } })
  }

  async function save() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const r = await api.updateProfile({ firstName, lastName, username, bio })
      syncSession({ ...user, ...r.data.user } as User)
      setSaved(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile')
    } finally { setSaving(false) }
  }

  async function upload(kind: 'avatar' | 'banner', file: File) {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be 10MB or smaller.'); return }
    setUploading(kind); setError(null)
    try {
      const r = await api.uploadProfileMedia(kind, file)
      syncSession({ ...user, ...r.data.user } as User)
    } catch (e: any) {
      setError(e?.message || `Could not update ${kind}`)
    } finally { setUploading(null) }
  }

  function chooseMedia(kind: 'avatar'|'banner', file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be 10MB or smaller.'); return }
    setCropFile({ kind, file })
  }

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase()
  const banner = assetUrl(user.bannerUrl)
  const avatar = assetUrl(user.avatar)

  return (
    <div className="profile-settings-shell">
      <div className="profile-settings-head">
        <div><span className="eyebrow">ACCOUNT</span><h3>Profile</h3><p>Personalize how you appear across FedChat.</p></div>
        <button className="icon-btn" onClick={onClose} aria-label="Close profile"><Icon name="arrow" /></button>
      </div>

      <section className="profile-hero-card">
        <div className="profile-banner" style={banner ? { backgroundImage: `url(${banner})` } : undefined}>
          {!banner && <div className="profile-banner-placeholder"><span>Add a cover banner</span></div>}
          <button type="button" className="banner-edit" onClick={() => bannerInput.current?.click()} disabled={uploading === 'banner'}>
            <Icon name="edit" /> {uploading === 'banner' ? 'Uploading…' : 'Change cover'}
          </button>
          <input ref={bannerInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e => { const f=e.target.files?.[0]; chooseMedia('banner', f); e.currentTarget.value='' }} />
        </div>
        <div className="profile-hero-body">
          <button type="button" className="profile-avatar-button" onClick={() => avatarInput.current?.click()} disabled={uploading === 'avatar'} aria-label="Change profile picture">
            {avatar ? <img src={avatar} alt="Profile" /> : <span>{initials}</span>}
            <span className="profile-avatar-camera"><Icon name="edit" /></span>
          </button>
          <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={e => { const f=e.target.files?.[0]; chooseMedia('avatar', f); e.currentTarget.value='' }} />
          <div className="profile-hero-copy"><strong>{user.firstName} {user.lastName}</strong><span>@{user.username}</span><small>{uploading === 'avatar' ? 'Updating photo…' : 'Use a clear photo so contacts can recognize you.'}</small></div>
        </div>
      </section>

      <section className="profile-form-card">
        <div className="profile-section-title"><div><strong>Profile details</strong><span>Your name, username and bio are visible in your profile.</span></div></div>
        <div className="profile-form-grid">
          <label><span>First name</span><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" /></label>
          <label><span>Last name</span><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" /></label>
          <label><span>Username</span><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" /></label>
          <label className="full"><span>Bio <em>{bio.length}/500</em></span><textarea value={bio} onChange={e => setBio(e.target.value.slice(0,500))} placeholder="Tell people a little about yourself…" rows={4} /></label>
        </div>
        {error && <div className="notice" style={{marginTop:14}}><strong>Could not update profile</strong><span>{error}</span></div>}
        {saved && !error && <div className="profile-save-note">✓ Profile changes saved</div>}
        <div className="profile-form-actions"><button className="primary" disabled={saving || !!uploading} onClick={save}>{saving ? 'Saving…' : 'Save profile'}</button></div>
      </section>
      {cropFile && <ImageCropper file={cropFile.file} aspect={cropFile.kind === 'avatar' ? 1 : 16/6} title={cropFile.kind === 'avatar' ? 'Crop profile picture' : 'Crop profile banner'} onCancel={() => setCropFile(null)} onConfirm={(file) => { const kind=cropFile.kind; setCropFile(null); void upload(kind, file) }} />}
    </div>
  )
}

function SecurityPanel({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false)
  async function save() { setSaving(true); setError(null); setSaved(false); try { await api.changePassword({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); setSaved(true) } catch (e:any) { setError(e?.message || 'Failed to change password') } finally { setSaving(false) } }
  return <div className="card"><div className="table-head"><strong>Security</strong><button className="icon-btn" onClick={onClose}><Icon name="more" /></button></div><input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Current password" /><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password (min 8 characters)" style={{marginTop:8}} />{error&&<div className="notice" style={{marginTop:12}}><strong>Could not change password</strong><span>{error}</span></div>}{saved&&!error&&<p style={{marginTop:12}}>Password updated.</p>}<button className="primary" disabled={saving||!currentPassword||newPassword.length<8} onClick={save} style={{marginTop:12}}>{saving?'Updating…':'Update password'}</button></div>
}

function PreferencesPanel() {
  const [theme, setTheme] = useState<'light'|'dark'>('light')
  const [language, setLanguage] = useState('en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void api.getUserPreferences().then(r => {
      const p = r.data.preferences || {}
      setTheme(p.theme === 'dark' ? 'dark' : 'light')
      setLanguage(p.language || 'en')
      document.documentElement.dataset.userTheme = p.theme === 'dark' ? 'dark' : 'light'
      document.documentElement.lang = p.language || 'en'
    }).catch(() => undefined)
  }, [])

  async function save(nextTheme = theme, nextLanguage = language) {
    setSaving(true); setSaved(false)
    try {
      await api.updateUserPreferences({ theme: nextTheme, language: nextLanguage })
      document.documentElement.dataset.userTheme = nextTheme
      document.documentElement.lang = nextLanguage
      setSaved(true)
    } finally { setSaving(false) }
  }

  return <div className="card user-preferences-panel">
    <div className="table-head"><div><strong>My preferences</strong><small>These settings affect only your account.</small></div></div>
    <div className="preference-row">
      <div><strong>Theme</strong><span>Choose light or dark mode for your account.</span></div>
      <button type="button" className={theme === 'dark' ? 'toggle on' : 'toggle'} aria-pressed={theme === 'dark'} onClick={() => { const next=theme==='dark'?'light':'dark'; setTheme(next); void save(next, language) }}><span /></button>
    </div>
    <label style={{display:'grid',gap:6,marginTop:16}}><span>My language</span><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी (Hindi)</option></select></label>
    <button className="primary" disabled={saving} onClick={() => void save()} style={{marginTop:12}}>{saving ? 'Saving…' : 'Save language'}</button>
    {saved && <small style={{display:'block',marginTop:8}}>Preferences saved.</small>}
  </div>
}

export function SettingsModule() {
  const [panel, setPanel] = useState<'Profile'|'Security'|'Preferences'|null>(null)
  return <div className="page-module"><div className="page-header"><div><h2>Settings</h2><p>Control your FedChat experience.</p></div></div>{panel==='Profile'&&<ProfilePanel onClose={()=>setPanel(null)} />}{panel==='Security'&&<SecurityPanel onClose={()=>setPanel(null)} />}{panel==='Preferences'&&<PreferencesPanel />}{!panel&&<div className="settings-list"><button className="setting-row" onClick={()=>setPanel('Profile')}><div className="setting-icon"><Icon name="users"/></div><div><strong>Profile</strong><span>Profile photo, cover banner, bio, name and username</span></div><Icon name="arrow"/></button><button className="setting-row" onClick={()=>setPanel('Security')}><div className="setting-icon"><Icon name="settings"/></div><div><strong>Security</strong><span>Change your password</span></div><Icon name="arrow"/></button><button className="setting-row" onClick={()=>setPanel('Preferences')}><div className="setting-icon"><Icon name="settings"/></div><div><strong>Appearance & language</strong><span>Personal light/dark theme and your language</span></div><Icon name="arrow"/></button>{other.map(([a,b])=><button className="setting-row" key={a} disabled title="Not available yet"><div className="setting-icon"><Icon name={a==='Notifications'?'bell':a==='Privacy'?'users':'settings'}/></div><div><strong>{a}</strong><span>{b} — coming soon</span></div><Icon name="arrow"/></button>)}</div>}</div>
}
