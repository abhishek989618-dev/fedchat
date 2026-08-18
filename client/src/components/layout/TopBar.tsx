import { Icon } from '../ui/Icon'

export function TopBar({
  title,
  subtitle,
  onMenu
}: {
  title: string
  subtitle?: string
  onMenu: () => void
}) {
  return (
    <header className="topbar">
      <button className="mobile-menu icon-btn" type="button" onClick={onMenu} aria-label="Open navigation">
        <Icon name="menu" />
      </button>

      <div className="topbar-heading">
        <div className="topbar-kicker">FEDCHAT</div>
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>

      <div className="top-actions" aria-hidden="true">
        <span className="topbar-status"><i /> Live workspace</span>
        <div className="mini-avatar">FC</div>
      </div>
    </header>
  )
}
