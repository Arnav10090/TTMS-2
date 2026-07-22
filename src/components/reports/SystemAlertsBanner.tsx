"use client"

import { useEffect, useState, useRef, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'

type Severity = 'warning' | 'critical' | 'info'
type Row = { id: string; text: string; severity: Severity; ts: number }

const DEFAULT_FOOTER_HEIGHT = 80

function rowCls(s: Severity) {
  return s === 'critical' ? 'bg-red-50 text-red-700' : s === 'warning' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
}

import { AlertManager } from '@/utils/alerts'

function SystemAlertsBanner() {
  const { pathname } = useLocation()
  const isPtms = pathname.startsWith('/ptms')

  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([]) // Start with empty array
  const footerRef = useRef<HTMLDivElement>(null)

  // ResizeObserver to track footer height and update CSS custom property
  useEffect(() => {
    const footerEl = footerRef.current
    if (!footerEl) return

    // Set initial height
    const initialHeight = footerEl.getBoundingClientRect().height || DEFAULT_FOOTER_HEIGHT
    document.documentElement.style.setProperty('--footer-height', `${initialHeight}px`)

    // Check if ResizeObserver is available
    if (typeof ResizeObserver === 'undefined') {
      console.warn('ResizeObserver is not available. Using default footer height.')
      return
    }

    // Observe size changes
    const observer = new ResizeObserver((entries) => {
      try {
        const height = entries[0].contentRect.height || DEFAULT_FOOTER_HEIGHT
        document.documentElement.style.setProperty('--footer-height', `${height}px`)
      } catch (error) {
        console.error('Error updating footer height:', error)
        // Fallback to default height on error
        document.documentElement.style.setProperty('--footer-height', `${DEFAULT_FOOTER_HEIGHT}px`)
      }
    })

    observer.observe(footerEl)
    return () => observer.disconnect()
  }, [])

  // Load acknowledged alerts from localStorage, but clear them on server restart
  useEffect(() => {
    try {
      // Check if this is the first load after server restart using sessionStorage
      const sessionKey = 'footerAlertsInitialized'
      const initialized = sessionStorage.getItem(sessionKey)

      // If not initialized, this is a server restart - clear acknowledged alerts
      if (!initialized) {
        console.log('Server restart detected - clearing acknowledged alerts')

        // Clear acknowledged alerts from localStorage on server restart
        try {
          localStorage.setItem('alerts_ack_v1', '[]')
        } catch (error) {
          console.error('Failed to clear acknowledged alerts:', error)
        }

        // Mark as initialized for this browser session
        sessionStorage.setItem(sessionKey, '1')

        setRows([])
        return
      }

      // Not a server restart - load acknowledged alerts from localStorage
      const acked = AlertManager.listAcknowledged() || []

      // Convert to rows format (no deduplication - keep all alerts)
      const mapped = acked.slice(0, 10).map((a: any) => {
        const rawLevel = a.alertLevel || 'warning'
        const severity: Severity = rawLevel === 'critical' || rawLevel === 'danger' ? 'critical' : rawLevel === 'info' ? 'info' : 'warning'

        // Format message for display
        let text = a.message || a.description || `${a.vehicleRegNo || 'System'} - ${a.stage || 'Alert'}`

        // If no formatted message exists, create one
        if (!a.message && a.vehicleRegNo && a.stage) {
          const ts = new Date(a.timestamp)
          const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          const displayStage = a.stage === 'Reporting' ? 'Main Gate' : a.stage
          text = `Vehicle ${a.vehicleRegNo} has Reported at the ${displayStage} at ${timeStr}`
        }

        // Create unique ID using vehicle reg no and timestamp
        const uniqueId = `${a.vehicleRegNo || a.id}-${new Date(a.timestamp).getTime()}`

        return {
          id: uniqueId,
          text,
          severity,
          ts: new Date(a.timestamp).getTime()
        }
      }) as Row[]

      setRows(mapped)
    } catch (error) {
      console.error('Error loading acknowledged alerts:', error)
    }
  }, [])

  // Listen for new acknowledged alerts via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const custom = e as CustomEvent<any>

        if (!custom?.detail) {
          console.warn('alarms-footer:add event received without detail')
          return
        }

        // Extract vehicle registration number
        let vehicleRegNo = String(custom.detail.equipment || '')

        if (!vehicleRegNo && custom.detail.message) {
          const match = custom.detail.message.match(/Vehicle\s+(\S+)/)
          if (match?.[1]) {
            vehicleRegNo = match[1]
          }
        }

        if (!vehicleRegNo) {
          console.warn('Could not extract vehicle registration number from event:', custom.detail)
          return
        }

        // Map severity
        const rawSeverity = custom.detail.severity || 'Medium'
        const severity: Severity = rawSeverity === 'High' ? 'critical' : rawSeverity === 'Info' ? 'info' : 'warning'

        // Create unique ID using timestamp and vehicle reg no
        const uniqueId = `${vehicleRegNo}-${Date.now()}`

        const newRow: Row = {
          id: uniqueId,
          text: custom.detail.message || custom.detail.description || `${vehicleRegNo} - Alert`,
          severity,
          ts: new Date(custom.detail.timestamp).getTime()
        }

        setRows((prev) => {
          // Add new entry at the beginning (no deduplication - keep all alerts)
          return [newRow, ...prev].slice(0, 10)
        })
      } catch (error) {
        console.error('Error handling alarms-footer:add event:', error)
      }
    }

    window.addEventListener('alarms-footer:add', handler as EventListener)
    return () => window.removeEventListener('alarms-footer:add', handler as EventListener)
  }, [])

  return (
    <div ref={footerRef} className="footer-fixed bg-white shadow-lg" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
      <div className="w-full relative">
        {/* Expanded content - positioned above the header bar */}
        {open && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t-2 border-red-200 shadow-lg">
            <div className="max-h-64 overflow-auto bg-white">
              {rows.length === 0 ? (
                <div className="px-6 py-4 text-sm text-slate-500 text-center">
                  No acknowledged alerts yet
                </div>
              ) : (
                rows.map((r) => {
                  const badge = r.severity === 'critical' ? 'bg-red-600' : r.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-600'
                  // Calculate index: since we're mapping current 'rows', we can use the map index
                  // We need to pass index to map callback
                  return (
                    <div key={r.id} className={`px-6 py-2 text-sm border-t ${rowCls(r.severity as Severity)} border-slate-100`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 text-[10px] font-bold text-slate-700 shrink-0">
                            {rows.indexOf(r) + 1}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${badge}`}>{r.severity.toUpperCase()}</span>
                          <span>{r.text}</span>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(r.ts).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Header bar - always visible at bottom */}
        <div className="p-0 overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2 text-black">
            <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={16} /> {isPtms ? 'Process & Equipment related Alarms' : 'Vehicle & Logistics related Alarms'}</div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded-ui bg-white/20 hover:bg-white/30 active:translate-y-[1px]" aria-label="Refresh">
                <RefreshCw size={16} className="animate-spin" />
              </button>
              <button className="px-2 py-1 rounded-ui bg-white/20 hover:bg-white/30 active:translate-y-[1px]" onClick={() => setOpen((o) => !o)} aria-label="Toggle">
                {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap with React.memo to prevent unnecessary re-renders
const MemoizedSystemAlertsBanner = memo(SystemAlertsBanner)
MemoizedSystemAlertsBanner.displayName = 'SystemAlertsBanner'

export default MemoizedSystemAlertsBanner
