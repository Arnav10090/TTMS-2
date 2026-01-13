"use client"

import { VehicleRow, StageKey } from '@/types/vehicle'
import { useMemo } from 'react'

const stages: StageKey[] = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']

export default function DwellStatsLine({ vehicleData = [] }: { vehicleData?: VehicleRow[] }) {
  const stats = useMemo(() => {
    if (vehicleData.length === 0) {
      return { avgDwell: 0, dwellRatio: 0 }
    }

    let totalDwell = 0
    let totalTimeTaken = 0

    vehicleData.forEach((vehicle) => {
      // Calculate total dwell time from all stages
      let vehicleDwell = 0
      stages.forEach((stage) => {
        const stageData = vehicle.stages[stage]
        if (stageData && stageData.idleTime !== undefined) {
          vehicleDwell += stageData.idleTime
        }
      })
      totalDwell += vehicleDwell
      totalTimeTaken += vehicle.ttr || 0
    })

    // Avg Dwell Time = Total Dwell Time / Number of Stages (5)
    const avgDwell = totalDwell > 0 ? Math.round((totalDwell / stages.length) * 10) / 10 : 0
    const dwellRatio = totalTimeTaken > 0 ? Math.round((totalDwell / totalTimeTaken) * 10000) / 100 : 0

    return { avgDwell, dwellRatio }
  }, [vehicleData])

  return (
    <div className="flex items-center gap-8 text-lg whitespace-nowrap">
      <div>
        <span className="text-slate-600 mr-2">Avg Dwell Time:</span>
        <span className="font-bold text-slate-900">{stats.avgDwell} min</span>
      </div>
      <div>
        <span className="text-slate-600 mr-2">Dwell Ratio:</span>
        <span className="font-bold text-slate-900">{stats.dwellRatio.toFixed(2)}%</span>
      </div>
    </div>
  )
}
