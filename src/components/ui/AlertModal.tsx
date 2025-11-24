"use client"

import { useEffect, useState } from 'react'
import { AlertManager } from '@/utils/alerts'

export default function AlertModal() {
  const [pending, setPending] = useState<any[]>(() => AlertManager.listPending())
  const [visible, setVisible] = useState<boolean>(false)

  // keep pending list fresh every 2 seconds
  useEffect(() => {
    const iv = setInterval(() => setPending(AlertManager.listPending()), 2000)
    return () => clearInterval(iv)
  }, [])

  // show modal every 60 seconds if there are pending alerts
  useEffect(() => {
    // show immediately if pending exists
    if ((AlertManager.listPending() || []).length > 0) setVisible(true)
    const iv = setInterval(() => {
      const p = AlertManager.listPending()
      setPending(p)
      if (p && p.length > 0) setVisible(true)
    }, 60000)
    return () => clearInterval(iv)
  }, [])

  if (!pending || pending.length === 0) return null

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-ui shadow-card border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Delay Alerts</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setVisible(false)} className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded">Close</button>
          </div>
        </div>
        <div className="max-h-64 overflow-auto mb-3">
          {pending.map((p) => {
            const rawLevel = p.alertLevel || 'warning'
            const level = rawLevel === 'danger' ? 'critical' : rawLevel
            const badge = level === 'critical' ? 'bg-red-600' : level === 'info' ? 'bg-blue-600' : 'bg-orange-500'
            const label = level === 'critical' ? 'CRITICAL' : level === 'info' ? 'INFO' : 'WARNING'
            return (
              <div key={p.id} className="border-b last:border-b-0 py-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badge}`}>{label}</span>
                    <span>{p.vehicleRegNo} — {p.stage}</span>
                  </div>
                  <div className="text-xs text-slate-600">Waiting: {p.waitTime}m • Std: {p.standardTime}m • {(() => { const d = new Date(p.timestamp); return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString()}` })()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { AlertManager.acknowledge(p.id); setPending(AlertManager.listPending()) }} className="px-3 py-1 rounded bg-blue-600 text-white">Acknowledge</button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-right">
          <button onClick={() => { pending.forEach(p=>AlertManager.acknowledge(p.id)); setPending([]) }} className="px-3 py-1 rounded bg-slate-100">Acknowledge All</button>
        </div>
      </div>
    </div>
  )
}
