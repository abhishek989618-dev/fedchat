import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Chat, Message } from '../../../types/app'
import type { Socket } from 'socket.io-client'
import { Icon } from '../../../components/ui/Icon'
import { assetUrl } from '../../../lib'
import { MessageBubble } from './MessageBubble'

type Props = {
  chat: Chat
  onSend: (text: string) => void
  onSendMedia?: (file: File, messageType: 'audio' | 'image' | 'video' | 'file') => Promise<void>
  readOnly?: boolean
  socket: Socket | null
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string, everyone: boolean) => void
  onReact?: (id: string, reaction: string) => void
  onUnreact?: (id: string, reaction: string) => void
  onReply?: (message: Message) => void
  onForward?: (message: Message) => void
  replyingTo?: Message | null
  onCancelReply?: () => void
  onBack?: () => void
  onRefresh?: () => void
  onManageGroup?: () => void
  onDeleteSelected?: (ids: string[]) => void
  loading?: boolean
}

export function ChatWindow({ chat, onSend, onSendMedia, readOnly = false, socket, onEdit, onDelete, onReact, onUnreact, onReply, onForward, replyingTo, onCancelReply, onBack, onRefresh, onManageGroup, onDeleteSelected, loading = false }: Props) {
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [findText, setFindText] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<{file: File; type: 'audio'|'image'|'video'|'file'; preview: string} | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const typingTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const handleTypingEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.roomId !== chat.id) return
      setTyping(Boolean(detail.active))
    }
    window.addEventListener('fedchat:typing', handleTypingEvent)
    return () => { window.removeEventListener('fedchat:typing', handleTypingEvent); window.clearTimeout(typingTimer.current) }
  }, [chat.id])

  useEffect(() => { setText(''); setFindOpen(false); setFindText(''); setInfoOpen(false); setSelectedMessages([]) }, [chat.id])

  const send = () => {
    const value = text.trim()
    if (!value) return
    onSend(value); setText(''); socket?.emit('typing:stop', { roomId: chat.id })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }
  const handleType = (value: string) => {
    setText(value)
    if (!socket) return
    if (!value.trim()) { socket.emit('typing:stop', { roomId: chat.id }); return }
    socket.emit('typing:start', { roomId: chat.id }); window.clearTimeout(typingTimer.current); typingTimer.current = window.setTimeout(() => socket.emit('typing:stop', { roomId: chat.id }), 1100)
  }
  const matched = findText.trim() ? chat.messages.filter((message) => message.text.toLowerCase().includes(findText.trim().toLowerCase())).length : 0
  const jumpToMatch = () => {
    const needle = findText.trim().toLowerCase(); if (!needle) return
    const node = [...document.querySelectorAll('.chat-window .bubble p')].find((element) => element.textContent?.toLowerCase().includes(needle))
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const chooseFile = (file: File) => {
    if (!onSendMedia || readOnly) return
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file'
    const preview = type === 'image' || type === 'video' ? URL.createObjectURL(file) : ''
    setPendingMedia({ file, type, preview })
  }
  const confirmMedia = async () => {
  if (!pendingMedia || !onSendMedia || uploading) return

  setUploading(true)

  try {
    await onSendMedia(pendingMedia.file, pendingMedia.type)

    if (pendingMedia.preview) {
      URL.revokeObjectURL(pendingMedia.preview)
    }

    setPendingMedia(null)
  } catch (error) {
    console.error('Failed to send media:', error)
    window.alert('Failed to send media. Please try again.')
  } finally {
    setUploading(false)
  }
}

const cancelMedia = () => {
  if (pendingMedia?.preview) {
    URL.revokeObjectURL(pendingMedia.preview)
  }

  setPendingMedia(null)
}
  const toggleRecording = async () => {
    if (readOnly || !onSendMedia) return
    if (recording && recorderRef.current) { recorderRef.current.stop(); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      recorder.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); setRecording(false); const blob = new Blob(chunksRef.current, { type: mimeType }); if (!blob.size) return; setUploading(true); try { await onSendMedia(new File([blob], `voice-note-${Date.now()}.webm`, { type: mimeType }), 'audio') } finally { setUploading(false) } }
      recorder.start(); recorderRef.current = recorder; setRecording(true)
    } catch { window.alert('Microphone permission is required for voice notes.') }
  }

  const infoMembers = (chat.members ?? []).filter((member) => member.userId)
  const selectionActive = selectedMessages.length > 0
  const toggleMessageSelection = (id: string) => setSelectedMessages((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  const clearMessageSelection = () => setSelectedMessages([])
  const deleteSelectedMessages = () => {
    if (!selectedMessages.length) return
    const selected = chat.messages.filter((m) => selectedMessages.includes(m.id))
    const allMine = selected.every((m) => m.fromMe)
    const everyone = allMine ? window.confirm(`Delete ${selected.length} selected message${selected.length===1?'':'s'} for everyone?`) : false
    onDeleteSelected?.(selectedMessages)
    if (!onDeleteSelected) selected.forEach((m) => onDelete?.(m.id, everyone))
    setSelectedMessages([])
  }

  return <section className="chat-window">
    <header className="conversation-head">
      {onBack && <button className="icon-btn back-btn" type="button" aria-label="Back to chats" onClick={onBack}><Icon name="arrow" /></button>}
      <button className="conversation-identity" type="button" onClick={() => setInfoOpen((v) => !v)} aria-label={chat.type === 'GROUP' ? 'Open group information' : 'Open profile information'}>
        <span className="conversation-avatar-wrap"><span className="avatar avatar-lg">{chat.avatarUrl ? <img src={assetUrl(chat.avatarUrl)} alt="" /> : chat.avatar}</span><span className={chat.online ? 'conversation-online' : 'conversation-offline'} /></span>
        <span className="conversation-title"><strong>{chat.name}</strong><span><i className="presence-dot" />{typing ? 'typing…' : chat.type === 'GROUP' ? `${infoMembers.length} member${infoMembers.length === 1 ? '' : 's'}` : chat.online ? 'online now' : 'last seen recently'}</span></span>
      </button>
      <div className="conversation-actions">
        <button className={findOpen ? 'icon-btn active' : 'icon-btn'} type="button" aria-label="Search messages" onClick={() => setFindOpen((v) => !v)}><Icon name="search" /></button>
        <button className="icon-btn" type="button" aria-label="Conversation menu" onClick={() => setInfoOpen((v) => !v)}><Icon name="more" /></button>
      </div>
    </header>

    {findOpen && <div className="conversation-search"><div className="search"><Icon name="search" /><input autoFocus value={findText} onChange={(e) => setFindText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); jumpToMatch() } }} placeholder="Search in this conversation…" /><span>{matched ? `${matched} match${matched === 1 ? '' : 'es'}` : ''}</span></div></div>}
    {infoOpen && <div className="conversation-info-panel">
      <div className="conversation-info-header"><div><span className="eyebrow">{chat.type === 'GROUP' ? 'GROUP INFO' : 'PROFILE'}</span><strong>{chat.name}</strong><span>{chat.type === 'GROUP' ? (chat.description || 'Group conversation') : 'Direct conversation'}</span></div><button className="icon-btn" type="button" onClick={() => setInfoOpen(false)}>×</button></div>
      {chat.type === 'GROUP' && <div className="group-info-hero">{chat.bannerUrl && <img src={assetUrl(chat.bannerUrl)} alt="" />}<div className="group-info-identity"><div className="avatar avatar-xl">{chat.avatarUrl ? <img src={assetUrl(chat.avatarUrl)} alt="" /> : chat.avatar}</div><div><strong>{chat.name}</strong><span>{chat.description || 'Group conversation'}</span></div></div></div>}
      {chat.type === 'GROUP' ? <div className="group-member-list">{infoMembers.map((member) => { const user = member.user; const label = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username || 'Member'; return <div className="group-member-row" key={member.userId}><div className="avatar">{label.slice(0,2).toUpperCase()}</div><div><strong>{label}</strong><small>@{user?.username ?? 'user'}</small></div>{member.isAdmin ? <span className="admin-badge">Admin</span> : null}</div> })}</div> : <div className="profile-info-card"><div className="avatar avatar-xl">{chat.avatarUrl ? <img src={assetUrl(chat.avatarUrl)} alt="" /> : chat.avatar}</div><strong>{chat.name}</strong><span>{chat.online ? 'Online now' : 'Offline'}</span></div>}
      <div className="conversation-info-actions">{chat.type === 'GROUP' && onManageGroup ? <button className="primary" type="button" onClick={onManageGroup}>Manage group</button> : null}<button className="secondary" type="button" onClick={onRefresh}>Refresh</button></div>
    </div>}

    {selectionActive && <div className="message-selection-toolbar"><button className="icon-btn" onClick={clearMessageSelection} aria-label="Cancel message selection">×</button><strong>{selectedMessages.length} selected</strong><button className="danger-icon-btn" onClick={deleteSelectedMessages} aria-label="Delete selected messages" title="Delete selected messages"><Icon name="trash" /></button></div>}
    <div className="messages" aria-live="polite">
      {chat.messages.length === 0 && !loading && <div className="conversation-start"><div className="conversation-start-icon">✦</div><strong>Start a new conversation</strong><span>Send a message to {chat.name}. Messages appear here instantly.</span></div>}
      {loading && <div className="message-loading" aria-label="Loading messages"><span /><span /><span /></div>}
      {chat.messages.map((message) => <MessageBubble key={message.id} message={message} onEdit={onEdit} onDelete={onDelete} onReact={onReact} onUnreact={onUnreact} onReply={onReply} onForward={onForward} onSelect={toggleMessageSelection} selected={selectedMessages.includes(message.id)} selectionMode={selectionActive} />)}
      {typing && <div className="typing-indicator" aria-label={`${chat.name} is typing`}><div className="typing-avatar">{chat.avatar}</div><div className="typing-bubble"><span /><span /><span /></div><em>{chat.name} is typing</em></div>}
    </div>

    {!readOnly ? <>
    {pendingMedia && (
  <div className="media-preview-overlay" role="dialog" aria-modal="true" aria-label="Preview attachment">
    <div className="media-preview-panel">
      <div className="media-preview-header">
        <div>
          <span className="eyebrow">ATTACHMENT</span>
          <strong>Preview before sending</strong>
        </div>

        <button
          className="icon-btn"
          type="button"
          onClick={cancelMedia}
          disabled={uploading}
          aria-label="Close media preview"
        >
          ×
        </button>
      </div>

      <div className="media-preview-content">
        {pendingMedia.type === 'image' && pendingMedia.preview ? (
          <img
            src={pendingMedia.preview}
            alt={pendingMedia.file.name}
            className="media-preview-image"
          />
        ) : pendingMedia.type === 'video' && pendingMedia.preview ? (
          <video
            src={pendingMedia.preview}
            className="media-preview-video"
            controls
          />
        ) : (
          <div className="media-preview-file">
            <div className="media-preview-file-icon">
              <Icon name="file" />
            </div>

            <strong>{pendingMedia.file.name}</strong>

            <span>
              {(pendingMedia.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      <div className="media-preview-actions">
        <button
          className="secondary"
          type="button"
          onClick={cancelMedia}
          disabled={uploading}
        >
          Close
        </button>

        <button
          className="primary"
          type="button"
          onClick={() => void confirmMedia()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="button-loader" />
              Sending…
            </>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  </div>
)}
      {replyingTo && <div className="reply-composer-bar"><div><span className="eyebrow">REPLYING TO</span><strong>{replyingTo.fromMe ? 'Your message' : chat.name}</strong><span>{replyingTo.text || replyingTo.mediaName || 'Attachment'}</span></div><button className="icon-btn" onClick={onCancelReply} aria-label="Cancel reply">×</button></div>}
      <div className="composer">
        <input ref={fileRef} hidden type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={(e) => { const f = e.target.files?.[0]; if (f) void chooseFile(f); e.currentTarget.value = '' }} />
        <button className="icon-btn composer-action" type="button" aria-label="Attach file" onClick={() => fileRef.current?.click()} disabled={uploading}><Icon name="plus" /></button>
        <input value={text} onChange={(e) => handleType(e.target.value)} onKeyDown={handleKeyDown} placeholder={replyingTo ? 'Write a reply…' : `Message ${chat.name}`} aria-label={`Message ${chat.name}`} maxLength={4000} disabled={uploading} />
        <button className={recording ? 'voice-btn recording' : 'voice-btn'} type="button" aria-label={text.trim() ? 'Send message' : recording ? 'Stop recording' : 'Voice message'} onClick={text.trim() ? send : toggleRecording} disabled={uploading}><Icon name={text.trim() ? 'send' : recording ? 'square' : 'mic'} /></button>
      </div>
    </> : <div className="composer readonly-composer"><span>Guest mode is read-only. You can view messages and media.</span></div>}
  </section>
}
