import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../lib'
import type { Socket } from 'socket.io-client'

type NotificationItem = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}
function iconFor(type: string) {
  if (type.includes('message')) return 'chat'
  if (type.includes('group') || type.includes('mention')) return 'group'
  return 'bell'
}

export function NotificationsModule({ socket }: { socket?: Socket | null }) {
  const [items, setItems] = useState<NotificationItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    api.notificationsList().then((r) => setItems(r.data || [])).catch((e) => setError(e.message || 'Failed to load notifications'))
  }
  useEffect(load, [])
  useEffect(() => {
    if (!socket) return
    const onNew = (notification: NotificationItem) => setItems((prev) => {
      const current = prev || []
      return current.some((n) => n.id === notification.id) ? current : [notification, ...current]
    })
    socket.on('notification:new', onNew)
    return () => { socket.off('notification:new', onNew) }
  }, [socket])

  async function markAll() {
    try { await api.markAllNotificationsRead(); setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) || null) } catch { /* ignore */ }
  }
  async function markOne(id: string) {
    try { await api.markNotificationRead(id); setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) || null) } catch { /* ignore */ }
  }
  async function remove(id: string) {
    try { await api.deleteNotification(id); setItems((prev) => prev?.filter((n) => n.id !== id) || null) } catch { /* ignore */ }
  }

  const unread = items?.filter((n) => !n.isRead).length ?? 0

  return (
    <div className="page-module">
      <div className="page-header">
        <div><h2>Notifications</h2><p>Stay up to date with your chats and account.{unread > 0 ? ` ${unread} unread.` : ''}</p></div>
        <button className="secondary" onClick={markAll} disabled={!unread}>Mark all read</button>
      </div>

      {error && (
        <div className="notice">
          <strong>Could not load notifications</strong>
          <span>{error}</span>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {!error && items === null && <p>Loading…</p>}
      {!error && items !== null && items.length === 0 && (
        <div className="notice">
          <strong>You're all caught up</strong>
          <span>New activity will show up here.</span>
        </div>
      )}

      {!error && items !== null && items.length > 0 && (
        <div className="notification-list">
          {items.map((n) => (
            <div className={n.isRead ? 'notification' : 'notification unread'} key={n.id} onClick={() => !n.isRead && markOne(n.id)}>
              <div className="notification-icon"><Icon name={iconFor(n.type)} /></div>
              <div><strong>{n.title}</strong><p>{n.message}</p><small>{timeAgo(n.createdAt)}</small></div>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); remove(n.id) }}><Icon name="more" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
