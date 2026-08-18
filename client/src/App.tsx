import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { AdminModule } from './modules/admin/AdminModule'
import { ChatModule } from './modules/chat/ChatModule'
import { CommunitiesModule } from './modules/communities/CommunitiesModule'
import { ContactsModule } from './modules/contacts/ContactsModule'
import { GroupsModule } from './modules/groups/GroupsModule'
import { NotificationsModule } from './modules/notifications/NotificationsModule'
import { SettingsModule } from './modules/settings/SettingsModule'
import { SupportModule } from './modules/support/SupportModule'
import { StatusModule } from './modules/status/StatusModule'
import { SubscriptionsModule } from './modules/subscriptions/SubscriptionsModule'
import { AuthModule } from './modules/auth/AuthModule'
import type { Section } from './types/app'
import { clearSession, createSocket, getSession } from './lib'
import type { Socket } from 'socket.io-client'
import { useApplySiteSettings, useSiteSettings } from './hooks/useSiteSettings'

const titles: Record<Section, [string, string]> = {
  chats: ['Chats', 'Real-time conversations'], contacts: ['Contacts', 'People you can message'], status: ['Status', 'Share updates with your contacts'],
  groups: ['Groups', 'Paid-plan group management'], communities: ['Communities', 'Announcements and multiple groups'], notifications: ['Notifications', 'Messages and platform alerts'],
  subscriptions: ['Plans & Billing', 'Manual subscription approval'], settings: ['Settings', 'Account, privacy and chat settings'], support: ['Help & Legal', 'How to use FedChat, contact support and review policies'], admin: ['Admin Console', 'Platform administration']
}

function App() {
  const { settings: siteSettings } = useSiteSettings()
  useApplySiteSettings(siteSettings)
  const [session, setSession] = useState(getSession())
  const [active, setActive] = useState<Section>('chats')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [requestedRoomId, setRequestedRoomId] = useState('')
  const [requestedGroupId, setRequestedGroupId] = useState('')

  useEffect(() => {
    const onOpenRoom = (event: Event) => {
      const roomId = String((event as CustomEvent).detail?.roomId ?? '')
      if (roomId) setRequestedRoomId(roomId)
      setActive('chats')
    }
    const onManageGroup = (event: Event) => {
      const roomId = String((event as CustomEvent).detail?.roomId ?? '')
      if (!roomId) return
      setRequestedGroupId(roomId)
      setActive('groups')
    }
    window.addEventListener('fedchat:open-room', onOpenRoom)
    window.addEventListener('fedchat:manage-group', onManageGroup)
    return () => {
      window.removeEventListener('fedchat:open-room', onOpenRoom)
      window.removeEventListener('fedchat:manage-group', onManageGroup)
    }
  }, [])

  // Single Socket.IO connection for the whole session — passed down to
  // whichever module needs it (chat, presence, notifications, etc.)
  // instead of each module opening its own connection.
  useEffect(() => {
    if (!session) { setSocket(null); return }
    const s = createSocket()
    if (!s) return
    setSocket(s)
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    return () => { s.off('connect', onConnect); s.off('disconnect', onDisconnect); s.disconnect(); setSocket(null) }
  }, [session])

  const canAdmin = session?.user?.role === 'platform_admin'
  const visibleSection = canAdmin || active !== 'admin' ? active : 'chats'
  const title = titles[visibleSection]
  const content = useMemo(() => {
    switch (visibleSection) {
      case 'chats': return <ChatModule socket={socket} initialRoomId={requestedRoomId} />
      case 'contacts': return <ContactsModule />
      case 'status': return <StatusModule />
      case 'groups': return <GroupsModule initialGroupId={requestedGroupId} onNavigateToPlans={() => setActive('subscriptions')} />
      case 'communities': return <CommunitiesModule onNavigateToPlans={() => setActive('subscriptions')} />
      case 'notifications': return <NotificationsModule socket={socket} />
      case 'subscriptions': return <SubscriptionsModule />
      case 'settings': return <SettingsModule />
      case 'support': return <SupportModule siteSettings={siteSettings} />
      case 'admin': return canAdmin ? <AdminModule /> : <ChatModule socket={socket} />
    }
  }, [visibleSection, canAdmin, socket, requestedRoomId, requestedGroupId, siteSettings])

  if (!session) return <AuthModule onLogin={() => setSession(getSession())} />

  return (
    <div className="app-shell" style={{ ['--site-primary' as any]: siteSettings.primaryColor, ['--site-accent' as any]: siteSettings.accentColor }}>
      {siteSettings.maintenanceMode && session.user.role !== 'platform_admin' && (
        <div className="maintenance-banner" role="status"><strong>{siteSettings.name} is in maintenance mode</strong><span>Some features may be temporarily unavailable.</span></div>
      )}
      <Sidebar active={visibleSection} onChange={(section) => { setActive(section); setMobileOpen(false) }} open={mobileOpen} canAdmin={canAdmin} user={session.user} brandName={siteSettings.name} />
      {mobileOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="main">
        <TopBar title={title[0]} subtitle={title[1]} onMenu={() => setMobileOpen(v => !v)} />
        {session.user.role === 'guest' && (
          <div className="notice" style={{ margin: '0 16px' }}>
            <strong>Guest account</strong>
            <span>You have limited access and this expires {session.user.guestExpiresAt ? `on ${new Date(session.user.guestExpiresAt).toLocaleString()}` : 'soon'}. Create a free account to keep your access.</span>
            <button onClick={() => { clearSession(); setSession(null) }}>Create account</button>
          </div>
        )}
        <div className="connection-bar">
          <span className={connected ? 'status-dot online' : 'status-dot'} />
          <span>{connected ? 'Connected securely' : 'Connecting to realtime…'}</span>
          <span className="connection-bar-spacer" />
          <button className="connection-logout" onClick={() => { clearSession(); setSession(null) }}>Sign out</button>
        </div>
        <div className="content-area">{content}</div>
      </main>
    </div>
  )
}
export default App
