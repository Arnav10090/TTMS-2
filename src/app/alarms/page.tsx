"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useEffect, useMemo, useState } from 'react'
import { AlertManager } from '@/utils/alerts'

export default function Page() {
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<'all'|'critical'|'warning'|'info'>('all')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')

  useEffect(() => {
    const refresh = () => {
      const hist = AlertManager.listHistory() || []
      const ack = AlertManager.listAcknowledged() || []
      const pending = AlertManager.listPending() || []
      // combine: history first (older), then acknowledged, then pending (most recent)
      let combined = [...pending, ...ack, ...hist]
      const sampleIds = [
        'sample-warning-1',
        'sample-warning-2',
        'sample-info-1',
        'sample-info-2'
      ]
      combined = combined.filter((r: any) => !sampleIds.includes(r.id))
      const now = Date.now()
      const warningSamples = [
        {
          id: 'sample-warning-1',
          vehicleRegNo: 'MH12-2145',
          stage: 'Loading Bay A',
          waitTime: 22,
          standardTime: 12,
          exceedanceRatio: 1.83,
          alertLevel: 'warning',
          timestamp: new Date(now - 1000 * 60 * 12),
          message: 'Vehicle MH12-2145 waiting longer than expected at Loading Bay A'
        },
        {
          id: 'sample-warning-2',
          vehicleRegNo: 'MH12-2090',
          stage: 'Fuel Station',
          waitTime: 15,
          standardTime: 8,
          exceedanceRatio: 1.88,
          alertLevel: 'warning',
          timestamp: new Date(now - 1000 * 60 * 18),
          message: 'Vehicle MH12-2090 experiencing delay at Fuel Station'
        }
      ]
      const infoSamples = [
        {
          id: 'sample-info-1',
          vehicleRegNo: 'Maintenance-02',
          stage: 'Gate 5',
          waitTime: 4,
          standardTime: 12,
          exceedanceRatio: 0.33,
          alertLevel: 'info',
          timestamp: new Date(now - 1000 * 60 * 6),
          message: 'Minor congestion cleared at Gate 5'
        },
        {
          id: 'sample-info-2',
          vehicleRegNo: 'System-Notice',
          stage: 'Control Room',
          waitTime: 2,
          standardTime: 10,
          exceedanceRatio: 0.2,
          alertLevel: 'info',
          timestamp: new Date(now - 1000 * 60 * 2),
          message: 'Shift handover note: weighbridge sensors calibrated'
        }
      ]
      const warningCount = combined.filter((r: any) => (r.alertLevel ?? 'warning') === 'warning').length
      const infoCount = combined.filter((r: any) => (r.alertLevel ?? 'warning') === 'info').length
      if (warningCount < 2) {
        combined = [...warningSamples.slice(0, 2 - warningCount), ...combined]
      }
      if (infoCount < 2) {
        combined = [...infoSamples.slice(0, 2 - infoCount), ...combined]
      }
      setRows(combined)
    }
    refresh()
    const iv = setInterval(refresh, 4000)
    return () => clearInterval(iv)
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (query) {
        const q = query.toLowerCase()
        if (!(String(r.vehicleRegNo || '').toLowerCase().includes(q) || String(r.stage || '').toLowerCase().includes(q) || String(r.message || '').toLowerCase().includes(q))) return false
      }
      if (severity !== 'all') {
        const lvl = (r.alertLevel || 'warning') as string
        const normalized = lvl === 'danger' ? 'critical' : lvl
        if (severity !== normalized) return false
      }
      if (start) {
        const s = new Date(start).getTime()
        if (new Date(r.timestamp).getTime() < s) return false
      }
      if (end) {
        const e = new Date(end).getTime()
        if (new Date(r.timestamp).getTime() > e) return false
      }
      return true
    })
  }, [rows, query, severity, start, end])

  return (
    <DashboardLayout>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Alarms</h2>
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search reg no, stage, message..." className="px-3 py-2 border rounded-md" />
            <select value={severity} onChange={(e)=>setSeverity(e.target.value as 'all'|'critical'|'warning'|'info')} className="px-3 py-2 border rounded-md">
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} className="px-3 py-2 border rounded-md" />
            <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} className="px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b">
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">Reg No</th>
                <th className="py-2 px-2">RFID / Stage</th>
                <th className="py-2 px-2">Message</th>
                <th className="py-2 px-2 text-center">Wait (m)</th>
                <th className="py-2 px-2 text-center">Std (m)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const rawLevel = r.alertLevel ?? 'warning'
                const level = rawLevel === 'danger' ? 'critical' : rawLevel
                const badgeClass = level === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : level === 'info'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                const message = r.message || `${r.vehicleRegNo} - ${r.stage}`
                const label = level === 'critical' ? 'Critical' : level === 'info' ? 'Info' : 'Warning'
                return (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-2 px-2 text-xs text-slate-600">{new Date(r.timestamp).toLocaleString('en-GB')}</td>
                    <td className="py-2 px-2 font-medium">{r.vehicleRegNo}</td>
                    <td className="py-2 px-2 text-slate-600">{r.stage || r.rfidNo || '-'}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${badgeClass}`}>{label}</span>
                        <span>{message}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">{r.waitTime ?? '-'}</td>
                    <td className="py-2 px-2 text-center">{r.standardTime ?? '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardLayout>
  )
}
