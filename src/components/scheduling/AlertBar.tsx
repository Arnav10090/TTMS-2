"use client"

import { AlertItem } from '@/hooks/useSchedulingState'
import { useState } from 'react'

export default function AlertBar({ alerts, onRefresh }: { alerts: AlertItem[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? 6 : 2
  const slice = alerts.slice(0, rows)
  const cls = (lvl: AlertItem['level']) => lvl === 'critical' ? 'bg-red-600 text-white' : lvl === 'warning' ? 'bg-yellow-400 text-slate-900' : lvl === 'info' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-slate-800">System Alerts</h3>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded-ui bg-slate-100" onClick={()=>setExpanded((e)=>!e)}>{expanded?'Collapse':'Expand'}</button>
          <button className="px-2 py-1 rounded-ui bg-slate-100" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {slice.map((a) => (
          <div key={a.id} className={`rounded-ui px-3 py-2 ${cls(a.level)}`}>{new Date(a.ts).toLocaleTimeString()} — {a.message}</div>
        ))}
      </div>
    </div>
  )
}
