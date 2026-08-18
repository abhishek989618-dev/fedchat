import { io, type Socket } from 'socket.io-client'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
export function assetUrl(value?: string | null) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const origin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export type Session = { accessToken: string; refreshToken: string; user: User }
export type User = { id: string; email: string; username: string; firstName: string; lastName: string; phone?: string | null; avatar?: string | null; bannerUrl?: string | null; bio?: string | null; role?: string; guestExpiresAt?: string }
export type PaymentRequest = {
  id: string
  amount: number
  user: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email?: string
  }
  plan: {
    id: string
    name: string
  }
  status?: string
  createdAt?: string
  rejectionReason?: string | null
}

export type Announcement = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at?: string
  first_name?: string
  last_name?: string
  avatar?: string | null
}

export type Group = {
  id: string
  name: string
  description?: string
  isPrivate?: boolean
  memberCount?: number
}

export type StatusItem = {
  id: string
  user_id: string
  content: string
  created_at: string
  expires_at?: string
  media_url?: string | null
  media_type?: string | null
  view_count?: number
  username?: string
  first_name?: string
  last_name?: string
  avatar?: string | null
}

export type Viewer = {
  viewer_id: string
  username: string
  first_name?: string
  last_name?: string
  viewed_at: string
}

export type Community = {
  id: string
  name: string
  description?: string
  owner_id: string
  member_count: number
}

export type Contact = {
  contact_id: string
  user_id?: string
  username: string
  first_name: string
  last_name: string
}

export type ContactRequest = {
  id: string
  sender_id: string
  username: string
  first_name: string
  last_name: string
}

export type SearchResult = {
  id: string
  username: string
  firstName: string
  lastName: string
}

export type Plan = {
  id: string
  name: string
  maxGroups: number | null
  maxMembersPerGroup: number | null
  maxCommunities: number | null
  maxGuestsPerGroup: number | null
  price?: number
}
export type AdminUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  email?: string
  status: string
  role?: string
}



export type SearchUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  email?: string
  avatar?: string | null
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}


export function getSession(): Session | null {
  try { return JSON.parse(localStorage.getItem('fedchat_session') || 'null') } catch { return null }
}
export function saveSession(session: Session) { localStorage.setItem('fedchat_session', JSON.stringify(session)) }
export function clearSession() { localStorage.removeItem('fedchat_session') }

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const session = getSession()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`)
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401 && retry && session?.refreshToken) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ refreshToken: session.refreshToken }) })
    if (refreshRes.ok) {
      const payload = await refreshRes.json()
      saveSession({ ...session, ...payload.data })
      return request<T>(path, options, false)
    }
    clearSession()
  }
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(payload.message || `Request failed (${res.status})`) as Error & { code?: string; status?: number }
    err.code = payload.code
    err.status = res.status
    throw err
  }
  return payload
}




export const api = {
  login: (email: string, password: string) => request<{success:boolean;data:Session}>('/auth/login', {method:'POST', body:JSON.stringify({email,password})}),
  register: (data: Record<string, unknown>) => request<{success:boolean}>('/auth/register', {method:'POST', body:JSON.stringify(data)}),
  me: () => request<{success:boolean;data:{user:User}}>('/auth/me'),
  rooms: () => request<{success:boolean;data:{rooms:any[]}}>('/rooms'),
  uploadMedia: async (file: File) => {
    const session = getSession()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}/media`, { method: 'POST', headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}, body: form })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || `Upload failed (${res.status})`)
    return payload as { success: boolean; data: { media: { id: string; originalName: string; mimeType: string; size: number } } }
  },

  createDirectRoom: (userId: string) =>
  request<{
    success: boolean
    message?: string
    data: {
      room: any
    }
  }>("/rooms/direct", {
    method: "POST",
    body: JSON.stringify({
      userId
    })
  }),
  messages: (roomId: string) => request<{success:boolean;data:{messages:any[]}}>(`/rooms/${roomId}/messages`),
  markRoomRead: (roomId: string) => request<{success:boolean}>(`/rooms/features/${roomId}/read`, {method:'POST'}),
  notifications: () => request<{success:boolean;data:{notifications:any[]}}>('/notifications'),
  plans: () => request<{success:boolean;data:{plans:Plan[]}}>('/subscriptions/plans'),
  subscription: () =>
  request<{
    success: boolean
    data: {
      subscription: {
        id?: string
        status?: string
        plan?: Plan
      } | null
    }
  }>('/subscriptions/me'),
  paymentMethods: () => request<{success:boolean;data:{paymentMethods:any[]}}>('/payments/methods'),
  createPaymentMethod: (data: Record<string, unknown>) => request<{success:boolean;data:{paymentMethod:any}}>('/payments/methods', {method:'POST', body:JSON.stringify(data)}),
  updatePaymentMethod: (id: string, data: Record<string, unknown>) => request<{success:boolean;data:{paymentMethod:any}}>(`/payments/methods/${id}`, {method:'PATCH', body:JSON.stringify(data)}),
  paymentRequests: () => request<{success:boolean;data:{paymentRequests:any[]}}>('/payments/requests/me'),
  createPaymentRequest: (data: Record<string, unknown>) => request<{success:boolean}>('/payments/requests', {method:'POST',body:JSON.stringify(data)}),
  groups: () => request<{success:boolean;data:{groups:Group[]}}>('/groups'),
  createGroup: (data: {name: string; description?: string; isPrivate?: boolean}) => request<{success:boolean;data:{group:Record<string, unknown>};message?:string;code?:string}>('/groups', {method:'POST', body:JSON.stringify(data)}),
  groupMembers: (id: string) => request<{success:boolean;data:{members:any[]}}>(`/groups/${id}/members`),
  roomDetails: (id: string) => request<{success:boolean;data:{room:any}}>(`/rooms/${id}`),
  leaveConversation: (id: string) => request<{success:boolean;message?:string}>(`/rooms/${id}/leave`, {method:'POST'}),
  updateGroup: (id: string, data: {name?: string;description?: string|null;isPrivate?: boolean}) => request<{success:boolean;data:{group:any}}>(`/groups/${id}`, {method:'PATCH', body:JSON.stringify(data)}),
  uploadGroupMedia: async (id: string, kind: 'avatar'|'banner', file: File) => {
    const session=getSession(); const form=new FormData(); form.append('file',file); form.append('kind',kind);
    const res=await fetch(`${API_URL}/groups/${id}/profile-media`, {method:'POST', headers: session?.accessToken ? {Authorization:`Bearer ${session.accessToken}`} : {}, body:form});
    const payload=await res.json().catch(()=>({})); if(!res.ok) throw new Error(payload.message || 'Upload failed'); return payload as {success:boolean;data:{group:any;url:string}};
  },
  addGroupMember: (id: string, userId: string) => request<{success:boolean;message?:string;code?:string}>(`/groups/${id}/members`, {method:'POST', body:JSON.stringify({userId})}),
  contacts: () => request<{success:boolean;data:{contacts:Contact[]}}>('/contacts'),
  contactRequests: () => request<{success:boolean;data:{requests:ContactRequest[]}}>('/contacts/requests'),
  searchUsers: (q: string) => request<{success:boolean;data:{users:SearchUser[]}}>(`/users/search?q=${encodeURIComponent(q)}`),
  sendContactRequest: (receiverId: string) => request<{success:boolean;data:{request:Record<string, unknown>}}>('/contacts/requests', {method:'POST', body:JSON.stringify({receiverId})}),
  acceptContactRequest: (id: string) => request<{success:boolean}>(`/contacts/${id}/accept`, {method:'POST'}),
  statuses: () => request<{success:boolean;data:{statuses:StatusItem[]}}>('/status'),
  createStatus: (data: {content?: string; mediaUrl?: string; mediaType?: string; expiresHours?: number}) => request<{success:boolean;data:{status:StatusItem}}>('/status', {method:'POST', body:JSON.stringify(data)}),
  viewStatus: (id: string) => request<{success:boolean}>(`/status/${id}/view`, {method:'POST'}),
  statusViews: (id: string) => request<{success:boolean;data:{views:Viewer[]}}>(`/status/${id}/views`),
  deleteStatus: (id: string) => request<{success:boolean}>(`/status/${id}`, {method:'DELETE'}),
  communities: () => request<{success:boolean;data:{communities:Community[]}}>('/communities'),
  createCommunity: (data: {name: string; description?: string}) => request<{success:boolean;data:{community:Record<string, unknown>};message?:string;code?:string}>('/communities', {method:'POST', body:JSON.stringify(data)}),
  communityGroups: (id: string) => request<{success:boolean;data:{groups:Group[]}}>(`/communities/${id}/groups`),
  attachGroupToCommunity: (id: string, roomId: string) => request<{success:boolean}>(`/communities/${id}/groups/${roomId}`, {method:'POST'}),
  communityAnnouncements: (id: string) => request<{success:boolean;data:{announcements:Announcement[]}}>(`/communities/${id}/announcements`),
  postCommunityAnnouncement: (id: string, data: {title: string; content: string}) => request<{success:boolean;data:{announcement:Record<string, unknown>}}>(`/communities/${id}/announcements`, {method:'POST', body:JSON.stringify(data)}),
  updatePlan: (id: string, data: {maxGroups?: number|null; maxMembersPerGroup?: number|null; maxCommunities?: number|null; maxGuestsPerGroup?: number|null}) => request<{success:boolean;data:{plan:Record<string, unknown>}}>(`/subscriptions/plans/${id}`, {method:'PATCH', body:JSON.stringify(data)}),
  createMediaBackup: () => request<{success:boolean;data:{backup:{filename:string;sizeBytes:number;mediaCount:number;totalMediaAssets:number;createdAt:string}}}>('/media/admin/backup', {method:'POST'}),
  listMediaBackups: () => request<{success:boolean;data:{backups:{filename:string;sizeBytes:number;createdAt:string}[]}}>('/media/admin/backups'),
  wipeMedia: (backupFile: string) => request<{success:boolean;message:string;data:{wiped:number}}>('/media/admin/wipe', {method:'POST', body:JSON.stringify({backupFile})}),
  downloadMediaBackup: async (filename: string) => {
    const session = getSession()
    const res = await fetch(`${API_URL}/media/admin/backups/${encodeURIComponent(filename)}/download`, {
      headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    })
    if (!res.ok) throw new Error(`Download failed (${res.status})`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
  adminAnalytics: () => request<{success:boolean;data:{analytics:{users:number;rooms:number;messages:number;subscriptions:number;pendingPayments:number;activeUsers24h:number}}}>('/admin/analytics'),
  adminUsers: () => request<{success:boolean;data:{users:AdminUser[]}}>('/admin/users'),
  adminUpdateUserStatus: (id: string, status: string) => request<{success:boolean;data:{user:Record<string, unknown>}}>(`/admin/users/${id}/status`, {method:'PATCH', body:JSON.stringify({status})}),
  siteSettings: () => request<{success:boolean;data:{settings:any[]}}>(`/admin/settings`),
  publicSiteSettings: () => request<{success:boolean;data:{settings:Record<string, unknown>} }>(`/settings`),
  forwardMessage: (messageId: string, roomIds: string[]) => request<{success:boolean;data:{messages:any[]}}>(`/messages/${messageId}/forward`, {method:"POST", body:JSON.stringify({roomIds})}),
  updateSiteSetting: (key: string, value: unknown) => request<{success:boolean;data:{setting:any}}>(`/admin/settings/${encodeURIComponent(key)}`, {method:'PUT', body:JSON.stringify({value})}),
  pendingPaymentRequests: () => request<{success:boolean;data:{paymentRequests:PaymentRequest[]}}>('/payments/requests/pending'),
  approvePaymentRequest: (id: string) => request<{success:boolean}>(`/payments/requests/${id}/approve`, {method:'PATCH'}),
  rejectPaymentRequest: (id: string, rejectionReason: string) => request<{success:boolean}>(`/payments/requests/${id}/reject`, {method:'PATCH', body:JSON.stringify({rejectionReason})}),
  notificationsList: () => request<{success:boolean;data:NotificationItem[]}>('/notifications'),
  markNotificationRead: (id: string) => request<{success:boolean}>(`/notifications/${id}/read`, {method:'PATCH'}),
  markAllNotificationsRead: () => request<{success:boolean}>('/notifications/read-all', {method:'PATCH'}),
  deleteNotification: (id: string) => request<{success:boolean}>(`/notifications/${id}`, {method:'DELETE'}),
  updateProfile: (data: {firstName?: string; lastName?: string; username?: string; phone?: string; bio?: string | null; bannerUrl?: string | null; avatar?: string | null}) => request<{success:boolean;data:{user:Record<string, unknown>}}>('/users/me', {method:'PATCH', body:JSON.stringify(data)}),
  uploadProfileMedia: async (kind: 'avatar' | 'banner', file: File) => {
    const session = getSession()
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)
    const res = await fetch(`${API_URL}/users/me/profile-media`, { method: 'POST', headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}, body: form })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || `Profile upload failed (${res.status})`)
    return payload as { success: boolean; message: string; data: { user: Record<string, unknown>; url: string } }
  },
  changePassword: (data: {currentPassword: string; newPassword: string}) => request<{success:boolean;message:string}>('/users/me/password', {method:'PATCH', body:JSON.stringify(data)}),
  joinGroupAsGuest: (token: string) => request<{success:boolean;message?:string;data:{guest:{id:string;username:string;email:string;password:string;expiresAt:string};accessToken:string;refreshToken:string;roomId:string}}>(`/guest/join/${token}`, {method:'POST'}),
  createGroupInvite: (roomId: string) => request<{success:boolean;data:{invite:Record<string, unknown>;joinPath:string}}>(`/guest/groups/${roomId}/invite`, {method:'POST'}),
  importGroupMembers: async (roomId: string, file: File) => {
    const session = getSession()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}/guest/groups/${roomId}/import`, { method: 'POST', headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}, body: form })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || `Import failed (${res.status})`)
    return payload as { success: boolean; data: { count: number; guests: any[] } }
  },
  
}

export function createSocket(): Socket | null {
  const session = getSession()

  if (!session?.accessToken) {
    return null
  }

  return io(SOCKET_URL, {
    auth: {
      token: session.accessToken
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })
}
