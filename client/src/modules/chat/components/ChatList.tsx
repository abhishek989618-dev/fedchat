import { useMemo, useRef, useState } from 'react'
import type { Chat } from '../../../types/app'
import { Icon } from '../../../components/ui/Icon'
import { assetUrl } from '../../../lib'

type Props = {
  items: Chat[]
  selected: string
  onSelect: (id: string) => void
  onNewChat: () => void
  onDeleteChats?: (ids: string[]) => void
  loading?: boolean
}

export function ChatList({ items, selected, onSelect, onNewChat, onDeleteChats, loading = false }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all')
  const [selectedChats, setSelectedChats] = useState<string[]>([])
  const pressTimer = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((chat) => {
      const matchesQuery = !needle || chat.name.toLowerCase().includes(needle) || chat.lastMessage.toLowerCase().includes(needle)
      const matchesFilter = filter === 'all' || (filter === 'unread' && Boolean(chat.unread)) || (filter === 'groups' && chat.type === 'GROUP')
      return matchesQuery && matchesFilter
    })
  }, [items, query, filter])

  const toggleSelected = (id: string) => setSelectedChats((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  const clearSelection = () => setSelectedChats([])
  const beginPress = (id: string) => {
    window.clearTimeout(pressTimer.current ?? undefined)
    suppressClick.current = false
    pressTimer.current = window.setTimeout(() => {
      suppressClick.current = true
      toggleSelected(id)
      if (navigator.vibrate) navigator.vibrate(18)
    }, 520)
  }
  const endPress = () => window.clearTimeout(pressTimer.current ?? undefined)
  const handleClick = (id: string) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (selectedChats.length) toggleSelected(id); else onSelect(id)
  }
  const removeSelected = () => {
    if (!selectedChats.length) return
    if (window.confirm(`Delete ${selectedChats.length} conversation${selectedChats.length === 1 ? '' : 's'} from your chat list?`)) {
      onDeleteChats?.(selectedChats)
      clearSelection()
    }
  }

  return <aside className="chat-list">
    {selectedChats.length > 0 ? <div className="chat-selection-toolbar">
      <button className="icon-btn" type="button" onClick={clearSelection} aria-label="Cancel selection">×</button>
      <strong>{selectedChats.length} selected</strong>
      <button className="danger-icon-btn" type="button" onClick={removeSelected} aria-label="Delete selected chats" title="Delete selected chats"><Icon name="trash" /></button>
    </div> : <div className="list-head">
      <div className="chat-list-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" /></div>
      <button className="round-btn" type="button" onClick={onNewChat} aria-label="New conversation" title="New conversation"><Icon name="plus" /></button>
    </div>}

    <div className="chat-list-title-row"><div><span className="eyebrow">MESSAGES</span><strong>{items.length} conversation{items.length === 1 ? '' : 's'}</strong></div></div>
    <div className="chat-filters" role="tablist" aria-label="Conversation filters">
      {([['all','All'],['unread','Unread'],['groups','Groups']] as const).map(([value,label]) => <button className={filter===value?'pill active':'pill'} key={value} type="button" onClick={()=>setFilter(value)} role="tab" aria-selected={filter===value}>{label}</button>)}
    </div>

    <div className="chat-list-body">
      {loading && [1,2,3,4].map((item)=><div className="chat-row-skeleton" key={item}><span/><div><i/><i/></div></div>)}
      {!loading && filtered.length===0 && <div className="chat-list-empty"><div className="empty-icon">⌁</div><strong>{query?'No conversations found':'No conversations yet'}</strong><span>{query?'Try a different search term.':'Start a new conversation to get going.'}</span>{!query&&<button className="primary" type="button" onClick={onNewChat}>New conversation</button>}</div>}
      {!loading && filtered.map((chat)=><button
        className={`${selected === chat.id ? 'chat-row selected' : 'chat-row'} ${selectedChats.includes(chat.id) ? 'selection-active' : ''}`}
        key={chat.id} type="button"
        onMouseDown={()=>beginPress(chat.id)} onMouseUp={endPress} onMouseLeave={endPress}
        onTouchStart={()=>beginPress(chat.id)} onTouchEnd={endPress}
        onClick={()=>handleClick(chat.id)}
      >
        <div className="avatar">{chat.avatarUrl ? <img src={assetUrl(chat.avatarUrl)} alt="" onError={(e)=>{e.currentTarget.style.display='none'}}/> : chat.avatar}</div>
        <div className="chat-meta"><div className="chat-title"><strong>{chat.name}{chat.type==='GROUP'?<span className="chat-type-chip">Group</span>:null}</strong><time>{chat.time}</time></div><div className="chat-preview"><span>{chat.lastMessage||'Start chatting…'}</span>{chat.unread?<b>{chat.unread>99?'99+':chat.unread}</b>:null}</div></div>
        {selectedChats.includes(chat.id) && <span className="chat-selected-check">✓</span>}
      </button>)}
    </div>
    <div className="chat-list-hint">Long-press a conversation to select and delete it.</div>
  </aside>
}
