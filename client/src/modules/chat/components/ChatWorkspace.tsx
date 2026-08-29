import { useState, type ReactNode } from 'react'
import './ChatWorkspace.css'

type ChatWorkspaceProps = {
  conversationList: (
    onSelectConversation: (id: string) => void,
  ) => ReactNode

  chatWindow: (
    selectedConversationId: string | null,
    onBack: () => void,
  ) => ReactNode
}

export function ChatWorkspace({
  conversationList,
  chatWindow,
}: ChatWorkspaceProps) {
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>('amit')

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id)
  }

  const handleBack = () => {
    setSelectedConversationId(null)
  }

  const mobileChatOpen =
    selectedConversationId !== null

  return (
    <section
      className={`chat-workspace ${
        mobileChatOpen
          ? 'mobile-chat-open'
          : ''
      }`}
    >
      <aside className="chat-conversations-panel">
        {conversationList(handleSelectConversation)}
      </aside>

      <section className="chat-main-panel">
        {chatWindow(
          selectedConversationId,
          handleBack,
        )}
      </section>
    </section>
  )
}