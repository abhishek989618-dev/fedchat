export type Section = 'chats' | 'contacts' | 'status' | 'groups' | 'communities' | 'notifications' | 'subscriptions' | 'settings' | 'support' | 'admin'
export type MessageKind = 'text' | 'image' | 'document' | 'audio' | 'video'
export interface Message {
  id: string
  text: string
  time: string
  fromMe?: boolean
  kind?: MessageKind
  status?: 'sent'|'delivered'|'read'
  edited?: boolean
  deleted?: boolean
  reactions?: Record<string, string[]>
  mediaUrl?: string
  mediaName?: string
  mediaMime?: string
  mediaSize?: number
  replyTo?: { id: string; text: string; senderName?: string; kind?: MessageKind }
  forwardedFrom?: { id: string; text: string; senderName?: string; kind?: MessageKind }
}
export interface ChatMemberInfo { userId: string; isAdmin?: boolean; user?: { id?: string; username?: string; firstName?: string; lastName?: string; avatar?: string | null; status?: string } }
export interface Chat { id: string; name: string; avatar: string; avatarUrl?: string; bannerUrl?: string; banner?: string; online?: boolean; lastMessage: string; time: string; unread?: number; pinned?: boolean; messages: Message[]; type?: 'DIRECT' | 'GROUP'; ownerId?: string; members?: ChatMemberInfo[]; description?: string; isPrivate?: boolean }

export type AdminSection = 'overview' | 'payments' | 'users' | 'plans' | 'media' | 'site'
