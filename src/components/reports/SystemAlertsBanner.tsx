"use client"

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'

type Severity = 'warning'|'critical'|'info'
type Row = { id: string; text: string; severity: Severity; ts: number }

const now = Date.now()

const ptmsInitial: Row[] = [
  { id: '1', text: 'Tank #2 HCl concentration exceeds safe limit (165 g/l)', severity: 'critical', ts: now - 1000 * 60 * 5 },
  { id: '2', text: 'Pickling Line-1 temperature warning: 72°C threshold exceeded', severity: 'warning', ts: now - 1000 * 60 * 3 },
  { id: '3', text: 'Sensor #12 communication loss detected', severity: 'warning', ts: now - 1000 * 60 * 2 },
  { id: '4', text: 'Hot Rinse Tank level trending low at 18%', severity: 'info', ts: now - 1000 * 60 * 1 },
]

const ttmsInitial: Row[] = [
  { id: '1', text: 'Vehicle MH12-2145 waiting longer than expected at Loading Bay A (22 min)', severity: 'critical', ts: now - 1000 * 60 * 5 },
  { id: '2', text: 'Vehicle MH12-2090 experiencing delay at Fuel Station (15 min)', severity: 'warning', ts: now - 1000 * 60 * 3 },
  { id: '3', text: 'Gate 5 congestion: 3 vehicles in queue', severity: 'warning', ts: now - 1000 * 60 * 2 },
  { id: '4', text: 'Minor congestion cleared at Gate 5', severity: 'info', ts: now - 1000 * 60 * 1 },
]

function rowCls(s: Severity) {
  return s === 'critical' ? 'bg-red-50 text-red-700' : s === 'warning' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
}

import { AlertManager } from '@/utils/alerts'

export default function SystemAlertsBanner() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>(initial)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(iv)
  }, [])

  // Periodically refresh banner content from AlertManager (pending, acked, history)
  useEffect(() => {
    const iv = setInterval(() => {
      const pending = AlertManager.listPending() || []
      const acked = AlertManager.listAcknowledged() || []
      const history = AlertManager.listHistory() || []
      // combine recent items: pending first, then acked, then history
      const combined = [
        ...pending,
        ...acked,
        ...history
      ]
      const mapped = combined.slice(0, 10).map((a: any) => {
        const rawLevel = a.alertLevel || 'warning'
        const severity: Severity = rawLevel === 'critical' || rawLevel === 'danger' ? 'critical' : rawLevel === 'info' ? 'info' : 'warning'
        const text = a.message || a.description || `${a.equipment || a.equipmentId || 'System'} - ${a.type || 'Alert'}`
        return { id: a.id, text, severity, ts: new Date(a.timestamp).getTime() }
      }) as Row[]
      setRows(mapped)
    }, 5000)
    return () => clearInterval(iv)
  }, [])

  // Add auto-refresh tick for other unrelated updates
  useEffect(() => {
    const t = setInterval(() => {})
    return () => clearInterval(t)
  }, [])


  return (
    <div className={`fixed left-0 right-0 bottom-2 z-50`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="card p-0 overflow-hidden border border-red-200">
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={16}/> System & Solutions related Alarms</div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded-ui bg-white/20 hover:bg-white/30 active:translate-y-[1px]" aria-label="Refresh">
                <RefreshCw size={16} className="animate-spin" />
              </button>
              <button className="px-2 py-1 rounded-ui bg-white/20 hover:bg-white/30 active:translate-y-[1px]" onClick={() => setOpen((o) => !o)} aria-label="Toggle">
                {open ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
              </button>
            </div>
          </div>
          {open && (
            <>
              <div className="max-h-64 overflow-auto">
                {rows.map((r) => {
                  const badge = r.severity === 'critical' ? 'bg-red-600' : r.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-600'
                  return (
                    <div key={r.id} className={`px-3 py-2 text-sm border-t ${rowCls(r.severity as Severity)} border-slate-100`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badge}`}>{r.severity.toUpperCase()}</span>
                          <span>{r.text}</span>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(r.ts).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-3 py-1 text-xs text-slate-100/90 border-t bg-gradient-to-r from-orange-500 to-red-600">Latest alarms by severity • Critical (red), Warning (orange), Info (blue)</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
