"use client"

import { useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCw, XCircle } from 'lucide-react'

export default function DocumentViewer({ src, onClear }: { src: string | null; onClear?: () => void }) {
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const [panning, setPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panState = useRef<{ x: number; y: number; left: number; top: number }>({ x: 0, y: 0, left: 0, top: 0 })

  const content = useMemo(() => src, [src])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !content) return
    setPanning(true)
    panState.current = {
      x: e.clientX,
      y: e.clientY,
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    }
    containerRef.current.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panning || !containerRef.current) return
    const dx = e.clientX - panState.current.x
    const dy = e.clientY - panState.current.y
    containerRef.current.scrollLeft = panState.current.left - dx
    containerRef.current.scrollTop = panState.current.top - dy
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setPanning(false)
    containerRef.current?.releasePointerCapture?.(e.pointerId)
  }

  const clear = () => {
    setZoom(1)
    setRot(0)
    onClear?.()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button className="px-2 py-1 rounded bg-slate-100" onClick={() => setZoom((z) => Math.min(3, z + 0.1))}><ZoomIn size={16} /></button>
        <button className="px-2 py-1 rounded bg-slate-100" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}><ZoomOut size={16} /></button>
        <button className="px-2 py-1 rounded bg-slate-100" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw size={16} /></button>
        <button
          className={`px-2 py-1 rounded ${content ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'}`}
          onClick={clear}
          disabled={!content}
          aria-label="Clear document"
          title="Clear document"
        >
          <XCircle size={16} />
        </button>
      </div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        className={`border border-slate-200 rounded-ui h-80 overflow-auto bg-slate-50 flex items-center justify-center ${content ? (panning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
        style={{ userSelect: 'none' }}
      >
        {content ? (
          <img
            src={content}
            alt="Document"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
            className="transition-transform origin-top-left select-none pointer-events-none"
          />
        ) : (
          <div className="text-slate-500">No document selected</div>
        )}
      </div>
    </div>
  )
}
