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
    let totalWaitTime = 0
    let validVehicles = 0

    vehicleData.forEach((vehicle) => {
      stages.forEach((stage) => {
        const stageData = vehicle.stages[stage]
        if (stageData && stageData.idleTime !== undefined) {
          totalDwell += stageData.idleTime
          totalWaitTime += stageData.waitTime || 0
        }
      })
      if (vehicle.totalDwellTime !== undefined) {
        validVehicles++
      }
    })

    const avgDwell = validVehicles > 0 ? Math.round((totalDwell / validVehicles) * 10) / 10 : 0
    const dwellRatio = totalWaitTime > 0 ? Math.round((totalDwell / totalWaitTime) * 10000) / 100 : 0

    return { avgDwell, dwellRatio }
  }, [vehicleData])

  return (
    <div className="flex items-center gap-8 text-sm whitespace-nowrap">
      <div>
        <span className="text-slate-600 mr-2">Avg Dwell Time:</span>
        <span className="font-bold text-slate-900">{stats.avgDwell} min</span>
      </div>
      <div>
        <span className="text-slate-600 mr-2">Dwell Ratio:</span>
        <span className="font-bold text-slate-900">{stats.dwellRatio}%</span>
      </div>
    </div>
  )
}
