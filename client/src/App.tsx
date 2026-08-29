import { useEffect, useState } from 'react'
import './App.css'
import './premium-ui.css'
import './redesign-phase1.css'


import {
  AppShell,
  type AppNavKey,
} from './components/layout/AppShell'

import { AuthModule } from './modules/auth/AuthModule'
import { AdminModule } from './modules/admin/AdminModule'
import { ChatModule } from './modules/chat/ChatModule'
import { CommunitiesModule } from './modules/communities/CommunitiesModule'
import { ContactsModule } from './modules/contacts/ContactsModule'
import { GroupsModule } from './modules/groups/GroupsModule'
import { NotificationsModule } from './modules/notifications/NotificationsModule'
import { SettingsModule } from './modules/settings/SettingsModule'
import { StatusModule } from './modules/status/StatusModule'
import { SubscriptionsModule } from './modules/subscriptions/SubscriptionsModule'
import { SupportModule } from './modules/support/SupportModule'
import { PublicHomePage } from './pages/PublicHomePage'

import type {
  AdminSection,
  Section,
} from './types/app'

import {
  api,
  clearSession,
  createSocket,
  getSession,
} from './lib'

import type { Socket } from 'socket.io-client'

import {
  useApplySiteSettings,
  useSiteSettings,
} from './hooks/useSiteSettings'

function mapSectionToNav(
  section: Section,
): AppNavKey {
  switch (section) {
    case 'chats':
      return 'chats'

    case 'contacts':
      return 'contacts'

    case 'status':
      return 'status'

    case 'groups':
      return 'groups'

    case 'communities':
      return 'communities'

    case 'notifications':
      return 'notifications'

    case 'subscriptions':
      return 'billing'

    case 'settings':
      return 'settings'

    case 'support':
      return 'help'

    case 'admin':
      return 'admin'

    default:
      return 'chats'
  }
}

function mapNavToSection(
  nav: AppNavKey,
): Section {
  switch (nav) {
    case 'chats':
      return 'chats'

    case 'contacts':
      return 'contacts'

    case 'status':
      return 'status'

    case 'groups':
      return 'groups'

    case 'communities':
      return 'communities'

    case 'notifications':
      return 'notifications'

    case 'billing':
      return 'subscriptions'

    case 'settings':
      return 'settings'

    case 'help':
      return 'support'

    case 'admin':
      return 'admin'

    default:
      return 'chats'
  }
}

function App() {
  const { settings: siteSettings } =
    useSiteSettings()

  useApplySiteSettings(siteSettings)

  const [session, setSession] =
    useState(getSession())

  const [active, setActive] =
    useState<Section>('chats')

  const [adminSection, setAdminSection] =
    useState<AdminSection>('overview')

  const [socket, setSocket] =
    useState<Socket | null>(null)

  const [requestedRoomId, setRequestedRoomId] =
    useState('')

  const [requestedGroupId, setRequestedGroupId] =
    useState('')
const [showAuth, setShowAuth] =
  useState(false)
  /*
   * -------------------------------------------------------
   * USER PREFERENCES
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!session) {
      document.documentElement.removeAttribute(
        'data-user-theme',
      )

      document.documentElement.lang =
        siteSettings.language || 'en'

      return
    }

    let cancelled = false

    void api
      .getUserPreferences()
      .then((response) => {
        if (cancelled) {
          return
        }

        const preferences =
          response.data.preferences || {}

        if (
          preferences.theme === 'dark' ||
          preferences.theme === 'light'
        ) {
          document.documentElement.dataset.userTheme =
            preferences.theme
        } else {
          document.documentElement.removeAttribute(
            'data-user-theme',
          )
        }

        document.documentElement.lang =
          preferences.language ||
          siteSettings.language ||
          'en'
      })
      .catch(() => {
        if (!cancelled) {
          document.documentElement.lang =
            siteSettings.language || 'en'
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    session,
    siteSettings.language,
  ])

  /*
   * -------------------------------------------------------
   * GLOBAL OPEN-ROOM / MANAGE-GROUP EVENTS
   * -------------------------------------------------------
   */

  useEffect(() => {
    const handleOpenRoom = (
      event: Event,
    ) => {
      const roomId = String(
        (
          event as CustomEvent<{
            roomId?: string
          }>
        ).detail?.roomId ?? '',
      )

      if (!roomId) {
        return
      }

      setRequestedRoomId(roomId)
      setActive('chats')
    }

    const handleManageGroup = (
      event: Event,
    ) => {
      const roomId = String(
        (
          event as CustomEvent<{
            roomId?: string
          }>
        ).detail?.roomId ?? '',
      )

      if (!roomId) {
        return
      }

      setRequestedGroupId(roomId)
      setActive('groups')
    }

    window.addEventListener(
      'fedchat:open-room',
      handleOpenRoom,
    )

    window.addEventListener(
      'fedchat:manage-group',
      handleManageGroup,
    )

    return () => {
      window.removeEventListener(
        'fedchat:open-room',
        handleOpenRoom,
      )

      window.removeEventListener(
        'fedchat:manage-group',
        handleManageGroup,
      )
    }
  }, [])

  /*
   * -------------------------------------------------------
   * SINGLE SOCKET CONNECTION
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!session) {
      setSocket(null)
      return
    }

    const socketInstance =
      createSocket()

    if (!socketInstance) {
      setSocket(null)
      return
    }

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [session])

  /*
   * -------------------------------------------------------
   * AUTH
   * -------------------------------------------------------
   */

  if (!session) {
  if (!showAuth) {
    return (
      <PublicHomePage
        onLogin={() =>
          setShowAuth(true)
        }
      />
    )
  }

  return (
    <AuthModule
      onLogin={() =>
        setSession(
          getSession(),
        )
      }
    />
  )
}
  /*
   * -------------------------------------------------------
   * ACCESS
   * -------------------------------------------------------
   */

  const canAdmin =
    session.user?.role ===
    'platform_admin'

  const visibleSection: Section =
    active === 'admin' && !canAdmin
      ? 'chats'
      : active

  const displayName =
    [
      session.user?.firstName,
      session.user?.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    session.user?.username ||
    'FedChat User'

  const username =
    session.user?.username || undefined

  const avatar =
    session.user?.avatar || null

  /*
   * -------------------------------------------------------
   * NAVIGATION
   * -------------------------------------------------------
   */

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <AppShell
   activeNav={mapSectionToNav(visibleSection)}
  isPlatformAdmin={canAdmin}
  onNavigate={(nav) => {
    const nextSection = mapNavToSection(nav)

    if (nextSection === 'admin' && !canAdmin) {
      setActive('chats')
      return
    }

    setActive(nextSection)
  }}
  siteSettings={{
    name: siteSettings.name,
    tagline: siteSettings.tagline,
    logoUrl: siteSettings.logoUrl
      ? siteSettings.logoUrl
      : null,
  }}
  onLogout={() => {
    clearSession()
    setSession(null)
    setActive('chats')
    setRequestedRoomId('')
    setRequestedGroupId('')
  }}
      unreadNotifications={0}
      unreadChats={0}
      user={{
        name: displayName,
        username,
        avatar,
        status: 'online',
      }}
    >
      {/* ================================================
          MAINTENANCE NOTICE
          ================================================ */}

      {siteSettings.maintenanceMode &&
        session.user?.role !==
          'platform_admin' && (
          <div
            className="maintenance-banner"
            role="status"
          >
            <strong>
              {siteSettings.name} is in
              maintenance mode
            </strong>

            <span>
              Some features may be
              temporarily unavailable.
            </span>
          </div>
        )}

      {/* ================================================
          GUEST NOTICE
          ================================================ */}

      {session.user?.role === 'guest' && (
        <div className="notice">
          <strong>
            Guest account
          </strong>

          <span>
            You have limited access and
            this expires{' '}
            {session.user
              ?.guestExpiresAt
              ? new Date(
                  session.user.guestExpiresAt,
                ).toLocaleString()
              : 'soon'}
            .
          </span>

          <button
            type="button"
            onClick={() => {
              clearSession()
              setSession(null)
            }}
          >
            Create account
          </button>
        </div>
      )}

      {/* ================================================
          CHATS
          ================================================ */}

      {visibleSection === 'chats' && (
        <ChatModule
          socket={socket}
          initialRoomId={
            requestedRoomId
          }
        />
      )}

      {/* ================================================
          CONTACTS
          ================================================ */}

      {visibleSection === 'contacts' && (
        <ContactsModule />
      )}

      {/* ================================================
          STATUS
          ================================================ */}

      {visibleSection === 'status' && (
  <StatusModule
    onBack={() => {
      setActive('chats')
    }}
  />
)}

      {/* ================================================
          GROUPS
          ================================================ */}

      {visibleSection === 'groups' && (
        <GroupsModule
          initialGroupId={
            requestedGroupId
          }
          onNavigateToPlans={() =>
            setActive(
              'subscriptions',
            )
          }
        />
      )}

      {/* ================================================
          COMMUNITIES
          ================================================ */}

      {visibleSection ===
        'communities' && (
        <CommunitiesModule
          onNavigateToPlans={() =>
            setActive(
              'subscriptions',
            )
          }
        />
      )}

      {/* ================================================
          NOTIFICATIONS
          ================================================ */}

      {visibleSection ===
        'notifications' && (
        <NotificationsModule
          socket={socket}
        />
      )}

      {/* ================================================
          SUBSCRIPTIONS
          ================================================ */}

      {visibleSection ===
        'subscriptions' && (
        <SubscriptionsModule />
      )}

      {/* ================================================
          SETTINGS
          ================================================ */}

      {visibleSection ===
        'settings' && (
        <SettingsModule />
      )}

      {/* ================================================
          SUPPORT
          ================================================ */}

      {visibleSection === 'support' && (
        <SupportModule
          siteSettings={
            siteSettings
          }
        />
      )}

      {/* ================================================
          ADMIN
          ================================================ */}

      {visibleSection === 'admin' &&
        canAdmin && (
          <AdminModule
            initialSection={
              adminSection
            }
            onSectionChange={
              setAdminSection
            }
          />
        )}
    </AppShell>
  )
}

export default App