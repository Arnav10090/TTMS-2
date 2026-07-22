"use client"

import { useEffect, useState } from 'react'
import { AlertManager } from '@/utils/alerts'

export default function AlertModal() {
  const [visible, setVisible] = useState<boolean>(false)
  const [pending, setPending] = useState<any[]>([])

  const reload = () => {
    try {
      const list = AlertManager.listPending() || []
      setPending(list)
      setVisible(list.length > 0)
    } catch { setPending([]); setVisible(false) }
  }

  useEffect(() => {
    // Load existing pending alerts
    reload()
    // Listen for updates
    const listener = () => reload()
    window.addEventListener('alerts-updated', listener)
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('alerts-updated', listener)
      window.removeEventListener('storage', listener)
    }
  }, [])

  if (!visible || pending.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-ui shadow-card border border-slate-200 p-4">
        {pending.length > 0 && (
          <div className="mb-2 text-center">
            <span className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {pending.length} message{pending.length !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {pending.length > 0 && (() => {
              const stage = pending[0].stage
              if (stage === 'Reporting') return 'Vehicle Reporting Alert'
              if (stage === 'Gate Entry') return 'Vehicle Document Verification Alert'
              if (stage === 'Parking Reached' || stage === 'Parking Left') return 'Vehicle Parking Alert'
              if (stage === 'Tare Weight') return 'Vehicle Tare Weight Alert'
              if (stage === 'Loading') return 'Vehicle Loading Alert'
              if (stage === 'Wt Post Loading') return 'Vehicle Wt Post Loading Alert'
              if (stage === 'Gate Exit') return 'Vehicle Gate Exit Alert'
              return 'Vehicle Alert'
            })()}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setVisible(false)} className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded">Close</button>
          </div>
        </div>
        <div className="max-h-64 overflow-auto mb-3">
          {pending.length > 0 && (() => {
            const p = pending[0] // Only show the newest alert (top of stack)

            const level = p.alertLevel
            const badge = level === 'critical' ? 'bg-red-600' : level === 'info' ? 'bg-blue-600' : 'bg-orange-500'
            const label = level === 'critical' ? 'CRITICAL' : level === 'info' ? 'INFO' : 'WARNING'

            // Format the message based on stage
            let displayMessage = `${p.vehicleRegNo} — ${p.stage}`
            if (p.stage === 'Gate Entry') {
              displayMessage = `${p.vehicleRegNo} - Document Verification Complete`
            } else if (p.stage === 'Parking Reached' || p.stage === 'Parking Left') {
              // Use the custom message that includes the parking spot number
              displayMessage = p.message || `${p.vehicleRegNo} — ${p.stage}`
            } else if (p.stage === 'Tare Weight') {
              displayMessage = `${p.vehicleRegNo} - Tare Weight Complete`
            } else if (p.stage === 'Loading') {
              displayMessage = `${p.vehicleRegNo} - Loading Complete`
            } else if (p.stage === 'Wt Post Loading') {
              displayMessage = `${p.vehicleRegNo} - Wt Post Loading Complete`
            } else if (p.stage === 'Gate Exit') {
              displayMessage = `${p.vehicleRegNo} - Gate Exit Complete`
            } else if (p.stage === 'Reporting') {
              displayMessage = `${p.vehicleRegNo} - Reported at Main Gate`
            }

            return (
              <div key={p.id} className="py-2">
                <div className="flex flex-col gap-4">
                  <div className="font-medium flex items-center gap-2 text-lg">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ${badge}`}>{label}</span>
                    <span>{displayMessage}</span>
                  </div>
                  <div className="text-sm text-slate-500">{(() => { const d = new Date(p.timestamp); return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString()}` })()}</div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => { try { AlertManager.acknowledge(p.id); reload() } catch { } }}
                      className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

      </div>
    </div>
  )
}
