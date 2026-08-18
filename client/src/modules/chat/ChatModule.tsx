import { useEffect, useMemo, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { Chat, Message } from '../../types/app'
import { api, getSession } from '../../lib'
import { ChatList } from './components/ChatList'
import { ChatWindow } from './components/ChatWindow'

type AnyRecord = Record<string, any>

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const reactionPattern = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji}\w-]{1,16}$/u

function isValidUuid(value: string) {
  return UUID_REGEX.test(value)
}

function currentUserId() {
  return String(getSession()?.user?.id ?? '')
}

function initials(first?: string, last?: string, username?: string) {
  const a = first?.trim()?.[0] ?? ''
  const b = last?.trim()?.[0] ?? ''
  if (a && b) return `${a}${b}`.toUpperCase()
  if (a) return a.toUpperCase()
  if (username) return username.slice(0, 2).toUpperCase()
  return 'FC'
}

function formatTime(value?: string | Date | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function normalizeReactionMap(value: any): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, users]) => Array.isArray(users)),
  ) as Record<string, string[]>
}

function decodeContent(content: unknown) {
  if (typeof content !== 'string') return { text: '', media: null, replyTo: undefined, forwardedFrom: undefined }

  // Messages created by older builds could contain a JSON string inside
  // `text` (especially forwarded media). Unwrap one additional layer so
  // the UI never renders raw metadata such as {"mediaId":...}.
  const parseObject = (value: string): AnyRecord | null => {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as AnyRecord : null
    } catch {
      return null
    }
  }

  let parsed = parseObject(content)
  if (!parsed) return { text: content, media: null, replyTo: undefined, forwardedFrom: undefined }

  if (typeof parsed.text === 'string') {
    const nested = parseObject(parsed.text)
    if (nested && (nested.mediaId || nested.replyTo || nested.forwardedFrom || nested.text !== undefined)) {
      parsed = { ...nested, ...parsed, text: nested.text ?? parsed.caption ?? '' }
    }
  }

  if (parsed.text !== undefined || parsed.caption !== undefined || parsed.mediaId || parsed.replyTo || parsed.forwardedFrom) {
    return {
      text: String(parsed.text ?? parsed.caption ?? ''),
      media: parsed.mediaId ? parsed : null,
      replyTo: parsed.replyTo,
      forwardedFrom: parsed.forwardedFrom,
    }
  }

  return { text: content, media: null, replyTo: undefined, forwardedFrom: undefined }
}

function normalizeMessage(raw: AnyRecord): Message {
  const senderId = String(raw?.senderId ?? raw?.sender?.id ?? '')
  const decoded = decodeContent(raw?.content)
  const media = raw?.media ?? decoded.media
  const kind = String(raw?.messageType || '') === 'audio' ? 'audio' : String(raw?.messageType || '') === 'image' ? 'image' : String(raw?.messageType || '') === 'video' ? 'video' : ['file','document'].includes(String(raw?.messageType || '')) ? 'document' : 'text'
  const status = raw?.readAt ? 'read' : raw?.deliveredAt ? 'delivered' : 'sent'
  return {
    id: String(raw?.id ?? ''),
    text: decoded.text || (media ? (media.caption || media.name || '') : ''),
    time: formatTime(raw?.createdAt),
    fromMe: senderId === currentUserId(),
    status,
    kind,
    mediaUrl: media?.mediaId ? `${apiBaseMediaPrefix()}/${media.mediaId}` : undefined,
    mediaName: media?.name,
    mediaMime: media?.mime,
    mediaSize: media?.size,
    reactions: normalizeReactionMap(raw?.reactions),
    edited: Boolean(raw?.edited),
    deleted: Boolean(raw?.deleted),
    replyTo: decoded.replyTo,
    forwardedFrom: decoded.forwardedFrom,
  }
}

function apiBaseMediaPrefix() { return `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/media` }

function mergeMessages(existing: Message[], incoming: Message) {
  const index = existing.findIndex((message) => message.id === incoming.id)
  if (index < 0) return [...existing, incoming]

  const next = [...existing]
  next[index] = { ...next[index], ...incoming }
  return next
}

function normalizeRoom(room: AnyRecord): Chat {
  const me = currentUserId()
  let name = typeof room?.name === 'string' && room.name.trim() ? room.name.trim() : 'Conversation'
  let avatar = name.slice(0, 2).toUpperCase()
  let avatarUrl = room?.avatar ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}`.replace(/\/api\/v1\/?$/, '') + (String(room.avatar).startsWith('/') ? room.avatar : `/${room.avatar}`) : undefined

  if (room?.type === 'DIRECT' && Array.isArray(room?.members)) {
    const other = room.members.find((member: AnyRecord) => String(member?.userId) !== me)
    const user = other?.user
    if (user) {
      name =
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
        user.username ||
        'Conversation'
      avatar = initials(user.firstName, user.lastName, user.username)
      avatarUrl = user.avatar ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}`.replace(/\/api\/v1\/?$/, '') + (String(user.avatar).startsWith('/') ? user.avatar : `/${user.avatar}`) : undefined
    }
  }

  const latest = Array.isArray(room?.messages) ? room.messages[0] : null
  const latestDecoded = decodeContent(latest?.content ?? room.lastMessage ?? '')
  const members = Array.isArray(room?.members) ? room.members.map((member: AnyRecord) => ({
    userId: String(member?.userId ?? member?.user?.id ?? ''),
    isAdmin: String(member?.userId ?? member?.user?.id ?? '') === String(room?.createdById ?? room?.createdBy?.id ?? ''),
    user: member?.user,
  })) : []

  return {
    id: String(room.id),
    name,
    avatar,
    avatarUrl,
    bannerUrl: room?.bannerUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}`.replace(/\/api\/v1\/?$/, '') + (String(room.bannerUrl).startsWith('/') ? room.bannerUrl : `/${room.bannerUrl}`) : undefined,
    online: Boolean(room.online || room?.members?.some((member: AnyRecord) =>
      String(member?.userId) !== me && member?.user?.status === 'ACTIVE',
    )),
    lastMessage: latestDecoded.forwardedFrom ? `↗ ${latestDecoded.text}` : latestDecoded.replyTo ? `↩ ${latestDecoded.text}` : latestDecoded.text,
    time: formatTime(latest?.createdAt) || room.time || '',
    unread: Number(room.unread ?? 0),
    pinned: Boolean(room.pinned),
    messages: [],
    type: room?.type === 'GROUP' ? 'GROUP' : 'DIRECT',
    ownerId: String(room?.createdById ?? room?.createdBy?.id ?? ''),
    members,
    description: room?.description ?? '',
    isPrivate: Boolean(room?.isPrivate),
  }
}

function upsertChat(items: Chat[], roomId: string, updater: (chat: Chat) => Chat) {
  const index = items.findIndex((item) => item.id === roomId)
  if (index < 0) return items
  const current = items[index]
  const nextChat = updater(current)
  const next = [...items]
  next.splice(index, 1)
  next.unshift(nextChat)
  return next
}

export function ChatModule({ socket, initialRoomId = '' }: { socket: Socket | null; initialRoomId?: string }) {
  const [items, setItems] = useState<Chat[]>([])
  const [selected, setSelected] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<AnyRecord[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [forwardingId, setForwardingId] = useState('')
  const [forwardTargets, setForwardTargets] = useState<string[]>([])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const selectedChat = useMemo(
    () => items.find((item) => item.id === selected) ?? null,
    [items, selected],
  )

  async function loadRooms() {
    setLoadingRooms(true)
    setError('')
    try {
      const response = await api.rooms()
      const rooms = Array.isArray(response?.data?.rooms)
        ? response.data.rooms
            .filter((room: AnyRecord) => room?.id)
            .map(normalizeRoom)
        : []
      setItems(rooms)
      setSelected((current) =>
        initialRoomId && rooms.some((room) => room.id === initialRoomId)
          ? initialRoomId
          : current && rooms.some((room) => room.id === current)
            ? current
            : rooms[0]?.id ?? '',
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load conversations.')
      setItems([])
      setSelected('')
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    const onOpenRoom = (event: Event) => {
      const detail = (event as CustomEvent).detail as { roomId?: string } | undefined
      if (!detail?.roomId) return
      setSelected(String(detail.roomId))
    }
    window.addEventListener('fedchat:open-room', onOpenRoom)
    return () => window.removeEventListener('fedchat:open-room', onOpenRoom)
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [initialRoomId])

  useEffect(() => {
    if (initialRoomId && items.some((item) => item.id === initialRoomId)) setSelected(initialRoomId)
  }, [initialRoomId, items])

  useEffect(() => {
    if (!socket || !selected || !isValidUuid(selected)) return

    let alive = true
    setLoadingMessages(true)

    socket.emit('join_room', selected, (response: AnyRecord) => {
      if (!response?.success) {
        setNotice(response?.message || 'Unable to join this conversation.')
      }
    })

    void api.messages(selected)
      .then((response) => {
        if (!alive) return
        const messages = Array.isArray(response?.data?.messages)
          ? response.data.messages.map(normalizeMessage).filter((message: Message) => message.id)
          : []

        void api.markRoomRead(selected).catch(() => undefined)
        setItems((previous) =>
          previous.map((chat) =>
            chat.id === selected
              ? {
                  ...chat,
                  unread: 0,
                  messages,
                  lastMessage: messages.at(-1)?.text || chat.lastMessage,
                  time: messages.at(-1)?.time || chat.time,
                }
              : chat,
          ),
        )

        if (messages.length) {
          const latestIncoming = [...messages]
            .reverse()
            .find((message) => !message.fromMe && !message.deleted)
          if (latestIncoming) {
            socket.emit('message:read', {
              roomId: selected,
              messageId: latestIncoming.id,
            })
          }
        }
      })
      .catch((reason) => {
        if (!alive) return
        setNotice(reason instanceof Error ? reason.message : 'Unable to load messages.')
      })
      .finally(() => {
        if (alive) setLoadingMessages(false)
      })

    return () => {
      alive = false
      socket.emit('leave_room', selected)
      setReplyingTo(null)
    }
  }, [selected, socket])

  useEffect(() => {
    if (!socket) return

    const onNew = (raw: AnyRecord) => {
      if (!raw?.id || !raw?.roomId) return
      const roomId = String(raw.roomId)
      const message = normalizeMessage(raw)

      setItems((previous) =>
        upsertChat(previous, roomId, (chat) => {
          const exists = chat.messages.some((item) => item.id === message.id)
          return {
            ...chat,
            unread:
              roomId === selected || message.fromMe
                ? 0
                : (chat.unread ?? 0) + (exists ? 0 : 1),
            messages: exists ? chat.messages : mergeMessages(chat.messages, message),
            lastMessage: message.deleted ? 'Message deleted' : message.text,
            time: message.time || chat.time,
          }
        }),
      )

      if (!message.fromMe && roomId === selected) {
        socket.emit('message:delivered', { roomId, messageId: message.id })
        socket.emit('message:read', { roomId, messageId: message.id })
      } else if (!message.fromMe) {
        socket.emit('message:delivered', { roomId, messageId: message.id })
      }
    }

    const onConversation = (payload: AnyRecord) => {
      const roomId = String(payload?.roomId ?? '')
      const raw = payload?.message
      if (!roomId || !raw?.id) return

      const message = normalizeMessage(raw)
      setItems((previous) => {
        const exists = previous.some((chat) => chat.id === roomId)
        if (exists) {
          return upsertChat(previous, roomId, (chat) => ({
            ...chat,
            unread: roomId === selected || message.fromMe ? 0 : (chat.unread ?? 0) + 1,
            lastMessage: message.deleted ? 'Message deleted' : message.text,
            time: message.time || chat.time,
          }))
        }
        return previous
      })

      // A member can receive a sidebar event while the conversation is not
      // currently in local state (e.g. after login, tab restore, or a newly
      // created direct conversation). Hydrate the room so it appears for the
      // recipient too instead of showing only conversations initiated locally.
      void api.roomDetails(roomId)
        .then((response) => {
          const room = response?.data?.room
          if (!room?.id) return
          const normalized = normalizeRoom(room)
          setItems((previous) => {
            const existing = previous.find((chat) => chat.id === roomId)
            if (existing) {
              return upsertChat(previous, roomId, (chat) => ({
                ...chat,
                ...normalized,
                unread: roomId === selected || message.fromMe ? 0 : Math.max(chat.unread ?? 0, normalized.unread ?? 0, 1),
                lastMessage: message.deleted ? 'Message deleted' : message.text,
                time: message.time || chat.time,
              }))
            }
            return [{
              ...normalized,
              unread: roomId === selected || message.fromMe ? 0 : Math.max(normalized.unread ?? 0, 1),
              lastMessage: message.deleted ? 'Message deleted' : message.text,
              time: message.time || normalized.time,
              messages: roomId === selected ? [message] : normalized.messages,
            }, ...previous]
          })
        })
        .catch(() => undefined)
    }

    const onUpdated = (raw: AnyRecord) => {
      if (!raw?.id) return
      const id = String(raw.id)
      const message = normalizeMessage(raw)
      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((item) =>
            item.id === id
              ? { ...item, ...message, edited: true }
              : item,
          ),
          lastMessage: chat.messages.at(-1)?.id === id ? message.text : chat.lastMessage,
        })),
      )
    }

    const onDeleted = (payload: AnyRecord) => {
      const id = String(payload?.messageId ?? '')
      if (!id) return
      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((item) =>
            item.id === id
              ? { ...item, deleted: true, text: 'This message was deleted.' }
              : item,
          ),
          lastMessage: chat.messages.at(-1)?.id === id ? 'Message deleted' : chat.lastMessage,
        })),
      )
    }

    const onDeletedForMe = (payload: AnyRecord) => {
      const id = String(payload?.messageId ?? '')
      if (!id) return
      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((item) =>
            item.id === id
              ? { ...item, deleted: true, text: 'This message was deleted for you.' }
              : item,
          ),
        })),
      )
    }

    const onReaction = (raw: AnyRecord) => {
      const messageId = String(raw?.messageId ?? '')
      const userId = String(raw?.userId ?? '')
      const reaction = String(raw?.reaction ?? '')
      if (!messageId || !userId || !reaction) return

      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((message) => {
            if (message.id !== messageId) return message
            const reactions = { ...(message.reactions ?? {}) }
            const users = new Set(reactions[reaction] ?? [])
            users.add(userId)
            reactions[reaction] = [...users]
            return { ...message, reactions }
          }),
        })),
      )
    }

    const onReactionRemoved = (payload: AnyRecord) => {
      const messageId = String(payload?.messageId ?? '')
      const userId = String(payload?.userId ?? '')
      const reaction = String(payload?.reaction ?? '')
      if (!messageId || !userId || !reaction) return

      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((message) => {
            if (message.id !== messageId) return message
            const reactions = { ...(message.reactions ?? {}) }
            reactions[reaction] = (reactions[reaction] ?? []).filter((id) => String(id) !== userId)
            if (reactions[reaction].length === 0) delete reactions[reaction]
            return { ...message, reactions }
          }),
        })),
      )
    }

    const onDelivered = (payload: AnyRecord) => {
      const messageId = String(payload?.messageId ?? '')
      const userId = String(payload?.userId ?? '')
      if (!messageId || userId === currentUserId()) return

      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === messageId ? { ...message, status: 'delivered' } : message,
          ),
        })),
      )
    }

    const onRead = (payload: AnyRecord) => {
      const messageId = String(payload?.messageId ?? '')
      const userId = String(payload?.userId ?? '')
      if (!messageId || userId === currentUserId()) return

      setItems((previous) =>
        previous.map((chat) => ({
          ...chat,
          messages: chat.messages.map((message) =>
            message.id === messageId ? { ...message, status: 'read' } : message,
          ),
        })),
      )
    }

    const onTypingStart = (payload: AnyRecord) => {
      if (String(payload?.userId ?? '') !== currentUserId()) {
        window.dispatchEvent(new CustomEvent('fedchat:typing', {
          detail: { roomId: String(payload?.roomId ?? ''), active: true },
        }))
      }
    }

    const onTypingStop = (payload: AnyRecord) => {
      window.dispatchEvent(new CustomEvent('fedchat:typing', {
        detail: { roomId: String(payload?.roomId ?? ''), active: false },
      }))
    }

    socket.on('message:new', onNew)
    socket.on('conversation:message', onConversation)
    socket.on('message:updated', onUpdated)
    socket.on('message:deleted', onDeleted)
    socket.on('message:deleted_for_me', onDeletedForMe)
    socket.on('message:reaction', onReaction)
    socket.on('message:reaction:removed', onReactionRemoved)
    socket.on('message:delivered', onDelivered)
    socket.on('message:read', onRead)
    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)

    return () => {
      socket.off('message:new', onNew)
      socket.off('conversation:message', onConversation)
      socket.off('message:updated', onUpdated)
      socket.off('message:deleted', onDeleted)
      socket.off('message:deleted_for_me', onDeletedForMe)
      socket.off('message:reaction', onReaction)
      socket.off('message:reaction:removed', onReactionRemoved)
      socket.off('message:delivered', onDelivered)
      socket.off('message:read', onRead)
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
    }
  }, [socket, selected])

  useEffect(() => {
    if (!showNewChat) return
    const query = userSearch.trim()
    if (query.length < 2) {
      setSearchResults([])
      setSearchingUsers(false)
      return
    }

    let alive = true
    const timer = window.setTimeout(() => {
      setSearchingUsers(true)
      void api.searchUsers(query)
        .then((response) => {
          if (!alive) return
          const me = currentUserId()
          setSearchResults(
            (Array.isArray(response?.data?.users) ? response.data.users : [])
              .filter((user: AnyRecord) => String(user?.id) !== me),
          )
        })
        .catch(() => {
          if (alive) setSearchResults([])
        })
        .finally(() => {
          if (alive) setSearchingUsers(false)
        })
    }, 280)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [userSearch, showNewChat])

  const createConversation = async (userId: string) => {
    try {
      setError('')
      const response = await api.createDirectRoom(userId)
      const rawRoom = response?.data?.room
      if (!rawRoom?.id) throw new Error('Server did not return a valid conversation.')
      const room = normalizeRoom(rawRoom)
      setItems((previous) => {
        const index = previous.findIndex((item) => item.id === room.id)
        if (index < 0) return [room, ...previous]
        const next = [...previous]
        const existing = next.splice(index, 1)[0]
        return [{ ...(existing ?? {}), ...room }, ...next]
      })
      setSelected(room.id)
      setShowNewChat(false)
      setUserSearch('')
      setSearchResults([])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start conversation.')
    }
  }

  const sendMedia = async (file: File, messageType: 'audio' | 'image' | 'video' | 'file') => {
    if (!selectedChat || !socket) return
    try {
      const result = await api.uploadMedia(file)
      const media = result.data.media
      const content = JSON.stringify({ mediaId: media.id, name: media.originalName, mime: media.mimeType, size: media.size, text: media.originalName, ...(replyingTo ? { replyTo: { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.fromMe ? 'You' : selectedChat.name, kind: replyingTo.kind } } : {}) })
      socket.emit('message:send', { roomId: selectedChat.id, content, messageType: messageType === 'file' ? 'file' : messageType })
      setReplyingTo(null)
    } catch (e: any) { setNotice(e?.message || 'Unable to upload file.') }
  }

  const send = (text: string) => {
    const content = text.trim()
    if (!selectedChat || !socket || !content) return

    const payload = { text: content, ...(replyingTo ? { replyTo: { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.fromMe ? 'You' : selectedChat.name, kind: replyingTo.kind } } : {}) }
    socket.emit(
      'message:send',
      { roomId: selectedChat.id, content: replyingTo ? JSON.stringify(payload) : content, messageType: 'text' },
      (response: AnyRecord) => {
        if (!response?.success) {
          setNotice(response?.message || 'Message could not be sent.')
        }
      },
    )
    setReplyingTo(null)
  }

  const edit = (messageId: string, content: string) => {
    if (!selectedChat || !socket) return
    socket.emit(
      'message:edit',
      { roomId: selectedChat.id, messageId, content: content.trim() },
      (response: AnyRecord) => {
        if (!response?.success) setNotice(response?.message || 'Unable to edit message.')
      },
    )
  }

  const remove = (messageId: string, everyone: boolean) => {
    if (!selectedChat || !socket) return
    socket.emit(
      'message:delete',
      { roomId: selectedChat.id, messageId, deleteForEveryone: everyone },
      (response: AnyRecord) => {
        if (!response?.success) setNotice(response?.message || 'Unable to delete message.')
      },
    )
  }

  const removeSelectedMessages = (messageIds: string[]) => {
    if (!selectedChat || !socket) return
    const selectedMessages = selectedChat.messages.filter((m) => messageIds.includes(m.id))
    const allMine = selectedMessages.every((m) => m.fromMe)
    const everyone = allMine ? window.confirm(`Delete ${messageIds.length} selected message${messageIds.length === 1 ? '' : 's'} for everyone?`) : false
    messageIds.forEach((messageId) => socket.emit('message:delete', { roomId: selectedChat.id, messageId, deleteForEveryone: everyone }, (response: AnyRecord) => {
      if (!response?.success) setNotice(response?.message || 'Some messages could not be deleted.')
    }))
  }

  const removeChatsFromList = async (roomIds: string[]) => {
    try {
      for (const roomId of roomIds) {
        const response = await api.leaveConversation(roomId)
        if (!response?.success) throw new Error(response?.message || 'Unable to remove conversation.')
      }
      if (roomIds.includes(selected)) setSelected('')
      await loadRooms()
      setNotice(`${roomIds.length} conversation${roomIds.length === 1 ? '' : 's'} removed from your chat list.`)
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to remove conversation.') }
  }

  const react = (messageId: string, reaction: string) => {
    if (!selectedChat || !socket || !reactionPattern.test(reaction)) return
    socket.emit(
      'message:reaction',
      { roomId: selectedChat.id, messageId, reaction },
      (response: AnyRecord) => {
        if (!response?.success) setNotice(response?.message || 'Unable to add reaction.')
      },
    )
  }

  const unreact = (messageId: string, reaction: string) => {
    if (!selectedChat || !socket) return
    socket.emit(
      'message:reaction:remove',
      { roomId: selectedChat.id, messageId, reaction },
      (response: AnyRecord) => {
        if (!response?.success) setNotice(response?.message || 'Unable to remove reaction.')
      },
    )
  }

  const submitForward = async () => {
    if (!forwardingId || !forwardTargets.length) return
    try {
      const result = await api.forwardMessage(forwardingId, forwardTargets)
      if (!result?.success) throw new Error('Unable to forward message.')
      setNotice(`Message forwarded to ${forwardTargets.length} conversation${forwardTargets.length === 1 ? '' : 's'}.`)
      setForwardingId('')
      setForwardTargets([])
      refreshSelected()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Unable to forward message.')
    }
  }

  const refreshSelected = () => {
    if (!selected) return
    setSelected('')
    window.setTimeout(() => setSelected(selected), 0)
  }

  return (
    <div className={`chat-module${selectedChat ? ' has-chat' : ''}`}>
      <ChatList
        items={items}
        selected={selected}
        onSelect={setSelected}
        onNewChat={() => setShowNewChat(true)}
        onDeleteChats={removeChatsFromList}
        loading={loadingRooms}
      />

      {showNewChat && (
        <div className="chat-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowNewChat(false)
        }}>
          <section className="new-chat-panel" role="dialog" aria-modal="true" aria-label="New conversation">
            <div className="new-chat-header">
              <div>
                <span className="eyebrow">START A CONVERSATION</span>
                <h3>New conversation</h3>
                <p>Find a teammate by name, username or email.</p>
              </div>
              <button className="icon-btn" type="button" onClick={() => setShowNewChat(false)} aria-label="Close">×</button>
            </div>

            <div className="new-chat-search">
              <div className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search people…"
                  autoFocus
                />
              </div>
            </div>

            <div className="new-chat-body">
              {searchingUsers && <div className="chat-skeleton-list">{[1, 2, 3].map((item) => <div className="chat-skeleton" key={item} />)}</div>}
              {!searchingUsers && userSearch.trim().length < 2 && (
                <div className="new-chat-empty">
                  <div className="empty-icon">✦</div>
                  <strong>Search for someone</strong>
                  <span>Type at least 2 characters to see matching accounts.</span>
                </div>
              )}
              {!searchingUsers && userSearch.trim().length >= 2 && searchResults.length === 0 && (
                <div className="new-chat-empty">
                  <div className="empty-icon">⌁</div>
                  <strong>No matches found</strong>
                  <span>Try a different name, username or email address.</span>
                </div>
              )}
              <div className="new-chat-results">
                {searchResults.map((user: AnyRecord) => {
                  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'User'
                  return (
                    <button className="new-chat-user" type="button" key={String(user.id)} onClick={() => void createConversation(String(user.id))}>
                      <div className="avatar">{initials(user.firstName, user.lastName, user.username)}</div>
                      <div className="new-chat-user-copy">
                        <strong>{name}</strong>
                        <span>@{user.username}</span>
                      </div>
                      <span className="new-chat-arrow">→</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {error && (
        <div className="chat-error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {notice && <div className="chat-toast" role="status">{notice}</div>}

      {forwardingId && (
        <div className="chat-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForwardingId('') }}>
          <section className="forward-panel" role="dialog" aria-modal="true">
            <div className="new-chat-header"><div><span className="eyebrow">SHARE MESSAGE</span><h3>Forward to…</h3><p>Select one or more conversations.</p></div><button className="icon-btn" onClick={() => setForwardingId('')} aria-label="Close">×</button></div>
            <div className="forward-list">
              {items.filter((chat) => chat.id !== selected).map((chat) => {
                const checked = forwardTargets.includes(chat.id)
                return <button key={chat.id} className={checked ? 'forward-target selected' : 'forward-target'} onClick={() => setForwardTargets((current) => checked ? current.filter((id) => id !== chat.id) : [...current, chat.id])}>
                  <div className="avatar">{chat.avatar}</div><div><strong>{chat.name}</strong><span>{chat.lastMessage || 'Conversation'}</span></div><span className={checked ? 'checkmark active' : 'checkmark'}>{checked ? '✓' : ''}</span>
                </button>
              })}
            </div>
            <div className="forward-footer"><span>{forwardTargets.length} selected</span><button className="secondary" onClick={() => setForwardingId('')}>Cancel</button><button className="primary" disabled={!forwardTargets.length} onClick={() => void submitForward()}>Forward</button></div>
          </section>
        </div>
      )}

      {selectedChat ? (
        <ChatWindow
          chat={selectedChat}
          socket={socket}
          onSend={send}
          onSendMedia={sendMedia}
          readOnly={getSession()?.user?.role === 'guest'}
          onEdit={edit}
          onDelete={remove}
          onReact={react}
          onUnreact={unreact}
          onReply={setReplyingTo}
          onForward={(message) => { setForwardingId(message.id); setForwardTargets([]) }}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onRefresh={refreshSelected}
          onManageGroup={selectedChat.type === 'GROUP' ? () => { window.dispatchEvent(new CustomEvent('fedchat:manage-group', { detail: { roomId: selectedChat.id } })) } : undefined}
          onDeleteSelected={removeSelectedMessages}
          loading={loadingMessages}
          onBack={() => setSelected('')}
        />
      ) : (
        <section className="chat-empty-state">
          <div className="chat-empty-orb">✦</div>
          <span className="eyebrow">WELCOME TO FEDCHAT</span>
          <h2>Your conversations, in one place.</h2>
          <p>Select a conversation from the left or start a new chat to begin.</p>
          <button className="primary empty-cta" type="button" onClick={() => setShowNewChat(true)}>
            Start a new conversation
          </button>
        </section>
      )}
    </div>
  )
}
