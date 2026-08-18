import type { Section } from '../../types/app'
import type { User } from '../../lib'
import { Icon } from '../ui/Icon'
import { assetUrl } from '../../lib'

const items: [Section, string, string][] = [
  ['chats','Chats','chat'],
  ['contacts','Contacts','users'],
  ['status','Status','status'],
  ['groups','Groups','group'],
  ['communities','Communities','group'],
  ['notifications','Notifications','bell'],
  ['subscriptions','Plans & Billing','bell'],
  ['settings','Settings','settings'],
  ['support','Help & Legal','phone']
]

const guestItems: [Section, string, string][] = [
  ['chats','Chats','chat'],
  ['notifications','Notifications','bell']
]

function initials(user: User) {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
}

export function Sidebar({
  active,
  onChange,
  open,
  canAdmin,
  user,
  brandName = 'FedChat'
}: {
  active: Section
  onChange: (s: Section) => void
  open: boolean
  canAdmin: boolean
  user: User
  brandName?: string
}) {
  const base = user.role === 'guest' ? guestItems : items
  const all = canAdmin
    ? [...base, ['admin', 'Admin Console', 'settings'] as [Section, string, string]]
    : base

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span className="brand-mark">{brandName.slice(0, 1).toUpperCase()}</span>
        <div className="brand-copy">
          <strong>{brandName}</strong>
          <span>Connected workspace</span>
        </div>
      </div>

      <div className="sidebar-section-label">Workspace</div>

      <nav className="nav" aria-label="Primary navigation">
        {all.map(([id, label, icon]) => (
          <button
            type="button"
            className={active === id ? 'nav-item active' : 'nav-item'}
            onClick={() => onChange(id)}
            key={id}
            aria-current={active === id ? 'page' : undefined}
          >
            <span className="nav-item-icon"><Icon name={icon} /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="avatar small">
          {user.avatar ? (
            <img
              src={assetUrl(user.avatar)}
              alt=""
              onError={(event) => { event.currentTarget.style.display = 'none' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : initials(user)}
        </div>
        <div className="sidebar-user-copy">
          <strong>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}</strong>
          <span>{user.role === 'platform_admin' ? 'Platform admin' : user.role === 'guest' ? 'Guest access' : 'Available'}</span>
        </div>
        <span className="presence-pill"><i />Live</span>
      </div>
    </aside>
  )
}
