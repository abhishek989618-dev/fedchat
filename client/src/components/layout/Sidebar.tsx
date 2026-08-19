import type { AdminSection, Section } from '../../types/app'
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
  brandName = 'FedChat',
  adminSection = 'overview',
  onAdminSectionChange,
}: {
  active: Section
  onChange: (s: Section) => void
  open: boolean
  canAdmin: boolean
  user: User
  brandName?: string
  adminSection?: AdminSection
  onAdminSectionChange?: (section: AdminSection) => void
}) {
  const base = user.role === 'guest' ? guestItems : items
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
        {base.map(([id, label, icon]) => (
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

        {canAdmin && (
          <div className="admin-sidebar-group">
            <button
              type="button"
              className={active === 'admin' ? 'nav-item active admin-parent' : 'nav-item admin-parent'}
              onClick={() => onChange('admin')}
              aria-expanded={active === 'admin'}
            >
              <span className="nav-item-icon"><Icon name="settings" /></span>
              <span>Admin Console</span>
              <span className="admin-chevron">{active === 'admin' ? '▾' : '▸'}</span>
            </button>

            {active === 'admin' && (
              <div className="admin-sidebar-subnav">
                {([
                  ['overview', 'Overview', 'settings'],
                  ['payments', 'Payments', 'bell'],
                  ['users', 'Users', 'users'],
                  ['plans', 'Plans', 'group'],
                  ['media', 'Media', 'paperclip'],
                  ['site', 'Site settings', 'settings'],
                ] as [AdminSection, string, string][]).map(([section, label, icon]) => (
                  <button
                    key={section}
                    type="button"
                    className={adminSection === section ? 'admin-sidebar-subitem active' : 'admin-sidebar-subitem'}
                    onClick={() => {
                      onChange('admin')
                      onAdminSectionChange?.(section)
                    }}
                  >
                    <span><Icon name={icon} width={15} height={15} /></span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
