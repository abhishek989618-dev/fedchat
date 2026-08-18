import { useEffect, useRef, useState } from 'react'
import type { Message } from '../../../types/app'
import { Icon } from '../../../components/ui/Icon'
import { getSession } from '../../../lib'

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🙏']
export function MessageBubble({ message,onEdit,onDelete,onReact,onUnreact,onReply,onForward,onSelect,selected=false,selectionMode=false }:{
  message: Message
  onEdit?: (id:string,content:string)=>void
  onDelete?: (id:string,everyone:boolean)=>void
  onReact?: (id:string,reaction:string)=>void
  onUnreact?: (id:string,reaction:string)=>void
  onReply?: (message:Message)=>void
  onForward?: (message:Message)=>void
  onSelect?: (id:string)=>void
  selected?: boolean
  selectionMode?: boolean
}) {
  const myId=getSession()?.user.id
  const [menuOpen,setMenuOpen]=useState(false),[pickerOpen,setPickerOpen]=useState(false),[editing,setEditing]=useState(false),[draft,setDraft]=useState(message.text),[mediaSrc,setMediaSrc]=useState<string|null>(null)
  const pressTimer=useRef<number|null>(null); const suppressClick=useRef(false)
  useEffect(()=>{let active=true;let objectUrl:string|null=null;if(!message.mediaUrl){setMediaSrc(null);return()=>{}};const token=getSession()?.accessToken;fetch(message.mediaUrl,{headers:token?{Authorization:`Bearer ${token}`}:{}}).then(async r=>{if(!r.ok)throw new Error('Media unavailable');const blob=await r.blob();objectUrl=URL.createObjectURL(blob);if(active)setMediaSrc(objectUrl)}).catch(()=>{if(active)setMediaSrc(null)});return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[message.mediaUrl])
  const reactionEntries=Object.entries(message.reactions||{}).filter(([,users])=>users.length>0)
  const chooseReaction=(emoji:string)=>{const mine=myId&&message.reactions?.[emoji]?.includes(myId);if(mine)onUnreact?.(message.id,emoji);else onReact?.(message.id,emoji);setPickerOpen(false)}
  const deleteClick=()=>{if(message.fromMe){const everyone=window.confirm('OK = delete for everyone, Cancel = delete for me only');onDelete?.(message.id,everyone)}else onDelete?.(message.id,false);setMenuOpen(false)}
  const beginPress=()=>{window.clearTimeout(pressTimer.current??undefined);suppressClick.current=false;pressTimer.current=window.setTimeout(()=>{suppressClick.current=true;onSelect?.(message.id);if(navigator.vibrate)navigator.vibrate(18)},520)}
  const endPress=()=>window.clearTimeout(pressTimer.current??undefined)
  const handleClick=()=>{if(suppressClick.current){suppressClick.current=false;return}if(selectionMode){onSelect?.(message.id)}}
  return <div id={`message-${message.id}`} className={`${message.fromMe?'message-row mine':'message-row'} ${selected?'is-selected':''}`} onMouseDown={beginPress} onMouseUp={endPress} onMouseLeave={endPress} onTouchStart={beginPress} onTouchEnd={endPress} onClick={handleClick}>
    {selectionMode&&<div className={selected?'message-select-dot active':'message-select-dot'}>{selected?'✓':''}</div>}
    <div className="bubble">
      {message.forwardedFrom&&<div className="forwarded-label"><span>↗</span><strong>Forwarded</strong></div>}
      {message.replyTo&&<button className="reply-preview" onClick={(e)=>{e.stopPropagation();document.getElementById(`message-${message.replyTo?.id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}}><span>Reply to {message.replyTo.senderName||'message'}</span><strong>{message.replyTo.text||'Attachment'}</strong></button>}
      {!message.deleted&&message.kind==='image'&&message.mediaUrl?<div className="media-image">{mediaSrc?<img src={mediaSrc} alt={message.mediaName||'Image'} loading="lazy"/>:<span>Loading media…</span>}</div>
      :!message.deleted&&message.kind==='audio'&&message.mediaUrl?<div className="voice-note">{mediaSrc?<audio controls preload="metadata" src={mediaSrc}/>:<span>Loading voice note…</span>}<small>{message.mediaName||'Voice note'}</small></div>
      :!message.deleted&&message.kind==='document'&&message.mediaUrl?<a className="file-bubble" href={mediaSrc||undefined} target="_blank" rel="noreferrer">📎 {message.mediaName||'Attachment'}</a>
      :!message.deleted&&message.kind==='video'&&message.mediaUrl?<div className="video-bubble">{mediaSrc?<video controls preload="metadata" src={mediaSrc}/>:<span>Loading media…</span>}</div>
      :editing?<div className="edit-row"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onEdit?.(message.id,draft.trim());setEditing(false)}if(e.key==='Escape')setEditing(false)}} autoFocus/><button onClick={()=>{onEdit?.(message.id,draft.trim());setEditing(false)}}>Save</button><button onClick={()=>setEditing(false)}>Cancel</button></div>
      :<p className={message.deleted?'deleted-text':''}>{message.text}{message.edited&&!message.deleted?<em className="edited-tag"> (edited)</em>:null}</p>}
      {reactionEntries.length>0&&<div className="reaction-row">{reactionEntries.map(([emoji,users])=><button key={emoji} className={myId&&users.includes(myId)?'reaction-chip mine':'reaction-chip'} onClick={(e)=>{e.stopPropagation();chooseReaction(emoji)}}>{emoji} {users.length}</button>)}</div>}
      <div className="message-time"><span>{message.time}</span>{message.fromMe&&<Icon name={message.status==='sent'?'check':'check2'} className={message.status==='read'?'read-tick':''}/>}</div>
      {!message.deleted&&!selectionMode&&<div className="bubble-actions"><button className="icon-btn" onClick={(e)=>{e.stopPropagation();onReply?.(message)}} aria-label="Reply">↩</button><button className="icon-btn" onClick={(e)=>{e.stopPropagation();onForward?.(message)}} aria-label="Forward">↗</button><button className="icon-btn" onClick={(e)=>{e.stopPropagation();setPickerOpen(v=>!v)}} aria-label="React"><Icon name="plus" width={14} height={14}/></button><button className="icon-btn" onClick={(e)=>{e.stopPropagation();setMenuOpen(v=>!v)}} aria-label="More"><Icon name="more" width={14} height={14}/></button></div>}
      {pickerOpen&&<div className="reaction-picker">{QUICK_REACTIONS.map(emoji=><button key={emoji} onClick={(e)=>{e.stopPropagation();chooseReaction(emoji)}}>{emoji}</button>)}</div>}
      {menuOpen&&<div className="bubble-menu"><button onClick={()=>{setEditing(true);setMenuOpen(false)}} style={{display:message.fromMe?'block':'none'}}>Edit</button><button onClick={()=>{onReply?.(message);setMenuOpen(false)}}>Reply</button><button onClick={()=>{onForward?.(message);setMenuOpen(false)}}>Forward</button><button onClick={deleteClick}>Delete</button></div>}
    </div>
  </div>
}
