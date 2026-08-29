import type { Section } from '../../types/app'
import { Icon } from '../ui/Icon'

const items: [Section, string, string][] = [
  ['chats', 'Chats', 'chat'],
  ['contacts', 'Contacts', 'users'],
  ['status', 'Status', 'status'],
  ['notifications', 'Notifications', 'bell'],
  ['settings', 'Profile', 'settings'],
]

export function MobileNav({ active, onChange }: { active: Section; onChange: (section: Section) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          className={active === id ? 'mobile-nav-item active' : 'mobile-nav-item'}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <span className="mobile-nav-icon"><Icon name={icon} width={18} height={18} /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
