"use client"

import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleNumberByRange } from '@/utils/range'
import { VehicleRow, StageKey } from '@/types/vehicle'
import { useMemo } from 'react'

export default function SummaryCards({ horizontal = false, range = 'today', customFrom, customTo, vehicleData = [] }: { horizontal?: boolean; range?: RangeMode; customFrom?: string; customTo?: string; vehicleData?: VehicleRow[] } = {}) {
  const grad = 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)'

  // Map stages to card order
  const stageMap: Record<number, StageKey> = {
    0: 'gateEntry',
    1: 'tareWeighing',
    2: 'loading',
    3: 'postLoadingWeighing',
    4: 'gateExit',
  }

  const baseCards = [
    { title: 'Daily Truck Count', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Gate Entry', total: 685, avg: 14.3 }, stageKey: 'gateEntry' as StageKey },
    { title: 'Tare Weight Metrics', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Tare Weight', total: 650, avg: 9.4 }, stageKey: 'tareWeighing' as StageKey },
    { title: 'Loading Metrics', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Loading', total: 1650, avg: 35 }, stageKey: 'loading' as StageKey },
    { title: 'Post-Loading Weight', primary: { label: 'No. of Trucks', value: 42 }, metric: { name: 'Weight after Loading', total: 765, avg: 18.2, unit: 'kg' }, stageKey: 'postLoadingWeighing' as StageKey },
    { title: 'Gate Exit', primary: { label: 'No. of Trucks', value: 38 }, metric: { name: 'Gate Exit', total: 930, avg: 24.5 }, stageKey: 'gateExit' as StageKey },
  ] as const

  // Calculate dwell metrics for each stage
  const calculateDwellMetrics = (stageKey: StageKey) => {
    if (vehicleData.length === 0) {
      return { totalDwellTime: 0, avgDwellTime: 0, dwellRatio: 0, stageTotal: 0 }
    }

    let totalDwell = 0
    let stageTotal = 0

    vehicleData.forEach((vehicle) => {
      const stage = vehicle.stages[stageKey]
      if (stage) {
        if (stage.idleTime !== undefined) {
          totalDwell += stage.idleTime
        }
        stageTotal += stage.waitTime || 0
      }
    })

    return {
      totalDwellTime: Math.round(totalDwell),
      avgDwellTime: vehicleData.length > 0 ? Math.round((totalDwell / vehicleData.length) * 10) / 10 : 0,
      dwellRatio: stageTotal > 0 ? (totalDwell / stageTotal) * 100 : 0,
      stageTotal: Math.round(stageTotal),
    }
  }

  const cards = baseCards.map((c) => {
    const dwellMetrics = calculateDwellMetrics(c.stageKey)
    const scaledMetricTotal = Math.round(scaleNumberByRange(dwellMetrics.stageTotal, range, undefined, customFrom, customTo))
    const scaledDwell = {
      totalDwellTime: Math.round(scaleNumberByRange(dwellMetrics.totalDwellTime, range, undefined, customFrom, customTo)),
      avgDwellTime: Math.round(scaleNumberByRange(dwellMetrics.avgDwellTime, range, undefined, customFrom, customTo) * 10) / 10,
      dwellRatio: dwellMetrics.dwellRatio, // Already in percentage form
    }
    return {
      ...c,
      primary: { ...c.primary, value: Math.round(scaleNumberByRange(c.primary.value, range, undefined, customFrom, customTo)) },
      metric: { ...c.metric, total: scaledMetricTotal, avg: Math.round(scaleNumberByRange(c.metric.avg, range, undefined, customFrom, customTo) * 10) / 10 },
      dwell: scaledDwell,
    }
  })

  if (horizontal) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="card p-6" style={{ background: grad }}>
              <div className="text-white/90 text-lg font-bold">{c.title}</div>

              <div className="text-white text-2xl font-bold mt-2">
                {c.primary.label}- <span className="font-extrabold">{c.primary.value}</span>
              </div>

              <div className="mt-4 text-white text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span>Total {c.metric.name} time</span>
                  <span className="font-semibold">{c.metric.total} {(c.metric as any).unit ?? 'min'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg {c.metric.name} time</span>
                  <span className="font-semibold">{c.metric.avg} min</span>
                </div>
                <div className="border-t border-white/30 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span>Total Dwell time</span>
                    <span className="font-semibold">{c.dwell.totalDwellTime} min</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Avg Dwell time</span>
                    <span className="font-semibold">{c.dwell.avgDwellTime} min</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Dwell Ratio</span>
                    <span className="font-semibold">{(c.dwell.dwellRatio * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      {cards.map((c) => (
        <div key={c.title} className="card p-4" style={{ background: grad }}>
          <div className="text-white/90 text-sm">{c.title}</div>

          <div className="text-white text-xl font-bold mt-2">
            {c.primary.label}- <span className="font-extrabold">{c.primary.value}</span>
          </div>

          <div className="mt-4 text-white text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span>Total {c.metric.name} time</span>
              <span className="font-semibold">{c.metric.total} {(c.metric as any).unit ?? 'min'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Avg {c.metric.name} time</span>
              <span className="font-semibold">{c.metric.avg} min</span>
            </div>
            <div className="border-t border-white/30 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span>Total Dwell time</span>
                <span className="font-semibold">{c.dwell.totalDwellTime} min</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>Avg Dwell time</span>
                <span className="font-semibold">{c.dwell.avgDwellTime} min</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>Dwell Ratio</span>
                <span className="font-semibold">{(c.dwell.dwellRatio * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
