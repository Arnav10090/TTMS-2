"use client"

import { useEffect, useMemo, useState } from 'react'
import { KPIData } from '@/types/kpi'
import { VehicleRow } from '@/types/vehicle'
import { ParkingData } from '@/types/dashboard'
import { dashboardService } from '@/services/dashboardService'

export function useRealTimeData() {
  const [kpiData, setKpiData] = useState<KPIData>({
    capacity: { utilization: 0, plantCapacity: 0, trucksInside: 0, trend: { direction: 'up', percentage: 0 } },
    turnaround: { avgDay: 0, avgCum: 0, lastYear: 0, trend: { direction: 'up', percentage: 0 }, performanceColor: 'blue', sparkline: [] },
    vehicles: { inDay: 0, outDay: 0, inCum: 0, outCum: 0, trend: { direction: 'up', percentage: 0 }, target: 0 },
    dispatch: { today: 0, cumMonth: 0, targetDay: 0, trend: { direction: 'up', percentage: 0 } },
  })
  const [vehicleData, setVehicleData] = useState<VehicleRow[]>([])
  const [parkingData, setParkingData] = useState<ParkingData>({ 'AREA-1': [], 'AREA-2': [] } as any)
  const [loading, setLoading] = useState(true)

  // Helpers to persist and apply parking status overrides shared across pages
  type Status = 'available'|'occupied'|'reserved'
  const OVERRIDES_KEY = 'parkingStatusOverrides'
  const readOverrides = (): Record<string, Status> => {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY)
      if (!raw) return {}
      return JSON.parse(raw) as Record<string, Status>
    } catch {
      return {}
    }
  }
  const writeOverrides = (map: Record<string, Status>) => {
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map)) } catch {}
  }
  const applyOverrides = (p: ParkingData): ParkingData => {
    const ov = readOverrides()
    const applyArea = (area: 'AREA-1'|'AREA-2') => p[area].map(row => row.map(cell => {
      const k = `${area}-${cell.label}`
      const s = ov[k]
      return s ? { ...cell, status: s } : cell
    }))
    return { 'AREA-1': applyArea('AREA-1'), 'AREA-2': applyArea('AREA-2') }
  }

  // Allocate a spot by forcing its status to 'occupied' and persisting override
  const allocateSpot = (area: 'AREA-1'|'AREA-2', label: string, vehicleNo?: string) => {
    const k = `${area}-${label}`
    const ov = { ...readOverrides(), [k]: 'reserved' as Status }
    writeOverrides(ov)

    // Persist vehicle -> parking assignment so other pages can read it
    if (vehicleNo) {
      try {
        const key = 'vehicleParkingAssignments'
        const raw = localStorage.getItem(key)
        const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
        map[vehicleNo] = { area, label }
        localStorage.setItem(key, JSON.stringify(map))
      } catch {}
    }

    // Also persist the UI color to red for parity across Dashboard and Scheduling pages
    try {
      const colorRaw = localStorage.getItem('parkingColorMap')
      const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500'|'bg-red-500'|'bg-yellow-500'> : {}
      if (colorMap[k] !== 'bg-yellow-500') {
        colorMap[k] = 'bg-yellow-500'
        localStorage.setItem('parkingColorMap', JSON.stringify(colorMap))
        window.dispatchEvent(new Event('parkingColorMap-updated'))
      }
    } catch {}
    // Update current state immediately
    setParkingData(prev => applyOverrides(prev))
  }

  useEffect(() => {
    Promise.all([
      dashboardService.getKPIData(),
      dashboardService.getVehicleRows(),
      dashboardService.getParking(),
    ]).then(([kpi, vehicles, parking]) => {
      setKpiData(kpi)
      setVehicleData(vehicles)
      setParkingData(applyOverrides(parking))
    }).finally(() => setLoading(false))

    const interval = setInterval(() => {
      setKpiData((prev) => {
        const jitter = (n: number, d=5) => Math.max(0, n + Math.round((Math.random()-0.5)*d))
        const util = Math.max(0, Math.min(100, jitter(prev.capacity.utilization, 6)))
        const avgDay = Math.max(60, jitter(prev.turnaround.avgDay, 6))
        const performanceColor = avgDay < 90 ? 'green' : avgDay < 110 ? 'yellow' : 'red'
        return {
          capacity: { ...prev.capacity, utilization: util, trend: { direction: Math.random()>0.5?'up':'down', percentage: Math.round(Math.random()*5*10)/10 } },
          turnaround: { ...prev.turnaround, avgDay, performanceColor, sparkline: [...prev.turnaround.sparkline.slice(1), { v: avgDay }] },
          vehicles: { ...prev.vehicles, inDay: jitter(prev.vehicles.inDay, 8), outDay: jitter(prev.vehicles.outDay, 8) },
          dispatch: { ...prev.dispatch, today: jitter(prev.dispatch.today, 8) },
        }
      })
      setVehicleData((rows) => rows.map((r) => ({ ...r, progress: Math.min(100, r.progress + (Math.random()>0.7? 1 : 0)) })))
      setParkingData((p) => applyOverrides({
        'AREA-1': p['AREA-1'].map((row) => row.map((cell) => Math.random()>0.95 ? ({ ...cell, status: cell.status === 'available' ? 'occupied' : 'available' }) : cell )),
        'AREA-2': p['AREA-2'].map((row) => row.map((cell) => Math.random()>0.95 ? ({ ...cell, status: cell.status === 'reserved' ? 'available' : 'reserved' }) : cell )),
      }))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return { kpiData, vehicleData, parkingData, loading, allocateSpot }
}
