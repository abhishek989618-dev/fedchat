import { useEffect, useState } from 'react'
import { api } from '../../lib'
import type { AdminSection } from '../../types/app'

type Analytics = {
  users: number
  rooms: number
  messages: number
  subscriptions: number
  pendingPayments: number
  activeUsers24h: number
}

type PaymentRequest = {
  id: string
  transactionId?: string
  amount: number
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email?: string
  }
  plan: {
    id: string
    name: string
  }
}

type AdminUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  status: string
}

type Plan = {
  id: string
  name: string
  description?: string | null
  price?: number | string
  durationDays?: number
  accessLevel?: 'FULL' | 'READONLY' | 'LOCKED'
  isActive?: boolean
  maxGroups: number | null
  maxMembersPerGroup: number | null
  maxCommunities: number | null
  maxGuestsPerGroup: number | null
}

/* =========================================================
   MEDIA BACKUP PANEL
========================================================= */

function MediaBackupPanel() {
  const [backups, setBackups] = useState<
    { filename: string; sizeBytes: number; createdAt: string }[] | null
  >(null)

  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    api
      .listMediaBackups()
      .then((r) => {
        setBackups(r.data.backups || [])
      })
      .catch((e) => {
        setBackups([])
        setError(e?.message || 'Failed to load backups')
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function backup() {
    setBusy('backup')
    setError(null)
    setMessage(null)

    try {
      const r = await api.createMediaBackup()

      const backupData = r.data.backup

      setMessage(
        `Backup created: ${backupData.filename} ` +
          `(${backupData.mediaCount} file(s), ` +
          `${(backupData.sizeBytes / 1024 / 1024).toFixed(2)} MB)`
      )

      load()
    } catch (e: any) {
      setError(e?.message || 'Backup failed')
    } finally {
      setBusy(null)
    }
  }

  async function wipe(filename: string) {
    const confirmed = window.confirm(
      `This permanently deletes ALL media files and cannot be undone.\n\n` +
        `A backup (${filename}) has been created.\n\n` +
        `Confirm you want to wipe media now?`
    )

    if (!confirmed) {
      return
    }

    setBusy(filename)
    setError(null)
    setMessage(null)

    try {
      const r = await api.wipeMedia(filename)

      setMessage(r.message || 'Media wiped successfully')

      load()
    } catch (e: any) {
      setError(e?.message || 'Wipe failed')
    } finally {
      setBusy(null)
    }
  }

  async function download(filename: string) {
    setError(null)

    try {
      await api.downloadMediaBackup(filename)
    } catch (e: any) {
      setError(e?.message || 'Download failed')
    }
  }

  return (
    <div className="admin-table" style={{ marginTop: 16 }}>
      <div className="table-head">
        <strong>Media backup &amp; storage cleanup</strong>
      </div>

      <p
        style={{
          margin: '4px 0 12px',
          fontSize: 11,
          color: '#7c8794',
        }}
      >
        Back up all uploaded media to a downloadable archive, then wipe media
        from the server to free storage. Wiping is only allowed after a backup
        for that exact file has been confirmed to exist.
      </p>

      <button
        className="primary"
        disabled={busy === 'backup'}
        onClick={backup}
      >
        {busy === 'backup' ? 'Backing up…' : 'Create backup now'}
      </button>

      {message && (
        <p style={{ marginTop: 10, fontSize: 11 }}>
          {message}
        </p>
      )}

      {error && (
        <div className="notice" style={{ marginTop: 10 }}>
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      )}

      {backups === null && (
        <p style={{ marginTop: 12 }}>
          Loading backups…
        </p>
      )}

      {backups?.length === 0 && (
        <p style={{ marginTop: 12 }}>
          No backups found.
        </p>
      )}

      {backups?.map((backupItem) => (
        <div
          className="table-row"
          key={backupItem.filename}
        >
          <div>
            <strong>{backupItem.filename}</strong>

            <small>
              {(backupItem.sizeBytes / 1024 / 1024).toFixed(2)} MB ·{' '}
              {new Date(backupItem.createdAt).toLocaleString()}
            </small>
          </div>

          <button
            className="icon-btn"
            disabled={busy === backupItem.filename}
            onClick={() => download(backupItem.filename)}
          >
            Download
          </button>

          <button
            className="icon-btn"
            disabled={busy === backupItem.filename}
            onClick={() => wipe(backupItem.filename)}
          >
            {busy === backupItem.filename
              ? 'Wiping…'
              : 'Wipe media'}
          </button>
        </div>
      ))}
    </div>
  )
}

/* =========================================================
   PLAN LIMITS PANEL
========================================================= */

function PlanManagementPanel() {
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [editing, setEditing] = useState<Partial<Plan> | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    setError('')
    api.adminPlans()
      .then((r) => setPlans(r.data.plans || []))
      .catch((e: any) => {
        setPlans([])
        setError(e?.message || 'Failed to load plans')
      })
  }

  useEffect(() => { load() }, [])

  function beginCreate() {
    setMessage('')
    setError('')
    setEditing({
      name: '',
      description: '',
      price: 0,
      durationDays: 30,
      accessLevel: 'FULL',
      isActive: true,
      maxGroups: null,
      maxMembersPerGroup: null,
      maxCommunities: null,
      maxGuestsPerGroup: null,
    })
  }

  function beginEdit(plan: Plan) {
    setMessage('')
    setError('')
    setEditing({ ...plan })
  }

  function numberOrNull(value: string) {
    if (value.trim() === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  async function save() {
    if (!editing) return
    if (!String(editing.name || '').trim()) {
      setError('Plan name is required.')
      return
    }

    const payload = {
      name: String(editing.name).trim(),
      description: String(editing.description || '').trim() || undefined,
      price: Number(editing.price ?? 0),
      durationDays: Number(editing.durationDays ?? 30),
      accessLevel: (editing.accessLevel || 'FULL') as 'FULL' | 'READONLY' | 'LOCKED',
      isActive: editing.isActive !== false,
      maxGroups: editing.maxGroups ?? null,
      maxMembersPerGroup: editing.maxMembersPerGroup ?? null,
      maxCommunities: editing.maxCommunities ?? null,
      maxGuestsPerGroup: editing.maxGuestsPerGroup ?? null,
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (editing.id) {
        await api.updatePlan(editing.id, payload)
        setMessage('Plan updated successfully.')
      } else {
        await api.createPlan(payload)
        setMessage('Plan created successfully.')
      }
      setEditing(null)
      load()
    } catch (e: any) {
      setError(e?.message || 'Unable to save plan')
    } finally {
      setSaving(false)
    }
  }

  async function togglePlan(plan: Plan) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.updatePlan(plan.id, { isActive: !plan.isActive })
      setMessage(`Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully.`)
      load()
    } catch (e: any) {
      setError(e?.message || 'Unable to change plan status')
    } finally {
      setSaving(false)
    }
  }

  const editNumber = (
    key: 'maxGroups' | 'maxMembersPerGroup' | 'maxCommunities' | 'maxGuestsPerGroup'
  ) => (
    <label className="plan-limit-field">
      <span>{key === 'maxMembersPerGroup' ? 'Members / group' : key === 'maxGuestsPerGroup' ? 'Guests / group' : key.replace('max', 'Max ')}</span>
      <input
        type="number"
        min={1}
        value={editing?.[key] ?? ''}
        onChange={(e) => setEditing((prev) => prev ? ({ ...prev, [key]: numberOrNull(e.target.value) }) : prev)}
        placeholder="Unlimited"
      />
    </label>
  )

  return (
    <div className="admin-table admin-section-card">
      <div className="table-head">
        <div>
          <strong>Plan management</strong>
          <small>Create, edit, activate/deactivate plans and configure feature limits.</small>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="secondary" type="button" onClick={load}>Refresh</button>
          <button className="primary" type="button" onClick={beginCreate}>Create plan</button>
        </div>
      </div>

      {message && <div className="notice" style={{ margin: '10px 0' }}><span>{message}</span></div>}
      {error && <div className="notice admin-error" style={{ margin: '10px 0' }}><strong>Error</strong><span>{error}</span></div>}

      {editing && (
        <div className="admin-form-card plan-management-form">
          <div className="form-grid">
            <label><span>Plan name</span><input value={String(editing.name || '')} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Professional" /></label>
            <label><span>Price (₹)</span><input type="number" min={0} step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></label>
            <label><span>Duration (days)</span><input type="number" min={1} value={editing.durationDays ?? 30} onChange={(e) => setEditing({ ...editing, durationDays: Number(e.target.value) })} /></label>
            <label><span>Access level</span><select value={editing.accessLevel || 'FULL'} onChange={(e) => setEditing({ ...editing, accessLevel: e.target.value as Plan['accessLevel'] })}><option value="FULL">FULL</option><option value="READONLY">READONLY</option><option value="LOCKED">LOCKED</option></select></label>
            <label className="form-grid-full"><span>Description</span><textarea rows={3} value={String(editing.description || '')} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What this plan includes" /></label>
          </div>
          <div className="plan-limits-form">
            {editNumber('maxGroups')}
            {editNumber('maxMembersPerGroup')}
            {editNumber('maxCommunities')}
            {editNumber('maxGuestsPerGroup')}
          </div>
          <label className="check-row" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
            Active plan
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="primary" type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create plan'}</button>
            <button className="secondary" type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {plans === null && <p>Loading plans…</p>}
      {plans?.length === 0 && !error && <p>No plans found.</p>}

      {plans?.map((plan) => (
        <div className="table-row plan-row" key={plan.id}>
          <div className="plan-row-main">
            <div className="plan-row-title">
              <strong>{plan.name}</strong>
              <span className={plan.isActive ? 'plan-status active' : 'plan-status'}>{plan.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <small>{plan.description || 'No description'} · {plan.durationDays ?? '—'} days · {plan.accessLevel || 'FULL'} · ₹{String(plan.price ?? '0')}</small>
          </div>
          <div className="plan-row-limits">
            <span>Groups: {plan.maxGroups ?? '∞'}</span>
            <span>Members: {plan.maxMembersPerGroup ?? '∞'}</span>
            <span>Communities: {plan.maxCommunities ?? '∞'}</span>
            <span>Guests: {plan.maxGuestsPerGroup ?? '∞'}</span>
          </div>
          <button className="icon-btn" type="button" disabled={saving} onClick={() => beginEdit(plan)}>Edit</button>
          <button className="icon-btn" type="button" disabled={saving} onClick={() => void togglePlan(plan)}>{plan.isActive ? 'Deactivate' : 'Activate'}</button>
        </div>
      ))}
    </div>
  )
}


function PaymentMethodsPanel() {
  const [methods, setMethods] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = () => api.paymentMethods().then(r => setMethods(r.data.paymentMethods || [])).catch(e => setMessage(e?.message || 'Unable to load payment methods'))
  useEffect(() => { load() }, [])
  async function save() {
    if (!editing?.name?.trim()) { setMessage('Payment method name is required.'); return }
    setBusy(true); setMessage('')
    try {
      if (editing.id) await api.updatePaymentMethod(editing.id, { name: editing.name.trim(), type: editing.type || 'UPI', description: editing.description || undefined, upiId: editing.upiId || undefined, paymentNumber: editing.paymentNumber || undefined, isDefault: Boolean(editing.isDefault), isActive: editing.isActive !== false })
      else await api.createPaymentMethod({ name: editing.name.trim(), type: editing.type || 'UPI', description: editing.description || undefined, upiId: editing.upiId || undefined, paymentNumber: editing.paymentNumber || undefined, isDefault: Boolean(editing.isDefault) })
      setEditing(null); await load(); setMessage('Payment method saved.')
    } catch (e:any) { setMessage(e?.message || 'Unable to save payment method') } finally { setBusy(false) }
  }
  async function makeDefault(method:any) { try { await api.updatePaymentMethod(method.id, { isDefault: true, isActive: true }); await load() } catch(e:any){ setMessage(e?.message || 'Unable to set default method') } }
  return <div className="admin-table" style={{marginTop:16}}><div className="table-head"><strong>Payment methods</strong><button className="primary" onClick={()=>setEditing({name:'UPI',type:'UPI',description:'',upiId:'',paymentNumber:'',isDefault:true,isActive:true})}>Add method</button></div>{message&&<div className="notice" style={{margin:'10px 0'}}><span>{message}</span></div>}{methods.map(m=><div className="table-row payment-method-row" key={m.id}><div><strong>{m.name} {m.isDefault&&<span className="pending">Default</span>}</strong><small>{m.type} · {m.upiId || m.paymentNumber || 'No payment address configured'}</small></div><button className="icon-btn" onClick={()=>setEditing({...m})}>Edit</button>{!m.isDefault&&<button className="icon-btn" onClick={()=>makeDefault(m)}>Make default</button>}</div>)}{editing&&<div className="admin-form-card"><div className="form-grid"><label><span>Name</span><input value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label><span>Type</span><select value={editing.type||'UPI'} onChange={e=>setEditing({...editing,type:e.target.value})}><option>UPI</option><option>BANK</option><option>OTHER</option></select></label><label><span>UPI ID</span><input value={editing.upiId||''} onChange={e=>setEditing({...editing,upiId:e.target.value})} placeholder="example@upi"/></label><label><span>Payment number</span><input value={editing.paymentNumber||''} onChange={e=>setEditing({...editing,paymentNumber:e.target.value})}/></label><label className="form-grid-full"><span>Description</span><input value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})}/></label></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}><button className="primary" disabled={busy} onClick={save}>{busy?'Saving…':'Save method'}</button><button className="icon-btn" onClick={()=>setEditing(null)}>Cancel</button></div></div>}</div>
}

function SiteSettingsPanel() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const defaults: Record<string, unknown> = {
    'site.name': 'FedChat',
    'site.tagline': 'Secure real-time conversations',
    'site.description': 'A modern messaging platform for direct chats, groups and communities.',
    'site.supportEmail': '',
    'site.guestJoinEnabled': true,
    'site.registrationEnabled': true,
    'site.primaryColor': '#168a57',
    'site.accentColor': '#1da968',
    'site.maintenanceMode': false,
  }

  const load = () => {
    setLoading(true)
    api.siteSettings()
      .then((r) => {
        const next: Record<string, unknown> = { ...defaults }
        for (const item of r.data.settings || []) next[String(item.key)] = item.value
        setSettings(next)
      })
      .catch((e: any) => setMessage(e?.message || 'Unable to load site settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function save(key: string) {
    setSaving(key)
    setMessage('')
    try {
      await api.updateSiteSetting(key, settings[key])
      setMessage('Site setting saved.')
    } catch (e: any) {
      setMessage(e?.message || 'Unable to save site setting')
    } finally {
      setSaving(null)
    }
  }

  const textField = (key: string, label: string, placeholder = '') => (
    <label>
      <span>{label}</span>
      <input value={String(settings[key] ?? '')} placeholder={placeholder} onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))} />
      <button className="icon-btn" disabled={saving === key} type="button" onClick={() => void save(key)}>{saving === key ? 'Saving…' : 'Save'}</button>
    </label>
  )

  const toggleField = (key: string, label: string, description: string) => (
    <div className="site-setting-toggle">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <button type="button" className={settings[key] ? 'toggle on' : 'toggle'} onClick={() => setSettings((p) => ({ ...p, [key]: !p[key] }))} aria-pressed={Boolean(settings[key])}>
        <span />
      </button>
      <button className="icon-btn" disabled={saving === key} type="button" onClick={() => void save(key)}>{saving === key ? 'Saving…' : 'Save'}</button>
    </div>
  )

  return <div className="admin-table site-settings-panel" style={{ marginTop: 16 }}>
    <div className="table-head">
      <div>
        <strong>Site settings</strong>
        <small>Branding, registration, guest access and maintenance controls.</small>
      </div>
      <button className="secondary" type="button" onClick={load}>Refresh</button>
    </div>
    {message && <div className="notice" style={{ margin: '10px 0' }}><span>{message}</span></div>}
    {loading ? <p>Loading settings…</p> : <>
      <div className="site-setting-grid">
        {textField('site.name', 'Site name')}
        {textField('site.tagline', 'Tagline')}
        {textField('site.supportEmail', 'Support email', 'support@example.com')}
        {textField('site.description', 'Site description')}
        {textField('site.primaryColor', 'Primary color', '#168a57')}
        {textField('site.accentColor', 'Accent color', '#1da968')}
      </div>
      <div className="site-setting-toggles">
        {toggleField('site.guestJoinEnabled', 'Guest join links', 'Allow public group links to create read-only guest accounts.')}
        {toggleField('site.registrationEnabled', 'User registration', 'Allow new users to create standard accounts.')}
        {toggleField('site.maintenanceMode', 'Maintenance mode', 'Display the platform as temporarily unavailable to normal users.')}
      </div>
    </>}
  </div>
}

/* =========================================================
   ADMIN MODULE
========================================================= */

export function AdminModule({
  initialSection = 'overview',
  onSectionChange,
}: {
  initialSection?: AdminSection
  onSectionChange?: (section: AdminSection) => void
}) {
  const [adminTab, setAdminTab] = useState<AdminSection>(initialSection)

  function jumpTo(tab: AdminSection, id: string) {
    setAdminTab(tab)
    onSectionChange?.(tab)
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null)

  const [requests, setRequests] =
    useState<PaymentRequest[] | null>(null)

  const [users, setUsers] =
    useState<AdminUser[] | null>(null)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)
  const [userTotal, setUserTotal] = useState(0)
  const [userTotalPages, setUserTotalPages] = useState(1)

  const [error, setError] =
    useState<string | null>(null)

  const [busy, setBusy] =
    useState<string | null>(null)

  function loadUsers(page = userPage, pageSize = userPageSize) {
    api
      .adminUsers(page, pageSize)
      .then((r) => {
        setUsers(r.data.users || [])
        setUserTotal(r.data.total || 0)
        setUserTotalPages(r.data.totalPages || 1)
      })
      .catch(() => {
        setUsers([])
        setUserTotal(0)
        setUserTotalPages(1)
      })
  }

  useEffect(() => {
    loadUsers(userPage, userPageSize)
  }, [userPage, userPageSize])

  useEffect(() => {
    setAdminTab(initialSection)
  }, [initialSection])

  function load() {
    setError(null)

    api
      .adminAnalytics()
      .then((r) => {
        setAnalytics(r.data.analytics)
      })
      .catch((e) => {
        setError(
          e?.message ||
            'Failed to load analytics'
        )
      })

    api
      .pendingPaymentRequests()
      .then((r) => {
        setRequests(
          r.data.paymentRequests || []
        )
      })
      .catch(() => {
        setRequests([])
      })

    loadUsers()
  }

  useEffect(() => {
    const refresh = () => {
      load()
    }

    const timeout = window.setTimeout(
      refresh,
      0
    )

    return () => window.clearTimeout(timeout)
  }, [])

  async function approve(id: string) {
    setBusy(id)
    setError(null)

    try {
      await api.approvePaymentRequest(id)

      load()
    } catch (e: any) {
      setError(
        e?.message ||
          'Failed to approve payment request'
      )
    } finally {
      setBusy(null)
    }
  }

  async function reject(id: string) {
    const reason = window.prompt(
      'Rejection reason (required):'
    )

    if (!reason || reason.trim().length < 3) {
      return
    }

    setBusy(id)
    setError(null)

    try {
      await api.rejectPaymentRequest(
        id,
        reason.trim()
      )

      load()
    } catch (e: any) {
      setError(
        e?.message ||
          'Failed to reject payment request'
      )
    } finally {
      setBusy(null)
    }
  }

  async function toggleUser(
    user: AdminUser
  ) {
    const nextStatus =
      user.status === 'ACTIVE'
        ? 'SUSPENDED'
        : 'ACTIVE'

    setBusy(user.id)
    setError(null)

    try {
      await api.adminUpdateUserStatus(
        user.id,
        nextStatus
      )

      setUsers((previous) =>
        previous?.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        ) || null
      )
    } catch (e: any) {
      setError(
        e?.message ||
          'Failed to update user status'
      )
    } finally {
      setBusy(null)
    }
  }

  const stats: [
    string,
    string | number,
    string
  ][] = analytics
    ? [
        [
          'Users',
          analytics.users,
          `${analytics.activeUsers24h} active in 24h`,
        ],
        [
          'Subscriptions',
          analytics.subscriptions,
          `${analytics.pendingPayments} pending payments`,
        ],
        [
          'Rooms',
          analytics.rooms,
          'Direct + group',
        ],
        [
          'Messages',
          analytics.messages,
          'Total sent',
        ],
      ]
    : []

  return (
    <div className="page-module">
      <div className="page-header">
        <div>
          <h2>Platform Admin</h2>

          <p>
            Manage users, plans, subscriptions,
            payments and website settings.
          </p>
        </div>

        <span className="admin-badge">
          PLATFORM ADMIN
        </span>
      </div>

      <nav className="admin-subnav" aria-label="Admin console sections">
        {([
          ['overview','Overview','admin-overview'],
          ['payments','Payments','admin-payments'],
          ['users','Users','admin-users'],
          ['plans','Plans','admin-plans'],
          ['media','Media','admin-media'],
          ['site','Site settings','admin-site'],
        ] as const).map(([tab, label, id]) => (
          <button key={tab} className={adminTab === tab ? 'admin-subnav-item active' : 'admin-subnav-item'} type="button" onClick={() => jumpTo(tab, id)}>{label}</button>
        ))}
      </nav>

      {error && (
        <div className="notice">
          <strong>
            Could not load dashboard
          </strong>

          <span>{error}</span>

          <button onClick={load}>
            Retry
          </button>
        </div>
      )}

      {!error && !analytics && (
        <p>Loading dashboard…</p>
      )}

      <div id="admin-overview" className="admin-anchor" />

      {analytics && (
        <div className="stats-grid">
          {stats.map(
            ([title, value, description]) => (
              <div
                className="stat-card"
                key={title}
              >
                <span>{title}</span>

                <strong>{value}</strong>

                <small>
                  {description}
                </small>
              </div>
            )
          )}
        </div>
      )}

      {/* =====================================================
          PAYMENT REQUESTS
      ====================================================== */}

      <div id="admin-payments" className="admin-table admin-section-card">
        <div className="table-head">
          <strong>
            Pending subscription requests
          </strong>
        </div>

        {requests === null && (
          <p>Loading…</p>
        )}

        {requests !== null &&
          requests.length === 0 && (
            <p>
              No pending requests.
            </p>
          )}

        {requests?.map((request) => (
          <div
            className="table-row"
            key={request.id}
          >
            <div className="avatar">
              {request.user.firstName?.[0] ||
                '?'}
            </div>

            <div>
              <strong>
                {request.user.firstName}{' '}
                {request.user.lastName} ·{' '}
                {request.plan.name}
              </strong>

              <small>
                Manual payment verification
                required
                {request.transactionId
                  ? ` · Ref: ${request.transactionId}`
                  : ''}
              </small>
            </div>

            <span className="pending">
              Pending
            </span>

            <button
              className="icon-btn"
              disabled={
                busy === request.id
              }
              onClick={() =>
                approve(request.id)
              }
            >
              Approve
            </button>

            <button
              className="icon-btn"
              disabled={
                busy === request.id
              }
              onClick={() =>
                reject(request.id)
              }
            >
              Reject
            </button>
          </div>
        ))}
      </div>

      <div className="admin-anchor" id="admin-payment-methods" />
      <PaymentMethodsPanel />

      <div id="admin-site" className="admin-anchor" />
      <SiteSettingsPanel />

      {/* =====================================================
          USERS
      ====================================================== */}

      <div id="admin-users" className="admin-table admin-section-card" style={{ marginTop: 16 }}
      >
        <div className="table-head">
          <div>
            <strong>Users</strong>
            <small>{userTotal} total users · page {userPage} of {userTotalPages}</small>
          </div>
          <label className="page-size-select"><span>Rows</span><select value={userPageSize} onChange={(e) => { setUserPage(1); setUserPageSize(Number(e.target.value)) }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
        </div>

        {users === null && (
          <p>Loading…</p>
        )}

        {users !== null &&
          users.length === 0 && (
            <p>No users found.</p>
          )}

        {users
          ?.map((user) => (
            <div
              className="table-row"
              key={user.id}
            >
              <div className="avatar">
                {user.firstName?.[0] || '?'}
              </div>

              <div>
                <strong>
                  {user.firstName}{' '}
                  {user.lastName}
                </strong>

                <small>
                  @{user.username}
                </small>
              </div>

              <span
                className={
                  user.status === 'ACTIVE'
                    ? 'pending'
                    : ''
                }
              >
                {user.status}
              </span>

              <button
                className="icon-btn"
                disabled={
                  busy === user.id
                }
                onClick={() =>
                  toggleUser(user)
                }
              >
                {user.status === 'ACTIVE'
                  ? 'Suspend'
                  : 'Activate'}
              </button>
            </div>
          ))}
      <div className="users-pagination">
        <button className="secondary" type="button" disabled={userPage <= 1} onClick={() => setUserPage((page) => Math.max(1, page - 1))}>Previous</button>
        <div>
          <strong>Page {userPage}</strong>
          <span>of {userTotalPages}</span>
        </div>
        <button className="secondary" type="button" disabled={userPage >= userTotalPages} onClick={() => setUserPage((page) => Math.min(userTotalPages, page + 1))}>Next</button>
      </div>

      </div>

      {/* =====================================================
          PLAN MANAGEMENT
      ====================================================== */}

      <div id="admin-plans" className="admin-anchor" />
      <PlanManagementPanel />

      {/* =====================================================
          MEDIA BACKUP
      ====================================================== */}

      <div id="admin-media" className="admin-anchor" />
      <MediaBackupPanel />
    </div>
  )
}