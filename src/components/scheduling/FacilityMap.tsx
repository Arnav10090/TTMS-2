"use client"

import { useEffect, useRef, useState } from 'react'

function MapViewport({ heightClass, initialZoomMultiplier = 1 }: { heightClass: string; initialZoomMultiplier?: number }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement | null>(null)

  const CONTENT_W = 920
  const CONTENT_H = 700

  const fitToScreen = () => {
    const el = ref.current
    if (!el) return
    const cw = el.clientWidth || 0
    const ch = el.clientHeight || 0
    if (!cw || !ch) return
    const s = Math.min(cw / CONTENT_W, ch / CONTENT_H) * initialZoomMultiplier
    const tx = (cw - CONTENT_W * s) / 2
    const ty = (ch - CONTENT_H * s) / 2
    setScale(+Math.min(3, Math.max(0.3, s)).toFixed(3))
    setPos({ x: Math.round(tx), y: Math.round(ty) })
  }

  useEffect(() => {
    fitToScreen()
    const onResize = () => fitToScreen()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)))
  const zoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.2).toFixed(2)))
  const reset = () => fitToScreen()

  const onMouseDown = (e: React.MouseEvent) => { setPanning(true); setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y }) }
  const onMouseMove = (e: React.MouseEvent) => { if (panning) setPos({ x: e.clientX - start.x, y: e.clientY - start.y }) }
  const onMouseUp = () => setPanning(false)

  return (
    <div ref={ref} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
         className={`relative border border-slate-200 rounded-ui overflow-hidden bg-white ${heightClass} cursor-grab active:cursor-grabbing select-none`}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button onClick={zoomOut} aria-label="Zoom out" className="px-2 py-1 rounded-ui bg-slate-100 hover:bg-slate-200 shadow text-slate-700">−</button>
        <button onClick={zoomIn} aria-label="Zoom in" className="px-2 py-1 rounded-ui bg-slate-100 hover:bg-slate-200 shadow text-slate-700">+</button>
        <button onClick={reset} aria-label="Fit to screen" title="Fit to screen" className="px-2 py-1 rounded-ui bg-slate-100 hover:bg-slate-200 shadow text-slate-700">⟳</button>
      </div>
      <svg width="100%" height="100%">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
          <pattern id="truckPattern" patternUnits="userSpaceOnUse" width="40" height="20">
            <rect width="40" height="20" fill="#86efac" />
            <rect x="2" y="2" width="36" height="16" rx="2" fill="#065f46" opacity="0.3" />
          </pattern>
        </defs>
        <g transform={`translate(${pos.x},${pos.y}) scale(${scale})`}>
          <rect x="20" y="20" width="880" height="640" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
          <rect x="40" y="40" width="280" height="80" rx="8" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
          <text x="180" y="85" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-1</text>
          <rect x="150" y="125" width="60" height="18" rx="3" fill="#3b82f6" />
          <text x="180" y="138" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">GATE-4</text>
          <rect x="40" y="160" width="90" height="120" rx="8" fill="#d1d5db" stroke="#6b7280" strokeWidth="1" />
          <text x="85" y="225" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">BAY-2</text>
          <rect x="40" y="300" width="180" height="220" rx="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="130" y="415" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-3</text>
          <rect x="45" y="450" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="70" y="463" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-2</text>
          <rect x="170" y="350" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="195" y="363" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-3</text>
          <rect x="300" y="160" width="180" height="360" rx="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="390" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-4</text>
          <rect x="250" y="280" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="275" y="293" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-5</text>
          <rect x="480" y="380" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="505" y="393" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-6</text>
          <rect x="480" y="220" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="505" y="233" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-7</text>
          <rect x="560" y="160" width="180" height="360" rx="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="650" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-5</text>
          <rect x="510" y="280" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="535" y="293" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-8</text>
          <rect x="400" y="530" width="80" height="50" rx="4" fill="#fff2cc" stroke="#d69e2e" strokeWidth="1" />
          <text x="440" y="548" textAnchor="middle" fontSize="9" fill="#374151">Weighing</text>
          <text x="440" y="560" textAnchor="middle" fontSize="9" fill="#374151">Room #1</text>
          <rect x="770" y="530" width="80" height="50" rx="4" fill="#fff2cc" stroke="#d69e2e" strokeWidth="1" />
          <text x="810" y="548" textAnchor="middle" fontSize="9" fill="#374151">Weighing</text>
          <text x="810" y="560" textAnchor="middle" fontSize="9" fill="#374151">Room #2</text>
          <g>
            <rect x="40" y="540" width="180" height="60" rx="6" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
            <text x="130" y="575" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">PARKING AREA</text>
            <g fill="#065f46" opacity="0.4">
              <rect x="50" y="545" width="30" height="12" rx="2" />
              <rect x="85" y="545" width="30" height="12" rx="2" />
              <rect x="120" y="545" width="30" height="12" rx="2" />
              <rect x="50" y="580" width="30" height="12" rx="2" />
              <rect x="85" y="580" width="30" height="12" rx="2" />
              <rect x="120" y="580" width="30" height="12" rx="2" />
            </g>
            
            <rect x="300" y="540" width="180" height="60" rx="6" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
            <text x="390" y="575" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">PARKING AREA</text>
            <g fill="#065f46" opacity="0.4">
              <rect x="310" y="545" width="30" height="12" rx="2" />
              <rect x="345" y="545" width="30" height="12" rx="2" />
              <rect x="380" y="545" width="30" height="12" rx="2" />
              <rect x="415" y="545" width="30" height="12" rx="2" />
              <rect x="310" y="580" width="30" height="12" rx="2" />
              <rect x="345" y="580" width="30" height="12" rx="2" />
              <rect x="380" y="580" width="30" height="12" rx="2" />
              <rect x="415" y="580" width="30" height="12" rx="2" />
            </g>
          </g>
          <rect x="300" y="610" width="280" height="70" rx="6" fill="#fff" stroke="#374151" strokeWidth="1" />
          <text x="440" y="635" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">SALES AND</text>
          <text x="440" y="655" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">ADMIN BLDG</text>
          <rect x="40" y="610" width="100" height="70" rx="6" fill="#3b82f6" />
          <text x="90" y="635" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">MAIN GATE</text>
          <text x="90" y="650" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">ENTRY</text>
          <rect x="150" y="660" width="60" height="15" rx="3" fill="#3b82f6" />
          <text x="180" y="671" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-1</text>
          <rect x="760" y="610" width="100" height="70" rx="6" fill="#3b82f6" />
          <text x="810" y="635" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">MAIN GATE</text>
          <text x="810" y="650" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">EXIT</text>
          <rect x="690" y="660" width="60" height="15" rx="3" fill="#3b82f6" />
          <text x="720" y="671" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-9</text>
          <g stroke="#2563eb" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
            <path d="M 200 100 L 240 100" />
            <path d="M 280 100 L 320 100" />
            <path d="M 200 150 L 200 140" />
            <path d="M 390 150 L 390 140" />
            <path d="M 650 150 L 650 140" />
            <path d="M 140 200 L 180 200" />
            <path d="M 320 300 L 360 300" />
            <path d="M 580 300 L 620 300" />
            <path d="M 200 400 L 240 400" />
            <path d="M 540 400 L 580 400" />
            <path d="M 90 600 L 90 590" />
            <path d="M 180 600 L 220 600" />
            <path d="M 680 600 L 720 600" />
            <path d="M 810 600 L 810 590" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export default function FacilityMap() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-800">Facility Layout</h3>
        <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-ui bg-slate-100 hover:bg-slate-200 text-slate-700">Extend</button>
      </div>

      <MapViewport heightClass="h-[320px]" />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-ui shadow-card w-[92vw] max-w-[1280px] h-[86vh] p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-800">Facility Layout - Expanded</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="px-2 py-1 rounded-ui bg-slate-100 hover:bg-slate-200">✕</button>
            </div>
            <MapViewport heightClass="h-[calc(86vh-56px)]" initialZoomMultiplier={1.3} />
          </div>
        </div>
      )}
    </div>
  )
}
