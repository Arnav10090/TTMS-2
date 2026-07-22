"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { KPIData } from '@/types/kpi'
import { RangeMode } from '@/components/ui/TimeRangeToggle'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function monthName(idx: number) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx]
}

export default function TrendsChart({ data, range, height = 'h-56' }: { data: KPIData; range: RangeMode; height?: string }) {
  let labels: string[] = []
  let points = 0

  const now = new Date()
  const currentHour = now.getHours() // 0-23
  const currentDay = now.getDate() // 1-31
  const currentMonth = now.getMonth() // 0-11

  if (range === 'today') {
    points = 24
    labels = Array.from({ length: points }, (_, i) => String(i))
  } else if (range === 'monthly') {
    const y = now.getFullYear()
    const m = now.getMonth()
    points = daysInMonth(y, m)
    labels = Array.from({ length: points }, (_, i) => `${m + 1}/${i + 1}`)
  } else {
    points = 12
    labels = Array.from({ length: points }, (_, i) => monthName(i))
  }

  // Get real-time values from KPI data
  const capacityValue = Math.max(0, Math.min(100, Math.round(data.capacity.utilization)))
  const ttrValue = Math.max(0, Math.round(data.turnaround.avgDay))
  const vehiclesValue = data.vehicles.inDay // Use only entry count to avoid double-counting same vehicle
  const dispatchValue = data.dispatch.today
  const dwellValue = Math.max(0, Math.round(data.dwell.avgDwellDay * 10) / 10)

  // Build data array with real-time values at the current time point
  // All points before current time are 0, current point shows actual values
  const merged = Array.from({ length: points }, (_, i) => {
    if (range === 'today') {
      if (i === currentHour) {
        return {
          x: labels[i],
          capacity: capacityValue,
          ttr: ttrValue,
          vehicles: vehiclesValue,
          dispatch: dispatchValue,
          dwell: dwellValue,
        }
      } else if (i < currentHour) {
        return {
          x: labels[i],
          capacity: 0,
          ttr: 0,
          vehicles: 0,
          dispatch: 0,
          dwell: 0,
        }
      } else {
        // Future hours - no data yet
        return {
          x: labels[i],
          capacity: null,
          ttr: null,
          vehicles: null,
          dispatch: null,
          dwell: null,
        }
      }
    } else if (range === 'monthly') {
      if ((i + 1) === currentDay) {
        return {
          x: labels[i],
          capacity: capacityValue,
          ttr: ttrValue,
          vehicles: vehiclesValue,
          dispatch: dispatchValue,
          dwell: dwellValue,
        }
      } else if ((i + 1) < currentDay) {
        return {
          x: labels[i],
          capacity: 0,
          ttr: 0,
          vehicles: 0,
          dispatch: 0,
          dwell: 0,
        }
      } else {
        return {
          x: labels[i],
          capacity: null,
          ttr: null,
          vehicles: null,
          dispatch: null,
          dwell: null,
        }
      }
    } else {
      // yearly
      if (i === currentMonth) {
        return {
          x: labels[i],
          capacity: capacityValue,
          ttr: ttrValue,
          vehicles: vehiclesValue,
          dispatch: dispatchValue,
          dwell: dwellValue,
        }
      } else if (i < currentMonth) {
        return {
          x: labels[i],
          capacity: 0,
          ttr: 0,
          vehicles: 0,
          dispatch: 0,
          dwell: 0,
        }
      } else {
        return {
          x: labels[i],
          capacity: null,
          ttr: null,
          vehicles: null,
          dispatch: null,
          dwell: null,
        }
      }
    }
  })

  return (
    <div className="card p-4 mb-6">
      <div className="text-sm font-medium text-slate-700 mb-2">Trends</div>
      <div className={`${height}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="capacity" stroke="#2563eb" dot={true} name="Capacity (%)" strokeWidth={2} connectNulls={false} />
            <Line type="monotone" dataKey="ttr" stroke="#7c3aed" dot={true} name="Avg TTR (min)" strokeWidth={2} connectNulls={false} />
            <Line type="monotone" dataKey="vehicles" stroke="#10b981" dot={true} name="Vehicles" strokeWidth={2} connectNulls={false} />
            <Line type="monotone" dataKey="dispatch" stroke="#f59e0b" dot={true} name="Dispatch" strokeWidth={2} connectNulls={false} />
            <Line type="monotone" dataKey="dwell" stroke="#3b82f6" dot={true} name="Avg Dwell (min)" strokeWidth={2} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
