import {
  MoreVertical,
  Phone,
  Search,
  Video,
  ArrowLeft,
} from 'lucide-react'
import './ChatWindowPlaceholder.css'
import { MessageComposer } from './MessageComposer'

type ChatWindowPlaceholderProps = {
  conversationId: string | null
  onBack: () => void
}

export function ChatWindowPlaceholder({
  onBack,
}: ChatWindowPlaceholderProps) {
  return (
    <div className="chat-window-placeholder">
      <header className="chat-placeholder-header">
        <button
  type="button"
  className="chat-placeholder-back"
  aria-label="Back to chats"
  onClick={onBack}
>
  <ArrowLeft
    size={18}
    strokeWidth={2}
  />
</button>
        <div className="chat-placeholder-user">
          <div className="chat-placeholder-avatar">
            AK
            <span />
          </div>

          <div>
            <strong>Amit Kumar</strong>

            <small>
              <i />
              Online now
            </small>
          </div>
        </div>

        <div className="chat-placeholder-actions">
          <button
            type="button"
            aria-label="Search conversation"
          >
            <Search
              size={17}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            aria-label="Voice call"
          >
            <Phone
              size={16}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            aria-label="Video call"
          >
            <Video
              size={17}
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            aria-label="More"
          >
            <MoreVertical
              size={17}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </header>

      <div className="chat-placeholder-messages">
        <div className="chat-date-divider">
          <span>Today</span>
        </div>

        <div className="placeholder-message incoming">
          <span>Hey, are you available?</span>
          <small>10:28 AM</small>
        </div>

        <div className="placeholder-message outgoing">
          <span>Yes, I'm here.</span>
          <small>10:29 AM</small>
        </div>

        <div className="placeholder-message incoming">
          <span>
            Can we discuss the project?
          </span>
          <small>10:30 AM</small>
        </div>

        <div className="placeholder-message outgoing">
          <span>
            Sure. I'll send the latest files.
          </span>
          <small>10:31 AM</small>
        </div>
      </div>
<MessageComposer
  recipientName="Amit Kumar"
  onSend={(message) => {
    console.log('Send message:', message)
  }}
/>
    </div>
  )
}