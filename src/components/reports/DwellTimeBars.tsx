"use client"

import { VehicleRow, StageKey } from '@/types/vehicle'
import { useMemo } from 'react'

const stages: StageKey[] = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']

const calculateDwellMetricsForStage = (stageKey: StageKey, vehicleData: VehicleRow[]) => {
  if (vehicleData.length === 0) {
    return { totalDwellTime: 0, avgDwellTime: 0 }
  }

  let totalDwell = 0
  vehicleData.forEach((vehicle) => {
    const stage = vehicle.stages[stageKey]
    if (stage && stage.idleTime !== undefined) {
      totalDwell += stage.idleTime
    }
  })

  return {
    totalDwellTime: Math.round(totalDwell),
    avgDwellTime: vehicleData.length > 0 ? Math.round((totalDwell / vehicleData.length) * 10) / 10 : 0,
  }
}

export default function DwellTimeBars({ vehicleData = [] }: { vehicleData?: VehicleRow[] }) {
  const dwellMetrics = useMemo(() => {
    if (vehicleData.length === 0) {
      return { totalDwell: 0, avgDwell: 0 }
    }

    // Calculate metrics for each stage and sum the rounded values to match KPI cards
    let totalDwellSum = 0
    let avgDwellSum = 0

    stages.forEach((stage) => {
      const metrics = calculateDwellMetricsForStage(stage, vehicleData)
      totalDwellSum += metrics.totalDwellTime
      avgDwellSum += metrics.avgDwellTime
    })

    return {
      totalDwell: totalDwellSum,
      avgDwell: avgDwellSum,
    }
  }, [vehicleData])

  const maxValue = Math.max(dwellMetrics.totalDwell, dwellMetrics.avgDwell, 1)

  return (
    <div className="space-y-6">
      {/* Total Dwell Time Bar */}
      <div className="card p-4">
        <h3 className="text-slate-800 font-semibold mb-4">Total Dwell Time</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-700 font-medium">All Stages Combined</span>
          <span className="text-lg font-semibold text-slate-800">{dwellMetrics.totalDwell} min</span>
        </div>
        <div className="w-full bg-slate-200 rounded-ui h-8 overflow-hidden">
          <div
            className="h-full rounded-ui transition-all bg-gradient-to-r from-pink-500 to-rose-500"
            style={{
              width: `${maxValue > 0 ? (dwellMetrics.totalDwell / maxValue) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Average Dwell Time Bar */}
      <div className="card p-4">
        <h3 className="text-slate-800 font-semibold mb-4">Average Dwell Time</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-700 font-medium">All Stages Combined</span>
          <span className="text-lg font-semibold text-slate-800">{dwellMetrics.avgDwell} min</span>
        </div>
        <div className="w-full bg-slate-200 rounded-ui h-8 overflow-hidden">
          <div
            className="h-full rounded-ui transition-all bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{
              width: `${maxValue > 0 ? (dwellMetrics.avgDwell / maxValue) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
