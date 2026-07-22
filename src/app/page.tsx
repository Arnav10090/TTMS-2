"use client"

"use client"

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CapacityUtilizationKPI from '@/components/dashboard/CapacityUtilizationKPI'
import TurnaroundTimeKPI from '@/components/dashboard/TurnaroundTimeKPI'
import VehicleSummaryKPI from '@/components/dashboard/VehicleSummaryKPI'
import DispatchSummaryKPI from '@/components/dashboard/DispatchSummaryKPI'
import ParkingGrid from '@/components/dashboard/ParkingGrid'
import VehicleTable from '@/components/dashboard/VehicleTable'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import TimeRangeToggle, { RangeMode } from '@/components/ui/TimeRangeToggle'
import Modal from '@/components/ui/Modal'
import TrendsChart from '@/components/charts/TrendsChart'
import RangeHint from '@/components/ui/TimeRangeHint'

export default function Page() {
  const { kpiData, vehicleData, parkingData, loading } = useRealTimeData()
  const completedVehicles = vehicleData.filter((v) => v.stages && v.stages.gateExit && v.stages.gateExit.state === 'completed')
  const vehiclesWithGateEntry = vehicleData.filter((v) => v.stages && v.stages.gateEntry && v.stages.gateEntry.state === 'completed')
  const hasGateEntryCompleted = vehiclesWithGateEntry.length > 0
  const hasCompleted = completedVehicles.length > 0

  // Calculate KPI values based on ACTUAL vehicle stage completion counts
  const gateEntryCount = vehiclesWithGateEntry.length
  const gateExitCount = completedVehicles.length
  const trucksInside = Math.max(0, gateEntryCount - gateExitCount)
  const plantCapacity = kpiData.capacity.plantCapacity || 120
  const utilization = Math.round((trucksInside / Math.max(1, plantCapacity)) * 100)

  // Build displayKpi from scratch, using calculated values for Vehicle Summary and Capacity Utilization
  const displayKpi = {
    capacity: {
      utilization: hasGateEntryCompleted ? utilization : 0,
      plantCapacity: plantCapacity,
      trucksInside: hasGateEntryCompleted ? trucksInside : 0,
      trend: { direction: 'up' as const, percentage: hasGateEntryCompleted ? Math.round(utilization * 0.1) : 0 }
    },
    turnaround: { avgDay: 0, avgCum: 0, lastYear: kpiData.turnaround.lastYear || 0, trend: { direction: 'up' as const, percentage: 0 }, performanceColor: 'blue' as const, sparkline: kpiData.turnaround.sparkline || [] },
    vehicles: {
      inDay: hasGateEntryCompleted ? gateEntryCount : 0,
      outDay: hasCompleted ? gateExitCount : 0,
      inCum: hasGateEntryCompleted ? gateEntryCount : 0,
      outCum: hasCompleted ? gateExitCount : 0,
      trend: { direction: 'up' as const, percentage: hasGateEntryCompleted ? Math.round(gateEntryCount * 0.5) : 0 },
      target: 0
    },
    dispatch: {
      today: hasCompleted ? gateExitCount : 0,
      cumMonth: hasCompleted ? kpiData.dispatch.cumMonth || gateExitCount : 0,
      targetDay: kpiData.dispatch.targetDay || 120,
      trend: { direction: 'up' as const, percentage: hasCompleted ? Math.round(gateExitCount * 0.2) : 0 }
    },
    dwell: { totalDwellDay: 0, totalDwellCum: 0, avgDwellDay: 0, avgDwellCum: 0, totalDwellRatioDay: 0, totalDwellRatioCum: 0, avgDwellRatioDay: 0, avgDwellRatioCum: 0, trend: { direction: 'up' as const, percentage: 0 }, sparkline: kpiData.dwell.sparkline || [] },
  }

  // Calculate Turnaround Time and Dwell Time from completed vehicles (vehicles that have completed gate exit)
  if (hasCompleted) {
    try {
      const v = completedVehicles

      const ttrs = v.map((veh) => {
        const stages = veh.stages || {}
        const keys: Array<keyof typeof stages> = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']
        return keys.reduce((sum, k) => {
          const st: any = stages[k]
          if (!st) return sum
          return sum + Math.max(0, st.waitTime || st.stdTime || 0)
        }, 0)
      })
      const avgTTR = ttrs.length ? Math.round(ttrs.reduce((s, x) => s + x, 0) / ttrs.length) : 0

      const totalDwell = v.reduce((s, veh) => {
        const stages = veh.stages || {}
        return s + ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit'].reduce((ss, k) => ss + ((stages as any)[k]?.idleTime || 0), 0)
      }, 0)
      const avgDwell = v.length ? Math.round(totalDwell / v.length) : 0

      displayKpi.turnaround = { ...displayKpi.turnaround, avgDay: avgTTR, avgCum: avgTTR }
      displayKpi.dwell = { ...displayKpi.dwell, totalDwellDay: totalDwell, avgDwellDay: avgDwell }
    } catch { }
  }
  const [range, setRange] = useState<RangeMode>('today')
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex flex-col items-end">
          <TimeRangeToggle mode={range} setMode={setRange} onCompare={() => setCompareOpen(true)} />
          <RangeHint mode={range} />
        </div>
      </div>

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)}>
        <div className="mb-3 flex justify-end">
          <TimeRangeToggle mode={range} setMode={setRange} hideCompare />
        </div>
        <TrendsChart data={kpiData} range={range} height="h-[70vh]" />
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <CapacityUtilizationKPI data={displayKpi.capacity} loading={loading} range={range} />
        <TurnaroundTimeKPI data={displayKpi.turnaround} loading={loading} range={range} />
        <VehicleSummaryKPI data={displayKpi.vehicles} loading={loading} range={range} />
        <DispatchSummaryKPI data={displayKpi.dispatch} loading={loading} range={range} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-4 lg:col-span-1">
          <ParkingGrid data={parkingData} />
        </div>
        <div className="card p-4 lg:col-span-3">
          <VehicleTable data={vehicleData} />
        </div>
      </div>
    </DashboardLayout>
  )
}
