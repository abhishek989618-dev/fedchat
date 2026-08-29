import { useState } from 'react'
import {
  AppShell,
  type AppNavKey,
} from '../components/layout/AppShell'
import { ChatWorkspace } from '../modules/chat/components/ChatWorkspace'
import { ConversationList } from '../modules/chat/components/ConversationList'
import { ChatWindowPlaceholder } from '../modules/chat/components/ChatWindowPlaceholder'

export function AppShellTest() {
  const [activeNav, setActiveNav] =
    useState<AppNavKey>('chats')

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={setActiveNav}
      unreadChats={3}
      unreadNotifications={2}
      user={{
        name: 'Abhishek',
        username: 'abhishek',
        status: 'online',
      }}
    >
      {activeNav === 'chats' ? (
  <ChatWorkspace
    conversationList={(onSelectConversation) => (
      <ConversationList
        onSelectConversation={
          onSelectConversation
        }
      />
    )}

    chatWindow={(
      selectedConversationId,
      onBack,
    ) => (
      <ChatWindowPlaceholder
        conversationId={
          selectedConversationId
        }
        onBack={onBack}
      />
    )}
  />
) : (
        <div
          style={{
            padding: 32,
          }}
        >
          <div
            style={{
              color: '#168957',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
            }}
          >
            FEDCHAT
          </div>

          <h1
            style={{
              margin: '8px 0',
              fontSize: 28,
            }}
          >
            {activeNav}
          </h1>

          <p
            style={{
              color: '#7b8881',
              fontSize: 13,
            }}
          >
            This module will be redesigned next.
          </p>
        </div>
      )}
    </AppShell>
  )
}