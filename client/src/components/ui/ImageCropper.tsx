import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  file: File
  aspect: number
  title: string
  onCancel: () => void
  onConfirm: (file: File) => void
}

export function ImageCropper({ file, aspect, title, onCancel, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [src, setSrc] = useState('')
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{x:number;y:number;ox:number;oy:number} | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const image = useMemo(() => {
    if (!src) return null
    const img = new Image(); img.src = src
    return img
  }, [src])

  useEffect(() => {
    if (!image) return
    const draw = () => {
      const canvas = canvasRef.current; if (!canvas) return
      const w = 640; const h = Math.round(w / aspect)
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d'); if (!ctx) return
      ctx.fillStyle = '#0d1512'; ctx.fillRect(0,0,w,h)
      const base = Math.max(w / image.naturalWidth, h / image.naturalHeight)
      const s = base * scale
      const dw = image.naturalWidth * s; const dh = image.naturalHeight * s
      const x = (w-dw)/2 + offset.x; const y = (h-dh)/2 + offset.y
      ctx.drawImage(image, x, y, dw, dh)
    }
    if (image.complete && image.naturalWidth) draw(); else image.onload = draw
  }, [image, scale, offset, aspect])

  function startDrag(clientX:number, clientY:number) { drag.current = {x:clientX,y:clientY,ox:offset.x,oy:offset.y} }
  function moveDrag(clientX:number, clientY:number) { if (!drag.current) return; const dx=clientX-drag.current.x; const dy=clientY-drag.current.y; setOffset({x:drag.current.ox+dx,y:drag.current.oy+dy}) }
  function endDrag() { drag.current = null }

  async function confirm() {
    const canvas = canvasRef.current; if (!canvas) return
    setBusy(true)
    canvas.toBlob((blob) => {
      setBusy(false)
      if (!blob) return
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      onConfirm(new File([blob], `cropped-${Date.now()}.${ext}`, { type: blob.type || 'image/jpeg' }))
    }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92)
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true">
    <div className="crop-modal">
      <div className="crop-modal-head"><div><span className="eyebrow">IMAGE EDITOR</span><strong>{title}</strong></div><button className="icon-btn" onClick={onCancel}>×</button></div>
      <div className="crop-canvas-wrap"><canvas ref={canvasRef} className="crop-canvas" onPointerDown={e=>startDrag(e.clientX,e.clientY)} onPointerMove={e=>moveDrag(e.clientX,e.clientY)} onPointerUp={endDrag} onPointerLeave={endDrag} /></div>
      <div className="crop-controls"><label><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value={scale} onChange={e=>setScale(Number(e.target.value))} /></label><button className="secondary" onClick={()=>{setScale(1);setOffset({x:0,y:0})}}>Reset</button></div>
      <p className="crop-help">Drag the image to reposition it inside the frame.</p>
      <div className="modal-actions"><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" onClick={()=>void confirm()} disabled={busy}>{busy ? 'Preparing…' : 'Use cropped image'}</button></div>
    </div>
  </div>
}
