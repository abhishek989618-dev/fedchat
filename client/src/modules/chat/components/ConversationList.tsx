import {
  Filter,
  Plus,
  Search,
  Users,
  CheckCheck,
  SlidersHorizontal,
} from 'lucide-react'
import './ConversationList.css'

type ConversationPreview = {
  id: string
  name: string
  message: string
  time: string
  unread?: number
  online?: boolean
  group?: boolean
  avatar?: string
}

const DEMO_CONVERSATIONS: ConversationPreview[] = [
  {
    id: 'amit',
    name: 'Amit Kumar',
    message: 'Hey, are you available?',
    time: '10:31 AM',
    unread: 2,
    online: true,
  },
  {
    id: 'abhi',
    name: 'Abhi P',
    message: "I'll send the files shortly.",
    time: '9:54 AM',
    online: true,
  },
  {
    id: 'rahul',
    name: 'Rahul Sharma',
    message: 'Let’s discuss this tomorrow.',
    time: 'Yesterday',
  },
  {
    id: 'priya',
    name: 'Priya Singh',
    message: 'Thanks!',
    time: 'Yesterday',
    unread: 1,
  },
  {
    id: 'fedchat-team',
    name: 'FedChat Team',
    message: 'New platform update available.',
    time: 'Sunday',
    group: true,
    unread: 4,
  },
]

type ConversationListProps = {
  selectedConversationId?: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <div>
          <span className="conversation-eyebrow">
            MESSAGES
          </span>

          <h1>Chats</h1>
        </div>

        <button
          type="button"
          className="conversation-new-button"
          aria-label="New conversation"
        >
          <Plus size={17} strokeWidth={2} />
        </button>
      </div>
<div className="chat-list-toolbar">
  <div className="chat-list-search">
    <Search
      size={15}
      strokeWidth={2}
      className="chat-list-search-icon"
    />

    <input
      type="search"
      placeholder="Search conversations"
      aria-label="Search conversations"
    />

    <kbd>⌘ K</kbd>
  </div>

  <button
    type="button"
    className="chat-list-filter-button"
    aria-label="Conversation filters"
    title="Filters"
  >
    <SlidersHorizontal
      size={15}
      strokeWidth={1.9}
    />
  </button>
</div>

<div className="conversation-filters">
  <button
    type="button"
    className="active"
  >
    All
  </button>

  <button type="button">
    Unread
  </button>

  <button type="button">
    Groups
  </button>

  <button
    type="button"
    className="conversation-filter-icon"
    aria-label="More filters"
  >
    <Filter
      size={13}
      strokeWidth={1.9}
    />
  </button>
</div>

      <div className="conversation-items">
        {DEMO_CONVERSATIONS.map((conversation) => (
          <button
  type="button"
  className={`conversation-item ${
    selectedConversationId === conversation.id
      ? 'selected'
      : ''
  }`}
  onClick={() =>
    onSelectConversation(conversation.id)
  } key={conversation.id}
          >
            <div className="conversation-avatar">
              {conversation.avatar ? (
                <img
                  src={conversation.avatar}
                  alt=""
                />
              ) : conversation.group ? (
                <Users
                  size={16}
                  strokeWidth={1.8}
                />
              ) : (
                conversation.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
              )}

              {conversation.online && (
                <span className="conversation-online" />
              )}
            </div>

            <div className="conversation-copy">
              <div className="conversation-top-row">
                <strong>{conversation.name}</strong>

                <time>
                  {conversation.time}
                </time>
              </div>

              <div className="conversation-bottom-row">
                <span>
                  {conversation.message}
                </span>

                {conversation.unread ? (
                  <b className="conversation-unread">
                    {conversation.unread > 9
                      ? '9+'
                      : conversation.unread}
                  </b>
                ) : (
                  <CheckCheck
                    size={13}
                    strokeWidth={1.9}
                    className="conversation-read-icon"
                  />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}