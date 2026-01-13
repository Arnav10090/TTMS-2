"use client"

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CapacityUtilizationKPI from '@/components/dashboard/CapacityUtilizationKPI'
import TurnaroundTimeKPI from '@/components/dashboard/TurnaroundTimeKPI'
import DwellTimeKPI from '@/components/dashboard/DwellTimeKPI'
import VehicleSummaryKPI from '@/components/dashboard/VehicleSummaryKPI'
import DispatchSummaryKPI from '@/components/dashboard/DispatchSummaryKPI'
import ParkingGrid from '@/components/dashboard/ParkingGrid'
import VehicleTable from '@/components/dashboard/VehicleTable'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import TimeRangeToggle, { RangeMode } from '@/components/ui/TimeRangeToggle'
import Modal from '@/components/ui/Modal'
import TrendsChart from '@/components/charts/TrendsChart'
import RangeHint from '@/components/ui/TimeRangeHint'

export default function TTMSDashboardPage() {
  const { kpiData, vehicleData, parkingData, loading } = useRealTimeData()
  const [range, setRange] = useState<RangeMode>('today')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex flex-col items-end">
          <TimeRangeToggle
            mode={range}
            setMode={setRange}
            onCompare={() => setCompareOpen(true)}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          <RangeHint mode={range} customFrom={customFrom} customTo={customTo} />
        </div>
      </div>

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)}>
        <div className="mb-3 flex justify-end">
          <TimeRangeToggle
            mode={range}
            setMode={setRange}
            hideCompare
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
        </div>
        <TrendsChart data={kpiData} range={range} height="h-[70vh]" />
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <CapacityUtilizationKPI data={kpiData.capacity} loading={loading} range={range} />
        <TurnaroundTimeKPI data={kpiData.turnaround} loading={loading} range={range} />
        <DwellTimeKPI data={kpiData.dwell} loading={loading} range={range} />
        <VehicleSummaryKPI data={kpiData.vehicles} loading={loading} range={range} />
        <DispatchSummaryKPI data={kpiData.dispatch} loading={loading} range={range} />
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
