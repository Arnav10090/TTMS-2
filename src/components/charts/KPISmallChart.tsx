"use client"

import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { CapacityData, TurnaroundData, VehiclesData, DispatchData } from '@/types/kpi'
import { rangeFactor } from '@/utils/range'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export default function KPISmallChart({ metric, capacity, turnaround, vehicles, dispatch, range, height } : {
  metric: 'capacity'|'ttr'|'vehicles'|'dispatch'
  capacity?: CapacityData
  turnaround?: TurnaroundData
  vehicles?: VehiclesData
  dispatch?: DispatchData
  range: RangeMode
  height?: string
}) {
  let points = 24
  const now = new Date()
  if (range === 'today') points = 24
  else if (range === 'monthly') points = daysInMonth(now.getFullYear(), now.getMonth())
  else points = 12

  const makeSeries = (base: number, variance = 0.15) => {
    return Array.from({ length: points }, (_, i) => ({
      x: i,
      v: Math.max(0, Math.round(base + (Math.sin(i / points * Math.PI * 2) * base * variance) + (Math.random() - 0.5) * base * variance)),
    }))
  }

  let data: { x: number; v: number | null; t?: number }[] = []
  if (metric === 'capacity') {
    const base = capacity ? Math.max(0, Math.min(100, Math.round(capacity.utilization))) : 0
    data = makeSeries(base, 0.06)
  } else if (metric === 'ttr') {
    const base = turnaround ? Math.max(0, Math.round(turnaround.avgDay)) : 0
    data = makeSeries(base, 0.12)
  } else if (metric === 'vehicles') {
    let total = 0
    if (range === 'today') total = vehicles ? (vehicles.inDay + vehicles.outDay) : 0
    else if (range === 'monthly') total = vehicles ? Math.max(0, Math.round(vehicles.inCum / Math.max(1, points))) : 0
    else total = vehicles ? Math.max(0, Math.round(vehicles.inCum / 12)) : 0
    const base = Math.max(0, total)
    data = makeSeries(base, 0.35)
  } else if (metric === 'dispatch') {
    const target = dispatch ? dispatch.targetDay * rangeFactor(range) : 0
    const progress = (() => {
      if (!dispatch) return 0
      if (range === 'today') return dispatch.today
      if (range === 'monthly') return dispatch.cumMonth
      return dispatch.cumMonth * 12
    })()

    // Determine how far the orange "progress" line should extend across the chart
    let ratio = 0
    if (target <= 0) {
      ratio = progress > 0 ? 1 : 0
    } else {
      ratio = Math.max(0, Math.min(1, progress / target))
    }
    const endIndex = Math.max(0, Math.min(points - 1, Math.floor(ratio * (points - 1))))

    const start = target * 0.45
    const isYearly = range === 'yearly'
    const arr: { x: number; v: number | null; t: number }[] = []
    let prev = 0
    for (let i = 0; i < points; i++) {
      const t = target
      if (i > endIndex) { arr.push({ x: i, v: null as any, t }); continue }
      const endValue = ratio >= 1 ? target : progress
      const denom = endIndex === 0 ? 1 : endIndex
      const tt = i / denom
      let base = start + (endValue - start) * tt
      if (ratio < 1) base = Math.min(base, Math.max(endValue, target * 0.98))
      // Noise: for yearly make it only positive and tiny to avoid dips
      const noise = isYearly ? base * 0.01 * Math.random() : base * 0.02 * (Math.random() - 0.5)
      let val = base + noise
      if (isYearly) {
        val = Math.max(val, prev) // enforce monotonic increase
        prev = val
      }
      arr.push({ x: i, v: Math.max(0, Math.round(val)), t })
    }
    data = arr
  }

  const tooltipContent = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    const p = payload.find((it: any) => it.dataKey === 'v') || payload[0]
    const x = p.payload.x
    const y = p.value
    const tVal = p.payload.t

    let xLabel = 'Point'
    let yLabel = 'Value'

    if (range === 'today') {
      xLabel = `Hour ${x}`
    } else if (range === 'monthly') {
      xLabel = `Day ${x + 1}`
    } else {
      xLabel = `Month ${x + 1}`
    }

    if (metric === 'capacity') yLabel = 'Utilization %'
    else if (metric === 'ttr') yLabel = 'TTR (min)'
    else if (metric === 'vehicles') yLabel = 'Vehicles'
    else if (metric === 'dispatch') yLabel = 'Dispatches'

    return (
      <div className="rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-500">{xLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-500">{yLabel}:</span>
            <span className="font-semibold text-slate-900">{y}</span>
          </div>
          {metric === 'dispatch' && (
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-500">Target:</span>
              <span className="font-semibold text-sky-600">{tVal}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${height ?? 'h-12'} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Tooltip cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} content={tooltipContent} />
          {metric === 'dispatch' && (
            <Line type="monotone" dataKey="t" stroke="#0ea5e9" dot={false} isAnimationActive={false} strokeWidth={3} />
          )}
          <Line
            type="monotone"
            dataKey="v"
            stroke={metric === 'capacity' ? '#2563eb' : metric === 'ttr' ? '#7c3aed' : metric === 'vehicles' ? '#10b981' : '#f59e0b'}
            dot={false}
            activeDot={{ r: 3 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
