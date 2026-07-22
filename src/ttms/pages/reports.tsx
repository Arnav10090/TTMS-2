"use client"

import { useEffect, useMemo, useState } from 'react'
import SearchHeader from '@/components/reports/SearchHeader'
import ProcessTimeline from '@/components/reports/ProcessTimeline'
import SummaryCards from '@/components/reports/SummaryCards'
import TotalTimeStackedBar from '@/components/reports/TotalTimeStackedBar'
import DwellTimeBars from '@/components/reports/DwellTimeBars'
import DwellTimeVisualization from '@/components/reports/DwellTimeVisualization'
import TimeRangeToggle, { RangeMode } from '@/components/ui/TimeRangeToggle'
import RangeHint from '@/components/ui/TimeRangeHint'
import { ReportStep, ReportStepKey } from '@/types/reports'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { VehicleRow } from '@/types/vehicle'

const baseSteps: ReportStep[] = [
  { key: 'gateEntry', label: 'Gate Entry', minutes: 15, color: '#1976D2' },
  { key: 'tareWeight', label: 'Tare Weight', minutes: 9, color: '#9E9E9E' },
  { key: 'loading', label: 'Loading', minutes: 35, color: '#FF9800' },
  { key: 'postLoadingWeight', label: 'Weight after Loading', minutes: 13, color: '#FFC107' },
  { key: 'gateExit', label: 'Gate Exit', minutes: 18, color: '#4CAF50' },
]

function mapVehicleToSteps(row: VehicleRow): ReportStep[] {
  if (!row) return baseSteps
  const s = row.stages
  const getMin = (k: keyof typeof s, fallback = 0) => {
    const st = s[k]
    if (!st) return fallback
    return Math.max(0, Math.round(st.waitTime || st.stdTime || fallback))
  }

  return [
    { key: 'gateEntry', label: 'Gate Entry', minutes: getMin('gateEntry'), color: '#1976D2' },
    { key: 'tareWeight', label: 'Tare Weight', minutes: getMin('tareWeighing' as any), color: '#9E9E9E' },
    { key: 'loading', label: 'Loading', minutes: getMin('loading'), color: '#FF9800' },
    { key: 'postLoadingWeight', label: 'Weight after Loading', minutes: getMin('postLoadingWeighing' as any), color: '#FFC107' },
    { key: 'gateExit', label: 'Gate Exit', minutes: getMin('gateExit'), color: '#4CAF50' },
  ]
}

export default function TTMSReportsPage() {
  const { vehicleData } = useRealTimeData()
  // Only include vehicles whose Gate Exit stage is completed for KPIs and dropdown
  const completedVehicles = vehicleData.filter((v) => v.stages && v.stages.gateExit && v.stages.gateExit.state === 'completed')

  const hasCompleted = completedVehicles.length > 0
  const zeroSteps = baseSteps.map((s) => ({ ...s, minutes: 0 }))

  const [vehicle, setVehicle] = useState<string>('')
  const [shift, setShift] = useState<'Shift'|'Shift-A'|'Shift-B'|'Shift-C'>('Shift')
  const [active, setActive] = useState<ReportStepKey>('loading')
  const [steps, setSteps] = useState<ReportStep[]>(baseSteps)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeMode>('today')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!hasCompleted) return
    const iv = setInterval(() => {
      setSteps((prev) => prev.map((s) => ({
        ...s,
        minutes: Math.max(1, Math.round(s.minutes + (Math.random() - 0.5) * (s.key === 'loading' ? 2 : 1)))
      })))
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!hasCompleted) {
      setSteps(zeroSteps)
      return
    }
    if (!vehicle) {
      setSteps(baseSteps)
      return
    }
    const row = completedVehicles.find((r) => r.regNo === vehicle)
    if (row) setSteps(mapVehicleToSteps(row))
    else setSteps(baseSteps)
  }, [vehicle, vehicleData])

  const totals = useMemo(() => steps.reduce((t, s) => t + s.minutes, 0), [steps])

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-4 mb-4">
          <TimeRangeToggle
            mode={range}
            setMode={setRange}
            hideCompare
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          <RangeHint mode={range} customFrom={customFrom} customTo={customTo} />
        </div>

        <div className="w-full">
          <SummaryCards horizontal range={range} customFrom={customFrom} customTo={customTo} vehicleData={completedVehicles} />
        </div>

        <div className="w-full">
          <DwellTimeBars vehicleData={completedVehicles} range={range} customFrom={customFrom} customTo={customTo} />
        </div>

        <div>
          <SearchHeader value={vehicle} onVehicleChange={setVehicle} shift={shift} onShiftChange={setShift} vehicleList={completedVehicles} />
        </div>

        <div className="space-y-4">
          <ProcessTimeline steps={steps} active={active} onSelect={setActive} vehicle={hasCompleted ? vehicle : undefined} />
          <TotalTimeStackedBar steps={steps} active={active} onSelect={setActive} />
          <DwellTimeVisualization vehicle={hasCompleted ? vehicleData.find((v) => v.regNo === vehicle) : undefined} />
        </div>

      </div>
    </>
  )
}
