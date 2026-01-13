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

export default function DwellTimeBars({ vehicleData = [] }: { vehicleData?: VehicleRow[] }) {
  const dwellMetrics = useMemo(() => {
    if (vehicleData.length === 0) {
      return stages.map((stage) => ({
        stage,
        label: stageLabels[stage],
        color: stageColors[stage],
        totalDwell: 0,
        avgDwell: 0,
      }))
    }

    return stages.map((stage) => {
      let totalDwell = 0
      vehicleData.forEach((vehicle) => {
        const stageData = vehicle.stages[stage]
        if (stageData && stageData.idleTime !== undefined) {
          totalDwell += stageData.idleTime
        }
      })

      return {
        stage,
        label: stageLabels[stage],
        color: stageColors[stage],
        totalDwell: Math.round(totalDwell),
        avgDwell: vehicleData.length > 0 ? Math.round((totalDwell / vehicleData.length) * 10) / 10 : 0,
      }
    })
  }, [vehicleData])

  const totalDwellSum = useMemo(() => dwellMetrics.reduce((sum, m) => sum + m.totalDwell, 0), [dwellMetrics])
  const avgDwellSum = useMemo(() => dwellMetrics.reduce((sum, m) => sum + m.avgDwell, 0), [dwellMetrics])
  const maxValue = useMemo(() => Math.max(...dwellMetrics.map(m => m.totalDwell), ...dwellMetrics.map(m => m.avgDwell), 1), [dwellMetrics])

  return (
    <div className="space-y-6">
      {/* Total Dwell Time Bar */}
      <div className="card p-4">
        <h3 className="text-slate-800 font-semibold mb-4">Total Dwell Time by Stage</h3>
        <div className="space-y-3">
          {dwellMetrics.map((metric) => (
            <div key={`total-${metric.stage}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-700 font-medium">{metric.label}</span>
                <span className="text-sm font-semibold text-slate-800">{metric.totalDwell} min</span>
              </div>
              <div className="w-full bg-slate-200 rounded-ui h-6 overflow-hidden">
                <div
                  className="h-full rounded-ui transition-all"
                  style={{
                    width: `${maxValue > 0 ? (metric.totalDwell / maxValue) * 100 : 0}%`,
                    backgroundColor: metric.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-right mt-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">Total Dwell Time:</span>
          <span className="text-lg font-bold text-slate-800 ml-2">{totalDwellSum} min</span>
        </div>
      </div>

      {/* Average Dwell Time Bar */}
      <div className="card p-4">
        <h3 className="text-slate-800 font-semibold mb-4">Average Dwell Time by Stage</h3>
        <div className="space-y-3">
          {dwellMetrics.map((metric) => (
            <div key={`avg-${metric.stage}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-700 font-medium">{metric.label}</span>
                <span className="text-sm font-semibold text-slate-800">{metric.avgDwell} min</span>
              </div>
              <div className="w-full bg-slate-200 rounded-ui h-6 overflow-hidden">
                <div
                  className="h-full rounded-ui transition-all"
                  style={{
                    width: `${maxValue > 0 ? (metric.avgDwell / maxValue) * 100 : 0}%`,
                    backgroundColor: metric.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-right mt-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">Total Average Dwell Time:</span>
          <span className="text-lg font-bold text-slate-800 ml-2">{avgDwellSum} min</span>
        </div>
      </div>
    </div>
  )
}
