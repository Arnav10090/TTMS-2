"use client"

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SearchHeader from '@/components/reports/SearchHeader'
import ProcessTimeline from '@/components/reports/ProcessTimeline'
import SummaryCards from '@/components/reports/SummaryCards'
import TotalTimeStackedBar from '@/components/reports/TotalTimeStackedBar'
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
  // map vehicle stage keys to report step keys, prefer waitTime, fallback to stdTime
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

export default function Page() {
  const { vehicleData } = useRealTimeData()

  const [vehicle, setVehicle] = useState<string>('')
  const [shift, setShift] = useState<'Day'|'Shift-A'|'Shift-B'|'Shift-C'>('Day')
  const [active, setActive] = useState<ReportStepKey>('loading')
  const [steps, setSteps] = useState<ReportStep[]>(baseSteps)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setSteps((prev) => prev.map((s) => ({
        ...s,
        minutes: Math.max(1, Math.round(s.minutes + (Math.random() - 0.5) * (s.key === 'loading' ? 2 : 1)))
      })))
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  // update steps when a vehicle is selected
  useEffect(() => {
    if (!vehicle) {
      setSteps(baseSteps)
      return
    }
    const row = vehicleData.find((r) => r.regNo === vehicle)
    if (row) setSteps(mapVehicleToSteps(row))
    else setSteps(baseSteps)
  }, [vehicle, vehicleData])

  const totals = useMemo(() => steps.reduce((t, s) => t + s.minutes, 0), [steps])

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* KPI cards row */}
        <div className="w-full">
          <SummaryCards horizontal />
        </div>

        {/* Vehicle filter */}
        <div>
          <SearchHeader value={vehicle} onVehicleChange={setVehicle} shift={shift} onShiftChange={setShift} />
        </div>

        {/* Timeline and total bar */}
        <div className="space-y-4">
          <ProcessTimeline steps={steps} active={active} onSelect={setActive} vehicle={vehicle} />
          <TotalTimeStackedBar steps={steps} active={active} onSelect={setActive} />
        </div>

      </div>
    </DashboardLayout>
  )
}
