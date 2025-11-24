"use client"

import { ReportStep, ReportStepKey } from '@/types/reports'
import { DoorOpen, Scale, Package, Weight, LogOut } from 'lucide-react'
import { useMemo, ReactNode } from 'react'

const iconMap: Record<ReportStepKey, ReactNode> = {
  gateEntry: <DoorOpen size={16} />,
  tareWeight: <Scale size={16} />,
  loading: <Package size={16} />,
  postLoadingWeight: <Weight size={16} />,
  gateExit: <LogOut size={16} />,
}

const colorMap: Record<ReportStepKey, string> = {
  gateEntry: '#1976D2',
  tareWeight: '#9E9E9E',
  loading: '#FF9800',
  postLoadingWeight: '#FFC107',
  gateExit: '#4CAF50',
}

export default function ProcessTimeline({
  steps,
  active,
  onSelect,
  vehicle,
}: {
  steps: ReportStep[]
  active?: ReportStepKey
  onSelect?: (k: ReportStepKey) => void
  vehicle?: string
}) {
  const total = useMemo(() => steps.reduce((s, x) => s + x.minutes, 0), [steps])

  return (
    <div
      className="card p-3"
      style={{
        background: 'linear-gradient(90deg, #4FC3F7 0%, #29B6F6 100%)',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-white font-semibold">Process Timeline</h3>
        {vehicle ? (
          <span className="text-white text-sm font-bold">{vehicle}</span>
        ) : null}
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px] flex items-stretch gap-2">
          {steps.map((s, idx) => {
            const w = (s.minutes / total) * 100
            const isActive = active === s.key
            return (
              <button
                key={s.key}
                onClick={() => onSelect?.(s.key)}
                title={`${s.label}: ${s.minutes} min`}
                className={`group relative flex-1 rounded-ui px-3 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-white/60 ${
                  isActive ? 'ring-2 ring-yellow-300 shadow-lg' : 'hover:shadow-md'
                }`}
                style={{
                  width: `${w}%`,
                  background: colorMap[s.key],
                }}
              >
                <div className="flex items-center gap-2 text-white">
                  <span className="opacity-90">{iconMap[s.key as ReportStepKey]}</span>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <div className="text-white/90 text-xl font-bold mt-1">{s.minutes} min</div>
                {idx < steps.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-white/30" />
                )}
                <div className="absolute inset-0 rounded-ui ring-1 ring-white/20 pointer-events-none" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
