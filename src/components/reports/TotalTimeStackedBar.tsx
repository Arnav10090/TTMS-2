"use client"

import { ReportStep, ReportStepKey } from '@/types/reports'
import { useMemo } from 'react'

const colorMap: Record<ReportStepKey, string> = {
  gateEntry: '#1976D2',
  tareWeight: '#9E9E9E',
  loading: '#FF9800',
  postLoadingWeight: '#FFC107',
  gateExit: '#4CAF50',
}

export default function TotalTimeStackedBar({ steps, active, onSelect }: {
  steps: ReportStep[]
  active?: ReportStepKey
  onSelect?: (k: ReportStepKey) => void
}) {
  const total = useMemo(() => steps.reduce((s, x) => s + x.minutes, 0), [steps])

  return (
    <div className="card p-3">
      <h3 className="text-slate-800 font-semibold mb-1">Total Time Visualization</h3>
      <div className="w-full h-8 rounded-ui overflow-hidden flex ring-1 ring-slate-200">
        {steps.map((s) => {
          const w = (s.minutes / total) * 100
          const isActive = active === s.key
          return (
            <button
              key={s.key}
              className={`h-full transition-opacity focus:outline-none ${isActive ? 'opacity-100' : 'hover:opacity-90'}`}
              style={{ width: `${w}%`, background: colorMap[s.key] }}
              title={`${s.label}: ${s.minutes} min`}
              onClick={() => onSelect?.(s.key)}
            />
          )
        })}
      </div>
      <div className="text-center text-xs text-slate-600 mt-1 tracking-wide flex items-center justify-center gap-2">
        <span className="font-semibold text-slate-800">TOTAL TIME TAKEN:</span>
        <span className="text-slate-700">{total} min</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {steps.map((s) => (
          <div key={`legend-${s.key}`} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: colorMap[s.key] }} aria-hidden="true" />
            <span className="text-slate-700 text-xs">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
