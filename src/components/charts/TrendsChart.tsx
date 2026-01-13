"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { KPIData } from '@/types/kpi'
import { RangeMode } from '@/components/ui/TimeRangeToggle'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function monthName(idx: number) {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][idx]
}

function distributeTotal(total: number, n: number, variance = 0.25) {
  if (n <= 0) return []
  if (total <= 0) return Array.from({ length: n }, () => 0)
  // generate random weights and normalize
  const weights = Array.from({ length: n }, (_, i) => 0.5 + Math.sin((i / n) * Math.PI * 2) * variance + Math.random() * variance)
  const sum = weights.reduce((s, w) => s + w, 0)
  return weights.map((w) => Math.round((w / sum) * total))
}

export default function TrendsChart({ data, range, height = 'h-56' }: { data: KPIData; range: RangeMode; height?: string }) {
  let labels: string[] = []
  let points = 0

  const now = new Date()
  if (range === 'today') {
    points = 24
    labels = Array.from({ length: points }, (_, i) => String(i + 1))
  } else if (range === 'monthly') {
    const y = now.getFullYear()
    const m = now.getMonth()
    points = daysInMonth(y, m)
    labels = Array.from({ length: points }, (_, i) => `${m + 1}/${i + 1}`)
  } else {
    points = 12
    labels = Array.from({ length: points }, (_, i) => monthName(i))
  }

  // Build series for each KPI
  // Capacity: treat as percentage base, vary around base
  const capBase = Math.max(0, Math.min(100, Math.round(data.capacity.utilization)))
  const capacitySeries = Array.from({ length: points }, (_, i) => ({ x: labels[i], capacity: Math.max(0, Math.round(capBase + (Math.sin(i / points * Math.PI * 2) * 6) + (Math.random() - 0.5) * 4)) }))

  // Turnaround: avgDay
  const ttrBase = Math.max(0, Math.round(data.turnaround.avgDay))
  const ttrSeries = Array.from({ length: points }, (_, i) => ({ x: labels[i], ttr: Math.max(0, Math.round(ttrBase + (Math.cos(i / points * Math.PI * 2) * 6) + (Math.random() - 0.5) * 8)) }))

  // Vehicles: for today use inDay+outDay, for monthly distribute cum or daily values
  const vehiclesTotal = range === 'today' ? (data.vehicles.inDay + data.vehicles.outDay) : range === 'monthly' ? Math.max(0, Math.round((data.vehicles.inCum) / Math.max(1, 30))) : Math.max(0, Math.round((data.vehicles.inCum) / 12))
  const vehiclesVals = distributeTotal(vehiclesTotal, points)
  const vehiclesSeries = vehiclesVals.map((v, i) => ({ x: labels[i], vehicles: v }))

  // Dispatch: similar logic
  const dispatchTotal = range === 'today' ? data.dispatch.today : range === 'monthly' ? Math.max(0, Math.round((data.dispatch.cumMonth) / Math.max(1, points))) : Math.max(0, Math.round((data.dispatch.cumMonth) / 12))
  const dispatchVals = distributeTotal(dispatchTotal, points)
  const dispatchSeries = dispatchVals.map((v, i) => ({ x: labels[i], dispatch: v }))

  // Dwell: avgDwell data
  const dwellBase = Math.max(0, Math.round(data.dwell.avgDwellDay * 10) / 10)
  const dwellSeries = Array.from({ length: points }, (_, i) => ({ x: labels[i], dwell: Math.max(0, Math.round((dwellBase + (Math.sin(i / points * Math.PI * 2) * 0.8) + (Math.random() - 0.5) * 0.6) * 10) / 10) }))

  // Merge into single data array
  const merged = Array.from({ length: points }, (_, i) => ({
    x: labels[i],
    capacity: capacitySeries[i].capacity,
    ttr: ttrSeries[i].ttr,
    vehicles: vehiclesSeries[i].vehicles,
    dispatch: dispatchSeries[i].dispatch,
    dwell: dwellSeries[i].dwell,
  }))

  return (
    <div className="card p-4 mb-6">
      <div className="text-sm font-medium text-slate-700 mb-2">Trends</div>
      <div className={`${height}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="capacity" stroke="#2563eb" dot={false} name="Capacity (%)" strokeWidth={2} />
            <Line type="monotone" dataKey="ttr" stroke="#7c3aed" dot={false} name="Avg TTR (min)" strokeWidth={2} />
            <Line type="monotone" dataKey="vehicles" stroke="#10b981" dot={false} name="Vehicles" strokeWidth={2} />
            <Line type="monotone" dataKey="dispatch" stroke="#f59e0b" dot={false} name="Dispatch" strokeWidth={2} />
            <Line type="monotone" dataKey="dwell" stroke="#3b82f6" dot={false} name="Avg Dwell (min)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
