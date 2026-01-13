"use client"

import { VehicleRow, StageKey } from '@/types/vehicle'
import { useMemo } from 'react'

const stageLabels: Record<StageKey, string> = {
  gateEntry: 'Gate Entry',
  tareWeighing: 'Tare Weight',
  loading: 'Loading',
  postLoadingWeighing: 'Weight after Loading',
  gateExit: 'Gate Exit',
}

const stageColors: Record<StageKey, string> = {
  gateEntry: '#1976D2',
  tareWeighing: '#9E9E9E',
  loading: '#FF9800',
  postLoadingWeighing: '#FFC107',
  gateExit: '#4CAF50',
}

const stages: StageKey[] = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']

export default function DwellTimeVisualization({ vehicle }: { vehicle?: VehicleRow }) {
  const dwellMetrics = useMemo(() => {
    if (!vehicle) {
      return {
        stageDwellTimes: stages.map((stage) => ({
          stage,
          label: stageLabels[stage],
          color: stageColors[stage],
          dwell: 0,
        })),
        totalDwell: 0,
        avgDwell: 0,
        dwellRatio: 0,
      }
    }

    const stageDwellTimes = stages.map((stage) => ({
      stage,
      label: stageLabels[stage],
      color: stageColors[stage],
      dwell: Math.round(vehicle.stages[stage]?.idleTime || 0),
    }))

    const totalDwell = stageDwellTimes.reduce((sum, s) => sum + s.dwell, 0)
    const avgDwell = vehicle.totalDwellTime ? Math.round((vehicle.totalDwellTime / stages.length) * 10) / 10 : 0
    const dwellRatio = vehicle.dwellRatio ? Math.round(vehicle.dwellRatio * 10000) / 100 : 0

    return {
      stageDwellTimes,
      totalDwell,
      avgDwell,
      dwellRatio,
    }
  }, [vehicle])

  if (!vehicle) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Total Dwell Time by Stage - Stacked Bar */}
      <div className="card p-3">
        <h3 className="text-slate-800 font-semibold mb-1">Total Dwell Time Visualization</h3>
        <div className="w-full h-8 rounded-ui overflow-hidden flex ring-1 ring-slate-200">
          {dwellMetrics.stageDwellTimes.map((s) => {
            const w = dwellMetrics.totalDwell > 0 ? (s.dwell / dwellMetrics.totalDwell) * 100 : 0
            return (
              <div
                key={`dwell-${s.stage}`}
                className="h-full transition-opacity hover:opacity-80 cursor-pointer"
                style={{ width: `${w}%`, background: s.color }}
                title={`${s.label}: ${s.dwell} min`}
              />
            )
          })}
        </div>
        <div className="text-center text-xs text-slate-600 mt-1 tracking-wide flex items-center justify-center gap-2">
          <span className="font-semibold text-slate-800">TOTAL DWELL TIME:</span>
          <span className="text-slate-700">{dwellMetrics.totalDwell} min</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {dwellMetrics.stageDwellTimes.map((s) => (
            <div key={`legend-${s.stage}`} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ background: s.color }} aria-hidden="true" />
              <span className="text-slate-700 text-xs">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Average Dwell Time and Dwell Ratio - Text Only */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <h3 className="text-slate-800 font-semibold mb-2">Average Dwell Time</h3>
          <div className="text-2xl font-bold text-slate-800">{dwellMetrics.avgDwell} <span className="text-sm">min</span></div>
        </div>

        <div className="card p-3">
          <h3 className="text-slate-800 font-semibold mb-2">Dwell Ratio</h3>
          <div className="text-2xl font-bold text-slate-800">{dwellMetrics.dwellRatio} <span className="text-sm">%</span></div>
        </div>
      </div>
    </div>
  )
}
